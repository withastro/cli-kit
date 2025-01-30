import Prompt from './prompt.js';
import color from 'chalk';
import { useAscii } from '../../utils/index.js';
import clear, { strip } from '../util/clear.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { erase, cursor } = require('sisteransi');

export default class SelectPrompt extends Prompt {
  constructor(opts={}) {
    super(opts);
    this.label = opts.label;
    this.hint = opts.hint ?? '';
    this.msg = opts.message;
    this.value = opts.initial;
    this.choices = opts.choices || []
    this.initialValue = opts.initial || this.choices[0].value;
    this.cursor = this.choices.findIndex((c) => c.value === this.initialValue)
    this.search = null;
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
    this.cursor = this.choices.findIndex((c) => c.value === this.initialValue)
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

  delete() {
    this.search = null;
    this.render();
  }

  _(c, key) {
    if (this.timeout) clearTimeout(this.timeout);
    if (!Number.isNaN(Number.parseInt(c))) {
      const n = Number.parseInt(c) - 1;
      this.moveCursor(n);
      this.render();
      return this.submit();
    }
    this.search = this.search || '';
    this.search += c.toLowerCase();
    const choices = !this.search ? this.choices.slice(this.cursor) : this.choices;
    const n = choices.findIndex((c) => c.label.toLowerCase().includes(this.search));
    if (n > -1) {
      this.moveCursor(n);
      this.render();
    }
    this.timeout = setTimeout(() => {
      this.search = null;
    }, 500)
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

  highlight(label) {
    if (!this.search) return label;
    const n = label.toLowerCase().indexOf(this.search.toLowerCase());
    if (n === -1) return label;
    return [label.slice(0, n), color.underline(label.slice(n, n + this.search.length)), label.slice(n + this.search.length)].join('');
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
      this.done ? '' : this.hint ? (this.out.columns < 80 ? '\n' + ' '.repeat(8) : '') + color.dim(` (${this.hint})`) : '',
      '\n',
    ];

    const prefix = ' '.repeat(strip(this.label).length);

    if (this.done) {
      this.outputText.push(`${prefix} `, color.dim(`${this.choices[this.cursor]?.label}`));
    } else {
      this.outputText.push(this.choices.map((choice, i) => i === this.cursor ? `${prefix} ${color.green(useAscii() ? '>' : '●')} ${this.highlight(choice.label)} ${choice.hint ? color.dim(choice.hint) : ''}` : color.dim(`${prefix} ${useAscii() ? '—' : '○'} ${choice.label} `)).join('\n'))
    }
    this.outputText = this.outputText.join('')

    this.out.write(erase.line + cursor.to(0) + this.outputText);
  }
}
