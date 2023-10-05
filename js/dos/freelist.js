/**
 **      ==================================
 **      OOOO   OOOO OOOO  O      O   OOOO
 **      O   O  O    O     O     O O  O   O
 **      O   O  O    O     O     O O  O   O
 **      OOOO   OOOO OOOO  O     OOO  OOOO
 **      O   O     O    O  O    O   O O   O
 **      O   O     O    O  O    O   O O   O
 **      OOOO   OOOO OOOO  OOOO O   O OOOO
 **      ==================================
 **      BSSLAB, Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR.
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2016 BSSLAB
 **    $CREATED:     4/28/15 by sbosse.
 **    $VERSION:     1.1.3
 **
 **    $INFO:
 **
 **  DOS: Free cluster list management. This is a core feature
 **       of the filesystem!
 **
 **  Free and used cluster units:
 **
 **      addr: blocks
 **      size: blocks (!)
 **
 ** 0. Init:
 **      free_create
 **
 ** 1. File Creation:
 **      free_new or free_match [known final file size]
 **
 ** 2. File size grow:
 **      free_append     [reserve enough space for further modifications
 **                       size > currently needed size]
 **
 ** 3. File was committed:
 **      free_merge      [return not needed disk space]
 **
 ** 4. File deletion:
 **      free_merge
 **
 **
 **    $ENDOFINFO
 */
"use strict";

var util = Require('util');
var Io = Require('com/io');
var Comp = Require('com/compat');
var String = Comp.string;
var Array = Comp.array;
var Perv = Comp.pervasives;
var div = Comp.div;

var Cluster_flag = {
    Cluster_FREE: 1,          // The cluster is indeed free       *)
    Cluster_USED: 2,          // The cluster is currently used    *)

    /*
     ** The left side of the free cluster follows a currently used cluster
     ** with an uncommitted file. In the case, the used cluster must be
     ** expanded, the beginning of this free cluster is needed. After the
     ** file was committed, the RESERVED flag must be cleared to allow
     ** the efficient bottom divide mode again.
     */

    Cluster_RESERVED: 3,


    print: function (flag) {
        switch (flag) {
            case Cluster_flag.Cluster_FREE: return 'Cluster_FREE';
            case Cluster_flag.Cluster_USED: return 'Cluster_USED';
            case Cluster_flag.Cluster_RESERVED: return 'Cluster_RESERVED';
            default: return 'cluster_flag?';
        }
    }
};

var Free_divide_mode = {
    Free_Bottom: 1,
    Free_Half: 2,
    Free_Top: 3
};



/*
** Free list structure.
**
** The free cluster list is diveded in sublists with a limited
** size range. New entries are always put on the head of the
** list, therefore a FIFO order is achieved.
**
*/

var free_block = function (fb_addr,fb_size,fb_flag) {
    this.fb_addr=  fb_addr;     // int;
    this.fb_size=  fb_size;     // int;
    this.fb_flag=  fb_flag;     // cluster_flag;
};

function Free_block (fb_addr,fb_size,fb_flag) {
    var obj = new free_block(fb_addr,fb_size,fb_flag);
    Object.preventExtensions(obj);
    return obj;
}

function fb_equal(fb1,fb2) {
    if (fb1==undefined || fb2==undefined) return false;
    else return (fb1.fb_addr==fb2.fb_addr &&
                 fb1.fb_size==fb2.fb_size &&
                 fb1.fb_flag==fb2.fb_flag)
}

var nilfb = undefined;

/*
 ** Free block list management. Normally, the body list is emtpy,
 ** and the tail list contains the free_block list.
 */

var free_block_list = function (fl_body,fl_tail,fl_biggest) {
    this.fl_body=fl_body;             // free_block list;  (* temporarily list *)
    this.fl_tail=fl_tail;             // free_block list;  (* the real list    *)
    this.fl_biggest=fl_biggest;       // free_block;
};

function Free_block_list (fl_body,fl_tail,fl_biggest) {
    var obj = new free_block_list(fl_body,fl_tail,fl_biggest);
    Object.preventExtensions(obj);
    return obj;
}

