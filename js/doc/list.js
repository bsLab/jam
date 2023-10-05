var NL='\n',SP=' ';
function spaces(n) {var s=''; while(n) s+=SP,n--; return s;}

/** List Constructor
 *  typeof @options = {
 *    type:string=' '|'*'|'-'|'+'|'1'|'2'|..|'a'|'b'|..|'dl',
 *  }
 */
function List (options) {
  this.type = options.type|| '*';
  this.margin = options.margin || {left:0,right:0,top:0,bottom:0};
  this.width = options.width || 80;
  this.tab = options.tab || 2;
  this.tab2 = options.tab || 4;
}
/**
 * Inherit from Array. Each item of the list is one array element.
 */

List.prototype.__proto__ = Array.prototype;

/** List formatter
 *
 */
List.prototype.render
List.prototype.toString = function (){
  var i,self=this,ret='',line='',lines=[],label,
      tokens,
      textwidth=this.width-this.margin.left-this.margin.right-this.tab;
  for(i=0;i<this.margin.top;i++) lines.push([]);
  this.forEach(function (item,index) {
    label=self.type;
    line = spaces (self.margin.left);
    switch (label) {
      case '*':
      case '+':
      case '-':
        line += label+SP; break;
      case ' ': break;
      case '1': line += (index+1).toString()+'.'+SP; break;
      case '2': line += (index+2).toString()+'.'+SP; break;
      case '3': line += (index+3).toString()+'.'+SP; break;
      case '4': line += (index+4).toString()+'.'+SP; break;
      case '5': line += (index+5).toString()+'.'+SP; break;
      case '6': line += (index+6).toString()+'.'+SP; break;
      case '7': line += (index+7).toString()+'.'+SP; break;
      case '8': line += (index+8).toString()+'.'+SP; break;
      case '9': line += (index+9).toString()+'.'+SP; break;
      case 'dl':
        line += item.dt+NL; label=undefined; item=item.dd; break;
      default:
        break;
    }
    line += label?spaces(self.tab-label.length-1):spaces(self.tab);
    if (item.length < textwidth) {
      line += item;
      lines.push(line);
    } else {
      tokens=item.split(SP); // TODO: preserve nbsp?
      tokens.forEach(function (token) {
        if ((line.length+token.length+1)<textwidth)
          line += (token+SP);
        else {
          lines.push(line);
          line = spaces(self.margin.left+self.tab)+token+SP;
        }
      });
      lines.push(line);
    }
  });
  for(i=0;i<this.margin.bottom;i++) lines.push([]);
  return lines.join(NL);
}


module.exports = List;
