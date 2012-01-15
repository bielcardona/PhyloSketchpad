function post_as_json(url, dataobject, callback) {
	// Encodes dataobject in a json string and does a POST at urt.
	// On success calls callback
	$.ajax({
		type : "POST",
		url : url,
		data : $.toJSON(dataobject),
		contentType : "application/json; charset=utf-8",
		dataType : "json",
		success : callback
	})
}

var labelType, useGradients, nativeTextSupport, animate;

(function() {
	var ua = navigator.userAgent, 
	iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i), 
	typeOfCanvas = typeof HTMLCanvasElement, 
	nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'), 
	textSupport = nativeCanvasSupport && ( typeof document.createElement('canvas').getContext('2d').fillText == 'function');
	//I'm setting this based on the fact that ExCanvas provides text support for IE
	//and that as of today iPhone/iPad current text support is lame
	labelType = (!nativeCanvasSupport || (textSupport && !iStuff)) ? 'Native' : 'HTML';
	nativeTextSupport = labelType == 'Native';
	useGradients = nativeCanvasSupport;
	animate = !(iStuff || !nativeCanvasSupport);
})();

function updateSelected() {
	fd.graph.eachNode(function (node) {
		if (selectedNodes.indexOf(node) >= 0) {
			//console.log(node);
			node.setData("color","red");
		}
		else {
			node.setData("color","black");
		}
	});
	fd.plot();
}

function onMouseEnterNode() {
	//fd.canvas.getElement().style.cursor = 'move';
}
function onMouseEnterEdge() {}

var selectedNodes = [];
function onClickNode(node, eventInfo, e) {
	//console.log("onClickNode",eventInfo,e)
	if (e.shiftKey) {
		selectedNodes.push(node);
	} 
	else if (e.altKey) {
		//console.log(selectedNodes,node);
		selectedNodes.forEach(function(selnode) {
			fd.graph.addAdjacence(selnode,node);
		});
	}
	else {
		selectedNodes = [node];
	}
	updateSelected();
	return
}
function onClickEdge(node, eventInfo, e) {
	console.log("onClickEdge")
	return
}

var lastindex = 1
function onClickCanvas(node, eventInfo, e) {
	//console.log("onClickCanvas");
	while (fd.graph.getNode('_'+lastindex)) {
		lastindex += 1;
	}
	var node = fd.graph.addNode({id:'_'+lastindex,name:'_'+lastindex});
	var pos = eventInfo.getPos();
	node.getPos().setc(pos.x,pos.y);
	fd.plot();
	return
}

var fd = new $jit.ForceDirected({
	injectInto : 'infovis',
	//background : {img : img,imgx : -150,imgy : -150,numberOfCircles : 6},
	Navigation : {
		enable : true,
		panning : 'avoid nodes',
		zooming : 10, 
	},
	Node : {
		overridable : true,
		color : 'black',
		dim : 5,
		height : 25
	},
	Edge : {
		overridable : true,
		type : 'arrow',
		color: '#555',  
    	CanvasStyles: {  
      		shadowColor: '#ccc',  
      		shadowBlur: 10  
    	}  
	},
	Label : {
		type : labelType, //Native or HTML
		size : 10,
		style : 'bold',
		color : 'black'
	},
	Tips : {
		enable : true,
		onShow : function(tip, node) {
			/*
			//count connections
			var count = 0;
			node.eachAdjacency(function() {
				count++;
			});
			*/
			//display node info in tooltip
			tip.innerHTML = //"<div class=\"tip-title\">" + node.id + "</div>" + 
			//// "<div class=\"tip-text\"><b>mu:</b> " + node.data.info.mu + "</div>";
			'<input type="text" name="xxotherInput" id="tuputamadre" >';
			//$("#tuputamadre").val('quepassa').focus();
			//$("input[name='xxotherInput']").focus();
			setTimeout(function() { $("#tuputamadre").focus(); console.log(tip)}, 1000);
			//document.getElementById("tuputamadre").val('quepassa').focus();
			//console.log(tip);
		}
	},
	// Add node events
	Events : {
		enable : true,
		enableForEdges : true,
		type : 'Native',
	
		onMouseEnter : function(node) {
			if(node.nodeTo) {
				onMouseEnterEdge(node);
			} else {
				onMouseEnterNode(node);
			}
		},

		onMouseLeave : function() {
			//console.log("onMouseLeave")
			fd.canvas.getElement().style.cursor = '';
		},

		onDragStart : function(node, eventInfo, e) {
			//console.log("onDragStart")
		},
		onDragEnd : function(node, eventInfo, e) {
			//console.log("onDragEnd")
		},
		onDragCancel : function(node, eventInfo, e) {
			//console.log("onDragCancel")
		},

		onDragMove : function(node, eventInfo, e) {
			//console.log("onDragMove")
			if(node.nodeTo) {
				return;
			}
			var pos = eventInfo.getPos();
			node.pos.setc(pos.x, pos.y);
			fd.plot();
		},

		onTouchMove : function(node, eventInfo, e) {
			//console.log("onTouchMove")
			$jit.util.event.stop(e);
			//stop default touchmove event
			this.onDragMove(node, eventInfo, e);
		},

		onClick : function(node, eventInfo, e) {
			if(!node) {
				onClickCanvas(node,eventInfo,e)
				return;
			}
			if(node.nodeTo) {
				onClickEdge(node,eventInfo,e);
				return;
			}
			onClickNode(node,eventInfo,e);
		}
	},
	//Number of iterations for the FD algorithm
	iterations : 200,
	//Edge length
	levelDistance : 130,
	// Add text to the labels. This method is only triggered
	// on label creation and only for DOM labels (not native canvas ones).
	onCreateLabel : function(domElement, node) {
		//console.log(node.name);
		domElement.innerHTML = node.name;
		var style = domElement.style;
		style.fontSize = "0.8em";
		style.color = "#ddd";
	},
	// Change node styles when DOM labels are placed
	// or moved.
	onPlaceLabel : function(domElement, node) {
		var style = domElement.style;
		var left = parseInt(style.left);
		var top = parseInt(style.top);
		var w = domElement.offsetWidth;
		style.left = (left - w / 2) + 'px';
		style.top = (top + 10) + 'px';
		style.display = '';
	}
});
fd.loadJSON([{id:'dummy'}]);
fd.graph.removeNode('dummy');

