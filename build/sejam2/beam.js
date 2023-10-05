/** Defines a physical simulation scene
 *  used in teh CANNON multi-body physics simulator.
 *  Must return the physical objects that can be accessed
 *  by SEJAM agents.
 *
 */
function (world,settings) {
  var CANNON=world.CANNON,
      GUI=world.GUI,i,j,
      mass = (settings && settings.mass)?settings.mass:1;

  var constraints = [];
  var bodies = [];
  var springs = [];
  
  world.gravity.set(0,0,-10);
  world.camera.position.set(50,230,220);
  
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
  var  fixedBody =  new CANNON.Body({mass: 0,
                                     material: groundMaterial  });
  var fixedShape =  new CANNON.Box(new CANNON.Vec3(0.5,100,100));
  fixedShape.color = 0x00ffff;
  fixedBody.addShape(fixedShape);
  fixedBody.position.set(-1,-50,0);
  world.addBody(fixedBody);
  GUI.addVisual(fixedBody);
   
  function makeBox(x,y,z) {
    var bShape = new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5)); //new CANNON.Sphere(0.5); // ;
    var b = new CANNON.Body({ mass: mass });
    // bShape.grid=3;
    b.addShape(bShape);
    b.position.set(x,y,z+40);
    bodies.push(b);
  }

  function connect(bodyA,bodyB,settings) {
    var sAB, localPivotA,localPivotB,constraint;
    if (!settings.static) {
      sAB = new CANNON.Spring(bodyA, bodyB, {
        stiffness:settings.stiffness,
        computeRestLength:true
      });
      // world.log(sAB.restLength);
      springs.push(sAB /*,sBA*/);
      world.addSpring(sAB);
    } else {    
      // constraints.push(new CANNON.DistanceConstraint(bodyA, bodyB, settings.distance));
      //constraints.push(new CANNON.LockConstraint(bodyA, bodyB));
      localPivotA = new CANNON.Vec3(0, -50, 50);
      localPivotB = new CANNON.Vec3(0, 0, 0);
      constraint = new CANNON.PointToPointConstraint(bodyA, localPivotA, bodyB, localPivotB);
      constraints.push(constraint);
    }
  }

  var stiffness=100;
  
  function makeBeam(n,m,l,d) {
    var dx=5,dy=5,dz=5,
        x=0,y=0,z=dz*m,offInd=0;
    for(var k=0;k<l;k++) {
      z=dz*m;
      for(var j=0;j<m;j++) {
        y=0;
        for(var i=0;i<n;i++) {
          makeBox(x,y,z);
          y=y+dy;
        }
        z=z-dz;
      }
      x=x+dx;
    }
    for(k=0;k<(l-1);k++) {
      offInd=k*(n*m);
      for(i=0;i<(n*m*2);i++) {
        for(j=i+1;j<(n*m*2);j++) 
          connect(bodies[offInd+i],bodies[offInd+j],{stiffness:stiffness});
      }
    }
  }
  makeBeam(settings.model.world.meshgrid.cols,
           settings.model.world.meshgrid.rows,
           settings.model.world.meshgrid.levels);
/*  
  // 0 1
  // 2 3
  makeBox(0,0,10);   // 0
  makeBox(0,5,10);
  makeBox(0,0,5);
  makeBox(0,5,5);

  // 4 5
  // 6 7
  makeBox(5,0,10);  // 4
  makeBox(5,5,10);
  makeBox(5,0,5);  
  makeBox(5,5,5);
*/

  for(i=0; i<settings.model.world.meshgrid.cols*settings.model.world.meshgrid.rows; i++) {
    connect(fixedBody,bodies[i],{static:true});
    //connect(ground,bodies[i],{static:true});
  }
  //connect(bodies[0],bodies[1],{static:true});
  //connect(bodies[0],bodies[2],{static:true});
  //connect(bodies[2],bodies[3],{static:true});
  //connect(bodies[1],bodies[3],{static:true});
  
  for(i=0; i<constraints.length; i++)
      world.addConstraint(constraints[i]);

  for(i=0; i<bodies.length; i++){
      world.addBody(bodies[i]);
      GUI.addVisual(bodies[i]);
  }

  world.addEventListener("postStep",function(event){
    for(var i in springs)
      springs[i].applyForce();
  });  


  return bodies
  
}
