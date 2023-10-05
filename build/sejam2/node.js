// Node agent
function (options) {
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
