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
// delete_marble - remove a marble from state and from marble index
// ============================================================================================================================
func delete_marble(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	fmt.Println("starting delete_marble")

	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting 1")
	}

	name := args[0]

	//remove the marble
	err := stub.DelState(name) //remove the key from chaincode state
	if err != nil {
		return nil, errors.New("Failed to delete state")
	}

	//get the marble index
	marblesAsBytes, err := stub.GetState(marbleIndexStr)
	if err != nil {
		return nil, errors.New("Failed to get marble index")
	}
	var marblesIndex MarblesIndex
	json.Unmarshal(marblesAsBytes, &marblesIndex) //un stringify it aka JSON.parse()

	//remove marble from index
	for i, val := range marblesIndex.Marbles {
		fmt.Println(strconv.Itoa(i) + " - looking at " + val + " for " + name)
		if val == name { //find the correct marble
			fmt.Println("found marble")
			marblesIndex.Marbles = append(marblesIndex.Marbles[:i], marblesIndex.Marbles[i+1:]...) //remove it
			for x := range marblesIndex.Marbles {                                                  //debug prints...
				fmt.Println(string(x) + " - " + marblesIndex.Marbles[x])
			}
			break
		}
	}
	jsonAsBytes, _ := json.Marshal(marblesIndex) //save new index
	err = stub.PutState(marbleIndexStr, jsonAsBytes)

	fmt.Println("- end delete_marble")
	return nil, nil
}


// ============================================================================================================================
// Init Marble - create a new marble, store into chaincode state
// ============================================================================================================================
func init_marble(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var err error
	fmt.Println("starting init_marble")

	//   0       1       2     3
	// "asdf", "blue", "35", "bob"
	if len(args) != 4 {
		return nil, errors.New("Incorrect number of arguments. Expecting 4")
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
	name := args[0]
	color := strings.ToLower(args[1])
	owner := strings.ToLower(args[3])
	size, err := strconv.Atoi(args[2])
	if err != nil {
		return nil, errors.New("3rd argument must be a numeric string")
	}

	//check if marble already exists
	marbleAsBytes, err := stub.GetState(name)
	if err != nil {
		return nil, errors.New("Failed to get marble name")
	}
	res := Marble{}
	json.Unmarshal(marbleAsBytes, &res)
	if res.Name == name {
		fmt.Println("This marble arleady exists: " + name)
		fmt.Println(res)
		return nil, errors.New("This marble arleady exists") //all stop a marble by this name exists
	}

	//build the marble json string manually
	str := `{"docType":"Marble",  "name": "` + name + `", "color": "` + color + `", "size": ` + strconv.Itoa(size) + `, "owner": "` + owner + `"}`
	err = stub.PutState(name, []byte(str)) //store marble with id as key
	if err != nil {
		return nil, err
	}

	//get the marble index
	marblesAsBytes, err := stub.GetState(marbleIndexStr)
	if err != nil {
		return nil, errors.New("Failed to get marble index")
	}
	var marblesIndex MarblesIndex
	json.Unmarshal(marblesAsBytes, &marblesIndex) //un stringify it aka JSON.parse()

	//append
	marblesIndex.Marbles = append(marblesIndex.Marbles, name) //add marble name to index list
	fmt.Println("! marble index: ", marblesIndex.Marbles)
	jsonAsBytes, _ := json.Marshal(marblesIndex)
	err = stub.PutState(marbleIndexStr, jsonAsBytes) //store name of marble

	fmt.Println("- end init_marble")
	return nil, nil
}
