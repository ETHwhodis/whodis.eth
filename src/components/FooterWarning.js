import React from 'react';
import constants from "../utils/constants";

const FooterWarning = () => (
    <div className="warning-wrapper">
        <div className="warning-text">
            <span role="img" aria-label="warning">⚠️</span> This project is in beta.  Use at your own risk.<br />
            By using this website you agree to these  <a className={'terms-link'} href={constants.LINKS.TERMS} target='_blank' rel="noopener noreferrer">Terms</a>
        </div>
    </div>
);

export default FooterWarning;
