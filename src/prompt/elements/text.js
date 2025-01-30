import Prompt from './prompt.js';
import color from 'chalk';
import { useAscii } from '../../utils/index.js';
import clear, { lines, strip } from '../util/clear.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { erase, cursor } = require('sisteransi');

/**
 * TextPrompt Base Element
 * @param {Object} opts Options
 * @param {String} opts.message Message
 * @param {String} [opts.style='default'] Render style
 * @param {String} [opts.initial] Default value
 * @param {Function} [opts.validate] Validate function
 * @param {Stream} [opts.stdin] The Readable stream to listen to
 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
 * @param {String} [opts.error] The invalid error label
 */
export default class TextPrompt extends Prompt {
  constructor(opts={}) {
    super(opts);
    this.transform = { render: v => v, scale: 1 };
    this.label = opts.label || '';
    this.scale = this.transform.scale;
    this.msg = opts.message;
    this.initial = opts.initial || ``;
    this.validator = opts.validate || (() => true);
    this.value = ``;
    this.errorMsg = opts.error || `Please Enter A Valid Value`;
    this.cursor = Number(!!this.initial);
    this.cursorOffset = 0;
    this.clear = clear(``, this.out.columns);
    this.render();
  }

  set value(v) {
    if (!v && this.initial) {
      this.placeholder = true;
      this.rendered = color.dim(this.initial);
    } else {
      this.placeholder = false;
      this.rendered = this.transform.render(v);
    }
    this._value = v;
    this.fire();
  }

  get value() {
    return this._value;
  }

  reset() {
    this.value = ``;
    this.cursor = Number(!!this.initial);
    this.cursorOffset = 0;
    this.fire();
    this.render();
  }

  exit() {
    this.abort();
  }

  abort() {
    this.value = this.value || this.initial;
    this.done = this.aborted = true;
    this.error = false;
    this.red = false;
    this.fire();
    this.render();
    this.out.write('\n');
    this.close();
  }

  async validate() {
    let valid = await this.validator(this.value);
    if (typeof valid === `string`) {
      this.errorMsg = valid;
      valid = false;
    }
    this.error = !valid;
  }

  async submit() {
    this.value = this.value || this.initial;
    this.cursorOffset = 0;
    this.cursor = this.rendered.length;
    await this.validate();
    if (this.error) {
      this.red = true;
      this.fire();
      this.render();
      return;
    }
    this.done = true;
    this.aborted = false;
    this.fire();
    this.render();
    this.out.write('\n');
    this.close();
  }

  next() {
    if (!this.placeholder) return this.bell();
    this.value = this.initial;
    this.cursor = this.rendered.length;
    this.fire();
    this.render();
  }

  moveCursor(n) {
    if (this.placeholder) return;
    this.cursor = this.cursor+n;
    this.cursorOffset += n;
  }

  _(c, key) {
    let s1 = this.value.slice(0, this.cursor);
    let s2 = this.value.slice(this.cursor);
    this.value = `${s1}${c}${s2}`;
    this.red = false;
    this.cursor = this.placeholder ? 0 : s1.length+1;
    this.render();
  }

  delete() {
    if (this.isCursorAtStart()) return this.bell();
    let s1 = this.value.slice(0, this.cursor-1);
    let s2 = this.value.slice(this.cursor);
    this.value = `${s1}${s2}`;
    this.red = false;
    this.outputError = '';
    this.error = false;
    if (this.isCursorAtStart()) {
      this.cursorOffset = 0
    } else {
      this.cursorOffset++;
      this.moveCursor(-1);
    }
    this.render();
  }

  deleteForward() {
    if(this.cursor*this.scale >= this.rendered.length || this.placeholder) return this.bell();
    let s1 = this.value.slice(0, this.cursor);
    let s2 = this.value.slice(this.cursor+1);
    this.value = `${s1}${s2}`;
    this.red = false;
    this.outputError = '';
    this.error = false;
    if (this.isCursorAtEnd()) {
      this.cursorOffset = 0;
    } else {
      this.cursorOffset++;
    }
    this.render();
  }

  first() {
    this.cursor = 0;
    this.render();
  }

  last() {
    this.cursor = this.value.length;
    this.render();
  }

  left() {
    if (this.cursor <= 0 || this.placeholder) return this.bell();
    this.moveCursor(-1);
    this.render();
  }

  right() {
    if (this.cursor * this.scale >= this.rendered.length || this.placeholder) return this.bell();
    this.moveCursor(1);
    this.render();
  }

  isCursorAtStart() {
    return this.cursor === 0 || (this.placeholder && this.cursor === 1);
  }

  isCursorAtEnd() {
    return this.cursor === this.rendered.length || (this.placeholder && this.cursor === this.rendered.length + 1)
  }

  render() {
    if (this.closed) return;
    if (!this.firstRender) {
      if (this.outputError)
        this.out.write(cursor.down(lines(this.outputError, this.out.columns) - 1) + clear(this.outputError, this.out.columns));
      this.out.write(clear(this.outputText, this.out.columns));
    }
    super.render();
    this.outputError = '';

    const prefix = ' '.repeat(strip(this.label).length);

    this.outputText = [
      '\n',
      this.label,
      ' ',
      this.msg,
      '\n' + prefix,
      ' ',
      this.done ? color.dim(this.rendered.startsWith('.') ? this.rendered : `./${this.rendered}`) : this.rendered
    ].join('');

    if (this.error) {
      this.outputError += `  ${color.redBright((useAscii() ? '> ' : '▶ ') + this.errorMsg)}`;
    }

    this.out.write(erase.line + cursor.to(0) + this.outputText + cursor.save + this.outputError + cursor.restore + cursor.move(this.cursorOffset, 0));
  }
}
