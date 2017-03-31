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
	"strconv"
	"strings"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// ============================================================================================================================
// Write - genric write variable into ledger
// ============================================================================================================================
func write(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var key, value string                           // Entities
	var err error
	fmt.Println("starting write")

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2. key of the variable and value to set")
	}

	// input sanitation
	err = sanitize_arguments(args)
	if err != nil {
		return shim.Error(err.Error())
	}

	key = args[0]                                   //rename for funsies
	value = args[1]
	err = stub.PutState(key, []byte(value))         //write the variable into the ledger
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end write")
	return shim.Success(nil)
}

// ============================================================================================================================
// delete_marble - remove a marble from state and from marble index
// ============================================================================================================================
func delete_marble(stub shim.ChaincodeStubInterface, args []string) (pb.Response) {
	fmt.Println("starting delete_marble")

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	// input sanitation
	err := sanitize_arguments(args)
	if err != nil {
		return shim.Error(err.Error())
	}

	id := args[0]
	authed_by_company := args[1]

	//get the marble
	marble, err := get_marble(stub, id)
	if err != nil{
		fmt.Println("Failed to find marble by id " + id)
		return shim.Error(err.Error())
	}

	//check authorizing company
	if marble.Owner.Company != authed_by_company{
		return shim.Error("The company '" + authed_by_company + "' cannot authorize deletion for '" + marble.Owner.Company + "'.")
	}

	//remove the marble
	err = stub.DelState(id)                                                 //remove the key from chaincode state
	if err != nil {
		return shim.Error("Failed to delete state")
	}

	//get the marble index from owner
	/*owner, err := get_owner(stub, marble.Owner.Username, marble.Owner.Company)
	if err != nil {
		fmt.Println("Failed to find owner - " + marble.Owner.Username + " " + marble.Owner.Company)
		return shim.Error(err.Error())
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
	err = stub.PutState(fullOwner, jsonAsBytes)*/

	fmt.Println("- end delete_marble")
	return shim.Success(nil)
}

// ============================================================================================================================
// Init Marble - create a new marble, store into chaincode state
// ============================================================================================================================
func init_marble(stub shim.ChaincodeStubInterface, args []string) (pb.Response) {
	var err error
	fmt.Println("starting init_marble")

	//    0  ,   1 ,       2     ,       3
	//  color, size,     owner id, 
	// "blue", "35", "<owner id>", "united marbles"
	if len(args) != 4 {
		return shim.Error("Incorrect number of arguments. Expecting 4")
	}

	//input sanitation
	err = sanitize_arguments(args)
	if err != nil {
		return shim.Error(err.Error())
	}

	id := "m" + strconv.FormatInt(makeTimestamp(), 10);     //int64, base
	color := strings.ToLower(args[0])
	owner_id := strings.ToLower(args[2])
	//username := strings.ToLower(args[2])
	//company := args[3]
	authed_by_company := args[3]
	size, err := strconv.Atoi(args[1])
	if err != nil {
		return shim.Error("2nd argument must be a numeric string")
	}

	//check if new owner exists
	owner, err := get_owner(stub, owner_id)
	if err != nil {
		fmt.Println("Failed to find owner - " + owner_id)
		return shim.Error(err.Error())
	}

	//check authorizing company
	if owner.Company != authed_by_company{
		return shim.Error("The company '" + authed_by_company + "' cannot authorize creation for '" + owner.Company + "'.")
	}

	//check if marble id already exists
	marble, err := get_marble(stub, id)
	if err == nil {
		fmt.Println("This marble already exists - " + id)
		fmt.Println(marble)
		return shim.Error("This marble already exists - " + id)  //all stop a marble by this id exists
	}

	//build the marble json string manually
	str := `{
		"docType":"marble", 
		"name": "` + id + `", 
		"color": "` + color + `", 
		"size": ` + strconv.Itoa(size) + `, 
		"owner": {
			"id": "` + owner_id + `", 
			"username": "` + owner.Username + `", 
			"company": "` + owner.Company + `"
		}
	}`
	err = stub.PutState(id, []byte(str))                         //store marble with id as key
	if err != nil {
		return shim.Error(err.Error())
	}

	/*
	//append
	var fullOwner = build_full_owner(username, company);
	owner.Marbles = append(owner.Marbles, id)                     //add marble id to index list
	fmt.Println("! marble index - ", owner.Marbles)
	jsonAsBytes, _ := json.Marshal(owner)
	err = stub.PutState(fullOwner, jsonAsBytes)                   //store id of marble
	*/

	fmt.Println("- end init_marble")
	return shim.Success(nil)
}

