kalzate Server
=======

Point Of Sale(POS) application for a shoe store based on NodeJS and MongoDB 

** Installing

npm install will install both "dependencies" and "devDependencies". However, it will only install "dependencies" if NODE_ENV environment variable is set to production

npm install --production will only install "dependencies"

Note: on production it is higly recommended to set the NODE_ENV environment variable to production

//To check current NODE_ENV variable value
printenv NODE_ENV
echo $NODE_ENV

//Create temporal NODE_ENV variable
NODE_ENV=production

//Create permanent NODE_ENV variable
export NODE_ENV=production

//To delete from current shell, just set to an empty value
NODE_ENV=
//or delete it completely
unset NODE_ENV

//To un-export it, just set to an empty value
export NODE_ENV=
//or un-export it completely
export -n NODE_ENV

** Running tests

cd to server folder(same as this README) and run:

> npm test

or simply run:

> make test

if want to watch on your test changes then:

> make test-w

if want to run specific test, use the --grep option to match test names to be run

Take a view on Makefile to configure your tests