import { $ } from 'bun';

// If environment is not test, exit
if (process.env.NODE_ENV !== 'test') {
  process.exit(0);
}

// Run "bun test:clear-db" in the console
await $`bun test:clear-db`;
