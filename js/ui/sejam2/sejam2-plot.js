/**
 **      ==============================
 **       O           O      O   OOOO
 **       O           O     O O  O   O
 **       O           O     O O  O   O
 **       OOOO   OOOO O     OOO  OOOO
 **       O   O       O    O   O O   O
 **       O   O       O    O   O O   O
 **       OOOO        OOOO O   O OOOO
 **      ==============================
 **      Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR(S).
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2019 bLAB
 **    $CREATED:     28-05-17 by sbosse.
 **    $VERSION:     1.10.3
 **
 **    $INFO:
 **
 **  SEJAM2: Simulation Environment for JAM, GUI Webix+, Anychart Graphics, Cannon Phy Simu, NW edition
 **  Plot Module
 **
 **
 **   1. Custom Plotter
 **   2. Automatic Chart.js plotter API for objects (arrays, arrays of arrays, object arrays, ...)
 **
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var Name = Require('com/pwgen');
var Aios = Require('jam/aios');
var Fs = Require('fs');
var Path = Require('com/path');
var Esprima = Require('parser/esprima');
var util = Require('util');
var simuPhy = Require('simu/simuPHY');
var Base64 = Require('os/base64');

var NL='\n';

var gui = function () {
  
};

var plot_styles = {
  point : [
    {shape:'circle',r:2,fill:{color:'red',opacity:0.5},line:{color:'red',width:1}},
    {shape:'circle',r:2,fill:{color:'blue',opacity:0.5},line:{color:'blue',width:1}},
    {shape:'circle',r:2,fill:{color:'green',opacity:0.5},line:{color:'green',width:1}},
    {shape:'circle',r:2,fill:{color:'black',opacity:0.5},line:{color:'black',width:1}}
  ],
  line : [
    {shape:'line',width:1,color:'red',opacity:0.5},
    {shape:'line',width:1,color:'blue',opacity:0.5},
    {shape:'line',width:1,color:'green',opacity:0.5},
    {shape:'line',width:1,color:'black',opacity:0.5}
  ],
  tick : {shape:'line',width:1,color:'black',opacity:1.0},
  text : {
    label : {fontSize : 18},
    labelRight : {fontSize : 18,align:'right'},
    labelCenter : {fontSize : 18,align:'center',fontWeight:'bold'}
  },
  bar : {
    top : {fill:{color:'#aaa',opacity:0.5},line:{color:'#fff',width:0}},
    bottom : {fill:{color:'#aaa',opacity:0.95},line:{color:'#fff',width:0}},
    bottomWhite : {fill:{color:'#fff',opacity:1.0},line:{color:'#fff',width:0}}
  }
}

gui.prototype.plotPoint = function (style,x,y,options,r) {
  var shape,
      scale={x:options.width-4*options.margin,y:options.height-4*options.margin},
      off={x:options.margin*2,y:options.margin*2};

  switch (style.shape) {
    case 'circle':
      shape=this.analysisWin.container.ellipse((x*scale.x+off.x), 
                                               options.height-(y*scale.y+off.y), 
                                               r||style.r, r||style.r);
      if (style.fill) shape.fill(style.fill.color,style.fill.opacity||0.5);
      if (style.line) shape.stroke(style.line.color||'black',style.line.width||1);
      this.analysisWin.shapes['P'+this.analysisWin._id]=shape;
      this.analysisWin._id++;
      break;      
  }
}

gui.prototype.plotLine = function (style,x1,y1,x2,y2,options) {
  var shape,
      scale={x:options.width-4*options.margin,y:options.height-4*options.margin},
      off={x:options.margin*2,y:options.margin*2};

   shape=this.analysisWin.container.path();
   shape.moveTo((x1*scale.x+off.x), 
                options.height-(y1*scale.y+off.y))
        .lineTo((x2*scale.x+off.x), 
                options.height-(y2*scale.y+off.y));
   if (style.color) shape.stroke(style.color||'black',style.width||1);
   this.analysisWin.shapes['L'+this.analysisWin._id]=shape;
   this.analysisWin._id++;
}

gui.prototype.plotText = function (text,style,x,y,options) {
  var shape,
      scale={x:options.width-4*options.margin,y:options.height-4*options.margin},
      off={x:options.margin*2,y:options.margin*2+style.fontSize*0.7};
  if (style.align) 
    shape=this.analysisWin.container.text(off.x, 
                                          options.height-(y*scale.y+off.y),text)
              .width(options.width-4*options.margin)
              .hAlign(style.align);
  else
    shape=this.analysisWin.container.text((x*scale.x+off.x), 
                                          options.height-(y*scale.y+off.y),text);
  if (style.fontWeight) shape.fontWeight(style.fontWeight);
  if (style.fontSize) shape.fontSize(style.fontSize+'px');
  if (style.color) shape.color(style.color);
  this.analysisWin.shapes['T'+this.analysisWin._id]=shape;
  this.analysisWin._id++;
}

gui.prototype.plotBar = function (style,x,y,w,h,options) {
  var shape,
      scale={x:options.width-4*options.margin,y:options.height-4*options.margin},
      off={x:options.margin*2,y:options.margin*2};
  shape=this.analysisWin.container.rect((x*scale.x+off.x), 
                                         options.height-(y*scale.y+off.y), 
                                         w*scale.x,h*scale.y);
  if (style.fill) shape.fill(style.fill.color,style.opacity||0.5);
  if (style.line) shape.stroke(style.line.color||'black',style.line.width);
   
  this.analysisWin.shapes['R'+this.analysisWin._id]=shape;
  this.analysisWin._id++;
}

/** Plotter
 *
 */
