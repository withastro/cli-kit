import * as el from "./elements/index.js";
const noop = (v) => v;

function toPrompt(type, args, opts = {}) {
  return new Promise((res, rej) => {
    const p = new el[type](args, opts);
    const onAbort = opts.onAbort || noop;
    const onSubmit = opts.onSubmit || noop;
    const onExit = opts.onExit || noop;
    p.on("state", args.onState || noop);
    p.on("submit", (x) => res(onSubmit(x)));
    p.on("exit", (x) => res(onExit(x)));
    p.on("abort", (x) => rej(onAbort(x)));
  });
}

const prompts = {
  text: (args) => toPrompt("TextPrompt", args),
  confirm: (args) => toPrompt("ConfirmPrompt", args),
  select: (args) => toPrompt("SelectPrompt", args),
  multiselect: (args) => toPrompt("MultiselectPrompt", args),
};

/** @type {import('../../types.js').default} */
export default async function prompt(
  questions = [],
  { onSubmit = noop, onCancel = () => process.exit(0), stdin = process.stdin, stdout = process.stdout } = {}
) {
  const answers = {};
  questions = [].concat(questions);
  let answer, question, quit, name, type, lastPrompt;

  for (question of questions) {
    ({ name, type } = question);

    try {
      // Get the injected answer if there is one or prompt the user
      answer = await prompts[type](Object.assign({ stdin, stdout }, question));
      answers[name] = answer;
      quit = await onSubmit(question, answer, answers);
    } catch (err) {
      quit = !(await onCancel(question, answers));
    }

    if (quit) return answers;
  }
  return answers;
}
