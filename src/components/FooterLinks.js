import React from 'react';
import constants from "../utils/constants";

const FooterLinks = () =>  (
    <div className={'links'}>
        <a href={constants.LINKS.WHITEPAPER} target='_blank' rel="noopener noreferrer">Whitepaper</a>
        {` | `}
        <a href={constants.LINKS.ROADMAP} target='_blank' rel="noopener noreferrer">Roadmap</a>
        {` | `}
        <a href={constants.LINKS.GITHUB} target='_blank' rel="noopener noreferrer">Github</a>
        {` | `}
        <a href={constants.LINKS.TWITTER} target='_blank' rel="noopener noreferrer">Twitter</a>
    </div>
)

export default FooterLinks;
