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
	"errors"
	"fmt"
	"strconv"
	"encoding/json"
	"time"
	"strings"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {
}

var marbleIndexStr = "_marbleindex"				//name for the key/value that will store a list of all known marbles
var openTradesStr = "_opentrades"				//name for the key/value that will store all open trades

type Marble struct{
	Name string `json:"name"`					//the fieldtags are needed to keep case from bouncing around
	Keyword string `json:"keyword"`
	Sex int `json:"sex"`
}

type Description struct{
	Color string `json:"color"`
	Size int `json:"size"`
}


// ============================================================================================================================
// Main
// ============================================================================================================================
func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}

// ============================================================================================================================
// Init - reset all the things
// ============================================================================================================================
func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	var Aval int
	var err error

	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting 1")
	}

	// Initialize the chaincode
	Aval, err = strconv.Atoi(args[0])
	if err != nil {
		return nil, errors.New("Expecting integer value for asset holding")
	}

	// Write the state to the ledger
	err = stub.PutState("abc", []byte(strconv.Itoa(Aval)))				//making a test var "abc", I find it handy to read/write to it right away to test the network
	if err != nil {
		return nil, err
	}
	
	var empty []string
	jsonAsBytes, _ := json.Marshal(empty)								//marshal an emtpy array of strings to clear the index
	err = stub.PutState(marbleIndexStr, jsonAsBytes)
	if err != nil {
		return nil, err
	}
	
	var trades AllTrades
	jsonAsBytes, _ = json.Marshal(trades)								//clear the open trade struct
	err = stub.PutState(openTradesStr, jsonAsBytes)
	if err != nil {
		return nil, err
	}
	
	return nil, nil
}

// ============================================================================================================================
// Run - Our entry point for Invocations - [LEGACY] obc-peer 4/25/2016
// ============================================================================================================================
func (t *SimpleChaincode) Run(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	fmt.Println("run is running " + function)
	return t.Invoke(stub, function, args)
}

// ============================================================================================================================
// Invoke - Our entry point for Invocations
// ============================================================================================================================
func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	fmt.Println("invoke is running " + function)

	// Handle different functions
	if function == "init" {													//initialize the chaincode state, used as reset
		return t.Init(stub, "init", args)
	} else if function == "delete" {										//deletes an entity from its state
		res, err := t.Delete(stub, args)
		cleanTrades(stub)													//lets make sure all open trades are still valid
		return res, err
	} else if function == "write" {											//writes a value to the chaincode state
		return t.Write(stub, args)
	} else if function == "init_marble" {									//create a new marble
		return t.init_marble(stub, args)
	} else if function == "set_user" {										//change owner of a marble
		res, err := t.set_user(stub, args)
		cleanTrades(stub)													//lets make sure all open trades are still valid
		return res, err
	} else if function == "open_trade" {									//create a new trade order
		return t.open_trade(stub, args)
	} else if function == "perform_trade" {									//forfill an open trade order
		res, err := t.perform_trade(stub, args)
		cleanTrades(stub)													//lets clean just in case
		return res, err
	} else if function == "remove_trade" {									//cancel an open trade order
		return t.remove_trade(stub, args)
	}
	fmt.Println("invoke did not find func: " + function)					//error

	return nil, errors.New("Received unknown function invocation")
}

// ============================================================================================================================
// Query - Our entry point for Queries
// ============================================================================================================================
func (t *SimpleChaincode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	fmt.Println("query is running " + function)

	// Handle different functions
	if function == "read" {													//read a variable
		return t.read(stub, args)
	}
	fmt.Println("query did not find func: " + function)						//error

	return nil, errors.New("Received unknown function query")
}

// ============================================================================================================================
// Read - read a variable from chaincode state
// ============================================================================================================================
func (t *SimpleChaincode) read(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var name, jsonResp string
	var err error

	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting name of the var to query")
	}

	name = args[0]
	valAsbytes, err := stub.GetState(name)									//get the var from chaincode state
	if err != nil {
		jsonResp = "{\"Error\":\"Failed to get state for " + name + "\"}"
		return nil, errors.New(jsonResp)
	}

	return valAsbytes, nil													//send it onward
}

// ============================================================================================================================
// Delete - remove a key/value pair from state
// ============================================================================================================================
func (t *SimpleChaincode) Delete(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting 1")
	}
	
	name := args[0]
	err := stub.DelState(name)													//remove the key from chaincode state
	if err != nil {
		return nil, errors.New("Failed to delete state")
	}

	//get the marble index
	marblesAsBytes, err := stub.GetState(marbleIndexStr)
	if err != nil {
		return nil, errors.New("Failed to get marble index")
	}
	var marbleIndex []string
	json.Unmarshal(marblesAsBytes, &marbleIndex)								//un stringify it aka JSON.parse()
	
	//remove marble from index
	for i,val := range marbleIndex{
		fmt.Println(strconv.Itoa(i) + " - looking at " + val + " for " + name)
		if val == name{															//find the correct marble
			fmt.Println("found marble")
			marbleIndex = append(marbleIndex[:i], marbleIndex[i+1:]...)			//remove it
			for x:= range marbleIndex{											//debug prints...
				fmt.Println(string(x) + " - " + marbleIndex[x])
			}
			break
		}
	}
	jsonAsBytes, _ := json.Marshal(marbleIndex)									//save new index
	err = stub.PutState(marbleIndexStr, jsonAsBytes)
	return nil, nil
}

