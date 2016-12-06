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
	//"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// ============================================================================================================================
// Open Trade - create an open trade for a marble you want with marbles you have
// ============================================================================================================================
func open_trade(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var err error
	var will_size int
	var trade_away Description

	//	0        1      2     3      4      5       6
	//["bob", "blue", "16", "red", "16"] *"blue", "35*
	if len(args) < 5 {
		return nil, errors.New("Incorrect number of arguments. Expecting like 5?")
	}
	if len(args)%2 == 0 {
		return nil, errors.New("Incorrect number of arguments. Expecting an odd number")
	}

	size1, err := strconv.Atoi(args[2])
	if err != nil {
		return nil, errors.New("3rd argument must be a numeric string")
	}

	open := AnOpenTrade{}
	open.User = args[0]
	open.Timestamp = makeTimestamp() //use timestamp as an ID
	open.Want.Color = args[1]
	open.Want.Size = size1
	fmt.Println("- start open trade")
	jsonAsBytes, _ := json.Marshal(open)
	err = stub.PutState("_debug1", jsonAsBytes)

	for i := 3; i < len(args); i++ { //create and append each willing trade
		will_size, err = strconv.Atoi(args[i+1])
		if err != nil {
			msg := "is not a numeric string " + args[i+1]
			fmt.Println(msg)
			return nil, errors.New(msg)
		}

		trade_away = Description{}
		trade_away.ObjectType = "Description"
		trade_away.Color = args[i]
		trade_away.Size = will_size
		fmt.Println("! created trade_away: " + args[i])
		jsonAsBytes, _ = json.Marshal(trade_away)
		err = stub.PutState("_debug2", jsonAsBytes)

		open.Willing = append(open.Willing, trade_away)
		fmt.Println("! appended willing to open")
		i++
	}

	//get the open trade struct
	tradesAsBytes, err := stub.GetState(openTradesStr)
	if err != nil {
		return nil, errors.New("Failed to get opentrades")
	}
	var trades AllTrades
	json.Unmarshal(tradesAsBytes, &trades) //un stringify it aka JSON.parse()

	trades.OpenTrades = append(trades.OpenTrades, open) //append to open trades
	fmt.Println("! appended open to trades")
	jsonAsBytes, _ = json.Marshal(trades)
	err = stub.PutState(openTradesStr, jsonAsBytes) //rewrite open orders
	if err != nil {
		return nil, err
	}
	fmt.Println("- end open trade")
	return nil, nil
}


// ============================================================================================================================
// Perform Trade - close an open trade and move ownership
// ============================================================================================================================
func perform_trade(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var err error

	//	0		1					2					3				4					5
	//[data.id, data.closer.user, data.closer.name, data.opener.user, data.opener.color, data.opener.size]
	if len(args) < 6 {
		return nil, errors.New("Incorrect number of arguments. Expecting 6")
	}

	fmt.Println("- start close trade")
	timestamp, err := strconv.ParseInt(args[0], 10, 64)
	if err != nil {
		return nil, errors.New("1st argument must be a numeric string")
	}

	size, err := strconv.Atoi(args[5])
	if err != nil {
		return nil, errors.New("6th argument must be a numeric string")
	}

	//get the open trade struct
	tradesAsBytes, err := stub.GetState(openTradesStr)
	if err != nil {
		return nil, errors.New("Failed to get opentrades")
	}
	var trades AllTrades
	json.Unmarshal(tradesAsBytes, &trades) //un stringify it aka JSON.parse()

	for i := range trades.OpenTrades { //look for the trade
		fmt.Println("looking at " + strconv.FormatInt(trades.OpenTrades[i].Timestamp, 10) + " for " + strconv.FormatInt(timestamp, 10))
		if trades.OpenTrades[i].Timestamp == timestamp {
			fmt.Println("found the trade")

			marbleAsBytes, err := stub.GetState(args[2])
			if err != nil {
				return nil, errors.New("Failed to get thing")
			}
			closersMarble := Marble{}
			json.Unmarshal(marbleAsBytes, &closersMarble) //un stringify it aka JSON.parse()

			//verify if marble meets trade requirements
			if closersMarble.Color != trades.OpenTrades[i].Want.Color || closersMarble.Size != trades.OpenTrades[i].Want.Size {
				msg := "marble in input does not meet trade requriements"
				fmt.Println(msg)
				return nil, errors.New(msg)
			}

			marble, e := findMarble4Trade(stub, trades.OpenTrades[i].User, args[4], size) //find a marble that is suitable from opener
			if e == nil {
				fmt.Println("! no errors, proceeding")

				set_owner(stub, []string{args[2], trades.OpenTrades[i].User}) //change owner of selected marble, closer -> opener
				set_owner(stub, []string{marble.Name, args[1]})               //change owner of selected marble, opener -> closer

				trades.OpenTrades = append(trades.OpenTrades[:i], trades.OpenTrades[i+1:]...) //remove trade
				jsonAsBytes, _ := json.Marshal(trades)
				err = stub.PutState(openTradesStr, jsonAsBytes) //rewrite open orders
				if err != nil {
					return nil, err
				}
			}
		}
	}
	fmt.Println("- end close trade")
	return nil, nil
}


