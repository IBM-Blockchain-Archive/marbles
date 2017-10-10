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
It should be v6.2.0 - v6.11.1. 
**Marbles will not work with node.js v7 or v8** 

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
If you don't do this step you run the risk of being unable to build your chaincode locally. 

**Choose 1 option below** (read each before you choose):

- **Option 1:** :lollipop: This option is for those that do not want to modify chaincode.  You will be running marbles as is. 
	- There are no steps, you are already done! Head back to the [tutorial](../README.md#downloadmarbles).

- **Option 2:**  This option is for those that want to modify chaincode and use a local Fabric network with the most recent Fabric version
	- [Releases of Hyperledger Fabric](https://github.com/hyperledger/fabric/releases). 
	- You will need to find the commit hash of your release. Click the releases link above and find the most recent release.  Click it and the release's commit hash is below the release version, similar to the picture below. 
	- Remember this hash and go to the `Continue the Fabric Install Instructions` section below. You will enter the hash there.
	![](/doc_images/release_hash.png)

- **Option 3:** Choose this option if you want to modify chaincode and use the Blockchain Service for my network
	- Get the commit hash from your network or use the hash `ae4e37d`.
		- If you have a network on the Bluemix service, then the exact Fabric version can be found in the "Support" tab under the "Release Notes" section of your network's dashboard. 
	 - Go to the `Continue the Fabric Install Instructions` section below. You will enter the hash there.


### Continue the Fabric Install Instructions
The release you are cloning locally should match the Hyperledger Fabric network you are using when you deploy your application. 
You should apply the choice you made above to the instructions below when doing the `git checkout` step. 
The point of all of this is to simply have the same version of Fabric on your local computer as the one running your network. 

1. Create the parent directories on your GOPATH
	```
	mkdir -p $GOPATH/src/github.com/hyperledger
	cd $GOPATH/src/github.com/hyperledger
	```

2. Clone the appropriate release codebase into $GOPATH/src/github.com/hyperledger/fabric
	```
	git clone https://github.com/hyperledger/fabric.git
	```

3. Match this version to the **commit hash** of your network/Fabric (the first 7 characters will work)
	```
	cd fabric
	git checkout ae4e37d
	```

4. Confirm the level using git branch. It should show the commit level matching the one you provided.
	```
	git branch
	```
	![](/doc_images/git-branch-out.PNG)

### Verify Fabric Installation
Open a command prompt/terminal and browse to this directory `$GOPATH/src/github.com/hyperledger/fabric/examples/chaincode/go/chaincode_example02`

```
$ go build --tags nopkcs11 ./
```

It should return with no errors/warnings. 
You should also see that an executable was created in this directory. 


Note that the `nopkcs11` tag is important. 
PKCS 11 is a Public-Key Cryptography Standard that you are unlikely to have on your system. 
**Remember to use this flag as you develop/build your chaincode**.

## 5. IDE Suggestions

- [Visual Studio Code](https://code.visualstudio.com/#alt-downloads)

Visual Studio Code is a free IDE that supports all the languages in Marbles such as JS/CSS/HTML/GoLang.

- [Atom](https://atom.io/)

Like VS Code, Atom has plugins to support any of the languages needed to develop chaincode or modify our examples.
 
## 6. Finish Up
Now that everything is setup, head back to the [tutorial](../README.md#downloadmarbles).
