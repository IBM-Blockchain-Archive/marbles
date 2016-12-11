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
	"strconv"
	"strings"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// ============================================================================================================================
// Get Marble
// ============================================================================================================================
func get_marble(stub shim.ChaincodeStubInterface, name string) (Marble, error) {
	var marble Marble
	marbleAsBytes, err := stub.GetState(name)
	if err != nil {
		return marble, errors.New("Failed to find marble: " + name)
	}
	json.Unmarshal(marbleAsBytes, &marble)                   //un stringify it aka JSON.parse()

	if marble.Name != name {                                 //test if marble is actually here or just nil
		return marble, errors.New("Marble does not exist: " + name)
	}

	return marble, nil
}

// ============================================================================================================================
// Get Array of All Marble Names
// ============================================================================================================================
func get_complete_marble_index(stub shim.ChaincodeStubInterface) ([]byte, error) {
	var completedMarbleIndex [] string
	var ownersIndex OwnersIndex

	//read owner index
	ownersIndex, err := get_complete_owner_index(stub)
	if err != nil {
		fmt.Println("Failed to get owner index")
		return nil, errors.New("Failed to get owner index")
	}

	for i:= range ownersIndex.Owners{                                      //iter through all the owners
		var owner Owner
		owner, err = get_owner_full(stub, ownersIndex.Owners[i])
		if err != nil {
			fmt.Println("Could not find owner from index: " + ownersIndex.Owners[i])
			return nil, err
		}
		
		//append to array
		completedMarbleIndex = append(completedMarbleIndex, owner.Marbles...) //add this owner's marble list to complete list
		fmt.Println("marble index so far: ", completedMarbleIndex)
	}

	//change to array of bytes
	arrayAsBytes, _ := json.Marshal(completedMarbleIndex)
	return arrayAsBytes, nil
}

// ============================================================================================================================
// delete_marble - remove a marble from state and from marble index
// ============================================================================================================================
func delete_marble(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	fmt.Println("starting delete_marble")

	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting 1")
	}

	name := args[0]

	//get the marble
	marble, err := get_marble(stub, name)
	if err != nil{
		fmt.Println("Failed to find marble by name " + name)
		return nil, err
	}

	//remove the marble
	err = stub.DelState(name) //remove the key from chaincode state
	if err != nil {
		return nil, errors.New("Failed to delete state")
	}

	//get the marble index from owner
	owner, err := get_owner(stub, marble.Owner.Username, marble.Owner.Company)
	if err != nil {
		fmt.Println("Failed to find owner: " + marble.Owner.Username + " " + marble.Owner.Company)
		return nil, err
	}

	//remove marble from index
	for i, val := range owner.Marbles {
		fmt.Println(strconv.Itoa(i) + " - looking at " + val + " for " + name)
		if val == name {                                                      //find the correct marble
			fmt.Println("found marble")
			owner.Marbles = append(owner.Marbles[:i], owner.Marbles[i+1:]...) //remove it
			for x := range owner.Marbles {                                    //debug prints...
				fmt.Println(string(x) + " - " + owner.Marbles[x])
			}
			break
		}
	}
	var fullOwner = build_full_owner(marble.Owner.Username, marble.Owner.Company);
	jsonAsBytes, _ := json.Marshal(owner)                                     //save new index
	err = stub.PutState(fullOwner, jsonAsBytes)

	fmt.Println("- end delete_marble")
	return nil, nil
}


// ============================================================================================================================
// Init Marble - create a new marble, store into chaincode state
// ============================================================================================================================
func init_marble(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var err error
	fmt.Println("starting init_marble")

	//   0       1       2     3      4
	// "asdf", "blue", "35", "bob", "united marbles"
	if len(args) != 5 {
		return nil, errors.New("Incorrect number of arguments. Expecting 5")
	}

	//input sanitation
	if len(args[0]) <= 0 {
		return nil, errors.New("1st argument must be a non-empty string")
	}
	if len(args[1]) <= 0 {
		return nil, errors.New("2nd argument must be a non-empty string")
	}
	if len(args[2]) <= 0 {
		return nil, errors.New("3rd argument must be a non-empty string")
	}
	if len(args[3]) <= 0 {
		return nil, errors.New("4th argument must be a non-empty string")
	}
	if len(args[4]) <= 0 {
		return nil, errors.New("5th argument must be a non-empty string")
	}
	name := args[0]
	color := strings.ToLower(args[1])
	username := strings.ToLower(args[3])
	company := args[4]
	size, err := strconv.Atoi(args[2])
	if err != nil {
		return nil, errors.New("3rd argument must be a numeric string")
	}

	//check if marble already exists
	marble, err := get_marble(stub, name)
	if err == nil {
		fmt.Println("This marble already exists: " + name)
		fmt.Println(marble)
		return nil, errors.New("This marble already exists: " + name) //all stop a marble by this name exists
	}

	//build the marble json string manually
	str := `{"docType":"marble",  "name": "` + name + `", "color": "` + color + `", "size": ` + strconv.Itoa(size) + `, "owner": {"username": "` + username + `", "company": "` + company + `"}}`
	err = stub.PutState(name, []byte(str))                     //store marble with id as key
	if err != nil {
		return nil, err
	}

	//get the marble index from owner
	owner, err := get_owner(stub, username, company)
	if err != nil {
		fmt.Println("Failed to find owner: " + username + " " + company)
		return nil, err
	}

	//append
	var fullOwner = build_full_owner(username, company);
	owner.Marbles = append(owner.Marbles, name)                //add marble name to index list
	fmt.Println("! marble index: ", owner.Marbles)
	jsonAsBytes, _ := json.Marshal(owner)
	err = stub.PutState(fullOwner, jsonAsBytes)                //store name of marble

	fmt.Println("- end init_marble")
	return nil, nil
}
