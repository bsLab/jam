/**
 **      ==============================
 **       OOOO        O      O   OOOO
 **       O   O       O     O O  O   O
 **       O   O       O     O O  O   O
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
 **    $INITIAL:     (C) 2006-2020 bLAB
 **    $CREATED:     20-10-16 by sbosse.
 **    $VERSION:     1.2.1
 **
 **    $INFO:
 **
 **  GEO IP Database Services and http/https Server
 **  Database source: GeoLiteCit
 **  Compatibility: ip-api.com/json 
 **  Can be used as a proxy to ip-api.com to overcome ad-blockers!
 **
 **  Look-up returns:
 ** {
 **   country: string, // country
 **   countryCode: string, // countryCode
 **   region: string, // region
 **   city: string, // city
 **   zip: string, // postal code
 **   lat: string, // latitude
 **   lon: string  // longitude
 **  }; 
 **
 **    $ENDOFINFO
 */
var fs = require("fs");
var sat = Require('dos/ext/satelize');

var out = function (msg) { console.log('[GEOIP] '+msg) };

var geoip = module.exports = {
    dir : process.cwd()||__dirname,
    ipblocks : [],
    locations : [],
	midpoints : [],
	numblocks : 0,
    ready : 0,
    verbose : 0,
    config : function (a,v) { geoip[a]=v }, 

    // Cold start, load and compile CSV DB
    init : function (cb) {
      out ('Loading '+ geoip.dir + "/GeoLiteCity-Blocks.csv ..");
      var block = fs.createReadStream(geoip.dir + "/GeoLiteCity-Blocks.csv");
      out ('Loading '+ geoip.dir + "/GeoLiteCity-Location.csv ..");
      var location = fs.createReadStream(geoip.dir + "/GeoLiteCity-Location.csv");
      var buffer1 = "",buffer2 = "";

      block.addListener("data", function(data) {
          buffer1 += data.toString().replace(/"/g, "");
      });

      block.addListener("end", function() {
          var entries = buffer1.split("\n");
          out ('Compiling GeoLiteCity-Blocks ..');
          for(var i=0; i<entries.length; i++) {
              if (i<2) continue;        
              var entry = entries[i].split(",");
              if (parseInt(entry[0])) geoip.ipblocks.push({
                a: parseInt(entry[0]), // ip start
                b: parseInt(entry[1]), // ip end
                i: parseInt(entry[2])  // location id
              });
          }

          geoip.ipblocks.sort(function(a, b) {
              return a.a - b.a;
          });
          geoip.numblocks = geoip.ipblocks.length;
          geoip.midpoints=[];
          var n = Math.floor(geoip.numblocks / 2);
          while(n >= 1) {
              n = Math.floor(n / 1.5);
              geoip.midpoints.push(n);
          }

		  geoip.ready++;
          if (cb && geoip.ready==2) cb();
      });

      location.addListener("data", function(data) {
          buffer2 += data.toString().replace(/"/g, "");
      });

      location.addListener("end", function() {

          var entries = buffer2.split("\n");
          var locid=0;
          out ('Compiling GeoLiteCity-Location ..');

          for(var i=0; i<entries.length; i++) {
              if (i<2) continue;        
              var entry = entries[i].split(",");
              locid=parseInt(entry[0]);
              geoip.locations[locid] = {
                cn: entry[1], // country
                re: entry[2], // region
                ci: entry[3], // city
                pc: entry[4], // postal code
                la: entry[5], // latitude
                lo: entry[6]  // longitude
              };
          }

		  geoip.ready++;
          if (cb && geoip.ready==2) cb();
      });    
    },

    // Load and parse JSON DB
    load : function (cb) {
      // Read DB
      out ('Loading '+geoip.dir + "/GeoLiteCity-Blocks.json ..");
      var block = fs.createReadStream(geoip.dir + "/GeoLiteCity-Blocks.json");
      out ('Loading '+geoip.dir + "/GeoLiteCity-Location.json ..");
      var location = fs.createReadStream(geoip.dir + "/GeoLiteCity-Location.json");
      var buffer1 = "",buffer2 = "";
      block.on('error', function (e) { out(e); cb(e); });
      location.on('error', function (e) { out(e); cb(e); });
      
      block.addListener("data", function(data) {
          buffer1 += data.toString();
      });

      block.addListener("end", function() {
          out ('Parsing GeoLiteCity-Blocks ..');
          geoip.ipblocks = JSON.parse(buffer1);
          out ('Parsing GeoLiteCity-Blocks done.');
          geoip.ipblocks.sort(function(a, b) {
              return a.a - b.a;
          });
          geoip.numblocks = geoip.ipblocks.length;
          var n = Math.floor(geoip.numblocks / 2);
          geoip.midpoints=[];
          while(n >= 1) {
              n = Math.floor(n / 1.5);
              geoip.midpoints.push(n);
          }
		  geoip.ready++;
          if (cb && geoip.ready==2) cb();
      });

      location.addListener("data", function(data) {
          buffer2 += data.toString();
      });

      location.addListener("end", function() {
          out ('Parsing GeoLiteCity-Location ..');
          geoip.locations = JSON.parse(buffer2);
          out ('Parsing GeoLiteCity-Location done.');

		  geoip.ready++;
          if (cb && geoip.ready==2) cb();
      });
      
    },

    // Search a matching GEO entry
    lookup: function(ip) {

        if(geoip.ready<2) {
            return { error: "GeoIP not ready" };
        }

        var ipl = iplong(ip);

        if(ipl == 0) {
            return { error: "Invalid ip address " + ip + " -> " + ipl + " as integer" };
        }

        var found = find(ipl);
        if (found) {
          var loc = geoip.locations[found.i]; 
          return {
            status:"success",
            country: getCountryName(loc.cn),
            countryCode:loc.cn,
            city:loc.ci,
            region:loc.re,
            zip:loc.pc,
            lon:loc.lo,
            lat:loc.la,
          }
        } else return none;
    },
    
    // ip-api.com relay using satelize module!
    proxy : function (options) {
      options=options||{http:9999};
      var http = require('http');
      var https;
      try { https = require('https') } catch (e) { }
      if (options.http) {
        var httpSrv = http.createServer(function (request,response) {
          var url=request.url,body,header,sep,query,now,
              remote=request.connection.remoteAddress;
          if (request.url.length) 
            query=parseQueryString(request.remote||request.url);
          else 
            query={}
          if (url.match(/\/json\/([0-9\.]+)/)) query.ip=url.match(/\/json\/([0-9\.]+)/)[1];
          if (geoip.verbose>0) print(url,query,remote);
          switch (request.method) {
            case 'GET':
              sat.satelize({ip:query.ip||remote},function (err,info) {
                   if (err) {
                     return reply(response,JSON.stringify({error:err}))
                   } else {
                     if (request.headers && request.headers.host) info.proxy=request.headers.host;
                     return reply(response,JSON.stringify(info))                       
                   }
              })

              break;
          }
        });
        httpSrv.on("connection", function (socket) {
            // socket.setNoDelay(true);
        });

        httpSrv.on("error", function (err) {
          out(err)
        });

        httpSrv.listen(options.http,function (err) {
          out('HTTP server started on port '+options.http);
        });
      };
      if (options.https && https && options.pem) {
          // requires options.pem={key,cert} 
        var httpsSrv = https.createServer(options.pem,function (request,response) {
          var url=request.url,body,header,sep,query,now,
              remote=request.connection.remoteAddress;
          if (request.url.length) 
            query=parseQueryString(request.remote||request.url);
          else 
            query={}
          if (url.match(/\/json\/([0-9\.]+)/)) query.ip=url.match(/\/json\/([0-9\.]+)/)[1];
          if (geoip.verbose>0) print(url,query,remote);
          switch (request.method) {
            case 'GET':
              sat.satelize({ip:query.ip||remote},function (err,info) {
                   if (err) {
                     return reply(response,JSON.stringify({error:err}))
                   } else {
                     if (request.headers && request.headers.host) info.proxy=request.headers.host;
                     return reply(response,JSON.stringify(info))                       
                   }
              })

              break;
          }
        });
        httpsSrv.on("connection", function (socket) {
            // socket.setNoDelay(true);
        });

        httpsSrv.on("error", function (err) {
          out(err)
        });

        httpsSrv.listen(options.https,function (err) {
          out('HTTPS server started on port '+options.https);
        });
      };
    },
    
    // Start an ip-api.com compatible web server API
    server : function (options) {
      options=options||{http:{address:'localhost',port:9999}};
      var http = require('http');
      var https;
      try { https = require('https') } catch (e) { }
      geoip.load(function (err) {
        if (err) return;
        if (options.http) {
          var httpSrv = http.createServer(function (request,response) {
            var url=request.url,body,header,sep,query,now,
                remote=request.connection.remoteAddress;
            if (request.url.length) 
              query=parseQueryString(request.remote||request.url);
            else 
              query={}
            if (url.match(/\/json\/([0-9\.]+)/)) query.ip=url.match(/\/json\/([0-9\.]+)/)[1];
            if (geoip.verbose>0) print(url,query,remote);
            switch (request.method) {
              case 'GET':
                reply(response,JSON.stringify(geoip.lookup(query.ip||remote)))
                break;
            }
          })

          httpSrv.on("connection", function (socket) {
              // socket.setNoDelay(true);
          });

          httpSrv.on("error", function (err) {
            out(err)
          });

          httpSrv.listen(options.http.port,function (err) {
            out('HTTP server started on port '+options.http.port);
          });
        }
        if (options.https && https && options.pem) {
          // requires options.pem={key,cert} 
          var httpsSrv = https.createServer(options.pem,function (request,response) {
            var url=request.url,body,header,sep,query,now,
                remote=request.connection.remoteAddress;
            if (request.url.length) 
              query=parseQueryString(request.remote||request.url);
            else 
              query={}
            if (url.match(/\/json\/([0-9\.]+)/)) query.ip=url.match(/\/json\/([0-9\.]+)/)[1];
            if (geoip.verbose>0) print(url,query,remote);
            switch (request.method) {
              case 'GET':
                reply(response,JSON.stringify(geoip.lookup(query.ip||remote)))
                break;
            }
          })

          httpsSrv.on("connection", function (socket) {
              // socket.setNoDelay(true);
          });

          httpsSrv.on("error", function (err) {
            out(err)
          });

          httpsSrv.listen(options.http.port,function (err) {
            out('HTTPS server started on port '+options.http.port);
          });
        }
      });
    },

    // Save the DB in JSON format
    save : function () {
      out ('Saving '+geoip.dir + "/GeoLiteCity-Blocks.json ..");
      var jsblocks = JSON.stringify(geoip.ipblocks);
      fs.writeFileSync(geoip.dir + "/GeoLiteCity-Blocks.json", jsblocks, 'utf8');
      out ('Saving '+geoip.dir + "/GeoLiteCity-Location.json ..");
      var jslocations = JSON.stringify(geoip.locations);
      fs.writeFileSync(geoip.dir + "/GeoLiteCity-Location.json", jslocations, 'utf8');
    },
    
};

function iplong(ip) {

    if(!ip) {
        return 0;
    }

    ip = ip.toString();

    if(isNaN(ip) && ip.indexOf(".") == -1) {
        return 0;
    }

    if(ip.indexOf(".") == -1) {

        try {
            ip = parseFloat(ip);
            return ip < 0 || ip > 4294967296 ? 0 : ip;
        }
        catch(s) {
        }
    }

    var parts = ip.split(".");

    if(parts.length != 4) {
        return 0;
    }

    var ipl = 0;

    for(var i=0; i<4; i++) {
        parts[i] = parseInt(parts[i], 10);

        if(parts[i] < 0 || parts[i] > 255) {
            return 0;
        }

        ipl += parts[3-i] * (Math.pow(256, i));
    }

    return ipl > 4294967296 ? 0 : ipl;
}

/**
 * A qcuick little binary search
 * @param ip the ip we're looking for
 * @return {*}
 */
function find(ipl) {

    var mpi = 0;
    var n = geoip.midpoints[0];
    var step;
    var current;
    var next;
    var prev;
    var nn;
    var pn;
    while(true) {

        step = geoip.midpoints[mpi];
        mpi++;
        current = geoip.ipblocks[n];
        nn = n + 1;
        pn = n - 1;

        next = nn < geoip.numblocks ? geoip.ipblocks[nn] : null;
        prev = pn > -1 ? geoip.ipblocks[pn] : null;
        
		// take another step?
        if(step > 0) {
            if(!next || next.a < ipl) {
                n += step;
            } else {
                n -= step;
            }

            continue;
        }

        // we're either current, next or previous depending on which is closest to ipl
        var cd = Math.abs(ipl - current.a);
        var nd = next && next.a < ipl ? ipl - next.a : 1000000000;
        var pd = prev && prev.a < ipl ? ipl - prev.a : 1000000000;


        // current wins
        if(cd < nd && cd < pd) {
            return current;
        }

         // next wins
        if(nd < cd && nd < pd) {
            return next;

        }

        // prev wins
        return prev;
    }
    return none;
}

// https://gist.github.com/maephisto

var isoCountries = {
    'AF' : 'Afghanistan',
    'AX' : 'Aland Islands',
    'AL' : 'Albania',
    'DZ' : 'Algeria',
    'AS' : 'American Samoa',
    'AD' : 'Andorra',
    'AO' : 'Angola',
    'AI' : 'Anguilla',
    'AQ' : 'Antarctica',
    'AG' : 'Antigua And Barbuda',
    'AR' : 'Argentina',
    'AM' : 'Armenia',
    'AW' : 'Aruba',
    'AU' : 'Australia',
    'AT' : 'Austria',
    'AZ' : 'Azerbaijan',
    'BS' : 'Bahamas',
    'BH' : 'Bahrain',
    'BD' : 'Bangladesh',
    'BB' : 'Barbados',
    'BY' : 'Belarus',
    'BE' : 'Belgium',
    'BZ' : 'Belize',
    'BJ' : 'Benin',
    'BM' : 'Bermuda',
    'BT' : 'Bhutan',
    'BO' : 'Bolivia',
    'BA' : 'Bosnia And Herzegovina',
    'BW' : 'Botswana',
    'BV' : 'Bouvet Island',
    'BR' : 'Brazil',
    'IO' : 'British Indian Ocean Territory',
    'BN' : 'Brunei Darussalam',
    'BG' : 'Bulgaria',
    'BF' : 'Burkina Faso',
    'BI' : 'Burundi',
    'KH' : 'Cambodia',
    'CM' : 'Cameroon',
    'CA' : 'Canada',
    'CV' : 'Cape Verde',
    'KY' : 'Cayman Islands',
    'CF' : 'Central African Republic',
    'TD' : 'Chad',
    'CL' : 'Chile',
    'CN' : 'China',
    'CX' : 'Christmas Island',
    'CC' : 'Cocos (Keeling) Islands',
    'CO' : 'Colombia',
    'KM' : 'Comoros',
    'CG' : 'Congo',
    'CD' : 'Congo, Democratic Republic',
    'CK' : 'Cook Islands',
    'CR' : 'Costa Rica',
    'CI' : 'Cote D\'Ivoire',
    'HR' : 'Croatia',
    'CU' : 'Cuba',
    'CY' : 'Cyprus',
    'CZ' : 'Czech Republic',
    'DK' : 'Denmark',
    'DJ' : 'Djibouti',
    'DM' : 'Dominica',
    'DO' : 'Dominican Republic',
    'EC' : 'Ecuador',
    'EG' : 'Egypt',
    'SV' : 'El Salvador',
    'GQ' : 'Equatorial Guinea',
    'ER' : 'Eritrea',
    'EE' : 'Estonia',
    'ET' : 'Ethiopia',
    'FK' : 'Falkland Islands (Malvinas)',
    'FO' : 'Faroe Islands',
    'FJ' : 'Fiji',
    'FI' : 'Finland',
    'FR' : 'France',
    'GF' : 'French Guiana',
    'PF' : 'French Polynesia',
    'TF' : 'French Southern Territories',
    'GA' : 'Gabon',
    'GM' : 'Gambia',
    'GE' : 'Georgia',
    'DE' : 'Germany',
    'GH' : 'Ghana',
    'GI' : 'Gibraltar',
    'GR' : 'Greece',
    'GL' : 'Greenland',
    'GD' : 'Grenada',
    'GP' : 'Guadeloupe',
    'GU' : 'Guam',
    'GT' : 'Guatemala',
    'GG' : 'Guernsey',
    'GN' : 'Guinea',
    'GW' : 'Guinea-Bissau',
    'GY' : 'Guyana',
    'HT' : 'Haiti',
    'HM' : 'Heard Island & Mcdonald Islands',
    'VA' : 'Holy See (Vatican City State)',
    'HN' : 'Honduras',
    'HK' : 'Hong Kong',
    'HU' : 'Hungary',
    'IS' : 'Iceland',
    'IN' : 'India',
    'ID' : 'Indonesia',
    'IR' : 'Iran, Islamic Republic Of',
    'IQ' : 'Iraq',
    'IE' : 'Ireland',
    'IM' : 'Isle Of Man',
    'IL' : 'Israel',
    'IT' : 'Italy',
    'JM' : 'Jamaica',
    'JP' : 'Japan',
    'JE' : 'Jersey',
    'JO' : 'Jordan',
    'KZ' : 'Kazakhstan',
    'KE' : 'Kenya',
    'KI' : 'Kiribati',
    'KR' : 'Korea',
    'KW' : 'Kuwait',
    'KG' : 'Kyrgyzstan',
    'LA' : 'Lao People\'s Democratic Republic',
    'LV' : 'Latvia',
    'LB' : 'Lebanon',
    'LS' : 'Lesotho',
    'LR' : 'Liberia',
    'LY' : 'Libyan Arab Jamahiriya',
    'LI' : 'Liechtenstein',
    'LT' : 'Lithuania',
    'LU' : 'Luxembourg',
    'MO' : 'Macao',
    'MK' : 'Macedonia',
    'MG' : 'Madagascar',
    'MW' : 'Malawi',
    'MY' : 'Malaysia',
    'MV' : 'Maldives',
    'ML' : 'Mali',
    'MT' : 'Malta',
    'MH' : 'Marshall Islands',
    'MQ' : 'Martinique',
    'MR' : 'Mauritania',
    'MU' : 'Mauritius',
    'YT' : 'Mayotte',
    'MX' : 'Mexico',
    'FM' : 'Micronesia, Federated States Of',
    'MD' : 'Moldova',
    'MC' : 'Monaco',
    'MN' : 'Mongolia',
    'ME' : 'Montenegro',
    'MS' : 'Montserrat',
    'MA' : 'Morocco',
    'MZ' : 'Mozambique',
    'MM' : 'Myanmar',
    'NA' : 'Namibia',
    'NR' : 'Nauru',
    'NP' : 'Nepal',
    'NL' : 'Netherlands',
    'AN' : 'Netherlands Antilles',
    'NC' : 'New Caledonia',
    'NZ' : 'New Zealand',
    'NI' : 'Nicaragua',
    'NE' : 'Niger',
    'NG' : 'Nigeria',
    'NU' : 'Niue',
    'NF' : 'Norfolk Island',
    'MP' : 'Northern Mariana Islands',
    'NO' : 'Norway',
    'OM' : 'Oman',
    'PK' : 'Pakistan',
    'PW' : 'Palau',
    'PS' : 'Palestinian Territory, Occupied',
    'PA' : 'Panama',
    'PG' : 'Papua New Guinea',
    'PY' : 'Paraguay',
    'PE' : 'Peru',
    'PH' : 'Philippines',
    'PN' : 'Pitcairn',
    'PL' : 'Poland',
    'PT' : 'Portugal',
    'PR' : 'Puerto Rico',
    'QA' : 'Qatar',
    'RE' : 'Reunion',
    'RO' : 'Romania',
    'RU' : 'Russian Federation',
    'RW' : 'Rwanda',
    'BL' : 'Saint Barthelemy',
    'SH' : 'Saint Helena',
    'KN' : 'Saint Kitts And Nevis',
    'LC' : 'Saint Lucia',
    'MF' : 'Saint Martin',
    'PM' : 'Saint Pierre And Miquelon',
    'VC' : 'Saint Vincent And Grenadines',
    'WS' : 'Samoa',
    'SM' : 'San Marino',
    'ST' : 'Sao Tome And Principe',
    'SA' : 'Saudi Arabia',
    'SN' : 'Senegal',
    'RS' : 'Serbia',
    'SC' : 'Seychelles',
    'SL' : 'Sierra Leone',
    'SG' : 'Singapore',
    'SK' : 'Slovakia',
    'SI' : 'Slovenia',
    'SB' : 'Solomon Islands',
    'SO' : 'Somalia',
    'ZA' : 'South Africa',
    'GS' : 'South Georgia And Sandwich Isl.',
    'ES' : 'Spain',
    'LK' : 'Sri Lanka',
    'SD' : 'Sudan',
    'SR' : 'Suriname',
    'SJ' : 'Svalbard And Jan Mayen',
    'SZ' : 'Swaziland',
    'SE' : 'Sweden',
    'CH' : 'Switzerland',
    'SY' : 'Syrian Arab Republic',
    'TW' : 'Taiwan',
    'TJ' : 'Tajikistan',
    'TZ' : 'Tanzania',
    'TH' : 'Thailand',
    'TL' : 'Timor-Leste',
    'TG' : 'Togo',
    'TK' : 'Tokelau',
    'TO' : 'Tonga',
    'TT' : 'Trinidad And Tobago',
    'TN' : 'Tunisia',
    'TR' : 'Turkey',
    'TM' : 'Turkmenistan',
    'TC' : 'Turks And Caicos Islands',
    'TV' : 'Tuvalu',
    'UG' : 'Uganda',
    'UA' : 'Ukraine',
    'AE' : 'United Arab Emirates',
    'GB' : 'United Kingdom',
    'US' : 'United States',
    'UM' : 'United States Outlying Islands',
    'UY' : 'Uruguay',
    'UZ' : 'Uzbekistan',
    'VU' : 'Vanuatu',
    'VE' : 'Venezuela',
    'VN' : 'Viet Nam',
    'VG' : 'Virgin Islands, British',
    'VI' : 'Virgin Islands, U.S.',
    'WF' : 'Wallis And Futuna',
    'EH' : 'Western Sahara',
    'YE' : 'Yemen',
    'ZM' : 'Zambia',
    'ZW' : 'Zimbabwe'
};

function getCountryName (countryCode) {
    if (isoCountries.hasOwnProperty(countryCode)) {
        return isoCountries[countryCode];
    } else {
        return countryCode;
    }
}
/*
** Parse query string '?attr=val&attr=val... and return parameter record
*/
function parseQueryString( url ) {
    var queryString = url.substring( url.indexOf('?') + 1 );
    if (queryString == url) return [];
    var params = {}, queries, temp, i, l;
    // Split into key/value pairs
    queries = queryString.split("&");
    // Convert the array of strings into an object
    for ( i = 0, l = queries.length; i < l; i++ ) {
        temp = queries[i].split('=');
        if (temp[1]==undefined) temp[1]='true';
        params[temp[0]] = temp[1].replace('%20',' ');
    }
    return params;
}

function reply(response,body,mimetype) {
    header={'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': mimetype||'text/plain'};

   response.writeHead(200,header);
   response.write(body);
   response.end();
}
