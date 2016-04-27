# MLGulp
MarkLogic Application Deployer for Gulp

## Usage

### Bootstrapping a MarkLogic Server
    gulp boostrap

### Deploying Application Modules and Content to Marklogic
Deploy Content and Modules:

    gulp deploy
    gulp deploy-modules
    gulp deploy-content

Watch and Deploy Changes:

    gulp watch

Clean Content and Modules Database(s):

    gulp clean
    gulp clean-modules
    gulp clean-content

## Help
    gulp usage

## Configuration
Configuration is stored in the config.json file

    username:         MarkLogic administrator username
    password:         MarkLogic administrator password
    host:             ip or host name of the target MarkLogic server
    restServiceName:  name of the Rest API service
    contentDatabase:  name of the content database
    modulesDatabase:  name of the modules database
    contentDirectory: filesystem directory where content is stored
    modulesDirectory: filesystem directory where modules are stored
    batchSize:        number of files to be deployed in a single request
    properties:       todo
      

## Roadmap
* Autodetect Host name(s)
* Determine if currenlty deployed configuration items are different then items to be bootstrapped
 * bootstrap only if needed
* Support multiple forests per host automatically
* Teardown configurations
* Set collections and permissions on deployed docs
