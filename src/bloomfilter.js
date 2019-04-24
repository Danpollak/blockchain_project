const CryptoJS = require("crypto-js")
const SHA256 = require("crypto-js/sha256");

class BloomFilter {
    constructor(addresses){
        this.bitArr = this.calcBitArray(addresses);
        // determined the size of the bit array to 200 
        // so it's optimal (0.02% max of FP) for 1 hash
        // function and maximum 4 elements incoded in it
        this.size = 200;
        this.amount = 0;
    }

    // hash the given value using SHA256,
    // return the bit array index - the result of hashing and using modulo
    getArrIndex (value) {
        return int(SHA256(value.toString()).toString(CryptoJS.enc.Hex), 16) % this.size;
    }

    //create BF bit array given the addresses to embed in it
    calcBitArray(addresses) {
        //compute the BF bit array using the hash - SHA256
        let bitArr = Array(this.size);
        // all indecies are initialied to 0
        bitArr.fill(0);
         // calculate all addresses index and update the bit array
         // in this index to be 1
         let index = 0;
         while (addresses[index]){
             bitarr[getArrIndex(addresses[index])] = 1;
             this.amount++;
             index++;
         }
        return bitArr;
    }

    query(address){
        // calculate the address index in the bit array
        // and if it's 0 the return false - which means that
        // this address was not incoded in this bit array
        // else, return true, because this index is 1 which means
        // that this address was incoded in this bit array
        if (this.bitArr[getArrIndex(address)] == 0) {
            return false;
        }
        return true;
    }
}

//
const validate  = (bitArr) => {
    let currentBlock = lastBlock;
}