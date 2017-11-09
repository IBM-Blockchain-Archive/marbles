*阅读本文的其他语言版本：[English](README.md)。*
# Marbles 演示

## 关于 Marbles
- 这个应用程序的基础网络是 [Hyperledger Fabric](https://github.com/hyperledger/fabric/tree/master/docs)，后者是一个 Linux Foundation 项目。您可能想查阅以下操作说明来稍微了解一下 Hyperledger Fabric。
- **本演示旨在帮助开发人员了解链代码的基础知识以及如何使用 Fabric 网络开发应用程序。**
- 这是一个`非常简单`的资产转移演示。多个用户可以创建并相互转移弹珠。

	![](/doc_images/marbles-peek.gif)

***

##### 版本和支持的平台
请注意，Marbles 有多个版本。 
每个 Marbles 分支对应于一个主要的 Hyperledger Fabric 版本。 
请挑选一个与您的 Fabric 版本兼容的 Marbles 版本。 
如果您没有任何版本的 Fabric，那么请挑选标为 **latest** 的 Marbles 版本！ 

- Marbles - 分支 v4.0 **(Latest)**（您将看到这个分支！）
	- 兼容 Hyperledger Fabric `v1.0.1`、`v1.0.0` 和 `v1.0.0-rc1`
	- 兼容 IBM Blockchain Bluemix 服务 - **IBM Blockchain Platform - Enterprise** 计划

- [Marbles - 分支 v3.0](https://github.com/ibm-blockchain/marbles/tree/v3.0) **（已弃用）**
	- 兼容 Hyperledger Fabric `v1.0.0-alpha`
	- 不再受 IBM Blockchain Bluemix 服务支持

- [Marbles - 分支 v2.0](https://github.com/ibm-blockchain/marbles/tree/v2.0) **（已弃用）**
	- 兼容 Hyperledger Fabric `v0.6.1-preview`
	- 兼容 IBM Blockchain Bluemix 服务 - **Starter** 或 **HSBN** 计划

- [Marbles - 分支 v1.0](https://github.com/ibm-blockchain/marbles/tree/v1.0) **（已弃用）**
	- 兼容 Hyperledger Fabric `v0.5-developer-preview`
	- 不再受 IBM Blockchain Bluemix 服务支持

***

# 应用程序背景

请大家集中注意力，这个应用程序将演示如何利用 Hyperledger Fabric 在许多弹珠所有者之间转移弹珠。
我们将在 Node.js 中使用一些 GoLang 代码完成此任务。
该应用程序的后端将是在我们的区块链网络中运行的 GoLang 代码。
从现在开始，这些 GoLang 代码将称为 '链代码' 或 'cc'。
该链代码本身会创建一颗弹珠，将它存储到链代码状态中。
该链代码本身可以将数据作为字符串存储在键/值对设置中。
因此，我们将字符串化 JSON 对象，以便存储更复杂的结构。

弹珠的属性包括：

  1. ID（唯一字符串，将用作键）
  2. 颜色（字符串，CSS 颜色名称）
  3. 尺寸（int，以毫米为单位）
  4. 所有者（字符串）

我们将创建一个基于 Web 的用户界面，它可以设置这些值并将它们存储在区块链中。
这颗弹珠是在区块链存储（也称为账本）中以键值对的形式创建的。
`键`为弹珠 ID，`值`为一个包含（上面列出的）弹珠属性的 JSON 字符串。
与 cc 的交互是通过对网络上的一个节点使用 gRPC 协议来完成的。
gRPC 协议的细节由一个名为 [Hyperledger Fabric Client](https://www.npmjs.com/package/fabric-client) SDK 的 SDK 处理。
请查看下图了解拓扑结构细节。

### 应用程序通信流

![](/doc_images/comm_flow.png)

1. 管理员将在他们的浏览器中与我们的 Node.js 应用程序 Marbles 进行交互。
2. 此客户端 JS 代码将打开一个与后端 Node.js 应用程序的 Websocket 连接。管理员与该站点交互时，客户端 JS 将消息发送到后端。
3. 读取或写入账本称为提案。这个提案由 Marbles（通过 SDK）构建，然后发送到一个区块链节点。
4. 该节点将与它的 Marbles 链代码容器进行通信。链代码将运行/模拟该交易。如果没有问题，它会对该交易进行背书，并将其发回我们的 Marbles 程序。
5. 然后，Marbles（通过 SDK）将背书后的提案发送到订购服务。订购方将来自整个网络的许多提案打包到一个区块中。然后，它将新的区块广播到网络中的节点。
6. 最后，节点会验证该区块并将它写入自己的账本中。该交易现在已经生效，所有后续读取都会反映此更改。

### 上下文线索
您需要理解 3 个不同的部分/领域。
应该将它们视为相互通信的隔离环境。
在我们设置和解释每一部分时，本演示会从一部分跳到另一部分。
一定要确定每部分的具体作用。
有一些关键词和上下文线索可帮助区分不同部分。

1.链代码部分 - 这是在区块链网络上运行的/包含节点的 GoLang 代码。也称为 `cc`。所有弹珠/区块链交互最终都会在这里进行。这些文件位于 `/chaincode` 中。
1.客户端 JS 部分 - 这是在用户浏览器中运行的 JavaScript 代码。用户界面交互在这里执行。这些文件位于 `/public/js` 中。
1.服务器端 JS 部分 - 这是运行应用程序的后端的 JavaScript 代码，即为 Marbles 的核心的 `Node.js` 代码！有时该代码也称为我们的`节点`或`服务器`代码。它充当 Marbles 管理员与我们的区块链之间的连接器。这些文件位于 `/utils` 和 `/routes` 中。

请记住，这 3 部分是相互隔离的。
它们不共享变量和函数。
它们将通过 gRPC 或 WebSocket 等网络协议进行通信。
***

# Marbles 设置

我既有好消息也有坏消息。 
好消息是，可以根据您的偏好，针对不同的配置来设置 Marbles 和区块链网络。 
坏消息是，这会让操作说明变得很复杂。 
**如果您不熟悉 Hyperledger Fabric 并想要最简单的设置，请关注 :lollipop: 表情符号。** 
只要有选项而且您必须做出自己的选择，我就会在最简单的选项上放一个 :lollipop: 表情符号。 
这是适合您的选项。 

### 0.设置本地环境

按照这些环境设置[操作说明](./docs/env_setup.md) 来安装 **Git、Go** 和 **Node.js**。

- 完成上述操作后返回到本教程。开始阅读下一节“下载 Marbles”。

<a name="downloadmarbles"></a>

### 1.下载 Marbles
我们需要将 Marbles 下载到本地系统。 
让我们使用 Git 通过克隆此存储库来完成该任务。 
即使您计划将 Marbles 托管在 Bluemix 中，也需要执行这一步。

- 打开一个命令提示符/终端并浏览到您想要的工作目录
- 运行以下命令：

	```
	git clone https://github.com/IBM-Blockchain/marbles.git --depth 1
	cd marbles
	git checkout v4.0
	```

- 非常棒，第 2 步再见。

<a name="getnetwork"></a>

### 2.获取一个网络

我们又见面了。现在我们需要一个区块链网络。

**选择下面的一个选项：**

- **选项 1：**使用 Bluemix IBM Blockchain 服务创建一个网络 - [操作说明](./docs/use_bluemix_hyperledger.md)
- **选项 2：**:lollipop: 使用本地托管的 Hyperledger Fabric 网络 - [操作说明](./docs/use_local_hyperledger.md)

<a name="installchaincode"></a>

### 3.安装并实例化链代码

很好，就快要完成了！现在，我们需要运行我们的 Marbles 链代码。 
请记住，链代码是一个关键组件，它最终会在账本上创建我们的 Marbles 事务。 
该链代码是需要安装在节点上，然后在一个通道上实例化的 GoLang 代码。 
已为您编写好该代码！ 
我们只需要运行它。 
可通过两种方式运行它。 

**仅**选择与您的设置相关的选项：

- **选项 1：**使用 IBM Blockchain 服务安装并实例化链代码 - [操作说明](./docs/install_chaincode.md)
- **选项 2：**:lollipop: 在本地使用 SDK 安装并实例化链代码 - [操作说明](./docs/install_chaincode_locally.md)

<a name="hostmarbles"></a>

### 4.托管 Marbles

最后但同样重要的是，我们需要在某个地方运行 Marbles。

**选择下面的一个选项：**

- **选项 1：**将 Marbles 托管在 Bluemix 上 - [操作说明](./docs/host_marbles_bluemix.md)
- **选项 2：**:lollipop: 在本地托管 Marbles - [操作说明](./docs/host_marbles_locally.md)

***

<a name="use"></a>

# 使用 Marbles

1.如果您到达这一步，那么您应该已经设置了环境，创建了区块链网络，而且 Marbles 应用程序和链代码正在运行。对吧？如果不对，您可以寻求一些帮助（从网页中寻找，而不是从字面上寻找）。
2.打开最喜欢的浏览器，浏览到 [http://localhost:3001](http://localhost:3001) 或您的 Bluemix www 路径。
    - 如果未加载该站点，请检查您的节点控制台日志，查看 Marbles 使用的主机名/IP 和端口。

3.最后，我们可以测试该应用程序。单击“United Marbles”部分中一个用户上的“+”图标

	![](/doc_images/use_marbles1.png)

4.填写所有字段，然后单击“CREATE”按钮
5.几秒过后，您的新 Marbles 应该就会出现。
    - 如果未出现，请单击浏览器中的 Refresh 按钮或按 F5 来刷新该页面
6.接下来，让我们来交易一颗弹珠。将一颗弹珠从一位所有者拖到另一位所有者。仅在您拥有多个弹珠公司时，才能与“United Marbles”内的所有者交易它。该弹珠应该会暂时消失，然后在新所有者中重新绘制出来。这意味着交易成功了！
    如果未看见该弹珠，请刷新页面
7.现在将一颗弹珠拖放到垃圾桶来删除它。它应该在几秒后消失。

	![](/doc_images/use_marbles2.png)

8.刷新页面，以便再次确认您的操作“停顿了”。
9.使用搜索框过滤弹珠所有者或弹珠公司名称。在有许多公司/所有者时，此方法很有帮助。
    - 别针图标会阻止搜索框过滤掉该用户。
10.现在让我们来执行具体的演练。单击页面顶部附近的“Settings”按钮。
	- 这将打开一个对话框。
	- 单击“Enabled”按钮启用 Story Mode
	- 单击右上角的“x”关闭菜单。
	- 现在挑选另一颗弹珠，并将它拖到另一个用户。您会看到交易流程的分解结构。希望这能让您更好地了解 Fabric 的工作原理。
	- 请记住，当故事的剧情不断重复，而且您对自己的过往已失去兴趣时，可以禁用 Story Mode。
11.恭喜您有了一个工作正常的 Marbles 应用程序 :)！


# 区块链背景
在介绍 Marbles 的工作原理之前，让我们讨论一下 Hyperledger Fabric 的流和拓扑结构。 
让我们先来了解一些定义。

### 定义：

**节点** - 节点是区块链的成员，运行着 Hyperledger Fabric。在 Marbles 的上下文中，节点归我的弹珠公司所有和操作。

**CA** - CA（证书颁发机构）负责守卫我们的区块链网络。它将为客户端（比如我们的 Marbles node.js 应用程序）提供交易证书。 

**订购者** - 订购者或订购服务是区块链网络的成员，其主要职责是将交易打包到区块中。

**用户** - 用户是经过授权能与区块链进行交互的实体。在 Marbles 的上下文中，用户是我们的管理员。用户可以查询和写入账本。

**区块** - 区块包含交易和一个验证完整性的哈希值。

**交易**或**提案** - 它们表示与区块链账本的交互。对账本的读取或写入请求是以交易/提案的形式发送的。

**账本** - 这是区块链在一个节点上的存储区。它包含由交易参数和键值对组成的实际的区块数据。它由链代码编写。

**链代码** - 链代码是代表智能合约的 Hyperledger Fabric。它定义资产和所有关于资产的规则。

**资产** - 资产是存在于账本中的实体。它是一种键值对。在 Marbles 的上下文中，资产是一颗弹珠或弹珠所有者。 

让我们看看创建一颗新的弹珠时涉及的操作。

1.Marbles 中发生的第一件事是向网络的 `CA` 注册我们的管理员`用户`。如果成功，`CA` 会向 Marbles 发送注册证书，SDK 将该证书存储在我们的本地文件系统中。 
2.管理员从用户界面创建一颗新弹珠时，SDK 会创建一个调用事务。 
3.创建弹珠的事务被构建为一个调用链代码函数 `init_marble()` 的`提案`。 
4.Marbles（通过 SDK）将此`提案`发送到一个`节点`进行背书。 
5.`节点`将运行 Go 函数 `init_marble()` 来模拟该事务，并记录它尝试写入账本中的所有更改。 
6.如果该函数成功返回，`节点`会对该`提案`进行背书并将它发回给 Marbles。如果失败，错误也将发送回来，但不会对`提案`进行背书。
7.然后，Marbles（通过 SDK）将背书后的`提案`发送给`订购者`。 
8.`订购者`将组织来自整个网络的`提案`的序列。它将通过查找相互冲突的交易，检查该交易序列是否有效。任何由于冲突而无法添加到区块中的交易都被标记为错误。`订购者`将新区块广播到网络中的节点。
9.我们的`节点`将收到新区块，并通过查看各种签名和哈希值来验证它。最终将该区块提交到`节点`的`账本`。
10.此刻，我们的账本中会出现新的弹珠，并很快会出现在所有节点的账本中。


# SDK 深入剖析
现在让我们看看如何连接到 Fabric Client SDK。 
大部分配置选项都可以在 `/config/blockchain_creds_tls.json` 中找到。 
此文件列出了我们的区块链网络中的各种组件的主机名（或 IP）和端口。 
`helper` 函数将从该配置文件中检索 IP 和端口。

### 配置 SDK：
第一个操作是注册管理员。查看用于注册的以下代码段。代码下方有一些注释/操作说明。

```js
//enroll admin
enrollment.enroll = function (options, cb) {
// [Step 1]
    var client = new FabricClient();
    var channel = client.newChannel(options.channel_id);
    logger.info('[fcw] Going to enroll for mspId ', options);

// [Step 2]
    // Make eCert kvs (Key Value Store)
    FabricClient.newDefaultKeyValueStore({
        path: path.join(os.homedir(), '.hfc-key-store/' + options.uuid) //store eCert in the kvs directory
    }).then(function (store) {
        client.setStateStore(store);

// [Step 3]
        return getSubmitter(client, options);              //do most of the work here
    }).then(function (submitter) {

// [Step 4]
        channel.addOrderer(new Orderer(options.orderer_url, {
          pem: options.orderer_tls_opts.pem,
          'ssl-target-name-override': options.orderer_tls_opts.common_name  //can be null if cert matches hostname
        }));

// [Step 5]
        channel.addPeer(new Peer(options.peer_urls[0], {
            pem: options.peer_tls_opts.pem,
            'ssl-target-name-override': options.peer_tls_opts.common_name
        }));
        logger.debug('added peer', options.peer_urls[0]);
        
// [Step 6]
        // --- Success --- //
        logger.debug('[fcw] Successfully got enrollment ' + options.uuid);
        if (cb) cb(null, { channel: channel, submitter: submitter });
        return;

    }).catch(

        // --- Failure --- //
        function (err) {
            logger.error('[fcw] Failed to get enrollment ' + options.uuid, err.stack ? err.stack : err);
            var formatted = common.format_error_msg(err);
            if (cb) cb(formatted);
            return;
        }
    );
};
```

第 1 步.该代码做的第一件事是创建我们的 SDK 的一个实例。

第 2 步.接下来，我们使用 `newDefaultKeyValueStore` 创建一个键值存储来存储我们的注册证书。

第 3 步.接下来注册我们的管理员。我们在执行这一步时使用了我们的注册 ID 和注册密钥向 CA 执行身份验证。CA 将颁发注册证书，SDK 将该证书存储在键值存储中。因为我们使用的是默认的键值存储，所以它会存储在本地文件系统中。 

第 4 步.成功注册后，我们将设置订购者 URL。暂时不需要订购者，但在我们尝试调用链代码时需要它。 
    - 仅在拥有自签名证书时，才需要包含 `ssl-target-name-override` 的业务。将此字段与您创建 PEM 文件时使用的`常用名`设置为相同。
    
第 5 步.接下来设置节点 URL。这些 URL 也是暂时不需要的，但我们将会完整设置我们的 SDK 链对象。

第 6 步.此刻，已对 SDK 进行全面配置并准备好与区块链进行交互。

# Marbles 深入剖析
希望您已在用户之间成功交易了一两颗弹珠。 
让我们看看如何完成弹珠的转移，首先看看链代码。

__/chaincode/marbles.go__

```go
    type Marble struct {
        ObjectType string        `json:"docType"`
        Id       string          `json:"id"`
        Color      string        `json:"color"`
        Size       int           `json:"size"`
        Owner      OwnerRelation `json:"owner"`
    }
```

__/chaincode/write_ledger.go__

```go
    func set_owner(stub shim.ChaincodeStubInterface, args []string) pb.Response {
        var err error
        fmt.Println("starting set_owner")

        // this is quirky
        // todo - get the "company that authed the transfer" from the certificate instead of an argument
        // should be possible since we can now add attributes to the enrollment cert
        // as is.. this is a bit broken (security wise), but it's much much easier to demo! holding off for demos sake

        if len(args) != 3 {
            return shim.Error("Incorrect number of arguments.Expecting 3")
        }

        // input sanitation
        err = sanitize_arguments(args)
        if err != nil {
            return shim.Error(err.Error())
        }

        var marble_id = args[0]
        var new_owner_id = args[1]
        var authed_by_company = args[2]
        fmt.Println(marble_id + "->" + new_owner_id + " - |" + authed_by_company)

        // check if user already exists
        owner, err := get_owner(stub, new_owner_id)
        if err != nil {
            return shim.Error("This owner does not exist - " + new_owner_id)
        }

        // get marble's current state
        marbleAsBytes, err := stub.GetState(marble_id)
        if err != nil {
            return shim.Error("Failed to get marble")
        }
        res := Marble{}
        json.Unmarshal(marbleAsBytes, &res)           //un stringify it aka JSON.parse()

        // check authorizing company
        if res.Owner.Company != authed_by_company{
            return shim.Error("The company '" + authed_by_company + "' cannot authorize transfers for '" + res.Owner.Company + "'.")
        }

        // transfer the marble
        res.Owner.Id = new_owner_id                   //change the owner
        res.Owner.Username = owner.Username
        res.Owner.Company = owner.Company
        jsonAsBytes, _ := json.Marshal(res)           //convert to array of bytes
        err = stub.PutState(args[0], jsonAsBytes)     //rewrite the marble with id as key
        if err != nil {
            return shim.Error(err.Error())
        }

        fmt.Println("- end set owner")
        return shim.Success(nil)
    }
```

这个 `set_owner()` 函数将更改特定弹珠的所有者。 
它接受一个字符串输入参数数组，如果成功，则返回 `nil`。 
在该数组内，第一个索引应拥有一颗弹珠的 ID，该 ID 也是键/值对中的键。 
我们首先需要使用此 ID 检索当前的弹珠构造。 
这是使用 `stub.GetState(marble_id)` 完成的，然后使用 `json.Unmarshal(marbleAsBytes, &res)` 将它解组为一种弹珠结构。 
从这里，我们可以使用 `res.Owner.Id` 检索该结构，并使用新所有者 ID 覆盖该弹珠的所有者。 
接下来，我们将对该结构进行编组，以便可以使用 `stub.PutState()` 通过新属性覆盖该弹珠。 

让我们更进一步，看看如何从我们的 node.js 应用程序中调用此链代码。 

__/utils/websocket_server_side.js__

```js
    //process web socket messages
    ws_server.process_msg = function (ws, data) {
        const channel = helper.getChannelId();
        const first_peer = helper.getFirstPeerName(channel);
        var options = {
            peer_urls: [helper.getPeersUrl(first_peer)],
            ws: ws,
            endorsed_hook: endorse_hook,
            ordered_hook: orderer_hook
        };
        if (marbles_lib === null) {
            logger.error('marbles lib is null...');             //can't run in this state
            return;
        }

        // create a new marble
        if (data.type == 'create') {
            logger.info('[ws] create marbles req');
            options.args = {
                color: data.color,
                size: data.size,
                marble_owner: data.username,
                owners_company: data.company,
                owner_id: data.owner_id,
                auth_company: process.env.marble_company,
            };

            marbles_lib.create_a_marble(options, function (err, resp) {
                if (err != null) send_err(err, data);
                else options.ws.send(JSON.stringify({ msg: 'tx_step', state: 'finished' }));
            });
        }

        // transfer a marble
        else if (data.type == 'transfer_marble') {
            logger.info('[ws] transferring req');
            options.args = {
                marble_id: data.id,
                owner_id: data.owner_id,
                auth_company: process.env.marble_company
            };

            marbles_lib.set_marble_owner(options, function (err, resp) {
                if (err != null) send_err(err, data);
                else options.ws.send(JSON.stringify({ msg: 'tx_step', state: 'finished' }));
            });
        }
        ...
```

这段 `process_msg()` 代码接收所有 Websocket 消息（该代码可在 app.js 中找到）。 
它将检测发送了何种类型的 ws (websocket) 消息。 
在我们的示例中，它会检测到一个 `transfer_marble` 类型。 
查看该代码，我们可以看到它将设置一个 `options` 变量，然后启动 `marbles_lib.set_marble_owner()`。 
该函数将告诉 SDK 构建提案并处理转移操作。 

接下来，让我们看看该函数。 

__/utils/marbles_cc_lib.js__

```js
    //-------------------------------------------------------------------
    // Set Marble Owner 
    //-------------------------------------------------------------------
    marbles_chaincode.set_marble_owner = function (options, cb) {
        console.log('');
        logger.info('Setting marble owner...');

        var opts = {
            channel_id: g_options.channel_id,
            chaincode_id: g_options.chaincode_id,
            chaincode_version: g_options.chaincode_version,
            event_url: g_options.event_url,
            endorsed_hook: options.endorsed_hook,
            ordered_hook: options.ordered_hook,
            cc_function: 'set_owner',
            cc_args: [
                options.args.marble_id,
                options.args.owner_id,
                options.args.auth_company
            ],
            peer_tls_opts: g_options.peer_tls_opts,
        };
        fcw.invoke_chaincode(enrollObj, opts, cb);
    };
        ...
```

上面列出了 `set_marble_owner()` 函数。 
重要的部分是，它通过 `fcn: 'set_owner'` 将提案的调用函数名称设置为 "set_owner"。 
请注意，我们在注册管理员时已经设置了节点和订购者 URL。 
默认情况下，SDK 将此交易发送到所有通过 `channel.addPeer` 添加的节点。 
在我们的示例中，SDK 仅发送到 1 个节点，因为我们只添加了 1 个节点。 
我记得此节点是在 `enrollment` 这一节中添加的。 

现在让我们更进一步，看看如何从用户界面发送此 Websocket 消息。

__/public/js/ui_building.js__

```js
    $('.innerMarbleWrap').droppable({drop:
        function( event, ui ) {
            var marble_id = $(ui.draggable).attr('id');

            //  ------------ Delete Marble ------------ //
            if($(event.target).attr('id') === 'trashbin'){
                // [removed code for brevity]
            }

            //  ------------ Transfer Marble ------------ //
            else{
                var dragged_owner_id = $(ui.draggable).attr('owner_id');
                var dropped_owner_id = $(event.target).parents('.marblesWrap').attr('owner_id');

                console.log('dropped a marble', dragged_owner_id, dropped_owner_id);
                if (dragged_owner_id != dropped_owner_id) {
                $(ui.draggable).addClass('invalid bounce');
                    transfer_marble(marble_id, dropped_owner_id);
                    return true;
                }
            }
        }
    });

    ...

    function transfer_marble(marbleName, to_username, to_company){
        show_tx_step({ state: 'building_proposal' }, function () {
            var obj = {
                type: 'transfer_marble',
                id: marbleId,
                owner_id: to_owner_id,
                v: 1
            };
            console.log(wsTxt + ' sending transfer marble msg', obj);
            ws.send(JSON.stringify(obj));
            refreshHomePanel();
        });
    }
```

在引用 `$('.innerMarbleWrap')` 的第一节中，可以看到我们使用了 jQuery 和 jQuery-UI 来实现拖放功能。 
通过此代码，我们获得了一个可拖放的事件触发器。 
我们用了大量代码来解析已拖入的弹珠和它拖放到的用户的细节。 

触发该事件时，我们首先检查这颗弹珠实际上是否已更换了所有者，或者是否只是将它选出又放回去。 
如果它的所有者改变了，我们将转到 `transfer_marble()` 函数。 
此函数创建一条包含所有需要的数据的 JSON 消息，并通过 `ws.send()` 使用我们的 Websocket 发送它。 

最后一个问题是 Marbles 如何认识到转移已完成。 
Marbles 将定期检查所有弹珠并将它们与最后已知状态进行比较。 
如果存在差异，则将新弹珠状态广播到所有连接的 JS 客户端。 
这些客户端会收到此 Websocket 消息并重新绘制该弹珠。 

现在您已知道了整个流程。 
管理员转移弹珠，JS 检测到拖/放操作，客户端发送一条 Websocket 消息，Marbles 收到该 Websocket 消息，SDK 构建/发送一个提案，节点对提案进行背书，SDK 将提案发送给订购服务，订购者订购并向节点发送一个区块，我们的节点提交该区块，Marbles node 代码定期获取新的弹珠状态，将弹珠 Websocket 消息发送到客户端，最后客户端会在弹珠的新所有者那里重新绘制它。

大功告成！希望您能愉快地交易弹珠。 

## Marbles 技巧
Marbles 的一些注释无法整洁地放在上述操作说明中。 
下面给出了各种各样的 Marbles 技巧和操作说明。 
- 即将发布

# 许可
[Apache 2.0](LICENSE)

***
