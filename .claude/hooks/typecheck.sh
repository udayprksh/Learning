#!/bin/bash
# Claude Code Hook — Run TypeScript type checking after editing .ts/.tsx files

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Resolve the modified file path
case "$TOOL_NAME" in
  Edit|Write)
    FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
    ;;
  *)
    exit 0
    ;;
esac

# Only run for TypeScript files
case "$FILE_PATH" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

# Walk up from the file to find the nearest tsconfig.json
PROJECT_ROOT=$(dirname "$FILE_PATH")
while [ "$PROJECT_ROOT" != "/" ]; do
  [ -f "$PROJECT_ROOT/tsconfig.json" ] && break
  PROJECT_ROOT=$(dirname "$PROJECT_ROOT")
done

if [ ! -f "$PROJECT_ROOT/tsconfig.json" ]; then
  exit 0
fi

# Run tsc (incremental + noEmit already set in tsconfig)
TSC_OUTPUT=$(cd "$PROJECT_ROOT" && npx tsc --noEmit 2>&1)
TSC_EXIT=$?

if [ $TSC_EXIT -ne 0 ]; then
  echo "TypeScript errors found after editing $FILE_PATH:"
  echo ""
  echo "$TSC_OUTPUT"
  exit 2
fi

exit 0
