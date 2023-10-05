db = sql(':memory:',{mode:'r+'})
db.init();
db.createTable('sensors',{name:'',value:0, unit:''});
db.insertTable('sensors',{name:'current',value:1.0, unit:'A'});
db.insertTable('sensors',{name:'voltage',value:12.1, unit:'V'});
db.readTable('sensors',function (res) {
  print('callback',res);
});
print('A',db.readTable('sensors'));
print('B',db.select('sensors','*'));
print('finished')
