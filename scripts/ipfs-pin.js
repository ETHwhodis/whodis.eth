const fetch = require('node-fetch');
require('dotenv').config({ path: '../.env' })

module.exports = function(deployer, network, accounts) {
  return deployer.then(async () => {
    const { PINATA_API_KEY, PINATA_SECRET_API_KEY, IPFS_HASH_TO_PIN } = process.env

const hashToPin = IPFS_HASH_TO_PIN;

const run = async () => {
    try{
        const options = {
            method: 'POST',
            body: JSON.stringify({ 
                hashToPin,
                pinataMetadata: {
                    name: 'whodis website',
                }
            }),
            headers: {
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_SECRET_API_KEY,
                    'Content-Type': 'application/json'
                }
        };
        const response = await fetch('https://api.pinata.cloud/pinning/pinHashToIPFS', options)
        const json = await response.json();
        console.log("Content Pinned: ", json);
    } catch(error){
        console.log(error);
    };
}

run();