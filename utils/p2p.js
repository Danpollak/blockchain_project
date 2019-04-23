// const {
//     stdin,
//     exit,
//     argv
// } = process
// const {
//     log
// } = console
// const {
//     me,
//     peers
// } = extractPeersAndMyPort()
// const sockets = {}
// log('---------------------')
// log('Welcome to p2p chat!')
// log('me - ', me)
// log('peers - ', peers)
// log('connecting to peers...')
// const myIp = toLocalIp(me)
// const peerIps = getPeerIps(peers)
// topology(myIp, peerIps).on('connection', (socket, peerIp) => {
//     const peerPort = extractPortFromIp(peerIp)
//     log('connected to peer - ', peerPort)
//     sockets[peerPort] = socket
//     stdin.on('data', data => { //on user input
//         const message = data.toString().trim()
//         if (message === 'exit') { //on exit
//             log('Bye bye')
//             exit(0)
//         }
//         const receiverPeer = extractReceiverPeer(message)
//         if (sockets[receiverPeer]) { //message to specific peer
//             if (peerPort === receiverPeer) { //write only once
//                 sockets[receiverPeer].write(formatMessage(extractMessageToSpecificPeer(message)))
//             }
//         } else { //broadcast message to everyone
//             socket.write(formatMessage(message))
//         }
//     })
//     //print data when received
//     socket.on('data', data => log(data.toString('utf8')))
// })
// //extract ports from process arguments, {me: first_port, peers: rest... }
function extractPeersAndMyPort(argv) {
    return {
        me: argv[2],
        peers: argv.slice(3, argv.length)
    }
}
//'4000' -> '127.0.0.1:4000'
function toLocalIp(port) {
    return '127.0.0.1:' + port
}
//['4000', '4001'] -> ['127.0.0.1:4000', '127.0.0.1:4001']
function getPeerIps(peers) {
    return peers.map(peer => toLocalIp(peer))
}
//'hello' -> 'myPort:hello'
function compileMessage(message, port) {
    let messageData = message.toString().split(":");
    if(messageData.length < 2){
        return JSON.stringify({type: 'ERROR', data: 'Invalid message in the network', sender: port})
    }
    return JSON.stringify({ type: messageData[0], data: messageData[1].trim(), sender: port});
}
//'127.0.0.1:4000' -> '4000'
function extractPortFromIp(peer) {
    return peer.toString().slice(peer.length - 4, peer.length);
}
//'4000>hello' -> '4000'
function extractReceiverPeer(message) {
    return message.slice(0, 4);
}
//'4000>hello' -> 'hello'
function extractMessageToSpecificPeer(message) {
    return message.slice(5, message.length);
}


module.exports.toLocalIp = toLocalIp;
module.exports.getPeerIps = getPeerIps; 
module.exports.extractPortFromIp = extractPortFromIp;
module.exports.compileMessage = compileMessage;