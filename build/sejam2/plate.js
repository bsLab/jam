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

function (world,settings) {
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
