#!/bin/bash
set -e

cd ../

# download and setup the SDK
git clone https://github.com/hyperledger/fabric-sdk-node.git
sleep 1
cd ./fabric-sdk-node
git checkout v1.0.0-alpha
git branch
cd ../

# use our docker compose file in sdk
cp ./docker-compose-marblesv3.yaml fabric-sdk-node/test/fixtures
