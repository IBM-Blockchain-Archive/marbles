*Read this in other languages: [English](README.md), [中国](README-cn.md), [한국어](README-ko.md), [português](README-pt.md)*

# Marbles デモ

ブロックチェーンを使用した大理石資産 (Marbles) の移転アプリをデプロイする。

## Marbles とは

- このアプリケーションの基礎となるネットワークは、Linux Foundationプロジェクトの [Hyperledger Fabric](https://github.com/hyperledger/fabric/tree/master/docs) です。 Hyperledger Fabric について少し理解するために、これらの手順を見直すことをお勧めします。
- **このデモは、開発者がファブリックネットワークでチェーンコードとアプリケーション開発の基本を学ぶのを支援するためのものです。**
- これは「非常に簡単な」資産移転のデモンストレーションです。複数のユーザーがお互いに大理石を作成して転送することができます。

	![](/doc_images/marbles-peek.gif)

### バージョン

Marbles デモのバージョンは複数あります。
このバージョンは **Hyperledger Fabric v1.1x** と互換性があります。 Marbles デモの他のバージョンは他の枝をチェックすることで見つけることができます。

***

# アプリケーションのバックグラウンド

驚かないでくださいね。
このアプリケーションでは、Hyperledger Fabric を活用して、多くの大理石の所有者の間で大理石を転送することを実証するつもりです。
これを Node.js と少しの Go言語 (GoLang) で行う予定です。
このアプリケーションのバックエンドは、ブロックチェーンネットワークで実行される Go言語コードになります。
ここから、Go言語コードは 'チェーンコード (chaincode)' または 'cc' とも呼ばれます。
チェーンコード自体は、大理石をチェーンコード・ステートに格納することによって作成します。
チェーンコード自体は、キー/値のペア設定で文字列としてデータを格納できます。
したがって、より複雑な構造を格納するためには JSON オブジェクトをストリング化 (stringify) します。

大理石には、以下の属性があります:

1. id (キーとして使用する一意の文字列)
2. color (CSS カラー名の文字列)
3. size (サイズ (mm 単位) の整数)
4. owner (文字列)

これらの属性値を設定してブロックチェーン内に保管できる、Web ベースの UI を作成します。大理石データはブロックチェーン・ストレージ内に作成されるか、 `キー (key)` と `値 (value)` のペアとしてレジャー (Ledger、元帳) 内に作成されます。キーは大理石の ID、値は大理石の属性からなる JSON 文字列です。チェーンコードとやり取りするには、ネットワーク上のピアに対して gRPC プロトコルを使用します。RPC プロトコルの詳細は、[Hyperledger Fabric Client](https://www.npmjs.com/package/fabric-client) SDK を使用して処理します。

### アプリケーションの通信フロー

![](/doc_images/comm_flow.png)

1. 管理者がブラウザーを使用して、Marbles という Node.js アプリケーションとやり取りします。
2. クライアント・サイドの JavaScript コードによってバックエンド Node.js アプリケーションに対する WebSocket が開かれ、ブラウザーからアプリケーションに命令が送信されます。
3. プロポーザルがレジャーにアクセスして、トランザクションをシミュレーションします。このプロポーザルは Marbles  アプリケーションによって (SDK を使用して) 作成された後、ブロックチェーンのピアに送信されます。
4. エンドーサー (ピア上のプロセス) は、そのMarblesチェーンコードコンテナと通信します。チェーンコードはトランザクションを実行/シミュレートします。何も問題がなければトランザクションを承認 (またはトランザクションに署名) します。
5. SDK はすべての署名済みプロポーザルを収集し、ポリシーが満たされていれば、そのトランザクションを署名済みエンドースメントと一緒に注文サービスに送信します。注文サービスがトランザクションを順序付けてブロックを作成し、そのブロックを該当するピアに配信します。
6. ピアはブロックを検証してからレジャーに書き込みます。これで、このトランザクションがレジャーで適用され、以降の読み取りにはこの変更が反映されるようになります。

***

# Marbles のセットアップ

これから説明される様々な指示に取り組む前に、実際にセットアップしたいタイプを決定してください。
開発者の設定をスキップし、手軽な 2-3 回のクリックで Marbles を実行することは可能です。
開発者の設定が必要な場合は、下記の 0〜4 の手順に従ってください。
その終わりまでに、あなたは Hyperledger Fabric について学び、あなた自身のデザインのアプリケーションを開発するための環境がセットアップされるでしょう。
そのすべてをスキップして IBP ([IBM Blockchain Platform](https://console.bluemix.net/developer/blockchain/dashboard)) ネットワーク上で Marbles を試したい場合は、[Toolchain setup flow](./.bluemix/README.md) を参照してください。
もしあなたが本当にあなたの友達を感動させたいなら、両方にトライしてみましょう。

Toolchain の設定を既に実施している場合は、[Use Marbles](#use) セクションまでスキップしてください。
もしあなたが、開発者用の設定を選択している場合は、このまま読み続けてください。
良い知らせは、Marbles デモとブロックチェーンネットワークを、あなたの好みに応じて異なる構成に設定できるようになることです。
悪い知らせは、これが指示 (設定の手順) を複雑にすることです。
**Hyperledger Fabric の初心者で、最も簡単な設定が必要な場合は、:lollipop: 絵文字に従ってください。**
オプションがあり、あなた自身の冒険を選ぶ必要があるときはいつでも、私は :lollipop: 絵文字を一番簡単なオプションに置いておきます。
これはあなたのためのオプションです。

### 0. Local 環境のセットアップ

まずは環境設定として [指示](./docs/env_setup.md) に従い、**Git**、**Go**、**Node.js** をインストールしてください。

- 終了したら、このチュートリアルに戻ります。次のセクション "Marbles のダウンロード" を開始してください。

<a name="downloadmarbles"></a>

### 1. Marbles のダウンロード

あなたのローカルシステムに Marbles デモをダウンロードする必要があります。
Git ツールでこのリポジトリを複製しましょう。
IBM Cloud で Marbles デモのホスティングを計画している場合でも、この手順を実行する必要があります。

- コマンドプロンプト/ターミナルを開き、作業ディレクトリに移動します。
- 次のコマンドを実行します:

	```
	git clone https://github.com/IBM-Blockchain/marbles.git --depth 1
	cd marbles
	```

- 素晴らしいですね、ステップ2でお会いしましょう。

<a name="getnetwork"></a>
### 2. ネットワークを得る

またお会いしましたね。今はブロックチェーンネットワークが必要です。

**下記のうち1つのオプションを選択:**

- **オプション 1:** IBM Cloud の IBM Blockchain Service でネットワークを作成する - [指示](./docs/use_bluemix_hyperledger.md)
- **オプション 2:** :lollipop: ローカルにホストされた Hyperledger Fabric ネットワークを使用する - [指示](./docs/use_local_hyperledger.md)

<a name="installchaincode"></a>
### 3. チェーンコードのインストールとインスタンス化

OK、あと少しです！
今度は大理石のチェーンコードを実行する必要があります。
チェーンコードは、最終的にレジャー (元帳) に大理石の取引 (transaction) を作成する重要なコンポーネントであることを忘れないでください。
私たちのピアにインストールされる必要がある Go言語コードであり、そしてチャンネルでインスタンス化されます。
コードはすでにあなたのために書かれています！
私たちはそれを稼働させるだけです。
これを行うには2つの方法があります。

あなたの設定に関連するオプション **のみ** を選択してください:

- **オプション 1:** IBM Blockchain Service でチェーンコードのインストールとインスタンス化を実施する - [指示](./docs/install_chaincode.md)
- **オプション 2:** :lollipop: チェーンコード SDK のインストールとインスタンス化をローカルに実施する - [指示](./docs/install_chaincode_locally.md)

<a name="hostmarbles"></a>

### 4. Marbles をホストする

最後に、どこかで実行されている Marbles が必要です。

**下記のうち1つのオプションを選択:**

- **Option 1:** IBM Cloud で Marbles をホストする - [指示](./docs/host_marbles_bluemix.md)
- **Option 2:** :lollipop: ローカルで Marbles をホストする - [指示](./docs/host_marbles_locally.md)

***

<a name="use"></a>
# Use Marbles

1. このステップでは、環境設定、ブロックチェーンネットワークの作成、Marbles アプリとチェーンコードの実行が完了している必要があります。大丈夫ですか？大丈夫でなければページ上のヘルプを探してください。
2. お気に入りのWeb ブラウザを開き、[http://localhost:3001](http://localhost:3001) または IBM Cloud wwwルートを開いてください。
    - サイトがロードされない場合は、ノードコンソールのログで Marbles が使用する ホスト名/IP とポートを確認します。
3. ついに、アプリケーションをテストすることができます。`United Marbles` セクションのいずれかのユーザーの `+` アイコンをクリックします。

	![](/doc_images/use_marbles1.png)

4. すべてのフィールドを入力して、`CREATE` ボタンをクリックします。
5. 数秒後に新しい大理石 (Marble) が現れたはずです。
    - この動作はブラウザの更新ボタンを押すか、F5キーを押してページを更新しない場合
6. 次に、大理石を交換しましょう。あるオーナーから別のオーナーに大理石をドラッグアンドドロップします。あなたが複数の大理石の会社を持っている場合、 "United Marbles" 内のオーナーにのみ取引してください。その大理石は一時的に消えて、新しい所有者の大理石として再登場するでしょう。それは大理石のトレードがうまく動作したことを意味します！
    - この動作もページを更新しない場合
7. 今度は大理石をゴミ箱にドラッグアンドドロップして削除しましょう。数秒後に消えるはずです。

	![](/doc_images/use_marbles2.png)

8. ページを更新して、あなたの行動が "stuck" された、つまりチェーンにきちんと積まれたことを再確認してください。
9. 大理石の所有者または大理石の会社名を検索する場合は、検索ボックスを使用します。これは多くの企業/所有者がいる場合に役立ちます。
  - ピンアイコンを使用すると、そのユーザーは検索ボックスでフィルタリングから外れなくなります。
10. 今すぐ特別なウォークスルーをオンにしてください。ページの上部にある `Settings` ボタンをクリックします。
  - ダイアログボックスが開きます。
  - `Enabled` ボタンをクリックしてストーリーモードを有効にする
  - 右上の `x` をクリックしてメニューを閉じます。
  - 別の大理石を選んで別のユーザーにドラッグします。トランザクション処理の内訳が表示されます。Fabricがどのように機能するかをより良く理解できるでしょう。
  - 表示が邪魔で嫌になる前に、ストーリーモードを無効にすることを忘れないでください。
11. おめでとうございます、あなたは正常に動作する Marbles アプリケーションを手に入れました :)

# ブロックチェーンの背景

Marbles デモの動作について説明する前に、Hyperledger Fabricのフローとトポロジについて説明します。
最初にいくつかの定義を確認しておきましょう。

### 定義:

**Peer (ピア)** - ピアはブロックチェーンのメンバーであり、Hyperledger Fabric を実行しています。 Marbles 内では、ピアは私の大理石の会社によって所有され運営されています。

**CA (認証局)** - Certificate Authority(認証局)は、ブロックチェーンネットワークの守衛を担当します。 Marbles node.js アプリケーションなどのクライアントにトランザクション証明書を提供します。

**Orderer (発注者)** - 発注者または発注サービスは、トランザクションをブロックにパッケージ化することを主な役割とするブロックチェーンネットワークのメンバーです。

**Users (ユーザー)** - ユーザーは、ブロックチェーンと対話することが許可されているエンティティです。 Marbles 内では、私たちの管理者です。 ユーザーは照会して元帳に書き込むことができます。

**Blocks (ブロック)** - ブロックにはトランザクションとハッシュが含まれ、整合性を検証します。

**Transactions (取引)** or **Proposals (提案)** - これらはブロックチェーン元帳(レジャー)への作用を表します。 レジャーの読込または書込要求は、取引/提案として送信されます。

**Ledger (元帳)** - これは、ピア上のブロックチェーンのストレージです。 トランザクションパラメータとキー値のペアで構成される実際のブロックデータが含まれます。 チェーンコードで書かれています。

**Chaincode (チェーンコード)** - トランザクションの一部として台帳に保存されるアプリケーション・レベルのコードで、スマートコントラクトとも呼ばれます。これは、資産および資産に関するすべての規則を定義します。

**Assets (資産)** - 資産とは、元帳に存在するエンティティです。 これはキーバリューのペアです。 大理石の文脈では、これは大理石、または大理石の所有者です。

新しい大理石を作るときの操作を見てみましょう。

1. 最初に実行されるのは、私たちの管理者の `user` を私たちのネットワークの `CA` に登録することです。 成功した場合、`CA` は Marbles 登録証明書を送信し、SDK が我々のローカルファイルシステムに保存します。
2. 管理者がユーザーインターフェイスから新しい大理石を作成すると、SDK はトランザクション呼び出しを作成します。
3. 大理石作成のトランザクションは、チェーンコード関数 `init_marble()` を呼び出す `proposal (提案)` として構築されます。
4. Marbles(SDKを介して)は、この `proposal` を承認のために `peer` に送信します。
5. `peer` は、Go関数 `init_marble()` を実行してトランザクションをシミュレートし、`ledger (台帳)` に書き込まれるであろう変更を記録します。
6. 関数が正常に実行された場合、 `peer` は `proposal` を承認し、それを Marbles に返します。エラーが返信された場合 `proposal` は承認されません。
7. Marbles(SDKを介して)は、承認された `proposal` を `orderer (発注者)` に送付します。
8. `orderer` はネットワーク全体から一連の `proposal` を構造化します。 相互に関連するトランザクションを探すことによって、トランザクションの順序が有効であることをチェックします。 競合のためにブロックに追加できないトランザクションはすべてエラーとしてマークされます。 `orderer` は、新しいブロックをネットワークのピアにブロードキャストします。
9. 私たちの `peer` は新しいブロックを受け取り、さまざまな署名とハッシュを見て検証します。 ついにそれは `peer` の `ledger` にコミットされます。
10. この時点で、新しい大理石が私たちの `ledger` に存在し、すぐにすべてのピアの `ledger` にも存在するはずです。

# SDK をより深く理解する

Fabric Client SDK をどう扱うか見ていきましょう。
ほとんどの設定オプションは、"接続プロファイル" (connection profile、別名 cp) にあります。
あなたの接続プロファイルは、`/config/connection_profile_tls.json` のようなファイル、もしくは環境変数から来ているでしょう。
どちらかが不明な場合は、Marbles 開始時のログを確認してください。
環境変数から読み込まれた場合は `Loaded connection profile from an environmental variable`、ファイルから読み込まれた場合は `Loaded connection profile file <some name here>` のようなメッセージが表示されています。
接続プロファイルはJSON形式で、ブロックチェーンネットワークのさまざまなコンポーネントのホスト名(またはIP)とポートなどの情報を含んでいます。
`./utils` フォルダにある `connection_profile_lib` には、SDK 用のデータを取得する関数があります。

### SDK の設定:

最初のアクションは管理者を登録することです。 登録時に次のコードスニペットを見てください。コードの下にコメントや指示があります。

```js
// 管理者の登録
enrollment.enroll = function (options, cb) {
// [ステップ 1]
    var client = new FabricClient();
    var channel = client.newChannel(options.channel_id);
    logger.info('[fcw] Going to enroll for mspId ', options);

// [ステップ 2]
    // eCert kvs (Key Value Store) の作成
    FabricClient.newDefaultKeyValueStore({
        path: path.join(os.homedir(), '.hfc-key-store/' + options.uuid) //kvs ディレクトリに eCert を保存
    }).then(function (store) {
        client.setStateStore(store);

// [ステップ 3]
        return getSubmitter(client, options);              //ここでほとんどの作業が実施される
    }).then(function (submitter) {

// [ステップ 4]
        channel.addOrderer(new Orderer(options.orderer_url, options.orderer_tls_opts));

// [ステップ 5]
        channel.addPeer(new Peer(options.peer_urls[0], options.peer_tls_opts));
        logger.debug('added peer', options.peer_urls[0]);

// [ステップ 6]
        // --- 成功 --- //
        logger.debug('[fcw] Successfully got enrollment ' + options.uuid);
        if (cb) cb(null, { channel: channel, submitter: submitter });
        return;

    }).catch(

        // --- 失敗 --- //
        function (err) {
            logger.error('[fcw] Failed to get enrollment ' + options.uuid, err.stack ? err.stack : err);
            var formatted = common.format_error_msg(err);
            if (cb) cb(formatted);
            return;
        }
    );
};
```

ステップ 1. コードが最初に行うことは、SDKのインスタンスを作成することです。

ステップ 2. 次に `newDefaultKeyValueStore` を使用して登録証明書を格納するキー値ストアを作成します。

ステップ 3. 次に、管理者を登録します。これは、私たちが登録IDを CA で認証し、秘密鍵を登録するときです。CA は、SDK がキーストアに格納する登録証明書を発行します。 デフォルトのキー値ストアを使用しているため、ローカルのファイルシステムに格納されます。

ステップ 4. 登録に成功した後、発注者のURLを設定しました。発注者はまだ必要ではありませんが、チェーンコードを呼び出そうとするときに必要となります。
    - `ssl-target-name-override` を持つビジネスは、自己署名証明書を持っている場合にのみ必要です。
	このフィールドを、PEMファイルの作成に使用した `common name (共通名)` に設定します。

ステップ 5. 次に、ピアURLを設定します。これらもまだ必要ではありませんが、SDK チェーンオブジェクトを完全にセットアップする予定のため、設定しておきます。

ステップ 6. この時点で、SDKは完全に構成されており、ブロックチェーンと対話できる状態になっています。

### コードの構造

このアプリケーションには、3つのコーディング環境があります。

1. チェーンコード部分 - これはブロックチェーンネットワーク上のピアで実行されるGo言語コードです。`cc` とも呼ばれます。すべての大理石/ブロックチェーン取引は最終的にここで実施されます。これらのファイルは `/chaincode` にあります。
2. **クライアント** 側のJS部分 - これはユーザーのブラウザで実行されているJavaScriptコードです。ここでユーザーインターフェイスのやり取りが行われます。これらのファイルは `/public/js` にあります。
3. **サーバー** 側のJS部分 - これは、アプリケーションのバックエンドを実行するJavaScriptコードです。つまり、Marbles の中心である `Node.js` コードです！ `node` または `server` コードと呼ばれることもあります。 大理石の管理者とブロックチェーンの間をつなぐ機能です。これらのファイルは `/utils` と `/routes` にあります。

これらの3つの部分は互いに分離されていることを忘れないでください。
変数や関数を共有しません。
それらは、gRPC、WebSockets、HTTP などのネットワーキングプロトコルを介して通信します。

# Marbles をより深く理解する

うまくいけば、あなたは大理石または2つのユーザー間でうまく取引されているでしょう。
チェーンコードから始めることによって、大理石の移動がどのように行われるのかを見てみましょう。

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
            return shim.Error("Incorrect number of arguments. Expecting 3")
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

この `set_owner()` 関数は、特定の大理石の所有者を変更します。
文字列入力引数の配列を受け取り、成功した場合は `nil` を返します。
配列内では、最初のインデックスは、キーと値のペアのキーでもある大理石の id を持つ必要があります。
まず、この id を使って現在の大理石の構造体を取得する必要があります。
これは `stub.GetState(marble_id)` で行い、それを `json.Unmarshal(marbleAsBytes, &res)` を使って大理石構造にアンマーシャル化(構造体に変換)します。
そこから `res.Owner.Id` で構造体にインデックスを付け、大理石の所有者を新しい所有者のIDで上書きすることができます。
次に、構造体をマーシャル化(JSON形式に変換)して、`stub.PutState()` を使って大理石を新しい属性で上書きすることができます。

1つステップアップし、node.js アプリケーションからこのチェーンコードがどのように呼び出されたかを見てみましょう。

__/utils/websocket_server_side.js__

```js
    //process web socket messages
    ws_server.process_msg = function (ws, data) {
        const channel = cp.getChannelId();
        const first_peer = cp.getFirstPeerName(channel);
        var options = {
            peer_urls: [cp.getPeersUrl(first_peer)],
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

この `process_msg()` のスニペットはすべての websocket メッセージ(app.jsにあるコード)を受け取ります。
どのタイプの ws(websocket) メッセージが送信されたかを検出します。
今回の場合、 `transfer_marble` 型を検出するはずです。
そのコードを見ると、 `options` 変数を設定してから `marbles_lib.set_marble_owner()` を呼び出します。
これは提案を作成し、転送アクションを処理するように SDK に指示する関数です。

次に、その関数を見てみましょう。

__/utils/marbles_cc_lib.js__

```js
    //-------------------------------------------------------------------
    // Set Marble Owner
    //-------------------------------------------------------------------
    marbles_chaincode.set_marble_owner = function (options, cb) {
        console.log('');
        logger.info('Setting marble owner...');

        var opts = {
            peer_urls: g_options.peer_urls,
            peer_tls_opts: g_options.peer_tls_opts,
            channel_id: g_options.channel_id,
            chaincode_id: g_options.chaincode_id,
            chaincode_version: g_options.chaincode_version,
            event_urls: g_options.event_urls,
            endorsed_hook: options.endorsed_hook,
            ordered_hook: options.ordered_hook,
            cc_function: 'set_owner',
            cc_args: [
                options.args.marble_id,
                options.args.owner_id,
                options.args.auth_company
            ],
        };
        fcw.invoke_chaincode(enrollObj, opts, cb);
    };
        ...
```

`set_marble_owner()` 関数は上にリストされています。
重要な部分は、プロポーザルの呼び出し関数名 `set_owner` を設定していることです。
ピアと発注者の URL は、管理者を登録するときに既に設定されていることに注意してください。
デフォルトで SDK は `channel.addPeer` で追加されたすべてのピアにこのトランザクションを送ります。
今回の場合、SDK は1ピアだけを追加したので、SDK は1ピアだけに送信します。
このピアは `enrollment` セクションで追加されたことを忘れないでください。

さて、この WebSocket メッセージを UI からどのように送信したかについて、さらに1つステップアップしてみましょう。

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

`$('.innerMarbleWrap')` を参照する最初のセクションでは、jQuery と jQuery-UI を使ってドラッグアンドドロップ機能を実装していることがわかります。
このコードでは、ドロップ可能なイベントトリガーを取得します。
大部分のコードは、ドロップされた大理石と、ドロップした先のユーザーの詳細を解析するのに費やされます。

イベントが発生すると、最初にこの大理石が所有者を実際に移動したかどうか、またはそれがちょうどピックアップされて元に戻ったかどうかを確認します。
その所有者が変更された場合、 `transfer_marble()` 関数を実行します。
この関数は、必要なすべてのデータを含む JSON メッセージを作成し、websocketを使用して `ws.send()` で送信します。

パズルの最後の部分は、転送が完了したことを Marbles がどのように認識しているかです。
まあ、Marbles は定期的にすべての大理石をチェックし、それを最後の既知の状態と比較します。
違いがある場合は、接続されているすべての JS クライアントに新しい大理石の状態をブロードキャストします。
クライアントはこの websocket メッセージを受け取り、大理石を再描画します。

今、あなたは全体の流れを知っています。
管理者は大理石を移動し、JS はドラッグ/ドロップを検出し、クライアントは websocket メッセージを送信し、Marbles は websocket メッセージを受信し、SDK はプロポーザルをビルド/送信し、ピアはプロポーザルを承認し、SDKは発注の提案を送信し、発注者はブロックを注文しピアに送信し、私達のピアはブロックをコミットし、Marbles のノードコードが定期的に新しい大理石のステータスを取得し、大理石の websocket メッセージをクライアントに送信し、最後にクライアントが新しい状態で大理石を再描画します。

それでおしまい！ あなたが大理石を移して楽しんでくれたらと思います。

# Marbles FAQs

あなたは Marbles の仕組みについて何か質問がありますか？またはどのように実施したらいいか？まずは  [FAQ](./docs/faq.md) をご覧ください。

# フィードバック

私はあなたのフィードバックにとても興味があります。
これはあなたのような人々のために作られたデモであり、あなたのような人々のために改善され続けるでしょう。
デモ/チュートリアルを改善する方法についてご意見がありましたら、お気軽にお問い合わせください。
具体的には:

- この Readme の構成はわかりやすかったですか？
- どの点で迷子になったのですか？
- 何か壊れていますか？
- チュートリアルの最後まで読んで知識が得られましたか？
- 何か理解に苦しむ点はなかったですか？

改善やバグ (そして、理解に苦しむ点など！) を伝えるには、[GitHub Issues](https://github.com/IBM-Blockchain/marbles/issues) セクションを使用してください。

# 貢献

あなたがデモを改善するのを手伝いたいのであれば、[貢献ガイド](./CONTRIBUTING.md) を参照してください。

# ライセンス
[Apache 2.0](LICENSE)

***
