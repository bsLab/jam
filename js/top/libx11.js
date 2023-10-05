/**
 **      ==============================
 **       O           O      O   OOOO
 **       O           O     O O  O   O
 **       O           O     O O  O   O
 **       OOOO   OOOO O     OOO  OOOO
 **       O   O       O    O   O O   O
 **       O   O       O    O   O O   O
 **       OOOO        OOOO O   O OOOO
 **      ==============================
 **      Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR(S).
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2017 BSSLAB
 **    $CREATED:     25-12-16 by sbosse.
 **    $RCS:         $Id: libx11.js,v 1.1 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $VERSION:     1.1.2
 **
 **    $INFO:
 **
 **  X11 API that can be embedded in any host application.
 **
 **
 **    $ENDOFINFO
 */

var Io = Require('com/io');
var Comp = Require('com/compat');
var X11 = Require('x11/core/x11');
var Windows = Require('x11/win/windows');


module.exports = {
  Comp:Comp,
  Io:Io,
  Windows:Windows,
  X11:X11
}
