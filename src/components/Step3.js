import React, { Fragment, useState } from 'react';
import Web3Connect from "web3connect";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Button from './Button';
import constants from '../utils/constants';

const { INFURA_API_KEY, MAX_ETH_AMOUNT } = constants;


export default function Step3(props){
    
    const { asset, data } = props;
    const [selectedAmount, setSelectedAmount] = useState(null);

    if(!data || !data.mixers) return null;
    
    const selectAmount = (e) => {
        setSelectedAmount(e.target.value);
    }

    const deposit = () => {
        props.onComplete(parseFloat(selectedAmount));
    }


    
    return (
        <section>
            <h3>DEPOSIT</h3>
           
            {  !props.web3 &&  (
                 <div className="info" id="connect-container">
                <div className="info-item">
                    <p>You need to connect your web3 wallet first</p>
                    <Web3Connect.Button
                        className={'button'}
                        network="mainnet" // optional
                        providerOptions={{
                            walletconnect: {
                                package: WalletConnectProvider, // required
                                options: {
                                    infuraId: INFURA_API_KEY // required
                                }
                            }
                        }}
                        onConnect={async (provider) => props.onWeb3Connect(provider)}
                    />
                </div>
                </div>
            )}

            {
                props.web3 && <Fragment>
                    <div className="info" id="deposit-container">
                        <div className="info-item amount">
                            <span className="unit">Choose the amount</span>
                            <div className="buttons">
                                { props.amounts.filter( a => a <= MAX_ETH_AMOUNT).map( a => (
                                    <Button
                                        onClick={selectAmount}
                                        selected={selectedAmount === a}
                                        value={a}
                                        key={`btn-${a}`}
                                    >{a} {asset}</Button>
                                ))}
                            </div>
                        </div>
                        <div className={'fee'}>
                            Relayer Fee: <b>{data.relayerServiceFee}%</b>
                        </div>
                    </div>
                    
                    <div className={'section-footer'}>
                        <Button onClick={deposit}>DEPOSIT</Button>
                    </div>
                </Fragment>

            }
           
        </section>
    )
}