"use strict";

// Global variables

var nodes = [];
var edges = [];
var labels = [];
var connected_components = {}
var networks = [];
var networksUpdated = false;
var size = [600,500]

var x = d3.scale.linear()
    .domain([0,1])
    .range([30, size[0]-30]);
var y = d3.scale.linear()
    .domain([0,1])
    .range([30, size[1]-30]);

var selected = null,
	dragged = null

var selectedEdge = null


// Handy methods for updating labels, networks and edges

function updateLabels() {
	labels = []
	for (var i in nodes) {
		if ('label' in nodes[i]) {
			labels.push({'id':nodes[i]['id'], 'label':nodes[i]['label']})
		}
	}
}

function updateNetworks() {
	//var cc = {}
	connected_components = {};
	networks = [];
	var ccnodes = [];
	$.each(nodes, function(i,node){
		connected_components[node.id] = [node.id];
	})
	//console.log(connected_components);
	$.each(edges, function(i,edge){
		var cc1 = connected_components[edge.source];
		var cc2 = connected_components[edge.target];
		var newcc = cc1.concat(cc2);
		newcc = $.unique(newcc);
		newcc.sort();
		$.each(newcc, function(j,node){
			connected_components[node] = newcc;
		})
	})
	//console.log('conn_com',connected_components)
	$.each(nodes, function(i,node) {
		if ($.inArray(connected_components[node.id], ccnodes) == -1) {
			//console.log('passa?',node.id,connected_components[node]);
			ccnodes.push(connected_components[node.id]);
		} 
	})
	//$.each(connected_components, function(nodeId,cc) {
	//	ccnodes.push(cc);
	//})
	//ccnodes = $.unique(ccnodes);
	//console.log('ccnodes',ccnodes);
	var num=1;
	$.each(ccnodes, function(i,ccnodesid) {
		var network = {}
		network.nodes = ccnodesid;
		network.minx = d3.min(ccnodesid, function(d) {
			return getNodeById(d).x
		})
		network.maxx = d3.max(ccnodesid, function(d) {
			return getNodeById(d).x
		})
		network.miny = d3.min(ccnodesid, function(d) {
			return getNodeById(d).y
		})
		network.maxy = d3.max(ccnodesid, function(d) {
			return getNodeById(d).y
		})
		network.id = ccnodesid.join()
		network.name = "Net"+num;
		num += 1;
		//console.log('xx:',network,num);
		networks.push(network);
	})
	networksUpdated = true;
}

function updateNetworksPositions() {
	$.each(networks, function(i,network){
		//console.log(network);
		var ccnodesid = network.nodes;
		network.minx = d3.min(ccnodesid, function(d) {
			return getNodeById(d).x
		})
		network.maxx = d3.max(ccnodesid, function(d) {
			return getNodeById(d).x
		})
		network.miny = d3.min(ccnodesid, function(d) {
			return getNodeById(d).y
		})
		network.maxy = d3.max(ccnodesid, function(d) {
			return getNodeById(d).y
		})
		
	})
}

function getNodeById(id) {
	return $.grep(nodes,function(d){return d.id == id;})[0];
}

function getNetworkByName(id) {
	return $.grep(networks,function(d){return d.name == id;})[0];
}

function updateScales(w,h,xmin,xmax,ymin,ymax) {
	var deltax = xmax - xmin,
		deltay = ymax - ymin;
	if (deltay < 1e-6) {
		return
	}
	if (deltax < 1e-6) {
		return
	}
	if (deltay/deltax > h/w) {
		y=d3.scale.linear()
				.domain([ymin,ymax])
				.range([30,h-30])
		x=d3.scale.linear()
				.domain([xmin,xmax])
				.range([(-h*deltax+w*deltay)/(2*deltay),(h*deltax+w*deltay)/(2*deltay)])
	} else {
		x=d3.scale.linear()
				.domain([xmin,xmax])
				.range([30,w-30])
		y=d3.scale.linear()
				.domain([ymin,ymax])
				.range([(-w*deltay+h*deltax)/(2*deltax),(w*deltay+h*deltax)/(2*deltax)])	
	}
}

function updateScalesNodes() {
	var xmin = d3.min(nodes, function(d) { return d.x; }),
		xmax = d3.max(nodes, function(d) { return d.x; }),
		ymin = d3.min(nodes, function(d) { return d.y; }),
		ymax = d3.max(nodes, function(d) { return d.y; });
	updateScales(size[0],size[1],xmin,xmax,ymin,ymax);
}

function updateEdges () {
	$.each(edges, function(i) {
		var edge = edges[i];
		//console.log(edge);
		if (selectedEdge && edge.target == selectedEdge.target && edge.source == selectedEdge.source) {
			edge.type = 'selected'
		} else {
			edge.type = 'arrow'
		}
	})
}

