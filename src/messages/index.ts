import readline from 'node:readline';
import color from 'chalk';
import { createLogUpdate } from 'log-update';
import { random, randomBetween, sleep, useAscii } from '../utils/index.js'
import { action } from '../prompt/util/action.js';
import { strip } from '../prompt/util/clear.js';

type Message = string | Promise<string>;

export const say = async (msg: Message | Message[] = [], { clear = false, clothes = { hat: '', tie: '' }, stdin = process.stdin, stdout = process.stdout } = {}) => {
    const messages = Array.isArray(msg) ? msg : [msg];
    const rl = readline.createInterface({ input: stdin, escapeCodeTimeout: 50 });
    const logUpdate = createLogUpdate(stdout, { showCursor: false });
    readline.emitKeypressEvents(stdin, rl);
    let i = 0;
    let cancelled = false;
    const done = async () => {
        stdin.off('keypress', done)
        if (stdin.isTTY) stdin.setRawMode(false);
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

    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.on('keypress', (str, key) => {
        if (stdin.isTTY) stdin.setRawMode(true);
        const k = action(key, true);
        if (k === 'abort') {
            done();
            return process.exit(0);
        }
        if (['up', 'down', 'left', 'right'].includes(k as any)) return;
        done();
    })

    const eyes = useAscii() ? ['•', '•', 'o', 'o', '•', 'O', '^', '•'] : ['●', '●', '●', '●', '●', '○', '○', '•'];
    const mouths = useAscii() ? ['•', 'O', '*', 'o', 'o', '•', '-'] : ['•', '○', '■', '▪', '▫', '▬', '▭', '-', '○'];
    const walls = useAscii() ? ['—', '|'] : ['─', '│'];
    const corners = useAscii() ? ['+', '+', '+', '+'] : ['╭', '╮', '╰', '╯'];

    const face = (msg: string, { mouth = mouths[0], eye = eyes[0] } = {}) => {
        const [h, v] = walls;
        const [tl, tr, bl, br] = corners;
        const head = h.repeat(3 - strip(clothes.hat).split('').length);
        const bottom = h.repeat(3 - strip(clothes.tie).split('').length);
        return [
            `${tl}${h.repeat(2)}${clothes.hat}${head}${tr}  ${color.bold(color.cyan('Houston:'))}`,
            `${v} ${eye} ${color.cyanBright(mouth)} ${eye}  ${msg}`,
            `${bl}${h.repeat(2)}${clothes.tie}${bottom}${br}`,
        ].join('\n')
    };

    for (let message of messages) {
        message = await message
        const _message = Array.isArray(message) ? message : message.split(' ');
        let msg = [];
        let eye = random(eyes);
        let j = 0;
        for (let word of [''].concat(_message)) {
            word = await word;
            if (word) msg.push(word);
            const mouth = random(mouths);
            if (j % 7 === 0) eye = random(eyes);
            if (i == 1) eye = eye;
            logUpdate('\n' + face(msg.join(' '), { mouth, eye }));
            if (!cancelled) await sleep(randomBetween(75, 200));
            j++;
        }
        if (!cancelled) await sleep(100);
        const tmp = await Promise.all(_message).then(res => res.join(' '))
        const text = '\n' + face(tmp, { mouth: useAscii() ? 'u' : '◡', eye: useAscii() ? '^' : '◠' });
        logUpdate(text);
        if (!cancelled) await sleep(randomBetween(1200, 1400));
        i++;
    }
    stdin.off('keypress', done);
    await sleep(100);
    done();
    if (stdin.isTTY) stdin.setRawMode(false);
    stdin.removeAllListeners('keypress')
}

export const label = (text: string, c = color.bgHex('#883AE2'), t = color.whiteBright) => c(` ${t(text)} `)
