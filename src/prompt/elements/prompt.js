import readline from 'node:readline';
import EventEmitter from 'node:events';
import { action } from '../util/action.js'
import color from 'chalk';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { beep, cursor } = require('sisteransi');

/**
 * Base prompt skeleton
 * @param {Stream} [opts.stdin] The Readable stream to listen to
 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
 */
export default class Prompt extends EventEmitter {
  constructor(opts={}) {
    super();

    this.firstRender = true;
    this.in = opts.stdin || process.stdin;
    this.out = opts.stdout || process.stdout;
    this.onRender = (opts.onRender || (() => void 0)).bind(this);
    const rl = readline.createInterface({ input:this.in, escapeCodeTimeout: 50 });
    readline.emitKeypressEvents(this.in, rl);

    if (this.in.isTTY) this.in.setRawMode(true);
    const isSelect = [ 'SelectPrompt', 'MultiselectPrompt' ].indexOf(this.constructor.name) > -1;
    const keypress = (str, key) => {
      if (this.in.isTTY) this.in.setRawMode(true);
      let a = action(key, isSelect);
      if (a === false) {
        this._ && this._(str, key);
      } else if (typeof this[a] === 'function') {
        this[a](key);
      }
    };

    this.close = () => {
      this.out.write(cursor.show);
      this.in.removeListener('keypress', keypress);
      if (this.in.isTTY) this.in.setRawMode(false);
      rl.close();
      this.emit(this.aborted ? 'abort' : this.exited ? 'exit' : 'submit', this.value);
      this.closed = true;
    };

    this.in.on('keypress', keypress);
  }

  bell() {
    this.out.write(beep);
  }

  fire() {
    this.emit('state', {
      value: this.value,
      aborted: !!this.aborted,
      exited: !!this.exited
    });
  }

  render() {
    this.onRender(color);
    if (this.firstRender) this.firstRender = false;
  }
}
