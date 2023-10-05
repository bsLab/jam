open('c2');
open('sqlite3',this);
open('random',this);

/** GLOBALS **/
/*
** Allowed values for the flags parameter to sqlite3pager_open().
**
** NOTE: This values must match the corresponding BTREE_ values in btree.h.
*/
PAGER_OMIT_JOURNAL  = 0x0001;    /* Do not use a rollback journal */
PAGER_NO_READLOCK   = 0x0002;    /* Omit readlocks on readonly files */

/*
** The following two macros are used within the TRACEX() macros above
** to print out file-descriptors. 
**
** PAGERID() takes a pointer to a Pager struct as it's argument. The
** associated file-descriptor is returned. FILEHANDLEID() takes an OsFile
** struct as it's argument.
*/
var PAGERID = function(p) { return FILEHANDLEID(p.fd) }
var FILEHANDLEID = function (fd) { return sqlite3OsFileHandle(fd)}

/*
** The page cache as a whole is always in one of the following
** states:
**
**   PAGER_UNLOCK        The page cache is not currently reading or 
**                       writing the database file.  There is no
**                       data held in memory.  This is the initial
**                       state.
**
**   PAGER_SHARED        The page cache is reading the database.
**                       Writing is not permitted.  There can be
**                       multiple readers accessing the same database
**                       file at the same time.
**
**   PAGER_RESERVED      This process has reserved the database for writing
**                       but has not yet made any changes.  Only one process
**                       at a time can reserve the database.  The original
**                       database file has not been modified so other
**                       processes may still be reading the on-disk
**                       database file.
**
**   PAGER_EXCLUSIVE     The page cache is writing the database.
**                       Access is exclusive.  No other processes or
**                       threads can be reading or writing while one
**                       process is writing.
**
**   PAGER_SYNCED        The pager moves to this state from PAGER_EXCLUSIVE
**                       after all dirty pages have been written to the
**                       database file and the file has been synced to
**                       disk. All that remains to do is to remove the
**                       journal file and the transaction will be
**                       committed.
**
** The page cache comes up in PAGER_UNLOCK.  The first time a
** sqlite3pager_get() occurs, the state transitions to PAGER_SHARED.
** After all pages have been released using sqlite_page_unref(),
** the state transitions back to PAGER_UNLOCK.  The first time
** that sqlite3pager_write() is called, the state transitions to
** PAGER_RESERVED.  (Note that sqlite_page_write() can only be
** called on an outstanding page which means that the pager must
** be in PAGER_SHARED before it transitions to PAGER_RESERVED.)
** The transition to PAGER_EXCLUSIVE occurs when before any changes
** are made to the database file.  After an sqlite3pager_rollback()
** or sqlite_pager_commit(), the state goes back to PAGER_SHARED.
*/
var PAGER_UNLOCK     = 0
var PAGER_SHARED     = 1   /* same as SHARED_LOCK */
var PAGER_RESERVED   = 2   /* same as RESERVED_LOCK */
var PAGER_EXCLUSIVE  = 4   /* same as EXCLUSIVE_LOCK */
var PAGER_SYNCED     = 5

/*
** If the SQLITE_BUSY_RESERVED_LOCK macro is set to true at compile-time,
** then failed attempts to get a reserved lock will invoke the busy callback.
** This is off by default.  To see why, consider the following scenario:
** 
** Suppose thread A already has a shared lock and wants a reserved lock.
** Thread B already has a reserved lock and wants an exclusive lock.  If
** both threads are using their busy callbacks, it might be a long time
** be for one of the threads give up and allows the other to proceed.
** But if the thread trying to get the reserved lock gives up quickly
** (if it never invokes its busy callback) then the contention will be
** resolved quickly.
*/
if (typeof SQLITE_BUSY_RESERVED_LOCK == 'undefined')
  SQLITE_BUSY_RESERVED_LOCK = 0;
  
/*
** This macro rounds values up so that if the value is an address it
** is guaranteed to be an address that is aligned to an 8-byte boundary.
*/
var FORCE_ALIGNMENT = function(X) { return  (((X)+7)&~7) }

/*
** Each in-memory image of a page begins with the following header.
** This header is only visible to this pager module.  The client
** code that calls pager sees only the data that follows the header.
**
** Client code should call sqlite3pager_write() on a page prior to making
** any modifications to that page.  The first time sqlite3pager_write()
** is called, the original page contents are written into the rollback
** journal and PgHdr.inJournal and PgHdr.needSync are set.  Later, once
** the journal page has made it onto the disk surface, PgHdr.needSync
** is cleared.  The modified page cannot be written back into the original
** database file until the journal pages has been synced to disk and the
** PgHdr.needSync has been cleared.
**
** The PgHdr.dirty flag is set when sqlite3pager_write() is called and
** is cleared again when the page content is written back to the original
** database file.
*/
function PgHdr () {
return {
  pPager:_,                     /* Pager * The pager to which this page belongs */
  pgno:0,                       /* Pgno  The page number for this page */
  pNextHash:_, pPrevHash:_,     /* PgHdr * Hash collision chain for PgHdr.pgno */
  pNextFree:_, pPrevFree:_,     /* PgHdr * Freelist of pages where nRef==0 */
  pNextAll:_,                   /* PgHdr * A list of all pages */
  pNextStmt:_, pPrevStmt:_,     /* PgHdr * List of pages in the statement journal */
  inJournal:false,              /* u8 TRUE if has been written to journal */
  inStmt:false,                 /* u8 TRUE if in the statement subjournal */
  dirty:false,                  /* u8 TRUE if we need to write back changes */
  needSync:false,               /* u8 Sync journal before writing this page */
  alwaysRollback:false,         /* u8 Disable dont_rollback() for this page */
  nRef:0,                       /* short int Number of users of this page */
  pDirty:_,                     /* PgHdr * Dirty pages sorted by PgHdr.pgno */
//#ifdef SQLITE_CHECK_PAGES
//  u32 pageHash:0,
//#endif
  data:_,         /* pPager->pageSize bytes of page data follow this header */
  extra:_,         /* pPager.nExtra bytes of local data follow the page data */
  history:_,      /* PgHistory * */
}};
  
