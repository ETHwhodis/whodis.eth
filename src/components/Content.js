import React, { useState, useEffect } from "react";
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';

import 'react-tabs/style/react-tabs.css';
import { renderShortAddress } from "../utils/address";
import PendingWithdrawal from "./PendingWithdrawal";
import {ModalContainer, ModalDialog} from 'react-modal-dialog';
import { useAlert } from 'react-alert'
import Complete from "./Complete";
import constants from '../utils/constants';
import Web3 from "web3";
import Hero from './Hero';
import Web3Connect from "web3connect";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Axios from "axios";
import ENS from "ethereum-ens";
import ENSPublicResolverAbi from "../abi/ENSPublicResolverAbi";
import ClipLoader from "react-spinners/ClipLoader";
import { isValidAddress } from 'ethereumjs-util';


import {
    BrowserView,
    MobileView,
  } from "react-device-detect";
import Button from "./Button";
import FooterLinks from "./FooterLinks";
import FooterWarning from "./FooterWarning";
import Features from "./Features";
import Problem from "./Problem";
import Loader from "./Loader";
import RelayerError from "./RelayerError";

const { INFURA_API_KEY } = constants;



const { RELAYER_ENS } = constants;

export default function Content() {


    const { deposit, depositErc20, init, withdrawRelay, withdrawRelayErc20, withdraw, withdrawErc20} = window.tornado;

    const defaultState = {
        anonimity: { value: 'medium', label: 'Medium ~ 12 hours' },
        address: null,
        addressType: null,
        pkey: null,
        amount: null,
        note: null,
        depositTime: null,
        txHash: null,
        status: null,
        action: 'Deposit',
    }

    const alert = useAlert();

    const getInitialState = () => {
        const appState = window.localStorage.getItem('appState');
        if(appState){
            return JSON.parse(appState);
        }
    }

    const initialState = {
        ...defaultState,
        ...getInitialState()
    }

    const scrollToContent = (e) => {
        const element = document.querySelector(".steps");
        element.scrollIntoView();
    }

    const [anonimity, setAnonimity] = useState(initialState.anonimity);
    const [address, setAddress] = useState(initialState.address);
    const [addressType, setAddressType] = useState(initialState.addressType);
    const [pkey, setPkey] = useState(initialState.pkey);
    const [amount, setAmount] = useState(initialState.amount);
    const [web3, setWeb3] = useState(null);
    
    const [account, setAccount] = useState(initialState.account);
    const [amounts, setAmounts] = useState([]);
    const [readyToSubmit, setReadyToSubmit] = useState(false);
    
    const [note, setNote] = useState(initialState.note);
    const [modalVisible, setModalVisible] = useState(false);
    const [action, setAction] = useState(initialState.action);
    const [depositTime, setDepositTime] = useState(initialState.depositTime);
    const [txHash, setTxHash] = useState(initialState.txHash);
    const [withdrawalTxHash, setWithdrawalTxHash] = useState(initialState.withdrawalTxHash);
    const [status, setStatus] = useState(initialState.status);
    const [coreReady, setCoreReady] = useState(false);  
    const [chainId, setChainId] = useState(null);  
    const [asset, setAsset] = useState('ETH');  
    const [data, setData] = useState(null)
    const [relayerError, setRelayerError] = useState(null)
    const [relayerUrl, setRelayerUrl] = useState(null);



    const getRelayerENS = () => {

        const currentChain = chainId || (window.ethereum && parseInt(window.ethereum.networkVersion, 10));
        if(currentChain && currentChain === 42){
            return `kovan.${RELAYER_ENS}`;
        }

        return `mainnet.${RELAYER_ENS}`;
    }


    const attemptToConnectToProvider = async (data) => {
        const web3Connect = new Web3Connect.Core({ cacheProvider: true });
        // Try to connect to the last known
        if (web3Connect.cachedProvider) {
            try{
                const provider = await web3Connect.connect();
                await onWeb3Connect(provider, data);
                setTimeout(() => { scrollToContent() }, 1000);
            } catch(e){
                console.log('Couldnt connect to cached provider', e);
            }
        }
    }

    const getRelayerUrlFromEns = async () => {
        const provider = new Web3.providers.HttpProvider(`https://mainnet.infura.io/v3/${constants.INFURA_API_KEY}`);
        const ens = new ENS(provider);
        const relayerUrlFromEns = await ens.resolver(getRelayerENS(), ENSPublicResolverAbi).text('url');
        return relayerUrlFromEns;
        
    }
    
    useEffect( () => {
        const init = async () => {

            // 1 - Resolve relayer address
            const relayerUrlFromEns = await getRelayerUrlFromEns();
            setRelayerUrl(relayerUrlFromEns);


            // 2 - Get relayer status
            try {
                const result = await Axios(
                    `${relayerUrlFromEns}/status`,
                );
                setData(result.data);

                const allowedAmounts = Object.keys(result.data.mixers[asset.toLowerCase()][`mixerAddress`]);
                allowedAmounts.sort((a,b) => parseFloat(a) - parseFloat(b));
                setAmounts(allowedAmounts);
                
                // 3 - Connect to ethereum provider
                attemptToConnectToProvider(result.data);
                

            } catch(e){
                setRelayerError(true);
            }
        };

        init();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    useEffect( () => {
        const appState = {
            anonimity,
            address,
            addressType,
            pkey,
            amount,
            note,
            depositTime,
            txHash,
            status,
            action,
            withdrawalTxHash,
            account
        };

        window.localStorage.setItem('appState', JSON.stringify(appState));

    }, [
        anonimity,
        address,
        addressType,
        pkey,
        amount,
        note,
        depositTime,
        txHash,
        status,
        action,
        withdrawalTxHash,
        account
    ]);


    const onStepOneComplete = (selectedOption) => { 
        setAnonimity(selectedOption);
    }

    const onStepTwoComplete = (amount) => { 
        setAmount(amount);
    }

    const onSelectedOption = (option) => {
        setAddressType(option)
        setAddress('');
    }
    const onWalletCreation = (wallet) => {
        const { address , privateKey} = wallet;
        setAddress(address);
        setPkey(privateKey);
    }
    const onExistingWalletUpdate = (address) => {
        setAddress(address);
    }

    const validateForm = () => {
        if(!amount){
            alert.error('You need to select an amount!');
            return;
        }

        if(!address){
            alert.error('You need to select where to receive your ETH!');
            return;
        }

        
        if(!address || !isValidAddress(address)){
            alert.error("Please enter a valid address!");
            return;
        }
        if(addressType === 'new'){
            const backedup = window.confirm('Please confirm you back up your private key!');
            if(!backedup) return false;
        } 

        return true;
    }

    
    const onSubmit = async () => {  
        
        if(!validateForm()) return;

        if(!web3){
            try {
                const web3Connect = new Web3Connect.Core({
                    cacheProvider: true, 
                    providerOptions: {
                        walletconnect: {
                            package: WalletConnectProvider,
                            options: {
                                infuraId: INFURA_API_KEY
                            }
                        }
                    }
                });
                
                const provider = await web3Connect.connect();
                
                await onWeb3Connect(provider);

                const web3Instance =  new Web3(provider, null, { transactionConfirmationBlocks: 1 });
                
                const accounts = await web3Instance.eth.getAccounts();
                const account = accounts[0];
                
                if(!web3Instance || !account){
                    alert.error('You need to connect your wallet!');
                    return;
                }
            } catch(e){
                alert.error(e.message);
            }
           
        }
        
        setReadyToSubmit(true);

       
    }
    
    useEffect(()=> {
        const submit = async () => {
            setReadyToSubmit(false);
            setModalVisible(true);
            setAction('Deposit');
            try{
                await init(web3, amount, chainId, asset, data);
                setCoreReady(true);
                let depositResult;
                if(asset.toLowerCase() === 'eth'){
                    depositResult = await deposit(account, web3.utils.toWei(amount.toString()));
                } else {
                    depositResult = await depositErc20(account, web3.utils.toWei(amount.toString()));
                }
                const { note, result } = depositResult;
                console.log('DEPOSIT COMPLETE:', note, result);
                setDepositTime(Date.now());
                setNote(note);
                setTxHash(result.transactionHash);
                console.log(note, depositTime);
                setModalVisible(false);
                setTimeout(() => { scrollToContent() }, 1000);
            } catch(e){
                setModalVisible(false);
                alert.error(e.message);
    
            }
        }
        if(readyToSubmit){
            console.log('submitting!');
            submit();
        }
        
    },[readyToSubmit, init, web3, amount, chainId, asset, data, depositTime, deposit, account, depositErc20, alert]);
     

    const onEarlyWithdraw = async (choice, web3Instance = null) => {
        const web3InstanceToUse = web3Instance || web3;
        try{
            
            alert.success('Withdrawal initiated');
            setAction('Withdrawal');
            setModalVisible(true);
            if( !coreReady ){
                const chainId = await web3InstanceToUse.eth.chainId();
                await init(web3, amount, chainId, asset, data);
                setCoreReady(true);
            }
            let r;
            if(choice === 'relayer') {
                if(asset.toLowerCase() === 'eth'){
                    r = await withdrawRelay(amount, note, address, relayerUrl);
                } else {
                    r = await withdrawRelayErc20(note, asset, address, relayerUrl)
                }
            } else {
                const accounts = await web3InstanceToUse.eth.getAccounts();
                const account = accounts[0];
                if(asset.toLowerCase() === 'eth'){
                    r = await withdraw(account, note, address);
                } else {
                    r = await withdrawErc20(account, note, address);
                }
            }
            setWithdrawalTxHash(r.transactionHash);
            setModalVisible(false);
            setStatus('complete');
            alert.success('Withdrawal complete');
            setTimeout(() => { scrollToContent() }, 1000);
            
        } catch(e){
            console.error(e);
            setAction('Deposit');
            setModalVisible(false);
            alert.error(e.message);
        }
    }

    const onWithdrawal = async () => {
        try{
            
            if(action === 'Withdrawal') return;
            
            setAction('Withdrawal');
            setModalVisible(true);
            
            if( !coreReady ){
                await init(web3, amount, chainId, asset, data);
                setCoreReady(true);
            }

            let r;
            if(asset.toLowerCase() === 'eth'){
                r = await withdrawRelay(amount, note, address, relayerUrl);
            } else {
                r = await withdrawRelayErc20(note, asset, address, relayerUrl);
            }
           
            setWithdrawalTxHash(r.transactionHash);
            setModalVisible(false);
            setStatus('complete');
            alert.success('Withdrawal complete');
            setTimeout(() => { scrollToContent() }, 1000);

        } catch(e){
            
            setAction('Deposit');
            setModalVisible(false);
            alert.error(e.message);

        }
    }

    const onWeb3Connect = async (provider, data, withdrawAfterConnect = false, choice = null) => {
        const web3Instance =  new Web3(provider, null, { transactionConfirmationBlocks: 1 });

        // Validate correct network
        web3Instance.eth.extend({
            methods: [
                {
                name: "chainId",
                call: "eth_chainId",
                outputFormatter: web3Instance.utils.hexToNumber
                }
            ]
        });

        const chainId = await web3Instance.eth.chainId();
        if(chainId !==1 && chainId !== 42  && chainId !== 1337){
            alert.error("Unsupported Network. Please switch to Mainnet or Kovan");
            return;
        }    
        
        const relayerUrlFromEns = await getRelayerUrlFromEns();
        setRelayerUrl(relayerUrlFromEns);

        const accounts = await web3Instance.eth.getAccounts();
        const address = accounts[0];
        setChainId(chainId);     
        setWeb3(web3Instance);     
        setAccount(address);
        
        if(withdrawAfterConnect){
            onEarlyWithdraw(choice, web3Instance);
        }

        return web3;
    };

    // const onAssetChange = (asset) => {
    //     setAsset(asset);
    //     const allowedAmounts = Object.keys(data.mixers[asset.toLowerCase()][`mixerAddress`]);
    //     allowedAmounts.sort((a,b) => parseFloat(a) - parseFloat(b));
    //     setAmounts(allowedAmounts);
    // }

    const onWeb3Disconnect = async () => {
        if (web3 && web3.currentProvider && web3.currentProvider.close) {
          await web3.currentProvider.close();
        }

        const web3Connect = new Web3Connect.Core();
        web3Connect.clearCachedProvider();

        setWeb3(null);     
        setAccount(null);
        setAccount(null);
    };


    const onStartAgain = () => {
        window.localStorage.removeItem('appState');
        window.location.reload();
    }

    const renderAddressIfAvailable = () => (
        web3 && web3.eth && (
            <div className="connected-account">
                Connected to <b>{ (chainId === 1 ? 'mainnet' : 'kovan').toUpperCase() }</b> with:
                <div id='address'>
                    <span className={`chainId-${chainId}`}/> {renderShortAddress(account)}
                </div>
                <button 
                    id='disconnect'
                    onClick={onWeb3Disconnect}
                >
                    Disconnect
                </button>
            </div>
        )
    );

    const renderIntro = () =>  (
        <div className={'intro'}>
            <p className={'solution'}><b>whodis.eth</b> is a privacy solution using zkSNARKs built on top of <a href="https://github.com/tornadocash/tornado-core" rel="noopener noreferrer" target="_blank">Tornado Core</a>  for <b>ETH</b></p>
        </div>
    );


    const renderSeparator = () => (
        <div className={'separator-info'} />
    );

    const renderProblem = () => (
        <Problem />
    );

    const renderFeatures = () => (<Features relayerServiceFee={data.relayerServiceFee} />);

    

    const renderWizard = () => !note && (
            <div className="steps">
                <Step1 
                    onComplete={onStepOneComplete} 
                    selectedLevel={anonimity}
                />
                <Step2 
                    amounts={amounts}
                    asset={asset}
                    onAmountSet={onStepTwoComplete}
                    selectedAmount={amount}
                />
                <Step3 
                    onSelectedOption={onSelectedOption}
                    onWalletCreation={onWalletCreation}
                    onExistingWalletUpdate={onExistingWalletUpdate}
                    existingWallet={addressType ==='existing' && address}
                    selectedOption={addressType}
                    wallet={address && pkey && {address: address, privateKey: pkey}}
                />
                    <div className="real-button-container">
                        <Button
                            className={'button-big real-button'}
                            onClick={onSubmit}
                        >
                            DEPOSIT
                        </Button>
                    </div>
                <div className={'fee'}>
                    Relayer Fee: <b>{data.relayerServiceFee}%</b>
                </div>
            </div>
    );

    const renderPending = () =>  { 
        if(note && status !== 'complete'){
            
            if(!web3 || !web3.eth){
                return <Loader />;
            }

            return  (
                <div className="steps">
                    <PendingWithdrawal 
                        from={account}
                        to={address}
                        addressType={addressType}
                        amount={amount}
                        anonimity={anonimity.value}
                        note={note}
                        depositTime={depositTime}
                        txHash={txHash}
                        onWithdrawal={onWithdrawal}
                        pkey={pkey}
                        earlyWithdraw={onEarlyWithdraw}
                        asset={asset}
                        web3={web3}
                        chainId={chainId}
                        data={data}
                    />
                </div>
            )
        }
        return null;
    }


    const renderComplete = () =>  ( status === 'complete' && 
        <div className="steps">
            <Complete 
                from={account}
                to={address}
                addressType={addressType}
                amount={amount}
                anonimity={anonimity.value}
                note={note}
                depositTime={depositTime}
                txHash={txHash}
                startAgain={onStartAgain}
                withdrawalTxHash={withdrawalTxHash}
                pkey={pkey}
                asset={asset}
                chainId={chainId}
                relayer={{
                    fee: data.relayerServiceFee,
                    name: constants.RELAYER_ENS,
                    address: data.relayerAddress
                }}
            />
        </div>
    );

    const renderModal = () => (
            modalVisible &&
            <ModalContainer>
              {
                (<ModalDialog>
                    <div className={'action-modal modal-dialog'}>
                        <h2>{action} in progress</h2>
                        <ClipLoader
                            size={50}
                            color={"#3FC7FA"}
                        />
                    </div>
                </ModalDialog>)
              }
            </ModalContainer>
    )
    
    const renderContent = () => (
        <React.Fragment>
            <BrowserView>{ renderAddressIfAvailable() }</BrowserView>
            { renderIntro() }
            <MobileView>{ renderAddressIfAvailable() }</MobileView>
            { renderWizard() }
            { renderPending() }
            { renderComplete() }
            { renderSeparator() }
            { !note && renderProblem() }
            { !note && renderFeatures() }
            { renderModal() }
        </React.Fragment>
    );


    return (
        <React.Fragment>
            <Hero>
                <div className={'cta-wrapper'}>
                    { !txHash && <Button onClick={scrollToContent} className={'cta'}>GET STARTED</Button> }
                </div>
            </Hero>
            <div className="form-content">
                <div className={'readable-content'}>
                    { data ? renderContent() : relayerError ? <RelayerError /> : <Loader /> }
                </div>
                <div className={'footer'}>
                    <FooterWarning />
                    <FooterLinks />
                </div>
            </div>
            
        </React.Fragment>
    );
}