export function visualize (input, graph){
	createAdjacencyMatrix(input);
	createGraph(graph)
	document.getElementById("adjacency_matrix").setAttribute("style", "overflow:auto; height:960px; width:960px;")
	document.getElementById("graph").setAttribute("style", "overflow:auto; height:960px; width:960px;")
}

function createAdjacencyMatrix(data) {
	const adjacencyMatrix = d3.adjacencyMatrixLayout();
	console.log('adjacencyMatrix', adjacencyMatrix);
	console.log('d3', d3);

	adjacencyMatrix
		.size([870, 870])
		.nodes(data.nodes)
		.links(data.links)
		.directed(false)
		.nodeID(d => d.name);

	const matrixData = adjacencyMatrix();

	console.log(matrixData)

	const someColors = d3.scaleOrdinal()
		.range(d3.schemeCategory20b);

	d3.select('svg')
		.append('g')
		.attr('transform', 'translate(80,80)')
		.attr('id', 'adjacencyG')
		.selectAll('rect')
		.data(matrixData)
		.enter()
		.append('rect')
		.attr('width', d => d.width)
		.attr('height', d => d.height)
		.attr('x', d => d.x)
		.attr('y', d => d.y)
		.style('stroke', 'black')
		.style('stroke-width', '1px')
		.style('stroke-opacity', .1)
		.style('fill', d => someColors(d.source.group))
		.style('fill-opacity', d => d.weight * 0.8);
	// style="auto" height="960px" width="960px"
	d3.select('#adjacencyG')
		.call(adjacencyMatrix.xAxis);

	d3.select('#adjacencyG')
		.call(adjacencyMatrix.yAxis);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function createGraph(graph) {
	var svg = d3.select("#graph"),
		width = +svg.attr("width"),
		height = +svg.attr("height");

	var color = d3.scaleOrdinal(d3.schemeCategory20);

	var simulation = d3.forceSimulation()
		.force("link", d3.forceLink().id(function(d) { return d.name; }).distance(150))
		.force("charge", d3.forceManyBody())
		.force("center", d3.forceCenter(width / 2, height / 2));



	var link = svg.append("g")
	  .attr("class", "links")
	.selectAll("line")
	.data(graph.links)
	.enter().append("line")
	  .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

	var node = svg.append("g")
	  .attr("class", "nodes")
	.selectAll("g")
	.data(graph.nodes)
	.enter().append("g")

	var circles = node.append("circle")
	  .attr("r", function(d) {      
	  // trying to reproduce https://stackoverflow.com/a/43906810/9164621 for visualizing weights.
			 d.weight = link.filter(function(l) {
			   return l.source == d.name || l.target == d.name
			 }).size();      
			 var minRadius = 1;
			 return minRadius + (d.weight * 0.1);
		})
	  .attr("fill", function(d) { return color(d.group); })
	  .call(d3.drag()
		  .on("start", dragstarted)
		  .on("drag", dragged)
		  .on("end", dragended));

	var lables = node.append("text")
	  .text(function(d) {
		return d.name;
	  })
	  .attr('x', 6)
	  .attr('y', 3);

	node.append("title")
	  .text(function(d) { return d.name; });

	simulation
	  .nodes(graph.nodes)
	  .on("tick", ticked);

	simulation.force("link")
	  .links(graph.links);

	function ticked() {
	link
		.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });

	node
		.attr("transform", function(d) {
		  return "translate(" + d.x + "," + d.y + ")";
		})
	}

	function dragstarted(d) {
	  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
	  d.fx = d.x;
	  d.fy = d.y;
	}

	function dragged(d) {
	  d.fx = d3.event.x;
	  d.fy = d3.event.y;
	}

	function dragended(d) {
	  if (!d3.event.active) simulation.alphaTarget(0);
	  d.fx = null;
	  d.fy = null;
	}
}