const { Blockchain } = require('./src/blockchain')
const { BlockData } = require('./src/blockdata')
const { toLocalIp, getPeerIps, extractPortFromIp, compileMessage, validateTransaction } = require('./utils')
const topology = require('fully-connected-topology')

/** GLOBAL CONSTANTS */
const FULL_NODE_TYPE = 'FULL'
const SPV_NODE_TYPE = 'SPV'
const FULL_NODE_PORT = '4000';
const PEER_NODES = ['4001','4002','4003'];
const NODE_TYPE = process.argv[2];
let me = null, peers;

/** CREATES PREMADE BLOCKCHAIN AND SPV */
const chain = new Blockchain()
chain.addBlock(BlockData.firstBlock);
chain.addBlock(BlockData.secondBlock);
chain.addBlock(BlockData.thirdBlock);
const SPVchain = chain.createSPV()

/** ASSIGN ROLE ACCORDING TO ARGUMENT */
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
// assign the approprite blockchain according to role
const myChain = NODE_TYPE === FULL_NODE_TYPE ? chain : SPVchain;

// if there are no valid arguments, abort
if(!me){
    console.error("Wrong parameters")
    console.log("node index.js <FULL/SPV> <SPV PORT>")
    return
}

/** NETWORK SETUP */
let sockets = {}
let varificationRequest = null;
const myIp = toLocalIp(me)
const peerIps = getPeerIps(peers)
console.log("Connection to network...")
topology(myIp, peerIps).on('connection', (socket, peerIp) => {
    
    // Keep all new peers in sockets
    const peerPort = extractPortFromIp(peerIp)
    sockets[peerPort] = socket

    // Boardcast to new peers that you are online
    if(NODE_TYPE === FULL_NODE_TYPE){
        sockets[peerPort].write(compileMessage("TEXT:FULL NODE IS ONLINE AT PORT "+ FULL_NODE_PORT,me))
    } else {
        sockets[peerPort].write(compileMessage("TEXT:SPV NODE IS ONLINE AT PORT "+ me,me))
    }

    /** SENDING MESSAGES */
    process.stdin.on('data', data => {
        let message = compileMessage(data,me)
        let parsedMessage = JSON.parse(message);

        // Handle error messages, even if you create them
        if(parsedMessage.type === 'ERROR'){
            console.error(parsedMessage.data)
        }

        // Handle text messages, broadcast to all 
        else if(parsedMessage.type === 'TEXT'){
            socket.write(message)
        }
        
        // Handle verification messages. allow only SPV clients to send verfication.
        else if(parsedMessage.type === 'VERIFY') {
            if(NODE_TYPE !== SPV_NODE_TYPE){
                console.error("Full nodes do not support VERIFY")
                return;
            }
            varificationRequest = parsedMessage.data;
            sockets[FULL_NODE_PORT].write(message)

        // Handle print messages.
        } else if(parsedMessage.type === 'PRINT'){
            const messageData = parsedMessage.data.split(" ")
            // print the chain / specific block
            if(messageData[0] == "BLOCK"){
                if(messageData[1]){
                    console.log(myChain.chain ? chain.chain[messageData[1]] : chain[messageData[1]])
                } else {
                    console.log(myChain)
                }
            }
            // print transactions from specific block (only full nodes)
            if(messageData[0] == "TRANSACTIONS")
            {
                if(NODE_TYPE !== FULL_NODE_TYPE){
                    console.error("SPV Nodes won't hold transactions")
                }
                else {
                    if(!messageData[1]){
                        console.error("specify block index")
                    } else {
                        console.log(myChain.chain[messageData[1]].transactions)
                    }
                }
            }
            // print merkle tree from specific block (only full nodes)
            if(messageData[0] == "MERKLE")
            {
                if(NODE_TYPE !== FULL_NODE_TYPE){
                    console.error("SPV Nodes won't hold merkle trees")
                }
                else {
                    if(!messageData[1]){
                        console.error("specify block index")
                    } else {
                        console.log(myChain.chain[messageData[1]].root)
                    }
                }
            }
        // Throw error message if not recognized
        } else {
            console.error("Message not recognized")
        }

    })

    /** RECIVING MESSAGES */
    socket.on('data', data =>  {
        // parse message to treat it as JSON
        message = JSON.parse(data)
        const {sender, data, type } = message;

        // handle error message - print data string in error stdout
        if(type === 'ERROR'){
            console.error(data)
        }

        // handle text messages - print data string in log stdout
        if(type === 'TEXT'){
            console.log(data.toString('utf8'))
        }

        // handle verification messages
        if(type === 'VERIFY'){
            // turn the data into array
            const messageData = data.split(' ');

            //  verify enough data arrived to  verification process
            if(messageData.length < 2){
                sockets[sender].write(compileMessage("ERROR: INVALID VERIFICATION PARAMS",me))
                return;
            }

            console.log("starting verification process for SPV " + message.sender)
            
            // translate from block hash to index hash
            let blockIndex = 0;
            while(blockIndex < myChain.chain.length && myChain.chain[blockIndex].hash !== messageData[0]){
                blockIndex++;
            }

            // if did not find block, send error
            if(blockIndex == myChain.chain.length){
                sockets[sender].write(compileMessage("ERROR: Block hash not found", me));
                return;
            }

            // create merkle proof
            let proof = myChain.chain[blockIndex].root.getProof(messageData[1]);

            if(proof){
                // send merkle proof as PROOF message
                sockets[sender].write(compileMessage("PROOF:"+ JSON.stringify(proof), me));
            } else {
                // if did not find transaction hash, send error
                sockets[sender].write(compileMessage("ERROR: transaction was not found in block", me));  
            }
        }

        // handle merkle proof messages
        if(type === 'PROOF'){

            // use the varification data that was sent
            const varificationData = varificationRequest.split(' ');
            let block = 0;

            // look up the block hash (must be valid since it was sent)
            while(myChain[block].hash !== varificationData[0]){
                block++;
            }
            // validate transaction
            const result = validateTransaction(myChain[block].root, varificationData[1], JSON.parse(data));
            console.log(result ? "The Transaction exists in the blockchain" : "The transaction is not valid");
        }
    })
})
