---
layout: post
title: Dotfile Boilerplate
---

Earlier today I made a tweak to one of my ever-growing collection of 
[dotfiles](https://github.com/thcipriani/dotfiles/) and it reminded me 
that I&#8217;m not too happy with my dotfile&#8217;s `bootstrap` script.

The `bootstrap` file that I have in my repo is from [a 2008 blog post](http://errtheblog.com/posts/89-huba-huba) 
and I&#8217;ve never been too thrilled with it. 

The problems my old `boostrap` were

1. It required that Ruby be installed&#8212;which was a pain on production 
   servers where I never intended to have Ruby installed.
2. It overwrote any existing dotfiles in `$HOME` without warning
3. It added every sub-directory/file in the .dotfiles directory&#8212;you couldn&#8217;t 
   add a README.md file without it being symlinked in the `$HOME` directory as 
   `.README.md`&#8212;silly, right?!

So I started perusing dotfile repos on github&#8212;which is always exciting 
to me (because I&#8217;m super nerdy) and there are some amazing dotfile resources 
on github:

- [Github &#10084; ~/](http://dotfiles.github.io/)
- [Mathias Bynens&#8217; Sensible Hacker Defaults for OSX](https://github.com/mathiasbynens/dotfiles)
- [gf3&#8217;s Sexy Bash Prompt](https://github.com/gf3/dotfiles)
- [Zach Holman&#8217;s Bootstrap script](http://zachholman.com/2010/08/dotfiles-are-meant-to-be-forked/)
- [Addy Osmani&#8217;s Handy Aliases](https://github.com/addyosmani/dotfiles/blob/master/.aliases)

And the truly insane:

- [pengwynn&#8217;s There&#8217;s no place like ~/](https://github.com/pengwynn/dotfiles)

Seeing all of this got me to thinking&#8212;wouldn&#8217;t it be great if there 
were a project that amalgamated all of this fun stuff? Like HTML5 Boilerplate 
for dotfiles.

## Dotfile Boilerplate

So there&#8217;s the starting point: [Dotfile Boilerplate](https://github.com/thcipriani/dotfile-boilerplate)

At the very least it&#8217;s a solidly structured start with an amazing 
bootstrap script that I modfied based off of Zach Holman&#8217;s setup.

So that&#8217;s the whole idea&#8212;the hope is that this repository can grow 
and collect great ideas, functions, and well-considered dotfiles from 
interesting discussions and people around the internet. 

Beginners will have an amazing starting point and advanced users will have 
a wellspring of ideas.

Fork &#8216;em if ya got &#8216;em.
