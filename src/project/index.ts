import { nouns, adjectives } from './words.js';
import { random } from '../utils/index.js';

export function generateProjectName() {
    const adjective = random(adjectives);
    const validNouns = nouns.filter(n => n[0] === adjective[0]);
    const noun = random(validNouns.length > 0 ? validNouns : nouns);
    return `${adjective}-${noun}`;
}
