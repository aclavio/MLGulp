# MLGulp
MarkLogic Application Deployer for Gulp

**please note: this application is in the early stages of development**

## Usage

### Bootstrapping a MarkLogic Server
    gulp boostrap

### Deploying Application Modules and Content to Marklogic
Deploy Modules and Content:

    gulp deploy

Deploy Modules:

    gulp deploy-modules

Deploy Content:

    gulp deploy-content


## Help
    gulp usage

## Configuration
todo

## Roadmap
* Autodetect Host name(s)
* Determine if currenlty deployed configuration items are different then items to be bootstrapped
 * bootstrap only if needed
* Support multiple forests per host automatically
* Clean Modules/Content Database
* Teardown configurations
