const { Blockchain } = require('./src/blockchain')
const { BlockData } = require('./src/blockdata')
//const { bloomFilter } = require('./src/bloomFilter')
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
let varificationRequest = [];
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
            let transactionHash = parsedMessage.data;
            let blocks = [];
            let blockIndex = 0;
            while(blockIndex < myChain.length && myChain[blockIndex]){
                if(myChain[blockIndex].bloomFilter.query(transactionHash)){
                    blocks.push(myChain[blockIndex].hash)
                }
                blockIndex++;
            }
            varificationRequest = [];
            varificationRequest.push(parsedMessage.data);
            varificationRequest = varificationRequest.concat(blocks);
            message = JSON.stringify({ type: parsedMessage.type, data: varificationRequest.toString(), sender: me})
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
                    //NOTE: block index is 0-2 so i added 1 to avoid printing the wrong block
                    // block 0 is not gensis but the first block
                    if(!messageData[1]){
                        console.error("specify block index")
                    } else {
                        let index = parseInt(messageData[1], 10) + 1;
                        console.log(myChain.chain[index].root)
                    }
                }
            }
        // Throw error message if not recognized
        } else {
            console.error("Message not recognized")
        }

    })

    /** RECIVING MESSAGES */
    socket.on('data', message =>  {
        // parse message to treat it as JSON
        const {sender, data, type } = JSON.parse(message);

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
            const messageData = data.split(',');

            //  verify enough data arrived to  verification process
            if(messageData.length < 1){
                sockets[sender].write(compileMessage("ERROR: INVALID VERIFICATION PARAMS",me))
                return;
            }

            console.log("starting verification process for SPV " + sender)
            
            let findBlock = 1;
            while(messageData[findBlock]){
                // translate from block hash to index hash
                let blockIndex = 0;
                while(blockIndex < myChain.chain.length && myChain.chain[blockIndex].hash !== messageData[findBlock]){
                    blockIndex++;
                }

                // if did not find block, send error
                if(blockIndex == myChain.chain.length){
                    sockets[sender].write(compileMessage("ERROR: Block hash number - " + messageData[findBlock]
                    + " was not found", me));
                    //NOTE: do we want to return if only one block is not found? or maybe write
                    //continue and move to the next block?
                    return;
                }

                // create merkle proof
                let proof = myChain.chain[blockIndex].root.getProof(messageData[0]);

                if(proof){
                    // send merkle proof as PROOF message + block index it was 
                    sockets[sender].write(compileMessage("PROOF:"+ JSON.stringify(proof) + " " + findBlock, me));
                    console.log("sent proof for SPV " + sender)
                    return;
                }
                // if didn't find the transection in this block =>
                // move to the next block - continue in the while loop
                findBlock++;
            }
            // if did not find transaction hash, send error
            sockets[sender].write(compileMessage("ERROR: transaction was not found in block", me));
        }

        // handle merkle proof messages
        if(type === 'PROOF'){

            const messageData = data.split(' ');

            // use the varification data that was sent
            const varificationData = varificationRequest;
            let block = 0;

            // look up the block hash (must be valid since it was sent)
            while(myChain[block].hash != varificationData[messageData[1]]){
                block++;
            }

            // validate transaction
            const result = validateTransaction(myChain[block].root, varificationData[0], JSON.parse(messageData[0]));
            console.log(result ? "The Transaction exists in the blockchain" : "The transaction is not valid");
        }
    })
})
