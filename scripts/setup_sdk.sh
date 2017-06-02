#!/bin/bash
set -e

# download and setup the SDK
git clone https://github.com/hyperledger/fabric-sdk-node.git
sleep 1
cd ./fabric-sdk-node
git checkout v1.0.0-alpha
git branch
sleep 1

# finish setting up sdk
npm install
npm install -g gulp
gulp ca

# use our docker compose file in sdk
cd ../
cp ./docker-compose-marblesv3.yaml fabric-sdk-node/test/fixtures

# replace config.json - this one does not use tls
cp ./config.json fabric-sdk-node/test/integration/e2e
