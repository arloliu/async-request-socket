/* eslint-disable no-console */
const BufferPlus = require('buffer-plus');
const UniqId = require('uniqid');
const WebSocketAsPromised = require('websocket-as-promised');
const {createTcpBinaryClient, createWsBinaryClient} = require('../src');
const benchmark = require('benchmark');


const suite = new benchmark.Suite();

function formatNumber(number) {
    return String(number)
        .replace(/\d\d\d$/, ',$&')
        .replace(/^(\d)(\d\d\d)/, '$1,$2');
}


const client = createTcpBinaryClient('tcp://127.0.0.1:9000', {
    timeout: 2000,
    connectionTimeout: 1000,
    requestIdOffset: 1,
    requestIdLength: 12,
});

const wsClient1 = createWsBinaryClient('ws://localhost:9001', {
    timeout: 2000,
    connectionTimeout: 1000,
    requestIdOffset: 1,
    requestIdLength: 12,
});

const wsClient2 = new WebSocketAsPromised('ws://localhost:9001/', {
    timeout: 20000,
    connectionTimeout: 10000,
    createWebSocket: (wsUrl) => {
        const W3CWebSocket = require('websocket').w3cwebsocket;
        return new W3CWebSocket(wsUrl);
    },
    packMessage: (data) => {
        data.moveTo(0);
        if (!BufferPlus.isBufferPlus(data)) {
            throw new TypeError(`data should be a BufferPlus`);
        }
        return data.toArrayBuffer();
    },
    unpackMessage: (message) => {
        return BufferPlus.from(message);
    },
    attachRequestId: (data, requestId) => {
        if (!BufferPlus.isBufferPlus(data)) {
            throw new TypeError(`data should be a BufferPlus`);
        }
        if (typeof requestId !== 'string') {
            throw new TypeError(`requestId should be a String`);
        }

        data.moveTo(1);
        data.writeString(requestId, 'ascii');
        data.moveTo(0);
        return data;
    },
    extractRequestId: (data) => {
        data.moveTo(1);
        const requestId = data.readString(12, 'ascii');
        data.moveTo(0);
        return requestId;
    },
});

const alphabet = 'bjectSymhasOwnProp-0123456789ABCDEFGHIJKLMNQRTUVWXYZ_dfgiklquvxz';
function genUniqId() {
    let id = UniqId.process();
    if (id.length < 12) {
        let len = 12 - id.length;
        const alphabetlength = alphabet.length;
        while (len-- > 0) {
            id += alphabet[Math.random() * alphabetlength | 0];
        }
    }
    return id;
}

const payloadSize = process.argv[2] ? parseInt(process.argv[2]) : 512;
const payload = BufferPlus.create(payloadSize);
payload.moveTo(0);
payload.writeUInt8(0x1);
payload.moveTo(13, true);
for (let i = 0; i < payloadSize - 13; i++) {
    payload.writeUInt8(Math.round(Math.random() * 255));
}

const benchOptions = {
    minSamples: 100000,
};
suite
    .add('Websocket-as-promised binary', {
        defer: true,
        fn: (deferred) => {
            wsClient2.sendRequest(payload, {requestId: genUniqId()}).then((response) => {
                deferred.resolve();
            });
        },
    }, benchOptions)
    .add('Websocket binary', {
        defer: true,
        fn: (deferred) => {
            wsClient1.sendRequest(payload).then((response) => {
                deferred.resolve();
            });
        },
    }, benchOptions)
    .add('TCP binary', {
        defer: true,
        fn: (deferred) => {
            client.sendRequest(payload).then((response) => {
                deferred.resolve();
            });
        },
    }, benchOptions)
    .on('cycle', (event) => {
        const name = event.target.name.padEnd('Websocket-as-promised binary'.length);
        const hz = formatNumber(event.target.hz.toFixed(0)).padStart(9);
        process.stdout.write(name + '   ' + hz + ' ops/sec\n');

        // const cycles = String(event.target.cycles).padStart(10);
        // process.stdout.write(name + '   ' + cycles + ' cycles\n');

        // const counts = String(event.target.count).padStart(10);
        // process.stdout.write(name + '   ' + counts + ' counts\n');
    })
    .on('complete', () => {
        console.log('Fastest is ' + suite.filter('fastest').map('name'));
        process.exit(0);
    });

async function main() {
    await client.connect();
    await wsClient1.connect();
    await wsClient2.open();

    console.log(`Benchmark with payload size: ${payloadSize} Bytes`);

    suite.run({
        async: false,
        maxTime: 1,
    });
}

main();
