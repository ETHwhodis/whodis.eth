import React, { useState, useEffect } from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step1Image from '../images/step-1.png';
import Step2Image from '../images/step-2.png';
import Step3Image from '../images/step-3.png';
import ImageArrow from '../images/step-arrow.png';

import 'react-tabs/style/react-tabs.css';
import { renderShortAddress } from "../utils/address";
import PendingWithdrawal from "./PendingWithdrawal";
import {ModalContainer, ModalDialog} from 'react-modal-dialog';
import ClipLoader from "react-spinners/ClipLoader";
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

import {
    BrowserView,
    MobileView,
  } from "react-device-detect";

const { INFURA_API_KEY } = constants;



const { RELAYER_ENS } = constants;

export default function Content() {


    const { deposit, depositErc20, init, withdrawRelay, withdrawRelayErc20, withdraw, withdrawErc20} = window.tornado;

    const defaultState = {
        selectedIndex: 0,
        anonimity: 'medium',
        address: null,
        addressType: null,
        pkey: null,
        amount: null,
        note: null,
        depositTime: null,
        txHash: null,
        status: null,
        action: 'Deposit',
        injectedProviderName: null
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


    const [selectedIndex, setSelectedIndex] = useState(initialState.selectedIndex);
    const [anonimity, setAnonimity] = useState(initialState.anonimity);
    const [address, setAddress] = useState(initialState.address);
    const [addressType, setAddressType] = useState(initialState.addressType);
    const [pkey, setPkey] = useState(initialState.pkey);
    const [amount, setAmount] = useState(initialState.amount);
    const [web3, setWeb3] = useState(null);
    const [injectedProviderName, setInjectedProviderName] = useState(initialState.injectedProviderName);
    
    const [account, setAccount] = useState(initialState.account);
    const [amounts, setAmounts] = useState([]);
    
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

        const currentChain = chainId || window.ethereum && parseInt(window.ethereum.networkVersion, 10);
        console.log('GETTING RELAYER ENS', currentChain, chainId);
        if(currentChain && currentChain === 42){
            return `kovan.${RELAYER_ENS}`;
        }

        return `mainnet.${RELAYER_ENS}`;
    }


    const attemptToConnectToProvider = async (data) => {
        // Try to connect to the last known
        if(injectedProviderName){
            try{
                let provider;
                if(injectedProviderName.toLowerCase() === 'walletconnect'){
                    provider = await Web3Connect.ConnectToWalletConnect(
                        WalletConnectProvider,
                        {
                        infuraId: INFURA_API_KEY, // required
                        }
                    );

                    console.log(provider);
                } else {
                    provider = await Web3Connect.ConnectToInjected();
                }
                onWeb3Connect(provider, data);
            } catch(e){
                console.log('Couldnt connect to ', injectedProviderName, e);
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
            selectedIndex,
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
            account,
            injectedProviderName
        };

        window.localStorage.setItem('appState', JSON.stringify(appState));

    }, [
        selectedIndex,
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
        account,
        injectedProviderName
    ]);


    const onStepOneComplete = (anonimityLevel) => { 
        setAnonimity(anonimityLevel);
        setSelectedIndex(1);
    }

    const onStepTwoComplete = (address, type, pkey) => {
       setAddress(address);
       setAddressType(type);
       setPkey(pkey);
       setSelectedIndex(2);
    }
    
    const onStepThreeComplete = async (amount) => { 
        if(!amount){
            alert.error('You need to select an amount!');
            return;
        }
        setAmount(amount);
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
        } catch(e){
            setModalVisible(false);
            alert.error(e.message);

        }
    }

    const onEarlyWithdraw = async (choice, web3Instance = null) => {
        const web3InstanceToUse = web3Instance || web3;
        try{
            //if(action === 'Withdrawal') return;
            if(!web3InstanceToUse || !web3InstanceToUse.eth){
                const web3Connect = new Web3Connect.Core({
                    network: "mainnet",
                    providerOptions: {
                        walletconnect: {
                            package: WalletConnectProvider, // required
                            options: {
                                infuraId: INFURA_API_KEY // required
                            }
                        }
                    }
                });

                // subscribe to connect
                web3Connect.on("connect", (provider) => {
                    onWeb3Connect(provider, data, true, choice);
                });

                web3Connect.toggleModal();
                return;
            }

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
                    r = await withdrawRelay(note, address, relayerUrl);
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
                r = await withdrawRelay(note, address, relayerUrl);
            } else {
                r = await withdrawRelayErc20(note, asset, address, relayerUrl);
            }
           
            setWithdrawalTxHash(r.transactionHash);
            setModalVisible(false);
            setStatus('complete');
            alert.success('Withdrawal complete');

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

        const { name: providerName } = Web3Connect.getProviderInfo(provider);
        setInjectedProviderName(providerName)
    
        
        const relayerUrlFromEns = await getRelayerUrlFromEns();
        setRelayerUrl(relayerUrlFromEns);

        const accounts = await web3Instance.eth.getAccounts();
        const address = accounts[0];
        setChainId(chainId);     
        setWeb3(web3Instance);     
        setAccount(address);
        const allowedAmounts = Object.keys(data.mixers[asset.toLowerCase()][`mixerAddress`]);
        allowedAmounts.sort((a,b) => parseFloat(a) - parseFloat(b));
        setAmounts(allowedAmounts);
        if(withdrawAfterConnect){
            onEarlyWithdraw(choice, web3Instance);
        }
    };

    const onAssetChange = (asset) => {
        setAsset(asset);
        const allowedAmounts = Object.keys(data.mixers[asset.toLowerCase()][`mixerAddress`]);
        allowedAmounts.sort((a,b) => parseFloat(a) - parseFloat(b));
        setAmounts(allowedAmounts);
    }

    const onWeb3Disconnect = async () => {
        if (web3 && web3.currentProvider && web3.currentProvider.close) {
          await web3.currentProvider.close();
        }
        setWeb3(null);     
        setAccount(null);
        setAccount(null);
        setInjectedProviderName(null);
    };

    const onSelect = (index) => setSelectedIndex(index);


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

    const renderIntro = () => selectedIndex === 0 && (
        <div className={'intro'}>
            <h3>THE PROBLEM</h3>
            <p>
                Currently there are large privacy problems in the ethereum ecosystem. The default behavior is to do everything through a single account, which allows all of a user’s activities to be publicly linked to each other. It seems like this can be improved by using multiple addresses, but not really: the transactions you make to send ETH to those addresses themselves reveal the link between them.
            </p>
            
            <p>This greatly hinders adoption of many applications...</p>
          
            <p className={'signature'}>- Vitalik Buterin</p>

            <p className={'solution'}><b>whodis.eth</b> is a privacy solution using zkSNARKs built on top of <a href="https://github.com/tornadocash/tornado-core" rel="noopener noreferrer" target="_blank">Tornado Core</a>  for <b>ETH</b>
            </p>
           
        </div>
    );


    const renderWizard = () => !note && (<Tabs 
        selectedIndex={selectedIndex}
        selectedTabClassName="selected-tab"
        onSelect={onSelect}
    >
        <TabList>
            <Tab >
                <img alt="step 1" src={Step1Image} />
                { selectedIndex === 0 && <img alt="arrow" className="step-arrow step-1" src={ImageArrow}/> }
            </Tab>
            <Tab >
                <img alt="step 2" src={Step2Image} />
                { selectedIndex === 1 && <img alt="arrow" className="step-arrow step-2" src={ImageArrow}/> }
            </Tab>
            <Tab >
                <img alt="step 3" src={Step3Image} />
                { selectedIndex === 2 && <img alt="arrow" className="step-arrow step-3" src={ImageArrow}/> }
            </Tab>
        </TabList>

        <TabPanel>
            <Step1 onComplete={onStepOneComplete} />
        </TabPanel>
        <TabPanel>
            <Step2 onComplete={onStepTwoComplete} />
        </TabPanel>
        <TabPanel>
            <Step3 
                onAssetChange={onAssetChange}
                onComplete={onStepThreeComplete}
                onWeb3Connect={(provider) => onWeb3Connect(provider, data)}
                web3={web3}
                amounts={amounts}
                asset={asset}
                data={data}
                chainId={chainId}
            />
        </TabPanel>
    </Tabs>
    );

    const renderPending = () =>  { 
        if(note && status !== 'complete'){
            
            if(!web3 || !web3.eth){
                return renderLoader();
            }

            return  (
                <PendingWithdrawal 
                    from={account}
                    to={address}
                    addressType={addressType}
                    amount={amount}
                    anonimity={anonimity}
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
            )
        }
        return null;
    }


    const renderComplete = () =>  ( status === 'complete' && 
        <Complete 
            from={account}
            to={address}
            addressType={addressType}
            amount={amount}
            anonimity={anonimity}
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
    
    const renderRelayerError = () => (
        <div className={'loading-wrapper'}>
            <h2>Our relayer is having issues. <br />
                Please try again later...
            </h2>
        </div>
    )

    const renderLoader = () =>  (
            <div className={'loading-wrapper'}>
                <ClipLoader
                    size={50}
                    color={"#3FC7FA"}
                />
            </div>
    );   
    

    const renderLinks = () => (
        <div className={'links'}>
            <a href={constants.LINKS.ABOUT} target='_blank' rel="noopener noreferrer">About</a>
            {` | `}
            <a href={constants.LINKS.GITHUB} target='_blank' rel="noopener noreferrer">Github</a>
            {` | `}
            <a href={constants.LINKS.TWITTER} target='_blank' rel="noopener noreferrer">Twitter</a>
        </div>
    )

    const renderWarning = () => (
        <div className="warning-wrapper">
            <div className="warning-text">
                <span role="img" aria-label="warning">⚠️</span> This project is in beta.  Use at your own risk.<br />
                By using this website you agree to these  <a className={'terms-link'} href={constants.LINKS.TERMS} target='_blank' rel="noopener noreferrer">Terms</a>
            </div>
        </div>
    );

    const renderContent = () => (
        <React.Fragment>
            <BrowserView>{ renderAddressIfAvailable() }</BrowserView>
            { renderIntro() }
            <MobileView>{ renderAddressIfAvailable() }</MobileView>
            { renderWizard() }
            { renderPending() }
            { renderModal() }
            { renderComplete() }
            <MobileView>
                { renderLinks() }
                { renderWarning() }
            </MobileView>
        </React.Fragment>
    );
    
    return (
        <React.Fragment>
            <Hero>
                <BrowserView>
                    { renderWarning() }
                    { renderLinks() }
                </BrowserView>
            </Hero>
            <div className="form-content">
                { data ? renderContent() : relayerError ? renderRelayerError() : renderLoader() }
            </div>
        </React.Fragment>
    );
}