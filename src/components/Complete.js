import React from 'react';

import Button from './Button';
import SessionInfo from './SessionInfo';

export default function Complete(props){

    return (
        <section>
            <h3>ALL SET!</h3>
            <div className="mixing">
                <p>
                    Your ETH was sent succesfully!
                </p>
                <br />
                <br />

                <SessionInfo
                    depositTime={props.depositTime}
                    from={props.from}
                    pkey={props.pkey}
                    to={props.to}
                    amount={props.amount}
                    anonimity={props.anonimity}
                    txHash={props.txHash}
                    withdrawalTxHash={props.withdrawalTxHash}
                    note={props.note}
                    asset={props.asset}
                    chainId={props.chainId}
                    relayer={props.relayer}
                />
                
                <div className={'section-footer center start-again'}>
                    <Button onClick={props.startAgain}>START AGAIN</Button>
                </div>
            </div>

        </section>
    );
}