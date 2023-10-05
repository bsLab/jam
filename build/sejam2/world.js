// World agent controlling the simulation and collection monitoring data
function (options) {
  this.act = {
    init: function () {
      log('Initializing ...');
      simu.db.init('/tmp/world.sql',undefined,function (response) {
        log('Openend DB /tmp/world.sql: '+response.code);
      })
    },
    percept: function () {
      log('Percepting ...');  
      var res=simu.db.createTable('/tmp/world.sql',
                                  'table1',
                                  {name:'integer',call:'varchar(100)',id:'integer'})
      log('createTable:' +res)
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
   
