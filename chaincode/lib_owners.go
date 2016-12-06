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
	//"strings"
	//"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// ============================================================================================================================
// Set Owner Permission on Marble
// ============================================================================================================================
func set_owner(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var err error

	//   0       1
	// "name", "bob"
	if len(args) < 2 {
		return nil, errors.New("Incorrect number of arguments. Expecting 2")
	}

	fmt.Println("- start set owner")
	fmt.Println(args[0] + " - " + args[1])
	marbleAsBytes, err := stub.GetState(args[0])
	if err != nil {
		return nil, errors.New("Failed to get thing")
	}
	res := Marble{}
	json.Unmarshal(marbleAsBytes, &res) //un stringify it aka JSON.parse()
	res.Owner = args[1]                 //change the owner

	jsonAsBytes, _ := json.Marshal(res)
	err = stub.PutState(args[0], jsonAsBytes) //rewrite the marble with id as key
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
	json.Unmarshal([]byte(args[0]), &owner) //un stringify input, aka JSON.parse()
	fmt.Println(owner)

	var ownerName = owner.Username + "." + owner.Company;//concat owners name and the company name

	//check if user already exists
	ownerAsBytes, err := stub.GetState(ownerName)
	if err != nil {
		fmt.Println("Failed to get owner ")
		return nil, errors.New("Failed to get owner")
	}
	res := Owner{}
	json.Unmarshal(ownerAsBytes, &res)
	if res.Username == owner.Username {
		fmt.Println("This owner already exists: " + ownerName)
		fmt.Println(res)
		return nil, errors.New("This owner arleady exists") //all stop a marble by this name exists
	}

	//store user
	json.Unmarshal(ownerAsBytes, &owner)
	err = stub.PutState(ownerName, ownerAsBytes) 			//store owner with concated name as key
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
	json.Unmarshal(ownerIndexAsBytes, &ownersIndex) 		//un stringify it aka JSON.parse()

	//append to list
	ownersIndex.Owners = append(ownersIndex.Owners, ownerName) //add owner to index list
	fmt.Println("! owner index: ", ownersIndex.Owners)
	jsonAsBytes, _ := json.Marshal(ownersIndex)
	err = stub.PutState(ownerIndexStr, jsonAsBytes) 			//store updated owner index

	fmt.Println("- end init_owner marble")
	return nil, nil
}
