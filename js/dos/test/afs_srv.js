/**
 * Created by sbosse on 4/29/15.
 */
"use strict";

var Io = require('../io');
var Net = require('../network');
var Status = require('../network').Status;
var Sch = require('../scheduler');
var Conn = require('../connection');
var Buf = require('../buf');
var Rpc = require('../rpc');
var Std = require('../std');
var Afs = require('../afs');
var Afs_srv = require('../afs_srv');
var Router = require('../router');
var util = require('util');
var assert = require('../compat').assert;
var Command = Net.Command;
var String = require('../compat').string;
var Array = require('../compat').array;
var Perv = require('../compat').pervasives;
var div = require('../compat').div;
var Fs = require('fs');

var help=false;
var create=false;
var overwrite=false;
var nblocks=65536;
var ninodes=1024;
var blocksize=512;
var partA = '/tmp/afs.inode';
var partB = '/tmp/afs.data';
var test = [];
var shift='';
var verbose=true;
var shunk=10000;

process.argv.forEach(function (val, index, array) {
    if(index>1) {
        if (String.equal(shift,''))
            String.match(val,[
                ['-help',function() {help=true;}],
                ['-overwrite',function() {overwrite=true;}],
                ['-create',function() {create=true;}],
                ['-nblocks',function() {shift=val;}],
                ['-ninodes',function() {shift=val;}],
                ['-blocksize',function() {shift=val;}],
                ['-test',function() {shift=val;}]
            ]);
        else {
            String.match(shift,[
                ['-nblocks',function() {nblocks=Perv.int_of_string(val);}],
                ['-ninodes',function() {ninodes=Perv.int_of_string(val);}],
                ['-blocksize',function() {blocksize=Perv.int_of_string(val);}],
                ['-test',function() {test.push(Perv.int_of_string(val));}]
            ]);
            shift='';
        }


    }
});

if (help) {
    Io.out('usage: '+process.argv[0]+' '+process.argv[1]);
    Io.out('         [-help -create -overwrite]');
    Io.out('         [-nblocks '+nblocks+' -ninodes '+ninodes+' -blocksize '+blocksize+']');
    Io.out('         [-partA '+partA+' -partB '+partB+']');
    return;
}
var privhostport = Net.uniqport();
var pubhostport = Net.prv2pub(privhostport);
var scheduler = Sch.Scheduler();
var conn = Conn.Connection(Net.uniqport(),'localhost',3000);
conn.init();
var router = Router.Router(pubhostport);
router.connection_broker(conn);
var rpc = Rpc.Rpc(router);
router.init();

/**
 * @type Afs_server
 */
var server = Afs_srv.Server(rpc);
var stat;
if (create)
    stat=server.afs_create_fs('myfiles',ninodes,blocksize,nblocks,partA,partB,true);
stat=server.afs_open_fs(partA,partB,Afs_srv.Afs_cache_parameters(2*(ninodes*Afs_srv.DEF_INODE_SIZE)/Afs_srv.DEF_BLOCK_SIZE,1,100,30));
Net.cap_to_file(Net.Capability(server.afs_super.afs_putport,
                Net.prv_encode(0,Net.Rights.PRV_ALL_RIGHTS,server.afs_super.afs_checkfield)),"/tmp/afscap");
scheduler.Init();
scheduler.Run();
Io.out(server.afs_stat());
//Io.out(server.freeblocks.print());

var fcap=[];
function test_create_file(path) {
    if (verbose) Io.out('test_create_file '+path);
    var stats = Fs.statSync(path);
    var size = stats.size;
    var data = Fs.readFileSync(path);
    var buf = Buf.Buffer(data);
    var priv = Net.prv_encode(0,Net.Rights.AFS_RGT_CREATE,server.afs_super.afs_checkfield);
    var sc = server.afs_create_file(priv,buf,size,Afs_srv.Afs_commit_flag.AFS_SAFETY);
    if (verbose) Io.out('test_create_file: '+Status.print(sc.stat)+' '+Net.Print.capability(sc.cap));
    fcap.push(sc.cap);
    return sc
}

function test_create_file2(size) {
    if (verbose) Io.out('test_create_file2 '+size);
    var buf = Buf.Buffer(size);
    var priv = Net.prv_encode(0,Net.Rights.AFS_RGT_CREATE,server.afs_super.afs_checkfield);
    var sc = server.afs_create_file(priv,buf,size,Afs_srv.Afs_commit_flag.AFS_SAFETY);
    if (verbose) Io.out('test_create_file2: '+Status.print(sc.stat)+' '+Net.Print.capability(sc.cap));
    fcap.push(sc.cap);
    return sc
}

