---
"@astrojs/cli-kit": minor
---

Adds a new `tasks` utility that displays a spinner for multiple, sequential tasks.

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
