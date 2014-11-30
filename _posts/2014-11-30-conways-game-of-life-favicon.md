---
layout: post
title: Conway&#8217;s Favicon
---

I find favicons pretty useful overall. That weird little
[Earthworm-Jim-esque bug-head](https://bugs.r-project.org/bugzilla3/images/favicon.ico)
in my bookmarks bar immediately queues me in on where to click to get to
bugzilla. My site hasn&#8217;t had a favicon. The only explanation I can offer is
laziness mixed with a lack of inspiration. A favicon isn&#8217;t typically a
glamorous undertaking—it&#8217;s just one of those things that ought to be done.

My first idea for a favicon was Eric S. Raymond&#8217;s
[Hacker Emblem](http://www.catb.org/hacker-emblem/). The Hacker Emblem
is certainly a meaningful symbol, but it&#8217;s also kind of a cop-out.

I tried something with [nyan cat and the hacker emblem](/images/nyan-conway.png),
which was a solid idea, but sort of lost something at 16px×16px. Then I
started to think, _why not just have Conway&#8217;s Game of Life running in the
favicon_?

## Game of Life in JavaScript

[Conway&#8217;s Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life)
is a zero player game with 4 simple rules (this is verbatim from the Wikipedia article):

> 1. Any live cell with less than two live neighbours dies, as if caused by under-population.
> 2. Any live cell with two or three live neighbours lives on to the next generation.
> 3. Any live cell with more than three live neighbours dies, as if by overcrowding.
> 4. Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.

[My game of life](https://github.com/thcipriani/conways-favicon/blob/master/conways-favicon.js)
is heavily derived from an IBM DeveloperWorks post,
[_Conway&#8217;s Game of Life in CoffeeScript and canvas_](http://www.ibm.com/developerworks/library/wa-coffeescriptcanvas/),
except that I just used plain ol&#8217; JavaScript, a much smaller grid, and
I included some functionality to reset the game seed if the last two
evolutions of life don&#8217;t change the grid layout.

## Dynamic Favicons

After creating the game loop in JavaScript, I had to create some code to
dynamically update the favicon.

First, I created the [default favicon](/favicon.ico) for this site by
rendering out a glider via JavaScript and rendering the canvas as a png
on the page.

{% highlight javascript %}
GameOfLife.prototype.glider = [
  {x: 0, y: 1}
 ,{x: 1, y: 2}
 ,{x: 2, y: 0}
 ,{x: 2, y: 1}
 ,{x: 2, y: 2}
]

/* ... */

/**
 * Seed with default of glider
 */
GameOfLife.prototype.seed = function() {
  var i, j, rowLen, colLen, row, col, gliderLen

  // Start with all empty
  for(i = row = 0, rowLen = this.numberOfRows; i < rowLen; row = ++i) {
    this.curCellGen[row] = []
    for(j = col = 0, colLen = this.numberOfCols; j < colLen; col = ++j) {
      this.curCellGen[row][col] = this.createCell(false, row, col)
    }
  }

  // Create glider
  for(i = 0, gliderLen = this.glider.length; i < gliderLen; i++) {
    var x, y

    x = this.glider[i].x
    y = this.glider[i].y

    this.curCellGen[x][y] = this.createCell(true, x, y)
  }
}

GameOfLife.prototype.drawGrid = function() {
  var img = document.createElement('img')
  img.src = this.canvas.toDataURL('img/png')
}
{% endhighlight %}

After rendering as a png in the browser, I saved the `.png` to my computer.
Then I uploaded the png to [favicon-generator.org](http://favicon-generator.org/)
saving the resulting `.ico` to my site&#8217;s directory root as `favicon.ico`.
`favicon.ico` is what gets rendered in IE, since IE has found brand new ways
to be non-compliant with emerging standards (le sigh).

The finishing touch is to make the `GameOfLife.prototype.drawGrid` function update
my favicon&#8217;s `href` attribute on every `tick` function call:

{% highlight javascript %}
GameOfLife.prototype.createCanvas = function() {
  this.canvas = document.createElement('canvas')
  this.favicon = document.createElement('link')
  this.favicon.rel = 'icon'
  document.getElementsByTagName('head')[0].appendChild(link)
}


GameOfLife.prototype.drawGrid = function() {
  /* ... */
  this.favicon.href = this.canvas.toDataURL('img/png')
}
{% endhighlight %}

The entirety of this javascript is available under the
 [GPLv3 License](https://tldrlegal.com/license/gnu-general-public-license-v3-%28gpl-3%29)
on [my github](https://github.com/thcipriani/conways-favicon).

