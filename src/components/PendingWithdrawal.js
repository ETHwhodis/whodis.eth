import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'rc-progress';
import Button from './Button';
import SessionInfo from './SessionInfo';
import constants from '../utils/constants';
import useEventEmitterListener from '../hooks/useEventEmitterListener';
import { ModalContainer, ModalDialog } from 'react-modal-dialog';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import contractJson from '../build/contracts/ETHTornado.json';

const { ANONIMITY_LEVEL } = constants;


export default function PendingWithdrawal(props){
    const { asset, amount, chainId, depositTime, web3, data } = props;
    const [progress, setProgress] = useState(0);
    const [depositsSince, setDepositsSince] = useState(0);
    const [elapsed_time, setElapsedTime] = useState(0);
    const [deposits, setDeposits] = useState([]);    
    const [withdrawals, setWithdrawals] = useState([]);   
    const [depositsListener, setDepositsListener] = useState(null);   
    const [withdrawalsListener, setWithdrawalsListener] = useState(null);   
    const [showEarlyWithdrawalModal, setShowEarlyWithdrawalModal] = useState(false);   
    const [selectedIndex, setSelectedIndex] = useState(0);
    // Subscribe to subscriptions to deposit & withdrawals events
    // and clean up when necessary

    useEffect(()=> {
        if(!web3 || !web3.eth) {
            return ;
        }
        const setupListeners = async () => {
            const getTornadoContract  = async() => {
                const contractAddress = data.mixers[asset.toLowerCase()][`mixerAddress`][amount.toString()];
                const contractTxHash = data.deploymentTxs[contractAddress];
                const tx = await web3.eth.getTransaction(contractTxHash)
                const tornado = new web3.eth.Contract(contractJson.abi, contractAddress)
                tornado.deployedBlock = tx.blockNumber
                return tornado;
            }
            
            const tornado = await getTornadoContract();
            const depositsListener = tornado.events.Deposit({}, { fromBlock: tornado.deployedBlock, toBlock: 'latest' });
            setDepositsListener(depositsListener);

            const withdrawalsListener = tornado.events.Withdrawal({}, { fromBlock: tornado.deployedBlock, toBlock: 'latest' });
            setWithdrawalsListener(withdrawalsListener);

        }
        setupListeners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const onDeposit = useCallback((event) => {
        const newDeposits = [...deposits];
        newDeposits.push(event);
        setDeposits(newDeposits);
    },[setDeposits, deposits]);

    const onWithdrawal = useCallback((event) => {
        const newWithdrawals = [...withdrawals];
        newWithdrawals.push(event);
        setWithdrawals(newWithdrawals);
    },[setWithdrawals, withdrawals]);
    

    useEventEmitterListener('data', onDeposit, depositsListener);
    useEventEmitterListener('data', onWithdrawal, withdrawalsListener);
    

    useEffect(() => {
        const getElapsedTime = () => {
            if(depositTime){
                const elapsed_time_ms = Date.now() - depositTime;
                // Elapsed time in hours
                return (((elapsed_time_ms / 1000) / 60) / 60);
            }
            return 0;
        }

        const updateElapsedTime = () => {
            setTimeout(() => {
                const elapsed_time = getElapsedTime();
                setElapsedTime(elapsed_time);
            }, 5000);
        }

        updateElapsedTime();        

    },[elapsed_time, depositTime]);


    useEffect( () => {
       async function runEffect(){
            if(progress >= 100){
                await props.onWithdrawal();
                return ;
            }
            
            const getDepositsSince = async () => {
                if(!web3 || !web3.eth) {
                    return
                };
                const tx = await web3.eth.getTransaction(props.txHash)
                if(tx){
                    const depositBlockNumber = tx.blockNumber;
            
                    const depositsSince = deposits.filter((deposit) => depositBlockNumber < deposit.blockNumber);
                    return depositsSince.length;
                }
                return 0;
            }
        
            const getPercentageBasedOnScore = () => {
                const anonimitySetSize = getAnonimitySetSize();
                console.debug('Anonimity Set size', anonimitySetSize);
                if(anonimitySetSize > 0){
                    const score = getAnonimityScore();
                    console.debug('Anonimity score', score);
                    const idealScore = ANONIMITY_LEVEL[props.anonimity].score;
                    const percentage = (score * 100 / idealScore);
                    console.debug('current progress', percentage.toFixed(2));
                    return percentage.toFixed(2);
                }
                return 0; 
            }

            const getAnonimitySetSize = () => {
                console.debug('Total deposits', deposits.length);
                console.debug('Total withdrawals',  withdrawals.length);
                return deposits.length - withdrawals.length;
            }  

            const getAnonimityScore = () => {
                // selected time in hours based in chosen anonimity level
                const total_time = ANONIMITY_LEVEL[props.anonimity].hours;
                return ((elapsed_time * total_time) * 2) + (depositsSince * 20);
            }
            
            const newDepositsSince = await getDepositsSince();
            console.debug("deposits since", depositsSince);
            if(newDepositsSince !== depositsSince){
                setDepositsSince(newDepositsSince);
            }
            const newProgress = getPercentageBasedOnScore();
            
            if(progress!==newProgress){
                setProgress(newProgress);
            }
            console.debug('=========================================================')
        }
        
        runEffect();
                
    },[depositsSince, props, progress, elapsed_time, deposits, withdrawals, web3]);

    const earlyWithdraw = () => {
        if(window.confirm(`Are you sure? Your anonimity level is only ${progress}%`)){
            setShowEarlyWithdrawalModal(true);
        }
    }    


    const startEarlyWithdrawal = () => {
        setShowEarlyWithdrawalModal(false);
        props.earlyWithdraw(selectedIndex === 0 ? 'relayer': 'wallet');
    }

    const onWithdrawalOptionSelect = (index) => {
        setSelectedIndex(index);
    }

    const renderEarlyWithdrawalModal = () => (
        showEarlyWithdrawalModal &&
        <ModalContainer onClose={()=> setShowEarlyWithdrawalModal(false)}>
          {
            (<ModalDialog>
                <div className={'modal-dialog witdrawal-modal'}>
                    <h2>How do you want to withdraw your ETH?</h2>
                    <Tabs 
                        selectedIndex={selectedIndex}
                        selectedTabClassName="selected-option-withdrawal"
                        onSelect={onWithdrawalOptionSelect}
                    >
                        <TabList>
                            <Tab >
                                <span className="withdrawal-tab">Relayer</span>
                            </Tab>
                            <Tab >
                                <span className="withdrawal-tab">Wallet</span>
                            </Tab>
                        </TabList>
                        <TabPanel>
                            <p>Use the relayer service to send your transaction. It is more private and strongly recommended.</p>
                            <p>Relayer Fee: {data.relayerServiceFee}%</p>
                        </TabPanel>
                        <TabPanel>
                            <p>Use your own ethereum account to initiate a withdrawal.</p>
                            <p>It is strongly recommended to use the relayer otherwise your privacy may be compromised.</p>
                        </TabPanel>
                    </Tabs>
                    <div>
                        <Button onClick={startEarlyWithdrawal} className={'withdrawal-confirm'}>CONFIRM</Button>
                    </div>
                </div>
            </ModalDialog>)
          }
        </ModalContainer>
)


    return (
        <section>
            <h3>IN PROGRESS</h3>
            <div className="in-progress">
                <p>
                    Waiting for the anonimity set to increase.
                </p>
                <p>
                    We'll let you know when it's finished.
                </p>
                <div className={'progress-bar'}>
                    <Line
                        percent={progress.toString()}
                        strokeWidth="4"
                        trailWidth="4"
                        strokeColor={'#3FC7FA'} 
                    />
                </div>
                <h3> {progress}% </h3>
               

                <SessionInfo
                    depositTime={props.depositTime}
                    from={props.from}
                    pkey={props.pkey}
                    to={props.to}
                    amount={props.amount}
                    asset={props.asset}
                    chainId={props.chainId}
                    anonimity={props.anonimity}
                    txHash={props.txHash}
                    note={props.note}
                    relayer={{
                        fee: props.data.relayerServiceFee,
                        name: constants.RELAYER_ENS,
                        address: props.data.relayerAddress
                    }}
                />


                <p className={'withdraw-now-p'}>
                    If you're on a rush, you can <button className={'withdraw-now'} onClick={earlyWithdraw} >withdraw now</button>
                </p>
            </div>
            { renderEarlyWithdrawalModal() }
        </section>
    );
}