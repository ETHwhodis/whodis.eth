# WHODIS - A step towards Privacy on Ethereum

WHODIS is an Ethereum privacy solution built on top of Tornado Core (https://github.com/tornadocash/tornado-core) which allows non-custodial private transactions on Ethereum.

Features:

1) You can choose certain level of anonimity based on time, and after the deposit, the UI will show the percentage of anonimity reached based on a few variables:

- Elapsed Time
- Total time
- Number of Deposits after yours
- Anonimity Set size

2) You can choose different amounts (0.1 ETH  / 1 ETH / 10 ETH)

3) 100% on autopilot. After depositing, just keep the browser open and the withdraw request will be sent to the relayer automatically once the desired anonimity level has been reached.

4) Generate new wallets on the fly and send the withdrawals there. You'll get the private key to access the funds.



## Smart Contracts

1. Build smart contracts
`yarn build:contracts`  - this may take 10 minutes or more

2. Optionally, if you want to run it locally
`yarn ganache-cli`

3. Deploy smart contracts
`yarn migrate:dev`  
(available networks are: "dev","kovan", "rinkeby", "mainnet")

### Deploy another contract (for different amounts)

1. Open `.env`
2. Change ETH_AMOUNT and save
3. `yarn truffle migrate --network kovan --reset --f 2 --to 4`
4. For each new contract deployed, you need to add it's address and tx hash to `CONTRACTS` src/app/contants with the key being the ETH amount.

## UI

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.


## BUILDING FOR PRODUCTION

### `yarn build`

Builds the app for production to the `build-ui` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!
