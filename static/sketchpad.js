//"use strict";

// Global variables

var nodes = [];
var edges = [];
var labels = [];
// var connected_components = {}
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
var dragging = false;


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
	var connected_components = {};
	networks = [];
	var ccnodes = [];
	$.each(nodes, function(i,node){
		connected_components[node.id] = [node.id];
	})
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
	$.each(nodes, function(i,node) {
		if ($.inArray(connected_components[node.id], ccnodes) == -1) {
			ccnodes.push(connected_components[node.id]);
		} 
	})
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
		networks.push(network);
	})
	networksUpdated = true;
}

function updateNetworksPositions() {
	$.each(networks, function(i,network){
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
	edges = $.grep(edges, function(e){return e.source != edge.source || e.target != edge.target});
	networksUpdated = false;
	redraw()
}



// Creation and handling of the svg canvas


var svg = d3.select("#chart").append("svg:svg")
    .attr("width", size[0])
    .attr("height", size[1])
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

function redraw() {
	if (d3.event && d3.event.transform){
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
       .attr("style","text-anchor: middle;")
       .text(function(d) { return d.name; })
       //.on('mouseover',mouseoverNetwork)
       //.on('mouseout',mouseoutNetwork)
   network$.selectAll(".networkLabel")
     .data(networks, function(d){return d.id})
     .exit().remove();

       network$.selectAll(".networkLabel")//.select("g")
       .text(function(d) { return d.name; })
       .attr("transform", function(d) {
    	 return "translate(" + x(d.minx) + "," + y(d.miny) + ")";
  		});



   edge$.selectAll(".edge")
	 .data(edges,function(d){return d.source+'-'+d.target})
	 .enter().append("svg:path")
	  .attr("class", function(d){return "edge "+d.type;})
      .attr("marker-end", function(d) { return "url(#" + d.type + ")"; })
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
      //.on('click',clickNode)
      .on('mousedown',mousedownNode)
      //.on('mouseover',mouseoverNode)
      //.on('mouseout',mouseoutNode)

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


function mousedownNode(d) {
	//console.log('mousedownNode')
	//console.log(d)
	//console.log(d3.event)
	if (d3.event.which != 1) {
		return;
	}
	stopBubble();
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


function clickEdge(edge) {
	if (selectedEdge == edge) {
		selectedEdge = null
	} else {
		selectedEdge = edge;	
	}
	selected = null
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
		url : base_url + url,
		data : $.toJSON(dataobject),
		contentType : "application/json; charset=utf-8",
		dataType : "json",
		success : function(args) {
			if (args.response.error) {
				$dialog.html(args.response.error)
			} else {
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
	networksUpdated = false;
	updateLabels();
	updateScalesNodes();
	redraw();
}

function getOffsets(append) {
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
	} else {
		offsetId = 1;
		offsetx = 0;
		offsety = 0
	}
	//console.log(offsetId,offsetx,offsety)
	return [offsetId,offsetx,offsety]	
}

function getFromEnewick(eNewick,append) {
	var offsetId,offsetx,offsety 
	var offsets = getOffsets(append)
	offsetId = offsets[0]
	offsetx = offsets[1]
	offsety = offsets[2]
	//console.log(offsetId,offsetx,offsety)
	post_as_json('/fromEnewick',{
		'eNewick':eNewick,
		'offsetId':offsetId,
		'offsetx':offsetx,
		'offsety':offsety,
	}, function(response) {processResponse(response,append)});
}

function getRandom(number_taxa,binary,nested_taxa,append) {
	var offsetId,offsetx,offsety 
	var offsets = getOffsets(append)
	offsetId = offsets[0]
	offsetx = offsets[1]
	offsety = offsets[2]
	//console.log(offsetId,offsetx,offsety)
	post_as_json('/getRandom',{
		'n':number_taxa,
		'binary': binary,
		'nested_taxa': nested_taxa,
		'offsetId':offsetId,
		'offsetx':offsetx,
		'offsety':offsety,
	}, function(response) {processResponse(response,append)});
	
}

function getFromEnewickClicked() {
	var eNewick = $('input:text[name=eNewickWanted]').val();
	var append = $('input:checkbox[name=append_to_existing]')[0].checked;
	getFromEnewick(eNewick,append);
	//processNetwork();
}

function getInfo(response) {
	var info = response.response.nodes
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
	//console.log($("#chart").data())
	var selection = $("#chart").data()
	var commands = ["mu","nested_label","cluster"];
	var commands_networks = ["eNewick"]	
	var distances = ["mu_distance","nodal_distance_splitted"]
	
	commands = $.grep(commands, function(d) {
		return (d in selection) && (selection[d])
	})
	commands_networks = $.grep(commands_networks, function(d) {
		return (d in selection) && (selection[d])
	})
	distances = $.grep(distances, function(d) {
		return (d in selection) && (selection[d])
	})
	
	//console.log('process:',commands);
	if ((commands.length > 0) || (commands_networks.length > 0) || (distances.length > 0))  {
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


getFromEnewick('((Aurora)#H1,((#H1,Boylii)Amerana,Temporaria))Laurasiarana;',false)


$(function(){
	$.contextMenu({
		selector: '.node',
		build: function($trigger,e) {
			var node = $trigger[0].__data__;
			//console.log("node is:", node);
			return {
				items: {
					"edit": {name: "Edit Label", icon: "edit", type: "text", value: node.label,
						events:{
		                    keyup: function(e,opt) {
								var key = e.keyCode || e.which;
								if(key == 13) {
						            var newLabel = this.value;
						 	        if (newLabel) {
						 	        	//console.log('newlabel: ',newLabel)
						     	   		node.label = newLabel;
						     	   	}
						     	   	else {
						     	   		//console.log(node)
						     	   		delete node.label;
						     	   		//console.log(node)
						     	   	}
						        	updateLabels();
						        	redraw();
						        	$('.context-menu-list').hide()
								}
								return;
							},
						}
					},
					"info": {name: "Info for node", type: "textarea", value: node.info, icon:"information"},
					"delete": {name: "Delete Node", icon: "delete", 
						callback: function(){
							deleteNode(node);
						}
					},
				},
			}
		}
	});
});

   
$(function(){
    $.contextMenu({
        selector: '.edge', 
        //trigger: 'hover',
        //delay: 500,
        //autoHide: true,
        callback: function(key, options) {
            var m = "clicked: " + key;
            //window.console && console.log(m) || alert(m); 
        },
        items: {
            "delete": {name: "Delete Edge", icon: "delete",
            	callback: function(key,options) {
            		//console.log(this)
            		//var node = getNodeById(this[0].__data__.id);
            		var edge = this[0].__data__;
            		deleteEdge(edge);
            	}
            },
        }
    });
});

$(function(){
    $.contextMenu({
        selector: '.networkLabel', 
        //trigger: 'hover',
        //delay: 500,
        //autoHide: true,
        build: function($trigger, e) {
        	var network = $trigger[0].__data__;
        	//console.log(network)
        	return {
        		items: {
        			'info': {name: "Info for network", type: "textarea", value: network.info, icon:"information"}
        		}
        	}
        }
    });
});

$(function(){
    $.contextMenu({
        selector: '#chart', 
        //trigger: 'hover',
        //delay: 500,
        //autoHide: true,
        items: {
        	"info": {name:"Info to display", icon:"information", disabled:true},
        	"data_for_nodes": {
        		name:"Data for nodes",
        		items: {
		        	"mu": {name:"mu", type: "checkbox"},
		        	"nested_label": {name:"Nested Labels", type: "checkbox"},        			
		        	"cluster": {name:"cluster", type: "checkbox"}        			
        		}
        	},
        	"data_for_networks": {
				name: "Data for networks",
				items: {
					"eNewick": {name:"eNewick representation", type:"checkbox"}
				}        		
        	},
        	"distances": {
				name: "Distances between networks",
				items: {
					"mu_distance": {name:"Mu distance", type:"checkbox"},
					"nodal_distance_splitted": {name: "Nodal distance splitted", type:"checkbox"}
				}        		
        	},
        	"refresh": {name: "Refresh data", icon:"arrow_refresh", 
        		callback: function(key, opt){
	        		//console.log(key,options);
	        		var $this = this;
	                // export states to data store
	                $.contextMenu.getInputValues(opt, $this.data());
	        		processNetwork();
        		}
        	},
        	"sep1": "---------",
        	"titleimport": { name:"Import network/tree", icon:"add", disabled:true},
//			"from_enewick": {
//				name: "From eNewick", 
//				items: {
					"eNewick_string" : {name:"eNewick to import", type:"text",
						events:{
		                    keyup: function(e,opt) {
								var key = e.keyCode || e.which;
								if(key == 13) {
						            var eNewick = this.value;
						 	        if (eNewick) {
						 	        	var append = $('input:checkbox[name=context-menu-input-append]')[0].checked
						     	   		getFromEnewick(eNewick,append)
						     	   	}
						        	updateLabels();
						        	redraw();
						        	$('.context-menu-list').hide()
								}
								return;
							},
						}			
					},
					"append": {name:"append to existing", type:"checkbox"},
					"goeNewick" :{name:"Go", icon:"bullet_go", 
						callback: function(){
							var eNewick = $('input:text[name=context-menu-input-eNewick_string]')[0].value;
							if (eNewick) {
				 	        	var append = $('input:checkbox[name=context-menu-input-append]')[0].checked
				     	   		getFromEnewick(eNewick,append)
				     	   	}
				        	updateLabels();
				        	redraw();
						}
//					}
//				}
			},
        	"sep2": "---------",
        	"titleimport2": { name:"Import random tree", icon:"add", disabled:true},
//			"random_tree": {
//				name: "Random Tree",
//				items: {
					"taxa_number" :{name:"number of taxa", type:"text",
						events:{
		                    keyup: function(e,opt) {
								var key = e.keyCode || e.which;
								if(key == 13) {
						            var n = parseInt(this.value);
						 	        if (n) {
						 	        	var append = $('input:checkbox[name=context-menu-input-appendbis]')[0].checked
						 	        	var binary = $('input:checkbox[name=context-menu-input-binary]')[0].checked
						 	        	var nested_taxa = $('input:checkbox[name=context-menu-input-nested_taxa]')[0].checked
						 	        	//console.log('generating:',n,binary,nested_taxa,append)
						     	   		getRandom(n,binary,nested_taxa,append)
						     	   	}
						        	updateLabels();
						        	redraw();
						        	$('.context-menu-list').hide()
								}
								return;
							},
						}			
					},
					"binary": {name:"binary", type:"checkbox"},
					"nested_taxa": {name: "allow nested taxa", type:"checkbox"},
					"appendbis": {name:"append to existing", type:"checkbox"},
					"gorandom" :{name:"Go", icon:"bullet_go", 
						callback: function(){
				            var n = parseInt($('input:text[name=context-menu-input-taxa_number]')[0].value);
				 	        if (n) {
				 	        	var append = $('input:checkbox[name=context-menu-input-appendbis]')[0].checked
				 	        	var binary = $('input:checkbox[name=context-menu-input-binary]')[0].checked
				 	        	var nested_taxa = $('input:checkbox[name=context-menu-input-nested_taxa]')[0].checked
				 	        	//console.log('generating:',n,binary,nested_taxa,append)
				     	   		getRandom(n,binary,nested_taxa,append)
				     	   	}
				        	updateLabels();
				        	redraw();
						}
//					}				
//				}
			},
        },
        events: {
            show: function(opt) {
                var $this = this;
                $.contextMenu.setInputValues(opt, $this.data());
            }, 
            hide: function(opt) {
                var $this = this;
                $.contextMenu.getInputValues(opt, $this.data());
                //processNetwork();
            }
       }	        
    });
});

