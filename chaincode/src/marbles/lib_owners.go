/*
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

package main

import (
	"encoding/json"
	"errors"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// ============================================================================================================================
// Get Owner - get the owner asset from ledger
// ============================================================================================================================
func get_owner(stub shim.ChaincodeStubInterface, id string) (Owner, error) {
	var owner Owner
	ownerAsBytes, err := stub.GetState(id)              //this should always succeed, even if it doesn't exist
	if err != nil {
		return owner, errors.New("Failed to get owner - " + id)
	}
	json.Unmarshal(ownerAsBytes, &owner)                       //un stringify it aka JSON.parse()

	if len(owner.Username) == 0 {                              //test if owner is actually here or just nil
		return owner, errors.New("Owner does not exist - " + id + ", " + owner.Username + "." + owner.Company)
	}
	
	return owner, nil
}
