# MLGulp
MarkLogic Application Deployer for Gulp

**please note: this application is in the early stages of development**

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
todo

## Roadmap
* Autodetect Host name(s)
* Determine if currenlty deployed configuration items are different then items to be bootstrapped
 * bootstrap only if needed
* Support multiple forests per host automatically
* Teardown configurations
* Bulk deployment of content/modules
