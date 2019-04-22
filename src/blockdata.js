const {Block} = require('./blockchain')

const transactions = [
    {
        from: '1532E76DBE9D43D0DEA98C331CA5AE8A65C5E8E8B99D3E2A42AE989356F6242A',
        to: '73CD1B16C4FB83061AD18A0B29B9643A68D4640075A466DC9E51682F84A847F5',
        amount: '0.05'
    },
    {
        from: 'C9344C5F1079F7CE9B007E604829F7E8E4516E9132E098EBD58E2CC7F2A5FD4C',
        to: '73CD1B16C4FB83061AD18A0B29B9643A68D4640075A466DC9E51682F84A847F5',
        amount: '0.1'
    },
    {
        from: '7D445240C97CB8B39B22030981D77679608F91C7A4000E41A1794CDE953A1846',
        to: '56A3ED9F826D2E56667F12199630D21A7F02448E4F9BB2643C0CFF89091D3CC6',
        amount: '0.3'
    },
    {
        from: 'C96415006F908B674800B7026505CD718DBB4111FE858DC549FDBA5A365178C6',
        to: '327A7380D2CC7CF09ED5820E1ECDB8ABE585D696B5B5526986DFEBE70ACEC59E',
        amount: '0.5'
    },
]

const firstBlock = new Block(0, "01/01/2018", transactions.slice(0,1), "0")
const secondBlock = new Block(1, "02/01/2018", transactions.slice(0,2), "0")
const thirdBlock = new Block(2, "02/01/2018", transactions.slice(0,3), "0")
const fourthBlock = new Block(2, "02/01/2018", transactions.slice(0,3), "0")

module.exports.BlockData = {firstBlock, secondBlock, thirdBlock, fourthBlock};