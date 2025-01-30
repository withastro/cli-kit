import Prompt from './prompt.js';
import color from 'chalk';
import clear, { strip } from '../util/clear.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { erase, cursor } = require('sisteransi');

/**
 * ConfirmPrompt Base Element
 * @param {Object} opts Options
 * @param {String} opts.message Message
 * @param {Boolean} [opts.initial] Default value (true/false)
 * @param {Stream} [opts.stdin] The Readable stream to listen to
 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
 * @param {String} [opts.yes] The "Yes" label
 * @param {String} [opts.yesOption] The "Yes" option when choosing between yes/no
 * @param {String} [opts.no] The "No" label
 * @param {String} [opts.noOption] The "No" option when choosing between yes/no
 */
export default class MultiselectPrompt extends Prompt {
  constructor(opts={}) {
    super(opts);
    this.label = opts.label;
    this.msg = opts.message;
    this.value = [];
    this.choices = opts.choices || []
    this.initialValue = opts.initial || this.choices[0].value;
    this.cursor = this.choices.findIndex((c) => c.value === this.initialValue)
    this.render();
  }

  reset() {
    this.value = [];
    this.fire();
    this.render();
  }

  exit() {
    this.abort();
  }

  abort() {
    this.done = this.aborted = true;
    this.cursor = this.choices.findIndex((c) => c.value === this.initialValue)
    this.fire();
    this.render();
    this.out.write('\n');
    this.close();
  }

  submit() {
    return this.toggle();
  }

  finish() {
    this.value = this.value;
    this.done = true;
    this.aborted = false;
    this.fire();
    this.render();
    this.out.write('\n');
    this.close();
  }

  moveCursor(n) {
    this.cursor = n;
    this.fire();
  }

  toggle() {
    const choice = this.choices[this.cursor];
    if (!choice) return;
    choice.selected = !choice.selected;
    this.render();
  }

  _(c, key) {
    if (c === ' ') {
      return this.toggle();
    }
    if (c.toLowerCase() === 'c') {
      return this.finish();
    }
    return;
  }

  reset() {
    this.moveCursor(0);
    this.fire();
    this.render();
  }

  first() {
    this.moveCursor(0);
    this.render();
  }

  last() {
    this.moveCursor(this.choices.length - 1);
    this.render();
  }

  up() {
    if (this.cursor === 0) {
      this.moveCursor(this.choices.length - 1);
    } else {
      this.moveCursor(this.cursor - 1);
    }
    this.render();
  }

  down() {
    if (this.cursor === this.choices.length - 1) {
      this.moveCursor(0);
    } else {
      this.moveCursor(this.cursor + 1);
    }
    this.render();
  }

  render() {
    if (this.closed) return;
    if (this.firstRender) this.out.write(cursor.hide);
    else this.out.write(clear(this.outputText, this.out.columns));
    super.render();

    this.outputText = [
      '\n',
      this.label,
      ' ',
      this.msg,
      '\n',
    ];

    const prefix = ' '.repeat(strip(this.label).length);

    if (this.done) {
      this.outputText.push(this.choices.map((choice) => choice.selected ? `${prefix} ${color.dim(`${choice.label}`)}\n` : '').join('').trimEnd());
    } else {
      this.outputText.push(this.choices.map((choice, i) => i === this.cursor ? `${prefix.slice(0, -2)}${color.cyanBright('▶')}  ${choice.selected ? color.green('■') : color.whiteBright('□')} ${color.underline(choice.label)} ${choice.hint ? color.dim(choice.hint) : ''}` : color[choice.selected ? 'reset' : 'dim'](`${prefix} ${choice.selected ? color.green('■') : '□'} ${choice.label} `)).join('\n'))
      this.outputText.push(`\n\n${prefix} Press ${color.inverse(' C ')} to continue`);
    }
    this.outputText = this.outputText.join('')

    this.out.write(erase.line + cursor.to(0) + this.outputText);
  }
}
