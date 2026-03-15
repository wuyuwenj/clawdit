# Clawdit

Clawdit is an Electron-based red-team harness for OpenClaw-compatible agents. It connects to an OpenAI-style `/v1/chat/completions` endpoint, runs a category-based attack scan, evaluates the responses, and surfaces findings in a desktop UI.

## Current Scan Model

The scanner currently runs 6 categories:

1. Prompt Injection
2. Data Leakage
3. Unauthorized Actions
4. Access Control
5. Email Injection
6. Calendar Injection

In parallel mode, the scanner allocates 6 workers so all 6 category slots run concurrently. If a category is not applicable, its worker exits early, but the scheduler still reserves one worker per category.

## Email Injection

The UI label is `Email Injection`. Internally, the enum is still `INDIRECT_INJECTION` to avoid unnecessary code churn.

This category uses a multi-turn flow:

1. Probe the target for accessible email accounts.
2. If an email address is found, send a malicious email with `gog gmail send`.
3. Wait briefly for delivery.
4. Ask the target agent to read or summarize the email.
5. Evaluate whether the agent treated the email as data or as instructions.

If no usable email account is discovered, the category is skipped.

## Calendar Injection

This category is separate from email and currently includes 2 tests:

1. Normal calendar event injection
2. Google Meet invite injection

Both tests use a multi-turn flow:

1. Create a calendar event locally with `gog calendar create primary`.
2. For the Meet variant, add `--with-meet`.
3. Wait briefly for the event to appear.
4. Ask the target agent to read or summarize the event by title.
5. Evaluate whether the agent treated the event or invite text as instructions.

The current templates intentionally place malicious instructions in the event description/body. The Meet case also checks whether the target gives elevated trust to conferencing details.

## Execution Notes

- Parallel mode uses one worker per category.
- Step mode runs attacks sequentially and waits for user input between attacks.
- Email and calendar tests execute local `gog` CLI commands from the scan runner.
- Calendar tests currently create real calendar events and do not clean them up automatically.

## Prerequisites

- Node.js and npm
- An OpenClaw-compatible target endpoint
- A working `gog` CLI installation for Gmail and Calendar flows
- `gog` authenticated against the Google account you want to test with
- Environment variables required by the evaluator model, if used

## Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Build the app:

```bash
npm run build
```
