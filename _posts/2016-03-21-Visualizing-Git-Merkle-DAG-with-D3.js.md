---
title: Visualizing Git's Merkle DAG with D3.js
layout: post
js:
    - d3.min.js
    - merkle-dag-d3.js
css:
    - merkel-dag-d3.css
---

The Directed Acyclic Graph (DAG) is a concept I run into over-and-over again;
which is, perhaps, somewhat ironic.

A DAG is a representation of verticies (nodes) that are connected by
directional edges (arcs—i.e., lines) in such a way that there are no cycles
(e.g., starting at `Node A`, you shouldn't be able to return to `Node A`).

DAGs have lots of uses in computer science problems and in discrete mathmatics.
You'll find DAGs in build-systems, network problems, and, importantly (for
this blog) in Git—The stupid content tracker.

One way to think of a DAG is a set of dependencies—each node may
have a dependency on one or more other nodes. That is, in order to get to `Node B`
you must route through `Node A`:

{% highlight javascript %}
// JSON object mapping node name → [dependencies]
var dag = {
    'Node A': [],
    'Node B': ['Node A']
};
{% endhighlight %}

While that single JSON object may make it easy to visualize a DAG, visualizing
a DAG using the [d3.js force layout](https://github.com/mbostock/d3/wiki/Force-Layout)
demands some different input. To change the above object into `force`'s
expected input, I created a little helper function:

{% highlight javascript %}
// Helper function for d3.js force layout
var forceFormat = function(dag) {
    var orderedNodes = [],
        nodes = [],
        links = [];

    // Basically a dumb Object.keys
    for (node in dag) {
        if ( !dag.hasOwnProperty( node ) ) continue;
        orderedNodes.push(node)
    }

    orderedNodes.forEach(function(node) {
        var target = node,
            sources = dag[target]

        sources.forEach(function(source) {
            links.push({
                'source': orderedNodes.indexOf(source),
                'target': orderedNodes.indexOf(target)
            })
        });
        nodes.push({'name': target})
    });

    return { 'nodes': nodes, 'links': links };
}

var forceInput = forceFormat(dag);
/*
{
    "links": [
        {
            "source": "Node A",
            "target": "Node B"
        }
    ],
    "nodes": [
        { "name": "Node A" },
        { "name": "Node B" }
    ]
}
*/
{% endhighlight %}

I can pass that JavaScript object off to a function that I created after
a long time staring at a [mbostock example](http://bl.ocks.org/mbostock/1138500):

{% highlight javascript %}
// http://bl.ocks.org/mbostock/1138500
var makeGraph = function(target, graphData) {
    var target = d3.select(target),
        bounds = target.node().getBoundingClientRect(),
        fill = d3.scale.category20(),
        radius = 8;

        var svg = target.append('svg')
        .attr('width', bounds.width)
        .attr('height', bounds.height);


    svg.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('refX', 6 + 3) /*must be smarter way to calculate shift*/
        .attr('refY', 2)
        .attr('markerWidth', 6)
        .attr('markerHeight', 4)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M 0,0 V 4 L6,2 Z'); //this is actual shape for arrowhead

    var link = svg.selectAll('line')
        .data(graphData.links)
        .enter()
            .append('line')
                .attr('class', 'link')
                .attr('marker-end', 'url(#arrowhead)');

    var node = svg.selectAll('g')
        .data(graphData.nodes)
        .enter()
            .append('g')

    node.append('circle')
        .attr('r', radius)
        .attr('class', 'node')

    node.append('text')
        .attr('y', 22)
        .attr('dy', 3)
        .attr('text-anchor', 'middle')
        .text(function(d) { return d.name; })

    var charge = 1000 * graphData.nodes.length;

    var force = d3.layout.force()
        .size([bounds.width, bounds.height])
        .nodes(graphData.nodes)
        .links(graphData.links)
        .linkDistance(50)
        .charge(-(charge))
        .gravity(1)
        .on('tick', tick)

    /* No fancy animation */
    force.start();
    for (var i = 0; i < 100; ++i) force.tick();
    force.stop();

    function tick(e) {
        // Push sources up and targets down to form a weak tree.
        var k = 12 * e.alpha;

        link
            .each(function(d) { d.source.y -= k, d.target.y += k; })
            .attr('x1', function(d) { return d.source.x; })
            .attr('y1', function(d) { return d.source.y; })
            .attr('x2', function(d) { return d.target.x; })
            .attr('y2', function(d) { return d.target.y; });

        node
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            });
    }
};

