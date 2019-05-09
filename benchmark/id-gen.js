const benchmark = require('benchmark');
const nanoidSecure = require('nanoid');
const nanoid = require('nanoid/non-secure');
const uniqid = require('uniqid');

const suite = new benchmark.Suite();

function formatNumber(number) {
    return String(number)
        .replace(/\d\d\d$/, ',$&')
        .replace(/^(\d)(\d\d\d)/, '$1,$2');
}

const alphabet = 'bjectSymhasOwnProp-0123456789ABCDEFGHIJKLMNQRTUVWXYZ_dfgiklquvxz';

function customId() {
    let id = uniqid.process();
    if (id.length < 12) {
        let len = 12 - id.length;
        const alphabetlength = alphabet.length;
        while (len-- > 0) {
            id += alphabet[Math.random() * alphabetlength | 0];
        }
    }
    return id;
}

suite
    .add('nanoid secure', () => {
        nanoidSecure();
    })
    .add('nanoid non-secure', () => {
        nanoid();
    })
    .add('uniqid.process', () => {
        uniqid.process();
    })
    .add('uniqid.time', () => {
        uniqid.time();
    })
    .add('uniqid', () => {
        uniqid();
    })
    .add('customId', () => {
        customId();
    })
    .on('cycle', (event) => {
        const name = event.target.name.padEnd('nanoid non-secure'.length);
        const hz = formatNumber(event.target.hz.toFixed(0)).padStart(9);
        process.stdout.write(name + '   ' + hz + ' ops/sec\n');
    })
    .run();