free_block_list.prototype.find_biggest = function () {
    var big=undefined;
    Array.iter(this.fl_tail,function (fb) {
        if (big==undefined || fb.fb_size > big.fb_size) big=fb;
    });
    this.fl_biggest=big;
};

/*
 ** Divide a free cluster (addr,size') in at least a cluster
 ** with newsize<=size' and if there are remains in one ore two
 ** free clusters right or left and right from the middle of the
 ** original cluster depending of the flags bottom.
 **
 ** Mode Free_Bottom
 **
 ** Before (addr,size)
 ** ----------------------------------------------------
 **
 ** After:
 ** ++++++++XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 **
 ** +: Extracted cluster
 ** X: new free cluster
 **
 ** Mode Free_Half
 **
 ** Before (addr,size)
 ** ----------------------------------------------------
 **
 ** After:
 ** XXXXXXXXXXXXXXXXXXXXXXXXXX++++++++YYYYYYYYYYYYYYYYYY
 **
 ** +: Extracted  cluster
 ** X,Y: new free clusters
 **
 **
 ** This scheme is used because on file creation the file server
 ** not know the final size of a file. Following modify requests
 ** will increase the file size, and there must be a great probability
 ** for a free cluster following the current file end.
 **
 **
 ** Mode Free_Top
 **
 ** Before (addr,size)
 ** ----------------------------------------------------
 **
 ** After:
 ** XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX++++++++
 **
 ** +: Extracted cluster
 ** X: new free cluster
 **
 ** Only useable if the final size of file is known (for example
 ** with a afs_CREATE request and the afs_COMMIT/SAFETY flag set).
 **
 **
 **
 ** Args:
 **  old: original free cluster (addr,size')        :free_block
 **  size: desired size from the free cluster [blocks]
 **  mode:
 **
 **
 ** Return:
 **  new:    (addr,size,flag=USED)              : free_block
 **  left:   (addr'',size'',flag=FREE)          : free_block
 **  right:  (addr''',size''',flag=RESERVED)    : free_block
 **
 */
function free_divide(old,size,mode) {
    if (size < old.fb_size) {
        switch (mode) {
            case Free_divide_mode.Free_Bottom:
                return [Free_block(old.fb_addr,size,Cluster_flag.Cluster_USED),
                        nilfb,
                        Free_block(old.fb_addr+size,old.fb_size-size,Cluster_flag.Cluster_RESERVED)];
                break;
            case Free_divide_mode.Free_Half:
                var os2 = div(old.fb_size,2);
                if (size < os2)
                    return [Free_block(old.fb_addr+os2,size,Cluster_flag.Cluster_USED),
                            Free_block(old.fb_addr,os2,old.fb_flag),
                            Free_block(old.fb_addr+os2+size,old.fb_size-os2-size,Cluster_flag.Cluster_RESERVED)];
                else
                    return [Free_block(old.fb_addr,os2,Cluster_flag.Cluster_USED),
                            nilfb,
                            Free_block(old.fb_addr+os2,old.fb_size-os2,Cluster_flag.Cluster_RESERVED)];
                break;
            case Free_divide_mode.Free_Top:
                return [Free_block(old.fb_addr+old.fb_size-size,size,Cluster_flag.Cluster_USED),
                        Free_block(old.fb_addr,old.fb_size-size,old.fb_flag),
                        nilfb];
                break;
        }
    } else if (size == old.fb_size) {
        return [old,nilfb,nilfb]
    } else {
        return [nilfb,nilfb,nilfb]
    }
}

/**
 *
 * @param {free_block_list []} fbs_array
 * @param {number [] []} fbs_range  (start*size) array
 * @param {number} fbs_num
 */
var free_blocks = function (fbs_array,fbs_range,fbs_num) {
    this.fbs_array=fbs_array;   // free_block_list array;
    this.fbs_range=fbs_range;   // (int * int) array;
    this.fbs_num=fbs_num;       // number of lists
    this.fbs_fragments=0;       // current number of free clusters
    this.fbs_compacthres=50;       // initial #fragments threshold for compaction run
};

