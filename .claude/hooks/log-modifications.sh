#!/bin/bash
# Claude Code Hook — Log every file modification with filename, line numbers, and diff

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE=".claude/logs/modifications.log"

mkdir -p ".claude/logs"

# Helper: truncate long strings for readable log output
truncate_str() {
  local str="$1"
  local max="${2:-120}"
  if [ "${#str}" -gt "$max" ]; then
    echo "${str:0:$max}..."
  else
    echo "$str"
  fi
}

case "$TOOL_NAME" in
  Edit)
    FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
    OLD_STR=$(echo "$INPUT" | jq -r '.tool_input.old_string // empty')
    NEW_STR=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty')
    REPLACE_ALL=$(echo "$INPUT" | jq -r '.tool_input.replace_all // false')

    # Find the line number where the new content landed
    LINE_INFO=""
    if [ -f "$FILE_PATH" ] && [ -n "$NEW_STR" ]; then
      FIRST_NEW_LINE=$(echo "$NEW_STR" | head -1)
      LINE_NO=$(grep -nF "$FIRST_NEW_LINE" "$FILE_PATH" 2>/dev/null | head -1 | cut -d: -f1)
      [ -n "$LINE_NO" ] && LINE_INFO=" line $LINE_NO"
    fi

    # Count lines changed
    OLD_LINES=$(echo "$OLD_STR" | wc -l | tr -d ' ')
    NEW_LINES=$(echo "$NEW_STR" | wc -l | tr -d ' ')

    {
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "[$TIMESTAMP] EDIT  $FILE_PATH${LINE_INFO}"
      [ "$REPLACE_ALL" = "true" ] && echo "  mode      : replace_all"
      echo "  lines     : -$OLD_LINES / +$NEW_LINES"
      echo "  removed   :"
      echo "$OLD_STR" | head -5 | while IFS= read -r line; do echo "    - $(truncate_str "$line")"; done
      [ "$OLD_LINES" -gt 5 ] && echo "    - ... ($((OLD_LINES - 5)) more lines)"
      echo "  added     :"
      echo "$NEW_STR" | head -5 | while IFS= read -r line; do echo "    + $(truncate_str "$line")"; done
      [ "$NEW_LINES" -gt 5 ] && echo "    + ... ($((NEW_LINES - 5)) more lines)"
      echo ""
    } >> "$LOG_FILE"
    ;;

  Write)
    FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
    CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty')
    TOTAL_LINES=$(echo "$CONTENT" | wc -l | tr -d ' ')
    IS_NEW=$( [ -f "$FILE_PATH" ] && echo "overwrite" || echo "new file" )

    {
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "[$TIMESTAMP] WRITE $FILE_PATH  ($IS_NEW, $TOTAL_LINES lines)"
      echo "  preview   :"
      echo "$CONTENT" | head -5 | while IFS= read -r line; do echo "    $(truncate_str "$line")"; done
      [ "$TOTAL_LINES" -gt 5 ] && echo "    ... ($((TOTAL_LINES - 5)) more lines)"
      echo ""
    } >> "$LOG_FILE"
    ;;

  NotebookEdit)
    FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.notebook_path // empty')
    CELL_ID=$(echo "$INPUT" | jq -r '.tool_input.cell_id // empty')
    OPERATION=$(echo "$INPUT" | jq -r '.tool_input.operation // empty')
    NEW_SOURCE=$(echo "$INPUT" | jq -r '.tool_input.new_source // empty')

    {
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "[$TIMESTAMP] NOTEBOOK_EDIT  $FILE_PATH"
      echo "  cell      : $CELL_ID"
      echo "  operation : $OPERATION"
      if [ -n "$NEW_SOURCE" ]; then
        echo "  content   :"
        echo "$NEW_SOURCE" | head -5 | while IFS= read -r line; do echo "    $(truncate_str "$line")"; done
      fi
      echo ""
    } >> "$LOG_FILE"
    ;;
esac

exit 0
