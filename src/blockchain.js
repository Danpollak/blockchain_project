const {MerkleTree} = require("./merkletree.js")
const SHA256 = require("crypto-js/sha256");


class Block {
    constructor(index, timestamp, transactions, previousHash = '') {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.root = new MerkleTree(transactions).getRoot();
        this.transactions = transactions;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return SHA256(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data)).toString();
    }

}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesis()];

    }
    createGenesis() {
        return new Block(0, "01/01/2018", "genesis block", "0");

    }
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(newBlock) {
        newBlock.previousHash = this.getLatestBlock().hash;
        newBlock.hash = newBlock.calculateHash();
        this.chain.push(newBlock);
    }
    
    createSPV() {
        let spv = this.chain.map((block) => {
            let newBlock =  Object.assign( Object.create( Object.getPrototypeOf(Block)), block)
            newBlock.transactions = null;
            return newBlock
        })
        return spv;
    }
}

module.exports.Blockchain = Blockchain;
module.exports.Block = Block;