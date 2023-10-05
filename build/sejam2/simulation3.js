// Node agent
function node(options) {
  this.location={x:options.x,y:options.y,z:options.z};
  this.mynode=none;
  this.sensor=0;
  this.child=none;
  this.objPhy = none;
  
  this.act = {
    init: function () {
      this.mynode=myNode();
      log('Starting at '+this.location.x+','+this.location.y+' on node '+this.mynode);
      // if (this.location.x==0 && this.location.y==0) simu.db.init('/tmp/sqld',0);
    },
    percept: function () {
      var dx,dy,strain=Vec3(0,0,0);
      this.objPhy = simu.simuPhy.get();
      if (this.objPhy && this.objPhy.springs) {
        iter(this.objPhy.springs,function (s,sp) {
          var v=Vec3();
          s.bodyB.position.vsub(s.bodyA.position,v);
          v.normalize();
          v.scale(s.force,v);
          strain.vadd(v,strain);
          // strain = strain + Math.abs(s.restLength-s.length);
        });
      }
      this.sensor=strain;
/*      
      if (!this.mynode.indexOf('beacon')) return;
      this.sensor=random(20,200);
      // log('Percept '+this.sensor);
      simu.changeVisual('node['+this.mynode+']',{
        fill:{
          color:{color:'red',value:this.sensor/200},
          opacity: 0.5
        }
      });
      if (this.location.x==0 && this.location.y==0) {
        //simu.move('node['+this.mynode+']',10,10);
        this.child=create('explorer',[{delta:[2,-2]}]);
      }
      if (this.mynode=='mobile device 1')
        this.child=create('explorer',[{range:4}]);
      if (this.mynode=='mobile device 2') {
        dx=random(-10,10);
        dy=random(-10,10);
        simu.move('node['+this.mynode+']',dx,dy);
      }
*/  
    },
    
    simulate : function () {
      var v=this.sensor.length()/20;
      if (v>0) v=Math.min(v,1); else v=Math.max(v,-1);
      
      if (!this.objPhy)
      simu.changeVisual('node['+this.mynode+']',{
        fill:{
          color:'white',
          opacity: 0.5
        }
      });
      else       
      simu.changeVisual('node['+this.mynode+']',{
        fill:{
          color:v<0?{color:'blue',value:-v}:{color:'red',value:v},
          opacity: 0.5
        }
      });
      simu.simuPhy.step(1);     
    },
    
    wait: function () {
      sleep(random(200));
    }
  }
  this.trans = {
    init: function () {return percept},
    percept: function () {return simulate},
    simulate: function () {return wait},
    wait: function () {return percept}
  }
  this.next='init';
}
// Explorer agent
function explorer(options) {
  this.mynode=none;
  this.sensors=[];
  this.delta=options.delta; // [dx,dy]
  this.lifetime=options.life||500;
  this.act = {
    init: function () {
      this.mynode=myNode();
      log('Starting on node '+this.mynode);
    },
    percept: function () {
      this.sensors.push(random(20,200));
    },
    migrate: function () {
      var dir=DIR.ORIGIN;
      if (this.delta[0] > 0 ) {dir=DIR.EAST; this.delta[0]--;}
      else if (this.delta[0] < 0 ) {dir=DIR.WEST; this.delta[0]++;}
      else if (this.delta[1] > 0 ) {dir=DIR.NORTH; this.delta[1]--;}
      else if (this.delta[1] < 0 ) {dir=DIR.SOUTH; this.delta[1]++;};
      if (dir != DIR.ORIGIN) moveto(dir);
    },
    wait: function () {
      sleep(this.lifetime);
    },
    terminate: function () {
      kill();
    }
  }
  this.trans = {
    init: function () {return percept},
    percept: function () {return (this.delta[0]==0 && this.delta[1]==0)?wait:migrate},
    migrate: function () {return percept;},
    wait: function () {return terminate}
  }
  this.next='init';
}
// World agent controlling the simulation and collection monitoring data
function world(options) {
  this.act = {
    init: function () {
      log('Initializing ...');
    },
    percept: function () {
      log('Percepting ...');    
    },
    update: function () {
      log('Processing ...');    
    },
    wait: function () {
      log('Sleeping ...');
      sleep(100);
    }
  }
  this.trans = {
    init: function () {return percept},
    percept: function () {
      return update
    },
    update: function () {      
      return wait;
    },
    wait: function () {return percept}
  }
  this.next='init';
}
 
 
/** Defines a physical simulation scene
 *  used in teh CANNON multi-body physics simulator.
 *  Must return the physical objects that can be accessed
 *  by SEJAM agents.
 *
 */
  /*
  **  X <----+ Z   External coordinates
  **         |
  **         v
  **         Y
  **
  **         
  **   x <---+ z  Internal coordinates
  **         |
  **         v
  **         y
  */

