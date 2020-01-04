const axios = require('axios')
const assert = require('assert')
const snarkjs = require('snarkjs')
const crypto = require('crypto')
const circomlib = require('circomlib')
const bigInt = snarkjs.bigInt
const merkleTree = require('./lib/MerkleTree')
const Web3 = require('web3')
const buildGroth16 = require('websnark/src/groth16')
const websnarkUtils = require('websnark/src/utils')
const { toWei, fromWei } = require('web3-utils')

let web3, tornado, erc20tornado, circuit, proving_key, groth16, erc20;
let MERKLE_TREE_HEIGHT;

/** Generate random number of specified byte length */
const rbigint = nbytes => snarkjs.bigInt.leBuff2int(crypto.randomBytes(nbytes))

/** Compute pedersen hash */
const pedersenHash = data => circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0]

/** BigNumber to hex string of specified length */
function toHex(number, length = 32) {
  let str = number instanceof Buffer ? number.toString('hex') : bigInt(number).toString(16)
  return '0x' + str.padStart(length * 2, '0')
}

/**
 * Create deposit object from secret and nullifier
 */
function createDeposit(nullifier, secret) {
  let deposit = { nullifier, secret }
  deposit.preimage = Buffer.concat([deposit.nullifier.leInt2Buff(31), deposit.secret.leInt2Buff(31)])
  deposit.commitment = pedersenHash(deposit.preimage)
  deposit.nullifierHash = pedersenHash(deposit.nullifier.leInt2Buff(31))
  return deposit
}

/**
 * Make an ETH deposit
 */
async function deposit(account, amount) {
  const deposit = createDeposit(rbigint(31), rbigint(31))

  console.log('Submitting deposit transaction')
  const result = await tornado.methods.deposit(toHex(deposit.commitment)).send({ value: amount, from: account, gas:2e6 });

  const note = toHex(deposit.preimage, 62)
  console.log('Your note:', note)
  return { note, result }
}

/**
 * Make an ERC20 deposit
 */
async function depositErc20(account, amount) {
  const deposit = createDeposit(rbigint(31), rbigint(31))

  console.log('Approving tokens for deposit')
  await erc20.methods.approve(erc20tornado._address, amount).send({ from: account, gas:1e6 })

  console.log('Submitting deposit transaction')
  const result = await erc20tornado.methods.deposit(toHex(deposit.commitment)).send({ from: account, gas:2e6 })

  const note = toHex(deposit.preimage, 62)
  console.log('Your note:', note, result);
  return { note, result }
}

/**
 * Generate merkle tree for a deposit.
 * Download deposit events from the contract, reconstructs merkle tree, finds our deposit leaf
 * in it and generates merkle proof
 * @param contract Tornado contract address
 * @param deposit Deposit object
 */
async function generateMerkleProof(contract, deposit) {
  // Get all deposit events from smart contract and assemble merkle tree from them
  console.log('Getting current state from tornado contract')
  const events = await contract.getPastEvents('Deposit', { fromBlock: contract.deployedBlock, toBlock: 'latest' })
  const leaves = events
    .sort((a, b) => a.returnValues.leafIndex - b.returnValues.leafIndex) // Sort events in chronological order
    .map(e => e.returnValues.commitment)
  const tree = new merkleTree(MERKLE_TREE_HEIGHT, leaves)

  // Find current commitment in the tree
  let depositEvent = events.find(e => e.returnValues.commitment === toHex(deposit.commitment))
  let leafIndex = depositEvent ? depositEvent.returnValues.leafIndex : -1

  // Validate that our data is correct
  const isValidRoot = await contract.methods.isKnownRoot(toHex(await tree.root())).call()
  const isSpent = await contract.methods.isSpent(toHex(deposit.nullifierHash)).call()
  assert(isValidRoot === true, 'Merkle tree is corrupted')
  assert(isSpent === false, 'The note is already spent')
  assert(leafIndex >= 0, 'The deposit is not found in the tree')

  // Compute merkle proof of our commitment
  return await tree.path(leafIndex)
}