/*
** For an in-memory only database, some extra information is recorded about
** each page so that changes can be rolled back.  (Journal files are not
** used for in-memory databases.)  The following information is added to
** the end of every EXTRA block for in-memory databases.
**
** This information could have been added directly to the PgHdr structure.
** But then it would take up an extra 8 bytes of storage on every PgHdr
** even for disk-based databases.  Splitting it out saves 8 bytes.  This
** is only a savings of 0.8% but those percentages add up.
*/
function PgHistory () {
return {
  pOrig:_,     /* u8 * Original page text.  Restore to this on a full rollback */
  pStmt:_,     /* u8 * Text as it was at the beginning of the current statement */
}};

/*
** A macro used for invoking the codec if there is one
*/
if (typeof SQLITE_HAS_CODEC != 'undefined')
  var CODEC = function(P,D,N,X) {if( P.xCodec ){ P.xCodec(P.pCodecArg,D,N,X)}}
else
  var CODEC = function(P,D,N,X) {}


/*
** Convert a pointer to a PgHdr into a pointer to its data
** and back again.
*/
var PGHDR_TO_DATA = function (P) {return P.data }
//var DATA_TO_PGHDR(D)  (&((PgHdr*)(D))[-1])
var PGHDR_TO_EXTRA = function(G,P) {return P.extra }
var PGHDR_TO_HIST = function (P,PGR) {return P.history } 

/*
** How big to make the hash table used for locating in-memory pages
** by page number. This macro looks a little silly, but is evaluated
** at compile-time, not run-time (at least for gcc this is true).
*/
if (typeof MAX_PAGES == 'undefined') var MAX_PAGES=2000;
var N_PG_HASH = (
  (MAX_PAGES>1024)?2048: 
  (MAX_PAGES>512)?1024: 
  (MAX_PAGES>256)?512: 
  (MAX_PAGES>128)?256: 
  (MAX_PAGES>64)?128:64 
)

/*
** Hash a page number
*/
var pager_hash = function(PN) {return ((PN)&(N_PG_HASH-1)) }

