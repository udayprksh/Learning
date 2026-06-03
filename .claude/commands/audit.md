# Audit

Review the codebase for issues across these areas:

1. **Security** — check for XSS, injection, exposed secrets, insecure auth patterns
2. **Performance** — unnecessary re-renders, large bundle imports, unoptimized queries
3. **Code quality** — dead code, duplicated logic, overly complex functions
4. **Error handling** — unhandled promise rejections, missing error boundaries
5. **Types** — `any` usage, missing types, unsafe casts

Report findings grouped by severity: Critical, Warning, Info.
