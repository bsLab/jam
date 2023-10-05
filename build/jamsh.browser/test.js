// jamsh.html?load=test.js
port(DIR.IP('http://localhost:*'));
later(500,function () {
  connect(DIR.IP('http://ag-0.de:10001'));
});
print('Hello World');
