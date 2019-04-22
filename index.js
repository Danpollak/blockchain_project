const {Blockchain} = require('./src/blockchain')
const {BlockData} = require('./src/blockdata')

let chain = new Blockchain()
chain.addBlock(BlockData.firstBlock);
chain.addBlock(BlockData.secondBlock);
chain.addBlock(BlockData.thirdBlock);
// console.log(chain.getLatestBlock())
console.log(chain.createSPV());
