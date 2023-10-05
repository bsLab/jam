{
  name:'My Simulation World',
  classes : {
    node: {
      behaviour:open('node.js'),
      visual:{
          shape:'circle',
          width:10,
          height:10,
          x:0,y:0,
          fill: {
            color:'red',
            opacity: 0.5
          }
        }
    },
    explorer : {
      behaviour:open('explorer2.js'),
      visual:{
          shape:'circle',
          width:10,
          height:10,
          x:-8,y:-8,
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
          width:200,
          height:200,
          center:{x:0,y:0},
          fill: {
            color:'green',
            opacity: 0.0
          }
        }    
    }

  },
  world : {
    init: {
      // Initial agent creation on each node
      agents: {
        node:function (nodeId,position) {
          // Create on each node a node agent, return respective
          // agent parameters! If no agent should be created on the 
          // respective node, undefined must be returned!
          if (nodeId.indexOf('beacon')==0 || nodeId.indexOf('mobile')==0)
            return {level:1,args:[{x:position.x,y:position.y}]}
        },
        world: function(nodeId) {
          if (nodeId=='world') return {level:3,args:[{}]};
        }
      }
    },
    // Auxiliary resources
    resources: function () {
      // Three rooms
      function makeRoom(id,x,y,w,h) {
        return {
          id:id,
          visual: {
            shape:'rect',
            x:x,
            y:y,
            width:w,
            height:h,
            line: {
              color: 'blue',
              width:5
            }
          }
        };
      }
      return [
        makeRoom('Floor 1',10,10,500,500),
        makeRoom('Floor 2',520,10,500,500),
        makeRoom('Floor 3',10,520,500,500)      
      ]
    },
    // Create nodes
    map: function () {
        function makeNode(x,y,id) {
          var phy;
          if (id=='mobile device 1') r=80; else r=200;
          return {
            id:id,
            x:x,
            y:y,
            ports: {
              wlan : {
                type:'multicast',
                status: function (nodes) {
                  // Filter out nodes, e.g., beacons only?
                  return nodes;
                },
                visual: {
                  shape:'circle',
                  width: r,
                  height: r,
                  line: {
                    color: 'grey'
                  }
                }
              },
              phy : phy
            },
          
            visual : {
              shape:'rect',
              width:30,
              height:30,
              fill: {
                color:'green',
                opacity: 0.5
              }
            }
          }
        }
        function makeBeacon(x,y,id) {
          var phy;
          if (id == 'beacon 1') 
            phy={type:'physical',
                ip:'*',
                to:'localhost:10002',
                proto:'udp'};

          return {
            id:id,
            x:x,
            y:y,
            ports: {
              wlan : {
                type:'multicast',
                status: function (nodes) {
                  // Filter out nodes, e.g., beacons only?
                  return nodes;
                },
                visual: {
                  shape:'circle',
                  width: 80,
                  height: 80,
                  line: {
                    color: 'grey'
                  }
                }
              },
              phy:phy
            },
            visual : {
              shape:'triangle',
              width:50,
              height:50,
              fill: {
                color:'yellow',
                opacity: 0.5
              }
            }
          }
        }
        function makeWorld(x,y) {
          return {
            id:'world',
            x:x,
            y:y,
            visual : {
              shape:'icon',
              icon:'world',
              label:{
                text:'World',
                fontSize:50
              },
              width:200,
              height:200,
              fill: {
                color:'black',
                opacity: 0.5
              }
            }
          }
        }
        return [
          makeWorld(700,700),
          makeNode(50,90,'mobile device 1'),
          makeNode(70,140,'mobile device 2'),
          makeBeacon(120,140,'beacon 1')
        ]
    }    
  }
}
