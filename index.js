const { Blockchain } = require('./src/blockchain')
const { BlockData } = require('./src/blockdata')
const { toLocalIp, getPeerIps, extractPortFromIp, compileMessage } = require('./utils/p2p')
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
const myIp = toLocalIp(me)
const peerIps = getPeerIps(peers)
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
        }
        if(message.type === 'PROOF'){
            // TODO: do proof verification
        }
    })
})



