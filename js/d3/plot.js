var fs = require('fs');
var d3 = require('./d3');
var D3Node = require('./d3-node');
function log(msg) {
  console.log('[PLOT] '+msg);
}


/**
 * generic options = {margin, padding}
 */
 
var Plot = function(options) {
  var self=this;
  // auto-new instance, so we always have 'this'
  if (!(this instanceof Plot)) {
    return new Plot(options)
  }

  this.options=options;
  if (this.options.margin==undefined) this,options.margin=0;
  if (this.options.padding==undefined) this,options.padding=0;
  
  switch (options.type) {
    case 'matrix':
      if (!this.options.fontsize) this.options.fontsize=12;
    case 'circle':
      /* Circle 2D Scatter Plot
      ** Text 2D Matrix Plot
      ** 
      ** type options = {
      **  x:number of circles/entries,y:number of circles/entries, 
      **  size:number of circle/element size,
      **  color:string of circle fill color/text color, 
      **  min:number of smallest data value, max: number of biggest data value
      **  grid:boolean for grid drawing, 
      **  map: function (d,i,j) is a data set mapping functions
      ** 
      **/
      if (!this.options.color) this.options.color='green';
      this.d3n = new D3Node({d3Module:d3});
      this.width = 2*this.options.margin+
                   2*this.options.padding+
                   this.options.size*(this.options.x+2);
      this.height = 2*this.options.margin+
                    2*this.options.padding+
                    this.options.size*(this.options.y+2);
      log('Size of diagram: width='+this.width+', height='+this.height+' px');
      this.svg = this.d3n.createSVG()
                         .attr("width",  this.width)
                         .attr("height", this.height);
      break;
    default:
      throw Error ('[PLOT] Unknown plot diagram tyoe '+options.type);
  }
}

Plot.prototype.plot = function (dataset) {
  var self=this,
      i,j,g,d;
      
  if (!this.options.min) this.options.min=0;
  if (!this.options.max) {
    this.options.max=0;
    for (j=0; j < dataset.length; j++) 
      for(i=0; i < dataset[j].length; i++) {
        d=dataset[j][i];
        if (this.options.map) d=this.options.map(d,i,j);
        if (d> this.options.max) this.options.max= d;
      }
  }
  
  log('Data set has min='+this.options.min+', max='+this.options.max);
  switch (this.options.type) {
    case 'circle':
      d3.select(this.d3n.document.body)

      if (this.options.grid) { 
        g=this.svg.append("g")
          .selectAll("g")                 
          .data(dataset)
          .enter()
          .append("g") //removing
          .selectAll("text") // these
          .data( function(d,i,j) { return d; } ) //lines
          .enter()
        g.append('rect')
          .attr("x", function(d,i,j) { 
            return self.options.padding+
                   self.options.margin+
                   (i * self.options.size) + self.options.size/2; 
          })
          .attr("y", function(d,i,j) { 
            return self.options.padding+
                   self.options.margin+
                   (j * self.options.size) + self.options.size/2; 
          })
          .attr("width", function(d,i,j) { 
            return self.options.size
          })
          .attr("height", function(d,i,j) { 
            return self.options.size
          })
          .attr("stroke", function(d,i,j) { 
            return '#AAAAAA' 
          })
          .attr("fill", function(d,i,j) { 
            return 'white' 
          });
      }     
      
      g=this.svg.append("g")
          .selectAll("g")                 
          .data(dataset)
          .enter()
          .append("g") //removing
          .selectAll("text") // these
          .data( function(d,i,j) { return d; } ) //lines
          .enter() // circle displays normally
      g=g.append("circle")
          .attr("cx", function(d,i,j) { 
            return self.options.padding+
                   self.options.margin+
                   (i * self.options.size) + self.options.size; 
          })
          .attr("cy", function(d,i,j) { 
            return self.options.padding+
                   self.options.margin+(j * self.options.size) + self.options.size; 
          })
          .attr("r", function(d,i,j) { 
            if (self.options.map) d=self.options.map(d,i,j);
            return (
              self.options.size/2*(
                (d-self.options.min)/
                (self.options.max-self.options.min))
            );
          })
          .attr("fill", function(d,i,j) { 
            return self.options.color 
          });
      
      break;
      
    case 'matrix':
      d3.select(this.d3n.document.body)
      if (this.options.grid) { 
        g=this.svg.append("g")
          .selectAll("g")                 
          .data(dataset)
          .enter()
          .append("g") //removing
          .selectAll("text") // these
          .data( function(d,i,j) { return d; } ) //lines
          .enter();
        g.append('rect')
          .attr("x", function(d,i,j) { 
            return self.options.padding+
                   self.options.margin+
                   (i * self.options.size) + self.options.size/2; 
          })
          .attr("y", function(d,i,j) { 
            return self.options.padding+
                   self.options.margin+
                   (j * self.options.size) + self.options.size/2; 
          })
          .attr("width", function(d,i,j) { 
            return self.options.size
          })
          .attr("height", function(d,i,j) { 
            return self.options.size
          })
          .attr("stroke", function(d,i,j) { 
            return '#AAAAAA' 
          })
          .attr("fill", function(d,i,j) { 
            return 'white' 
          });
      } 


      for(var index=0;index<(self.options.cell?self.options.cell.rows:1);index++) {
        g=this.svg.append("g")
          .selectAll("g")
          .data(dataset)
          .enter()
          .append("g") //removing
          .selectAll("text") // these
          .data( function(d,i,j) { return d; } ) //lines
          .enter(); // circle displays normal
           
        g=g.append("text")
           .attr("x", function(d,i,j) { 
             if (self.options.map) d=self.options.map(d,i,j);
             if (self.options.cell && self.options.cell.rows) d=d[index];
             return (self.options.padding+
                     self.options.margin-
                     (d.length*self.options.fontsize/3)+
                     (i * self.options.size) + self.options.size); 
           })
           .attr("y", function(d,i,j) { 
             var off;
             if (self.options.cell && self.options.cell.rows) { 
                switch (index) {
                  case 0: off=-self.options.fontsize; break;
                  case 1: off=self.options.fontsize; break;
                  default: off=0;
                }
             } else 
               off=self.options.fontsize/3;

             return (self.options.padding+
                     off+
                     self.options.margin+(j * self.options.size) + self.options.size); 
           })
           .attr("font-size", self.options.fontsize+'px')
           .attr("color", function(d,i,j) { 
             return self.options.color 
           })
           .attr("fill", function(d,i,j) { 
             return self.options.color 
           })
           .text(function (d,i,j) { 
             var lines='';
             if (self.options.map) d=self.options.map(d,i,j);
             if (self.options.cell && self.options.cell.rows) d=d[index];
             return d
           });
    }  
    break;
  } 
}

Plot.prototype.output = function (outputName) {
  fs.writeFile(outputName+'.html', this.d3n.html(), function () {
    log(outputName+'.html created.');
  });
  var svgBuffer = new Buffer(this.d3n.svgString(), 'utf-8');
  fs.writeFile(outputName+'.svg', svgBuffer, function () {
    log(outputName+'.svg created');
  })
};

module.exports = {
  Plot:Plot  
}
