import color from 'chalk';
import { get } from 'node:https';
import { exec } from 'node:child_process';
import { platform } from 'node:os';
import { strip } from '../prompt/util/clear.js';

export const isWin = platform() === 'win32';

export const hookExit = () => {
    const onExit = (code: number) => {
        if (code === 0) {
            console.log(`\n ${color.bgCyan(color.black(` done `))}  ${color.bold('Operation cancelled.')}`)
        }
    }
    process.on('beforeExit', onExit);
    return () => process.off('beforeExit', onExit);
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const random = (...arr: any[]) => {
    arr = arr.flat(1);
    return arr[Math.floor(arr.length * Math.random())];
}

export const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min)

let v: string;
export const getAstroVersion = () => new Promise<string>((resolve) => {
    if (v) return resolve(v);
    get('https://registry.npmjs.org/astro/latest', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk)
        res.on('end', () => {
            const { version } = JSON.parse(body);
            v = version;
            resolve(version);
        })
    })
})

export const getUserName = () => new Promise<string>((resolve) => {
  exec('git config user.name', { encoding: 'utf-8' }, (err, stdout, stderr) => {
    if (stdout.trim()) {
        return resolve(stdout.split(' ')[0].trim());
    }
    exec('whoami', { encoding: 'utf-8' }, (err, stdout, stderr) => {
        if (stdout.trim()) {
            return resolve(stdout.split(' ')[0].trim());
        }

        return resolve('astronaut');
    });
  });
});

export const align = (text: string, dir: 'start' | 'end' | 'center', len: number) => {
    const pad = Math.max(len - strip(text).length, 0);
    switch (dir) {
        case 'start': return text + ' '.repeat(pad);
        case 'end': return ' '.repeat(pad) + text;
        case 'center': return ' '.repeat(Math.floor(pad / 2)) + text + ' '.repeat(Math.floor(pad / 2));
        default: return text;
    }
}
