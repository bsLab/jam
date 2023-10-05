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
 **    $INITIAL:     (C) 2006-2022 BSSLAB
 **    $CREATED:     3/30/15 by sbosse.
 **    $VERSION:     1.1.5
 **
 **    $INFO:
 **
 **  DOS: Encryption 48bit
 **
 **    $ENDOFINFO
 */
var util = Require('util');
var Io = Require('com/io');
var Comp = Require('com/compat');
var Array = Comp.array;
var assert = Comp.assert;


const des_HBS = 24;
const des_BS = des_HBS * 2;


/*
** Initial permutation,
*/

var des_IP = [
    23, 27, 34, 44, 37, 17, 12, 42,
    3, 32, 41, 29, 20,  2,  1, 10,
    0, 28, 40,  6,  7, 11, 16,  8,
    25, 30, 14, 26, 47, 38, 19, 43,
    18,  5, 35, 39, 36, 21,  4, 45,
    24, 22, 13, 33, 31,  9, 15, 46 ];

/*
** Final permutation, FP = IP^(-1)
*/

var des_FP = [
    16, 14, 13,  8, 38, 33, 19, 20,
    23, 45, 15, 21,  6, 42, 26, 46,
    22,  5, 32, 30, 12, 37, 41,  0,
    40, 24, 27,  1, 17, 11, 25, 44,
    9, 43,  2, 34, 36,  4, 29, 35,
    18, 10,  7, 31,  3, 39, 47, 28 ];

/*
** Permuted-choice 1 from the key bits
** to yield C and D.
** Note that bits 8,16... are left out:
    ** They are intended for a parity check.
*/

var des_PC1_C = [
    57,49,41,33,25,17, 9,
    1,58,50,42,34,26,18,
    10, 2,59,51,43,35,27,
    19,11, 3,60,52,44,36 ];

var des_PC1_D = [
    63,55,47,39,31,23,15,
    7,62,54,46,38,30,22,
    14, 6,61,53,45,37,29,
    21,13, 5,28,20,12, 4 ];


/*
** Sequence of shifts used for the key schedule.
*/

var des_shifts = [
    1,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1 ];



/*
** Permuted-choice 2, to pick out the bits from
** the CD array that generate the key schedule.
*/

var des_PC2_C = [
    14,17,11,24, 1, 5,
    3,28,15, 6,21,10,
    23,19,12, 4,26, 8,
    16, 7,27,20,13, 2 ];

var des_PC2_D = [
    41,52,31,37,47,55,
    30,40,51,45,33,48,
    44,49,39,56,34,53,
    46,42,50,36,29,32 ];

/*
** The C and D arrays used to calculate the key schedule.
*/


var des_C = Array.create(56,0);
// des_D = des_C[28]
var des_D_get = function (i) {return des_C[i+28]};
var des_D_set  =  function (i,sval) { des_C[i+28] = sval };

/*
** The key schedule.
** Generated from the key.
*/

var des_KS= Array.create_matrix(16,48,0);

var des_OWsetkey = function(key) {
    var ks = [];
    var t = 0;
    var i,j,k;
    /*
    ** First, generate C and D by permuting
    ** the key.  The low order bit of each
    ** 8-bit char is not used, so C and D are only 28
    ** bits apiece.
    */

    for(i = 0;i < 28;i++) {

        var index1 = des_PC1_C[i] - 1;
        var index2 = des_PC1_D[i] - 1;

        des_C[i] = key[index1];
        des_D_set(i,key[index2]);
    }

    /*
    ** To generate Ki, rotate C and D according
    ** to schedule and pick up a permutation
    ** using PC2.
    */


    for (i = 0 ;i< 16;i++) {

        ks = des_KS[i];

        // rotate
        for (k = 0; k < des_shifts[i]; k++) {
            t = des_C[0];

            for (j = 0; j < 27; j++) {
                des_C[j] = des_C[j + 1];
            }

            des_C[27] = t;
            t = des_D_get(0);

            for (j = 0; j < 27; j++) {
                des_D_set(j, des_D_get(j + 1));
            }
            des_D_set(27, t);
        }

        /*
         ** get Ki. Note C and D are concatenated.
         */

        for (j = 0; j < 24; j++) {
            ks[j] = des_C[des_PC2_C[j] - 1];
            ks[j + 24] = des_D_get(des_PC2_D[j] - 28 - 1);
        }

    }
    return { C:des_C, KS:des_KS }
};


/*
** The E bit-selection table.
*/