/*
** A open page cache is an instance of the following structure.
**
** Pager.errCode may be set to SQLITE_IOERR, SQLITE_CORRUPT, SQLITE_PROTOCOL
** or SQLITE_FULL. Once one of the first three errors occurs, it persists
** and is returned as the result of every major pager API call.  The
** SQLITE_FULL return code is slightly different. It persists only until the
** next successful rollback is performed on the pager cache. Also,
** SQLITE_FULL does not affect the sqlite3pager_get() and sqlite3pager_lookup()
** APIs, they may still be used successfully.
*/
var Pager = this.Pager = function () {
return {
  journalOpen:false,             /* u8 True if journal file descriptors is valid */
  journalStarted:false,          /* True if header of journal is synced */
  useJournal:false,              /* Use a rollback journal on this file */
  noReadlock:false,              /* Do not bother to obtain readlocks */
  stmtOpen:false,                /* True if the statement subjournal is open */
  stmtInUse:false,               /* True we are in a statement subtransaction */
  stmtAutoopen:false,            /* Open stmt journal when main journal is opened*/
  noSync:false,                  /* Do not sync the journal if true */
  fullSync:false,                /* Do extra syncs of the journal for robustness */
  full_fsync:false,              /* Use F_FULLFSYNC when available */
  state:_,                   /* PAGER_UNLOCK, _SHARED, _RESERVED, etc. */
  errCode:_,                 /* One of several kinds of errors */
  tempFile:_,                /* zFilename is a temporary file */
  readOnly:_,                /* True for a read-only database */
  needSync:_,                /* True if an fsync() is needed on the journal */
  dirtyCache:_,              /* True if cached pages have changed */
  alwaysRollback:false,          /* Disable dont_rollback() for all pages */
  memDb:false,                   /* True to inhibit all file I/O */
  setMaster:false,               /* True if a m-j name has been written to jrnl */
  dbSize:0,                 /* int Number of pages in the file */
  origDbSize:0,             /* int dbSize before the current change */
  stmtSize:0,               /* int Size of database (in pages) at stmt_begin() */
  nRec:0,                   /* int Number of pages written to the journal */
  cksumInit:0,              /* u32 Quasi-random value added to every checksum */
  stmtNRec:0,               /* int Number of records in stmt subjournal */
  nExtra:0,                 /* int Add this many bytes to each in-memory page */
  pageSize:0,               /* int Number of bytes in a page */
  nPage:0,                  /* int Total number of in-memory pages */
  nMaxPage:0,               /* int High water mark of nPage */
  nRef:0,                   /* int Number of in-memory pages with PgHdr.nRef>0 */
  mxPage:0,                 /* int Maximum number of pages to hold in cache */
  aInJournal:_,             /* u8* One bit for each page in the database file */
  aInStmt:_,                /* u8* One bit for each page in the database */
  zFilename:_,            /* char * Name of the database file */
  zJournal:_,             /* char * Name of the journal file */
  zDirectory:_,           /* char * Directory hold database and journal files */
  fd:_, jfd:_,           /* OsFile * File descriptors for database and journal */
  stfd:_,               /* OsFile * File descriptor for the statement subjournal*/
  pBusyHandler:_,  /* BusyHandler * Pointer to sqlite.busyHandler */
  pFirst:_, pLast:_,      /* PgHdr * List of free pages */
  FirstSynced:_,        /* PgHdr * First free page with PgHdr.needSync==0 */
  pAll:_,                /* PgHdr * List of all pages */
  pStmt:_,               /* PgHdr * List of pages in the statement subjournal */
  journalOff:0,             /* i64 Current byte offset in the journal file */
  journalHdr:0,             /* i64 Byte offset to previous journal header */
  stmtHdrOff:0,             /* i64 First journal header written this statement */
  stmtCksum:0,              /* i64 cksumInit when statement was started */
  stmtJSize:0,              /* i64 Size of journal at stmt_begin() */
  sectorSize:0,             /* int Assumed sector size during rollback */
//#ifdef SQLITE_TEST
//  nHit:0, nMiss:0, nOvfl:0,     /* int Cache hits, missing, and LRU overflows */
//  nRead:0,nWrite:0,             /* int Database pages read/written */
//#endif
  xDestructor:_, /* void (*)(void*,int) Call this routine when freeing pages */
  xReiniter:_,   /* void (*)(void*,int) Call this routine when reloading pages */
  xCodec:_, /* void (*) (void*,void*,Pgno,int)Routine for en/decoding data */
  pCodecArg:_,            /* void * First argument to xCodec() */
  aHash:Array(N_PG_HASH),    /* PgHdr * Hash table to map page number to PgHdr */
//#ifdef SQLITE_ENABLE_MEMORY_MANAGEMENT
//  pNext:_,               /* Pager * Linked list of pagers in this thread */
//#endif
}}

/*
** Journal files begin with the following magic string.  The data
** was obtained from /dev/random.  It is used only as a sanity check.
**
** Since version 2.8.0, the journal format contains additional sanity
** checking information.  If the power fails while the journal is begin
** written, semi-random garbage data might appear in the journal
** file after power is restored.  If an attempt is then made
** to roll the journal back, the database could be corrupted.  The additional
** sanity checking data is an attempt to discover the garbage in the
** journal and ignore it.
**
** The sanity checking information for the new journal format consists
** of a 32-bit checksum on each page of data.  The checksum covers both
** the page number and the pPager->pageSize bytes of data for the page.
** This cksum is initialized to a 32-bit random value that appears in the
** journal file right after the header.  The random initializer is important,
** because garbage data that appears at the end of a journal is likely
** data that was once in other files that have now been deleted.  If the
** garbage data came from an obsolete journal file, the checksums might
** be correct.  But by initializing the checksum to random value which
** is different for every journal, we minimize that risk.
*/
var aJournalMagic = Buffer([0xd9, 0xd5, 0x05, 0xf9, 0x20, 0xa1, 0x63, 0xd7])

/*
** The size of the header and of each page in the journal is determined
** by the following macros.
*/
var JOURNAL_PG_SZ = function(pPager)  {return ((pPager.pageSize) + 8)}

/*
** The journal header size for this pager. In the future, this could be
** set to some value read from the disk controller. The important
** characteristic is that it is the same size as a disk sector.
*/
var JOURNAL_HDR_SZ = function(pPager) {return (pPager.sectorSize)}

/*
** The macro MEMDB is true if we are dealing with an in-memory database.
** We do this as a macro so that if the SQLITE_OMIT_MEMORYDB macro is set,
** the value of MEMDB will be a constant and the compiler will optimize
** out code that would never execute.
*/
if (typeof SQLITE_OMIT_MEMORYDB != 'undefined')
  var MEMDB = function () { return 0};
else
  var MEMDB = function (pPager) { return pPager.memDb };

/*
** The default size of a disk sector
*/
var PAGER_SECTOR_SIZE = 512

/*
** Page number PAGER_MJ_PGNO is never used in an SQLite database (it is
** reserved for working around a windows/posix incompatibility). It is
** used in the journal to signify that the remainder of the journal file 
** is devoted to storing a master journal name - there are no more pages to
** roll back. See comments for function writeMasterJournal() for details.
*/
/* #define PAGER_MJ_PGNO(x) (PENDING_BYTE/((x)->pageSize)) */
var PAGER_MJ_PGNO = function(x) {return ((PENDING_BYTE/(x.pageSize))+1)}

