# @astrojs/cli-kit

## 0.4.1

### Patch Changes

- 3689076: Adds a new `tie` option to the `say` function

## 0.4.0

### Minor Changes

- fbec51e: Adds a new `tasks` utility that displays a spinner for multiple, sequential tasks.

  ```js
  import { tasks } from "@astrojs/cli-kit";

  const queue = [
    {
      pending: "Task 1",
      start: "Task 1 initializing",
      end: "Task 1 completed",
      // async callback will be called and awaited sequentially
      while: () => someAsyncAction(),
    },
    // etc
  ];

  const labels = {
    start: "Project initializing...",
    end: "Project initialized!",
  };

  await tasks(labels, queue);
  ```

## 0.3.1

### Patch Changes

- de0ef35: Added onError functionality to spinner to handle errors if while arg throws an error

## 0.3.0

### Minor Changes

- d1b4e01: Fix types not working properly under moduleResolution: 'node16'

## 0.2.5

### Patch Changes

- 98fe7c3: Fix nested promises in `say`
- 98fe7c3: Revert Houston wrapping

## 0.2.4

### Patch Changes

- 4c8e088: Allow Houston to line wrap
- fb2f11f: add support for ctrl+n and ctrl+p navigation in multiselect prompt
- 171a7fe: Allow messages to be async

## 0.2.3

### Patch Changes

- 9fd538f: Respect Ctrl + C when spinner is active

## 0.2.2

### Patch Changes

- Update project names

## 0.2.1

### Patch Changes

- d24e9ee: Fix line spacing for spinner

## 0.2.0

### Minor Changes

- d64ab0b: Expose `stdout` hooks to all functions

## 0.1.6

### Patch Changes

- 1daaad1: Hopefully fixes input locking issue

## 0.1.5

### Patch Changes

- b686135: Make Houston friendly again (whoops)

## 0.1.4

### Patch Changes

- 1c61aa5: Ensure setRawMode is only called when `process.stdin.isTTY`

## 0.1.3

### Patch Changes

- update ascii/unicode logic, expose `forceUnicode` util

## 0.1.2

### Patch Changes

- Fix useAscii logic

## 0.1.1

### Patch Changes

- Update `isWin` util to respect a `FORCE_UNICODE` process.env variable

## 0.1.0

### Minor Changes

- 40d2a47: Improve Windows compatability

## 0.0.4

### Patch Changes

- 703ec77: Close readline when animation is done

## 0.0.3

### Patch Changes

- fix clear issue

## 0.0.2

### Patch Changes

- Fix utils types
