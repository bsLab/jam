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
 **    $INITIAL:     (C) 2006-2020 bLAB
 **    $CREATED:     Stefan Bosse
 **    $VERSION:     1.1.3
 **
 **    $INFO:
 **
 * ================================
 *  Browser HTTP Request (Simplified version)
 * ================================
 *
 **
 **    $ENDOFINFO
 */

var XHR = XMLHttpRequest
if (!XHR) throw new Error('missing XMLHttpRequest')
else console.log('HTTP Browser Module Ver. 1.1.3 initialized.');

var DEFAULT_TIMEOUT = 2000;

/** request
 *  typeof @options = { url?:string, host: string, port:number, path:string, method:"GET"|"PUT", body?:string, headers:{} } 
 *  typeof @callback = function (err, xhr, body)
 */

function request(options, callback) {
  try {
    var xhr = new XHR(),
        err,
        url = options.url  || options.uri || ((options.proto?options.proto:'http')+'://'+options.host+':'+(options.port?options.port:80)+'/'+options.path),
        is_cors = is_crossDomain(url),
        supports_cors = ('withCredentials' in xhr)

    if(is_cors && !supports_cors) {
      err = new Error('Browser does not support cross-origin request: ' + options.uri)
      err.cors = 'unsupported'
      return callback(err, xhr)
    }
    options.headers = options.headers || {};
    options.timeout = options.timeout || DEFAULT_TIMEOUT;
    options.headers = options.headers || {};
    options.body    = options.body || null;
    if(is_cors) xhr.withCredentials = !! options.withCredentials;
    xhr.timeout = options.timeout;

    xhr.onopen = function () {
      for (var key in options.headers)
        xhr.setRequestHeader(key, options.headers[key])      
    }

    xhr.onload = function () {
     if(xhr.status === 0) {
        err = new Error('EREQUEST')
        callback(err, xhr)
     } 
     else callback(null,xhr,xhr.responseText)   
    }

    xhr.ontimeout = function () {
      // XMLHttpRequest timed out. Do something here.
      err = new Error('ETIMEOUT')
      err.duration = options.timeout
      callback(err,xhr, null)
    };

    xhr.onrror = function () {
      // XMLHttpRequest failed. Do something here.
      err = new Error('ESERVER')
      callback(err,xhr, null)
    };

    xhr.onreadystatechange = function () {
      if (xhr.readyState === XHR.DONE) {
        if(xhr.status === 0) {
          err = new Error('ENETWORK')
          callback(err, xhr)
        } 
      }
    };

    switch (options.method) {
      case 'GET':
      case 'get':
        xhr.open('GET', url, true /* async */);
        xhr.send()
        break;
      case 'PUT':
      case 'POST':
      case 'put':
      case 'post':
        xhr.open('POST', url, true /* async */);
        xhr.send(options.body)
        break;
    }
  } catch (e) { console.log(['xhr error: ',options.host,options.path,e].join(' ')); callback(e+', '+url,xhr) }
}

function is_crossDomain(url) {
  var rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/


  // jQuery #8138, IE may throw an exception when accessing
  // a field from window.location if document.domain has been set
  var ajaxLocation
  try { ajaxLocation = location.href }
  catch (e) {
    // Use the href attribute of an A element since IE will modify it given document.location
    ajaxLocation = document.createElement( "a" );
    ajaxLocation.href = "";
    ajaxLocation = ajaxLocation.href;
  }

  if (ajaxLocation.match('file:')) return true;
  
  var ajaxLocParts = rurl.exec(ajaxLocation.toLowerCase()) || []
      , parts = rurl.exec(url.toLowerCase() )

  var result = !!(
    parts &&
    (  parts[1] != ajaxLocParts[1]
    || parts[2] != ajaxLocParts[2]
    || (parts[3] || (parts[1] === "http:" ? 80 : 443)) != (ajaxLocParts[3] || (ajaxLocParts[1] === "http:" ? 80 : 443))
    )
  )

  //console.debug('is_crossDomain('+url+') -> ' + result)
  return result
}

module.exports = {
  request:request,
  xhr: true  
};
