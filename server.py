from flask import Flask, render_template, request, jsonify, session
import json
from PhyloNetwork import PhyloNetwork as pn
import PhyloNetwork.distances as distances
import networkx as nx
import time

app = Flask(__name__)
net = None


@app.route('/')
def main_page():
    return render_template("main_page.html")
@app.route('/prova')
def prova():
    return render_template("prova.html")

@app.route('/dump',methods=['POST'])
def dump():
    print session['eNewick']
    net = pn(eNewick=session['eNewick'])
    print net
    return jsonify({})

def applyAll(fs,u):
    return '<br>'.join([command+':'+str(fs[command](u)) for command in fs])

def applyAllNets(fsnets,net,subnetworks,distances_methods):
    data1 = '<br>'.join([command+':'+str(getattr(net,str(command))()) for command in fsnets])
    for dm in distances_methods:
        for net2 in subnetworks:
            if net != net2:
                data1 += '<br>'+dm+' to '+net2.name+': '+str(distances_methods[dm](net,net2))
    return data1

@app.route("/processNetwork",methods=['POST'])
def processNetwork():
    try:
        mydata = request.json
        nodes = mydata['nodes']
        edges = mydata['edges']
        networks = mydata['networks']
        commands = mydata['commands']
        commands_networks = mydata['commands_networks']
        commands_distances = mydata['distances']
        distances_methods = {d: getattr(distances,d) for d in commands_distances}
        print distances_methods
        net = pn()
        #print 'nodes',nodes
        #print 'networks',networks
        for node in nodes:
            #print node
            net.add_node(str(node['id']));
            if ('label' in node) and (node['label']!=None):
                net._labels[str(node['id'])] = str(node['label'])
        for edge in edges:
            net.add_edge(str(edge['source']),str(edge['target']))
    
        subnetworks = nx.weakly_connected_component_subgraphs(net)
        print subnetworks;
        for subnetwork in subnetworks:
            for node in subnetwork.nodes():
                if node in net._labels:
                    subnetwork._labels[node] = net._labels[node]
            print subnetwork
        for network in networks:
            #print network['name']
            #print network['nodes']
            onenote = network['nodes'][0]
            for subnetwork in subnetworks:
                if onenote  in subnetwork.nodes():
                    subnetwork.name = network['name']
        
        fs = {command:getattr(net,str(command)) for command in commands}
        data = {}
        data['nodes'] = {u:applyAll(fs,u) for u in net.nodes()}
    
        #fsnets = {command_network:getattr(net,str(command_network)) for command_network in commands_networks}
        data['networks'] = {n.name:applyAllNets(commands_networks,n,subnetworks,distances_methods) for n in subnetworks}
        #print datanetworks
        
        return jsonify(response = data);
    except:
        return jsonify(response={'error':'Some error occurred. Please chech your data. If you think this is a bug, please contact us (see About section)'})

        
@app.route('/fromEnewick',methods=['POST'])
def fromEnewick():
    try:
        mydata = request.json
        eNewick=mydata["eNewick"]
        offsetId = mydata["offsetId"]
        offsetx = mydata["offsetx"]
        offsety = mydata["offsety"]
        net = pn()
        net._lastlabel = offsetId
        net.from_eNewick(eNewick)
        #time.sleep(6)
        session['eNewick'] = eNewick
        pos = nx.graphviz_layout(net, 'dot')
        minx = min([pos[u][0] for u in net.nodes()])
        miny = min([pos[u][1] for u in net.nodes()])
        offsettoapplyx = minx - offsetx - 50
        offsettoapplyy = miny - offsety
        #===========================================================================
        # xs = [p[0] for p in pos.values()]
        # ys = [p[1] for p in pos.values()]
        # medx = (max(xs)+min(xs))/2
        # medy = (max(ys)+min(ys))/2
        # #print pos
        # #print medx,medy
        # posnor = {u:(pos[u][0]-medx,pos[u][1]-medy) for u in pos}
        #===========================================================================
        #print posnor
        nodes = [{'id':u,'label': net.label(u), 'x':pos[u][0]-offsettoapplyx, 'y':-pos[u][1]+offsettoapplyy} for u in net.nodes()]
        edges = [{'source':edge[0],'target':edge[1], 'type': 'arrow'} for edge in net.edges()]
        dict = {'nodes':nodes,'edges':edges}
        #print dict
        #print dict
        return jsonify(response=dict)
    except:
        return jsonify(response={'error':'Some error occurred. Please chech your data. If you think this is a bug, please contact us (see About section)'})

app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'

if __name__ == '__main__':
    app.run(debug=True)