gui.prototype.plot = function (options) {
  var i,p,id,shape,id,stat,self=this;
  this.analysisWin.options.plot.style=this.options.plot.styles;
  if (!options.csv) {
    if (!this.analysisWin.container) {
      this.analysisWin.container=this.acgraph.create(options.container);
      this.analysisWin.shapes={};
    }  
    this.analysisWin.container.suspend();
    for (p in this.analysisWin.shapes) {
      if (this.analysisWin.shapes[p])
        this.analysisWin.shapes[p].remove();
    }
    this.analysisWin.container.resume();
    this.analysisWin.shapes={};
    this.analysisWin._id=0;
    if (options.destroy) return;
    if (!options.margin) options.margin=10;
  
    id='Plot-frame';
    shape=this.analysisWin.container.rect(options.margin, 
                                        options.margin, 
                                        options.width-options.margin*2,
                                        options.height-options.margin*2);
    this.analysisWin.shapes[id]=shape;
  }
  
  function axisOf (p) {
    var axis=1;
    if (self.analysisWin.options.plot[p]) axis=self.analysisWin.options.plot[p];
    else if (self.analysisWin.options.plot.Custom1==p) axis=1;
    else if (self.analysisWin.options.plot.Custom2==p) axis=2;
    else axis=1;
    return axis;
  }
  
  var x0,x1;
  
  // Get plot vectors
  var last=0,axis;
  
  // 1. Agents (only axis Y1)
  var data={},sets=0;
  if (this.analysisWin.options.plot.agent) {
    for  (i in this.logTable) {
      stat=this.logTable[i];
      if (stat.agents) for (p in this.analysisWin.options.classes) {
        if (!this.analysisWin.options.classes[p]) continue;
        if (stat.agents[p] != undefined) {
          if (data[p] == undefined) {data[p]=[];sets++};
          if (this.analysisWin.options.plot.diff&1) { 
            data[p][i]=stat.agents[p]-last;
            last=stat.agents[p];
          } else data[p][i] = stat.agents[p];
          if (x0==undefined) x0=i; else x0=Math.min(x0,i);
          if (x1==undefined) x1=i; else x1=Math.max(x1,i);
        }
      }
    }
  }
  
    
  var x=undefined;
  last=0;
  // 2. Comm/Migrate/Fork/Signal (Y1|Y2)
  if (this.analysisWin.options.plot.comm) {
    axis=axisOf('comm');
    data.comm=[];sets++;
    for  (i in this.logTable) {
      stat=this.logTable[i];
      if (this.analysisWin.options.plot.diff&axis) { 
        data.comm[i]=stat.send-last;
        last=stat.send;
      } else data.comm[i] = stat.send;
      if (x0==undefined) x0=i; else x0=Math.min(x0,i);
      if (x1==undefined) x1=i; else x1=Math.max(x1,i);
    }
  }

  last=0;
  if (this.analysisWin.options.plot.migrate) {
    axis=axisOf('migrate');
    data.migrate=[];sets++;
    for  (i in this.logTable) {
      stat=this.logTable[i];
      if (this.analysisWin.options.plot.diff&axis) { 
        data.migrate[i]=stat.migrate-last;
        last=stat.migrate;
      } else data.migrate[i] = stat.migrate;
      if (x0==undefined) x0=i; else x0=Math.min(x0,i);
      if (x1==undefined) x1=i; else x1=Math.max(x1,i);
    }
  }

  last=0;
  if (this.analysisWin.options.plot.fork) {
    axis=axisOf('fork');
    data.fork=[];sets++;
    for  (i in this.logTable) {
      stat=this.logTable[i];
      if (this.analysisWin.options.plot.diff&axis) { 
        data.fork[i]=stat.fork-last;
        last=stat.fork;
      } else data.fork[i] = stat.fork;
      if (x0==undefined) x0=i; else x0=Math.min(x0,i);
      if (x1==undefined) x1=i; else x1=Math.max(x1,i);
    }
  }

  last=0;
  if (this.analysisWin.options.plot.signal) {
    axis=axisOf('signal');
    data.signal=[];sets++;
    for  (i in this.logTable) {
      stat=this.logTable[i];
      if (this.analysisWin.options.plot.diff&axis) { 
        data.signal[i]=stat.signal-last;
        last=stat.signal;
      } else data.signal[i] = stat.signal;
      if (x0==undefined) x0=i; else x0=Math.min(x0,i);
      if (x1==undefined) x1=i; else x1=Math.max(x1,i);
    }
  }

  // 3. Custom (Y1|Y2)
  last=0;
  if (this.analysisWin.options.plot.custom) {
    var _custom={};
    if ((this.analysisWin.options.plot.custom&1) && this.analysisWin.options.plot.Custom1 != '') 
      _custom[this.analysisWin.options.plot.Custom1]=this.analysisWin.options.plot.Custom1;
    if ((this.analysisWin.options.plot.custom&2) && this.analysisWin.options.plot.Custom2 != '')
      _custom[this.analysisWin.options.plot.Custom2]=this.analysisWin.options.plot.Custom2;
    for  (i in this.logTable) {
      stat=this.logTable[i];
      for(p in _custom) {
        if (stat.custom && stat.custom[p]!=undefined) {
          axis=axisOf(p);
          if (data[p] == undefined) {data[p]=[];sets++};
          if (this.analysisWin.options.plot.diff&axis) { 
            data[p][i]=stat.custom[p]-last;
            last=stat.custom[p];
          } else data[p][i] = stat.custom[p];
          if (x0==undefined) x0=i; else x0=Math.min(x0,i);
          if (x1==undefined) x1=i; else x1=Math.max(x1,i);        
        }
      }
    }
  }
  
  // Reduce data vector
  if (this.analysisWin.options.window > 1) {
    var _data={};
    for (p in data) {
      _data[p]=[];
      for(i in data[p]) {
        x=((i/this.analysisWin.options.window)|0)*this.analysisWin.options.window;
        if ((i % this.analysisWin.options.window)==0 || _data[p][x] == undefined) _data[p][x]=data[p][i];
        else switch (this.analysisWin.options.filter) {
          case 'avg':
            _data[p][x]=(_data[p][x]+data[p][i])/2;
            break;
          case 'peak':
            _data[p][x]=Math.max(_data[p][x],data[p][i]);
            break;
        }  
      }
    }
    data=_data;
  }

  // Get data range for axis 1/2 
  var max1,min1,
      max2,min2;
  if (sets>0) 
    for(p in data) {
      axis=axisOf(p);
      for(i in data[p]) {
        switch (axis) {
          case 1:
            if (min1==undefined) min1=data[p][i]; else min1=Math.min(data[p][i],min1);
            if (max1==undefined) max1=data[p][i]; else max1=Math.max(data[p][i],max1);
            break;
          case 2:
            if (min2==undefined) min2=data[p][i]; else min2=Math.min(data[p][i],min2);
            if (max2==undefined) max2=data[p][i]; else max2=Math.max(data[p][i],max2);
            break;
      }
    }
  }
  
  this.log('[PLOT] Found '+sets+' data vector(s).');
  this.log('[PLOT] Data ranges X: ['+x0+','+x1+'] Y1: ['+min1+','+max1+'] Y2: ['+min2+','+max2+']');
  var set=0,xL=0.01,yL=0.98;

  function up(v,last) {
    return ((((v+last*1.5)/last)|0)*last)|0;
  }
  function leader(v) {
    if (((v/10)|0) == 0) return v|0;
    else return leader(v/10);
  }  
  
  if (min1 != undefined && min1>=0) min1=0;
  if (min2 != undefined && min2>=0) min2=0;
  
  var sign;
  
  if (Math.abs(min1) > Math.abs(max1)) {
    max1=-min1;
  }

  if (Math.abs(min2) > Math.abs(max2)) {
    max2=-min2;
  }

  if (max1) {
    if (max1 < 10) max1=max1|0;
    else if (max1 < 100) max1=up(max1,10);
    else if (max1 < 1000) max1=up(max1,100);
    else if (max1 < 10000) max1=up(max1,1000);
    else if (max1 < 100000) max1=up(max1,10000);
    else if (max1 < 1000000) max1=up(max1,100000);
    else if (max1 < 10000000) max1=up(max1,1000000);
    else if (max1 < 100000000) max1=up(max1,10000000);
    else if (max1 < 1000000000) max1=up(max1,100000000);
    if (min1 < 0) min1=-max1;
  } 

  if (max2) {
    if (max2 < 10) max2=max2|0;
    else if (max2 < 100) max2=up(max2,10);
    else if (max2 < 1000) max2=up(max2,100);
    else if (max2 < 10000) max2=up(max2,1000);
    else if (max2 < 100000) max2=up(max2,10000);
    else if (max2 < 1000000) max2=up(max2,100000);
    else if (max2 < 10000000) max2=up(max2,1000000);
    else if (max2 < 100000000) max2=up(max2,10000000);
    else if (max2 < 1000000000) max2=up(max2,100000000);
    if (min2 < 0) min2=-max2;
  } 
  
  this.log('[PLOT] Data ranges after adjustment Y1: ['+min1+','+max1+'] Y2: ['+min2+','+max2+']');

  if (!options.csv) {
    this.analysisWin.container.suspend();  
    this.plotBar(plot_styles.bar.top,-0.019,1.025,1.037,0.08,options);
    var max,min,label;
    for (p in data) {    
      axis=axisOf(p);
      label=this.analysisWin.options.plot.diff&axis?p+'/':p;
      this.plotPoint(plot_styles.point[set],
                     axis==2?(0.92-label.length*0.01):xL,
                     yL,
                     options,4);

      this.plotText(label,
                    axis==2?plot_styles.text.labelRight:plot_styles.text.label,
                    axis==2?0.99:xL+0.02,
                    yL,
                    options);
      if (axis!=2) xL += 0.2;
      if (axis==1) {max=max1;min=min1}
      else {max=max2;min=min2};

      switch (this.analysisWin.options.type) {
        case 'Point':
          for (i in data[p]) {
            this.plotPoint(plot_styles.point[set],(i-x0)/(x1-x0),0.9090*(data[p][i]-min)/(max-min),options);
          }
          break;
        case 'Line':
          last=undefined;
          for (i in data[p]) {
            if (last != undefined)
              this.plotLine(plot_styles.line[set],
                            (last-x0)/(x1-x0),0.9090*(data[p][last]-min)/(max-min),
                            (i-x0)/(x1-x0),0.9090*(data[p][i]-min)/(max-min),
                            options);
            last=i;
          }
          break;
        case 'PointLine':
          last=undefined;
          for (i in data[p]) {
            if (last != undefined)
              this.plotLine(plot_styles.line[set],
                            (last-x0)/(x1-x0),0.9090*(data[p][last]-min)/(max-min),
                            (i-x0)/(x1-x0),0.9090*(data[p][i]-min)/(max-min),
                            options);
            last=i;
          }
          for (i in data[p]) {
            this.plotPoint(plot_styles.point[set],(i-x0)/(x1-x0),0.9090*(data[p][i]-min)/(max-min),options);
          }
          break;
      }
      set++;
    }
    this.plotText(this.analysisWin.options.plot.LabelX,plot_styles.text.label,0.4,-0.07,options);
    this.plotText('0',plot_styles.text.label,0,-0.07,options);
    if (x1) this.plotText(x1.toString(),plot_styles.text.labelRight,1.0,-0.07,options);
    this.plotBar(plot_styles.bar.top,-0.02,0.945,1.037,0.07,options);
    if (min1 != undefined) this.plotBar(plot_styles.bar.bottomWhite,-0.01,0.045,0.05,0.07,options);
    if (min1 != undefined) this.plotText(min1.toString(),plot_styles.text.label,0,0,options);
    if (min2 != undefined) this.plotBar(plot_styles.bar.bottomWhite,0.955,0.045,0.06,0.07,options);
    if (min2 != undefined) this.plotText(min2.toString(),plot_styles.text.labelRight,1.0,0,options);
    if (max1 != undefined) this.plotText(max1.toString()+this.analysisWin.options.plot.LabelY1,plot_styles.text.label,0,0.90909,options);
    if (max2 != undefined) this.plotText(max2.toString()+this.analysisWin.options.plot.LabelY2,plot_styles.text.labelRight,1.0,0.90909,options);
    if (this.analysisWin.options.plot.Title != '') this.plotText(this.analysisWin.options.plot.Title,plot_styles.text.labelCenter,1.0,0.90909,options);

    var delta,n;
    if (max1 != undefined) {
      n=leader(max1-min1);
      if (n==1 && max1>0 && min1<0) n=2;
      delta=0.9090/n;
      for(i=1;i<n;i++) {
        this.plotLine(plot_styles.tick,-0.02,i*delta,-0.005,i*delta,options);
      }
    }
    if (max2 != undefined) {
      n=leader(max2-min2);
      if (n==1 && max2>0 && min2<0) n=2;
      delta=0.9090/n;
      for(i=1;i<n;i++) {
        this.plotLine(plot_styles.tick,1.005,i*delta,1.02,i*delta,options);
      }
    }

    this.analysisWin.container.resume();
  } else {
    // CSV export
    var csv={},rows=[],rowsN=0,colI=1,colsN=0,row,header=['x'],text='';
    for (p in data) {
      if (!csv[p]) {
        label=this.analysisWin.options.plot.diff&axis?p+'/':p;
        csv[p]={col:colI,name:label,data:data[p]};
        rowsN=Math.max(rowsN,data[p].length);
        header[colI]=p;
        colI++;
      }
    }
    colsN=header.length;
    rows=Comp.array.init(rowsN,function () {return Comp.array.create(colsN,-1)});
    for(p in csv) {
      colI=csv[p].col;
      for (i in csv[p].data) {
        rows[i][0]=i;
        rows[i][colI]=csv[p].data[i];
      }
    }
    text=Comp.printf.list(header)+NL;
    for(i in rows) if (rows[i][0]>=0) text=text+Comp.printf.list(rows[i])+NL;
    return text;
  }
}