var des_E = [
    22, 15, 12,  3,  8,  2, 23, 16,
    14, 13,  9, 10,  0,  1, 21, 19,
    18,  6, 11,  7, 17,  4, 20,  5,
    5, 17, 11, 13, 12, 14,  8,  7,
    19, 22, 18,  9,  3,  4,  1,  6,
    16,  2, 20, 15, 10, 23,  0, 21 ];


/*
** The 8 selection functions.
** For some reason, they give a 0-origin
** index, unlike everything else.
*/

var des_S = [
    [ 14, 4,13, 1, 2,15,11, 8, 3,10, 6,12, 5, 9, 0, 7,
    0,15, 7, 4,14, 2,13, 1,10, 6,12,11, 9, 5, 3, 8,
    4, 1,14, 8,13, 6, 2,11,15,12, 9, 7, 3,10, 5, 0,
    15,12, 8, 2, 4, 9, 1, 7, 5,11, 3,14,10, 0, 6,13 ],

    [ 15, 1, 8,14, 6,11, 3, 4, 9, 7, 2,13,12, 0, 5,10,
    3,13, 4, 7,15, 2, 8,14,12, 0, 1,10, 6, 9,11, 5,
    0,14, 7,11,10, 4,13, 1, 5, 8,12, 6, 9, 3, 2,15,
    13, 8,10, 1, 3,15, 4, 2,11, 6, 7,12, 0, 5,14, 9 ],

    [ 10, 0, 9,14, 6, 3,15, 5, 1,13,12, 7,11, 4, 2, 8,
    13, 7, 0, 9, 3, 4, 6,10, 2, 8, 5,14,12,11,15, 1,
    13, 6, 4, 9, 8,15, 3, 0,11, 1, 2,12, 5,10,14, 7,
    1,10,13, 0, 6, 9, 8, 7, 4,15,14, 3,11, 5, 2,12 ],

    [ 7,13,14, 3, 0, 6, 9,10, 1, 2, 8, 5,11,12, 4,15,
    13, 8,11, 5, 6,15, 0, 3, 4, 7, 2,12, 1,10,14, 9,
    10, 6, 9, 0,12,11, 7,13,15, 1, 3,14, 5, 2, 8, 4,
    3,15, 0, 6,10, 1,13, 8, 9, 4, 5,11,12, 7, 2,14 ],

    [ 2,12, 4, 1, 7,10,11, 6, 8, 5, 3,15,13, 0,14, 9,
    14,11, 2,12, 4, 7,13, 1, 5, 0,15,10, 3, 9, 8, 6,
    4, 2, 1,11,10,13, 7, 8,15, 9,12, 5, 6, 3, 0,14,
    11, 8,12, 7, 1,14, 2,13, 6,15, 0, 9,10, 4, 5, 3 ],

    [ 12, 1,10,15, 9, 2, 6, 8, 0,13, 3, 4,14, 7, 5,11,
    10,15, 4, 2, 7,12, 9, 5, 6, 1,13,14, 0,11, 3, 8,
    9,14,15, 5, 2, 8,12, 3, 7, 0, 4,10, 1,13,11, 6,
    4, 3, 2,12, 9, 5,15,10,11,14, 1, 7, 6, 0, 8,13 ],

    [ 4,11, 2,14,15, 0, 8,13, 3,12, 9, 7, 5,10, 6, 1,
    13, 0,11, 7, 4, 9, 1,10,14, 3, 5,12, 2,15, 8, 6,
    1, 4,11,13,12, 3, 7,14,10,15, 6, 8, 0, 5, 9, 2,
    6,11,13, 8, 1, 4,10, 7, 9, 5, 0,15,14, 2, 3,12 ],

    [ 13, 2, 8, 4, 6,15,11, 1,10, 9, 3,14, 5, 0,12, 7,
    1,15,13, 8,10, 3, 7, 4,12, 5, 6,11, 0,14, 9, 2,
    7,11, 4, 1, 9,12,14, 2, 0, 6,10,13,15, 3, 5, 8,
    2, 1,14, 7, 4,10, 8,13,15,12, 9, 0, 3, 5, 6,11 ]
    ];


/*
** P is a permutation on the selected combination
** of the current L and key.
*/

var des_P = [
    3, 13,  9, 12,  8, 20, 21,  7,
    5, 23, 16,  1, 14, 18,  4, 15,
    22, 10,  2,  0, 11, 19, 17,  6 ];

var des_L = Array.create(des_BS,0);
var des_R_get = function (i) { return des_L[(i+des_HBS)]};
var des_R_set = function (i,sval) { des_L[i+des_HBS]= sval};
var des_tempL = Array.create(des_HBS,0);
var des_f = Array.create (32,0);