/**
 * Generate SNARK proof for withdrawal
 * @param contract Tornado contract address
 * @param note Note string
 * @param recipient recipient
 * @param relayer Relayer address
 * @param fee Relayer fee
 * @param refund Receive ether for exchanged tokens
 */
async function generateProof(contract, note, recipient, relayer = 0, fee = 0, refund = 0) {
  // Decode hex string and restore the deposit object
  let buf = Buffer.from(note.slice(2), 'hex')
  let deposit = createDeposit(bigInt.leBuff2int(buf.slice(0, 31)), bigInt.leBuff2int(buf.slice(31, 62)))

  // Compute merkle proof of our commitment
  const { root, path_elements, path_index } = await generateMerkleProof(contract, deposit)

  // Prepare circuit input
  const input = {
    // Public snark inputs
    root: root,
    nullifierHash: deposit.nullifierHash,
    recipient: bigInt(recipient),
    relayer: bigInt(relayer),
    fee: bigInt(fee),
    refund: bigInt(refund),

    // Private snark inputs
    nullifier: deposit.nullifier,
    secret: deposit.secret,
    pathElements: path_elements,
    pathIndices: path_index,
  }

  console.log('Generating SNARK proof')
  console.time('Proof time')
  const proofData = await websnarkUtils.genWitnessAndProve(groth16, input, circuit, proving_key)
  const { proof } = websnarkUtils.toSolidityInput(proofData)
  console.timeEnd('Proof time')
  const args = [
    toHex(input.root),
    toHex(input.nullifierHash),
    toHex(input.recipient, 20),
    toHex(input.relayer, 20),
    toHex(input.fee),
    toHex(input.refund)
  ]



  return { proof, args }
}

/**
 * Do an ETH withdrawal
 * @param account Sender address
 * @param note Note to withdraw
 * @param recipient Recipient address
 */
async function withdraw(account, note, recipient) {
  const { proof, args } = await generateProof(tornado, note, recipient)

  console.log('Submitting withdraw transaction')
  const result = await tornado.methods.withdraw(proof, ...args).send({ from: account, gas: 1e6 })
  console.log('Done');
  return result;
}

/**
 * Do a ERC20 withdrawal
 * @param note Note to withdraw
 * @param recipient Recipient address
 */
async function withdrawErc20(account, note, recipient) {
  const { proof, args } = await generateProof(erc20tornado, note, recipient)

  console.log('Submitting withdraw transaction')
  const result = await erc20tornado.methods.withdraw(proof, ...args).send({ from: account, gas: 1e6 })
  console.log('Done')
  return result;
}

/**
 * Do an ETH withdrawal through relay
 * @param note Note to withdraw
 * @param recipient Recipient address
 * @param relayUrl Relay url address
 */
async function withdrawRelay(note, recipient, relayUrl) {
  const resp = await axios.get(relayUrl + '/status')
  const { relayerAddress, netId, gasPrices } = resp.data;
  const currentNetId =  await web3.eth.net.getId();
  assert(netId === currentNetId || netId === '*', 'This relay is for different network')
  console.log('Relay address: ', relayerAddress)

  const fee = bigInt(toWei(gasPrices.fast.toString(), 'gwei')).mul(bigInt(1e6))
  const { proof, args } = await generateProof(tornado, note, recipient, relayerAddress, fee)

  console.log('Sending withdraw transaction through relay')
  const resp2 = await axios.post(relayUrl + '/relay', { contract: tornado._address, proof, args })
  console.log(`Transaction submitted through relay, tx hash: ${resp2.data.txHash}`)

  let receipt = await waitForTxReceipt(resp2.data.txHash)
  console.log('Transaction mined in block', receipt.blockNumber)
  console.log('Done')
  return receipt;
}

/**
 * Do a ERC20 withdrawal through relay
 * @param note Note to withdraw
 * @param recipient Recipient address
 * @param relayUrl Relay url address
 */
