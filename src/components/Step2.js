import React from 'react';
import Button from './Button';
import constants from '../utils/constants';

const {  MAX_ETH_AMOUNT } = constants;


export default function Step2(props){
    
    const { asset, selectedAmount } = props;

    
    const selectAmount = (e) => {
        props.onAmountSet(parseFloat(e.target.value));
    }

    
    return (
        <section>
            <h3>2 - CHOOSE THE DEPOSIT AMOUNT</h3>
            <div className="info" id="deposit-container">
                <div className="info-item amount">
                    <span className="unit">Choose the amount</span>
                    <div className="buttons">
                        { props.amounts.filter( a => a <= MAX_ETH_AMOUNT).map( a => (
                            <Button
                                onClick={selectAmount}
                                selected={selectedAmount === parseFloat(a)}
                                value={a}
                                key={`btn-${a}`}
                                className={'button-big'}
                            >{a} {asset}</Button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}