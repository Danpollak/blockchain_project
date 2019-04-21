const hashFn = (val) => val;

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
            tree[index] = hashFn(transactions[transactionIndex]);
            index++;
            transactionIndex++;
        }
        // regress through the tree and hash nodes till root
        index = tree.length/2 -1;
        let iterator = Math.floor(index /2);
        while (index !== 0){
            while(iterator < index){
                tree[iterator] = hashFn(tree[iterator*2+1] + tree[iterator*2+2])
                iterator++;
            }
            index=  Math.floor(index/2);
            iterator = Math.floor(index /2);
        }
        return tree

    }
}

const arr = [1,2,3,4,5];
let test = new MerkleTree(arr);
console.log(test.tree)