/*
Publishes stream contents to MarkLogic using the MarkLogic Rest-API
*/
var through = require('through2'); // through2 is a thin wrapper around node transform streams
var gutil = require('gulp-util');
var request = require('request');
var path = require('path');
var url = require('url');
var PluginError = gutil.PluginError;

// Consts
const PLUGIN_NAME = 'gulp-mlpublisher';

function gulpMLPublisher(config) {

  /* Sample configuration
  {
    host: localhost,
    port: 8006,
    auth: {
      user: "username",
      pass: "password"
    },
    database: "marklogic-database-name"
  }
  */

  if (!config) {
    throw new PluginError(PLUGIN_NAME, 'Missing configuration options!');
  } else if (!config.host) {
    throw new PluginError(PLUGIN_NAME, 'Missing required configuration option "host"');
  } else if (!config.port) {
    throw new PluginError(PLUGIN_NAME, 'Missing required configuration option "port"');
  }

  var scheme = config.scheme || 'http';
  var restUrl = scheme + '://' + config.host + ':' + config.port + '/';

  // Creating a stream through which each file will pass
  return through.obj(function(file, enc, cb) {
    if (file.isNull()) {
      // return empty file
      return cb(null, file);
    }    

    var contents = null;

    if (file.isBuffer()) {
      contents = file.contents.toString();
    }
    if (file.isStream()) {
      throw new PluginError(PLUGIN_NAME, 'Streams not yet supported!');
    }

    var uri = url.parse(path.join('/', file.relative)).path;
    console.log('uploading file: ' + uri);
    //console.log(contents);

    request(restUrl + 'v1/documents', {
      "method": "POST",
      "auth": config.auth,
      "headers": {
        "Content-Type": "multipart/mixed"
      },
      "qs": {
        "database": config.database
      },
      "multipart": {
        "chunked": false,
        "data": [
          {
            "Content-Disposition": 'attachment; filename="' + uri + '"',
            "body": contents
          }
        ]
      }
    }, function(err, resp, body){
      if (err) cb(err, file);
      //console.log(body);
      cb(null, file);
    });
  });
}

// Exporting the plugin main function
module.exports = gulpMLPublisher;