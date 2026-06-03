Write thorough Vitest unit tests for the following file: $ARGUMENTS

Testing conventions:
* Use Vitest with React Testing Library
* Place test files in a `__tests__` directory in the same folder as the source file
* Name test files as `[filename].test.ts(x)`
* Use `@/` prefix for imports

Coverage:
* Test happy paths
* Test edge cases
* Test error states

After writing the tests, run them with:
```
npx vitest run <path-to-test-file>
```

Fix any failures before reporting done.
