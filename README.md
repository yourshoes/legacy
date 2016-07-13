Kalzate
=======

Point Of Sale (POS) application for a shoes store based on the MEAN stack (Node, Express, Angular and MongoDB) 

# Dependences

```bash
# System package dependences
$ sudo apt-get update 
$ sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++ redis-server mongodb-org
# Node virtual environment
$ npm install nave -g
$ nave install latest
$ nave use latest
# Application packages dependences
$ cd server
$ npm install
$ node server.js
```

# Known issues

> Solve error -> AttributeError: 'module' object has no attribute 'script_main'

```bash
$ sudo apt-get remove gyp
```