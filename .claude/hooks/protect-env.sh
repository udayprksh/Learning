#!/bin/bash
# Claude Code Hook — Block sensitive file access via Read or Bash tools

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

block() {
  echo "{\"decision\":\"block\",\"reason\":\"[protect-env] $1\"}"
  exit 2
}

is_sensitive_filename() {
  local name
  name=$(basename "$1")
  [[ "$name" == ".env" || "$name" == .env.* || "$name" == *.env ]] && return 0
  [[ "$name" == *.pem || "$name" == *.key || "$name" == *.p12 ]] && return 0
  return 1
}

# --- Read tool: check file_path ---
if [[ "$TOOL_NAME" == "Read" ]]; then
  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
  if [ -n "$FILE_PATH" ] && is_sensitive_filename "$FILE_PATH"; then
    block "'$FILE_PATH' is blocked — sensitive files must not be read by Claude."
  fi
  exit 0
fi

# --- Bash tool: scan the command string for sensitive file patterns ---
if [[ "$TOOL_NAME" == "Bash" ]]; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

  # Match any token that looks like a sensitive file path or filename
  # Covers: .env, .env.local, .env.production, foo.env, *.pem, *.key, *.p12
  if echo "$COMMAND" | grep -qE '(^|[[:space:]/])(\.env(\.[a-zA-Z0-9_-]+)?|[a-zA-Z0-9_-]+\.env|[a-zA-Z0-9_-]+\.(pem|key|p12))([[:space:]]|$|"|'"'"')'; then
    block "Bash command targets a sensitive file — blocked to prevent credential exposure."
  fi
  exit 0
fi

exit 0