function test_insert_file(path) {
    if (verbose) Io.out('test_insert_file '+path);
    var stats = Fs.statSync(path);
    var size = stats.size;
    var data = Fs.readFileSync(path);
    var buf = Buf.Buffer(data);
    var priv = Net.prv_encode(0,Net.Rights.AFS_RGT_CREATE,server.afs_super.afs_checkfield);
    var sc = server.afs_create_file(priv,undefined,0,Afs_srv.Afs_commit_flag.AFS_UNCOMMIT);
    var stat = sc.stat;
    var off2 = 0;
    var size2 = Perv.min(shunk,size);
    var buf2=Buf.Buffer(size2);
    while (stat == Status.STD_OK && off2 < size) {
        Buf.buf_blit(buf2,0,buf,off2,size2);
        var sc2 = server.afs_insert_data(sc.cap.cap_priv,buf2,off2,size2,Afs_srv.Afs_commit_flag.AFS_UNCOMMIT);
        stat=sc2.stat;
        off2=off2+size2;
        size2=Perv.min((size-off2),shunk);
    }
    sc = server.afs_insert_data(sc.cap.cap_priv,undefined,0,0,Afs_srv.Afs_commit_flag.AFS_SAFETY);
    fcap.push(sc.cap);
    sc.stat=stat;
    if (verbose) Io.out('test_insert_file: '+Status.print(sc.stat)+' '+Net.Print.capability(sc.cap));
    return sc
}
function test_insert_file2(size) {
    if (verbose) Io.out('test_insert_file2 '+size);
    var buf = Buf.Buffer(size);
    var priv = Net.prv_encode(0,Net.Rights.AFS_RGT_CREATE,server.afs_super.afs_checkfield);
    var sc = server.afs_create_file(priv,undefined,0,Afs_srv.Afs_commit_flag.AFS_UNCOMMIT);
    var stat = sc.stat;
    var off2 = 0;
    var size2 = Perv.min(shunk,size);
    var buf2=Buf.Buffer(size2);
    while (stat == Status.STD_OK && off2 < size) {
        Buf.buf_blit(buf2,0,buf,off2,size2);
        var sc2 = server.afs_insert_data(sc.cap.cap_priv,buf2,off2,size2,Afs_srv.Afs_commit_flag.AFS_UNCOMMIT);
        stat=sc2.stat;
        off2=off2+size2;
        size2=Perv.min((size-off2),shunk);
    }
    sc = server.afs_insert_data(sc.cap.cap_priv,undefined,0,0,Afs_srv.Afs_commit_flag.AFS_SAFETY);
    fcap.push(sc.cap);
    sc.stat=stat;
    if (verbose) Io.out('test_insert_file2: '+Status.print(sc.stat)+' '+Net.Print.capability(sc.cap));
    return sc
}
function test_file_size(obj) {
    if (verbose) Io.out('test_file_size '+obj);
    var priv = fcap[obj].cap_priv;
    var ss = server.afs_file_size(priv);
    if (verbose) Io.out('test_file_size: '+Status.print(ss.stat)+' '+Net.Print.capability(fcap[obj])+' '+ss.size);
    return ss;
}
function test_read_file(obj) {
    if (verbose) Io.out('test_read_file '+obj);
    var stats = test_file_size(obj);
    var size = stats.size;
    var buf = Buf.Buffer(size);
    var priv = fcap[obj].cap_priv;
    var ss = server.afs_read_file(priv,buf,0,size);
    if (ss.stat == Status.STD_OK) Fs.writeFileSync('file'+obj+'.dat',buf.data);
    if (verbose) Io.out('test_read_file: '+Status.print(ss.stat)+' '+Net.Print.capability(fcap[obj])+' '+ss.size);
    return ss;
}

function test_destroy_file(obj) {
    if (verbose) Io.out('test_destroy_file '+obj);
    var priv = fcap[obj].cap_priv;
    var stat = server.afs_destroy_file(priv);
    if (verbose) Io.out('test_destroy_file: '+Status.print(stat));
    return stat;
}


