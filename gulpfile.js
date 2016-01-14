var gulp = require('gulp'),
    url = require('url'),
    async = require('async'),
    replace = require('gulp-replace'),
    digest = require('./http-digest-client2'),
    config = require('./config.json');

var hostname = null;
var mlurl = 'http://' + config.host + ':8002/';
var http = digest(config.username, config.password, false);

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

gulp.task('default', ['usage']);

gulp.task('bootstrap', ['bootstrap-echo', 'bootstrap-roles', 'bootstrap-users', 'bootstrap-privileges', 'bootstrap-forests', 'bootstrap-databases']);

gulp.task('bootstrap-build', function() {
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
  request('GET', mlurl + 'manage/v2/hosts?format=json', null, function(data) {
    console.log('cluster data:', data.toString());
    var hostInfo = JSON.parse(data.toString());
    var host = hostInfo['host-default-list']['list-items']['list-item'][0];
    hostname = host.nameref;
    done();
  }, function(err) {
    done(err);
  });
});

gulp.task('bootstrap-roles', ['bootstrap-build'], function(done){
  var roles = require('./build/roles.json');
  async.forEachOfSeries(roles, function(role, key, cb){
    console.log('bootstrapping role: ' + role['role-name']);
    var body = JSON.stringify(role);
    request('POST', mlurl + 'manage/v2/roles?format=json', body, function(data) {
      cb();
    }, function(err) {
      cb(err);
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
    var body = JSON.stringify(user);
    request('POST', mlurl + 'manage/v2/users?format=json', body, function() {
      cb();
    }, function(err) {
      cb(err);
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
    var body = JSON.stringify(priv);
    request('POST', mlurl + 'manage/v2/privileges?format=json', body, function() {
      cb();
    }, function(err) {
      cb(err);
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
    var body = JSON.stringify(forest);
    request('POST', mlurl + 'manage/v2/forests?format=json', body, function() {
      cb();
    }, function(err) {
      cb(err);
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
    var body = JSON.stringify(database);
    request('POST', mlurl + 'manage/v2/databases?format=json', body, function() {
      cb();
    }, function(err) {
      cb(err);
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
    var body = JSON.stringify(server);
    request('POST', mlurl + 'manage/v2/servers?format=json', body, function() {
      cb();
    }, function(err) {
      cb(err);
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
    var body = JSON.stringify(task);
    request('POST', mlurl + 'manage/v2/tasks?format=json&group-id=' + config.groupId, body, function() {
      cb();
    }, function(err) {
      cb(err);
    });
  }, function(err){
    if (err) 
      console.log('an error occurred bootstrapping scheduled task:', err);
    done();
  });
});