makeGraph('.merkle-1', forceInput);
{% endhighlight %}

<div class=merkle-1></div>
You'd be forgiven for thinking that is a line.

This directional line _is_ a DAG—albeit a simple one.

What does any of this have to do with Git? The secret sauce of git, why it's
so damn magical: Git is a Merkle DAG.

Git Object Anatomy
---

In order to understand how Git is a DAG, you need to understand Git "objects":

{% highlight bash %}
$ mkdir merkle
$ cd merkle
$ echo 'This is the beginning' > README
$ git init
$ git add .
$ git -m 'Initial Commit'
$ find .git/objects/ -type f
.git/objects/1b/9f426a8407ffee551ad2993c5d7d3780296353
.git/objects/09/8e6de29daf4e55f83406b49f5768df9bc7d624
.git/objects/1a/06ce381ac14f7a5baa1670691c2ff8a73aa6da
{% endhighlight %}

WTF are Git objects? Because they look like nonesense:
{% highlight bash %}
$ cat .git/objects/1b/9f426a8407ffee551ad2993c5d7d3780296353
xKOR02,V¢T¤̼¼̼t.
{% endhighlight %}

After a little digging through the [Pro Git](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects)
book, Git objects are a little less non-sensicle. Git objects are simply `zlib`
compressed, formatted messages:

{% highlight bash %}
$ python2 -c 'import sys,zlib; \
  print zlib.decompress(sys.stdin.read());' \
    < .git/objects/1a/06ce381ac14f7a5baa1670691c2ff8a73aa6da
commit 195tree 098e6de29daf4e55f83406b49f5768df9bc7d624
author Tyler Cipriani <tcipriani@wikimedia.org> 1458604120 -0700
committer Tyler Cipriani <tcipriani@wikimedia.org> 1458604120 -0700

Initial Commit
{% endhighlight %}

Parts of that message are obvious: `author` and `committer` obviously come
from my `.gitconfig`. There is a Unix epoch timestamp with a timezone offset.
`commit` is the type of object. `195` is the byte-length of the remainder of
the message.

