/* eslint-disable no-console */

const net = require('net');


const server = net.createServer((socket) => {
    // console.info(`New connection from ${socket.remoteAddress}`);
    socket.on('data', (data) => {
        socket.write(data);
    });
    socket.on('close', () => {
        console.log('client closed');
    });
});

server.on('error', (err) => {
    console.error('Server got error:', err.stack);
});

server.listen(9000, () => {
    console.log('Server listening');
});


