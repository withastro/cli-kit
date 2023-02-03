import { nouns, adjectives } from './words.js';
import { random } from '../utils/index.js';

export function generateProjectName() {
    const adjective = random(adjectives);
    const validNouns = nouns.filter(n => n[0] === adjective[0]);
    if (validNouns.length < 2) {
        return `${random(adjectives)}-${random(nouns)}`;
    }
    const noun = random(validNouns);
    return `${adjective}-${noun}`;
}
