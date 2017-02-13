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
// Build Full Owner Key - concat owner's name and owner's company
// ============================================================================================================================
func build_full_owner(username string, company string) (string) {
	return username + "." + company;                          //do not change case here!
}

// ============================================================================================================================
// Get Owner - get the owner asset from ledger
// ============================================================================================================================
func get_owner(stub shim.ChaincodeStubInterface, username string, company string) (Owner, error) {
	var fullOwner = build_full_owner(username, company);       //concat owners name and the company name
	return get_owner_full(stub, fullOwner)
}

func get_owner_full(stub shim.ChaincodeStubInterface, fullOwner string) (Owner, error) {
	var owner Owner
	ownerAsBytes, err := stub.GetState(fullOwner)              //this should always succeed, even if it doesn't exist
	if err != nil {
		return owner, errors.New("Failed to get owner - " + fullOwner)
	}
	json.Unmarshal(ownerAsBytes, &owner)                       //un stringify it aka JSON.parse()

	if len(owner.Username) == 0 {                              //test if owner is actually here or just nil
		return owner, errors.New("Owner does not exist - " + fullOwner + ", " + owner.Username + "." + owner.Company)
	}

	return owner, nil
}

// ============================================================================================================================
// Get Array of All Owner Assets
// ============================================================================================================================
func get_complete_owner_index(stub shim.ChaincodeStubInterface) (OwnersIndex, error) {
	var ownersIndex OwnersIndex
	ownerIndexAsBytes, err := stub.GetState(ownerIndexStr)    //this should always succeed, even if it doesn't exist
	if err != nil {
		return ownersIndex, errors.New("Failed to get owner index")
	}
	json.Unmarshal(ownerIndexAsBytes, &ownersIndex)           //un stringify it aka JSON.parse()
	return ownersIndex, nil
}
