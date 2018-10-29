# Conflict resolution for event logs

Quick example implementation of conflict resolution for event log applications. See https://blog.mikeauclair.com/2018/10/26/fractional-source-of-truth-log-pt2.html for more information

Relevant files
```
src
|
|--- handler.ts (handles sets of events)
|--- handler.spec.ts (tests for above)
|--- example.ts (example runner)
```

Install stuff with `npm install` (requires node 6-ish+)

Run tests with `npm test`, run example runner with `npm start`
