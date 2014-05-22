---
layout: post
title: Create a Baller/Useful MOTD with ANSI Art
image: http://tylercipriani-files.s3.amazonaws.com/zangief_motd.png
---
Everyone universally agrees that most [Message of the Days (MOTDs)](http://linux.die.net/man/5/motd)
are stupid and suck. By the end of reading this post, your mind grapes should be swollen with the knowledge
of how to make an MOTD that isn&#8217;t stupid and, some would say, _doesn&#8217;t_
suck.

## Prerequisites

* Imagemagick
* OpenJDK
* coreutils
* perl
* git

This should have you covered:

{% highlight bash %}
$ sudo apt-get install imagemagick openjdk-6-jdk coreutils perl git
{% endhighlight %}

## Creating the Util-say file

I use [Util-Say](https://github.com/maandree/util-say) to create motd messages.
I started out using [img2xterm](https://github.com/rossy2401/img2xterm),
but I&#8217;ve found I get better results with Util-Say.

{% highlight bash %}
$ git clone https://github.com/maandree/util-say
$ cd util-say
$ ./img2ponysay -- yourimg.png > yourimg.txt
{% endhighlight %}

You can also try `./img2ponysay -2 -- youimg.png > yourimg.txt` but I&#8217;ve never had good results with that

## MOTD-ifying

![Mammoth Motd](http://tylercipriani-files.s3.amazonaws.com/mammoth_motd.png)

On CentOS and Debian, I usually just throw the ponysay file directly into `/etc/motd` and maybe add on some other useful info:

{% highlight bash %}
$ sudo cat yourimg.txt > /etc/motd
$ sudo figlet "$(hostname)" >> /etc/motd
$ sudo printf "Public IP: $(dig +short myip.opendns.com @resolver1.opendns.com)\n" >> /etc/motd
{% endhighlight %}

On Ubuntu Boxes (since they use [update-motd(1)](https://wiki.ubuntu.com/UpdateMotd)),
I do pretty much the same thing except I just make a bash
script in `/etc/update-motd.d/25-baller-motd`

{% highlight bash %}
#!/usr/bin/env bash
cat yourimg.txt
figlet "$(hostname)"
printf "Public IP: $(dig +short myip.opendns.com @resolver1.opendns.com)\n"
command -v fortune &> /dev/null && fortune
{% endhighlight %}

There are likely better articles on creating a _useful_ MOTD,
([here](http://www.mewbies.com/how_to_customize_your_console_login_message_tutorial.htm)&#8217;s
one that looks kinda cool) but there are exactly none-better articles on
creating MOTDs that are so flossy!