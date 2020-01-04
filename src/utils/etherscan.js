
export function getBlockExplorerAddressLink(network, address){
    const network_subdomain = network === 'mainnet'?'':`${network}.`;
    return `https://${network_subdomain}etherscan.io/address/${address}`;
}

export function getBlockExplorerTxLink(network, hash){
    const network_subdomain = network === 'mainnet'?'':`${network}.`;
    return `https://${network_subdomain}etherscan.io/tx/${hash}`;
}