function deleteNode(node) {
	nodes = $.grep(nodes, function(d){return d.id != node.id})
	edges = $.grep(edges, function(e){return e.source != node.id && e.target != node.id});
	networksUpdated = false;
	redraw()
}

function deleteEdge(edge) {
	//console.log(edge);
	//console.log(edges);
	edges = $.grep(edges, function(e){return e.source != edge.source || e.target != edge.target});
	networksUpdated = false;
	redraw()
}



// Creation and handling of the svg canvas

var svg = d3.select("#chart").append("svg:svg")
    .attr("width", size[0])
    .attr("height", size[1])
    //.style("fill", "#EEEEEE")
    .style("background", "#EEEEEE")
    .attr("pointer-events", "all")
    .on("click", clickSvg)
    .on("mousemove",mousemove)
    .on("mouseup",mouseup)
    .call(d3.behavior.zoom().on("zoom", redraw))

svg.append("svg:defs").selectAll("marker")
    .data(["arrow"])
  .enter().append("svg:marker")
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

var network$ = svg.append("svg:g")
var edge$ = svg.append("svg:g")
var node$ = svg.append("svg:g")
var label$ = svg.append("svg:g")

d3.select(window)
//    .on("mousemove", mousemove)
//    .on("mouseup", mouseup)
    .on("keydown", keydown);

function activateKeyboard() {
	//console.log("activateKeyboard")
	d3.select(window).on('keydown',keydown)
}
function deactivateKeyboard() {
	//console.log("deactivateKeyboard")
	d3.select(window).on('keydown',function(){})
}

function redraw() {
	if (d3.event && d3.event.transform){// && isNaN(downx) && isNaN(downy)) {
      d3.event.transform(x, y);
  	};
  	updateLabels();
  	updateEdges();
  	if (networksUpdated) {
  		updateNetworksPositions();
  	} else {
  		updateNetworks();
  	}

   network$.selectAll(".network")
     .data(networks, function(d){return d.id})
     .enter().append("svg:path")
       .attr("class", "network")
       //.on('mouseover',mouseoverNetwork)
   network$.selectAll(".network")
     .data(networks, function(d){return d.id})
     .exit().remove();
   
   network$.selectAll(".network")
    .attr("d", function(d) {
    	return "M" + (x(d.minx)-10) + "," + (y(d.miny)-10) +
    	  "L" + (x(d.minx)-10) + "," + (y(d.maxy)+10) +
    	  "L" + (x(d.maxx)+10) + "," + (y(d.maxy)+10) +
    	  "L" + (x(d.maxx)+10) + "," + (y(d.miny)-10) +
    	  "L" + (x(d.minx)-10) + "," + (y(d.miny)-10) 
    })

   network$.selectAll(".networkLabel")
     .data(networks, function(d){return d.id})
     .enter().append("svg:text")
       .attr("class", "networkLabel")
       .attr("x", 0)
       .attr("y", "-1.7em")
       //.attr("class", "shadow")
       .attr("style","text-anchor: middle;")
       .text(function(d) { return d.name; })
       .on('mouseover',mouseoverNetwork)
       .on('mouseout',mouseoutNetwork)
   network$.selectAll(".networkLabel")
     .data(networks, function(d){return d.id})
     .exit().remove();
 /*  
   network$.selectAll(".network")
    .attr("d", function(d) {
    	return "M" + (x(d.minx)-10) + "," + (y(d.miny)-10) +
    	  "L" + (x(d.minx)-10) + "," + (y(d.maxy)+10) +
    	  "L" + (x(d.maxx)+10) + "," + (y(d.maxy)+10) +
    	  "L" + (x(d.maxx)+10) + "," + (y(d.miny)-10) +
    	  "L" + (x(d.minx)-10) + "," + (y(d.miny)-10) 
    })
*/    
       network$.selectAll(".networkLabel")//.select("g")
       .text(function(d) { return d.name; })
       .attr("transform", function(d) {
       	 //var node = getNodeById(d.id);
    	 return "translate(" + x(d.minx) + "," + y(d.miny) + ")";
  		});



   edge$.selectAll(".edge")
	 .data(edges,function(d){return d.source+'-'+d.target})
	 .enter().append("svg:path")
	  .attr("class", function(d){return "edge "+d.type;})
      .attr("marker-end", function(d) { return "url(#" + d.type + ")"; })
      //.on('mouseover',function(d){console.log(d)})
      .on('click',clickEdge)
   edge$.selectAll(".edge")
	 .data(edges,function(d){return d.source+'-'+d.target})
	 .exit().remove();

   edge$.selectAll(".edge")
   .attr("class", function(d){return "edge "+d.type;})
   .attr("d", function(d) {
   	var target = getNodeById(d.target);
   	var source = getNodeById(d.source);
    var dx = x(target.x) - x(source.x),
        dy = y(target.y) - y(source.y),
        dr = Math.sqrt(dx * dx + dy * dy);
	return "M" + x(source.x) + "," + y(source.y) + "L" + x(target.x) + "," + y(target.y);
    });

   node$.selectAll(".node")
     .data(nodes,function(d){return d.id})
     .enter().append("svg:circle")
      .attr("class", "node")
      .attr("r",6)
      .on('click',clickNode)
      .on('mousedown',mousedownNode)
      .on('mouseover',mouseoverNode)
      .on('mouseout',mouseoutNode)

   node$.selectAll(".node")
     .data(nodes,function(d){return d.id})   
   .exit().remove()
     
   node$.selectAll(".node")
      .attr("cx",function(d){return x(d.x)})
      .attr("cy",function(d){return y(d.y)})
      .attr("class", function(d) { return d == selected ? "node selected" : "node"; });
   
   var xx = label$.selectAll(".label")
      .data(labels,function(d){return d.id+'->'+d.label})
      .enter().append("svg:g")
      .attr("class", "label")
   xx
      .append("svg:text")
    .attr("x", 0)
    .attr("y", "1.7em")
    .attr("class", "shadow")
    .attr("style","text-anchor: middle;")
    .text(function(d) { return d.label; });
   xx
       .append("svg:text")
       .attr("x", 0)
       .attr("y", "1.7em")
       .attr("style","text-anchor: middle;")
       .text(function(d) { return d.label; })
	label$.selectAll(".label")
      .data(labels,function(d){return d.id+'->'+d.label}).exit().remove()
       
   label$.selectAll(".label")//.select("g")
       .attr("transform", function(d) {
       	 var node = getNodeById(d.id);
    	 return "translate(" + x(node.x) + "," + y(node.y) + ")";
  		});
}


