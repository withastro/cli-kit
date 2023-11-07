import readline from "node:readline";
import chalk from "chalk";
import { createLogUpdate } from "log-update";
import { erase, cursor } from "sisteransi";
import { sleep } from "../utils/index.js";

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
  let interval: NodeJS.Timeout;

  const rl = readline.createInterface({ input: stdin, escapeCodeTimeout: 50 });
  readline.emitKeypressEvents(stdin, rl);

  if (stdin.isTTY) stdin.setRawMode(true);
  const keypress = (char: string) => {
    if (char === "\x03") {
      spinner.stop();
      process.exit(0);
    }
    if (stdin.isTTY) stdin.setRawMode(true);
    stdout.write(cursor.hide + erase.lines(1));
  };

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
        logUpdate(`${frame}  ${text}`);
        if (!done) await sleep(90);
        loop();
      };

      loop();
    },
    stop() {
      done = true;
      stdin.removeListener("keypress", keypress);
      clearInterval(interval);
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
    const loading = await gradient(chalk.green(start), { stdin, stdout });

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