free_blocks.prototype.print = function () {
    var str='';
    var flar = this.fbs_array;
    //var srar = this.fbs_range;
    //var nmax = this.fbs_num - 1;
    str='Free cluster list:\n';
    Array.iter(flar,function (fcl,i) {
        str=str+'  #'+i+' tail\n';
        Array.iter (fcl.fl_tail,function (fb) {
            str=str+'    [addr='+fb.fb_addr+' size='+fb.fb_size+' flag='+Cluster_flag.print(fb.fb_flag)+']\n';
        });
        str=str+'  #'+i+' body\n';
        Array.iter (fcl.fl_body,function (fb) {
            str=str+'    [addr='+fb.fb_addr+' size='+fb.fb_size+' flag='+Cluster_flag.print(fb.fb_flag)+']\n';
        });
    });
    return str;
};

/*
 ** Find a free cluster (X) with start address 'addr' and remove it
 ** from the free list. It's assumed that this cluster
 ** is somewhere in the front of a free list. Therefore, all
 ** free cluster lists are searched in a round-robinson style.
 **
 **      L : AAAAAA XXXX BBBB ->
 **      L': AAAAAA      BBBB ->
 **
 **      XXXX
 **
 */
free_blocks.prototype.free_find = function (addr) {
    var flar = this.fbs_array;
    var nmax = this.fbs_num;
    var found = nilfb;
    var empty = 0;
    var mask = ((1 << nmax) - 1);

    function iter (n) {
        Array.match(flar[n].fl_tail,
            function (hd,tl) {
                if (hd.fb_addr != addr) {
                    flar[n].fl_body.push(hd);
                    flar[n].fl_tail = tl;
                    var next = (n + 1) == nmax ? 0 : (n + 1);

                    iter(next);
                }
                else {
                    /*
                     ** Success.
                     */
                    found = hd;
                    flar[n].fl_tail=Array.merge(flar[n].fl_body, tl);
                    flar[n].fl_body = [];

                    if (fb_equal(found, flar[n].fl_biggest))
                        flar[n].find_biggest();
                }
            },
            function () {
                empty=empty | (1 << n);
                var next = (n+1)==nmax?0 : (n+1);
                if ((empty & mask) != mask) iter (next);
            })
    }
    iter(0);
    this.fbs_fragments=0;
    for (var i = 0; i<nmax;i++) {
        flar[i].fl_tail=Array.merge(flar[i].fl_body,flar[i].fl_tail);
        flar[i].fl_body=[];
        this.fbs_fragments=this.fbs_fragments+flar[i].fl_tail.length;
    }
    return found;
};

/**
 ** Insert a free cluster (X) in the appropriate free cluster list.
 ** This cluster is inserted on the head of the appropriate list
 ** (FIFO order).
 **
 **      L:   AAAAAA BBBBBB
 **
 **      XXXXXX ->
 **
 **      L':  XXXXXX AAAAAA BBBBBB
 **
 *
 *
 *
 * @param {free_block} fb
 */
free_blocks.prototype.free_insert = function (fb) {
    var flar = this.fbs_array;
    var srar = this.fbs_range;
    var nmax = this.fbs_num-1;
    var size = fb.fb_size;


    function iter(n) {
        var low,high;
        low=srar[n][0];
        high=srar[n][1];
        if (size >= low && size < high) {
            flar[n].fl_tail = Array.merge([fb], flar[n].fl_tail);
            if ((flar[n].fl_biggest && (fb.fb_size > flar[n].fl_biggest.fb_size)) || flar[n].fl_biggest==nilfb)
                flar[n].fl_biggest = fb;
        } else {
            if (n > 0)
                iter(n - 1);
            else
                Io.err('[FREEL] free_insert: inconsistent free list/size=' + size);
        }
    }
    if (fb!=nilfb) iter(nmax);
};

/**
 ** Try to merge a free cluster (X) (previously allocated
 ** with free_new or free_append) after a file creation
 ** with an already existing one from the free list.
 ** The new cluster is flagged with Cluster_FREE! The merged cluster
 ** (if any) or the cluster X is inserted in the free list again.
 **
 **      L:  AAAA XXXXX             BBBBB ->
 **
 **      XXXXXX +
 **            YYYYYYYYYY =
 **      ZZZZZZZZZZZZZZZZ                 ->
 **
 **      L': AAAA ZZZZZZZZZZZZZZZZ BBBBB
 *
 * @param {free_block} fb
 */
