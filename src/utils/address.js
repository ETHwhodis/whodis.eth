import { toChecksumAddress } from "ethereumjs-util";

export function renderShortAddress(address){
    if(!address) return '';
    const checksummedAddress = toChecksumAddress(address);
    return `${checksummedAddress.substr(0,6)}...${checksummedAddress.substr(-4)}`;
}
