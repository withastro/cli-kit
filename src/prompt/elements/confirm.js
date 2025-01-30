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
export default class ConfirmPrompt extends Prompt {
  constructor(opts={}) {
    super(opts);
    this.label = opts.label;
    this.hint = opts.hint ?? '';
    this.msg = opts.message;
    this.value = opts.initial;
    this.initialValue = !!opts.initial;
    this.choices = [{ value: true, label: 'Yes' }, { value: false, label: 'No' }]
    this.cursor = this.choices.findIndex((c) => c.value === this.initialValue)
    this.render();
  }

  reset() {
    this.value = this.initialValue;
    this.fire();
    this.render();
  }

  exit() {
    this.abort();
  }

  abort() {
    this.done = this.aborted = true;
    this.fire();
    this.render();
    this.out.write('\n');
    this.close();
  }

  submit() {
    this.value = this.value || false;
    this.cursor = this.choices.findIndex((c) => c.value === this.value)
    this.done = true;
    this.aborted = false;
    this.fire();
    this.render();
    this.out.write('\n');
    this.close();
  }

  moveCursor(n) {
    this.cursor = n;
    this.value = this.choices[n].value;
    this.fire();
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

  left() {
    if (this.cursor === 0) {
      this.moveCursor(this.choices.length - 1);
    } else {
      this.moveCursor(this.cursor - 1);
    }
    this.render();
  }

  right() {
    if (this.cursor === this.choices.length - 1) {
      this.moveCursor(0);
    } else {
      this.moveCursor(this.cursor + 1);
    }
    this.render();
  }

  _(c, key) {
    if (!Number.isNaN(Number.parseInt(c))) {
      const n = Number.parseInt(c) - 1;
      this.moveCursor(n);
      this.render();
      return this.submit();
    }
    if (c.toLowerCase() === 'y') {
      this.value = true;
      return this.submit();
    }
    if (c.toLowerCase() === 'n') {
      this.value = false;
      return this.submit();
    }
    return;
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
      this.done ? '' : this.hint ? color.dim(` (${this.hint})`) : '',
      '\n'
    ];

    this.outputText.push(' '.repeat(strip(this.label).length));

    if (this.done) {
      this.outputText.push(' ', color.dim(`${this.choices[this.cursor].label}`));
    } else {
      this.outputText.push(' ',this.choices.map((choice, i) => i === this.cursor ? `${color.green('●')} ${choice.label} ` : color.dim(`○ ${choice.label} `)).join(color.dim(' ')))
    }
    this.outputText = this.outputText.join('')

    this.out.write(erase.line + cursor.to(0) + this.outputText);
  }
}