Array.iter (test,function(i) {
    var sc,ss,stat;
    switch (i) {
        case 1:
           sc=test_create_file('../sax.js');
           assert((sc.stat==Status.STD_OK)||('test 1 failed (test_create_file) '+Status.print(sc.stat)));
           break;
        case 2:
           sc=test_create_file('../xmldoc.js');
           assert((sc.stat==Status.STD_OK)||('test 2 failed (test_create_file) '+Status.print(sc.stat)));
           break;
        case 3:
           ss=test_file_size(0);
           assert((ss.stat==Status.STD_OK)||('test 3 failed (test_create_file) '+Status.print(ss.stat)));
           break;
        case 4:
           ss=test_file_size(1);
           assert((ss.stat==Status.STD_OK)||('test 4 failed (test_create_file) '+Status.print(ss.stat)));
           break;
        case 11:
            ss=test_read_file(0);
            assert((ss.stat==Status.STD_OK)||('test 11 failed (test_read_file) '+Status.print(ss.stat)));
            break;
        case 12:
            ss=test_read_file(1);
            assert((ss.stat==Status.STD_OK)||('test 12 failed (test_read_file) '+Status.print(ss.stat)));
            break;
        case 21:
            stat=test_destroy_file(0);
            assert((stat==Status.STD_OK)||('test 21 failed (test_destroy_file) '+Status.print(stat)));
            break;
        case 22:
            stat=test_destroy_file(1);
            assert((stat==Status.STD_OK)||('test 22 failed (test_destroy_file) '+Status.print(stat)));
            break;
        case 51:
            sc=test_insert_file('../sax.js');
            assert((sc.stat==Status.STD_OK)||('test 51 failed (test_insert_file) '+Status.print(sc.stat)));
            break;
        case 100:
           server.afs_exit();
           server = Afs_srv.Server(rpc);
           stat=server.afs_open_fs(partA,partB,Afs_srv.Afs_cache_parameters(1000,1,100,30));
           assert((stat==Status.STD_OK)||('test 100 failed (afs_open_fs) '+Status.print(stat)));
           break;
        case 200:
            var loops=100;
            var size=500000;
            Io.out('test_loop run '+loops);
            var start=Perv.mtime();

            verbose=false;
            for(var i=0;i<loops;i++) {
                fcap = [];
                sc = test_insert_file2(size);
                assert((sc.stat == Status.STD_OK) || ('test 200A failed (test_insert_file) ' + Status.print(sc.stat)));
                sc = test_insert_file2(size);
                assert((sc.stat == Status.STD_OK) || ('test 200B failed (test_insert_file) ' + Status.print(sc.stat)));
                stat = test_destroy_file(0);
                assert((stat == Status.STD_OK) || ('test 200C failed (test_destroy_file) ' + Status.print(stat)));
                stat = test_destroy_file(1);
                assert((stat == Status.STD_OK) || ('test 200D failed (test_destroy_file) ' + Status.print(stat)));
            }
            verbose=true;
            var stop=Perv.mtime();
            var bw = (loops*size*2)/(stop-start);
            Io.out('test_loop run '+loops+' finished.');
            Io.out(((bw*1000)|0)+' Bytes/sec '+div(div((bw*1000),1024),1024)+' MB/sec');
            break;

        case 201:
            var loops=100;
            var size=1000000;
            Io.out('test_loop run '+loops);
            var start=Perv.mtime();

            verbose=false;
            for(var i=0;i<loops;i++) {
                fcap = [];
                sc = test_create_file2(size);
                assert((sc.stat == Status.STD_OK) || ('test 200A failed (test_insert_file) ' + Status.print(sc.stat)));
                sc = test_create_file2(size);
                assert((sc.stat == Status.STD_OK) || ('test 200B failed (test_insert_file) ' + Status.print(sc.stat)));
                stat = test_destroy_file(0);
                assert((stat == Status.STD_OK) || ('test 200C failed (test_destroy_file) ' + Status.print(stat)));
                stat = test_destroy_file(1);
                assert((stat == Status.STD_OK) || ('test 200D failed (test_destroy_file) ' + Status.print(stat)));
            }
            verbose=true;
            var stop=Perv.mtime();
            var bw = (loops*size*2)/(stop-start);
            Io.out('test_loop run '+loops+' finished.');
            Io.out(((bw*1000)|0)+' Bytes/sec '+div(div((bw*1000),1024),1024)+' MB/sec');
            break;

        case 1000:
            server.afs_start_server(scheduler);
            break;
   }
});
//Io.inspect(server.inode_cache_entry)
//Io.inspect(server.cache_data.fsc_table)
Io.out(server.afs_stat());
Io.out(server.freeblocks.print());
server.freeblocks.free_compact();
Io.out(server.freeblocks.print());
Io.out('Host ports: '+Net.Print.port(privhostport)+' -> ' +Net.Print.port(pubhostport));

process.on('SIGINT', function () {
    console.log('Ctrl-C...');
    server.afs_exit();
    process.exit(2);
});

router.start(100);

