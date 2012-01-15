from flask import Flask, render_template, request, jsonify
import json
from PhyloNetwork import PhyloNetwork as pn
import networkx as nx
app = Flask(__name__)

args=None

@app.route('/echo',methods=['GET', 'POST'])
def echo_args():
    #data = request.input_stream.read(request.headers.get('content-type', type=int) or 0)
    print 'headers:',request.headers
    print 'mimetype:',request.mimetype
    print 'args:',request.args
    print 'data:',request.data
    print 'json:',request.json
    mydata = request.json
    mydata['nova']="tpm"
    net = pn(eNewick=mydata["eNewick"]);
    print net.edges()
    pos = nx.graphviz_layout(net, 'dot')
    nodes = net.nodes()
    edges = net.edges()
    dict = {node: {'pos':pos[node],'lbl':net.label(node),'adj':net.neighbors(node)} for node in nodes}
    print pos
    return jsonify(nodes=dict)

@app.route('/')
def hello_world():
    print "hello"
    return render_template("hello.html")

if __name__ == '__main__':
    app.run()#debug=True)
    