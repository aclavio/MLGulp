var gulp = require('gulp'),
    del = require('del'),
    path = require('path'),
    replace = require('gulp-replace'),
    request = require('request'),
    config = require('./config.json'),
    MLPublisher = require('./mlgulp/mlpublisher'),
    Bootstrapper = require('./mlgulp/bootstrapper');

var marklogic = new Bootstrapper(config);
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

var normalizeRootPath = function(dir) {
  dir = path.resolve(dir);
  dir = path.format(path.parse(dir));
  //console.log(dir);
  return path.join(dir, '/');
};

var modulesRoot = normalizeRootPath(config.modulesDirectory);
var modulesPublisher = new MLPublisher({
  host: config.host,
  port: config.restPort,
  auth: auth,
  root: modulesRoot,
  database: config.modulesDatabase,
  batchSize: config.batchSize,
  metadata: config.modulesMetadata,
  verbose: false
});
var contentRoot = normalizeRootPath(config.contentDirectory);
var contentPublisher = new MLPublisher({
  host: config.host,
  port: config.restPort,
  auth: auth,
  root: contentRoot,
  database: config.contentDatabase,
  batchSize: config.batchSize,
  metadata: config.contentMetadata,
});

gulp.task('default', ['usage']);

gulp.task('clean', ['bootstrap-clean']);

gulp.task('bootstrap', ['bootstrap-echo', 'bootstrap-roles', 'bootstrap-users', 'bootstrap-privileges', 'bootstrap-forests', 'bootstrap-databases', 'bootstrap-appservers', 'bootstrap-tasks']);

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
  console.log(" - watch");
  console.log(" - clean");
  console.log(" - create-rest-service");
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
  marklogic.bootstrapRoles(roles).then(function() {
    done();
  }, function(err) {
    console.log('an error occurred bootstrapping roles:', err);
    done(err);
  });
});

gulp.task('bootstrap-users', ['bootstrap-build', 'bootstrap-roles'], function(done){
  var users = require('./build/users.json');
  marklogic.bootstrapUsers(users).then(function() {
    done();
  }, function(err) {
    console.log('an error occurred bootstrapping users:', err);
    done(err);
  });
});

gulp.task('bootstrap-privileges', ['bootstrap-build', 'bootstrap-roles'], function(done){
  var privileges = require('./build/privileges.json');
  marklogic.bootstrapPrivileges(privileges).then(function() {
    done();
  }, function(err) {
    console.log('an error occurred bootstrapping privileges:', err);
    done(err);
  });
});

gulp.task('bootstrap-forests', ['get-cluster-info', 'bootstrap-build'], function(done){
  var forests = require('./build/forests.json');
  marklogic.bootstrapForests(forests).then(function() {
    done();
  }, function(err) {
    console.log('an error occurred bootstrapping forests:', err);
    done(err);
  });
});

gulp.task('bootstrap-databases', ['bootstrap-build', 'bootstrap-forests'], function(done){
  var databases = require('./build/databases.json');
  marklogic.bootstrapDatabases(databases).then(function() {
    done();
  }, function(err) {
    console.log('an error occurred bootstrapping databases:', err);
    done(err);
  });
});

gulp.task('bootstrap-appservers', ['bootstrap-build', 'bootstrap-databases'], function(done){
  var appservers = require('./build/appservers.json');
  marklogic.bootstrapAppservers(appservers).then(function() {
    done();
  }, function(err) {
    console.log('an error occurred bootstrapping appservers:', err);
    done(err);
  });
});

gulp.task('bootstrap-tasks', ['bootstrap-build', 'bootstrap-databases'], function(done){
  var tasks = require('./build/tasks.json');
  marklogic.bootstrapTasks(tasks).then(function() {
    done();
  }, function(err) {
    console.log('an error occurred bootstrapping tasks:', err);
    done(err);
  });
});

gulp.task('deploy', ['deploy-echo', 'deploy-modules', 'deploy-content']);

gulp.task('create-rest-service', function(done) {
  marklogic.getRestService(config.restServiceName, config.groupId).then(function(data) {
    console.log('Rest API Service "' + config.restServiceName + '" already exists.');
    done();
  }).catch(function(err) {
    if (err.error.errorResponse.statusCode === 404) {
      // it doesn't exists, create it...
      console.log('creating rest api service: ' + config.restServiceName);
      marklogic.createRestService(
        config.restServiceName,
        config.groupId,
        config.restPort,
        config.contentDatabase,
        config.modulesDatabase).then(function(data) {
          console.log('REST API "' + config.restServiceName + '" Created');
        }, function(err) {
          console.log(err.error.errorResponse);
          done(err);
        });
    } else {
      console.log(err);
      done(err);
    }
  });
});

gulp.task('deploy-echo', function() {
  console.log('===============================================');
  console.log('Deploying onto ' + config.host + ':' + config.restPort);
  console.log('  username: ' + config.username);
  console.log('===============================================');
});

gulp.task('_deploy-modules', ['deploy-echo'], function() {
  console.log('deploying from', modulesRoot, 'to', config.host, '[', config.modulesDatabase, ']');  
  return gulp.src(modulesRoot + '**')
    .pipe(modulesPublisher.pipe());
});

gulp.task('deploy-modules', ['_deploy-modules'], function(done) {
  modulesPublisher.flush().then(function() {
    done();
  }).catch(function(err) {
    done(err);
  });
});

gulp.task('_deploy-content', ['deploy-echo'], function() {
  console.log('deploying from', contentRoot, 'to', config.host, '[', config.contentDatabase, ']');

  return gulp.src(contentRoot + '**')
    .pipe(contentPublisher.pipe());
});

gulp.task('deploy-content', ['_deploy-content'], function(done) {
  contentPublisher.flush().then(function() {
    done();
  }).catch(function(err) {
    done(err);
  });
});

gulp.task('clean', ['clean-modules', 'clean-content']);

gulp.task('clean-content', function(done) {
  console.log('clearing content from ' + config.host + ':' + config.restPort + '/' + config.contentDatabase);
  marklogic.cleanContent(config.contentDatabase).then(function(resp) {
    done();
  }).catch(function(err) {
    console.log(err);
    done(err);
  });
});

gulp.task('clean-modules', function(done) {
  console.log('clearing content from ' + config.host + ':' + config.restPort + '/' + config.modulesDatabase);
  marklogic.cleanContent(config.modulesDatabase).then(function(resp) {
    done();
  }).catch(function(err) {
    console.log(err);
    done(err);
  });
});

gulp.task('watch-echo', function() {
  console.log('===============================================');
  console.log('Watching for changes "' + config.modulesDirectory + '"');
  console.log('  host:     ' + config.host + ':' + config.restPort);
  console.log('  database: ' + config.modulesDatabase);
  console.log('  username: ' + config.username);
  console.log('===============================================');
});

gulp.task('watch', ['deploy-modules', 'watch-echo'], function() {
  return gulp.watch(modulesRoot + '**', function(event) {
    //console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    if (event.type === "added" || event.type === "changed") {
      //console.log(event);
      gulp.src(event.path)
        .pipe(modulesPublisher.pipe(true));
    } else {
      console.error('unsupported event type: ', event.type, ' - ', event.path);
    }
  });
});

