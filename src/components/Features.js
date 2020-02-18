import React from 'react';


const Features = ({ relayerServiceFee }) => (
    <div className={'intro features'}>
        <h3>WHY USE WHODIS.ETH? </h3>
        <p>- Hosted on <a target='_blank' rel="noopener noreferrer" className={'intro-link'} href={'https://ipfs.io'}>IPFS</a></p>
        <p>- 100% of the code is Open Source and available at <a target='_blank' rel="noopener noreferrer" className={'intro-link'} href={'https://github.com/ETHWhoDis'}>Github</a></p>
        <p>- Connected to <a target='_blank' rel="noopener noreferrer" className={'intro-link'} href={'https://tornado.cash'}>Tornado.cash</a> contracts and circuit</p>
        <p>- Low Relayer Fees { relayerServiceFee ? `(${relayerServiceFee}%)`:''}</p>
        <p>- <a target='_blank' rel="noopener noreferrer" className={'intro-link'} href={'https://walletconnect.org'}>WalletConnect</a> Support</p>
        <p>- Predefined Anonymity Levels based on the anonymity set size and time</p>
        <p>- 100% Automatic (no action needed after deposit, just keep the browser open)</p>
        <p>- Ability to generate new address on the fly to receive ETH</p>
    </div>
);

export default Features;