/*
** The maximum legal page number is (2^31 - 1).
*/
var PAGER_MAX_PGNO = 2147483647

/*
** Enable reference count tracking (for debugging) here:
*/
var REFINFO = function(X) {}


/*
** Read a 32-bit integer from the given file descriptor.  Store the integer
** that is read in *pRes.  Return SQLITE_OK if everything worked, or an
** error code is something goes wrong.
**
** All values are stored on disk as big-endian.
** static int read32bits(OsFile *fd, u32 *pRes)
*/
function read32bits(fd, pRes){
  var ac=Buffer(4);
  var rc = sqlite3OsRead(fd, ac, sizeof(ac));
  if( rc==SQLITE_OK ){
    $$(pRes , (ac[0]<<24) | (ac[1]<<16) | (ac[2]<<8) | ac[3]);
  }
  return rc;
}

/*
** Write a 32-bit integer into a string buffer in big-endian byte order.
** static void put32bits(char *ac, u32 val)
*/
function put32bits(ac, val, offset){
  if (!offset) offset=0;
  ac[offset+0] = (val>>24) & 0xff;
  ac[offset+1] = (val>>16) & 0xff;
  ac[offset+2] = (val>>8) & 0xff;
  ac[offset+3] = val & 0xff;
}

/*
** Write a 32-bit integer into the given file descriptor.  Return SQLITE_OK
** on success or an error code is something goes wrong.
** static int write32bits(OsFile *fd, u32 val)
*/
function write32bits(fd, val){
  var ac=Buffer(4);
  put32bits(ac, val);
  return sqlite3OsWrite(fd, ac, 4);
}

/*
** Write the 32-bit integer 'val' into the page identified by page header
** 'p' at offset 'offset'.
** static void store32bits(u32 val, PgHdr *p, int offset)
*/
function store32bits(val, p, offset){
  var ac = p.data;
  put32bits(ac, val, offset);
}

/*
** Read a 32-bit integer at offset 'offset' from the page identified by
** page header 'p'.
** static u32 retrieve32bits(PgHdr *p, int offset)
*/
function retrieve32bits(p, offset){
  var ac;
  ac = p.data;
  return (ac[offset+0]<<24) | (ac[offset+1]<<16) | (ac[offset+2]<<8) | ac[offset+3];
}


/*
** This function should be called when an error occurs within the pager
** code. The first argument is a pointer to the pager structure, the
** second the error-code about to be returned by a pager API function. 
** The value returned is a copy of the second argument to this function. 
**
** If the second argument is SQLITE_IOERR, SQLITE_CORRUPT or SQLITE_PROTOCOL,
** the error becomes persistent. All subsequent API calls on this Pager
** will immediately return the same error code.
** static int pager_error(Pager *pPager, int rc)
*/
function pager_error(pPager, rc){
  assert( pPager.errCode==SQLITE_FULL || pPager.errCode==SQLITE_OK );
  if( 
    rc==SQLITE_FULL ||
    rc==SQLITE_IOERR ||
    rc==SQLITE_CORRUPT ||
    rc==SQLITE_PROTOCOL
  ){
    pPager.errCode = rc;
  }
  return rc;
}

var CHECK_PAGE = function(x) {}

/*
** When this is called the journal file for pager pPager must be open.
** The master journal file name is read from the end of the file and 
** written into memory obtained from sqliteMalloc(). *pzMaster is
** set to point at the memory and SQLITE_OK returned. The caller must
** sqliteFree() *pzMaster.
**
** If no master journal file name is present *pzMaster is set to 0 and
** SQLITE_OK returned.
** static int readMasterJournal(OsFile *pJrnl, char **pzMaster)
*/
function readMasterJournal(pJrnl, pzMaster){
  var rc;
  var len=ref(0)
  var szJ=ref(0);
  var cksum=ref(0);
  var i;
  var aMagic=Buffer(8); /* A buffer to hold the magic header */

  $$(pzMaster,null);

  rc = sqlite3OsFileSize(pJrnl, szJ);
  if( rc!=SQLITE_OK || $(szJ)<16 ) return rc;

  rc = sqlite3OsSeek(pJrnl, $(szJ)-16);
  if( rc!=SQLITE_OK ) return rc;
 
  rc = read32bits(pJrnl, len);
  if( rc!=SQLITE_OK ) return rc;

  rc = read32bits(pJrnl, cksum);
  if( rc!=SQLITE_OK ) return rc;

  rc = sqlite3OsRead(pJrnl, aMagic, 8);
  if( rc!=SQLITE_OK || !cmp(aMagic, aJournalMagic, 8) ) return rc;

  rc = sqlite3OsSeek(pJrnl, $(szJ)-16-$(len));
  if( rc!=SQLITE_OK ) return rc;

  $$(pzMaster, Buffer($(len)));

  rc = sqlite3OsRead(pJrnl, $(pzMaster), $(len)+1);
  if( rc!=SQLITE_OK ){
    $$(pzMaster,null);
    return rc;
  }

  /* See if the checksum matches the master journal name */
  for(i=0; i<len; i++){
    cksum -= $(pzMaster)[i];
  }
  if( cksum ){
    /* If the checksum doesn't add up, then one or more of the disk sectors
    ** containing the master journal filename is corrupted. This means
    ** definitely roll back, so just return SQLITE_OK and report a (nul)
    ** master-journal filename.
    */
    //sqliteFree(pzMaster);
    $$(pzMaster,null);
  } else {
    $(pzMaster)[len] = '\0';
  }
   
  return SQLITE_OK;
}

