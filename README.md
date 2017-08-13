Kalzate
=======

:fire: **IMPORTANT** :fire: : This repository is deprecated and not maintained anymore. Please, move to [kalzate](https://github.com/yourshoes/kalzate) instead.

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

# Docker Set Up

Note: in OSX, run "Docker Quick Start Terminal"

```bash
docker-compose build # skip this step if having the kalzate_web image
docker-compose up

# For running this in background, just
docker-compose up -d

# To stop and remove everything
docker-compose stop
docker-compose rm

# To check logs when running in background (-d flag)
docker-compose logs
```

If skipping docker-compose, then:

```bash
docker build -t kalzate_web .
docker run -p 27017:27017 -d --name mongodb mongo:3.2
docker run -p 3000:3000 --link mongodb:kalzate kalzate_web
```


# Known issues

> Solve error -> AttributeError: 'module' object has no attribute 'script_main'

```bash
$ sudo apt-get remove gyp
```
