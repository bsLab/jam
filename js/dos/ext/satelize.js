/* 
* satelize - v0.1.3
*
* (c) 2013 Julien VALERY https://github.com/darul75/satelize, 2018-2020 modfied by bLAB Dr. Stefan Bosse
*
* Usage: satelize(ip:string|undefined,function (err,info))
*
* License: MIT 
*/

  
var http=Require("http"),
    serviceHost="ip-api.com",
    servicePort=80,
    servicePath="/json",
    serviceJSONP="";

function Satelize(options){
  this.init()
}

Satelize.prototype.init=function(options){
  return this
}

Satelize.prototype.satelize=function(a,b){
  var c=(a.ip?"/"+a.ip:"")+(a.JSONP?serviceJSONP:""),
      d=a.timeout||1e3,
      h=a.url||a.host||serviceHost,
      p=a.port||servicePort,
      e,
      f;
  if (!http) return b('ENOTSUPPORTED',null);
  if (!http.xhr && http.request) {
    // server
    e={hostname:h,path:servicePath+c,method:"GET",port:p};
    f=http.request(e,function(a){
        a.setEncoding("utf8");
        var c="";
        a.on("data",function(a){c+=a}),
        a.on("end",function(){
          try {
            return b(null,JSON.parse(c));
          } catch (err) {
            b(err.toString()+', '+e.hostname+':'+e.port);
          }
        })
    });
    return f.on("error",function(a){return b(a)}),
           f.setTimeout(d,function(){return b(new Error("timeout"))}),
           f.end(),this;
  } else {
    // Browser
    e={uri:a.url?a.url:(a.proto?a.proto:'http')+'://'+h+':'+p+servicePath+c,
       method:"GET",
       headers:{}};
    console.log(e);
    http.request(e,function(err,xhr,body){
      if (err) return b(err);
      else try { b(null,JSON.parse(body)); } catch (err) { b(err.toString()+', '+e.uri) }
    })
    return this;
  }
}

var sat = new Satelize
module.exports=sat;