function stopBubble() {
	//event.stopImmediatePropagation()
	d3.event.preventDefault();
    d3.event.stopPropagation();
}

function mouseoverNetwork(d) {
//.html( (d.info ? d.info + "<br/>" : "") 
	var echoed = $('<div></div>')
		 .html(
		  (d.info ? d.info + "<br/>" : "") )
	$("#echo_area").empty().append(echoed);

}
	
function mouseoutNetwork(d) {
}
	
	


//var $dialog
function mouseoverNode(d) {
	var labelInput = document.createElement('input');
	labelInput.type = 'text';
	labelInput.value = d.label ? d.label : '';
	labelInput.id = 'labelInput';
	labelInput.onkeypress = function(e) {
		var key = e.keyCode || e.which;
		if(key == 13) {
            var newLabel = labelInput.value;
 	        if (newLabel) {
     	   		d.label = newLabel;
     	   	}
     	   	else {
     	   		delete d.label;
     	   	}
        	updateLabels();
        	redraw();
		}
		return true;
	}
	labelInput.focus();
	var echoed = $('<div></div>')
		 .html(
		  (d.info ? d.info + "<br/>" : "") +
		  'Label:' )
		echoed.append(labelInput);
	$("#echo_area").empty().append(echoed);
	labelInput.focus();
	labelInput.select()
	//deactivateKeyboard();
}



function mouseoutNode(d) {
}

function clickNode(d) {
}

var dragging = false;
function mousedownNode(d) {
	stopBubble();
	//console.log("mousedownNode");
	if (d3.event.shiftKey) {
		if (selected && selected != d) {
			edges.push({source:selected.id, target:d.id, type: 'arrow'});
			networksUpdated = false;
		}
	}
	else {
		dragged = d;
	}
	stopBubble();
	redraw()
}

function clickSvg(d) {
	//console.log("clickSvg");
	//console.log(d);
	if (d3.event.altKey) {
		var newNodePos = d3.svg.mouse(svg.node());
		var i=1;
		while (getNodeById('_'+i)) {i++}
		var newNodeId = '_'+i;
		nodes.push({id:newNodeId, x:x.invert(newNodePos[0]), y:y.invert(newNodePos[1])});
		networksUpdated = false;
		if (d3.event.shiftKey && selected) {
			edges.push({source:selected.id, target:newNodeId, type: 'arrow'});
		}
		redraw();
	}
}

function mousemove() {
	if (!dragged) return;
	dragging = true;
	var m = d3.svg.mouse(svg.node());
  	dragged.x = x.invert(Math.max(0, Math.min(size[0], m[0])));
  	dragged.y = y.invert(Math.max(0, Math.min(size[1], m[1])));
    redraw();
}

