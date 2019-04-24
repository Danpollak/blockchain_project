const CryptoJS = require("crypto-js")
const SHA256 = require("crypto-js/sha256");

const hashFn = (value) => {
    return SHA256(JSON.stringify(value)).toString(CryptoJS.enc.Hex)
}
// Debugging identity hash function
// const hashFn = (value) => value;

class MerkleTree {
    constructor(transactions) {
        this.tree = this.buildTree(transactions)
    }

    buildTree(transactions) {
        // compute the tree height
        let height = Math.ceil(Math.log2(transactions.length)) + 1;
        // Init a array with enough space for all the leafs and nodes
        let tree = Array(Math.pow(2,height));
        tree.fill(0);
        let index = tree.length/2 -1;
        // move all the transactions into the tree and hash them
        let transactionIndex = 0;
        while (transactions[transactionIndex]){
            let transaction = Array(2);
            transaction[0] = hashFn(transactions[transactionIndex]);
            transaction[1] = transactions[transactionIndex];
            tree[index] = transaction;
            index++;
            transactionIndex++;
        }
        // regress through the tree and hash nodes till root
        index = tree.length/2 -1;
        let iterator = Math.floor(index /2);
        while (index !== 0){
            while(iterator < index){
                //only for leaves parent nodes
                if(iterator > Math.floor((tree.length/2 -1) / 2)){
                    tree[iterator] = hashFn(tree[iterator*2+1][0] + tree[iterator*2+2][0])
                    iterator++;
                } else {
                    tree[iterator] = hashFn(tree[iterator*2+1] + tree[iterator*2+2])
                    iterator++;
                }
            }
            index=  Math.floor(index/2);
            iterator = Math.floor(index /2);
        }
        return tree
    }

    // NOTE: this function should be activated on a specific 
    // merkel tree in a specific block (within a full node)
    getProof(transactionHash) {
        // convert transaction index to tree index
        let transectionIndex = this.tree.length/2 -1;
        while(transactionHash != this.tree[transectionIndex][0]){
            transectionIndex++;
            console.log("in first while")
        }
        let treeIndex = transectionIndex;
        let proof = [];
        if (treeIndex % 2 == 1) {
            if(this.tree[treeIndex+1] == 0){
                proof.push(['right', 0])
            treeIndex = Math.floor(treeIndex /2)
            } else {
                console.log(this.tree, treeIndex)
                console.log(this.tree[treeIndex+1])
                proof.push(['right',this.tree[treeIndex+1][0]])
                treeIndex = Math.floor(treeIndex /2)
            }
        } else {
            proof.push(['left',this.tree[treeIndex-1][0]])
            treeIndex = Math.floor(treeIndex /2) -1
        }
        while (treeIndex != 0){
            // take the parent hash and push it to proof till arriving to root
            if (treeIndex % 2 == 1) {
                proof.push(['right',this.tree[treeIndex+1]])
                treeIndex = Math.floor(treeIndex /2)
            } else {
                proof.push(['left',this.tree[treeIndex-1]])
                treeIndex = Math.floor(treeIndex /2) -1
            }
            console.log("in second while")
        }
        return proof;
    }

    getRoot() {
        return this.tree[0];
    }
}

// const arr = [1,2,3,4,5];
// let test = new MerkleTree(arr);
// console.log(test.tree)
// let testProof = test.getProof(2)
// console.log(test.getRoot());
// console.log(testProof)
// console.log(hashFn(hashFn(3) + testProof[0][1]))
// console.log(validateTransaction(test.tree[0],arr[2],testProof))

module.exports.hashFn = hashFn;
module.exports.MerkleTree = MerkleTree;