function plate(world,settings) {
  var CANNON=world.CANNON,
      GUI=world.GUI,i,j,
      mass = (settings && settings.mass)?settings.mass:1,
      X=settings.model.world.meshgrid.cols,
      Y=settings.model.world.meshgrid.rows,
      Z=settings.model.world.meshgrid.levels,
      Height=20,
      damping=5,
      stiffness=50,
      Mass=200,
      MC=20,
      // hole=[1,2,0];
      hole=none;

  function matrix(n,m,k) {
    var x,y,z,mat;
    mat=new Array(n);
    for(x=0;x<n;x++) {
      mat[x]=new Array(m);
      for(y=0;y<m;y++)
        mat[x][y]=new Array(k);
    }
    return mat;
  }

  var constraints = [];
  var bodies = [];
  var springs = [];
  var masses = matrix(X,Y,Z);
  var loadings=[];
  
  world.gravity.set(0,0,-10);
  world.camera.position.set(150,130,70);
  world.camera.up.set(0,0,1);
  world.camera.fov=5.0;
  
  var groundMaterial = new CANNON.Material("groundMaterial");

  // Ground
  var groundShape = new CANNON.Plane();
  groundShape.color = 0x00ff00;
  var ground = new CANNON.Body({ mass: 0, material: groundMaterial });
  ground.addShape(groundShape);
  ground.position.z = 0;
  world.addBody(ground);
  GUI.addVisual(ground);

/*
  var fixedBody = new CANNON.Body({mass: 0,
                                   material: groundMaterial  });
  var fixedPlane = new CANNON.Plane();
  fixedPlane.color = 0x00ffff;
  fixedBody.addShape(fixedPlane);
  var rot = new CANNON.Vec3(1,0,0)
  fixedBody.quaternion.setFromAxisAngle(rot, Math.PI/2)
  fixedBody.position.set(0,0,0);
*/
  function makeWalls() {
    var h,h2;
    var fixedBody = new CANNON.Body({mass: 0,
                                      material: groundMaterial  });
    h=Height/2+2.0;
    var fixedShape = new CANNON.Box(new CANNON.Vec3(X*2.5,2,h));
    fixedShape.color = 0x00ffff;
    fixedBody.addShape(fixedShape);
    fixedBody.position.set((X-1)*2.5,0,h+0.5);
    world.addBody(fixedBody);
    GUI.addVisual(fixedBody);
    fixedBody = new CANNON.Body({mass: 0,
                                 material: groundMaterial  });
    fixedShape = new CANNON.Box(new CANNON.Vec3(X*2.5,2,h));
    fixedShape.color = 0x00ffff;
    fixedBody.addShape(fixedShape);
    fixedBody.position.set((X-1)*2.5,(Y-1)*5,h+0.5);
    world.addBody(fixedBody);
    GUI.addVisual(fixedBody);
    h2=(Z-1)*5+1;
    fixedBody = new CANNON.Body({mass: 0,
                                 material: groundMaterial  });
    fixedShape = new CANNON.Box(new CANNON.Vec3(X*2.5,0.5,h2/2));
    fixedShape.color = 0x00ffff;
    fixedBody.addShape(fixedShape);
    fixedBody.position.set((X-1)*2.5,-1,2*h+h2/2+0.5);
    world.addBody(fixedBody);
    GUI.addVisual(fixedBody);
    fixedBody = new CANNON.Body({mass: 0,
                                 material: groundMaterial  });
    fixedShape = new CANNON.Box(new CANNON.Vec3(X*2.5,0.5,h2/2));
    fixedShape.color = 0x00ffff;
    fixedBody.addShape(fixedShape);
    fixedBody.position.set((X-1)*2.5,(Y-1)*5+1,2*h+h2/2+0.5);
    world.addBody(fixedBody);
    GUI.addVisual(fixedBody);
  }

  function makeLoad(x,y,r,m) {
    var h=2;
    if (!r) r=10;
    var bShape = new CANNON.Cylinder(r,r,h,16);
    bShape.color='red';
    var b = new CANNON.Body({ mass: m||Mass });
    b.addShape(bShape);
    b.position.set(x,y,Height+4.0+h/2+(Z-1)*5+1.0+0.5);
    bodies.push(b);
    loadings.push(b);
  }
  
  function makeBox(x,y,z) {
    var bShape = new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5)); 
    var b = new CANNON.Body({ mass: mass });
    // bShape.grid=3;
    b.addShape(bShape);
    b.position.set(x,y,z+Height);
    bodies.push(b);
    return b;
  }

  function connect(bodyA,bodyB,settings) {
    var sAB, localPivotA,localPivotB,constraint,
        dir=new CANNON.Vec3();
    sAB = new CANNON.Spring(bodyA, bodyB, {
              stiffness:stiffness+(MC-2*MC*Math.random()),
              damping:damping,
              computeRestLength:true
          });
      // world.log(sAB.restLength);
    springs.push(sAB /*,sBA*/);
    world.addSpring(sAB);
    if (!bodyA.springs) bodyA.springs={};
    if (!bodyB.springs) bodyB.springs={};
    bodyB.gridPosition.vsub(bodyA.gridPosition,dir);
    bodyA.springs[dir.x+','+dir.y+','+dir.z]=sAB;
    dir=dir.negate();
    // bodyB.springs[dir.x+','+dir.y+','+dir.z]=sAB;
    return sAB;
  }

  
  function makePlate(l,n,m,d) {
    var dx=5,dy=5,dz=5,b,i,j,k,u,
        x=0,y=0,z=dz*m,offInd=0,bA,bB;
    function get(i,j,k,d) {
      if (d) i+=d[0], j+=d[1], k+=d[2];
      if (masses[i] && masses[i][j] && masses[i][j][k]) return masses[i][j][k];
      else return none;
    }
    for(k=0;k<l;k++) {
      z=dz*m;
      for(j=0;j<m;j++) {
        y=0;
        for(i=0;i<n;i++) {
          if (!equal([k,i,j],hole)) {
            b=makeBox(x,y,z);
            masses[k][i][j]=b;
            b.gridPosition=new CANNON.Vec3(k,i,j);
          }
          y=y+dy;
        }
        z=z-dz;
      }
      x=x+dx;
    }
    for(k=0;k<m;k++) {
      for(j=0;j<n;j++) {
        for(i=0;i<l;i++) {
          var vec = [

            [0,1,0],
            [1,1,0],
            [1,0,0],
            [1,-1,0],
            
            [0,0,1],
            
            [0,-1,1],
            [-1,-1,1],
            [-1,1,1],
            [0,1,1],
            [1,1,1],
            [1,0,1],
            [1,-1,1]

          ];
          for(u in vec) {
            bA=get(i,j,k);
            bB=get(i,j,k,vec[u]);
            if (bA && bB) connect(bA,bB);
          }
          
        }
      }
    }
  }
  makePlate(X,Y,Z);
  makeWalls();
  // makeLoad(10,15,5,200);
  
  for(i=0; i<constraints.length; i++)
      world.addConstraint(constraints[i]);

  for(i=0; i<bodies.length; i++){
      world.addBody(bodies[i]);
      GUI.addVisual(bodies[i]);
  }

  world.addEventListener("postStep",function(event){
    for(var i in springs) {
      springs[i].applyForce();
    }
  });  


  return {
    masses:masses, 
    loadings:loadings,
    map: function (id) {
      // Map logical node [i,j,k] to respective mass body 
      try { return masses[id[0]][id[1]][id[2]] } catch (e) {};
    }
  }
  
}
  
/**************** MODEL ********************/

model = {
  name:'My Simulation World',
  classes : {
    node: {
      behaviour:node,
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
      behaviour:explorer,
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
      behaviour:world,
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
  physics:{
    scenes:{
      plate:plate
    }
  },
  world : {
    init: {
      agents: {
        node:function (nodeId,position) {
          // Create on each node a node agent, return respective
          // agent parameters! If no agent should be created on the 
          // respective node, undefined must be returned!
          return {level:1,args:[{x:position.x,y:position.y,z:position.z}]}
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
