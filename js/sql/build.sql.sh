#!/bin/bash

EMCC_FLAGS='-s ENVIRONMENT=node -O3 -s NODERAWFS=1 -s LEGACY_VM_SUPPORT=1 --memory-init-file 0 -s RESERVED_FUNCTION_POINTERS=1 -s WASM=0'

echo emcc  $EMCC_FLAGS \
  $SQLITE_FLAGS \
  -s "EXPORTED_FUNCTIONS=['_sqlite3_open', '_sqlite3_exec', '_sqlite3_close']" \
  -s "EXTRA_EXPORTED_RUNTIME_METHODS=['addFunction', 'ccall', 'getValue' ,'UTF8ToString', 'cwrap']" \
  -o sqlite3.js \
  sqlite3.c

emcc  $EMCC_FLAGS \
  $SQLITE_FLAGS \
  -s "EXPORTED_FUNCTIONS=['_sqlite3_open', '_sqlite3_exec', '_sqlite3_close']" \
  -s "EXTRA_EXPORTED_RUNTIME_METHODS=['addFunction', 'ccall', 'getValue' ,'UTF8ToString', 'cwrap']" \
  -o sqlite3.js \
  sqlite3.c
