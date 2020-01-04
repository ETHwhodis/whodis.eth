import React, { Fragment, useState } from 'react';
import Web3Connect from "web3connect";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Button from './Button';
import constants from '../utils/constants';

const { INFURA_API_KEY, MAX_ETH_AMOUNT } = constants;


export default function Step3(props){
    
    const { asset, chainId, data } = props;
    const [selectedAmount, setSelectedAmount] = useState(null);

    if(!data || !data.mixers) return null;
    let assets = [];
    let options = [];
    if(chainId){
        assets = Object.keys(data.mixers);
        options = assets.map(a => ({ value: a.toUpperCase(), label: `${a.toUpperCase()}` }))
    }
    
    const customStyles = {
        option: (provided, state) => ({
            ...provided,
            backgroundColor: 'white',
            border: '1px solid white',
            borderRadius: 5,
            color: state.isFocused ? 'black' : 'black',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 20,
            paddingRight: 20,
        }),
        input: (provided) => ({
            ...provided,
            width: 100,
        }),
        control: (provided) => ({
            ...provided,
           backgroundColor: 'white',
           width: 150,
        }),
        singleValue: (provided, state) => {
            const opacity = state.isDisabled ? 0.5 : 1;
            const transition = 'opacity 300ms';
        
            return { ...provided, opacity, transition, backgroundColor: 'white', padding: 5 };
        }
    }

    const selectAmount = (e) => {
        setSelectedAmount(e.target.value);
    }

    const deposit = () => {
        props.onComplete(parseFloat(selectedAmount));
    }

    const onChange = (asset) => {
        setSelectedAmount(null);
        props.onAssetChange(asset.value);
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