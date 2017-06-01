#!/bin/bash
# ------------------------------------------------------------------------
# This script will do a blue / green deployment. Green is named temp.
# ------------------------------------------------------------------------

# ----------  Set these ENV vars before running this script!  ------------
# DEV_DB_CONNECTION or STAGING_DB_CONNECTION or PROD_DB_CONNECTION = https://asdf@baas.cloudant.com
# BLUEMIX_USER = "bluemix ibm id user name to use (email address)"
# BLUEMIX_PASSWORD = "bluemix ibm id password to use"

set -e

git clone https://github.com/hyperledger/fabric-sdk-node.git testing
cd ./testing/fabric-sdk-node
git checkout v1.0.0-alpha
git branch