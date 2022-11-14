import readline from 'node:readline';
import color from 'chalk';
import logUpdate from 'log-update';
import { random, randomBetween, sleep, useAscii } from '../utils/index.js'
import { action } from '../prompt/util/action.js';
import { strip } from '../prompt/util/clear.js';

export const say = async (messages: string | string[] = [], { clear = false, hat = '' } = {}) => {
    const rl = readline.createInterface({ input: process.stdin, escapeCodeTimeout: 50 });
    readline.emitKeypressEvents(process.stdin, rl);
    let i = 0;
    let cancelled = false;
    const done = async () => {
        process.stdin.off('keypress', done)
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        rl.close();
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
        if (process.stdin.isTTY) process.stdin.setRawMode(true);
        const k = action(key, true);
        if (k === 'abort') {
            done();
            return process.exit(0);
        }
        if (['up', 'down', 'left', 'right'].includes(k as any)) return;
        done();
    })

    const _messages = Array.isArray(messages) ? messages : [messages];
    const eyes = useAscii() ? ['•', '•', 'o', 'o', '•', 'O', '^', '•'] : ['●', '●', '●', '●', '●', '○', '○', '•'];
    const mouths = useAscii() ? ['•', 'O', '*', 'o', 'o', '•', '-'] : ['•', '○', '■', '▪', '▫', '▬', '▭', '-', '○'];
    const walls = useAscii() ? ['—', '|'] : ['─', '│'];
    const corners = useAscii() ? ['+', '+', '+', '+'] : ['╭', '╮', '╰', '╯'];

    const face = (msg: string, { mouth = mouths[0], eye = eyes[0] } = {}) => {
        const [h, v] = walls;
        const [tl, tr, bl, br] = corners;
        const head = h.repeat(3 - strip(hat).split('').length);
        return [
            `${tl}${h.repeat(2)}${hat}${head}${tr}  ${color.bold(color.cyan('Houston:'))}`,
            `${v} ${eye} ${color.cyanBright(mouth)} ${eye}  ${msg}`,
            `${bl}${h.repeat(5)}${br}`,
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
            if (i == 1) eye = eye;
            logUpdate('\n' + face(msg.join(' '), { mouth, eye }));
            if (!cancelled) await sleep(randomBetween(75, 200));
            j++;
        }
        if (!cancelled) await sleep(100);
        const text = '\n' + face(_message.join(' '), { mouth: useAscii() ? 'u' : '◡', eye: useAscii() ? '^' : '◠' });
        logUpdate(text);
        if (!cancelled) await sleep(randomBetween(1200, 1400));
        i++;
    }
    process.stdin.off('keypress', done);
    await sleep(100);
    done();
}

export const label = (text: string, c = color.bgHex('#883AE2'), t = color.whiteBright) => c(` ${t(text)} `)
