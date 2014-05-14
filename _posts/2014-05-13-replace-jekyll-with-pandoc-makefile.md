---
layout: post
title: Replacing Jekyll with Pandoc and a Makefile
---

I used to use del.icio.us to keep track of links, then it went away.
After del.icio.us shutdown, I used a ton of uniquely awful services to
keep track of links. Eventually, I came around to the idea that all I
needed was a series of markdown files and github: [BOOM!](https://github.com/thcipriani/links/tree/8d2442d4ba8a9090f645dd2cfe73216a7350dea5)
Public link repositiory&#8212;just like del.icio.us back in the day.

After a while I started thinking, I could make these files a lot more
presentable if I did some jekyll-ifying and served them out on github.

Previously Jekyllfied
----

My `linuxtips` repo is just a dumb jekyll repo. Esentially all `linuxtips` is is
just [a big `README` file](https://github.com/thcipriani/linuxtips/blob/master/README.md).
So, for that repo, I created a `gh-pages` branch with a `_config.yml` and
a `_layout` directory and popped in a [Makefile](https://github.com/thcipriani/linuxtips/blob/gh-pages/Makefile):

{% highlight bash %}
INDEX = ${CURDIR}/index.md

$(INDEX):
  @ git show origin/master:README.md > $@
  @ perl -i -pe 'print "---\nlayout: default\ntitle: Linux Tips\n---\n\n" if $$. == 1;' $@
{% endhighlight %}

and then I got [tylercipriani.com/linuxtips](http://www.tylercipriani.com/linuxtips/); neat.

I ran into some problems with that approach along the way. Mostly problems
with git and the separate branches and the order in which I&#8217;d commit and pull
and whatever, it was/is a headache.

Pandoc
---
I started thinking about [Pandoc](http://johnmacfarlane.net/pandoc/). Pandoc is this haskell library that makes
miracles of text happen.

Got an org-mode file and need TeX? Done.

Got a markdown slideshow that needs to become a beamer slide show? OK, sure.

Fuck Beamer, how about markdown slides &rarr; Reveal.js slides? You bet your sweet sensual bologna.

Imma install Pandoc&#8230;
---

### Debian?

{% highlight bash %}
sudo apt-get install haskell-platform
cabal update
cabal install pandoc
{% endhighlight %}

then add it to your path in your `.${SHELL}rc` file:

{% highlight bash %}
[ -d "$HOME/.cabal/bin" ] && export PATH="$HOME/.cabal/bin:$PATH"
{% endhighlight %}

### OSX?

{% highlight bash %}
brew update
brew install pandoc
{% endhighlight %}

Imma Use Pandoc&#8230;
---

Alright, so I&#8217;ve got tons of markdown files, fairly structured, with bunches of links and I need html5.
I&#8217;ll create a `Makefile` proof-of-concept for this:

{% highlight bash %}
index.html: README.md
  pandoc -s -f markdown -t html5 -o "$@" "$<"
{% endhighlight %}

Running `make` takes my `README.md` and makes this:

{% highlight html %}
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="generator" content="pandoc">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
  <title></title>
  <style type="text/css">code{white-space: pre;}</style>
  <!--[if lt IE 9]>
    <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
  <![endif]-->
</head>
<body>
<h1 id="tyler-ciprianis-bookmarks">Tyler Cipriani's Bookmarks</h1>
<p>In an effort to <em>not</em> have 100+ tabs open…</p>
<ul>
<li><a href="http://www.flickr.com/photos/tylercipriani/">My Photography</a></li>
<li><a href="Design.md">Design</a></li>
<li><a href="Development.md">Development</a></li>
<li><a href="Business.md">Business</a></li>
<li><a href="Fun.md">Fun</a></li>
</ul>
</body>
</html>
{% endhighlight %}

Layout/CSS
---

So now I have html, but I need to be able to

1. configure a layout in which to render html
2. include custom css in said layout.

Oh, Pandoc knows layout.

First, I looked at the default html5 layout file for Pandoc:

{% highlight bash %}
pandoc -D html5 > _layout.html5
{% endhighlight %}

I made some tweaks to that file, kept the variables I wanted, ditched the
variables I didn&#8217;t need.

A quick search for `css` in `pandoc(1)` and I find the `--css` flag which
enables you to link to a css stylesheet.

Updated `Makefile`:

{% highlight bash %}
index.html: README.md
  pandoc -s --template "_layout" --css "css/main.css" -f markdown -t html5 -o "$@" "$<"
{% endhighlight %}

Makefile fanciness
---

Alright, so now that I have the basics of Pandoc down, I need to whip my
`Makefile` into shape.

First thing is I want to convert ALL of my markdown files to html, not just
the `README.md`. So howzabout I add a wildcard target for all the `html` files?
Also, the whole point of this is to make a github pages site, so let&#8217;s add
that to the `Makefile` too

{% highlight bash %}
REPO := $(shell git config --get remote.origin.url)
GHPAGES = gh-pages

all: $(GHPAGES) $(addprefix $(GHPAGES)/, $(addsuffix .html, $(basename $(wildcard *.md))))

$(GHPAGES):
  git clone "$(REPO)" "$(GHPAGES)"
  (cd $(GHPAGES) && git checkout $(GHPAGES)) || (cd $(GHPAGES) && git checkout --orphan $(GHPAGES) && git rm -rf .)

$(GHPAGES)/%.html: %.md
  pandoc -s --template "_layout" -c "css/main.css" -f markdown -t html5 -o "$@" "$<"
{% endhighlight %}

Running `make` at this point should checkout your current git repository to
a subdirectory called `gh-pages` (which should be added to `.gitignore`
on master).

This `Makefile` first tries to checkout an existing `gh-pages` branch,
otherwise it creates a new orphan branch for `gh-pages`. After
that, we glob the current directory for any file name `*.md` and run it
through pandoc, placing the result in `gh-pages/[whatever].html`

Niceities
---

I&#8217;m a big fan of pre-processors, so the css/main.css file (which
doesn&#8217;t _actually exist_ as of yet) should be converted from `less`.
The easiest way to do that: add a `package.json` with `less` as a dependency.

{% highlight javascript %}
{
  "name": "linkblog",
  "version": "0.0.1",
  "dependencies": {
    "less": "*"
  }
}
{% endhighlight %}

Now running `npm install` should create a new `node_modules` directory (which
should be added to `.gitignore` on master). Now we need to add a `lessc`
step to our `Makefile`.

{% highlight bash %}
LESSC    = node_modules/less/bin/lessc
LESSFILE = less/main.less

CSSDIR  = $(GHPAGES)/css
CSSFILE = $(CSSDIR)/main.css

$(CSSFILE): $(CSSDIR) $(LESSFILE)
	$(LESSC) "$(LESSFILE)" "$(CSSFILE)"

$(CSSDIR):
	mkdir -p "$(CSSDIR)"
{% endhighlight %}

Also, it&#8217;s always nice to have a `clean` target in any `Makefile`

{% highlight bash %}
clean:
	rm -rf gh-pages
{% endhighlight %}

I&#8217;d also like to be able to preview before commiting this file by typing `make serve`

{% highlight bash %}
serve:
	cd gh-pages && python -m SimpleHTTPServer
{% endhighlight %}

Finally, speaking of commiting this file, let&#8217;s make `commit` a target, too.

{% highlight bash %}
commit:
	cd $(GHPAGES) && \
		git add . && \
		git commit --edit --message="Publish @$$(date)"
	cd $(GHPAGES) && \
		git push origin $(GHPAGES)
{% endhighlight %}

Now when I update my `links` repo's markdown files I issue a simple series of commands:
`make` checks-out my `gh-pages` branch and builds the html and css files,
`make serve` lets me look at the output html at `localhost:8000`,
and, finally, `make commit` pushes those changes live.

So here&#8217;s the [result](http://www.tylercipriani.com/links) and the final `Makefile`

{% highlight bash %}
REPO := $(shell git config --get remote.origin.url)
GHPAGES = gh-pages

LESSC    = node_modules/less/bin/lessc
LESSFILE = less/main.less

CSSDIR  = $(GHPAGES)/css
CSSFILE = $(CSSDIR)/main.css

all: init clean $(GHPAGES) $(CSSFILE) $(addprefix $(GHPAGES)/, $(addsuffix .html, $(basename $(wildcard *.md))))

$(GHPAGES)/%.html: %.md
	pandoc -s --template "_layout" -c "css/main.css" -f markdown -t html5 -o "$@" "$<"

$(CSSFILE): $(CSSDIR) $(LESSFILE)
	$(LESSC) "$(LESSFILE)" "$(CSSFILE)"

$(CSSDIR):
	mkdir -p "$(CSSDIR)"

$(GHPAGES):
	@echo $(REPO)
	git clone "$(REPO)" "$(GHPAGES)"
	@echo "Donezo"
	(cd $(GHPAGES) && git checkout $(GHPAGES)) || (cd $(GHPAGES) && git checkout --orphan $(GHPAGES) && git rm -rf .)

init:
	@command -v pandoc > /dev/null 2>&1 || (echo 'pandoc not found http://johnmacfarlane.net/pandoc/installing.html' && exit 1)
	@[ -x $(LESSC) ] || npm install

serve:
	cd gh-pages && python -m SimpleHTTPServer

clean:
	rm -rf gh-pages

commit:
	cd $(GHPAGES) && \
		git add . && \
		git commit --edit --message="Publish @$$(date)"
	cd $(GHPAGES) && \
		git push origin $(GHPAGES)

.PHONY: init gh-pages clean commit serve
{% endhighlight %}