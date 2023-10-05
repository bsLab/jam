/** Defines a physical simulation scene
 *  used in teh CANNON multi-body physics simulator.
 *  Must return the physical objects that can be accessed
 *  by SEJAM agents.
 *
 */
function (world,settings) {
  var CANNON=world.CANNON,
      GUI=world.GUI,
      mass = (settings && settings.mass)?settings.mass:1;
  
  world.gravity.set(0,0,-20);
  var groundMaterial = new CANNON.Material("groundMaterial");
  var wheelMaterial = new CANNON.Material("wheelMaterial");
  var wheelGroundContactMaterial = 
   new CANNON.ContactMaterial(groundMaterial,wheelMaterial, 
                             { friction: 0.5, restitution: 0.3 });
  world.addContactMaterial(wheelGroundContactMaterial);

  var wheelShape =      new CANNON.Sphere(1.2);
  var leftFrontWheel =  new CANNON.Body({ mass: mass, material: wheelMaterial });
  leftFrontWheel.addShape(wheelShape);
  var rightFrontWheel = new CANNON.Body({ mass: mass, material: wheelMaterial });
  rightFrontWheel.addShape(wheelShape);
  var leftRearWheel =   new CANNON.Body({ mass: mass, material: wheelMaterial });
  leftRearWheel.addShape(wheelShape);
  var rightRearWheel =  new CANNON.Body({ mass: mass, material: wheelMaterial });
  rightRearWheel.addShape(wheelShape);

  var chassisShape = new CANNON.Box(new CANNON.Vec3(5,2,0.5));
  chassisShape.color = 0xff0000;
  // chassisShape.grid = 4;
  var chassis = new CANNON.Body({ mass: mass });
  chassis.addShape(chassisShape);


  // Position constrain wheels
  var zero = new CANNON.Vec3();
  leftFrontWheel .position.set(  5,  5, 0);
  rightFrontWheel.position.set(  5, -5, 0);
  leftRearWheel  .position.set( -5,  5, 0);
  rightRearWheel .position.set( -5, -5, 0);

  // Constrain wheels
  var constraints = [];

  // Hinge the wheels
  var leftAxis =       new CANNON.Vec3(0,1,0);
  var rightAxis =      new CANNON.Vec3(0,-1,0);
  var leftFrontAxis =  new CANNON.Vec3(0,1,0);
  var rightFrontAxis = new CANNON.Vec3(0,-1,0);
  if(true){
      leftFrontAxis =  new CANNON.Vec3(0.3,0.7,0);
      rightFrontAxis = new CANNON.Vec3(-0.3,-0.7,0);
      leftFrontAxis.normalize();
      rightFrontAxis.normalize();
  }

  constraints.push(new CANNON.HingeConstraint(chassis, leftFrontWheel,  { pivotA: new CANNON.Vec3( 5, 5, 0), axisA: leftFrontAxis,  pivotB: zero, axisB: leftAxis }));
  constraints.push(new CANNON.HingeConstraint(chassis, rightFrontWheel, { pivotA: new CANNON.Vec3( 5,-5, 0), axisA: rightFrontAxis, pivotB: zero, axisB: rightAxis }));
  constraints.push(new CANNON.HingeConstraint(chassis, leftRearWheel,   { pivotA: new CANNON.Vec3(-5, 5, 0), axisA: leftAxis,       pivotB: zero, axisB: leftAxis }));
  constraints.push(new CANNON.HingeConstraint(chassis, rightRearWheel,  { pivotA: new CANNON.Vec3(-5,-5, 0), axisA: rightAxis,      pivotB: zero, axisB: rightAxis }));

  for(var i=0; i<constraints.length; i++)
      world.addConstraint(constraints[i]);

  var bodies = [chassis,leftFrontWheel,rightFrontWheel,leftRearWheel,rightRearWheel];
  for(var i=0; i<bodies.length; i++){
      world.addBody(bodies[i]);
      GUI.addVisual(bodies[i]);
  }

  // Ground
  var groundShape = new CANNON.Plane();
  groundShape.color = 0x00ff00;
  var ground = new CANNON.Body({ mass: 0, material: groundMaterial });
  ground.addShape(groundShape);
  ground.position.z = -3;
  world.addBody(ground);
  GUI.addVisual(ground);

  // Enable motors and set their velocities
  var frontLeftHinge = constraints[2];
  var frontRightHinge = constraints[3];
  frontLeftHinge.enableMotor();
  frontRightHinge.enableMotor();
  var v = -14;
  frontLeftHinge.setMotorSpeed(v);
  frontRightHinge.setMotorSpeed(-v);

  return {chassis:chassis,wheel1:leftFrontWheel,wheel2:rightFrontWheel,
          wheel3:leftRearWheel,wheel4:rightRearWheel, constraints:constraints }
  
}
