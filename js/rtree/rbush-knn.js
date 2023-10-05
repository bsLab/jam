/* https://github.com/mourner/rbush-knn */

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.knn = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var Queue = require('tinyqueue');

module.exports = knn;
module.exports.default = knn;

function knn(tree, x, y, n, predicate, maxDistance) {
    var node = tree.data,
        result = [],
        toBBox = tree.toBBox,
        i, child, dist, candidate;

    var queue = new Queue(undefined, compareDist);

    while (node) {
        for (i = 0; i < node.children.length; i++) {
            child = node.children[i];
            dist = boxDist(x, y, node.leaf ? toBBox(child) : child);
            if (!maxDistance || dist <= maxDistance * maxDistance) {
                queue.push({
                    node: child,
                    isItem: node.leaf,
                    dist: dist
                });
            }
        }

        while (queue.length && queue.peek().isItem) {
            candidate = queue.pop().node;
            if (!predicate || predicate(candidate))
                result.push(candidate);
            if (n && result.length === n) return result;
        }

        node = queue.pop();
        if (node) node = node.node;
    }

    return result;
}

function compareDist(a, b) {
    return a.dist - b.dist;
}

function boxDist(x, y, box) {
    var dx = axisDist(x, box.minX, box.maxX),
        dy = axisDist(y, box.minY, box.maxY);
    return dx * dx + dy * dy;
}

function axisDist(k, min, max) {
    return k < min ? min - k : k <= max ? 0 : k - max;
}

},{"tinyqueue":2}],2:[function(require,module,exports){
(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
typeof define === 'function' && define.amd ? define(factory) :
(global = global || self, global.TinyQueue = factory());
}(this, function () { 'use strict';

var TinyQueue = function TinyQueue(data, compare) {
    if ( data === void 0 ) data = [];
    if ( compare === void 0 ) compare = defaultCompare;

    this.data = data;
    this.length = this.data.length;
    this.compare = compare;

    if (this.length > 0) {
        for (var i = (this.length >> 1) - 1; i >= 0; i--) { this._down(i); }
    }
};

TinyQueue.prototype.push = function push (item) {
    this.data.push(item);
    this.length++;
    this._up(this.length - 1);
};

TinyQueue.prototype.pop = function pop () {
    if (this.length === 0) { return undefined; }

    var top = this.data[0];
    var bottom = this.data.pop();
    this.length--;

    if (this.length > 0) {
        this.data[0] = bottom;
        this._down(0);
    }

    return top;
};

TinyQueue.prototype.peek = function peek () {
    return this.data[0];
};

TinyQueue.prototype._up = function _up (pos) {
    var ref = this;
        var data = ref.data;
        var compare = ref.compare;
    var item = data[pos];

    while (pos > 0) {
        var parent = (pos - 1) >> 1;
        var current = data[parent];
        if (compare(item, current) >= 0) { break; }
        data[pos] = current;
        pos = parent;
    }

    data[pos] = item;
};

TinyQueue.prototype._down = function _down (pos) {
    var ref = this;
        var data = ref.data;
        var compare = ref.compare;
    var halfLength = this.length >> 1;
    var item = data[pos];

    while (pos < halfLength) {
        var left = (pos << 1) + 1;
        var best = data[left];
        var right = left + 1;

        if (right < this.length && compare(data[right], best) < 0) {
            left = right;
            best = data[right];
        }
        if (compare(best, item) >= 0) { break; }

        data[pos] = best;
        pos = left;
    }

    data[pos] = item;
};

function defaultCompare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}

return TinyQueue;

}));

},{}]},{},[1])(1)
});
