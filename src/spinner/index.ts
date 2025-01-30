import readline from "node:readline";
import chalk from "chalk";
import { createLogUpdate } from "log-update";
import { createRequire } from 'node:module';
import { sleep } from "../utils/index.js";

const require = createRequire(import.meta.url);
const { erase, cursor } = require("sisteransi");

const COLORS = [
  "#883AE3",
  "#7B30E7",
  "#6B22EF",
  "#5711F8",
  "#3640FC",
  "#2387F1",
  "#3DA9A3",
  "#47DA93",
].reverse();

const FULL_FRAMES = [
  ...Array.from({ length: COLORS.length - 1 }, () => COLORS[0]),
  ...COLORS,
  ...Array.from({ length: COLORS.length - 1 }, () => COLORS[COLORS.length - 1]),
  ...[...COLORS].reverse(),
];

const frame = (offset = 0) => {
  const frames = FULL_FRAMES.slice(offset, offset + (COLORS.length - 2));
  if (frames.length < COLORS.length - 2) {
    const filled = new Array(COLORS.length - frames.length - 2).fill(COLORS[0]);
    frames.push(...filled);
  }
  return frames;
};

// get a reference to scroll through while loading
// visual representation of what this generates:
// gradientColors: "..xxXX"
// referenceGradient: "..xxXXXXxx....xxXX"
const GRADIENT = [...FULL_FRAMES.map((_, i) => frame(i))].reverse();

function getGradientAnimFrames() {
  return GRADIENT.map(
    (colors) => " " + colors.map((g) => chalk.hex(g)("█")).join("")
  );
}

/**
 * Generate loading spinner with rocket flames!
 * @param text display text next to rocket
 * @returns Ora spinner for running .stop()
 */
async function gradient(
  text: string,
  { stdin = process.stdin, stdout = process.stdout } = {}
) {
  const logUpdate = createLogUpdate(stdout);
  let i = 0;
  const frames = getGradientAnimFrames();

  const rl = readline.createInterface({ input: stdin, escapeCodeTimeout: 50 });
  readline.emitKeypressEvents(stdin, rl);

  if (stdin.isTTY) stdin.setRawMode(true);
  const keypress = (char: string) => {
    if (char === "\x03") {
      spinner.stop();
      process.exit(0);
    }
    if (stdin.isTTY) stdin.setRawMode(true);
    stdout.write(cursor.hide + erase.lines(text.split('\n').length));
  };

  let refresh = () => {};
  let done = false;
  const spinner = {
    start() {
      stdout.write(cursor.hide);
      stdin.on("keypress", keypress);
      logUpdate(`${frames[0]}  ${text}`);

      const loop = async () => {
        if (done) return;
        if (i < frames.length - 1) {
          i++;
        } else {
          i = 0;
        }
        let frame = frames[i];
        refresh = () => logUpdate(`${frame}  ${text}`);
        refresh();
        if (!done) await sleep(90);
        loop();
      };
      loop();
    },
    update(value: string) {
      text = value;
      refresh();
    },
    stop() {
      done = true;
      stdin.removeListener("keypress", keypress);
      logUpdate.clear();
      rl.close();
    },
  };
  spinner.start();
  return spinner;
}

export async function spinner(
  {
    start,
    end,
    onError,
    while: update = () => sleep(100),
  }: { start: string; end: string; onError?: (e: any) => void; while: (...args: any) => Promise<any> },
  { stdin = process.stdin, stdout = process.stdout } = {}
) {
    const loading = await gradient(start, { stdin, stdout });
    const act = update();
    const tooslow = Object.create(null);

    try {
        const result = await Promise.race([sleep(500).then(() => tooslow), act]);
        if (result === tooslow) {
            await act;
        }
        stdout.write(`${" ".repeat(5)} ${chalk.green("✔")}  ${chalk.green(end)}\n`);
    } catch (e) {
        onError?.(e);
    } finally {
        loading.stop();
    }
}

const TASK_SUCCESS_FLASH = 750;
const TASK_INDENT = 5;
export interface Task {
  start: string,
  end: string,
  pending: string;
  onError?: (e: any) => void;
  while: (...args: any) => Promise<any>
}

function formatTask(task: Task, state: 'start' | 'end' | 'pending' | 'success') {
  switch (state) {
    case 'start': return `${" ".repeat(TASK_INDENT + 3)} ${chalk.cyan(`▶ ${task.start}`)}`;
    case 'pending': return `${" ".repeat(TASK_INDENT + 3)} ${chalk.dim(`□ ${task.pending}`)}`;
    case 'success': return `${" ".repeat(TASK_INDENT + 3)} ${chalk.green(`✔ ${task.end}`)}`;
    case 'end': return `${" ".repeat(TASK_INDENT + 3)} ${chalk.dim(`■ ${task.end}`)}`;
  }
}
/**
 * Displays a spinner while executing a list of sequential tasks
 * Note that the tasks are not parallelized! A task is implicitly dependent on the tasks that preceed it.
 *
 * @param labels configures the start and end labels for the task queue
 * @param tasks is an array of tasks that will be displayed as a list
 * @param options can be used to the source of `stdin` and `stdout`
 */
export async function tasks({ start, end }: { start: string, end: string}, t: Task[], { stdin = process.stdin, stdout = process.stdout } = {}) {
  let text: string[] = Array.from({ length: t.length + 1 }, () => '');
  text[0] = start;
  t.forEach((task, i) => {
    const state = i === 0 ? 'start' : 'pending';
    text[i + 1] = formatTask(task, state);
  })
  const loading = await gradient(text.join('\n'), { stdin, stdout });

  const refresh = () => loading.update(text.join('\n'));

  let action;
  let i = 0;
  let timeouts: NodeJS.Timeout[] = [];

  for (const task of t) {
    i++;
    text[i] = formatTask(task, 'start');
    refresh();
    action = task.while();
    try {
        await action;
        text[i] = formatTask(task, 'success');
        refresh();

        const active = { i, task };
        timeouts.push(
          setTimeout(() => {
            const { i, task } = active;
            text[i] = formatTask(task, 'end');
            refresh();
          }, TASK_SUCCESS_FLASH)
        )
    } catch (e) {
        loading.stop();
        task.onError?.(e);
    }
  }
  for (const timeout of timeouts) {
    clearTimeout(timeout);
  }
  await sleep(TASK_SUCCESS_FLASH);
  loading.stop();
  text[0] = `${" ".repeat(TASK_INDENT)} ${chalk.green("✔")}  ${chalk.green(end)}`;
  t.forEach((task, i) => {
    text[i + 1] = formatTask(task, 'end')
  })
  console.log(text.join('\n'));
}