// ============================================================================================================================
// findMarble4Trade - look for a matching marble that this user owns and return it
// ============================================================================================================================
func findMarble4Trade(stub shim.ChaincodeStubInterface, owner string, color string, size int) (m Marble, err error) {
	var fail Marble
	fmt.Println("- start find marble 4 trade")
	fmt.Println("looking for " + owner + ", " + color + ", " + strconv.Itoa(size))

	//get the marble index
	marblesAsBytes, err := stub.GetState(marbleIndexStr)
	if err != nil {
		return fail, errors.New("Failed to get marble index")
	}
	var marblesIndex MarblesIndex
	json.Unmarshal(marblesAsBytes, &marblesIndex) //un stringify it aka JSON.parse()

	for i := range marblesIndex.Marbles { //iter through all the marbles
		//fmt.Println("looking @ marble name: " + marblesIndex.Marbles[i]);

		marbleAsBytes, err := stub.GetState(marblesIndex.Marbles[i]) //grab this marble
		if err != nil {
			return fail, errors.New("Failed to get marble")
		}
		res := Marble{}
		json.Unmarshal(marbleAsBytes, &res) //un stringify it aka JSON.parse()
		//fmt.Println("looking @ " + res.Owner + ", " + res.Color + ", " + strconv.Itoa(res.Size));

		//check for owner && color && size
		if strings.ToLower(res.Owner) == strings.ToLower(owner) && strings.ToLower(res.Color) == strings.ToLower(color) && res.Size == size {
			fmt.Println("found a marble: " + res.Name)
			fmt.Println("! end find marble 4 trade")
			return res, nil
		}
	}

	fmt.Println("- end find marble 4 trade - error")
	return fail, errors.New("Did not find marble to use in this trade")
}


// ============================================================================================================================
// Remove Open Trade - close an open trade
// ============================================================================================================================
func remove_trade(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var err error

	//	0
	//[data.id]
	if len(args) < 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting 1")
	}

	fmt.Println("- start remove trade")
	timestamp, err := strconv.ParseInt(args[0], 10, 64)
	if err != nil {
		return nil, errors.New("1st argument must be a numeric string")
	}

	//get the open trade struct
	tradesAsBytes, err := stub.GetState(openTradesStr)
	if err != nil {
		return nil, errors.New("Failed to get opentrades")
	}
	var trades AllTrades
	json.Unmarshal(tradesAsBytes, &trades) //un stringify it aka JSON.parse()

	for i := range trades.OpenTrades { //look for the trade
		//fmt.Println("looking at " + strconv.FormatInt(trades.OpenTrades[i].Timestamp, 10) + " for " + strconv.FormatInt(timestamp, 10))
		if trades.OpenTrades[i].Timestamp == timestamp {
			fmt.Println("found the trade")
			trades.OpenTrades = append(trades.OpenTrades[:i], trades.OpenTrades[i+1:]...) //remove this trade
			jsonAsBytes, _ := json.Marshal(trades)
			err = stub.PutState(openTradesStr, jsonAsBytes) //rewrite open orders
			if err != nil {
				return nil, err
			}
			break
		}
	}

	fmt.Println("- end remove trade")
	return nil, nil
}


// ============================================================================================================================
// Clean Up Open Trades - make sure open trades are still possible, remove choices that are no longer possible, remove trades that have no valid choices
// ============================================================================================================================
func cleanTrades(stub shim.ChaincodeStubInterface) (err error) {
	var didWork = false
	fmt.Println("- start clean trades")

	//get the open trade struct
	tradesAsBytes, err := stub.GetState(openTradesStr)
	if err != nil {
		return errors.New("Failed to get opentrades")
	}
	var trades AllTrades
	json.Unmarshal(tradesAsBytes, &trades) //un stringify it aka JSON.parse()

	fmt.Println("# trades " + strconv.Itoa(len(trades.OpenTrades)))
	for i := 0; i < len(trades.OpenTrades); { //iter over all the known open trades
		fmt.Println(strconv.Itoa(i) + ": looking at trade " + strconv.FormatInt(trades.OpenTrades[i].Timestamp, 10))

		fmt.Println("# options " + strconv.Itoa(len(trades.OpenTrades[i].Willing)))
		for x := 0; x < len(trades.OpenTrades[i].Willing); { //find a marble that is suitable
			fmt.Println("! on next option " + strconv.Itoa(i) + ":" + strconv.Itoa(x))
			_, e := findMarble4Trade(stub, trades.OpenTrades[i].User, trades.OpenTrades[i].Willing[x].Color, trades.OpenTrades[i].Willing[x].Size)
			if e != nil {
				fmt.Println("! errors with this option, removing option")
				didWork = true
				trades.OpenTrades[i].Willing = append(trades.OpenTrades[i].Willing[:x], trades.OpenTrades[i].Willing[x+1:]...) //remove this option
				x--
			} else {
				fmt.Println("! this option is fine")
			}

			x++
			fmt.Println("! x:" + strconv.Itoa(x))
			if x >= len(trades.OpenTrades[i].Willing) { //things might have shifted, recalcuate
				break
			}
		}

		if len(trades.OpenTrades[i].Willing) == 0 {
			fmt.Println("! no more options for this trade, removing trade")
			didWork = true
			trades.OpenTrades = append(trades.OpenTrades[:i], trades.OpenTrades[i+1:]...) //remove this trade
			i--
		}

		i++
		fmt.Println("! i:" + strconv.Itoa(i))
		if i >= len(trades.OpenTrades) { //things might have shifted, recalcuate
			break
		}
	}

	if didWork {
		fmt.Println("! saving open trade changes")
		jsonAsBytes, _ := json.Marshal(trades)
		err = stub.PutState(openTradesStr, jsonAsBytes) //rewrite open orders
		if err != nil {
			return err
		}
	} else {
		fmt.Println("! all open trades are fine")
	}

	fmt.Println("- end clean trades")
	return nil
}