/** Automatic Plotter using Chart.js 
 *
 */ 
gui.prototype.plotAuto = function (data,name,options) {
  options=options||{};
  var ctx = document.getElementById('chartContainer').getContext('2d');
  var color = [
    'rgb(255, 99, 132)',
    'rgb(99, 255, 132)',
    'rgb(132, 99, 255)',
    'rgb(255, 146, 18)',
    'rgb(128, 20, 20)',
    'rgb(20, 128, 20)',
    'rgb(20, 20, 128)',
    'rgb(160, 20, 200)',
    'rgb(128, 250, 250)',
    'rgb(128, 128, 128)',
  ];
  var p,ds,coln,rown,min,max;
  if (!Comp.obj.isArray(data)) return;
  if (typeof data[0] == 'number') {
    // 1. Number vector
    p = {
      type : 'line',
      data : {
        datasets : [{
          label:name,
          fill:false,
          backgroundColor:color[0],
          borderColor: color[0],          
          data:data.map(function (y,x) { return {x:x,y:y} })
        }]
      },
      options : {
        scales: {
          xAxes: [{
            type: 'linear',
            scaleLabel : (this.plotAutoWin.options.labelX!='')?{
              display:true,
              labelString:this.plotAutoWin.options.labelX
            }:{display:false}
            // ...
          }],
          yAxes: [{
            type: 'linear',
            scaleLabel : (this.plotAutoWin.options.labelY1!='')?{
              display:true,
              labelString:this.plotAutoWin.options.labelY1
            }:{display:false}
            // ...
          }]

        }
      }
    }
  } else if (Comp.obj.isArray(data[0]) && data[0].length && data[0].length>2) {
    // 2. Matrix (number|record array array) -> matrix chart!
    rown = data.length;
    coln = data[0].length;
    min = Infinity;
    max = -Infinity;
    if (Comp.obj.isObj(data[0][0])) {
      labels = Object.keys(data[0][0]);
      if (labels.length>color.length) return;
      ds = labels.map (function (x,i) {
        var min = Infinity;
        var max = -Infinity;
        var d = {
            label:name+'.'+x,
            data : Comp.array.flatten(data.map(function (row,j) {
                  return row.map(function (v,i) {
                    min=Math.min(min,v[x]);
                    max=Math.max(max,v[x]);
                    return { x:i,y:j,v:v[x] }
                  })})),
		    backgroundColor: function(ctx) {
			    var value = ctx.dataset.data[ctx.dataIndex].v;
			    var alpha = (value - min) / Math.abs(max);
			    return Color(color[i]).alpha(alpha).rgbString();
		    },
		    width: function(ctx) {
			    var a = ctx.chart.chartArea;
			    return (a.right - a.left) / (coln+1);
		    },
		    height: function(ctx) {
			    var a = ctx.chart.chartArea;
			    return (a.bottom - a.top) / (rown+2);
		    }
           }
        return d;
        });
    } else
      ds =  [{
		label: name,
		data: Comp.array.flatten(data.map(function (row,j) {
                  return row.map(function (v,i) {
                    min=Math.min(min,v);
                    max=Math.max(max,v);
                    return { x:i,y:j,v:v }
                  })}))
                ,
		backgroundColor: function(ctx) {
			var value = ctx.dataset.data[ctx.dataIndex].v;
			var alpha = (value - min) / Math.abs(max);
			return Color(color[0]).alpha(alpha).rgbString();
		},
		width: function(ctx) {
			var a = ctx.chart.chartArea;
			return (a.right - a.left) / (coln+1);
		},
		height: function(ctx) {
			var a = ctx.chart.chartArea;
			return (a.bottom - a.top) / (rown+2);
		}
	}];
    p = {
      type: 'matrix',
      data: {
        datasets: ds
      },
      options: {
              animation: false,
	      legend: {
		      display: true
	      },
	      tooltips: {
		      callbacks: {
			      title: function() { return '';},
			      label: function(item, data) {
				      var v = data.datasets[item.datasetIndex].data[item.index];
				      return ["x: " + v.x, "y: " + v.y, "v: " + v.v];
			      }
		      }
	      },
	      scales: {
		      xAxes: [{
			      ticks: {
				      display: true,
				      min: 0,
				      max: (coln),
				      stepSize: 5
			      },
			      gridLines: {
				      display: false
			      },
			      afterBuildTicks: function(scale, ticks) {
				      return ticks.slice(0, coln+5);
			      },
                  scaleLabel : (this.plotAutoWin.options.labelX!='')?{
                    display:true,
                    labelString:this.plotAutoWin.options.labelX
                  }:{display:false}
		      }],
		      yAxes: [{
			      ticks: {
				      display: true,
				      min: 0,
				      max: (rown),
				      stepSize: 5
			      },
			      gridLines: {
				      display: false
			      },
			      afterBuildTicks: function(scale, ticks) {
				      return ticks.slice(0, rown+5);
			      },
                  scaleLabel : (this.plotAutoWin.options.labelY1!='')?{
                    display:true,
                    labelString:this.plotAutoWin.options.labelY1
                  }:{display:false}
		      }]
	      }
      }                  
    } 
  } else if ((Comp.obj.isObj(data[0])|| data[0].length<3) && Object.keys(data[0]).length <= color.length) {
    // 3. Array of records (or Array of number array with <= 2 columns)
    labels = Object.keys(data[0]);
    coln = labels.length;
    ds = labels.map (function (x,i) {
      return {
          label:name+'.'+x,
          fill:false,
          backgroundColor:color[i],
          borderColor: color[i],          
          data:data.map(function (y,j) { 
            return {x:j,y:y[x]} 
          })
      }
    })
    p = {
      type : 'line',
      data : {
        datasets : ds
      },
      options : {
        scales: {
          xAxes: [{
            type: 'linear',
            scaleLabel : (this.plotAutoWin.options.labelX!='')?{
              display:true,
              labelString:this.plotAutoWin.options.labelX
            }:{display:false}
            // ...
          }],
          yAxes: [{
            type: 'linear',
            scaleLabel : (this.plotAutoWin.options.labelY1!='')?{
              display:true,
              labelString:this.plotAutoWin.options.labelY1
            }:{display:false}
            // ...
          }]
        }
      }
    }  
  }
  if (!p.options) p.options={}
  if (this.plotAutoWin.options.title!='')
    p.options.title =  {
      display:true,
      text:this.plotAutoWin.options.title
    }
  if (options.ctx) {  // for printing only ...
    p.options.responsive = false; // static window
    p.options.animation = false;
    return new Chart(options.ctx, p);
  }
  // display only
  if (this.plotAutoWin.chart) this.plotAutoWin.chart.destroy();
  this.plotAutoWin.options.data=data;
  this.plotAutoWin.options.name=name;
  if (p) this.plotAutoWin.chart = new Chart(ctx, p);
}

gui.prototype.plotAutoSave = function (options,callback) {
  var ctx,chart,image,png,svg,pdf,
      ctx0=document.getElementById('chartContainer').getContext('2d'),
      width=700,height=400;
  if (!this.plotAutoWin.chart) return;
  width=this.plotAutoWin.$width;
  height=this.plotAutoWin.$height;
  image=this.plotAutoWin.chart.toBase64Image()
  png = Base64.decodeBuf(image.replace('data:image/png;base64,', ''));
  if (options.data && options.name) {
    ctx=new C2S(width,height);
    ctx.__proto__.getContext = function (contextId) {
        if (contextId=="2d" || contextId=="2D") return this;
        else return null;
    }
    ctx.__proto__.style = function () { return this.__canvas.style }
    ctx.__proto__.getAttribute = function (name) { return this[name] }
    ctx.__proto__.addEventListener =  function(type, listener, eventListenerOptions) {
        console.log("canvas2svg.addEventListener() not implemented.")
    }
    chart=this.plotAuto(options.data,options.name,{ctx:ctx});
    svg=ctx.getSerializedSvg();
  }
  return {
    png:png,
    svg:svg,
  }
}

module.exports = {
  gui:gui,
  plot_styles:plot_styles
}
