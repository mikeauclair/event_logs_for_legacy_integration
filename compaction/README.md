# Compacting event logs

Example code for this post https://blog.mikeauclair.com/blog/2018/12/04/fractional-source-of-truth-log-pt3.html

Relevant files (in this directory)
```
src
|
|--- handler.ts (handles sets of events)
|--- handler.spec.ts (tests for above, unchanged from `conflict` implementation)
|--- example.ts (example runner)
|--- output_lenses.ts (lens definitions)
|--- lense_example.spec.ts (runnable examples from the blog post)
```

Shared stuff is in the `shared` sibling to this directory

Install stuff with `npm install` (requires node 6-ish+)

Run tests with `npm test`, run example runner with `npm start`