/*
	var node
	var node1 = fd.graph.addNode({id:'_1',name:'node1'});
	node1.getPos().setc(100,100);
	var node2 = fd.graph.addNode({id:'_2',name:'node2'});
	node2.getPos().setc(-150,-150);
	//fd.graph.removeNode("dummy");
	fd.root = '_1';
	//console.log(node);
	fd.graph.addAdjacence(node1,node2);
	fd.plot();
*/

function lognodes() {
	fd.graph.eachNode(function(node){
		console.log(node);
		node.eachAdjacency(function(adj) {
			console.log(adj.nodeFrom,adj.nodeTo);
		})
	})
}

function processResponse(response) {
	var nodes=response.nodes;
	for (var key in nodes) {
		//console.log(key,nodes[key]);
		var node = fd.graph.addNode({id:key,name:nodes[key].lbl});
		node.getPos().setc(nodes[key].pos[0],-nodes[key].pos[1]);
		node.data.info = nodes[key].info;
	}
	fd.root = '_1';
	for (var key in nodes) {
		var node1 = fd.graph.getNode(key);
		for (var i in nodes[key].adj) {
			keyb = nodes[key].adj[i];
			var node2 = fd.graph.getNode(keyb);
			fd.graph.addAdjacence(node1,node2);
		}
	}
	fd.canvas.scale(1/fd.canvas.scaleOffsetX,1/fd.canvas.scaleOffsetY);
	fd.canvas.translate(-fd.canvas.translateOffsetX,-fd.canvas.translateOffsetY);
	fd.plot();	
}

function getFromEnewick(eNewick) {
	var data
	//fd.graph.empty();
	//fd.graph.removeNode('_1');
	//fd.graph.removeNode('_2');
	fd.loadJSON([{id:'dummy'}]);
	fd.graph.removeNode('dummy');

	post_as_json('/fromEnewick',{eNewick:eNewick},processResponse);
	//fd.root = '_1';
}

function passData() {
	nodes = fd.graph.nodes
	edges = fd.graph.edges
}

function askForLabelNode(node) {
	oldcolor = node.getData('color');
	node.setData('color','green');
	fd.plot()
	actual = node.name || '';
	var label = prompt("Label for node in green",actual);
	if (label) {node.name = label;}
	node.setData('color',oldcolor);
	fd.plot()
}

function askForLabel() {
	console.log(selectedNodes);
	for (var i in selectedNodes) {
		askForLabelNode(selectedNodes[i]);
	}
}

function doKeyDown(evt){
        console.log('evt:',evt);
        var keyCode = evt.which || evt.keyCode;
        var charInput = String.fromCharCode(keyCode);
        console.log(charInput);
        if (charInput == 'L') {askForLabel()};
}


var dialogOpts = {
	modal : true,
	title: 'Asdf',
	autoOpen : false
};
$("#myDialog").dialog(dialogOpts);


function test() {
	dial = $('<div class="dialog">Here I am</div>');
	dialOpts = {
		modal: true,
		autoOpen: false,
	}
	dial.dialog(dialOpts);
	pos = selectedNodes[0]
	dial.dialog('option','position',[0,0]);
	dial.dialog("open");
}

//console.log(myPrompt("asdf","dfdf"));

////////window.addEventListener('keydown',doKeyDown,true);
////////$('#mainInput').attr("disabled", true)
//getFromEnewick('((Aurora,(Boylii)#H1)Amerana,(#H1,Temporaria))Laurasiarana;')
getFromEnewick('((Aurora)#H1,((#H1,Boylii)Amerana,Temporaria))Laurasiarana;')