/*
** Warning!!
**
** f[] used to be HBS for some years.
** 21/6/1990 cbo and sater discovered that inside the loop where f is computed
** indices are used from 0 to 31. These overlapped the preS array which is
** declared hereafter on all compilers upto that point, but only those
** values that were not used anymore. But the values of f are only used
** upto HBS. Makes you wonder about the one-way property.
** Then came ACK, and reversed the order of the arrays in the image.
**
** As a short term solution f[] was increased to 32, but in the long run
** someone should have a good look at our "oneway" function
*/

/*
** The combination of the key and the input, before selection.
*/
var des_preS = Array.create (48,0);

/*
** The payoff: encrypt a block. (Now 48 bytes, 1 bit/byte)
*/

var des_OWcrypt48 = function(block) {
    var ks = [];
    var t1 = 0;
    var t2 = 0;
    var i, j, k;
    /*
     ** First, permute the bits in the input
     */

    for (j = 0; j <= (des_BS - 1); j++) {
        des_L[j] = block[des_IP[j]];
    }
    /*
     ** Perform an encryption operation 16 times.
     */

    for (i = 0; i <= 15; i++) {
        ks = des_KS[i];

        /*
         ** Save the R array,
         ** which will be the new L.
         */

        for (j = 0; j < (des_HBS - 1); j++) {
            des_tempL[j] = des_R_get(j);
        }
        /*
         ** Expand R to 48 bits using the E selector;
         ** exclusive-or with the current key bits.
         */

        for (j = 0; j <= 47; j++) {
            des_preS[j] = (des_R_get(des_E[j])) ^ ks[j];
        }

        /*
         ** The pre-select bits are now considered
         ** in 8 groups of 6 bits each.
         ** The 8 selection functions map these
         ** 6-bit quantities into 4-bit quantities
         ** and the results permuted
         ** to make an f(R, K).
         ** The indexing into the selection functions
         ** is peculiar; it could be simplified by
         ** rewriting the tables.
         */

        t1 = 0;
        t2 = 0;

        for (j = 0; j <= 7; j++) {
            /*
            C: for (j=0,t1=0,t2=0; j<8; j++,t1+=6,t2+=4) {
			          k = S[j][(preS[t1+0]<<5)+
				          (preS[t1+1]<<3)+
				          (preS[t1+2]<<2)+
				          (preS[t1+3]<<1)+
				          (preS[t1+4]<<0)+
				          (preS[t1+5]<<4)];
			          f[t2+0] = (k>>3)&01;
			          f[t2+1] = (k>>2)&01;
			          f[t2+2] = (k>>1)&01;
			          f[t2+3] = (k>>0)&01;	
		        }            
            */
            var sind2 =
                ((des_preS[t1 + 0] << 5) & 0xff) +
                ((des_preS[t1 + 1] << 3) & 0xff) +
                ((des_preS[t1 + 2] << 2) & 0xff) +
                ((des_preS[t1 + 3] << 1) & 0xff) +
                ((des_preS[t1 + 4] << 0) & 0xff) +
                ((des_preS[t1 + 5] << 4) & 0xff);

            k = des_S[j][sind2];

            des_f[t2 + 0] = (k >> 3) & 0x1;
            des_f[t2 + 1] = (k >> 2) & 0x1;
            des_f[t2 + 2] = (k >> 1) & 0x1;
            des_f[t2 + 3] = (k >> 0) & 0x1;    // 3 .. 31 !!!

            t1 = t1 + 6;
            t2 = t2 + 4;
        }

        /*
         ** The new R is L ^ f(R, K).
         ** The f here has to be permuted first, though.
         */

        for (j = 0; j < des_HBS; j++) {
            des_R_set(j, (des_L[j] ^ des_f[des_P[j]]));
        }

        /*
         ** Finally, the new L (the original R)
         ** is copied back.
         */

        for (j = 0; j < des_HBS; j++) {
            des_L[j] = des_tempL[j];
        }

    }


    /*
     ** The output L and R are reversed.
     */

    for (j = 0; j < des_HBS; j++) {
        t1 = des_L[j];
        des_L[j] = des_R_get(j);
        des_R_set(j, t1);
    }

    /*
     ** The final output
     ** gets the inverse permutation of the very original.
     */

    for (j = 0; j < des_BS; j++) {
        block[j] = des_L[des_FP[j]];
    }
    return block;
};

module.exports = {
    des_OWsetkey:des_OWsetkey,
    des_OWcrypt48:des_OWcrypt48
};