free_blocks.prototype.free_merge = function (fb) {
    if (fb != nilfb) {
        fb.fb_flag = Cluster_flag.Cluster_FREE;
        var addr = fb.fb_addr + fb.fb_size;
        var size = fb.fb_size;

        var fb2 = this.free_find(addr);
        if (fb2!=nilfb)
            this.free_insert(Free_block(fb.fb_addr,size + fb2.fb_size,fb.fb_flag));
        else
            this.free_insert(fb);
    }
};

/**
 ** Search the free cluster list for a cluster with
 ** start address addr. Take the front of the cluster
 ** with the desired size, and insert the rest in the list again.
 ** Return the extracted cluster OR undefined.
 **
 **  Units:
 **      addr,size : blocks
 **
 **      L:   AAAA XXXX BBBBB ->
 **
 **      L':  AAAA   XX BBBBB ->
 **
 **      XX
 **
 **
 *
 *
 * @param {number} addr
 * @param {number} size
 * @returns {free_block|undefined}
 */
free_blocks.prototype.free_append = function (addr,size) {
    var fb = this.free_find(addr);
    if (fb.fb_size >= size) {
        var newc, right;
        var blocks = free_divide(fb, size, Free_divide_mode.Free_Bottom);
        newc = blocks[0];
        //left = blocks[1];
        right = blocks[2];
        this.free_insert(right);
        return newc;
    }
    else {
        this.free_insert(fb);
        return undefined;
    }

};

/**
 ** Get a free cluster with specified size somewhere in the file system.
 ** A file was created. The biggest cluster in a freelist is
 ** taken and split to the desired size and the rest. Searched is performed
 ** from the largest free clusters down to the smallest possible.
 **
 ** Units:
 **  size: blocks
 **
 *
 *
 * @param {number} size
 * @returns {free_block|undefined}
 */
free_blocks.prototype.free_new = function (size) {
    var self=this;

    if (this.fbs_fragments>this.fbs_compacthres) self.free_compact();

    var flar = this.fbs_array;
    var srar = this.fbs_range;
    var nmax = this.fbs_num-1;


    function iter (n) {
        var low;
        var found=undefined;
        function find () {
            if (flar[n].fl_biggest.fb_size >= size) {
                Array.match(flar[n].fl_tail,
                    function (hd,tl){
                        if (fb_equal(hd,flar[n].fl_biggest))
                        {
                            flar[n].fl_tail = Array.merge(flar[n].fl_body, tl);
                            flar[n].fl_body = [];
                            flar[n].find_biggest();
                            found = hd;
                        }
                        else {
                            Array.append(flar[n].fl_body,hd);
                            flar[n].fl_tail = tl;
                            find();
                        }
                    })
            }
        }

        low=srar[n][0];
        //high=srar[n][1];
        if (!Array.empty(flar[n].fl_tail)) {
            /*
             ** Find the biggest cluster in this list!
             */
             find();
            if (found!=undefined) {
                return found;
            }
            else {
                if (n > 0 && size < low)
                    return iter(n-1);
                else
                    return undefined;
            }
        } else if (size < low) {
            if (n > 0)
                return iter(n-1);
            else
                return undefined;

        } else return undefined;
    }
    var cl = iter(nmax);
    /*
    ** Move the body lists to the front of the tail lists.
    */
    for (var i = 0; i <nmax;i++) {
        flar[i].fl_tail=Array.merge(flar[i].fl_body,flar[i].fl_tail);
        flar[i].fl_body=[];
    }
    var mode = (cl.fb_flag == Cluster_flag.Cluster_RESERVED)? Free_divide_mode.Free_Half:Free_divide_mode.Free_Bottom;
    var newc,left,right;
    var blocks = free_divide(cl,size,mode);
    newc = blocks[0];
    left = blocks[1];
    right = blocks[2];
    this.free_insert(right);
    if (mode==Free_divide_mode.Free_Half)
        self.free_insert(left);
    return newc;
};

