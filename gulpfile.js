var gulp = require('gulp'),
    async = require('async'),
    del = require('del'),
    fs = require('fs'),
    replace = require('gulp-replace'),
    request = require('request'),
    config = require('./config.json');

var hostname = null;
var manageUrl = 'http://' + config.host + ':' + config.managementPort + '/';
var restUrl = 'http://' + config.host + ':' + config.restPort + '/';
var auth = {
  "user": config.username,
  "pass": config.password,
  "sendImmediately": false
};
var httpOptions = {
  "auth": auth
}

/*
var request = function(method, urlStr, body, success, fail) {
  //var callback = callback || function(){};
  var urlObj = url.parse(urlStr);
  //console.log(urlObj);
  var req = http.request({
    hostname: urlObj.hostname,
    port: urlObj.port,
    path: urlObj.path,
    method: method,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": "0"
    }
  }, body, function(res) {
    console.log('STATUS: ' + res.statusCode);
    var data = null;
    res.on('data', function(resp) {
      //console.log('resp:', resp.toString());
      data = resp;
    });
    res.on('error', function(err){
      console.log('err:', err);
      fail(err);
    });
    res.on('end', function(){
      //console.log('no response data recieved');
      success(data);
    });
  });
};
*/

gulp.task('default', ['usage']);

gulp.task('clean', ['bootstrap-clean']);

gulp.task('bootstrap', ['bootstrap-echo', 'bootstrap-roles', 'bootstrap-users', 'bootstrap-privileges', 'bootstrap-forests', 'bootstrap-databases']);

gulp.task('bootstrap-clean', function() {
  return del(['./build']);
});

gulp.task('bootstrap-build', [/*'bootstrap-clean'*/], function() {
  var stream = gulp.src('./config/*.json')
  for (var key in config.properties) {
    stream = stream.pipe(replace('@' + key, config.properties[key]));
  }
  stream.pipe(gulp.dest('./build'));
});

gulp.task('bootstrap-echo', ['get-cluster-info'], function(){
  console.log('===============================================');
  console.log('Boostrapping onto ' + config.host);
  console.log('  hostname: ' + hostname);
  console.log('  username: ' + config.username);
  console.log('===============================================');
});

gulp.task('usage', function() {
  console.log("MarkLogic Application Deployer for Gulp");
  console.log("usage: $>gulp COMMAND");
  console.log(" - bootstrap");
  console.log(" - deploy");
});

gulp.task('get-cluster-info', function(done){
  request(manageUrl + 'manage/v2/hosts?format=json', httpOptions, function(err, resp, body) {
    if (err) throw err;
    console.log('cluster data:', body.toString());
    var hostInfo = JSON.parse(body.toString());
    var host = hostInfo['host-default-list']['list-items']['list-item'][0];
    hostname = host.nameref;
    done();
  });
});

gulp.task('bootstrap-roles', ['bootstrap-build'], function(done){
  var roles = require('./build/roles.json');
  async.forEachOfSeries(roles, function(role, key, cb){
    console.log('bootstrapping role: ' + role['role-name']);
    request(manageUrl + 'manage/v2/roles?format=json', {
      "method": "POST",
      "auth": auth,
      "json": true,
      "body": role
    }, function(err, resp, body) {
      if (err) {
        cb(err);
      } else {
        cb();
      }
    });
  }, function(err) {
    if (err) 
      console.log('an error occurred bootstrapping roles:', err);
    done();
  });
});

gulp.task('bootstrap-users', ['bootstrap-build', 'bootstrap-roles'], function(done){
  var users = require('./build/users.json')
  async.forEachOfSeries(users, function(user, key, cb){
    console.log('bootstrapping user: ' + user['user-name']);
    request(manageUrl + 'manage/v2/users?format=json', {
      "method": "POST",
      "auth": auth,
      "json": true,
      "body": user
    }, function(err, resp, body) {
      if (err) {
        cb(err);
      } else {
        cb();
      }
    });
  }, function(err) {
    if (err) 
      console.log('an error occurred bootstrapping users:', err);
    done();
  });
});

gulp.task('bootstrap-privileges', ['bootstrap-build', 'bootstrap-roles'], function(done){
  var privileges = require('./build/privileges.json');
  async.forEachOfSeries(privileges, function(priv, key, cb){
    console.log('bootstrapping privilege: ' + priv['privilege-name']);
    request(manageUrl + 'manage/v2/privileges?format=json', {
      "method": "POST",
      "auth": auth,
      "json": true,
      "body": priv
    }, function(err, resp, body) {
      if (err) {
        cb(err);
      } else {
        cb();
      }
    });
  }, function(err) {
    if (err) 
      console.log('an error occurred bootstrapping privileges:', err);
    done();
  });
});

gulp.task('bootstrap-forests', ['get-cluster-info', 'bootstrap-build'], function(done){
  var forests = require('./build/forests.json');
  async.forEachOfSeries(forests, function(forest, key, cb){
    console.log('bootstrapping forest: ' + forest['forest-name']);
    request(manageUrl + 'manage/v2/forests?format=json', {
      "method": "POST",
      "auth": auth,
      "json": true,
      "body": forest
    }, function(err, resp, body) {
      if (err) {
        cb(err);
      } else {
        cb();
      }
    });
  }, function(err){
    if (err) 
      console.log('an error occurred bootstrapping forests:', err);
    done();
  });
});

