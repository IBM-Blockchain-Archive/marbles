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
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {
}

// ============================================================================================================================
// Asset Definitions
// ============================================================================================================================

// ----- Marbles ----- //
type Marble struct {
	ObjectType string        `json:"docType"`
	Name       string        `json:"name"`     //the fieldtags are needed to keep case from bouncing around
	Color      string        `json:"color"`
	Size       int           `json:"size"`
	Owner      OwnerRelation `json:"owner"`
}

// ----- Owners ----- //
var ownerIndexStr = "_ownerindex"             //name for the key/value that will store a list of all known owners
type Owner struct {
	ObjectType string `json:"docType"`
	Username   string `json:"username"`
	Company    string `json:"company"`
	Timestamp  int64  `json:"timestamp"`      //utc timestamp of registration
	Marbles  []string `json:"marbles"`        //list of marbles names
}
type OwnersIndex struct {
	ObjectType string   `json:"docType"`
	Owners    []string  `json:"owners"`
}
type OwnerRelation struct {
	Username   string `json:"username"`
	Company    string `json:"company"`
}

// ============================================================================================================================
// Main
// ============================================================================================================================
func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode - %s", err)
	}
}


// ============================================================================================================================
// Init - reset all the things
// ============================================================================================================================
func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("Marbles Is Starting Up")
	_, args := stub.GetFunctionAndParameters()
	var Aval int
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	// Initialize the chaincode
	Aval, err = strconv.Atoi(args[0])
	if err != nil {
		return shim.Error("Expecting integer value for asset holding")
	}

	// Write the state to the ledger
	err = stub.PutState("abc", []byte(strconv.Itoa(Aval))) //making a test var "abc", I find it handy to read/write to it right away to test the network
	if err != nil {
		return shim.Error(err.Error())
	}

	var owner OwnersIndex
	owner.ObjectType = "OwnerIndex"
	jsonAsBytes, _ := json.Marshal(owner)         //owner is empty, this clears the owner index
	err = stub.PutState(ownerIndexStr, jsonAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println(" - ready for action")
	return shim.Success(nil)
}


// ============================================================================================================================
// Invoke - Our entry point for Invocations
// ============================================================================================================================
func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	function, args := stub.GetFunctionAndParameters()
	fmt.Println(" ")
	fmt.Println("starting invoke, for - " + function)

	// Handle different functions
	if function == "init" {                   //initialize the chaincode state, used as reset
		return t.Init(stub)
	} else if function == "delete_marble" {   //deletes a marble from state
		return delete_marble(stub, args)
	} else if function == "write" {           //generic writes to ledger
		return write(stub, args)
	} else if function == "init_marble" {     //create a new marble
		return init_marble(stub, args)
	} else if function == "set_owner" {       //change owner of a marble
		return set_owner(stub, args)
	} else if function == "read" {            //generic read ledger
		return read(stub, args)
	}else if function == "init_owner"{        //create a new marble owner
		return init_owner(stub, args)
	}else if function == "read_marble_index"{ //read marble/owner mapping
		return read_marble_index(stub)
	}else if function == "read_everything"{   //read everything, (owners + marbles + companies)
		return read_everything(stub)
	}

	// error out
	fmt.Println("Received unknown invoke function name - " + function)
	return shim.Error("Received unknown invoke function name - '" + function + "'")
}


// ============================================================================================================================
// Query - legacy function
// ============================================================================================================================
func (t *SimpleChaincode) Query(stub shim.ChaincodeStubInterface) pb.Response {
	return shim.Error("Unknown supported call - Query()")
}


// ========================================================
// Make Timestamp - create a timestamp in ms
// ========================================================
func makeTimestamp() int64 {
	return time.Now().UnixNano() / (int64(time.Millisecond) / int64(time.Nanosecond))
}


// ========================================================
// Input Sanitation - dumb input checking, look for empty strings
// ========================================================
func sanitize_arguments(strs []string) error{
	for i, val:= range strs {
		if len(val) <= 0 {
			return errors.New("Argument " + strconv.Itoa(i) + " must be a non-empty string")
		}
		if len(val) > 32 {
			return errors.New("Argument " + strconv.Itoa(i) + " must be <= 32 characters")
		}
	}
	return nil
}