/**
 ** Get a free cluster with specified size somewhere in the file system.
 ** A file was created. The best matching cluster in a freelist is
 ** taken and split to the desired size and the rest. The free cluster
 ** is taken from the best matching free cluster list.
 ** Only useful in the case the final size of a file is already
 ** known (e.g. small files transferred with a single request).
 **
 ** Units:
 **  size: blocks
 **
 * @param {number} size
 * @returns {free_block|undefined}
 */


free_blocks.prototype.free_match = function (size) {
    var self=this;

    if (this.fbs_fragments>this.fbs_compacthres) self.free_compact();

    var flar = this.fbs_array;
    var srar = this.fbs_range;
    var nmax = this.fbs_num-1;

    function iter (n) {
        var high;
        //low=srar[n][0];
        high=srar[n][1];
        if (size <= high && !Array.empty(flar[n].fl_tail)) {
            /*
            ** Find the best matching cluster!
            */

            var found = undefined;
            Array.iter (flar[n].fl_tail, function(fb) {
                if (fb.fb_size >= size &&
                    ((found && found.fb_size > fb.fb_size) ||
                    found==undefined))
                found = fb;
            });
            if (found==undefined) {
                if (n < nmax)
                    return iter(n + 1);
                else
                    return undefined;
            } else {

                /*
                 ** Remove the found free cluster from the free list.
                 */
                flar[n].fl_body = [];
                Array.iter(flar[n].fl_tail, function (fb) {
                    if (!fb_equal(fb, found))
                        Array.append(flar[n].fl_body,fb);
                });
                flar[n].fl_tail = flar[n].fl_body;
                flar[n].fl_body = [];
                if (fb_equal(found, flar[n].fl_biggest))
                    flar[n].find_biggest();
                return found;
            }

        } else {
            if (n < nmax)
                return iter (n+1);
            else
                return undefined;
        }

    }
    /*
     ** Start searching in the free cluster list with the smallest
     ** cluster sizes!
     */
    var cl = iter(0);
    if (cl!=undefined) {
        var newc,left;
        var blocks = free_divide(cl,size,Free_divide_mode.Free_Top);
        newc = blocks[0];
        left = blocks[1];
        if (left!=nilfb) this.free_insert(left);
        return newc;
    } else return undefined;
};

/**
 ** Release a reserved cluster with the start address 'addr'.
 ** It' assumed that this cluster is somewhere in the front of a free list.
 ** Therefore, all free cluster lists are searched in a round-robinson style.
 ** After file creation is finished, normally the free_merge
 ** function do this job in a more efficient way.
 **
 **      L:  AAAA XXXXXX(RES)  BBB ->
 **      L': AAAA XXXXXX(FREE) BBB
 **
 *
 * @param {number} addr
 */
free_blocks.prototype.free_release = function (addr) {
    var flar = this.fbs_array;
    var nmax = this.fbs_num;
    var empty = 0;
    var mask = ((1 << nmax) - 1);
    function iter (n) {
        Array.match(flar[n].fl_tail,
        function (hd,tl){
            if (hd.fb_addr != addr) {

                Array.append(flar[n].fl_body, hd);
                flar[n].fl_tail = tl;
                var next = ((n + 1) == nmax) ? 0 : (n + 1);

                iter(next);
            } else {
                /*
                 ** Success.
                 */
                hd.fb_flag = Free_block.Cluster_FREE;
            }
        },
        function () {
            empty = empty | (1 << n);
            var next = ((n+1) == nmax)?0:(n+1);
            if ((empty & mask) != mask)
                iter(next);
        })
    }
    iter(0);
    /*
     ** Move the body list to the front of the tail list.
     */
    this.fbs_fragments=0;
    for (var i = 0; i<nmax;i++) {
        flar[i].fl_tail=Array.merge(flar[i].fl_body,flar[i].fl_tail);
        flar[i].fl_body=[];
        this.fbs_fragments=this.fbs_fragments+flar[i].fl_tail.length;
    }

    if (this.fbs_fragments>this.fbs_compacthres) self.free_compact();
};

