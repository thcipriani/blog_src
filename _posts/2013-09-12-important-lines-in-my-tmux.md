---
layout: post
title: Knowledge Nuggets From My Tmux.conf
---

When I switched from GNU Screen to Tmux, I was just jazzed that Tmux _had_ a 
status bar. To achieve that same effect in Screen I had a cryptic 
115-character `hardstatus` string that I copy&#8211;pasted from someplace 
lost to the annals of the Internet Archive.

It wasn&#8217;t too long after I made the switch until I felt that old 
hacker itch and began scouring Github for Tmux tips.

## Tmux Tips for the Uninitiated

<ol>
<li>
`Ctrl`-`f` Meta is for super stars

I used to always bind `Ctrl`-`a` to Meta to make Tmux behave like Screen; 
however, when you use Screen inside Tmux (as I often do with our AWS servers), 
hitting `Ctrl`-`a` `a` can get pretty tiresome. Plus, you can&#8217;t use 
Readline very effectively without `Ctrl`-`a`

{% highlight bash %}
unbind-key C-b #no more Ctrl-b
# Switch me to ^f, thanks
set-option -g prefix C-f
bind-key f send-prefix
{% endhighlight %}
</li>

<li>
Faster escape

When I first started using Tmux I couldn&#8217;t stand the amount of time it
took to enter copy-mode. Then I realized&#8212;I didn&#8217;t have to.

{% highlight bash %}
set-option -sg escape-time 0
{% endhighlight %}
</li>

<li>
Maximize Panes

One of the things I love about Vim splits is that you can hit `Ctrl`-`|` to
maximize the current  pane and hit `Ctrl`-`=` to bring it back to an even 
split. Bringing that functionality to Tmux is very powerful and super easy.
This line will let you hit `Ctrl`-`|` to maximize a single pane and then hit
`Ctrl`-`|` again to bring it back to the original split.

{% highlight bash %}
bind-key | resize-pane -Z \; display-message "Zoom zoom zoom"
{% endhighlight %}
</li>

<li>
Vim-esque system clipboard copy&#8211;paste

Sometimes system clipboard support from Vim isn&#8217;t enough. It&#8217;s 
convenient to be able to pull whatever is in your Tmux buffer onto your 
system clipboard (preferably without having to memorize any new keybindings 
and without overwriting any existing keybindings).

First, I set the window mode-keys to use Vi bindings:

{% highlight bash %}
set-window-option -g mode-keys vi
{% endhighlight %}

Next, I bind `Meta Esc` to enter Tmux copy-mode:

{% highlight bash %}
unbind-key [
bind-key Escape copy-mode
{% endhighlight %}

After that, I bind visual-selection and copy keys inside vi-copy mode to 
their Vim equivalents:

{% highlight bash %}
bind-key -t vi-copy 'v' begin-selection
bind-key -t vi-copy 'y' copy-selection
{% endhighlight %}

Finally, I bind `Meta y` to execute a shell command. This should work on either
Linux or OSX, although I&#8217;ve only tested this on OSX:

{% highlight bash %}
if-shell 'test "$(uname -s)" = "Darwin"' 'bind-key y run-shell "tmux show-buffer | pbcopy" \; display-message "Copied tmux buffer to system clipboard"'
if-shell 'test "$(uname -s)" = "Linux"' 'bind-key y run-shell "tmux show-buffer | xclip -sel clip -i" \; display-message "Copied tmux buffer to system clipboard"'
{% endhighlight %}
</li>

<li>
OSX Specific Tmux file

Even though Tmux and Vim are really popular on OSX&#8212;they are, essentially, 
broken. You have to do the whole `reattach-to-user-namespace` thing to get
Vim&#8217;s clipboard to play nicely inside Tmux. This mess makes your 
`tmux.conf` look more cluttered and makes your dotfiles a little less portable.
To fix this I keep an OSX Specific `tmux.conf`.

{% highlight bash %}
#dumb osx
if-shell 'test "$(uname)" = "Darwin"' 'source ~/.tmux-osx.conf'
{% endhighlight %}
</li>

<li>
Steve Losh&#8217;s Bad Wolf Status Bar

News Flash: Steve Losh makes cool looking stuff. In Steve&#8217;s version 
of this he uses a small script to get his unread email count from his local
offlineimap folder. In the version below I use a little bash script I wrote
to grab weather info (that I call weathermajig).

{% highlight bash %}
# Bad Wolf by Steve Losh
# =====================
set -g status-fg white
set -g status-bg colour234
# set -g status-bg default #set for transparent background
set -g window-status-activity-attr bold
set -g pane-border-fg colour245
set -g pane-active-border-fg colour39
set -g message-fg colour16
set -g message-bg colour221
set -g message-attr bold

# Custom status bar
# Powerline symbols: ⮂ ⮃ ⮀ ⮁ ⭤
set -g status-left-length 32
set -g status-right-length 150
set -g status-interval 5

# Lets add the current weather to our status bar—why? Well Why the french-toast not?
set -g status-left '#[fg=colour16,bg=colour254,bold] #S #[fg=colour254,bg=colour238,nobold]⮀#[fg=colour15,bg=colour238,bold] #(weathermajig boulder --short) #[fg=colour238,bg=colour234,nobold]⮀'

set -g status-right '#[fg=colour245]⮃ %R ⮃ %d %b #[fg=colour254,bg=colour234,nobold]#(rdio-current-track-tmux)⮂#[fg=colour16,bg=colour254,bold] #h '

set -g window-status-format "#[fg=white,bg=colour234] #I #W "
set -g window-status-current-format "#[fg=colour234,bg=colour39]⮀#[fg=colour16,bg=colour39,noreverse,bold] #I ⮁ #W #[fg=colour39,bg=colour234,nobold]⮀"
{% endhighlight %}
</li>
