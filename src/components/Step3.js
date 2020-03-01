import React, {useState} from 'react';
import { ethers } from 'ethers';
import copy from 'copy-to-clipboard';
import { useAlert } from 'react-alert'

import { renderShortAddress } from '../utils/address';

export default function Step3(props){

    const alert = useAlert();
    const [wallet, setWallet] = useState(props.wallet || null);

   
    
    const handleRadios = (e) => {
        props.onSelectedOption(e.target.value);
        if(e.target.value === 'new'){
            const randomWallet = ethers.Wallet.createRandom();
            setWallet(randomWallet);
            props.onWalletCreation(randomWallet);
        }
    }

    const handleUpdate = (e) => {
        props.onExistingWalletUpdate(e.target.value);
    }

    const copyPrivateKey = () => {
        copy(wallet.privateKey);
        alert.success("Copied!");
    }

    return (
        <section>
            <h3>3 - WHERE DO YOU WANT TO RECEIVE YOUR ETH</h3>
            <div className={'receive-options-wrapper'}>
                <input
                    type="radio"
                    name="choice"
                    value="new"
                    id="choice-new"
                    onClick={handleRadios} 
                    checked={props.selectedOption === "new" && wallet}
                    onChange={handleRadios}
                />&nbsp; <label htmlFor="choice-new">GENERATE A NEW WALLET FOR ME</label>
                <br /><br />
                <input
                    type="radio"
                    name="choice"
                    id="choice-existing"
                    value="existing"
                    checked={props.selectedOption === "existing"}
                    onChange={handleRadios}
                />&nbsp; <label htmlFor="choice-existing">SEND IT TO AN EXISTING WALLET</label>
                <br /><br />

                { props.selectedOption === 'existing' && 
                    (<div id='existing-wallet'>
                        <input
                            type="text"
                            placeholder="Enter the address to receive your ETH"
                            name="existing_wallet"
                            value={props.existingWallet || ''}
                            onChange={handleUpdate}
                        />
                    </div>) 
                }
                { props.selectedOption === 'new' && wallet &&
                    (<div id='new-wallet'>
                        Your ETH will be sent to: <br />
                        <span id="new-wallet-address">{ renderShortAddress(wallet.address) }</span><br />
                        <button onClick={copyPrivateKey} >Copy Private Key</button>
                    </div>)
                }
            </div>           
        </section>
    )
}