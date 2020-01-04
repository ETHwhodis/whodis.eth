import React, { useState } from 'react';
import { renderShortAddress } from '../utils/address';
import moment from 'moment';
import { getBlockExplorerTxLink, getBlockExplorerAddressLink } from '../utils/etherscan';
import copy from 'copy-to-clipboard';
import { useAlert } from 'react-alert'

export default function SessionInfo(props){

    const alert = useAlert();

    const [showNote, setshowNote] = useState(false)
    const toggleNote = () => setshowNote(!showNote);

    const { depositTime, from, to, pkey, amount, anonimity, txHash, withdrawalTxHash, note, asset, chainId, relayer } = props;
    const copyToClipboard = () => {
        copy(pkey);
        alert.success("Copied!");
    }

    return (
        <ul className={'mix-info'}>
            <li>
                <span className={'info-label'}>DEPOSITED AT: </span>
                <span className={'info-value'}>{moment(depositTime).fromNow()}</span>
            </li>
            <li>
                <span className={'info-label'}>FROM: </span>
                <a target='_blank' rel="noopener noreferrer" href={getBlockExplorerAddressLink('kovan', from)} className={'info-value'}>{renderShortAddress(from)}</a>
            </li>
            <li>
                <span className={'info-label'}>TO: </span>
                <a target='_blank' rel="noopener noreferrer" href={getBlockExplorerAddressLink('kovan', to)} className={'info-value'}>{renderShortAddress(to)}</a>
            </li>
            { pkey && (
                <li>
                <span className={'info-label'}>PRIVATE KEY: </span>
                <button onClick={copyToClipboard} className={'info-pkey'}>Copy to Clipboard</button>
            </li>
            )}
            <li>
                <span className={'info-label'}>AMOUNT: </span>
                <span className={'info-value'}>{amount || 1.0} ETH</span>
            </li>
            <li>
                <span className={'info-label'}>ANONIMITY LEVEL: </span>
                <span className={'info-value uppercase'}>{anonimity || 'low'}</span>
            </li>
            <li>
                <span className={'info-label'}>DEPOSIT TX: </span>
                <a target='_blank' rel="noopener noreferrer" href={getBlockExplorerTxLink('kovan', txHash)} className={'info-value'}>{renderShortAddress(txHash)}</a>
            </li>
            {withdrawalTxHash && (
                <li>
                    <span className={'info-label'}>WITHDRAWAL TX: </span>
                    <a target='_blank' rel="noopener noreferrer" href={getBlockExplorerTxLink('kovan', withdrawalTxHash)} className={'info-value'}>{renderShortAddress(withdrawalTxHash)}</a>
                </li>
            )}
            {relayer && (
                <React.Fragment>
                    <li>
                        <span className={'info-label'}>RELAYER: </span>
                        <a target='_blank' rel="noopener noreferrer" href={getBlockExplorerAddressLink('kovan', relayer.address)} className={'info-value'}>{relayer.name}</a>
                    </li>
                    <li>
                        <span className={'info-label'}>RELAYER FEE: </span>
                        <span className={'info-value uppercase'}>{relayer.fee} %</span>
                    </li>
                </React.Fragment>
            )}
            <li>
                <span className={'info-label'}>NOTE: </span>
            </li>
            <li className="note">
                    {showNote ? `tornado-${asset.toLowerCase()}-${amount}-${chainId}-${note}` : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                    <br />
                    <br />
            </li>
            <li>
                <span className={'info-label'}></span>
                <button onClick={toggleNote} className={'info-pkey'}>{showNote ? '(Hide note)':'(Show Note)'}</button>
            </li>
        </ul>
    )
}