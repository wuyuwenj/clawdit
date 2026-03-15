# Clawdit

Clawdit is a desktop app that tests how easily an AI assistant can be tricked, misled, or pushed into unsafe behavior.

It is made for people who want a fast, visual way to check whether an assistant stays careful when it sees suspicious messages, risky requests, emails, or calendar invites.

## What It Does

Clawdit connects to your assistant and runs a safety check across 6 areas:

1. Tricking the assistant into ignoring its rules
2. Getting it to reveal private or hidden information
3. Pushing it to take actions it should not take
4. Pretending to be someone powerful and trusted
5. Hiding harmful instructions inside email
6. Hiding harmful instructions inside calendar events or meeting invites

It shows the results live while the scan is running, then gives you a score and a clear summary of what it found.

## How It Works

Before testing begins, Clawdit looks up recent real-world attack ideas so the scan is not limited to the same fixed examples every time.

It then starts with its built-in checks right away, while also preparing extra fresh test ideas in the background. This keeps the scan moving quickly without giving up the benefit of newer attack patterns.

## Email Checks

Clawdit can test whether an assistant treats an email like normal information or accidentally treats it like an instruction.

In simple terms, it:

1. Finds the signed-in email account
2. Sends a test email with hidden harmful instructions inside it
3. Asks the assistant to read or summarize that email
4. Checks whether the assistant stayed careful or followed what the email said

If no email account is available, this part is skipped.

## Calendar Checks

Clawdit can also test whether an assistant is too trusting of calendar content.

It currently uses 2 calendar cases:

1. A normal calendar event
2. A Google Meet invite

For each one, Clawdit creates the event, asks the assistant to look it up, and checks whether the assistant treats the event text as just information or as something it should obey.

## What You See During a Scan

While the scan runs, Clawdit shows:

- a live activity log
- the current stage of the scan
- which test areas are running
- individual test results as they come in
- a final score based only on the areas that actually ran

The log does not force itself to the bottom while you are reading older lines, so you can inspect activity during a live run without losing your place.

## Notes

- Clawdit runs all 6 test areas at the same time when possible to keep scans fast.
- Some checks may be skipped if the needed account or feature is not available.
- Calendar tests currently create real events and do not remove them afterward.

## Running It

If you are running the app yourself:

```bash
npm install
npm run dev
```

To create a production build:

```bash
npm run build
```
