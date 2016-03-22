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
        .text(function(d) {
            if (d.name.length > 10) {
                return d.name.substring(0, 8) + '...';
            }

            return d.name;
         })

    var charge = 700 * graphData.nodes.length;

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

var dag = {
    'Node A': [],
    'Node B': ['Node A']
};

var gitDag = {
    // blob
    '1b9f426a8407ffee551ad2993c5d7d3780296353': [],
    // tree is a hash that includes the hash from blob
    '098e6de29daf4e55f83406b49f5768df9bc7d624': ['1b9f426a8407ffee551ad2993c5d7d3780296353'],
    // commit is a hash that includes the hash from tree
    '1a06ce381ac14f7a5baa1670691c2ff8a73aa6da': ['098e6de29daf4e55f83406b49f5768df9bc7d624'],
};

var forceInput = forceFormat(dag);

makeGraph('.merkle-1', forceInput);
makeGraph('.merkle-2', forceFormat(gitDag));

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

