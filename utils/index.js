const { hashFn } = require('../src/merkletree');

function toLocalIp(port) {
    return '127.0.0.1:' + port
}

function getPeerIps(peers) {
    return peers.map(peer => toLocalIp(peer))
}

function compileMessage(message, port) {
    let messageData = message.toString().split(":");
    if(messageData.length < 2){
        return JSON.stringify({type: 'ERROR', data: 'Invalid message in the network', sender: port})
    }
    return JSON.stringify({ type: messageData[0], data: messageData[1].trim(), sender: port});
}

function extractPortFromIp(peer) {
    return peer.toString().slice(peer.length - 4, peer.length);
}

const validateTransaction = (root, transaction, proof) => {
    let result = transaction;
    while(proof.length > 0){
        let proofHash = proof.shift();
        result = proofHash[0] == 'left' ? hashFn(proofHash[1] + result) : hashFn(result + proofHash[1])
    }
    return root === result;
}

module.exports.validateTransaction = validateTransaction;
module.exports.toLocalIp = toLocalIp;
module.exports.getPeerIps = getPeerIps; 
module.exports.extractPortFromIp = extractPortFromIp;
module.exports.compileMessage = compileMessage;