There are a few parts of that message that aren't immediately obvious.
What is `tree 098e6de29daf4e55f83406b49f5768df9bc7d624`? And
why would we store this message in `.git/objects/1a/06ce381ac14f7a5baa1670691c2ff8a73aa6da`
and not `.git/objects/commit-message`? The answer to both
of those questions is the same: [Cryptographic Hash Functions](https://en.wikipedia.org/wiki/Cryptographic_hash_function).

A cryptographic hash function is a function that when given an input of any
length it creates a fixed-length output. Furthermore (and maybe most importantly)
the fixed-length output should be unique to a given input, any change in
input will likely cause a big change in the output. Git uses a cryptographic
hash function called _Secure Hash Algorithm 1_ (SHA-1).

You can play with the SHA-1 function on the command line:
{% highlight bash %}
$ echo 'message' | sha1sum
1133e3acf0a4cbb9d8b3bfd3f227731b8cd2650b  -
$ echo 'message' | sha1sum
1133e3acf0a4cbb9d8b3bfd3f227731b8cd2650b  -
$ echo 'message1' | sha1sum
c133514a60a4641b83b365d3dc7b715dc954e010  -
{% endhighlight %}

Note the big change in the output of `sha1sum` from a tiny change in input.
This is what good cryptographic hash functions do!

Now that we have some idea of what is inside a commit object, lets reverse-engineer
the commit object from the `HEAD` of our `merkle` repo:

{% highlight bash %}
$  python2 -c 'import sys,zlib; \
print zlib.decompress(sys.stdin.read());' \
< .git/objects/1a/06ce381ac14f7a5baa1670691c2ff8a73aa6da | \
od -c
 0000000   c   o   m   m   i   t       1   9   5  \0   t   r   e   e    
 0000020   0   9   8   e   6   d   e   2   9   d   a   f   4   e   5   5
 0000040   f   8   3   4   0   6   b   4   9   f   5   7   6   8   d   f
 0000060   9   b   c   7   d   6   2   4  \n   a   u   t   h   o   r    
 0000100   T   y   l   e   r       C   i   p   r   i   a   n   i       <
 0000120   t   c   i   p   r   i   a   n   i   @   w   i   k   i   m   e
 0000140   d   i   a   .   o   r   g   >       1   4   5   8   6   0   4
 0000160   1   2   0       -   0   7   0   0  \n   c   o   m   m   i   t
 0000200   t   e   r       T   y   l   e   r       C   i   p   r   i   a
 0000220   n   i       <   t   c   i   p   r   i   a   n   i   @   w   i
 0000240   k   i   m   e   d   i   a   .   o   r   g   >       1   4   5
 0000260   8   6   0   4   1   2   0       -   0   7   0   0  \n  \n   I
 0000300   n   i   t   i   a   l       C   o   m   m   i   t  \n  \n
 0000317
$ printf 'tree 098e6de29daf4e55f83406b49f5768df9bc7d62k4\n' >> commit-msg
$ printf 'author Tyler Cipriani <tcipriani@wikimedia.org> 1458604120 -0700\n' >> commit-msg
$ printf 'committer Tyler Cipriani <tcipriani@wikimedia.org> 1458604120 -0700\n' >> commit-msg
$ printf '\nInitial Commit\n' >> commit-msg
$ sha1sum <(cat \
    <(printf "commit ") \
    <(wc -c < commit-msg | tr -d '\n') \
    <(printf '%b' '\0') commit-msg)
1a06ce381ac14f7a5baa1670691c2ff8a73aa6da  /dev/fd/63
$ # Hmm that seem familiar
$ export COMMIT_HASH=$(sha1sum <(cat <(printf "commit ") <(wc -c < commit-msg | tr -d '\n') <(printf '%b' '\0') commit-msg) | cut -d' ' -f1)
$ find ".git/objects/${COMMIT_HASH:0:2}" -type f -name "${COMMIT_HASH:(-38)}"
.git/objects/1a/06ce381ac14f7a5baa1670691c2ff8a73aa6da
{% endhighlight %}

The commit object is a zlib-compressed, formatted message that is stored in
a file named after the SHA-1 hash of the file's un-`zlib` compressed
contents.

(/me wipes brow)

Let's use `git-cat-file` to see if we can explore the
`tree 098e6de29daf4e55f83406b49f5768df9bc7d62k4`-part of the commit message object:

{% highlight bash %}
$ cat .git/HEAD
ref: refs/heads/master
$ cat .git/refs/heads/master
1a06ce381ac14f7a5baa1670691c2ff8a73aa6da
$ git cat-file -p $(!!)
git cat-file -p $(cat .git/refs/heads/master )
tree 098e6de29daf4e55f83406b49f5768df9bc7d624
author Tyler Cipriani <tcipriani@wikimedia.org> 1458604120 -0700
committer Tyler Cipriani <tcipriani@wikimedia.org> 1458604120 -0700
$ # Show the object, pointed to by the commit object from .git/refs/heads/master
$ git cat-file -p $(git cat-file -p $(cat .git/refs/heads/master ) | head -1 | cut -d' ' -f2)
100644 blob 1b9f426a8407ffee551ad2993c5d7d3780296353    README
$ git cat-file -p 1b9f426a8407ffee551ad2993c5d7d3780296353
This is the beginning
{% endhighlight %}

Hey that's the text I put into `README`!

So `.git/HEAD` is at the head of the `master` branch inside `.git/refs/heads/master`
calling `git-cat-file` on the object found inside that file shows that it's
the commit object we recreated. The commit object points to `098e6de29daf4e55f83406b49f5768df9bc7d624`,
which is a tree object with the contents: `100644 blob 1b9f426a8407ffee551ad2993c5d7d3780296353    README`
The `blob` object `1b9f426a8407ffee551ad2993c5d7d3780296353` is the contents of `README`!

What was I talking about? Merkle DAGs? d3.js? Somesuch...
---

Let's see if we can paste together what Git is doing at a low level when
we make a new commit:

1. Take the contents of `README`, hash the contents, and store as a `blob`
   object in `.git/objects`.
2. Create a directory listing of the git working directory, listing each
   file, with its directory permissions and its hash value. Hash this
   directory listing and store as a `tree` in `.git/objects`.
3. Take the commit message, along with info from `.gitconfig` and the hash
   of the top-level tree. Hash this information and store it as a `commit`
   object in `.git/objects`.

It seems that there may be a chain of dependencies:

{% highlight javascript %}
var gitDag = {
    // blob
    '1b9f426a8407ffee551ad2993c5d7d3780296353': [],
    // tree is a hash that includes the hash from blob
    '098e6de29daf4e55f83406b49f5768df9bc7d624': ['1b9f426a8407ffee551ad2993c5d7d3780296353'],
    // commit is a hash that includes the hash from tree
    '1a06ce381ac14f7a5baa1670691c2ff8a73aa6da': ['098e6de29daf4e55f83406b49f5768df9bc7d624'],
};

makeGraph('.merkle-2', forceFormat(gitDag));
{% endhighlight %}
<div class=merkle-2></div>

You'd be forgiven for thinking that is a line.


Since it's running each of these objects through a hash function and each
of them contains a refrerrence up the chain of dependencies, minorly changing
either the `blob` the `tree` or the `commit` will create drastically different
git objects:

{% highlight bash %}
$ git commit --amend -m 'This is the commit message now'
[master 585448a] This is the commit message now
 Date: Mon Mar 21 16:48:40 2016 -0700
  1 file changed, 1 insertion(+)
   create mode 100644 README
$ find .git/objects/ -type f
.git/objects/1b/9f426a8407ffee551ad2993c5d7d3780296353
.git/objects/09/8e6de29daf4e55f83406b49f5768df9bc7d624
.git/objects/1a/06ce381ac14f7a5baa1670691c2ff8a73aa6da
.git/objects/58/5448afaa80064af0eb84513f7763113bf3c0f1
$ git cat-file -p 585448afaa80064af0eb84513f7763113bf3c0f1
tree 098e6de29daf4e55f83406b49f5768df9bc7d624
author Tyler Cipriani <tcipriani@wikimedia.org> 1458604120 -0700
committer Tyler Cipriani <tcipriani@wikimedia.org> 1458621153 -0700

This is the commit message now
{% endhighlight %}

Now the DAG is a bit different:
{% highlight javascript %}
var gitDag = {
    // blob
    '1b9f426a8407ffee551ad2993c5d7d3780296353': [],
    // tree is a hash that includes the hash from blob
    '098e6de29daf4e55f83406b49f5768df9bc7d624': ['1b9f426a8407ffee551ad2993c5d7d3780296353'],
    // commit is a hash that includes the hash from tree
    '1a06ce381ac14f7a5baa1670691c2ff8a73aa6da': ['098e6de29daf4e55f83406b49f5768df9bc7d624'],
    // HEAD is a hash that includes the hash from tree
    '585448afaa80064af0eb84513f7763113bf3c0f1': ['098e6de29daf4e55f83406b49f5768df9bc7d624'],
};

makeGraph('.merkle-3', forceFormat(gitDag));
{% endhighlight %}
<div class=merkle-3></div>


