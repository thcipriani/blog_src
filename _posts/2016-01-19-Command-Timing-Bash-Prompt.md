---
title: Command Timing Bash Prompt
layout: post
---

A few years ago I was using ZSH with Sindre Sorhus's
[Pure prompt](https://github.com/sindresorhus/pure) and generally enjoying
the experience. The big, dumb, obvious caveat of using ZSH is that it's not Bash.
As a result, when you SSH into production machines that only have bash installed,
you feel a little off-balance. _Off-balance_ is not a feeling you want during an
emergency on a live application server. As a result, I switched
back to using bash everywhere.

How I learned to stop worrying and love bash.
===

I never really missed fancy syntax highlighting, or the nice globbing
features, or most of ZSH really. The one thing I missed immensely was not so
much a feature of ZSH as it was a feature of the Pure prompt I had been using:
execution time for long-running commands shown in the prompt.

The `time(1)` command is a command that I never think to run until it's too
late. [The Pure prompt is fancy](https://github.com/sindresorhus/pure/blob/master/pure.zsh#L46-L53).
By default, if a particular command takes longer than 5 seconds to run, Pure
calculates the running time of that command, and renders a human-readable
version just above your current prompt.

{% highlight bash %}
~
❯ sleep 5

~ 5s
❯ sleep 10

~ 10s
❯
{% endhighlight %}

Bash it until it works
===

Command execution time in Pure uses the `preexec` and `precmd` feature of
ZSH, which doesn't exist in Bash. Instead Bash has the less intuitive `trap`
command and the `PROMPT_COMMAND` shell variable.

`PROMPT_COMMAND` is a variable that can be set in your bash config file that,
"is executed as a command prior to issuing each primary prompt." [bash(1)]

`trap [-lp] [arg] [sigspec]` can be used to listen for the `DEBUG` signal.
"If a sigspec is DEBUG, the command arg is executed before every simple command"

Using these two tools in conjunction, you can approximate `preexec`  and `precmd`:

{% highlight bash %}
debug() {
    # do nothing if completing
    [[ -n "$COMP_LINE" ]] && return

    # don't cause a preexec for $PROMPT_COMMAND
    [[ "$BASH_COMMAND" == "$PROMPT_COMMAND" ]] && return

    echo 'debug'
}

prompt() {
    echo 'prompt'
}

trap 'debug' DEBUG
PROMPT_COMMAND=prompt
{% endhighlight %}

So now debug is executed before each "simple command" and `prompt` is executed
before each issuing the primary prompt.

{% highlight bash %}
$ echo 'hi'
debug
hi
prompt
{% endhighlight %}

Timing each command is then pretty trivial:

{% highlight bash %}
debug() {
    # do nothing if completing
    [[ -n "$COMP_LINE" ]] && return

    # don't cause a preexec for $PROMPT_COMMAND
    [[ "$BASH_COMMAND" == "$PROMPT_COMMAND" ]] && return

    start_time=$(date +'%s')
}

prompt() {
    end_time=$(date +'%s')

    echo "$(( end_time - start_time )) seconds"
}

trap 'debug' DEBUG
PROMPT_COMMAND=prompt
{% endhighlight %}

{% highlight bash %}
$ sleep 2
2 seconds
$
{% endhighlight %}

Integrating that into the prompt and making it look pretty is just a little-bit of code away:

{% highlight bash %}
# Human readable time output
# e.g., 5d 6h 3m 2s
format_time() {
  local _time=$1

  # Don't show anything if time is less than 5 seconds
  (( $_time < 5 )) && return

  local _out
  local days=$(( $_time / 60 / 60 / 24 ))
  local hours=$(( $_time / 60 / 60 % 24 ))
  local minutes=$(( $_time / 60 % 60 ))
  local seconds=$(( $_time % 60 ))
  (( $days > 0 )) && _out="${days}d"
  (( $hours > 0 )) && _out="$_out ${hours}h"
  (( $minutes > 0 )) && _out="$_out ${minutes}m"
  _out="$_out ${seconds}s"
  printf "$_out"
}

debug() {
    # do nothing if completing
    [[ -n "$COMP_LINE" ]] && return

    # don't cause a preexec for $PROMPT_COMMAND
    [[ "$BASH_COMMAND" == "$PROMPT_COMMAND" ]] && return

    start_time=$(date +'%s')
}

prompt() {
    end_time=$(date +'%s')
    time_f=$(format_time $(( end_time - start_time )))

    PS1="${time_f} (•◡•)❥"
}

trap 'debug' DEBUG
PROMPT_COMMAND=prompt
{% endhighlight %}

{% highlight bash %}
 (•◡•)❥ sleep 5
5s (•◡•)❥
{% endhighlight %}

Motherfucking magic.
