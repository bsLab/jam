# Distribution

This directory contains compiled ready-to-use shell programs and Web applications.

## JAM Shell

The JAM shell requires node.js (or jx or pl3):

```
node jamsh
```

It is recommended to build and install the *watchdog* module for node.js (otherwise agent processing is slower). A build script is following. Jx and pl3 have integrated the *watchdog* module.

## SEJAM2

SEJAM2 can be used directly in the Web browser (sejam2.html - actually broken, fixed soon) or with node webkit (at least version 0.13.4):

```
nw sejam2.nw
```
