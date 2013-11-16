function drawScatterPlot(){
	var height = 400,
			width = 400;

	var x = d3.scale.linear()
			.domain([0, 1])
			.range([0, width])

	var y = d3.scale.linear()
			.domain([0, 1])
			.range([0, height])

	var scatterSVG = d3.select('#scatterPlot')
		.append('svg')
			.attr('width', height)
			.attr('height', width);

	scatterSVG.selectAll('.circleG')
			.data(data).enter()
		.append('g')
			.classed('circleG', true)
			.on('mouseover', circleGMouseOver)
			.on('mouseout', circleGMouseOut)
		.selectAll('circle')
			.data(function(d){ return d.tags.faces; }).enter()
		.append('circle')
			.attr('r', 5)
			.attr('cx', function(d){ return x(d.center_pos.value[0]) })
			.attr('cy', function(d){ return y(d.center_pos.value[1]) })
			.style('fill-opacity', .05)
			.style('fill', 'steelblue')
			.style('stroke', 'green')
			.style('stroke-width', .3)
			.style('stroke-opacity', .5)

	function circleGMouseOver(d){

		d3.selectAll('.selectedCircle')
				.classed('selectedCircle', false)	
			.transition().duration(500)
				.style('fill-opacity', .05)
				.attr('r', 5)

		d3.select(this).selectAll('circle')
				.classed('selectedCircle', true)
				.style('fill-opacity', .5)
				.attr('r', 15);

		d3.select('#artImage').node()
				.src = '../imageCache' + d.image.split('.org')[1];
		console.log(d.image.split('.org')[1]);
	}

	function circleGMouseOut(d){
	}

}