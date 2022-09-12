import readline from 'node:readline';
import color from 'chalk';
import logUpdate from 'log-update';
import { random, randomBetween, sleep } from '../utils/index.js'
import { action } from '../prompt/util/action.js';

export const say = async (messages: string | string[] = [], { clear = false } = {}) => {
    const rl = readline.createInterface({ input: process.stdin, escapeCodeTimeout: 50 });
    readline.emitKeypressEvents(process.stdin, rl);
    let i = 0;
    let cancelled = false;
    const done = async () => {
        process.stdin.off('keypress', done)
        process.stdin.setRawMode(false);
        cancelled = true;
        if (i < messages.length - 1) {
            logUpdate.clear();
        } else if (clear) {
            logUpdate.clear();
        } else {
            logUpdate.done();
        }
    }

    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.on('keypress', (str, key) => {
        process.stdin.setRawMode(true);
        const k = action(key, false);
        if (k === 'abort') {
            done();
            return process.exit(0);
        }
        if (['up', 'down', 'left', 'right'].includes(k as any)) return;
        done();
    })

    const _messages = Array.isArray(messages) ? messages : [messages];
    const eyes = ['●', '●', '●', '●', '●', '○', '○', '•'];
    const mouths = ['•', '○', '■', '▪', '▫', '▬', '▭', '-', '○'];
    const face = (msg: string, { mouth = mouths[0], eye = eyes[0] } = {}) => {
        return [
            `╭─────╮  ${color.bold(color.cyan('Houston:'))}`,
            `│ ${eye} ${color.cyanBright(mouth)} ${eye}  ${msg}`,
            `╰─────╯`,
        ].join('\n')
    };

    for (const message of _messages) {
        const _message = Array.isArray(message) ? message : message.split(' ');
        let msg = [];
        let eye = random(eyes);
        let j = 0;
        for (const word of [''].concat(_message)) {
            if (word) msg.push(word);
            const mouth = random(mouths);
            if (j % 7 === 0) eye = random(eyes);
            logUpdate('\n' + face(msg.join(' '), { mouth, eye }));
            if (!cancelled) await sleep(randomBetween(75, 200));
            j++;
        }
        if (!cancelled) await sleep(100);
        const text = '\n' + face(_message.join(' '), { mouth: '◡', eye: '◠' });
        logUpdate(text);
        if (!cancelled) await sleep(randomBetween(800, 900));
        i++;
    }
    process.stdin.off('keypress', done);
    await sleep(100);
    done();
}

export const label = (text: string, c = color.bgHex('#883AE2'), t = color.whiteBright) => c(` ${t(text)} `)
