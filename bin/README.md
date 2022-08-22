# Software

This directory contains compiled ready-to-use shell programs and Web applications.

## JAM Shell

The JAM shell requires node.js (or jx or pl3):

```
node jamsh
```

It is recommended to build and install the *watchdog* module for node.js (otherwise agent processing is slower). A build script is following. Jx and pl3 have integrated the *watchdog* module.

## SEJAM2

SEJAM2 can be used directly in the Web browser (sejam2web.html) or with node webkit (at least version 0.13.4):

```
nw sejam2.nw
```

## Wex

Wex is the swiss army knife for Web application proecssed in a generic browser (but not node webkit). It is a local file, shell, and HTTP(S) proxy service and can be started by:

```
node wex
```

If wex is working on your computer, Web applications like the JAM laboratory or the browser version of SEJAM2 can access the local filesytem directly.