/*
** Seek the journal file descriptor to the next sector boundary where a
** journal header may be read or written. Pager.journalOff is updated with
** the new seek offset.
**
** i.e for a sector size of 512:
**
** Input Offset              Output Offset
** ---------------------------------------
** 0                         0
** 512                       512
** 100                       512
** 2000                      2048
** 
** static int seekJournalHdr(Pager *pPager)
*/
function seekJournalHdr(pPager){
  var offset = 0;
  var c = pPager.journalOff;
  if( c ){
    offset = ((c-1)/JOURNAL_HDR_SZ(pPager) + 1) * JOURNAL_HDR_SZ(pPager);
  }
  assert( offset%JOURNAL_HDR_SZ(pPager)==0 );
  assert( offset>=c );
  assert( (offset-c)<JOURNAL_HDR_SZ(pPager) );
  pPager.journalOff = offset;
  return sqlite3OsSeek(pPager.jfd, pPager.journalOff);
}

/*
** The journal file must be open when this routine is called. A journal
** header (JOURNAL_HDR_SZ bytes) is written into the journal file at the
** current location.
**
** The format for the journal header is as follows:
** - 8 bytes: Magic identifying journal format.
** - 4 bytes: Number of records in journal, or -1 no-sync mode is on.
** - 4 bytes: Random number used for page hash.
** - 4 bytes: Initial database page count.
** - 4 bytes: Sector size used by the process that wrote this journal.
** 
** Followed by (JOURNAL_HDR_SZ - 24) bytes of unused space.
** static int writeJournalHdr(Pager *pPager)
*/
function writeJournalHdr(pPager){
  var zHeader=Buffer(sizeof(aJournalMagic)+16),
      cksumInit=ref(0);

  var rc = seekJournalHdr(pPager);
  if( rc ) return rc;

  pPager.journalHdr = pPager.journalOff;
  if( pPager.stmtHdrOff==0 ){
    pPager.stmtHdrOff = pPager.journalHdr;
  }
  pPager.journalOff += JOURNAL_HDR_SZ(pPager);

  /* FIX ME: 
  **
  ** Possibly for a pager not in no-sync mode, the journal magic should not
  ** be written until nRec is filled in as part of next syncJournal(). 
  **
  ** Actually maybe the whole journal header should be delayed until that
  ** point. Think about this.
  */
  memcpy(zHeader, aJournalMagic, sizeof(aJournalMagic));
  /* The nRec Field. 0xFFFFFFFF for no-sync journals. */
  put32bits(zHeader, pPager.noSync ? 0xffffffff : 0,sizeof(aJournalMagic));
  /* The random check-hash initialiser */ 
  sqlite3Randomness(sizeof(pPager.cksumInit), cksumInit); pager.cksumInit=$(cksumInit);
  put32bits(zHeader, pPager.cksumInit,sizeof(aJournalMagic)+4);
  /* The initial database size */
  put32bits(zHeader, pPager.dbSize,sizeof(aJournalMagic)+8);
  /* The assumed sector size for this process */
  put32bits(zHeader, pPager.sectorSize,sizeof(aJournalMagic)+12);
  rc = sqlite3OsWrite(pPager.jfd, zHeader, sizeof(zHeader));

  /* The journal header has been written successfully. Seek the journal
  ** file descriptor to the end of the journal header sector.
  */
  if( rc==SQLITE_OK ){
    rc = sqlite3OsSeek(pPager.jfd, pPager.journalOff-1);
    if( rc==SQLITE_OK ){
      rc = sqlite3OsWrite(pPager.jfd, "\000", 1);
    }
  }
  return rc;
}

