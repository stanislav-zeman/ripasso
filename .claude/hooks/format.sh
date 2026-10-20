#!/usr/bin/env bash
# PostToolUse (Edit|Write): format the edited file with the project's Prettier, so `npm run lint`
# never fails on formatting. Files outside the project (e.g. scratch files) are left alone.
f=$(jq -r '.tool_response.filePath // .tool_input.file_path // empty')
root=${CLAUDE_PROJECT_DIR:-$(pwd)}
case "$f" in
	"$root"/*) "$root/node_modules/.bin/prettier" --write --ignore-unknown --log-level warn "$f" ;;
esac
