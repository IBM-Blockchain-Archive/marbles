# Chaincode Development Environment

The following is a list of dependencies and recommended tools that you should install in order to develop chaincode.

## 1. Git

- [Git](https://git-scm.com/downloads)

Git is a great version control tool to familiarize yourself with, both for chaincode development and software development in general.
Also, git bash, which is installed with git on Windows, is an excellent alternative to the the Windows command prompt.

### Verify Git Installation

After following the installation instructions above, you can verify that git is installed using the following command:

```
$ git --version
git version 2.11.1.windows.1
```

## 2. GoLang

- [GoLang Download Page](https://golang.org/dl)
- [GoLang Installation Instructions](https://golang.org/doc/install)
- [GoLang Documentation and Tutorials](https://golang.org/doc/)

The Go installation installs a set of Go CLI tools which are very useful when writing chaincode.
For example, the `go build` command allows you to check that your chaincode actually compiles before you attempt to deploy it to a network.
At time of writing, this chaincode is known to build successfully with version `1.7.5`.

### Verify Go Installation
You can verify that Go is installed properly by running the following commands. Of course, the output of `go version` may change depending on your operating system.

```
$ go version
go version go1.7.5 windows/amd64

$ echo $GOPATH
C:\gopath
```

Your `GOPATH` does not need to match the one above.
It only matters that you have this variable set to a valid directory on your filesystem.
The installation instructions linked above will take you through the setup of this environment variable.

Next verify you can build GoLang code with the [hello world](https://golang.org/doc/install#testing) example.

## 3. Node.js

Download and install the latest Node.js LTS version.

- [Node.js Download Page](https://nodejs.org/en/download/)


###  Verify Node.js Installation

Open a command prompt/terminal and make sure the following commands work on your machine:

```
$ node -v
v6.10.1

$ npm -v
3.10.10
```

## 4. Hyperledger Fabric

Any chaincode that you write will need to import the chaincode shim from Hyperledger Fabric. 
Therefore in order to compile chaincode locally you will need to have the fabric code present in your `GOPATH`. 

**Choose 1 option below:**

- **Option 1:** :lollipop: I don't want to modify chaincode - **If you only want to run marbles cc as is, you can skip this step completely.** Head back to the [tutorial](../README.md#downloadmarbles).

- **Option 2:** I want to modify chaincode and use a local Fabric network
	- You are going to use the [master branch of the Hyperledger fabric](https://gerrit.hyperledger.org/r/gitweb?p=fabric.git;a=summary). 
	- Remember this hash `14055d7` and go to the `Continue the Fabric Install Instructions` section below. You will enter the hash there.

- **Option 3:** I want to modify chaincode and use the Blockchain Service for my network
	- You are most likely going to need to use the [v1.0.0-preview Hyperledger fabric](https://github.com/hyperledger/fabric/tree/v1.0.0-preview) version.
	If you have a network, then the exact Fabric version can be found in the Release Notes section of your network's UI. 
	![](/doc_images/marbles-env.PNG)
	- Get the hash from your network or use the hash `14055d7`. Go to the `Continue the Fabric Install Instructions` section below. You will enter the hash there.

	- **Update 5/1/2017**
	If you are on Windows and using the Blockchain Sevice, please use this commit hash instead: `0616a9ddc02cc541409c9d77c8b7e97523a8b96e`. 
	Windows needs a Fabric fix that disables pkcs11 that was not avaible until April 1st, 2017 (no joking). 
	Other OSes should be able to use the same version in their release note.


### Continue the Fabric Install Instructions
The release you are cloning locally should match the Hyperledger Fabric network you are using when you deploy your application. 
You should apply the choice you made above to the instructions below when doing the `git checkout` step.

1. Create the parent directories on your GOPATH
	```
	mkdir -p $GOPATH/src/github.com/hyperledger
	cd $GOPATH/src/github.com/hyperledger
	```

2. Clone the appropriate release codebase into $GOPATH/src/github.com/hyperledger/fabric
	```
	git clone https://github.com/hyperledger/fabric.git
	```

3. Match this version to the commit level of your network (1st 7 characters will work)
	```
	cd fabric
	git checkout 14055d7
	```

4. Confirm the level using git branch. It should show the commit level matching the one you provided.
	```
	git branch
	```
	![](/doc_images/git-branch-out.PNG)

### Verify Fabric Installation
Open a command prompt/terminal and browse to this directory `$GOPATH/src/github.com/hyperledger/fabric/examples/chaincode/go/chaincode_example02`

```
$ go build -tags nopkcs11 .
```

It should return with no errors/warnings.

## 5. IDE Suggestions

- [Visual Studio Code](https://code.visualstudio.com/#alt-downloads)

Visual Studio Code is a free IDE that supports all the languages in Marbles such as JS/CSS/HTML/GoLang.

- [Atom](https://atom.io/)

Like VS Code, Atom has plugins to support any of the languages needed to develop chaincode or modify our examples.
 
## 6. Finish Up
Now that everything is setup, head back to the [tutorial](../README.md#downloadmarbles).