// ============================================================================================================================
// Set Owner on Marble
// ============================================================================================================================
func set_owner(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error
	fmt.Println("starting set_owner")

	//todo! dsh - get the "company that authed the transfer" from the certificate instead of an argument
	//should be possible since we can now add attributes to tx cert during
	//as is this is broken (security wise), but it's much easier to demo...

	//   0   ,     1  ,        2                 3                4
	// marble, to user,      to company ,  to owner id  , company that auth the transfer
	// "name",   "bob", "united_marbles", "o99999999999", united_mables" 
	if len(args) != 5 {
		return shim.Error("Incorrect number of arguments. Expecting 5")
	}

	// input sanitation
	err = sanitize_arguments(args)
	if err != nil {
		return shim.Error(err.Error())
	}

	var marble_id = args[0]
	var new_user = strings.ToLower(args[1])
	var new_company = args[2]
	var new_owner_id = args[3]
	var authed_by_company = args[4]
	fmt.Println(marble_id + "->" + new_user + " - " + new_company + "|" + authed_by_company)

	// get marble's current state 
	marbleAsBytes, err := stub.GetState(marble_id)
	if err != nil {
		return shim.Error("Failed to get marble")
	}
	res := Marble{}
	json.Unmarshal(marbleAsBytes, &res)          //un stringify it aka JSON.parse()

	//check authorizing company
	if res.Owner.Company != authed_by_company{
		return shim.Error("The company '" + authed_by_company + "' cannot authorize transfers for '" + res.Owner.Company + "'.")
	}

	//transfer the marble
	res.Owner.Id = new_owner_id                   //change the owner
	res.Owner.Username = new_user                 //change the owner
	res.Owner.Company = new_company               //change the owner
	jsonAsBytes, _ := json.Marshal(res)
	err = stub.PutState(args[0], jsonAsBytes)    //rewrite the marble with id as key
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end set owner")
	return shim.Success(nil)
}

// ============================================================================================================================
// Init Owner - create a new owner aka end user, store into chaincode state
// ============================================================================================================================
func init_owner(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error
	fmt.Println("starting init_owner")

	//     0          1
	// ex: "bob", "united marbles"
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	//input sanitation
	err = sanitize_arguments(args)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	var owner Owner
	json.Unmarshal([]byte(args[0]), &owner)                          //un stringify input, aka JSON.parse()
	owner.ObjectType = "marble_owner"
	owner.Id = "o" + strconv.FormatInt(makeTimestamp(), 10);         //int64, base
	owner.Username = strings.ToLower(args[0])
	owner.Company = args[1]
	owner.Timestamp = makeTimestamp()
	fmt.Println(owner)

	//var fullOwner = build_full_owner(owner.Username, owner.Company); //concat owners name and the company name

	//store user
	ownerAsBytes, _ := json.Marshal(owner)
	err = stub.PutState(owner.Id, ownerAsBytes)                     //store owner by its Id
	if err != nil {
		fmt.Println("Could not store user")
		return shim.Error(err.Error())
	}

	//read existing owner index
	ownersIndex, err := get_complete_owner_index(stub)
	if err != nil {
		fmt.Println("Failed to get owner index")
		return shim.Error("Failed to get owner index")
	}

	//append to list
	ownersIndex.Owners = append(ownersIndex.Owners, owner.Id)     //add owner to index list
	fmt.Println("! owner index - ", ownersIndex.Owners)
	jsonAsBytes, _ := json.Marshal(ownersIndex)
	err = stub.PutState(ownerIndexStr, jsonAsBytes)                //store updated owner index

	fmt.Println("- end init_owner marble")
	return shim.Success(nil)
}