gulp.task('bootstrap-databases', ['bootstrap-build', 'bootstrap-forests'], function(done){
  var databases = require('./build/databases.json');
  async.forEachOfSeries(databases, function(database, key, cb){
    console.log('bootstrapping database: ' + database['database-name']);
    request(manageUrl + 'manage/v2/databases?format=json', {
      "method": "POST",
      "auth": auth,
      "json": true,
      "body": database
    }, function(err, resp, body) {
      if (err) {
        cb(err);
      } else {
        cb();
      }
    });
  }, function(err){
    if (err) 
      console.log('an error occurred bootstrapping databases:', err);
    done();
  });
});

gulp.task('bootstrap-appservers', ['bootstrap-build', 'bootstrap-databases'], function(done){
  var appservers = require('./build/appservers.json');
  async.forEachOfSeries(appservers, function(server, key, cb){
    console.log('bootstrapping application server: ' + server['server-name']);
    request(manageUrl + 'manage/v2/servers?format=json', {
      "method": "POST",
      "auth": auth,
      "json": true,
      "body": server
    }, function(err, resp, body) {
      if (err) {
        cb(err);
      } else {
        cb();
      }
    });
  }, function(err){
    if (err) 
      console.log('an error occurred bootstrapping application server:', err);
    done();
  });
});

gulp.task('bootstrap-tasks', ['bootstrap-build', 'bootstrap-databases'], function(done){
  var tasks = require('./build/tasks.json');
  async.forEachOfSeries(tasks, function(task, key, cb){
    console.log('bootstrapping scheduled task: ' + task['task-path']);
    request(manageUrl + 'manage/v2/tasks', {
      "method": "POST",
      "auth": auth,
      "json": true,
      "body": task,
      "qs": {
        "format": "json",
        "group-id": config.groupId
      }
    }, function(err, resp, body) {
      if (err) {
        cb(err);
      } else {
        cb();
      }
    });
  }, function(err){
    if (err) 
      console.log('an error occurred bootstrapping scheduled task:', err);
    done();
  });
});

gulp.task('deploy', ['deploy-echo', 'deploy-modules', 'deploy-content']);

gulp.task('create-rest-service', function(done){
  // check if the rest-api service already exists
  request(manageUrl + 'v1/rest-apis/' + config.restServiceName, {
    "auth": auth,
    "json": true,
    "qs": {
      "format": "json",
      "group": config.groupId
    }
  }, function(err, resp, body) {
    if (err) throw err;
    if (body && body.name === config.restServiceName) {
      console.log('Rest API Service "' + config.restServiceName + '" already exists.  Bypassing creation...');
      done();
    } else {
      // it doesn't exists, create it...
      console.log('creating rest api service: ' + config.restServiceName);
      request(manageUrl + 'v1/rest-apis', {
        "method": "POST",
        "auth": auth,
        "json": true,
        "body": {
          "rest-api": {
            "name": config.restServiceName,
            "port": config.restPort,
            "group": config.groupId,
            "database": config.contentDatabase,
            "modules-database": config.modulesDatabase,
            "xdbc-enabled": true
          }
        }
      },
      function(err, resp, data) {
        if (err) throw err;
        console.log(data);
        done();
      });
    }
  });
});

gulp.task('deploy-echo', function(){
  console.log('===============================================');
  console.log('Deploying onto ' + config.host);
  console.log('  username: ' + config.username);
  console.log('===============================================');
});

gulp.task('deploy-modules', ['deploy-echo'], function(){
  var Writable = require('stream').Writable;
  var writer = Writable({ objectMode: true });
  writer._write = function(chunk, enc, next) {
    console.log(enc);
    console.log(chunk);
    next();
  };

  var path = './' + config.modulesDirectory + '/**';
  console.log(path);
  gulp.src(path)
    .pipe(writer);
});

gulp.task('deploy-content', ['deploy-echo'], function(done){
  // TODO: utilize gulp pipe()'s
  // TODO: recurse sub-directories
  fs.readdir('./' + config.contentDirectory, function (err, files) {
    if (err) {
      done(err);
    }

    async.forEachOfSeries(files, function(file, key, cb) {
      console.log(file);
      var filepath = './' + config.contentDirectory + '/' + file;
      var stat = fs.statSync(filepath);
      if (stat.isFile()) {
        // post the file
        console.log('uploading file: ' + filepath);
        request(restUrl + 'v1/documents', {
          "method": "POST",
          "auth": auth,
          "headers": {
            "Content-Type": "multipart/mixed"
          },
          "multipart": {
            "chunked": false,
            "data": [
              {
                "Content-Disposition": 'attachment; filename="' + file + '"',
                "body": fs.readFileSync(filepath)
              }
            ]
          }
        }, function(err, resp, body){
          if (err) cb(err);
          console.log(body);
          cb();
        });
      } else {
        // not a file, skip
        cb();
      }
    }, function(err) {
      if (err) throw err;
      done(err);
    });
  });
});
