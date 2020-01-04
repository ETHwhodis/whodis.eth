const constants = {
    ANONIMITY_LEVEL: {
        low: {
            hours: 6,
            deposits: 3,
            score: 132
        },
        medium: {
            hours: 12,
            deposits: 6,
            score: 408
        },
        high: {
            hours: 24,
            deposits: 12,
            score: 1392
        }
    },
    MAX_ETH_AMOUNT: 10,
    RELAYER_ENS: 'whodis.eth',
    INFURA_API_KEY: '?',
    LINKS: {
        ABOUT: 'https://hackmd.io/@whodis/about',
        TERMS: 'https://hackmd.io/@whodis/terms',
        GITHUB: 'https://github.com/ETHwhodis/whodis.eth',
        TWITTER: 'https://twitter.com/EthWhodis',
    }
};

export default constants;
