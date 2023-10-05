/**
 **      ==============================
 **       O           O      O   OOOO
 **       O           O     O O  O   O
 **       O           O     O O  O   O
 **       OOOO   OOOO O     OOO  OOOO
 **       O   O       O    O   O O   O
 **       O   O       O    O   O O   O
 **       OOOO        OOOO O   O OOOO
 **      ==============================
 **      Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR(S).
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2017 bLAB
 **    $CREATED:     27-06-17 by sbosse.
 **    $RCS:         $Id$
 **    $VERSION:     1.1.4
 **
 **    $INFO:
 ** 
 ** Neuronal Network Module implementing agent defined neurons and neuronal networks.
 ** An agent must only save the state/configuration of neurons and
 ** network configurations. Neuronal Network configurations are processed by the
 ** agent plattform.
 **
 **    Example network with thre neuron nodes:
 ** 
 **    var n1 = nn.neuron({
 **      a:{decay:0.1,integrate:0.2},
 **      b:{},
 **      threshold:0.5  // Binary output
 **    });
 **    var n2 = nn.neuron({
 **      x:{decay:0.1,integrate:0.2,threshold:0.1},
 **      y:{weight:0.5}
 **    });
 **    var n3 = nn.neuron({
 **      a:{decay:0.1,integrate:0.2},
 **      b:{decay:0.1}
 **    });
 **
 **    var nw = nn.network([
 **      n1,n2,n3
 **      ],[
 **      // Connect ouput of internal neurons to other neuron inputs
 **      // Read as: output(n1) -> input.x(n2)
 **      {output:n1,x:n2},
 **      {output:n2,b:n3},
 **      // Define and connect network inputs to internal neuron inputs
 **      {input:n1,v1:'a',v2:'b'},
 **      {input:n2,v3:'y'},
 **      {input:n3,v4:'a'}
 **    ]);
 **   
 **    nn.compute(nw);
 **    
 **    Input parameters: weight, decay, integrate, threshold (discriminator), invert
 **    Output parameter: threshold (binary output)
 **    Output range: [-1.0,1.0] | {-1,0,1}
 **    $ENDOFINFO
 */

var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios=none;


function inputFunction(flags) {
  return function (x,y0) {
    var p,y=0,w=1,c,i;
    if (x==undefined) return y0;
    for(p in flags) {
      var k=flags[p];
      switch (p) {
        case 'invert':      x = -x; break;
        case 'threshold':   x = (x>=k?x:0); break;
        case 'weight':      w = k; break;
        case 'decay':       c = k; break;
        case 'integrate':   i = k; break; 
      }
    }
   
    if (c!=undefined) y=y0-y0*c;
    if (i!=undefined) y=(c==undefined?y0:y)+x*i;
    else y=y+x;
    
    return {y:Math.max(-1.0,Math.min(1.0,y)),w:w};
  }
}

var nn = {
  compute: function (node,input) {
    var i,ys=0,yw,neuron,neuron_input,next,computed,more;
    // All input variables reday (values computed/available)?
    function ready(node) {
      var p;
      for(p in node.input) if (node.input[p].x==undefined) return false;
      return true;
    }
    
    switch (node.type) {
      case 'neuron':
        // console.log('compute '+node.id);
        if (!input) 
          // Get internal node input values; neuronal network nodes only
          {input={};for(p in node.input) input[p]=node.input[p].x};
        for(i in node.input) {
          if (input[i] == undefined) continue;
          yw=node.input[i].f(input[i],node.input[i].y);
          node.input[i].y=yw.y;
          node.input[i].x=undefined;
          ys += (yw.y*yw.w);
        }
        if (node.threshold != undefined) 
          node.output = (ys>=node.threshold?1:0);
        else
          node.output = Math.max(-1.0,Math.min(1.0,ys));
        
        break;
      case 'network':
        // Set inputs
        for(p in input) {
          if (node.input[p])
            neuron_input=node.input[p].param; // local neuron input
            neuron=node.nodes[node.input[p].node]; // target neuron
            if (neuron) neuron.input[neuron_input].x=input[p];
        }

        // Compute all nodes with a complete set of inputs
        more=1;
        while (more) {
          computed=0;
          for(i in node.nodes) {
            neuron=node.nodes[i];
            if (ready(neuron)) {
              nn.compute(neuron);
              computed++;
              if (neuron.connect) 
                for(p in neuron.connect) {
                  next=node.nodes[p];
                  if (next) next.input[neuron.connect[p]].x=neuron.output;
                }
            }
          }
          more=(computed != node.nodes.length && computed>0);
        }
        break;
    }
  },
  connect: function (node1,node2,input) {
    var c={};
    node1.connect[node2.id]=input;
  },
  
  /** Compose a network graph from neuron nodes.
  **  The network object will not contain recursive references or deep nested structures 
  **  to insure mobility.
  ** 
  */
  network: function (nodes,connect) {
    var i,n,p,conn,nw={type:'network',input:{}};
    
    // Remap neuron ids...
    for(i in nodes) nodes[i].id=i;
    
    function getNode (o) {
      var p;
      for(p in o) if (p!='output'  && p!='input') return o[p];
    }
    function getInput(o) {
      var p;
      for(p in o) if (p!='output' && p!='input') return p;    
    }
    function getIndex(o) {
      var i;
      for(i in nodes) if (nodes[i].id==o.id) return i;
    }
    
    nw.nodes=nodes;
    for(i in connect) {
      conn=connect[i];
      if (conn.output) {
        nn.connect(conn.output,getNode(conn),getInput(conn));
      }
      else if (conn.input) {
        for(p in conn) {
          if (p!='input') nw.input[p]={node:getIndex(conn.input),param:conn[p]};
        }
      }
    }
    return nw;
  },
  /**  neuron(a:{invert:true,weight:0.5,decay:0.2,integrate:0.1,threshold:0.5},
  **             threshold:0.9)
  **
  ** function neuron() -> {type,id:number,threshold?,connect:{},input:{},output:number}
  **
  ** type of connect = {<nodeid>:<input>,..}
  */
  neuron: function (settings) {
    var p,i,input,
      o= {
      type:'neuron',
      id:(Math.random()*1000000)|0,
      threshold:settings.threshold,
      // connect this output to other node inputs - spawns a computation graph
      connect:{},
      input:{},
      output:settings.init||0
    }
    for(p in settings) {
      if (p=='init' || p=='threshold') continue;
      input=settings[p];
      o.input[p]={x:undefined,y:0,f:inputFunction(input)};
    }
    return o;  
  }
}

/** 
 *
 */
module.exports = {
  agent:nn,
  compute:nn.compute,
  current:function (module) { current=module.current; Aios=module; }
}
