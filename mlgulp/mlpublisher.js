/*
Publishes stream contents to MarkLogic using the MarkLogic Rest-API
*/
var _ = require('lodash');
var through = require('through2'); // through2 is a thin wrapper around node transform streams
var gutil = require('gulp-util');
var request = require('request-promise');
var path = require('path');
var url = require('url');
var Promise = require('promise')
var PluginError = gutil.PluginError;

// Consts
const PLUGIN_NAME = 'gulp-mlpublisher';

var validateConfig = function(config) {
  if (!config) {
    throw new PluginError(PLUGIN_NAME, 'Missing configuration options!');
  } else if (!config.root) {
    throw new PluginError(PLUGIN_NAME, 'Missing required configuration option "root"');
  } else if (!config.host) {
    throw new PluginError(PLUGIN_NAME, 'Missing required configuration option "host"');
  } else if (!config.port) {
    throw new PluginError(PLUGIN_NAME, 'Missing required configuration option "port"');
  } else if (!config.batchSize) {
    throw new PluginError(PLUGIN_NAME, 'Missing required configuration option "batchSize"');
  }
};

var MLPublisher = function(config) {

  this.buffers = [];

  /* Sample configuration
  {
    host: localhost,
    port: 8006,
    auth: {
      user: "username",
      pass: "password"
    },
    database: "marklogic-database-name",
    batchSize: 5,
    verbose: true
  }
  */

  validateConfig(config);
  
  this.flush = function() {
    if (config.verbose) console.log('flushing buffers...');
    var scheme = config.scheme || 'http';
    var restUrl = scheme + '://' + config.host + ':' + config.port + '/';
    var data = _.map(this.buffers, function(file) {
      var contents = null;

      if (file.isBuffer()) {
        contents = file.contents.toString();
      }
      if (file.isStream()) {
        throw new PluginError(PLUGIN_NAME, 'Streams not yet supported!');
      }
      //console.log('root:', config.root);
      //console.log('path:', file.path);
      var relative = file.path.replace(config.root, '');
      var uri = url.parse(path.join('/', relative)).path;
      console.log('uploading file: ' + uri);
      //console.log(contents);

      return {
        "Content-Disposition": 'attachment; filename="' + uri + '"',
        "body": contents
      };
    });

    this.buffers = [];
    if (config.verbose) console.log('==== batch boundry ====');

    if (data.length > 0) {
      // add metadata
      if (!_.isEmpty(config.metadata)) {
        data.unshift({
          "Content-Type": "application/json",
          "Content-Disposition": 'inline; category=metadata',
          "body": JSON.stringify(config.metadata)
        });
      }

      return request(restUrl + 'v1/documents', {
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
          "data": data
        }
      });
    } else {
      return Promise.resolve();
    }
  };

  this.pipe = function(immediate) {
    var self = this;
    return through.obj(function(file, enc, cb) {
      if (file.isNull()) {
        // return empty file
        return cb(null, file);
      }
      
      if (config.verbose) console.log('adding', file.path, 'to buffer');
      self.buffers.push(file);

      if (immediate || self.buffers.length >= config.batchSize) {
        self.flush().then(function() {
          cb(null, file);
        }).catch(function(err) {
          cb(err, file);  
        });
      } else {
        cb(null, file);
      }
    });
  };
};

module.exports = MLPublisher;