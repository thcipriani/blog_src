---
title: Toward a More Useful X Keyboard
layout: post
---

I'm not sure when, exactly, it became clear that I was going to spend as
much time as necessary perfecting my keyboard configuration. It's one of
those things that you _know_ you can make absolutely perfect—given enough
time and energy. On Linux, when you spend enough time bashing your brain
into a topic, you often find your effort rewarded manyfold. This is the
hallmark of a professional tool: a tool with which your efficiency
increases with your proficiency.

The way many people first experience a computer is through a
point-and-click-style mouse interface. While there are
professional tools that prefer a [mouse interface](http://research.swtch.com/acme),
and there is [healthy](http://www.loper-os.org/?p=861) [debate](http://99percentinvisible.org/episode/of-mice-and-men/)
about the most appropriate tool for computer interaction,
the fact remains: most professional computing and programming is
done with a QWERTY keyboard.

My endless `X` keyboard tinkerings have given me the most efficient
keyboard configuration I have ever used. This configuration is probably
achievable on other platforms; however, on a modern Linux system
my configuration only requires one tool that isn't included with the kernel:
[XCape](https://github.com/alols/xcape), which is 500 lines of GPL-licensed
C-code—not too shabby overall.

* [Keymaps](#keymaps)
* [Key Autorepeat](#autorepeat)
* [Persistence](#persist)

<div id="keymaps"></div>
# Keymaps

To start working with keyboard layout the lowest-risk command is `setxkbmap(1)`.
`setxkbmap` temporarily maps the keyboard to use options specified on the command line.
Changes will not persist when you restart `X` (i.e., log out and log back in).
This is a good place to start experimenting with configuration and layouts.

The options that can be applied with `setxkbmap` are found in
`xkeyboard-config(7)`. For whatever reason, neither my Debian nor Arch box
has this man file. I found
[one copy](https://web.archive.org/web/20150125024107/http://www.dsm.fordham.edu/cgi-bin/man-cgi.pl?topic=xkeyboard-config&ampsect=7)
online and made sure to snapshot it in the
[internet archive](https://web.archive.org)—which is a project to which I plan to
donate more heavily in the upcoming year.

To view currently applied options use: `setxkbmap -query` which should
output something like:

{% highlight bash %}
rules:      evdev
model:      pc105
layout:     us
{% endhighlight %}

To achieve this with `setxkbmap` you would type in your xterm:
`setxkbmap -model pc105 -layout us`

This is a pretty vanilla setup—when you setup your computer and accept
the defaults, this is what you get.

<div id="altgr-intl"></div>
## AltGr-Intl

One of the features I find myself using
frequently is the [AltGr](https://en.wikipedia.org/wiki/AltGr_key) (or _Alternate Graphic_) key.
I like to be able to type international characters that are often used in
English (like "é") without resorting to using deadkeys or
esoteric key-compostability sequences.

{% highlight bash %}
"é" == [Right Alt] + [e]
"ñ" == [Right Alt] + [n]
"ö" == [Right Alt] + [p]
{% endhighlight %}

To enable this simply use the `setxkbmap` command:

{% highlight bash %}
setxkbmap -model pc105 -layout us -variant altgr-intl
{% endhighlight %}

More information about the *AltGr-Intl* layout can be found in the
[Xorg Mailing List](http://lists.x.org/archives/xorg/2007-July/026534.html)
(found via [Shinobu's Secrets](https://zuttobenkyou.wordpress.com/2011/08/24/xorg-using-the-us-international-altgr-intl-variant-keyboard-layout/))

<div id="xcompose"></div>
## `~/.XCompose`

Text expansion is awesome. Being able to type a sequence of three characters
to dump your public key into IRC is awesome. Or how about `ಠ_ಠ`? Being able
to express disapproval quickly is what separates our emails from those of
animals: it's why we have civilization.

The [compose](https://en.wikipedia.org/wiki/Compose_key) (or _MultiKey_) key, can be mapped
to any number of keys or key combinations (again, see: [xkeyboard-config(7)](https://web.archive.org/web/20150125024107/http://www.dsm.fordham.edu/cgi-bin/man-cgi.pl?topic=xkeyboard-config&ampsect=7))
I prefer to map my MultiKey to the right Ctrl key:

{% highlight bash %}
setxkbmap -model pc105 -layout us -variant altgr-intl -option compose:rctrl
{% endhighlight %}

To type special symbols or expansions using the compose key, simply hit the
compose key (in my case right Ctrl) and then type the additional character for the
combination in sequence.

For instance, to make a degree mark ("°") I type: `[Ctrl]-o-o`; just like I'm
typing "oo", but I hit the right Ctrl key first.

The real magic of the compose key can be unleashed with the `~/.XCompose` file.
This is the file into which you can drop your custom key combination mappings
that will generate any text output.

Example expansions for [`~/.XCompose`](https://github.com/thcipriani/dotfiles/blob/master/XCompose):

{% highlight bash %}
# Quick ssh key output
<Multi_key> <k> <e> <y> : "https://gist.github.com/thcipriani/5e95399457da6544a4cb"

<Multi_key> <S> <N> <O> <W>     : "❄"   U2603
<Multi_key> <p> <l> <a> <n> <e> : "✈"   U2708
<Multi_key> <z> <a> <p>         : "⚡"   U26A1

# prefix 'm' = mathematical symbols
<Multi_key> <m> <d> : "Δ"
<Multi_key> <m> <e> : "ϵ"
<Multi_key> <m> <l> : "λ"

# misc
<Multi_key> <colon> <bar> <bar> : "ಠ_ಠ"
<Multi_key> <less> <3> : "❤"
{% endhighlight %}

<div id="capslock"></div>
## You're out of your element, CapsLock

CapsLock sucks and everyone hates it.

People _think_ they use CapsLock, but, _I_ think, if people were honest with
themselves they would admit that CapsLock is the worse than useless: it's
usually counter-productive. Also, if you find yourself frequently needing
to type in ALL CAPS, maybe you should look at life:
_what have you become_?

I like to remap my CapsLock key to a modifier key I use more frequently: Ctrl.

{% highlight bash %}
setxkbmap \
  -model pc105 \
  -layout us \
  -variant altgr-intl \
  -option compose:rctrl \
  -option ctrl:nocaps
{% endhighlight %}

<div id="xcape"></div>
## XCape

The other function of my CapsLock key only happens when it is pressed without
any additonal keys. Basically, if I hit `CapsLock+[t]`, I want a new tab,
but if I just hit `CapsLock`, it doesn't do anything—which _was_ a waste.

The program [XCape](https://github.com/alols/xcape) allows you to configure
modifier keys (Alt, Ctrl, Shift, Meta) to act as other keys when pressed
on their own. And, since the CapsLock key is so central on my keyboard, I
also use it as an escape key. Compiling `xcape` is pretty straight forward
(provided you have the requisite build tools):

{% highlight bash %}
git clone https://github.com/alols/xcape.git .
cd xcape && make
{% endhighlight %}

The command that allows for that functionality is also pretty straight-forward:

{% highlight bash %}
xcape -e 'Control_L=Escape'
{% endhighlight %}

Finally, I also use the option that allows `[Ctrl]+[Alt]+[Backspace]` to
end an `X` session. So my final `setxkbmap` looks like:

{% highlight bash %}
setxkbmap \
  -model pc105 \
  -layout us \
  -variant altgr-intl \
  -option compose:rctrl \
  -option ctrl:nocaps \
  -option terminate:ctrl_alt_bksp
{% endhighlight %}

<div id="autorepeat"></div>
# Key Autorepeat

There are some keyboard options that cannot be set via `setxkbmap`. The
`AutoRepeat` option was removed from the `X` keyboard driver (`kbd(4)`) as
of [version 1.4.0](https://bugzilla.redhat.com/show_bug.cgi?id=601853).

The only recourse is using `xset(1)`, the `X` user-preference utility. An infinitely
customizable keyrate is one of the many luxuries of using a Linux keyboard.

There are two main options that matter for me in `xset` that affect the
autorepeat rate: AutoRepeatDelay and AutoRepeatRate

The syntax for `xset` autorepeat is:

{% highlight bash %}
xset [-r keycode] rate [AutoRepeatRate] [AutoRepeatDelay]
{% endhighlight %}

By omitting the `-r keycode` you apply the `rate` to all keys (e.g.,
`xset -r 10` will apply the `rate` settings only to the "1" key). The
default AutoRepeatDelay is 660ms and the default AutoRepeatRate is 25Hz,
which is fine, but after tweaking this rate and living with it for a few
days it will seem _unbearably slow_. My settings are:

{% highlight bash %}
xset r rate 330 75
{% endhighlight %}

These settings half the time I spend waiting for a key to auto-repeat, and
triple the rate at which that auto-repeat fires.

While mentioning `xset` it's also worth mentioning that I hate HATE the system beep.
It's that beep that happens when you double-tab Tab in Bash, or try to
backspace beyond the beginning of a line (which happens a lot with a fast
AutoRepeatRate). You can probably disable it many ways in `X`, but I use:

{% highlight bash %}
xset -b
{% endhighlight %}

<div id="persist"></div>
# Persistence

By placing the `setxkbmap` command, the `xcape` command, and the two `xset`
commands shown above into `~/.xinitrc`, that configuration will load
whenever `X` is started.

{% highlight bash %}
#!/usr/bin/env bash
#
# ~/.xinitrc
#
has?() {
    command -v "$1" > /dev/null 2>&1
}

# Keyboard stuffs
# ---
# * use right-alt as Alt-Gr key ($ → £)
# * use right ctrl key as compose (ctrl 1 2 → ½)
# * use ctrl+alt+bksp to restart `X`
# * Capslock → Ctrl
# * Alt-Gr + Space = nbsp/Alt-Gr + Shift + Space = shy nbsp
setxkbmap \
  -layout us \
  -variant altgr-intl \
  -option compose:rctrl \
  -option terminate:ctrl_alt_bksp \
  -option ctrl:nocaps

xset -b            # Stop beeping at me (A.K.A turn off PC speaker)
xset r rate 330 60 # Set keyboard repeat rate

has? xcape && xcape -e 'Control_L=Escape' # https://github.com/alols/xcape
{% endhighlight %}

`~/.xinitrc` will NOT, however, keep those configurations when an external
USB keyboard is added to the mix.

The configuration loaded by `setxkbmap` can easily become persistent
since it is part of the `X` keyboard driver. I have the following in a
file at `/etc/X11/xorg.conf.d/10-keyboard.conf`:

{% highlight bash %}
Section "InputDevice"
  Identifier "Muh Keyboard"
  MatchIsKeyboard "true"
  Option "xkblayout" "us"
  Option "xkbvariant" "altgr-intl"
  Option "Xkboptions" "compose:rctrl"
  Option "Xkboptions" "terminate:ctrl_alt_bksp"
  Option "Xkboptions" "ctrl:nocaps"
EndSection
{% endhighlight %}

The `xset` commands and `xcape` daemon are a bit more difficult to persist
when attaching external keyboards.

In the lazy past, I created a file in my `~/bin/` directory
(which, in my case, is on my `$PATH`) that I ran manually whenever a new
keyboard was attached.

{% highlight bash %}
#!/usr/bin/env bash
#
# ~/bin/keyboard—In case of new keyboard, break gla...er...I mean...run this.
#

(
  sleep 1

  DISPLAY=:0.0 xset -b
  DISPLAY=:0.0 xset r rate 330 60
  xcape -e 'Control_L=Escape'
  DISPLAY=:0.0 notify-send "External USB Connected"
) &
{% endhighlight %}

Getting over to my terminal and typing: `keyboard` everytime I attached a
new keyboard is pretty far from _perfect_.

So what are my other options? Initially, I thought about doing something with
`acpid(8)` ([since I use that a ton](https://github.com/thcipriani/acpi)), which would have been easy
enough. `acpid` notifies user-space utilities about system events, which
includes when devices are attached.

After reading a great post from [Pat Brisbin](http://pbrisbin.com/posts/disable_all_the_caps/)
about udev events, I thought (and think) that's the answer. You can probably
tell that my `~/bin/keyboard` script has evolved to accommodate what he outlined
in his article. In any event (pun intended), I created a file at `/etc/udev/rules.d/99-usb-keyboards.rules`
with the following contents:

{% highlight bash %}
SUBSYSTEM=="input", ACTION=="add", RUN+="/bin/su tyler --shell=/bin/bash -c /home/tyler/bin/keyboard"
{% endhighlight %}

Which seems to do the trick!

The configuration you see above is the result of _way too much_ thinking
about how I use my keyboard. Now, I just need to get this configuration to
work *without* `X` Server..._le sigh_
