#!/usr/bin/env bash
# PreToolUse (Bash): ask the user before any command that targets the production database,
# i.e. the :prod npm scripts, .env.production, ALLOW_REMOTE_DB, a libsql:// URL or turso db shell.
cmd=$(jq -r '.tool_input.command // ""')
if printf '%s' "$cmd" | grep -Eq '(:prod([^a-zA-Z0-9_-]|$)|\.env\.production|ALLOW_REMOTE_DB|libsql://|turso +db +(shell|destroy|tokens))'; then
	jq -n '{
		hookSpecificOutput: {
			hookEventName: "PreToolUse",
			permissionDecision: "ask",
			permissionDecisionReason: "This command targets the PRODUCTION database (Turso) or its credentials. Only approve it if you meant to touch production."
		}
	}'
fi
exit 0
