---
title: Visualizing Git&#8217;s Merkle DAG with D3.js
layout: post
js:
    - d3.min.js
    - merkle-dag-d3.js
css:
    - merkel-dag-d3.css
---

The [Directed Acyclic Graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph)
(DAG) is a concept I run into over-and-over again; which is, perhaps,
somewhat ironic.

A DAG is a representation of vertices (nodes) that are connected by
directional edges (arcs—i.e., lines) in such a way that there are no cycles
(e.g., starting at `Node A`, you shouldn&#8217;t be able to return to `Node A`).

DAGs have lots of uses in computer science problems and in discrete mathematics.
You&#8217;ll find DAGs in build-systems, network problems, and, importantly (for
this blog post, if not generally) in Git.

One way to think of a DAG is as a set of dependencies—each node may
have a dependency on one or more other nodes. That is, in order to get to `Node B`
you must route through `Node A`, so `Node B` depends on `Node A`:

{% highlight javascript %}
// Node → [dependent nodes]
var dag = {
    'Node A': ['Node B'],
    'Node B': []
};
{% endhighlight %}

The visualization of dependencies in a JSON object is (SURPRISE!) different
from the input format needed to visualize a DAG using the
[D3.js Force layout](https://github.com/mbostock/d3/wiki/Force-Layout).
To change the above object into Force&#8217;s
expected input, I created a little helper function:

{% highlight javascript %}
// Helper function for D3.js force layout
var forceFormat = function(dag) {
    var orderedNodes = [],
        nodes = [],
        links = [],
        usesPack = false;

    // Basically a dumb Object.keys
    for (node in dag) {
        if ( !dag.hasOwnProperty( node ) ) continue;
        orderedNodes.push(node);
    }

    orderedNodes.forEach(function(node) {
        var sources = dag[node];

        if (!sources) return;

        sources.forEach(function(source) {
            var source = orderedNodes.indexOf(source);

            // If the source isn't in the Git DAG, it's in a packfile
            if (source < 0) {
                if (usesPack) return;
                source = orderedNodes.length;
                usesPack = true;
            }

            links.push({
                'source': source,
                'target': orderedNodes.indexOf(node)
            });
        });
        nodes.push({'name': node});
    });

    // Add pack file to end of list
    if (usesPack) nodes.push({'name': 'PACK'});

    return { 'nodes': nodes, 'links': links };
};

var forceInput = forceFormat(dag);
{% endhighlight %}

`forceFormat` outputs a JSON object that can be used as input for the
Force layout.

{% highlight javascript %}
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
{% endhighlight %}

I can pass this resulting JSON object off to a function that I created after
a long time staring at one of
 [mbostock](https://github.com/mbostock/d3/wiki/Gallery)&#8217;s many amazing
 [examples](http://bl.ocks.org/mbostock/1138500)
to create a D3 Force graph of verticies and edges:

{% highlight javascript %}
// http://bl.ocks.org/mbostock/1138500
var makeGraph  = function(target, graphData) {
    var target = d3.select(target),
        bounds = target.node().getBoundingClientRect(),
        fill   = d3.scale.category20(),
        radius = 25;

    var svg = target.append('svg')
        .attr('width', bounds.width)
        .attr('height', bounds.height);

    // Arrow marker for end-of-line arrow
    svg.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('refX', 17.5)
        .attr('refY', 2)
        .attr('markerWidth', 8)
        .attr('markerHeight', 4)
        .attr('orient', 'auto')
        .attr('fill', '#ccc')
        .append('path')
        .attr('d', 'M 0,0 V 4 L6,2 Z');

    var link = svg.selectAll('line')
        .data(graphData.links)
        .enter()
            .append('line')
                .attr('class', 'link')
                .attr('marker-end', 'url(#arrowhead)');

    // Create a group for each node
    var node = svg.selectAll('g')
        .data(graphData.nodes)
        .enter()
            .append('g');

    // Color the node based on node's git-type (otherwise, hot pink!)
    node.append('circle')
        .attr('r', radius)
        .attr('class', 'node')
        .attr('fill', function(d) {
            var blue  = '#1BA1E2',
                red   = 'tomato',
                green = '#5BB75B',
                pink  = '#FE57A1';

            if (d.name.endsWith('.b')) { return red; }
            if (d.name.endsWith('.t')) { return blue; }
            if (d.name.endsWith('.c')) { return green; }
            return pink;
        });

    node.append('text')
        .attr('y', radius * 1.5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#555')
        .text(function(d) {
            if (d.name.length > 10) {
                return d.name.substring(0, 8) + '...';
            }

            return d.name;
         });

    // If the node has a type: tag it
    node.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 4)
        .attr('fill', 'white')
        .attr('class', 'bold-text')
        .text(function(d) {
            if (d.name.endsWith('.b')) { return 'BLOB'; }
            if (d.name.endsWith('.t')) { return 'TREE'; }
            if (d.name.endsWith('.c')) { return 'COMMIT'; }
            return '';
         });

    var charge = 700 * graphData.nodes.length;

    var force = d3.layout.force()
        .size([bounds.width, bounds.height])
        .nodes(graphData.nodes)
        .links(graphData.links)
        .linkDistance(150)
        .charge(-(charge))
        .gravity(1)
        .on('tick', tick);

    // No fancy animation, tick amount varies based on number of nodes
    force.start();
    for (var i = 0; i < graphData.nodes.length * 100; ++i) force.tick();
    force.stop();

    function tick(e) {
        // Push sources up and targets down to form a weak tree.
        var k = -12 * e.alpha;

        link
            .each(function(d) { d.source.y -= k, d.target.y += k; })
                .attr('x2', function(d) { return d.source.x; })
                .attr('y2', function(d) { return d.source.y; })
                .attr('x1', function(d) { return d.target.x; })
                .attr('y1', function(d) { return d.target.y; });

        node
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            });
    }
};
makeGraph('.merkle-1', forceInput);
{% endhighlight %}

<div class=merkle-1></div>
You&#8217;d be forgiven for thinking that is a line.

This directional line _is_ a DAG—albeit a simple one. `Node B` depends on
`Node A` and that is the whole graph. If you want to get to `Node B` then
you have to start at `Node A`. Depending on your problem-space, `Node B` could
be many things: A place in
 [Königsberg](https://en.wikipedia.org/wiki/Seven_Bridges_of_K%C3%B6nigsberg),
a target in a Makefile (or a [Rakefile](http://martinfowler.com/articles/rake.html)),
or (brace yourself) a _Git object_.

Git Object Anatomy
---

In order to understand how Git is a DAG, you need to understand Git &#8220;objects&#8221;:

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

What are Git objects? Because they look like nonsense:

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

There are a few parts of that message that aren&#8217;t immediately obvious.
What is `tree 098e6de29daf4e55f83406b49f5768df9bc7d624`? And
why would we store this message in `.git/objects/1a/06ce381ac14f7a5baa1670691c2ff8a73aa6da`
and not `.git/objects/commit-message`? Is a _merkle_ what I think it is?
The answer to all of these questions and many more is the same:
[Cryptographic Hash Functions](https://en.wikipedia.org/wiki/Cryptographic_hash_function).

Hash Functions
---

A cryptographic hash function is a function that when given an input of any
length it creates a fixed-length output. Furthermore (and more importantly),
the fixed-length output should be unique to a given input; any change in
input will likely cause a big change in the output. Git uses a cryptographic
hash function called _Secure Hash Algorithm 1_ ([SHA-1](https://en.wikipedia.org/wiki/SHA-1)).

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
This is what cryptographic hash functions do.

Hash that DAG!
---

Now that we have some idea of what is inside a commit object, let&#8217;s
reverse-engineer the commit object from the `HEAD` of our `merkle` repo:

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
{% endhighlight %}
{% highlight bash %}
$ printf 'tree 098e6de29daf4e55f83406b49f5768df9bc7d62k4\n' >> commit-msg
$ printf 'author Tyler Cipriani <tcipriani@wikimedia.org> 1458604120 -0700\n' >> commit-msg
$ printf 'committer Tyler Cipriani <tcipriani@wikimedia.org> 1458604120 -0700\n' >> commit-msg
$ printf '\nInitial Commit\n' >> commit-msg
{% endhighlight %}
{% highlight bash %}
$ sha1sum <(cat \
    <(printf "commit ") \
    <(wc -c < commit-msg | tr -d '\n') \
    <(printf '%b' '\0') commit-msg)
1a06ce381ac14f7a5baa1670691c2ff8a73aa6da  /dev/fd/63
{% endhighlight %}
Hmm&#8230; that seems familiar
{% highlight bash %}
$ export COMMIT_HASH=$(sha1sum <(cat <(printf "commit ") <(wc -c < commit-msg | tr -d '\n') <(printf '%b' '\0') commit-msg) | cut -d' ' -f1)
$ find ".git/objects/${COMMIT_HASH:0:2}" -type f -name "${COMMIT_HASH:(-38)}"
.git/objects/1a/06ce381ac14f7a5baa1670691c2ff8a73aa6da
{% endhighlight %}

The commit object is a zlib-compressed, formatted message that is stored in
a file named after the SHA-1 hash of the file&#8217;s un-`zlib` compressed
contents.

(/me wipes brow)

Let&#8217;s use `git-cat-file` to see if we can explore the
`tree 098e6de29daf4e55f83406b49f5768df9bc7d62k4`-part of the commit message object:

{% highlight bash %}
$ cat .git/HEAD
ref: refs/heads/master
{% endhighlight %}
{% highlight bash %}
$ cat .git/refs/heads/master
1a06ce381ac14f7a5baa1670691c2ff8a73aa6da
{% endhighlight %}
{% highlight bash %}
$ git cat-file -p 1a06ce381ac14f7a5baa1670691c2ff8a73aa6da
tree 098e6de29daf4e55f83406b49f5768df9bc7d624
author Tyler Cipriani <tcipriani@wikimedia.org> 1458604120 -0700
committer Tyler Cipriani <tcipriani@wikimedia.org> 1458604120 -0700
{% endhighlight %}
{% highlight bash %}
$ git cat-file -p 098e6de29daf4e55f83406b49f5768df9bc7d624
100644 blob 1b9f426a8407ffee551ad2993c5d7d3780296353    README
{% endhighlight %}
{% highlight bash %}
$ git cat-file -p 1b9f426a8407ffee551ad2993c5d7d3780296353
This is the beginning
{% endhighlight %}

Hey that&#8217;s the text I put into `README`!

So `.git/HEAD` refers to  `.git/refs/heads/master`,
calling `git-cat-file` on the object found inside that file shows that it&#8217;s
the commit object we recreated. The commit object points to `098e6de29daf4e55f83406b49f5768df9bc7d624`,
which is a tree object with the contents: `100644 blob 1b9f426a8407ffee551ad2993c5d7d3780296353    README`
The `blob` object `1b9f426a8407ffee551ad2993c5d7d3780296353` is the contents of `README`!
So it seems each `commit` object points to a `tree` object that points to other
objects.

What was I talking about? Merkle DAGs? D3.js?
---

Let&#8217;s see if we can paste together what Git is doing at a low-level when
we make a new commit:

1. Take the contents of `README`, hash the contents using SHA-1, and store
   as a `blob` object in `.git/objects`.
2. Create a directory listing of the git working directory, listing each
   file, with its directory permissions and its hash value. Hash this
   directory listing and store as a `tree` in `.git/objects`.
3. Take the commit message, along with info from `.gitconfig` and the hash
   of the top-level tree. Hash this information and store it as a `commit`
   object in `.git/objects`.

It seems that there may be a chain of dependencies:

{% highlight javascript %}
var gitDag = {
    // blob (add .b for blob)
    '1b9f426a8407ffee551ad2993c5d7d3780296353.b': [],
    // tree (.t == tree) is a hash that includes the hash from blob
    '098e6de29daf4e55f83406b49f5768df9bc7d624.t': ['1b9f426a8407ffee551ad2993c5d7d3780296353.b'],
    // commit (.c == commit) is a hash that includes the hash from tree
    '1a06ce381ac14f7a5baa1670691c2ff8a73aa6da.c': ['098e6de29daf4e55f83406b49f5768df9bc7d624.t'],
};

makeGraph('.merkle-2', forceFormat(gitDag));
{% endhighlight %}
<div class=merkle-2></div>
You&#8217;d be forgiven for thinking that is a line.

What&#8217;s really happening is that there is a `commit` object (`1a06ce38`) that
depends on a `tree` object (`098e6de2`) that depends on a `blob` (`1b9f426a`).

Since it&#8217;s running each of these objects through a hash function and each
of them contains a reference up the chain of dependencies, a minor change to
either the `blob` or the `tree` will create a drastically different `commit`
object.

Applying a cryptographic hash function on top of a graph was
[Ralph Merkle](https://en.wikipedia.org/wiki/Ralph_Merkle)&#8217;s big idea. This
scheme makes magic possible. Transferring verifiable and trusted information
through an untrusted medium is toatz for realz possible with Ralph&#8217;s little
scheme.

The idea is that if you have the _root-node hash_, that is, the cryptographic
hash of the node that depends on all other nodes (the `commit` object in Git),
and you obtained that root-node hash from a trusted source, you can trust
all sub-nodes that stem from that root node *if* the
hash of all those sub-root-nodes matches the root-node hash!

This is the mechanism by which things like Git,
[IPFS](https://github.com/ipfs/specs/blob/master/protocol/README.md#1-ipfs-and-the-merkle-dag),
[Bitcoin](http://chimera.labs.oreilly.com/books/1234000001802/ch07.html#merkle_trees), and
[BitTorrent](http://bittorrent.org/beps/bep_0030.html)
are made possible: changing any one node in the graph changes all nodes that
depend on that node all the way to the root-node (the `commit` in Git).

Tales from the Merkle Graph
---

I wrote a simple NodeJS script that creates
a graph that is suitable for input into the JavaScript that I&#8217;ve already
written that will create a D3.js force graph with whatever it finds in `.git/objects`.

{% highlight javascript %}
#!/usr/bin/env nodejs
/* makeDag - creates a JSON dependency graph from .git/objects */

var glob = require('glob'),
    fs = require('fs'),
    zlib = require('zlib');

var types = ['tree', 'commit', 'blob'],
    treeRegex = {
        // 100644 README\0[20 byte sha1]
        regex: /[0-9]+\s[^\0]+\0((.|\n){20})/gm,
        fn: function(sha) {
            var buf = new Buffer(sha[1], 'binary');
            return buf.toString('hex') + '.b';
        }
    },
    commitRegex = {
        // tree 098e6de29daf4e55f83406b49f5768df9bc7d624
        regex: /(tree|parent)\s([a-f0-9]{40})/gm,
        fn: function(sha) {
            if (sha[1] === 'tree') {
                return sha[2] + '.t';
            }
            return sha[2] + '.c';
        }
    },
    total = 0,
    final = {};

// determine file type, parse out SHA1s
var handleObjects = function(objData, name) {
    types.forEach(function(type) {
        var re, regex, match, key;

        if (!objData.startsWith(type)) { return; }

        key = name + '.' + type[0];
        final[key] = [];
        if (type === 'tree') { objType = treeRegex; }
        if (type === 'commit') { objType = commitRegex; }
        if (type === 'blob') { return; }

        // Remove the object-type and size from file
        objData = objData.split('\0');
        objData.shift();
        objData = objData.join('\0');

        // Recursive regex match remainder
        while ((match = objType.regex.exec(objData)) !== null) {
            final[key].push(objType.fn(match));
        }
    });

    // Don't output until you've got it all
    if (Object.keys(final).length !== total) {
        return;
    }

    // Output what ya got.
    console.log(final);
};

// Readable object names not file names
var getName = function(file) {
    var fileParts = file.split('/'),
        len = fileParts.length;
    return fileParts[len - 2] + fileParts[len - 1];
}

// Inflate the deflated git object file
var handleFile = function(file, out) {
    var name = getName(file);

    fs.readFile(file, function(e, data) {
        zlib.inflate(data, function(e, data) {
            if (e) { console.log(file, e); return; }
            handleObjects(data.toString('binary'), name);
        });
    });
};

// Sort through the gitobjects directory
var handleFiles = function(files) {
    files.forEach(function(file) {
        fs.stat(file, function(e, f) {
            if (e) { return; }
            if (f.isFile()) {
                // Don't worry about pack files for now
                if (file.indexOf('pack') > -1) { return; }
                total++;
                handleFile(file);
            }
        });

    });
};

(function() {
    glob('.git/objects/**/*', function(e, f) {
        if (e) { throw e; }
        handleFiles(f);
    });
})();
{% endhighlight %}

Merkle graph transformations are often difficult to describe, but easy to see.
Using this last piece of code to create and view graphs for several repositories
has been illuminating. The graph visualization both illuminates and challenges
my understanding of Git in ways I didn't anticipate.

### The Tale of Commit Message Bike-shedding

When you change your commit message, what happens to the graph? What depends
on a commit? Where is the context for a commit?

{% highlight bash %}
$ git commit --amend -m 'This is the commit message now'
[master 585448a] This is the commit message now
 Date: Mon Mar 21 16:48:40 2016 -0700
  1 file changed, 1 insertion(+)
   create mode 100644 README
$ find .git/objects -type f
.git/objects/1b/9f426a8407ffee551ad2993c5d7d3780296353
.git/objects/09/8e6de29daf4e55f83406b49f5768df9bc7d624
.git/objects/1a/06ce381ac14f7a5baa1670691c2ff8a73aa6da
.git/objects/da/94af3a21ac7e0c875bbbe6162aa1d26d699c73
{% endhighlight %}

Now the DAG is a bit different:
{% highlight javascript %}
var gitDag = { '098e6de29daf4e55f83406b49f5768df9bc7d624.t': [ '1b9f426a8407ffee551ad2993c5d7d3780296353.b' ],
  '1a06ce381ac14f7a5baa1670691c2ff8a73aa6da.c': [ '098e6de29daf4e55f83406b49f5768df9bc7d624.t' ],
  '1b9f426a8407ffee551ad2993c5d7d3780296353.b': [],
  'da94af3a21ac7e0c875bbbe6162aa1d26d699c73.c': [ '098e6de29daf4e55f83406b49f5768df9bc7d624.t' ] }

makeGraph('.merkle-3', forceFormat(gitDag));
{% endhighlight %}
<div class=merkle-3></div>

Here we see that there are now two `commit` objects (`1a06ce38` and `da94af3a`)
that both depend on a single `tree` object (`098e6de2`) that depends on
a single `blob` (`1b9f426a`).

One of these commit objects will never be seen with `git log`.


### The Orphan Blob That Dared to Dream

TIL: Git creates `blob` objects as soon as a file is added to the staging area.

{% highlight bash %}
$ echo 'staged' > staged
$ find .git/objects -type f
.git/objects/1b/9f426a8407ffee551ad2993c5d7d3780296353
.git/objects/09/8e6de29daf4e55f83406b49f5768df9bc7d624
.git/objects/1a/06ce381ac14f7a5baa1670691c2ff8a73aa6da
.git/objects/da/94af3a21ac7e0c875bbbe6162aa1d26d699c73
{% endhighlight %}

Notice that nothing depends on this object just yet. It&#8217;s a lonely orphan `blob`.

{% highlight bash %}
$ git add staged
$ find .git/objects -type f
.git/objects/1b/9f426a8407ffee551ad2993c5d7d3780296353
.git/objects/09/8e6de29daf4e55f83406b49f5768df9bc7d624
.git/objects/1a/06ce381ac14f7a5baa1670691c2ff8a73aa6da
.git/objects/da/94af3a21ac7e0c875bbbe6162aa1d26d699c73
.git/objects/19/d9cc8584ac2c7dcf57d2680375e80f099dc481
$ makeDag
{ '098e6de29daf4e55f83406b49f5768df9bc7d624.t': [ '1b9f426a8407ffee551ad2993c5d7d3780296353.b' ],
  '19d9cc8584ac2c7dcf57d2680375e80f099dc481.b': [],
  '1a06ce381ac14f7a5baa1670691c2ff8a73aa6da.c': [ '098e6de29daf4e55f83406b49f5768df9bc7d624.t' ],
  'da94af3a21ac7e0c875bbbe6162aa1d26d699c73.c': [ '098e6de29daf4e55f83406b49f5768df9bc7d624.t' ],
  '1b9f426a8407ffee551ad2993c5d7d3780296353.b': [] }

{% endhighlight %}
<div class=merkle-4></div>

Even unstaging and deleting the file doesn&#8217;t remove the object. Orphan
objects in git are only garbage collected as part of `git gc --prune`.

When this object is committed to the repo, it creates a whole new layer of
the graph:

{% highlight bash %}
$ git commit -m 'Add staged file'
[master 4f407b3] Add staged file
 1 file changed, 1 insertion(+)
 create mode 100644 staged
$ makeDag
{ '098e6de29daf4e55f83406b49f5768df9bc7d624.t': [ '1b9f426a8407ffee551ad2993c5d7d3780296353.b' ],
  '19d9cc8584ac2c7dcf57d2680375e80f099dc481.b': [],
  '1a06ce381ac14f7a5baa1670691c2ff8a73aa6da.c': [ '098e6de29daf4e55f83406b49f5768df9bc7d624.t' ],
  '1b9f426a8407ffee551ad2993c5d7d3780296353.b': [],
  '4f407b396e6ecbb65de6cf192259c18ecd4d1e9b.c': 
   [ '7ce38101e91de29ee0fee3aa9940cc81159e0f8d.t',
     'da94af3a21ac7e0c875bbbe6162aa1d26d699c73.c' ],
  '7ce38101e91de29ee0fee3aa9940cc81159e0f8d.t': 
   [ '1b9f426a8407ffee551ad2993c5d7d3780296353.b',
     '19d9cc8584ac2c7dcf57d2680375e80f099dc481.b' ],
  'da94af3a21ac7e0c875bbbe6162aa1d26d699c73.c': [ '098e6de29daf4e55f83406b49f5768df9bc7d624.t' ] }
{% endhighlight %}
<div class=merkle-5></div>

So we've created a new commit (`4f407b39`) that is the parent of a different
commit (`da94af3a`) and a new tree (`7ce38101`) that contains our old `README`
 blob (`1b9f426a`) and our new, previously orphaned, blob (`19d9cc85`).

### The Tale of Powerful Software

I&#8217;ve always enjoyed the idea that software (and computer science more generally)
is nothing but an abstraction to manage complexity. Good software&mdash;
powerful software&mdash;like Git&mdash;is a software that manages an incredible amount
of complexity and hides it completely from the user.

In recognition of this idea, I&#8217;ll leave you with the graph of my local copy of
[clippy](https://github.com/thcipriani/clippy)&mdash;a small command
line tool I created that is like `man(1)` except it shows
 [Clippy](https://en.wikipedia.org/wiki/Office_Assistant)
at the end of the `man` output (yes, it&#8217;s dumb).

This should give you an idea of the complexity that is abstracted by
the Git merkle graph: this repo contains 5 commits!
<div class=merkle-container><div class=merkle-6></div></div>
