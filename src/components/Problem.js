import React from 'react';

const Problem = () => (
    <div className={'intro'}>
        <h3>THE PROBLEM</h3>
        <p>
            Currently there are large privacy problems in the ethereum ecosystem. The default behavior is to do everything through a single account, which allows all of a user’s activities to be publicly linked to each other. It seems like this can be improved by using multiple addresses, but not really: the transactions you make to send ETH to those addresses themselves reveal the link between them.
        </p>
        
        <p>This greatly hinders adoption of many applications...</p>
        
        <p className={'signature'}>- Vitalik Buterin</p>
    </div>
);

export default Problem;