/*
** The journal file must be open when this is called. A journal header file
** (JOURNAL_HDR_SZ bytes) is read from the current location in the journal
** file. See comments above function writeJournalHdr() for a description of
** the journal header format.
**
** If the header is read successfully, *nRec is set to the number of
** page records following this header and *dbSize is set to the size of the
** database before the transaction began, in pages. Also, pPager->cksumInit
** is set to the value read from the journal header. SQLITE_OK is returned
** in this case.
**
** If the journal header file appears to be corrupted, SQLITE_DONE is
** returned and *nRec and *dbSize are not set.  If JOURNAL_HDR_SZ bytes
** cannot be read from the journal file an error code is returned.
static int readJournalHdr(
  Pager *pPager, 
  i64 journalSize,
  u32 *pNRec, 
  u32 *pDbSize
)
*/
function readJournalHdr(
  pPager, 
  ournalSize,
  pNRec,  // ref 
  pDbSize // ref
){
  var rc,cksumInit=ref(0),sectorSize=ref(0);
  var aMagic=Buffer(8); /* A buffer to hold the magic header */

  rc = seekJournalHdr(pPager);
  if( rc ) return rc;

  if( pPager.journalOff+JOURNAL_HDR_SZ(pPager) > journalSize ){
    return SQLITE_DONE;
  }

  rc = sqlite3OsRead(pPager.jfd, aMagic, sizeof(aMagic));
  if( rc ) return rc;

  if( memcmp(aMagic, aJournalMagic, sizeof(aMagic))!=0 ){
    return SQLITE_DONE;
  }

  rc = read32bits(pPager.jfd, pNRec);
  if( rc ) return rc;

  rc = read32bits(pPager.jfd, cksumInit); pPager.cksumInit=$(cksumInit);
  if( rc ) return rc;

  rc = read32bits(pPager.jfd, pDbSize);
  if( rc ) return rc;

  /* Update the assumed sector-size to match the value used by 
  ** the process that created this journal. If this journal was
  ** created by a process other than this one, then this routine
  ** is being called from within pager_playback(). The local value
  ** of Pager.sectorSize is restored at the end of that routine.
  */
  rc = read32bits(pPager.fd, sectorSize); pPager.sectorSize=$(sectorSize);
  if( rc ) return rc;

  pPager.journalOff += JOURNAL_HDR_SZ(pPager);
  rc = sqlite3OsSeek(pPager.jfd, pPager,journalOff);
  return rc;
}

/*
** Write the supplied master journal name into the journal file for pager
** pPager at the current location. The master journal name must be the last
** thing written to a journal file. If the pager is in full-sync mode, the
** journal file descriptor is advanced to the next sector boundary before
** anything is written. The format is:
**
** + 4 bytes: PAGER_MJ_PGNO.
** + N bytes: length of master journal name.
** + 4 bytes: N
** + 4 bytes: Master journal name checksum.
** + 8 bytes: aJournalMagic[].
**
** The master journal page checksum is the sum of the bytes in the master
** journal name.
**
** If zMaster is a NULL pointer (occurs for a single database transaction), 
** this call is a no-op.
** static int writeMasterJournal(Pager *pPager, const char *zMaster)
*/
function writeMasterJournal(pPager, zMaster){
  var rc;
  var len; 
  var i; 
  var cksum = 0;
  var zBuf=Buffer(sizeof(aJournalMagic)+2*4);

  if( !zMaster || pPager.setMaster) return SQLITE_OK;
  pPager.setMaster = 1;

  len = strlen(zMaster);
  for(i=0; i<len; i++){
    cksum += zMaster[i];
  }

  /* If in full-sync mode, advance to the next disk sector before writing
  ** the master journal name. This is in case the previous page written to
  ** the journal has already been synced.
  */
  if( pPager.fullSync ){
    rc = seekJournalHdr(pPager);
    if( rc!=SQLITE_OK ) return rc;
  }
  pPager.journalOff += (len+20);

  rc = write32bits(pPager.jfd, PAGER_MJ_PGNO(pPager));
  if( rc!=SQLITE_OK ) return rc;

  rc = sqlite3OsWrite(pPager.jfd, zMaster, len);
  if( rc!=SQLITE_OK ) return rc;

  put32bits(zBuf, len);
  put32bits(zBuf, cksum, 4);
  memcpy(zBuf, aJournalMagic, sizeof(aJournalMagic), 8);
  rc = sqlite3OsWrite(pPager.jfd, zBuf, 8+sizeof(aJournalMagic));
  pPager.needSync = !pPager.noSync;
  return rc;
}

/*
** Add or remove a page from the list of all pages that are in the
** statement journal.
**
** The Pager keeps a separate list of pages that are currently in
** the statement journal.  This helps the sqlite3pager_stmt_commit()
** routine run MUCH faster for the common case where there are many
** pages in memory but only a few are in the statement journal.
** static void page_add_to_stmt_list(PgHdr *pPg)
*/
function page_add_to_stmt_list(pPg){
  var pPager = pPg.pPager;
  if( pPg.inStmt ) return;
  assert( pPg.pPrevStmt==0 && pPg.pNextStmt==0 );
  pPg.pPrevStmt = 0;
  if( pPager.pStmt ){
    pPager.pStmt.pPrevStmt = pPg;
  }
  pPg.pNextStmt = pPager.pStmt;
  pPager.pStmt = pPg;
  pPg.inStmt = 1;
}
// static void page_remove_from_stmt_list(PgHdr *pPg)
function page_remove_from_stmt_list(pPg){
  if( !pPg.inStmt ) return;
  if( pPg.pPrevStmt ){
    assert( pPg.pPrevStmt.pNextStmt==pPg );
    pPg.pPrevStmt.pNextStmt = pPg.pNextStmt;
  }else{
    assert( pPg.pPager.pStmt==pPg );
    pPg.pPager.pStmt = pPg.pNextStmt;
  }
  if( pPg.pNextStmt ){
    assert( pPg.pNextStmt.pPrevStmt==pPg );
    pPg.pNextStmt.pPrevStmt = pPg.pPrevStmt;
  }
  pPg.pNextStmt = 0;
  pPg.pPrevStmt = 0;
  pPg.inStmt = 0;
}

