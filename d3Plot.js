

plot(svg,data, width, height, options, theme);

function plot(svg, data, width, height, options, theme)
{
	"use strict";
		
	width = window.innerWidth - 50;
	
	document.getElementById("d3").setAttribute("style","width:" + width);
	
	svg.attr("width", width);
	
	// For inspecting data in browser console
	//console = d3.window(svg.node()).console;
	//console.info(data);
	//console.info(width);
	//console.info(options.packing);
	//console.info(options.scatterColorDomain);
	//console.info(options);

	let margin = 20,
		diameter = height;

	
	svg.selectAll('g').remove();
	d3.select("body").selectAll('.packingTooltip').remove();
	d3.select("body").selectAll('.scatterChartTooltip').remove();

	let chart = svg.append("g")
				.attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");


	let root = d3.hierarchy(options.circleData)
				.sum(function(d) { return d.value; })
				.sort(function(a, b) { return b.value - a.value; });
				
	let packlayout = d3.pack()
						.size([diameter - margin, diameter - margin])
						.padding(2);
	
	let colorScale = d3.scaleOrdinal()
						.domain([0,1,2])
						.range(['#4d80e4','#46b3e6','#dff6f0']);
	
	let packingTooltip = d3.select("body").append("div")
		.attr("class", "packingTooltip")
		.style("position", "absolute")
		.style("visibility", "hidden")		
		.style("border", "2px solid #ccc")
		.style("padding", "5px")
		.style("background","white")
		.style("top", (document.documentElement.scrollHeight - height - margin) + "px")
		.style("left", "29px")
		.html("");
	
			
	let focus = root,
		nodes = packlayout(root).descendants(),
		view,
		depth,
		selectedGroup = "root";


	let circle = chart.selectAll("circle")
		.data(nodes)
		.enter()
		.append('circle')
		.style("fill", function(d) { return colorScale(d.depth); })
		.on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
		.on("mouseout", function() { d3.select(this).attr("stroke", null); })
		.on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); });
		
	let text = chart.selectAll("text")
		.data(nodes)
		.enter()
		.append('text')
		.attr("class", "label")
        .attr("pointer-events", "none")
		.style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
		.style("cursor", "default")
		.attr('dx', function(d) { return -d.data.name.length * 3.8; })  
		.attr('dy', 4)
		.text(function(d) { return d.data.name; });
	
	let node = chart.selectAll("circle, text");
	
	zoomTo([root.x, root.y, root.r * 2 + margin]);
	
	function zoom(d) {
		let focus0 = focus; 
		focus = d;
		depth = d.depth;
		
		packingTooltip.style("visibility", "hidden");
		
		if(depth == 1){
			selectedGroup = d.data.name;
			
			packingTooltip.html("<b>"+selectedGroup+"</b>")
				.style("visibility", "visible");
		}
		else if (depth == 2) {
			selectedGroup = d.data.name;
		}
		else {
			selectedGroup = "root";
		}
		scatterChart.selectAll(".point").style("display", function(d) { 
			if(selectedGroup == "root") {
				return "inline";
			}
			else if(depth == 2) {
				if(d.name == selectedGroup){
					return "inline";
				}
				else {
					return "none";
				}
			}
			else {
				if(d[options.packing] == selectedGroup){
					return "inline";
				}
				else {
					return "none";
				}
			}
		})

		d3.transition()
			.duration(500)
			.tween("zoom", function(d) {
			  var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
			  return function(t) { zoomTo(i(t)); };
			})
			.on("end", function(d) { 
				chart.selectAll("text")
					.style("fill-opacity", 0)
					.style("fill-opacity", function(d) {return d.parent === focus || (d === focus && !d.hasOwnProperty("children")) ? 1 : 0; });
			});

	}

	function zoomTo(v) {
		let k = diameter / v[2]; 
		view = v;
		node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
		circle.attr("r", function(d) { return d.r * k; });
	}
	
	
	/////////////////////////////////////////////////////////////////////////////////
	
	let newWidth = width / 2,
		newHeight = height - margin * 2;
	
	let scatterChart = svg.append("g")
		.attr("transform", "translate(" + newWidth + "," + margin + ")");
		
	scatterChart.append("rect")
    .attr("width", newWidth + margin * 3)
    .attr("height", newHeight + margin * 3)
    .attr("fill", "white")
	.attr("transform", "translate(" + -50 + "," + -20 + ")");
		
	scatterChart = svg.append("g")
		.attr("transform", "translate(" + newWidth + "," + margin + ")");
		
	scatterChart.append("rect")
	.attr("width", newWidth + margin * 3)
	.attr("height", newHeight + margin * 3)
	.attr("fill", "white")
	.attr("transform", "translate(" + -50 + "," + -20 + ")");
	
	let xExtent = d3.extent(data, function(d){return d.commits;});
	xExtent[0] = Math.floor(xExtent[0] * 0.9);;
	xExtent[1] = Math.ceil(xExtent[1] * 2);
	let yExtent = d3.extent(data, function(d){return d.stars;});
	yExtent[0] = Math.floor(yExtent[0] * 0.9);
	yExtent[1] = Math.ceil(yExtent[1] * 2);
	let cExtent = d3.extent(data, function(d){return d.contributors;});
		
	let xScale = d3.scaleLog()
		.domain(xExtent)
		.range([0, newWidth - 130]);
	let yScale = d3.scaleLog()
		.domain(yExtent)
		.range([newHeight, 0]);
	let scatterColorScale = d3.scaleOrdinal()
		.domain(options.scatterColorDomain)
		.range(["#1f77b4",  "#ff7f0e", "#2ca02c","#98df8a",  "#d62728", "#9467bd","#ff9896", "#c5b0d5",  "#8c564b","#c49c94",  "#e377c2","#f7b6d2", "#aec7e8", "#7f7f7f","#c7c7c7", "#ffbb78",  "#bcbd22","#dbdb8d",  "#17becf","#9edae5", "#ddf1aa", "#5d0b6d"]);
	let sizeScale = d3.scaleSqrt()
			.domain(cExtent)
			.range([7,50]);
	
	scatterChart.append("g")
	  .attr("class", "legendOrdinal")
	  .attr("transform", "translate(" + (newWidth - 95) + "," + (-10) + ")");

	let legendOrdinal = d3.legendColor()
	  .shape("path", d3.symbol().type(d3.symbolCircle).size(50)())
	  .shapePadding(3)
	  .scale(scatterColorScale);

	scatterChart.select(".legendOrdinal")
	  .call(legendOrdinal);
	 
	
	// 3. Call the x axis in a group tag
	scatterChart.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + newHeight + ")")
		.call(d3.axisBottom(xScale).ticks(9,",.0f")); // Create an axis component with d3.axisBottom
		
	// 4. Call the y axis in a group tag
	scatterChart.append("g")
		.attr("class", "y axis")
		.call(d3.axisLeft(yScale).ticks(9,",.0f")); // Create an axis component with d3.axisLeft

	// text label for the x axis
	scatterChart.append("text")             
	  .attr("transform",
			"translate(" + (newWidth - 130) + " ," + 
						   (newHeight - 10) + ")")
	  .style("text-anchor", "end")
	  .style("font-size", 10)
	  .style("fill", "#777")
	  .text("Number of Commits");

	// text label for the y axis
	scatterChart.append("text")
	  .attr("transform", "rotate(-90)")
	  .attr("y", 15)
	  .attr("x", 0)
	  .style("text-anchor", "end")
	  .style("font-size", 10)
	  .style("fill", "#777")
	  .text("Number of Stars");  

	let tooltip = d3.select("body").append("div")
		.attr("class", "scatterChartTooltip")
		.style("position", "absolute")
		.style("visibility", "hidden")		
		.style("border", "2px solid #ccc")
		.style("padding", "5px")
		.style("background","white")
		.html("");
		

	
	let initialOpacity = 0.8;
	let selectOpacity = 0.95;
	let backgroundOpacity = 0.3;
		
	scatterChart.selectAll(".point")
		.data(data)
		.enter()
		.append("circle")
		.attr("class", "point")
		.attr("cx", function(d){return xScale(d.commits);})
		.attr("cy", function(d){return yScale(d.stars);})
		.attr("r", function(d){return sizeScale(d.contributors);})
		.style("fill", function(d) { return scatterColorScale(d[options.packing]);})
		.style("stroke", "black") 
		.style("opacity", initialOpacity) 
		.on("mouseover", function(d) {
		  scatterChart.selectAll("circle").style("opacity", backgroundOpacity);
		  d3.select(this).style("opacity", selectOpacity);
		  
		  tooltip.html("<b>"+d.name+"</b><br\>commits: "+d.commits+"<br\>stars: "+d.stars+"<br\>contributors: "+d.contributors)
			.style("visibility", "visible")
			.style("top", (d3.event.pageY-10)+"px")
			.style("left",(d3.event.pageX+10)+"px");
		})
		.on("mouseout", function(d) {
		  scatterChart.selectAll("circle").style("opacity", initialOpacity);
		  tooltip.style("visibility", "hidden");
		});	
}