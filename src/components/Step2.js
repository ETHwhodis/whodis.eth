import React, {useState} from 'react';
import { ethers } from 'ethers';
import { useAlert } from 'react-alert'
import copy from 'copy-to-clipboard';
import Button from './Button';
import { isValidAddress } from 'ethereumjs-util';
import { renderShortAddress } from '../utils/address';

export default function Step2(props){

    const [selectedOption, setSelectedOption] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [existingWallet, setExistingWallet] = useState(null);
    const alert = useAlert();
    
    const handleRadios = (e) => {
        setSelectedOption(e.target.value);
        const randomWallet = ethers.Wallet.createRandom();
        setWallet(randomWallet);
    }

    const handleUpdate = (e) => {
        setExistingWallet(e.target.value);
    }

    const copyPrivateKey = () => {
        copy(wallet.privateKey);
        alert.success("Copied!");
    }

    

    const next = () => {
        if(selectedOption === null){
            alert.error("Please choose an option!");
            return;
        }

        const address = selectedOption === 'new' ? wallet.address : existingWallet;
        const type = selectedOption;
        const pkey = selectedOption === 'new' ? wallet.privateKey :  null;

        if(!address || !isValidAddress(address)){
            alert.error("Please enter a valid address!");
            return;
        }
        
        props.onComplete(address, type, pkey);
    }

    return (
        <section>
            <h3>WHERE DO YOU WANT TO RECEIVE YOUR ETH</h3>

            <input
                type="radio"
                name="choice"
                value="new"
                id="choice-new"
                onClick={handleRadios} 
                checked={selectedOption === "new"}
                onChange={handleRadios}
            />&nbsp; <label htmlFor="choice-new">GENERATE A NEW WALLET FOR ME</label>
            <br /><br />
            <input
                type="radio"
                name="choice"
                id="choice-existing"
                value="existing"
                checked={selectedOption === "existing"}
                onChange={handleRadios}
            />&nbsp; <label htmlFor="choice-existing">SEND IT TO AN EXISTING WALLET</label>
            <br /><br />

            { selectedOption === 'existing' && 
                (<div id='existing-wallet'>
                    <input
                        type="text"
                        placeholder="Enter the address to receive your ETH"
                        name="existing_wallet"
                        value={existingWallet || ''}
                        onChange={handleUpdate}
                    />
                </div>) 
            }
            { selectedOption === 'new' && 
                (<div id='new-wallet'>
                    Your ETH will be sent to: <br />
                    <span id="new-wallet-address">{ renderShortAddress(wallet.address) }</span><br />
                    <button onClick={copyPrivateKey} >Copy Private Key</button>
                </div>)
            }
           
            <div className={'section-footer'}>
                <Button onClick={next}>NEXT</Button>
            </div>
        </section>
    )
}