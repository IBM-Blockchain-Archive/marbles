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
	"fmt"
	//"strconv"
	"strings"
	//"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// ============================================================================================================================
// Set Owner Permission on Marble
// ============================================================================================================================
func set_owner(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var err error
	fmt.Println("starting set_owner")

	//   0   ,     1  ,        2                 3
	// marble, to user,       to company,  company that auth the transfer
	// "name",   "bob", "united_marbles", "united_mables" 
	if len(args) < 4 {
		return nil, errors.New("Incorrect number of arguments. Expecting 4")
	}

	var marble_id = args[0]
	var new_user = strings.ToLower(args[1])
	var new_company = strings.ToLower(args[2])
	var authed_by_company = strings.ToLower(args[3])
	fmt.Println(marble_id + "->" + new_user + " - " + new_company + ":" + authed_by_company)

	// get marble's current state 
	marbleAsBytes, err := stub.GetState(marble_id)
	if err != nil {
		return nil, errors.New("Failed to get marble")
	}
	res := Marble{}
	json.Unmarshal(marbleAsBytes, &res)          //un stringify it aka JSON.parse()

	//check authorizing company
	if strings.ToLower(res.Owner.Company) != authed_by_company{
		return nil, errors.New("The company '" + authed_by_company + "' cannot authorize transfers for '" + res.Owner.Company + "'.")
	}

	//transfer the marble
	res.Owner.Username = new_user                 //change the owner
	res.Owner.Company = new_company               //change the owner
	jsonAsBytes, _ := json.Marshal(res)
	err = stub.PutState(args[0], jsonAsBytes)    //rewrite the marble with id as key
	if err != nil {
		return nil, err
	}

	fmt.Println("- end set owner")
	return nil, nil
}

// ============================================================================================================================
// Init Owner - create a new owner aka end user, store into chaincode state
// ============================================================================================================================
func init_owner(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var err error
	fmt.Println("starting init_owner")

	// ex: ['"docType": "owner", "username": "bob", "company": "united marbles", "timestamp": 0}'] <- this is an array of strings with size 1
	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting 1")
	}

	var owner Owner
	json.Unmarshal([]byte(args[0]), &owner)                   //un stringify input, aka JSON.parse()
	owner.Username = strings.ToLower(owner.Username)
	//owner.Company = strings.ToLower(owner.Company)
	fmt.Println(owner)

	var fullOwner = owner.Username + "." + owner.Company;     //concat owners name and the company name

	//check if user already exists
	existingOwnerAsBytes, err := stub.GetState(fullOwner)     //this will always succeed, even if it doesn't exist
	if err != nil {
		fmt.Println("Failed to get owner - strange")
		return nil, errors.New("Failed to get owner - strange")
	}
	res := Owner{}
	json.Unmarshal(existingOwnerAsBytes, &res)
	fmt.Println(res)
	var existingFullOwner = res.Username + "." + res.Company;

	if existingFullOwner == fullOwner {
		fmt.Println("This owner already exists: " + fullOwner)
		return nil, errors.New("This owner arleady exists")   //all stop, a user by this name exists
	}

	//store user
	var ownerAsBytes []byte;
	json.Unmarshal(ownerAsBytes, &owner)
	err = stub.PutState(fullOwner, ownerAsBytes)              //store owner with concated name as key
	if err != nil {
		fmt.Println("Could not store user")
		return nil, err
	}

	//read existing owner index
	ownerIndexAsBytes, err := stub.GetState(ownerIndexStr)
	if err != nil {
		fmt.Println("Failed to get owner index")
		return nil, errors.New("Failed to get owner index")
	}
	var ownersIndex OwnersIndex
	json.Unmarshal(ownerIndexAsBytes, &ownersIndex)           //un stringify it aka JSON.parse()

	//append to list
	ownersIndex.Owners = append(ownersIndex.Owners, fullOwner)//add owner to index list
	fmt.Println("! owner index: ", ownersIndex.Owners)
	jsonAsBytes, _ := json.Marshal(ownersIndex)
	err = stub.PutState(ownerIndexStr, jsonAsBytes)           //store updated owner index

	fmt.Println("- end init_owner marble")
	return nil, nil
}