function mouseup() {
	if (!dragged) return;
	if (dragging) {
		mousemove();
	}
	else {
		if (selected != dragged) {
			selected = dragged
			selectedEdge = null
				
			var deleteButton = document.createElement('input');
			deleteButton.type = 'button';
			deleteButton.value = 'Delete node';
			deleteButton.onclick = function(e) {
				deleteNode(selected);
				selected = null
			}
			$("#echo_area").append(deleteButton);
	

		} else {
			selected = null
			selectedEdge = null
		}
		redraw();
	}
	dragged = null;
	dragging = false;
	stopBubble();
}

function keydown() {
	//console.log(d3.event.keyCode)
	d3.event.stopPropagation();
	var keycode = d3.event.keyCode
	if (keycode == 68) { // 'D'
		if(selected) {
			deleteNode(selected);
			redraw();
		}
		if(selectedEdge) {
			deleteEdge(selectedEdge);
			redraw();
		}
	}
	if (keycode == 76) { // 'L'
		$("input:disabled").removeAttr('disabled').focus();
		deactivateKeyboard();
	}
	stopBubble();
	return;
}

function clickEdge(edge) {
	//console.log(edge);
	if (selectedEdge == edge) {
		selectedEdge = null
	} else {
		selectedEdge = edge;	
	}
	selected = null
	//updateEdges();
	redraw();
}

// Handlers for AJAX

function post_as_json(url, dataobject, callback) {
	// Encodes dataobject in a json string and does a POST at url.
	// On success calls callback
	var $dialog = $('<div></div>')
		.html('Computing!')
		.dialog({
			autoOpen: false,
			modal:true,
			closeOnScape:false,
			//open:function(event, ui) { $(".ui-dialog-titlebar-close").hide(); },
			title: false //'PhyloSketcthpad'
		});
	$dialog.dialog('open')
	$.ajax({
		type : "POST",
		url : url,
		data : $.toJSON(dataobject),
		contentType : "application/json; charset=utf-8",
		dataType : "json",
		success : function(args) {
			if (args.response.error) {
				$dialog.html(args.response.error)
			} else {
			//console.log(args);
				$dialog.dialog("close");
				callback(args)
			}
		}
	})
}
function processResponse(response,append) {
	//console.log(response);
	if (append) {
		nodes.push.apply(nodes,response.response.nodes);
		edges.push.apply(edges,response.response.edges);
	} else {
		nodes = response.response.nodes;
		edges = response.response.edges; 
	}
	//console.log(nodes);
	//edges=response.response.edges;
	networksUpdated = false;
	updateLabels();
	updateScalesNodes();
	redraw();
}

function getFromEnewick(eNewick,append) {
	var offsetId,offsetx,offsety
	if (append) {
		
		offsetId = d3.max(nodes,function(d){
			return parseInt(d.id.substr(1))
		}) + 1;
		offsetx = d3.max(nodes,function(d){
			return d.x
		})
		offsety = d3.max(nodes,function(d){
			return d.y
		})
		//console.log(offsetId);
	} else {
		offsetId = 1;
		offsetx = 0;
		offsety = 0
	}
	post_as_json('/fromEnewick',{
		'eNewick':eNewick,
		'offsetId':offsetId,
		'offsetx':offsetx,
		'offsety':offsety,
	}, function(response) {processResponse(response,append)});
}

function getFromEnewickClicked() {
	var eNewick = $('input:text[name=eNewickWanted]').val();
	var append = $('input:checkbox[name=append_to_existing]')[0].checked;
	//console.log('clicked',eNewick,append);
	getFromEnewick(eNewick,append);
	//processNetwork();
}

function getInfo(response) {
	//console.log(response);
	var info = response.response.nodes
	//console.log('info',info);
	for (var nodeId in info) {
		var node = getNodeById(nodeId);
		node.info = info[nodeId];
	}
	var infoNetworks = response.response.networks
	for (var networkName in infoNetworks) {
		var network = getNetworkByName(networkName);
		network.info = infoNetworks[networkName];
	}
}

function processNetwork() {
	//updateNetworks();
	var commands = []
	$('input:checkbox[name=data_wanted]:checked').each(function(){
		commands.push($(this).val())
	})
	var commands_networks = []
	$('input:checkbox[name=data_wanted_networks]:checked').each(function(){
		commands_networks.push($(this).val())
	})
	var distances = []
	$('input:checkbox[name=distances_wanted]:checked').each(function(){
		distances.push($(this).val())
	})
	
	//console.log('process:',commands);
	if (commands) {
	  post_as_json('/processNetwork',{
		'nodes':$.map(nodes,function(d){return {id:d.id,label:d.label}}),
		'edges':edges,
		'networks': networks,
		'commands':commands,
		'commands_networks':commands_networks,
		'distances':distances,
		},getInfo)
	}
}


getFromEnewick('((Aurora)#H1,((#H1,Boylii)Amerana,Temporaria))Laurasiarana;')
