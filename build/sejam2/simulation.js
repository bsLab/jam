{
  name:'My Simulation World',
  classes : {
    node: {
      behaviour:open('node.js'),
      visual:{
          shape:'circle',
          width:10,
          height:10,
          x:5,y:5,
          fill: {
            color:'red',
            opacity: 0.5
          }
        }
    },
    explorer : {
      behaviour:open('explorer.js'),
      visual:{
          shape:'circle',
          width:10,
          height:10,
          x:-5,y:-5,
          fill: {
            color:'yellow',
            opacity: 0.5
          }
        }
    },
    world : {
      behaviour:open('world.js'),
      visual:{
          shape:'circle',
          width:10,
          height:10,
          center:{x:0,y:0},
          fill: {
            color:'yellow',
            opacity: 0.0
          }
        }    
    }
  },
  physics:{
    scenes:{
      plate:open('plate.js')
    }
  },
  world : {
    init: {
      agents: {
        node:function (nodeId,position) {
          // Create on each node a node agent, return respective
          // agent parameters! If no agent should be created on the 
          // respective node, undefined must be returned!
          if (nodeId!='world')
            return {level:3,args:[{x:position.x,y:position.y,z:position.z}]}
        },
        world: function(nodeId) {
          if (nodeId=='world') return {level:3,args:[{}]};
        }
      }
    }, 
    meshgrid : {
      // y-axis
      rows:5,
      // x-axis
      cols:4,
      //z-axis
      levels:2,
      // all z-level networks arranged in a matrix
      matrix:[[0,0],[200,0]],
      
      node: {
        // Node ressource visual object
        visual : {
          shape:'rect',
          width:30,
          height:30,
          fill: {
            color:'green',
            opacity: 0.5
          }
        }
      },
      // Link port connectors
      port: {
        type:'unicast',
        place: function (node) { return [
          {x:-15,y:0,id:'WEST',/*connect:function(n1,n2,p1,p2){return true}*/},
          {x:15,y:0,id:'EAST'},
          {x:0,y:-15,id:'NORTH'},
          {x:0,y:15,id:'SOUTH'},
          {x:-15,y:-15,id:'UP'},
          {x:15,y:15,id:'DOWN'}
        ]},
        visual: {
          shape:'rect',
          fill: {
            color:'black',
            opacity: 0.5
          },
          width: 5,
          height: 5
        }      
      },
      // Connections between nodes (with virtual port conectors)
      link : {
        // Link resource visual object
        connect: function (node1,node2,port1,port2) {return true},
        type:'unicast',   // unicast multicast
        visual: {
          shape:'rect',
          fill: {
            color:'#888',
            opacity: 0.5
          },
          width: 2
        }
      }
    }
  }
}
