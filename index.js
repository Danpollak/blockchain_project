const { Blockchain } = require('./src/blockchain')
const { BlockData } = require('./src/blockdata')
const { toLocalIp, getPeerIps, extractPortFromIp, compileMessage, validateTransaction } = require('./utils/p2p')
const topology = require('fully-connected-topology')

const FULL_NODE_TYPE = 'FULL'
const SPV_NODE_TYPE = 'SPV'
const FULL_NODE_PORT = '4000';
const PEER_NODES = ['4001','4002','4003'];
const NODE_TYPE = process.argv[2];
let me = null, peers;

// create premade blockchain
let chain = new Blockchain()
chain.addBlock(BlockData.firstBlock);
chain.addBlock(BlockData.secondBlock);
chain.addBlock(BlockData.thirdBlock);

// create Wallet SPV data
let SPVchain = chain.createSPV()

if(NODE_TYPE === FULL_NODE_TYPE){
    me = FULL_NODE_PORT;
    peers = PEER_NODES;
} else if (NODE_TYPE === SPV_NODE_TYPE){
    me = process.argv[3]
    const index = PEER_NODES.indexOf(me);
    peers = [...PEER_NODES];
    peers.splice(index,1);
    peers.push(FULL_NODE_PORT);
}

if(!me){
    console.error("Wrong parameters")
    console.log("node index.js <FULL/SPV> <SPV PORT>")
    return
}
let sockets = {}
let varificationRequest = null;
const myIp = toLocalIp(me)
const peerIps = getPeerIps(peers)
console.log(SPVchain)
topology(myIp, peerIps).on('connection', (socket, peerIp) => {
    
    const peerPort = extractPortFromIp(peerIp)
     sockets[peerPort] = socket
    const myChain = NODE_TYPE === FULL_NODE_TYPE ? chain : SPVchain;

    if(NODE_TYPE === FULL_NODE_TYPE){
        sockets[peerPort].write(compileMessage("TEXT:FULL NODE IS ONLINE AT PORT "+ FULL_NODE_PORT,me))
    } else {
        sockets[peerPort].write(compileMessage("TEXT:SPV NODE IS ONLINE AT PORT "+ me,me))
    }

    process.stdin.on('data', data => {
        let message = compileMessage(data,me)
        let parsedMessage = JSON.parse(message);
        if(parsedMessage.type === 'ERROR'){
            console.error(parsedMessage.data)
        }
        else if(parsedMessage.type === 'TEXT'){
            socket.write(message)
        }
        else if(parsedMessage.type === 'VERIFY') {
            varificationRequest = parsedMessage.data;
            sockets[FULL_NODE_PORT].write(message)
        } else {
            console.error("Message not recognized")
        }

    })
    socket.on('data', data =>  {
        message = JSON.parse(data)
        const {sender} = message;
        if(message.type === 'ERROR'){
            console.error(message.data)
        }
        if(message.type === 'TEXT'){
            console.log(message.data.toString('utf8'))
        }
        if(message.type === 'VERIFY'){
            const messageData = message.data.split(' ');
            if(messageData.length < 2){
                sockets[sender].write(compileMessage("ERROR: INVALID VERIFICATION PARAMS",me))
                return;
            }
            console.log("starting verification process for SPV " + message.sender)
            // TODO: Add verification function
            //NOTE: i related on the fact that message.Data is an array: [block_hash, transaction_hash]
            let blockIndex = 0;
            console.log(messageData)
            while(myChain.chain[blockIndex].hash !== messageData[0]){
                console.log(myChain.chain[blockIndex])
                blockIndex++;
            }
            let proof = myChain.chain[blockIndex].root.getProof(messageData[1]);
            console.log(proof, JSON.stringify(proof))
            sockets[sender].write(compileMessage("PROOF:"+ JSON.stringify(proof), me));
        }
        if(message.type === 'PROOF'){
            console.log("Got proof!")
            const varificationData = varificationRequest.split(' ');
            // TODO: do proof verification
            //NOTE: i relate on the fact that message.Data is an array which is a merkel path
            let block = 0;
            while(myChain[block].hash !== varificationData[0]){
                block++;
            }
            console.log(varificationData)
            console.log(varificationData[1])
            let result = validateTransaction(myChain[block].root, varificationData[1], JSON.parse(message.data[0]));
            console.log("Result of proof is:"+ result);
        }
    })
})

//2) Notice that there's no exception handeling in this code (88 row for example)
// ADD exception handeling
