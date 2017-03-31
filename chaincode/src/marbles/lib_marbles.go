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

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// ============================================================================================================================
// Get Marble
// ============================================================================================================================
func get_marble(stub shim.ChaincodeStubInterface, name string) (Marble, error) {
	var marble Marble
	marbleAsBytes, err := stub.GetState(name)
	if err != nil {
		return marble, errors.New("Failed to find marble - " + name)
	}
	json.Unmarshal(marbleAsBytes, &marble)                   //un stringify it aka JSON.parse()

	if marble.Name != name {                                 //test if marble is actually here or just nil
		return marble, errors.New("Marble does not exist - " + name)
	}

	return marble, nil
}
