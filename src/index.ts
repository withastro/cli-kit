export { default as color } from 'chalk';
export { default as prompt } from './prompt/prompt.js';
export * from './spinner/index.js';
export * from './messages/index.js';
export * from './project/index.js';

import { tasks } from './spinner/index.js';
import { randomBetween, sleep } from './utils/index.js';

await tasks({ start: 'Initializing project...', end: 'Project initialized!' }, Array.from({ length: 5 }, (_, i) => ({
    start: `Task ${i + 1} initializing`,
    end: `Task ${i + 1} completed`,
    pending: `Task ${i + 1}`,
    while: () => sleep(randomBetween(0, 2500))
})))
