var async = require('async'),
    request = require('request'),
    path = require('path'),
    Promise = require('promise');

var requestCallback = function(callback) {
  return function(err, resp, data) {
    if (err) {
      callback(err);
    } else {
      callback();
    }
  }
};

var Bootstrapper = function(config) {

  this.manageUrl = 'http://' + config.host + ':' + config.managementPort + '/';
  this.auth = {
    "user": config.username,
    "pass": config.password,
    "sendImmediately": false
  };
  this.httpOptions = {
    "auth": this.auth
  }

  this.bootstrapRoles = function(roles) {
    var self = this;
    return new Promise(function(resolve, reject) {
      async.forEachOfSeries(roles, function(role, key, cb){
        var roleName = role['role-name'];
        console.log('bootstrapping role: ' + roleName);
        request(self.manageUrl + 'manage/v2/roles/' + roleName, self.httpOptions, function(err, resp, body) {
          if (err) cb(err);
          if (resp.statusCode === 200) {
            console.log('role', roleName, 'already exists, modifying...');
            request(self.manageUrl + 'manage/v2/roles/' + roleName + '/properties?format=json', {
              "method": "PUT",
              "auth": self.auth,
              "json": true,
              "body": role
            }, requestCallback(cb));
          } else {
            console.log('role', roleName, 'doesn\'t already exist, creating...');
            request(self.manageUrl + 'manage/v2/roles?format=json', {
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
        request(self.manageUrl + 'manage/v2/users/' + username, self.httpOptions, function(err, resp, body) {
          if (err) cb(err);
          if (resp.statusCode === 200) {
            console.log('user', username, 'already exists, modifying...');
            request(self.manageUrl + 'manage/v2/users/' + username + '/properties?format=json', {
              "method": "PUT",
              "auth": self.auth,
              "json": true,
              "body": user
            }, requestCallback(cb));
          } else {
            console.log('user', username, 'doesn\'t already exist, creating...');
            request(self.manageUrl + 'manage/v2/users?format=json', {
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
  }

};

module.exports = Bootstrapper;