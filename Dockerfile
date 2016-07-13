FROM ubuntu:14.04

MAINTAINER Zuri Pabon, zurisadai.pabon@gmail.com

ADD . /home/kalzate
WORKDIR /home/kalzate/server

# Replace shell with bash so we can source files
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Set debconf to run non-interactively
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

# Install System Dependences
RUN apt-get update
RUN apt-get install -y build-essential g++ make cmake libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev libssl-dev

# Set up node and npm with nvm
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 0.12.7

RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh | bash \
    && source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default \
    && npm install

# Port 3000 for server
EXPOSE 3000
CMD ["/bin/bash", "server.sh"]
