---
title: Command Timing Bash Prompt
layout: post
published: false
---

Or how I learned to stop worrying and love bash.
===

A few years ago I was using zsh using Sindre Sorhus's
[Pure prompt](https://github.com/sindresorhus/pure) and generally enjoying
the experience. The big, dumb, obvious caveat of using zsh is that it's not bash.
As a result, when you ssh into production machines that only have bash, you
feel a little off-balance. _Off-balance_ not a feeling you want during an emergency,
ssh'd into a live application server. As a result, I switched back to using
bash everywhere.

I never really missed fancy syntax highlighting, or the nice globbing
features, or most of zsh really. The one thing I missed immensely was not so
much a feature of zsh as it was a feature of the Pure prompt I had been using:
execution time for long-running commands shown in the prompt.

You see, by the time you think, "I should have run that last command with
`time`," it is already way too late to have started that last command
with `time`. [The Pure prompt is fancy](https://github.com/sindresorhus/pure/blob/master/pure.zsh#L46-L53).
By default, if a particular command takes longer than 5 seconds to run, Pure
calculates the running time of that command, and renders a human-readable
version just above your current prompt.

```
~
❯ sleep 5

~ 5s
❯ sleep 10

~ 10s
❯ 
```

Bash it until it works
===

Command execution time in Pure uses the preexec feature of zsh, which doesn't have
immediately obvious analogs in bash.