async function withdrawRelayErc20(note, asset, recipient, relayUrl) {
  const resp = await axios.get(relayUrl + '/status')
  const { relayerAddress, netId, gasPrices, ethPrices } = resp.data
  const currentNetId =  await web3.eth.net.getId();
  assert(netId === currentNetId || netId === '*', 'This relay is for different network')
  console.log('Relay address: ', relayerAddress)

  const refund = bigInt(toWei('0.001'))
  const fee = bigInt(toWei(gasPrices.fast.toString(), 'gwei')).mul(bigInt(1e6)).add(refund).mul(bigInt(fromWei(ethPrices[asset.toLowerCase()].toString())))
  const { proof, args } = await generateProof(erc20tornado, note, recipient, relayerAddress, fee, refund)

  console.log('Sending withdraw transaction through relay')
  const resp2 = await axios.post(relayUrl + '/relay', { contract: erc20tornado._address, proof, args })
  console.log(`Transaction submitted through relay, tx hash: ${resp2.data.txHash}`)

  let receipt = await waitForTxReceipt(resp2.data.txHash)
  console.log('Transaction mined in block', receipt.blockNumber)
  console.log('Done')
  return receipt;
}

/**
 * Waits for transaction to be mined
 * @param txHash Hash of transaction
 * @param attempts
 * @param delay
 */
function waitForTxReceipt(txHash, attempts = 60, delay = 1000) {
  return new Promise((resolve, reject) => {
    const checkForTx = async (txHash, retryAttempt = 0) => {
      const result = await web3.eth.getTransactionReceipt(txHash)
      if (!result || !result.blockNumber) {
        if (retryAttempt <= attempts) {
          setTimeout(() => checkForTx(txHash, retryAttempt + 1), delay)
        } else {
          reject(new Error('tx was not mined'))
        }
      } else {
        resolve(result)
      }
    }
    checkForTx(txHash)
  })
}

/**
 * Init web3, contracts, and snark
 */
async function init(web3Instance, amount, chainId, asset, data) {
  let contractJson, erc20tornadoJson, erc20ContractJson;
  
  web3 = web3Instance;
  contractJson = await (await fetch('build/contracts/ETHTornado.json')).json()
  erc20tornadoJson = await (await fetch('build/contracts/ERC20Tornado.json')).json()
  erc20ContractJson = await (await fetch('build/contracts/ERC20Mock.json')).json()
  circuit = await (await fetch('build/circuits/withdraw.json')).json()
  proving_key = await (await fetch('build/circuits/withdraw_proving_key.bin')).arrayBuffer()
  MERKLE_TREE_HEIGHT = 20
  
  const contractAddress = data.mixers[asset.toLowerCase()][`mixerAddress`][amount.toString()];

  const contractInfo = {
    address: contractAddress,
    txHash: data.deploymentTxs[contractAddress]
  };

  groth16 = await buildGroth16()

  if(asset.toLowerCase() === 'eth'){

    const tx = await web3.eth.getTransaction(contractInfo.txHash)
    tornado = new web3.eth.Contract(contractJson.abi, contractInfo.address)
    tornado.deployedBlock = tx.blockNumber

  } else {
    
    const erc20Address = data.mixers[asset.toLowerCase()][`tokenAddress`]
    erc20 = new web3.eth.Contract(erc20ContractJson.abi, erc20Address)
    const tx2 = await web3.eth.getTransaction(data.deploymentTxs[erc20Address])
    erc20.deployedBlock = tx2.blockNumber

    const tx3 = await web3.eth.getTransaction(contractInfo.txHash)
    erc20tornado = new web3.eth.Contract(erc20tornadoJson.abi, contractInfo.address)
    erc20tornado.deployedBlock = tx3.blockNumber

  }

  console.log('Tornado core initialized')

}

window.tornado =  {
  init,
  deposit,
  depositErc20,
  withdraw,
  withdrawErc20,
  withdrawRelay,
  withdrawRelayErc20,
}