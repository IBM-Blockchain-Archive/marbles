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
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// ============================================================================================================================
// Read - read a generic variable from ledger
// ============================================================================================================================
func read(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var name, jsonResp string
	var err error
	fmt.Println("starting read")

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting name of the var to query")
	}

	// input sanitation
	err = sanitize_arguments(args)
	if err != nil {
		return shim.Error(err.Error())
	}

	name = args[0]
	valAsbytes, err := stub.GetState(name)           //get the var from ledger
	if err != nil {
		jsonResp = "{\"Error\":\"Failed to get state for " + name + "\"}"
		return shim.Error(jsonResp)
	}

	fmt.Println("- end read")
	return shim.Success(valAsbytes)                  //send it onward
}

// ============================================================================================================================
// Get everything we need (owners + marbles + companies)
// ============================================================================================================================
func read_everything(stub shim.ChaincodeStubInterface) pb.Response {
	type Everything struct {
		OwnersIndex  []string    `json:"owners_index"`
		Marbles      []Marble    `json:"marbles"`
	}
	var everything Everything

	//get owner index
	owners_index, err := get_complete_owner_index(stub)
	if err != nil{
		return shim.Error(err.Error())
	}
	everything.OwnersIndex = owners_index.Owners

	//get marble index
	completedMarbleIndex, err := get_complete_marble_index(stub)
	if err != nil{
		return shim.Error(err.Error())
	}

	//get all marbles
	for i:= range completedMarbleIndex{                           //iter through all the marbles
		var marble Marble
		marble, err = get_marble(stub, completedMarbleIndex[i])
		if err != nil {
			fmt.Println("Could not find marble from index - " + completedMarbleIndex[i])
			continue
		}
		
		//append to array
		everything.Marbles = append(everything.Marbles, marble)   //add this marble to the list
	}
	fmt.Println("marble index - ", everything.Marbles)

	//change to array of bytes
	arrayAsBytes, _ := json.Marshal(everything)
	return shim.Success(arrayAsBytes)
}


// ============================================================================================================================
// Get complete marble index
// ============================================================================================================================
func read_marble_index(stub shim.ChaincodeStubInterface) pb.Response {
	tmp, err := get_complete_marble_index(stub)
	arrayAsBytes, err := json.Marshal(tmp)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(arrayAsBytes)
}