// ============================================================================================================================
// Write - write variable into chaincode state
// ============================================================================================================================
func (t *SimpleChaincode) Write(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var name, value string // Entities
	var err error
	fmt.Println("running write()")

	if len(args) != 2 {
		return nil, errors.New("Incorrect number of arguments. Expecting 2. name of the variable and value to set")
	}

	name = args[0]															//rename for funsies
	value = args[1]
	err = stub.PutState(name, []byte(value))								//write the variable into the chaincode state
	if err != nil {
		return nil, err
	}
	return nil, nil
}

// ============================================================================================================================
// Init Marble - create a new marble, store into chaincode state
// ============================================================================================================================
func (t *SimpleChaincode) init_marble(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var err error

	//   0       1       2     
	// "Tom", "12345", "man"	
     if len(args) != 3 {
		return nil, errors.New("Incorrect number of arguments. Expecting 3")
	}

	//input sanitation
	fmt.Println("- start create user")
	if len(args[0]) <= 0 {
		return nil, errors.New("1st argument must be a non-empty string")
	}
	if len(args[1]) <= 0 {
		return nil, errors.New("2nd argument must be a non-empty string")
	}
	if len(args[2]) <= 0 {
		return nil, errors.New("3rd argument must be a non-empty string")
	}

	name := args[0]
	keyword := args[1]
	sex := args[2]
	

	//check if user already exists
	marbleAsBytes, err := stub.GetState(name)
	if err != nil {
		return nil, errors.New("Failed to get user name")
	}
	res := User{}
	json.Unmarshal(marbleAsBytes, &res)
	if res.Name == name{
		fmt.Println("This user arleady exists: " + name)
		fmt.Println(res);
		return nil, errors.New("This user arleady exists")		
	}
	
	//build the marble json string manually
	str := `{"name": "` + name + `", "keyword": "` + keyword + `", "sex":" `+sex + `"}`
	err = stub.PutState(name, []byte(str))									//store marble with id as key
	if err != nil {
		return nil, err
	}
		
	//get the user index
	marblesAsBytes, err := stub.GetState(marbleIndexStr)
	if err != nil {
		return nil, errors.New("Failed to get user index")
	}
	var marbleIndex []string
	json.Unmarshal(marblesAsBytes, &marbleIndex)							//un stringify it aka JSON.parse()
	
	//append
	marbleIndex = append(marbleIndex, name)									//add user name to index list
	fmt.Println("! user index: ", marbleIndex)
	jsonAsBytes, _ := json.Marshal(marbleIndex)
	err = stub.PutState(marbleIndexStr, jsonAsBytes)						//store name of user

	fmt.Println("- end create user")
	return nil, nil
}

// ============================================================================================================================
// Set User Permission on Marble
// ============================================================================================================================
func (t *SimpleChaincode) set_user(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	
	return nil, nil
}

// ============================================================================================================================
// Open Trade - create an open trade for a marble you want with marbles you have 
// ============================================================================================================================
func (t *SimpleChaincode) open_trade(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {

	return nil, nil
}

// ============================================================================================================================
// Perform Trade - close an open trade and move ownership
// ============================================================================================================================
func (t *SimpleChaincode) perform_trade(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	
	return nil, nil
}

// ============================================================================================================================
// findMarble4Trade - look for a matching marble that this user owns and return it
// ============================================================================================================================
func findMarble4Trade(stub shim.ChaincodeStubInterface, user string, color string, size int )(m Marble, err error){
	
		res := Marble{}
		return res, nil
	
}

// ============================================================================================================================
// Make Timestamp - create a timestamp in ms
// ============================================================================================================================
func makeTimestamp() int64 {
    return time.Now().UnixNano() / (int64(time.Millisecond)/int64(time.Nanosecond))
}

// ============================================================================================================================
// Remove Open Trade - close an open trade
// ============================================================================================================================
func (t *SimpleChaincode) remove_trade(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	
	return nil, nil
}

// ============================================================================================================================
// Clean Up Open Trades - make sure open trades are still possible, remove choices that are no longer possible, remove trades that have no valid choices
// ============================================================================================================================
func cleanTrades(stub shim.ChaincodeStubInterface)(err error){
	
	return nil
}
