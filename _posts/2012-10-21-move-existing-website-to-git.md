---
layout: post
title: Integrating git with your existing website
---
Better git it in your soul<a href="http://www.youtube.com/watch?v=SPoK1lryfh4">*</a>.

Git has a <a href="https://bitly.com/bundles/matthewmccullough/1">lot</a> 
of <a href="http://try.github.com/levels/1/challenges/1">great</a> 
<a href="https://peepcode.com/products/git">tutorials</a> 
for getting started. There are also a number of great articles on 
<a href="http://daneden.github.com/github-workflow/">how to 
use git and github</a> for your workflow.

What I haven&#8217;t seen is an article on how to integrate git with your 
current site without storing any code on github. I&#8217;m writing this blog 
to create a quick reference for how to get up and running using git on your 
existing site.

<h2>Needed</h2>

I&#8217;m making the assumption that you have the following:
<ul>
<li>Knowledge of Linux</li>
<li>&shy;<a href="http://library.linode.com/lamp-guides/ubuntu-12.04-precise-pangolin">
A local development environment
</a></li>
<li>git-core installed both locally and on your webserver</li>
<li>rsync installed both locally and on your webserver</li>
<li>&shy;<a href="http://www.commandlinefu.com/commands/view/771/copy-your-ssh-public-key-on-a-remote-machine-for-passwordless-login-the-easy-way">
  Keyless SSH access to your webserver
</a></li>
</ul>
 
I&#8217;m using Ubuntu 12.04 locally, but I&#8217;d assume that most of this 
won&#8217;t be too different on a different distribution or on a Mac&#8212;but 
I&#8217;m probably totally wrong about that &#9786;

<hr>

<h2>Step One:</h2>
<strong>RSync your site to your local development environment.</strong> 

In order to begin to develop locally (and break the old <a href="http://www.bnj.com/cowboy-coding-pink-sombrero/">cowboy-coding</a> habits
that you&#8217;ve undoubtedly developed over the years) you need a local 
copy of your site.

 1. Open your terminal emulator and <code>cd</code> to the directory in which
    you will be storing these files (i.e. <code>cd /srv&shy;/www&shy;/tylercipriani.com&shy;/public_html</code>)
 2. Rsync the <code>htdocs</code> or <code>public_html</code> from your webserver
    into this local directory:

{% highlight bash %}
$ rsync -av -e "ssh -p <port>" <rsync-username>@<webserver>:/path/to/public_html/ .
{% endhighlight %}

The command breaks down like this:
<ul>
    <li><code>a</code> means &#8220;Archive&#8221;&#8212;keeps permissions, mtimes, etc the same</li>
    <li><code>v</code> means &#8220;Verbose&#8221;&#8212;increases verbosity of the command</li>
    <li><code>e</code> means &#8220;RSH&#8221;&#8212;allows you to use remote shell (same as RSH=command)</li>
    <li><code>:/path/to/htdocs/</code>&#8212;the path to you htdocs folder. 
      The trailing <code>/</code> is significant&#8212;it means copy the 
      content of the htdocs directory rather than the directory by name</li>
    <li><code>.</code> is the current directory</li>
</ul>

<hr>

<h2>Step Two:</h2>
<strong>Initialize git in local development environment.</strong> 

This step will create a new git repository on your local machine and add all
the code that you&#8217;ve rsynced in the previous step to that repo.

 1. &shy;<code>cd</code> to the directory to which you previously rsynced 
    your site and initialize a git repository by running <code>git init</code>
    {% highlight bash %}
$ cd /srv/www/tylercipriani.com/public_html/
$ git init
{% endhighlight %}
 2. Add the contents of the current directory to the git repository by running 
    <code>git add .</code>
 3. Commit all your newly added files to the repo by running your first 
    commit <code>git commit -m &#8220;First Commit&#8221;</code>

<hr>

<h2>Step Three:</h2>
<strong>Setup a bare repo on your web server.</strong> 

You need a bare repo out on your webserver that will act as a mirror to your 
local development environment.

 1. ssh into your webserver and make a new directory, I usually make it above 
    the webroot (i.e. <code>htdocs</code>)
    {% highlight bash %}
$ mkdir tylercipriani.com.git && cd tylercipriani.com.git
{% endhighlight %}

 2. Once inside the new directory initialize a bare repository by using the 
    <code>--bare</code> flag:
    {% highlight bash %}
$ git init --bare
{% endhighlight %}

 3. Now we can define a new post-receive hook that will be triggered whenever 
    an update is pushed to this new bare repository. The post-receive hook 
    can be any type of script you want, the script below is written in bash. 
    <code>cd</code> into the <code>.git/hooks</code> directory and create a 
    file called &#8220;post-receive&#8221;. Copy the code below into the file:
    {% highlight bash linenos %}
#!/bin/bash
GIT_WORK_TREE=/path/to/your/htdocs/direcotry git checkout -f
{% endhighlight %}

    make sure that this code is executable by running 
    <code>chmod +x .git/hooks/post-receive</code>

<hr>

<h2>You&#8217;re Done!</h2>
<strong>Push to your new repo, you beautiful command-line ninja, you!</strong> 

Back on your local machine, in the webroot of your local development environment, 
add your bare webserver repo as your <code>remote</code> and push your git 
repo up to your server. The post-receive hook will take care of the rest!

{% highlight bash %}
$ git remote add web ssh://user@tylercipriani.com/home/user/tylercipriani.com.git
$ git push -u origin master
{% endhighlight %}

By using the <code>-u</code> flag you&#8217;re setting the upstream which means 
you can just run <code>git pull</code> without further arguments to merge 
origin and master.
