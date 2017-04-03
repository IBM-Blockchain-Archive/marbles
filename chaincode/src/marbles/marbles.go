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
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {
}

// ============================================================================================================================
// Asset Definitions - The ledger will store marbles and owners
// ============================================================================================================================

// ----- Marbles ----- //
type Marble struct {
	ObjectType string        `json:"docType"` //field for couchdb
	Id       string          `json:"id"`      //the fieldtags are needed to keep case from bouncing around
	Color      string        `json:"color"`
	Size       int           `json:"size"`    //size in mm of marble
	Owner      OwnerRelation `json:"owner"`
}

// ----- Owners ----- //
type Owner struct {
	ObjectType string `json:"docType"`     //field for couchdb
	Id         string `json:"id"`
	Username   string `json:"username"`
	Company    string `json:"company"`
}

type OwnerRelation struct {
	Id         string `json:"id"`
	Username   string `json:"username"`    //this is mostly cosmetic/handy, the real relation is by Id not Username
	Company    string `json:"company"`     //this is mostly cosmetic/handy, the real relation is by Id not Company
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
// Init - initialize the chaincode - marbles don’t need anything initlization, so let's run a dead simple test instead
// ============================================================================================================================
func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("Marbles Is Starting Up")
	_, args := stub.GetFunctionAndParameters()
	var Aval int
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	// convert numeric string to integer
	Aval, err = strconv.Atoi(args[0])
	if err != nil {
		return shim.Error("Expecting a numeric string argument to Init()")
	}

	// store compaitible marbles application version
	err = stub.PutState("marbles_ui", []byte("3.5.0"))
	if err != nil {
		return shim.Error(err.Error())
	}

	// this is a very simple dumb test.  let's write to the ledger and error on any errors
	err = stub.PutState("selftest", []byte(strconv.Itoa(Aval))) //making a test var "selftest", its handy to read this right away to test the network
	if err != nil {
		return shim.Error(err.Error())                          //self-test fail
	}

	fmt.Println(" - ready for action")                          //self-test pass
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
	if function == "init" {                    //initialize the chaincode state, used as reset
		return t.Init(stub)
	} else if function == "read" {             //generic read ledger
		return read(stub, args)
	} else if function == "write" {            //generic writes to ledger
		return write(stub, args)
	} else if function == "delete_marble" {    //deletes a marble from state
		return delete_marble(stub, args)
	} else if function == "init_marble" {      //create a new marble
		return init_marble(stub, args)
	} else if function == "set_owner" {        //change owner of a marble
		return set_owner(stub, args)
	} else if function == "init_owner"{        //create a new marble owner
		return init_owner(stub, args)
	} else if function == "read_everything"{   //read everything, (owners + marbles + companies)
		return read_everything(stub)
	} else if function == "getHistory"{        //read history of a marble (audit)
		return getHistory(stub, args)
	} else if function == "getMarblesByRange"{ //read a bunch of marbles by start and stop id
		return getMarblesByRange(stub, args)
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
