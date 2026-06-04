#!/bin/bash
# PostToolUse hook — runs code-reviewer agent on the edited file only

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

case "$TOOL_NAME" in
  Edit|Write) ;;
  *) exit 0 ;;
esac

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$FILE_PATH" ] && exit 0

# Only review TypeScript/JavaScript source files
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac

REVIEW=$(claude \
  --agent code-reviewer \
  --print \
  --allowedTools "Read,Bash" \
  "Review ONLY this file for security issues and best practices: $FILE_PATH

Do not read other files unless directly needed to understand a security concern.
Focus on:
  - P0 Security: injection, broken auth, secrets exposure, missing input validation, CSRF
  - P1 Best practices: swallowed errors, resource leaks, unsafe casts, broken API contracts

Skip style, formatting, and speculative concerns.
If no real issues found, output exactly: LGTM" 2>&1)

# Feed results back to Claude only when real issues are found
if echo "$REVIEW" | grep -qiE "(Critical|High|Warning|P0|P1|Vulnerability|Risk)" \
   && ! echo "$REVIEW" | grep -qi "^LGTM"; then
  echo "=== Code Review: $(basename "$FILE_PATH") ==="
  echo "$REVIEW"
  exit 2
fi

exit 0