/*
** Find a page in the hash table given its page number.  Return
** a pointer to the page or NULL if not found.
** static PgHdr *pager_lookup(Pager *pPager, Pgno pgno)
*/
function pager_lookup(pPager, pgno){
  var p = pPager.aHash[pager_hash(pgno)];
  while( p && p.pgno!=pgno ){
    p = p.pNextHash;
  }
  return p;
}

/*
** Unlock the database and clear the in-memory cache.  This routine
** sets the state of the pager back to what it was when it was first
** opened.  Any outstanding pages are invalidated and subsequent attempts
** to access those pages will likely result in a coredump.
** static void pager_reset(Pager *pPager)
*/
function pager_reset(pPager){
  var pPg, pNext;
  if( pPager.errCode ) return;
  for(pPg=pPager.pAll; pPg; pPg=pNext){
    pNext = pPg.pNextAll;
    sqliteFree(pPg);
  }
  pPager.pFirst = 0;
  pPager.pFirstSynced = 0;
  pPager.pLast = 0;
  pPager.pAll = 0;
  memset(pPager.aHash, 0, sizeof(pPager.aHash));
  pPager.nPage = 0;
  if( pPager.state>=PAGER_RESERVED ){
    sqlite3pager_rollback(pPager);
  }
  sqlite3OsUnlock(pPager.fd, NO_LOCK);
  pPager.state = PAGER_UNLOCK;
  pPager.dbSize = -1;
  pPager.nRef = 0;
  assert( pPager.journalOpen==0 );
}

/*
** When this routine is called, the pager has the journal file open and
** a RESERVED or EXCLUSIVE lock on the database.  This routine releases
** the database lock and acquires a SHARED lock in its place.  The journal
** file is deleted and closed.
**
** TODO: Consider keeping the journal file open for temporary databases.
** This might give a performance improvement on windows where opening
** a file is an expensive operation.
** static int pager_unwritelock(Pager *pPager)
*/
function pager_unwritelock(pPager){
  var pPg;
  var rc;
  var fd=ref();
  //assert( !MEMDB );
  if( pPager.state<PAGER_RESERVED ){
    return SQLITE_OK;
  }
  sqlite3pager_stmt_commit(pPager);
  if( pPager.stmtOpen ){
    $$(fd,fd,pPager.stfd);sqlite3OsClose(fd);pPager.stfd=fd;
    pPager.stmtOpen = 0;
  }
  if( pPager.journalOpen ){
    $$(fd,pPager.jfd);sqlite3OsClose(fd); pPager.jfd=$(fd);
    pPager.journalOpen = 0;
    sqlite3OsDelete(pPager.zJournal);
    sqliteFree( pPager.aInJournal );
    pPager.aInJournal = 0;
    for(pPg=pPager.pAll; pPg; pPg=pPg.pNextAll){
      pPg.inJournal = 0;
      pPg.dirty = 0;
      pPg.needSync = 0;
//#ifdef SQLITE_CHECK_PAGES
//      pPg->pageHash = pager_pagehash(pPg);
//#endif
    }
    pPager.dirtyCache = 0;
    pPager.nRec = 0;
  }else{
    assert( pPager.aInJournal==0 );
    assert( pPager.dirtyCache==0 || pPager.useJournal==0 );
  }
  rc = sqlite3OsUnlock(pPager.fd, SHARED_LOCK);
  pPager.state = PAGER_SHARED;
  pPager.origDbSize = 0;
  pPager.setMaster = 0;
  pPager.needSync = 0;
  pPager.pFirstSynced = pPager.pFirst;
  return rc;
}

/*
** Compute and return a checksum for the page of data.
**
** This is not a real checksum.  It is really just the sum of the 
** random initial value and the page number.  We experimented with
** a checksum of the entire data, but that was found to be too slow.
**
** Note that the page number is stored at the beginning of data and
** the checksum is stored at the end.  This is important.  If journal
** corruption occurs due to a power failure, the most likely scenario
** is that one end or the other of the record will be changed.  It is
** much less likely that the two ends of the journal record will be
** correct and the middle be corrupt.  Thus, this "checksum" scheme,
** though fast and simple, catches the mostly likely kind of corruption.
**
** FIX ME:  Consider adding every 200th (or so) byte of the data to the
** checksum.  That way if a single page spans 3 or more disk sectors and
** only the middle sector is corrupt, we will still have a reasonable
** chance of failing the checksum and thus detecting the problem.
** static u32 pager_cksum(Pager *pPager, Pgno pgno, const u8 *aData)
*/
function pager_cksum(pPager, pgno, aData){
  var cksum = pPager.cksumInit;
  var i = pPager.pageSize-200;
  while( i>0 ){
    cksum += aData[i];
    i -= 200;
  }
  return cksum;
}


