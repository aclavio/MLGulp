var _ = require('lodash'),
    async = require('async'),
    request = require('request'),
    path = require('path'),
    Promise = require('promise');

var requestCallback = function(callback, log) {
  return function(err, resp, data) {
    if (err) {
      callback(err);
    } else {
      if (log) {
        console.log(resp.statusCode);
        console.log(data);
      }
      callback();
    }
  }
};

var Bootstrapper = function(config) {

  this.manageUrl = 'http://' + config.host + ':' + config.managementPort + '/manage/v2/';
  this.auth = {
    "user": config.username,
    "pass": config.password,
    "sendImmediately": false
  };
  this.httpOptions = {
    "auth": this.auth
  };

  this.bootstrapRoles = function(roles) {
    var self = this;
    return new Promise(function(resolve, reject) {
      async.forEachOfSeries(roles, function(role, key, cb){
        var roleName = role['role-name'];
        console.log('bootstrapping role: ' + roleName);
        request(self.manageUrl + 'roles/' + roleName, self.httpOptions, function(err, resp, body) {
          if (err) cb(err);
          if (resp.statusCode === 200) {
            console.log('role', roleName, 'already exists, modifying...');
            request(self.manageUrl + 'roles/' + roleName + '/properties?format=json', {
              "method": "PUT",
              "auth": self.auth,
              "json": true,
              "body": role
            }, requestCallback(cb));
          } else {
            console.log('role', roleName, 'doesn\'t already exist, creating...');
            request(self.manageUrl + 'roles?format=json', {
              "method": "POST",
              "auth": self.auth,
              "json": true,
              "body": role
            }, requestCallback(cb));
          }
        });
      }, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve()
        }
      });
    });
  };

  this.bootstrapUsers = function(users) {
    var self = this;
    return new Promise(function(resolve, reject) {
      async.forEachOfSeries(users, function(user, key, cb){
        var username = user['user-name'];
        console.log('bootstrapping user: ' + username);
        request(self.manageUrl + 'users/' + username, self.httpOptions, function(err, resp, body) {
          if (err) cb(err);
          if (resp.statusCode === 200) {
            console.log('user', username, 'already exists, modifying...');
            request(self.manageUrl + 'users/' + username + '/properties?format=json', {
              "method": "PUT",
              "auth": self.auth,
              "json": true,
              "body": user
            }, requestCallback(cb));
          } else {
            console.log('user', username, 'doesn\'t already exist, creating...');
            request(self.manageUrl + 'users?format=json', {
              "method": "POST",
              "auth": self.auth,
              "json": true,
              "body": user
            }, requestCallback(cb));
          }
        });
      }, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };

  this.bootstrapPrivileges = function(privileges) {
    var self = this;
    return new Promise(function(resolve, reject) {
      async.forEachOfSeries(privileges, function(priv, key, cb){
        var name = priv['privilege-name'];
        var kind = priv['kind'];
        console.log('bootstrapping', kind, 'privilege:', name);
        request(self.manageUrl + 'privileges/' + name + '?kind=' + kind, self.httpOptions, function(err, resp, body) {
          if (err) cb(err);
          if (resp.statusCode === 200) {
            console.log('privilege', name, 'already exists, modifying...');
            request(self.manageUrl + 'privileges/' + name + '/properties', {
              "method": "PUT",
              "auth": self.auth,
              "json": true,
              "body": priv,
              "qs": {
                "format": "json",
                "kind": kind
              }
            }, requestCallback(cb));

          } else {
            console.log('privilege', name, 'doesn\'t already exist, creating...');
            request(self.manageUrl + 'privileges?format=json', {
              "method": "POST",
              "auth": self.auth,
              "json": true,
              "body": priv
            }, requestCallback(cb));
          }
        });
      }, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };

  this.bootstrapForests = function(forests) {
    var self = this;
    return new Promise(function(resolve, reject) {
      async.forEachOfSeries(forests, function(forest, key, cb){
        var name = forest['forest-name'];
        console.log('bootstrapping forest: ' + name);
        request(self.manageUrl + 'forests/' + name, self.httpOptions, function(err, resp, body) {
          if (err) cb(err);
          if (resp.statusCode === 200) {
            console.log('forest', name, 'already exists, modifying...');
            request(self.manageUrl + 'forests/' + name + '/properties?format=json', {
              "method": "PUT",
              "auth": self.auth,
              "json": true,
              "body": forest
            }, requestCallback(cb));
          } else {
            console.log('forest', name, 'doesn\'t already exist, creating...');
            request(self.manageUrl + 'forests?format=json', {
              "method": "POST",
              "auth": self.auth,
              "json": true,
              "body": forest
            }, requestCallback(cb));
          }
        });
      }, function(err){
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };

  this.bootstrapDatabases = function(databases) {
    var self = this;
    return new Promise(function(resolve, reject) {
      async.forEachOfSeries(databases, function(database, key, cb){
        var name = database['database-name'];
        console.log('bootstrapping database: ' + name);
        request(self.manageUrl + 'databases/' + name, self.httpOptions, function(err, resp, body) {
          if (err) cb(err);
          if (resp.statusCode === 200) {
            console.log('database', name, 'already exists, modifying...');
            request(self.manageUrl + 'databases/' + name + '/properties?format=json', {
              "method": "PUT",
              "auth": self.auth,
              "json": true,
              "body": database
            }, requestCallback(cb));
          } else if (resp.statusCode === 404) {
            console.log('database', name, 'doesn\'t already exist, creating...');
            request(self.manageUrl + 'databases?format=json', {
              "method": "POST",
              "auth": self.auth,
              "json": true,
              "body": database
            }, requestCallback(cb));
          } else {
            cb(body);
          }
        });
      }, function(err){
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });


    });
  };

  this.bootstrapAppservers = function(appservers) {
    var self = this;
    return new Promise(function(resolve, reject) {
      async.forEachOfSeries(appservers, function(server, key, cb){
        var name = server['server-name'];
        var group = server['group-name'];
        console.log('bootstrapping application server: ' + name);
        request(self.manageUrl + 'servers/' + name + '?group-id=' + group, self.httpOptions, function(err, resp, body) {
          if (err) cb(err);
          if (resp.statusCode === 200) {
            console.log('server', name, 'already exists, modifying...');
            request(self.manageUrl + 'servers/' + name + '/properties', {
              "method": "PUT",
              "auth": self.auth,
              "json": true,
              "body": server,
              "qs": {
                "format": "json",
                "group-id": group
              }
            }, requestCallback(cb));
          } else if (resp.statusCode === 404) {
            console.log('server', name, 'doesn\'t already exist, creating...');
            request(self.manageUrl + 'servers?format=json', {
              "method": "POST",
              "auth": self.auth,
              "json": true,
              "body": server
            }, requestCallback(cb));
          } else {
            cb(body);
          }
        });       
      }, function(err){
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };

  this.bootstrapTasks = function(tasks) {
    var self = this;
    return new Promise(function(resolve, reject) {
      request(self.manageUrl + 'tasks', {
        "auth": self.auth,
        "json": true,
        "qs": {
          "format": "json",
          "group-id": config.groupId
        }
      }, function(err, resp, body) {
        if (err) reject(err);
        if (resp.statusCode !== 200) {
          reject(body);
        } else {
          var existingTasks = body['tasks-default-list']['list-items']['list-item'];
          async.forEachOfSeries(tasks, function(task, key, cb){
            var path = task['task-path'];
            console.log('bootstrapping scheduled task: ' + path);
            if (_.some(existingTasks, {'task-path': path})) {
              var id = _.find(existingTasks, {'task-path': path}).idref;
              console.log('task', path, 'already exists, replacing...');
              // need to delete the old version first
              request(self.manageUrl + 'tasks/' + id + '?group-id=' + config.groupId, {
                "method": "DELETE",
                "auth": self.auth
              }, function(err, resp, body) {
                if (err) cb(err);
                // now try to create the new one
                request(self.manageUrl + 'tasks', {
                  "method": "POST",
                  "auth": self.auth,
                  "json": true,
                  "body": task,
                  "qs": {
                    "format": "json",
                    "group-id": config.groupId
                  }
                }, requestCallback(cb));
              });
            } else {
              console.log('task', path, 'doesn\'t already exist, creating...');
              request(self.manageUrl + 'tasks', {
                "method": "POST",
                "auth": self.auth,
                "json": true,
                "body": task,
                "qs": {
                  "format": "json",
                  "group-id": config.groupId
                }
              }, requestCallback(cb));
            }
          }, function(err){
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        }
      });
    });
  };

};

module.exports = Bootstrapper;