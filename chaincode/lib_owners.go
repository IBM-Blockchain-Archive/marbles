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
// Build Full Owner Key
// ============================================================================================================================
func build_full_owner(username string, company string) (string) {
	return username + "." + company;      //concat owners name and the company name
}

// ============================================================================================================================
// Get Owner
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
// Get Array of All Owners
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
	var new_company = args[2]
	var authed_by_company = args[3]
	fmt.Println(marble_id + "->" + new_user + " - " + new_company + "|" + authed_by_company)

	// get marble's current state 
	marbleAsBytes, err := stub.GetState(marble_id)
	if err != nil {
		return nil, errors.New("Failed to get marble")
	}
	res := Marble{}
	json.Unmarshal(marbleAsBytes, &res)          //un stringify it aka JSON.parse()

	//check authorizing company
	if res.Owner.Company != authed_by_company{
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

	//     0          1
	// ex: "bob", "united marbles"
	if len(args) != 2 {
		return nil, errors.New("Incorrect number of arguments. Expecting 2")
	}

	//input sanitation
	if len(args[0]) <= 0 {
		return nil, errors.New("1st argument must be a non-empty string")
	}
	if len(args[1]) <= 0 {
		return nil, errors.New("2nd argument must be a non-empty string")
	}
	if len(args[0]) > 32 {
		return nil, errors.New("1st argument must be <= 32 characters")
	}
	if len(args[1]) > 32 {
		return nil, errors.New("2nd argument must be <= 32 characters")
	}
	
	var owner Owner
	json.Unmarshal([]byte(args[0]), &owner)                          //un stringify input, aka JSON.parse()
	owner.ObjectType = "marble_owner"
	owner.Username = strings.ToLower(args[0])
	owner.Company = args[1]
	owner.Timestamp = makeTimestamp()
	fmt.Println(owner)

	var fullOwner = build_full_owner(owner.Username, owner.Company); //concat owners name and the company name

	//check if user already exists
	_, err = get_owner(stub, owner.Username, owner.Company)
	if err == nil {
		fmt.Println("This owner already exists - " + owner.Username + " " + owner.Company)
		return nil, errors.New("This owner already exists - " + owner.Username + " " + owner.Company)
	}

	//store user
	ownerAsBytes, _ := json.Marshal(owner)
	err = stub.PutState(fullOwner, ownerAsBytes)              //store owner with concated name as key
	if err != nil {
		fmt.Println("Could not store user")
		return nil, err
	}

	//read existing owner index
	ownersIndex, err := get_complete_owner_index(stub)
	if err != nil {
		fmt.Println("Failed to get owner index")
		return nil, errors.New("Failed to get owner index")
	}

	//append to list
	ownersIndex.Owners = append(ownersIndex.Owners, fullOwner)              //add owner to index list
	fmt.Println("! owner index - ", ownersIndex.Owners)
	jsonAsBytes, _ := json.Marshal(ownersIndex)
	err = stub.PutState(ownerIndexStr, jsonAsBytes)           //store updated owner index

	fmt.Println("- end init_owner marble")
	return nil, nil
}