/*
** Read a single page from the journal file opened on file descriptor
** jfd.  Playback this one page.
**
** If useCksum==0 it means this journal does not use checksums.  Checksums
** are not used in statement journals because statement journals do not
** need to survive power failures.
** static int pager_playback_one_page(Pager *pPager, OsFile *jfd, int useCksum)
*/
function pager_playback_one_page(pPager, jfd, useCksum){
  var rc;
  var pPg;                   /* An existing page in the cache */
  var pgno=ref(0);                    /* The page number of a page in journal */
  var cksum=ref(0);                    /* Checksum used for sanity checking */
  var aData=Buffer(SQLITE_MAX_PAGE_SIZE);  /* Temp storage for a page */

  /* useCksum should be true for the main journal and false for
  ** statement journals.  Verify that this is always the case
  */
  assert( jfd == (useCksum ? pPager.jfd : pPager.stfd) );


  rc = read32bits(jfd, pgno);
  if( rc!=SQLITE_OK ) return rc;
  rc = sqlite3OsRead(jfd, aData, pPager.pageSize);
  if( rc!=SQLITE_OK ) return rc;
  pPager.journalOff += pPager.pageSize + 4;

  /* Sanity checking on the page.  This is more important that I originally
  ** thought.  If a power failure occurs while the journal is being written,
  ** it could cause invalid data to be written into the journal.  We need to
  ** detect this invalid data (with high probability) and ignore it.
  */
  if( $(pgno)==0 || $(pgno)==PAGER_MJ_PGNO(pPager) ){
    return SQLITE_DONE;
  }
  if( pgno>pPager.dbSize ){
    return SQLITE_OK;
  }
  if( useCksum ){
    rc = read32bits(jfd, cksum);
    if( rc ) return rc;
    pPager.journalOff += 4;
    if( pager_cksum(pPager, $(pgno), aData)!=cksum ){
      return SQLITE_DONE;
    }
  }

  assert( pPager.state==PAGER_RESERVED || pPager.state>=PAGER_EXCLUSIVE );

  /* If the pager is in RESERVED state, then there must be a copy of this
  ** page in the pager cache. In this case just update the pager cache,
  ** not the database file. The page is left marked dirty in this case.
  **
  ** If in EXCLUSIVE state, then we update the pager cache if it exists
  ** and the main file. The page is then marked not dirty.
  **
  ** Ticket #1171:  The statement journal might contain page content that is
  ** different from the page content at the start of the transaction.
  ** This occurs when a page is changed prior to the start of a statement
  ** then changed again within the statement.  When rolling back such a
  ** statement we must not write to the original database unless we know
  ** for certain that original page contents are in the main rollback
  ** journal.  Otherwise, if a full ROLLBACK occurs after the statement
  ** rollback the full ROLLBACK will not restore the page to its original
  ** content.  Two conditions must be met before writing to the database
  ** files. (1) the database must be locked.  (2) we know that the original
  ** page content is in the main journal either because the page is not in
  ** cache or else it is marked as needSync==0.
  */
  pPg = pager_lookup(pPager, $(pgno));
  assert( pPager.state>=PAGER_EXCLUSIVE || pPg!=0 );
  //TRACE3("PLAYBACK %d page %d\n", PAGERID(pPager), $(pgno));
  if( pPager.state>=PAGER_EXCLUSIVE && (pPg==0 || pPg.needSync==0) ){
    rc = sqlite3OsSeek(pPager.fd, ($(pgno)-1)*pPager.pageSize);
    if( rc==SQLITE_OK ){
      rc = sqlite3OsWrite(pPager.fd, aData, pPager.pageSize);
    }
    if( pPg ) pPg.dirty = 0;
  }
  if( pPg ){
    /* No page should ever be explicitly rolled back that is in use, except
    ** for page 1 which is held in use in order to keep the lock on the
    ** database active. However such a page may be rolled back as a result
    ** of an internal error resulting in an automatic call to
    ** sqlite3pager_rollback().
    */
    var pData;
    /* assert( pPg->nRef==0 || pPg->pgno==1 ); */
    pData = PGHDR_TO_DATA(pPg);
    memcpy(pData, aData, pPager.pageSize);
    if( pPager.xDestructor ){  /*** FIX ME:  Should this be xReinit? ***/
      pPager.xDestructor(pData, pPager.pageSize);
    }
//#ifdef SQLITE_CHECK_PAGES
//    pPg->pageHash = pager_pagehash(pPg);
//#endif
    CODEC(pPager, pData, pPg.pgno, 3);
  }
  return rc;
}


// ................

/*
** Create a new page cache and put a pointer to the page cache in *ppPager.
** The file to be cached need not exist.  The file is not locked until
** the first call to sqlite3pager_get() and is only held open until the
** last page is released using sqlite3pager_unref().
**
** If zFilename is NULL then a randomly-named temporary file is created
** and used as the file to be cached.  The file will be deleted
** automatically when it is closed.
**
** If zFilename is ":memory:" then all information is held in cache.
** It is never written to disk.  This can be used to implement an
** in-memory database.
** 
int sqlite3pager_open(Pager **ppPager, const char *zFilename,
                     int nExtra, int flags);
*/

sqlite3pager_open  = function(
  ppPager,              /* Return the Pager structure here */
  zFilename,            /* Name of the database file to open */
  nExtra,               /* Extra bytes append to each in-memory page */
  flags                 /* flags controlling this file */
){

}