/**
 ** Create a free cluster list object handler. The size range is divided
 ** linear in n equidistant ranges (decades of tenth).
 *
 * @param {number} n
 * @param {number} size
 */
free_blocks.prototype.free_create = function (n,size) {
    var i;
    var srar = [];
    var flar = [];
    this.fbs_fragments=0;
    for (i = 0; i <n; i ++) {
        flar.push(Free_block_list([], [], nilfb));
    }

    var d = 1;
    for (i = 0; i <n-1; i ++) {
        srar.push([d, d * 10]);
        d = d * 10;
    }

    if (size > d*10)
        srar.push([d,size]);
    else
        srar.push([d,d*10]);
    this.fbs_array=flar;
    this.fbs_range=srar;
    this.fbs_num=n;

};

/**
 ** Compact the freelist (merge contiguous clusters). Simply said,
 ** but hard to perform.
 *
 *
 */
free_blocks.prototype.free_compact = function () {
    var self=this;
    var i;
    /*
    ** First merge all sub lists to one huge list.
    */

    var fl = [];
    for (i = 0; i<self.fbs_num; i++) {
        fl=Array.merge(fl, this.fbs_array[i].fl_tail);
    }
    /*
     ** Now resort the freelist with increasing disk address
     ** order.
     */
    var fl2 = Array.sort(fl,function (f1,f2) {return (f1.fb_addr > f2.fb_addr)?1:-1});

    /*
     ** Try to merge contiguous clusters.
     */
    var merged=[];
    var lastfb = Free_block(0,0,Cluster_flag.Cluster_FREE);
    Array.iter(fl2,function (fs) {
        if ((lastfb.fb_addr + lastfb.fb_size) != fs.fb_addr) {

            if ((lastfb.fb_addr + lastfb.fb_size) != 0) {

                merged.push(lastfb);
            }
            lastfb = fs;
        } else {

            lastfb = Free_block(lastfb.fb_addr, fs.fb_size + lastfb.fb_size, lastfb.fb_flag);
        }
    });
    merged.push(lastfb);
    /*
     ** Now rebuild the freelist.
     */
    var flar = [];
    for(i=0;i<this.fbs_num;i++) {
        flar.push(Free_block_list([],[],nilfb));
    }
    this.fbs_array=flar;
    Array.iter (merged,function (fb) {
        self.free_insert(fb);
        });
    /*
     ** Huhhh, all work is done.
     */
    this.fbs_fragments=0;
    for (i = 0; i<this.fbs_num;i++) {
        this.fbs_fragments=this.fbs_fragments+flar[i].fl_tail.length;
    }
    if (this.fbs_fragments>this.fbs_compacthres) this.fbs_compacthres=this.fbs_fragments+10;
    else if (this.fbs_fragments<(this.fbs_compacthres/2)) this.fbs_compacthres=Perv.max(5,this.fbs_fragments*2);

};

/**
 ** Return the number of free clusters, the total free space and
 ** an array containing (low,high,num) free list statistics.
 *
 * @returns {[number,number,array]} totn,tots,tota
 */
free_blocks.prototype.free_info = function () {
    var flar = this.fbs_array;
    var srar = this.fbs_range;
    var nmax = this.fbs_num;
    var totn = 0;
    var tots = 0;
    var tota = [];
    for (var i = 0; i < nmax; i++) {
        totn = totn + Array.length(flar[i].fl_tail);
        var count = 0;
        Array.iter(flar[i].fl_tail, function (fb) {
            tots = tots + fb.fb_size;
            count++;
        });
        var low, high;
        low = srar[i][0];
        high = srar[i][1];
        tota.push([low, high, count]);
    }
    return [totn,tots,tota]
};

module.exports = {
    Cluster_flag:Cluster_flag,
    Free_block:Free_block,
    Free_blocks: function (fbs_array,fbs_range,fbs_num) {
        var obj = new free_blocks(fbs_array,fbs_range,fbs_num);
        Object.preventExtensions(obj);
        return obj;
    }
};


