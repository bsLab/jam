/**
 * Created by sbosse on 3/19/15.
 */
module.exports = {
    Segment: function (size) {
        var ms=[];
        for(var i=0;i<size;i++) ms.push(0);
        return ms;
    }
};