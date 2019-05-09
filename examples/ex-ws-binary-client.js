/* eslint-disable no-console */
const BufferPlus = require('buffer-plus');
const {createWsBinaryClient} = require('../src');

const client = createWsBinaryClient('ws://127.0.0.1:9001', {
    timeout: 2000,
    connectionTimeout: 0,
    requestIdOffset: 1,
    requestIdLength: 12,
});

client.onError((err) => {
    console.error('WS Client error:', err.stack);
});

client.onClose((event) => {
    console.error('WS Client close:', event);
});

async function main() {
    try {
        const bp = BufferPlus.create(256);
        await client.connect();
        for (let i = 0; i < 100; i++) {
            bp.moveTo(0);
            bp.writeUInt8(0x1);
            bp.moveTo(13, true);
            bp.writePackedString(`test_msg:${i + 1}`);
            const response = await client.sendRequest(bp);

            const resBp = BufferPlus.from(response);
            resBp.moveTo(13);
            console.log('response:', resBp.readPackedString());
        }
        await client.close();
    } catch (err) {
        console.error('WS client got error:', err.stack);
    }
}

main();
