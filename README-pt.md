
# Demonstração do Marbles
## Sobre o Marbles
- A rede subjacente para esse aplicativo é o [Hyperledger Fabric](https://github.com/hyperledger/fabric/tree/master/docs), um projeto da Linux Foundation. Sugerimos revisar estas instruções para entender melhor o Hyperledger Fabric.
- **A finalidade desta demonstração é ajudar um desenvolvedor a aprender as noções básicas do desenvolvimento de aplicativo e chaincode com uma rede Fabric.**
- Esta demonstração de transferência de ativos é `muito simples`. Vários usuários podem criar e transferir bolas de gude entre si.

![](/doc_images/marbles-peek.gif) ***

##### Versões e plataformas suportadas

Existem diversas versões do Marbles. Uma ramificação do Marbles para cada grande liberação do Hyperledger Fabric. Escolha uma versão do Marbles que seja compatível com sua versão do Fabric. Caso não tenha nenhuma versão do Fabric, escolha a versão do Marbles identificada como **mais recente**!
- Marbles - Ramificação v4.0 **(Mais recente)** (Você está visualizando esta ramificação!)
  - Funciona com Hyperledger Fabric `v1.0.1`, `v1.0.0` e `v1.0.0-rc1`
  - Funciona com o IBM Blockchain Bluemix Service
  - Plano **Starter Membership Plan (Beta)**
- [Marbles - Ramificação v3.0](https://github.com/ibm-blockchain/marbles/tree/v3.0) **(Descontinuada)**
  - Funciona com Hyperledger Fabric `v1.0.0-alpha`
  - Não recebe mais suporte do IBM Blockchain Bluemix Service
- [Marbles - Ramificação v2.0](https://github.com/ibm-blockchain/marbles/tree/v2.0) **(Descontinuada)**
  - Funciona com Hyperledger Fabric `v0.6.1-preview`
  - Funciona com IBM Blockchain Bluemix Service
  - Plano **Iniciante** ou **HSBN**
- [Marbles - Ramificação v1.0](https://github.com/ibm-blockchain/marbles/tree/v1.0) **(Descontinuada)**
  - Funciona com Hyperledger Fabric `v0.5-developer-preview`
  - Não recebe mais suporte do IBM Blockchain Bluemix Service ***

# História do Aplicativo
Preparem-se, amigos: este aplicativo vai demonstrar a transferência de bolas de gude entre muitos proprietários de bolas de gude, utilizando o Hyperledger Fabric. Isso será feito em Node.js, com um pouco de GoLang. O backend deste aplicativo será o código GoLang em execução na nossa rede de blockchain. De agora em diante, o código GoLang será chamado de 'chaincode' ou 'cc'. O próprio chaincode vai armazenar uma bola de gude no estado de chaincode, para criá-la. O chaincode consegue armazenar dados como uma cadeia de caractere em uma configuração de par chave/valor. Assim, os objetos JSON serão transformados em uma cadeia de caracteres para armazenar estruturas de alta complexidade.

Atributos de uma bola de gude:

1. id (cadeia de caracteres exclusiva, será usada como chave)
2. cor (cadeia de caracteres, nomes das cores CSS)
3. tamanho (int, tamanho em mm)
4. proprietário (cadeia de caracteres)

Vamos criar uma IU baseada na web que possa definir esses valores e armazená-los em nosso blockchain. A bola de gude será criada no storage do blockchain (ou ledger) como um par chave/valor. A `key` é o ID da bola de gude; o `value` é uma cadeia de caracteres JSON que contém os atributos da bola de gude (listados acima). Para interagir com o cc, você mandará o protocolo gRPC para um par na rede. Os detalhes do protocolo gRPC são manipulados com um SDK chamado SDK do [Hyperledger Fabric Client](https://www.npmjs.com/package/fabric-client). Observe os detalhes de topologia na imagem abaixo.

### Fluxo de Comunicação do Aplicativo
![](/doc_images/comm_flow.png)
1. O administrador interagirá com o Marbles, nosso aplicativo Node.js, pelo navegador dele.
1. O código JS no lado do cliente abrirá um websocket no backend do aplicativo Node.js. O JS do cliente enviará mensagens para o backend quando o administrador interagir com o site.
1. A leitura ou escrita no ledger é conhecida como proposta. Essa proposta é desenvolvida pelo Marbles (pelo SDK) e, em seguida, enviada a um par de blockchain.
1. O par vai se comunicar com o contêiner de chaincode do Marbles. O chaincode executará/simulará a transação. Se não houver problemas, ele aprovará a transação e vai enviá-la de volta para o aplicativo Marbles.
1. Em seguida, o Marbles (pelo SDK) enviará a proposta aprovada ao serviço de ordenação. O ordenador agrupará muitas propostas da rede inteira em um bloco. Depois, transmitirá o novo bloco para pares na rede.
1. Por fim, o par vai validar o bloco e escrevê-lo no ledger. Nesse momento, a transação entrou em vigor; todas as leituras posteriores refletirão essa mudança.

### Pistas do Contexto
Há três peças/mundos distintos que você precisa manter em ordem. Devem ser vistos como ambientes isolados que se comunicam entre si. Este passo a passo vai alternar entre um e outro à medida que configuramos e explicamos cada parte. É importante identificar qual parte é qual. Algumas palavras-chave e pistas do contexto ajudam a distinguir uma da outra.

1. A parte do chaincode - É o código GoLang executado em/com um par na sua rede de blockchain. Também é chamada de `cc`. Todas as interações do Marbles/do blockchain acontecem aqui. Esses arquivos vivem em `/chaincode`.
1. A parte JS no lado do cliente - É o código JavaScript em execução no navegador do usuário. A interação com a interface do usuário acontece aqui. Esses arquivos vivem em `/public/js.`
1. A parte JS no lado do servidor - É o código JavaScript em execução no backend do aplicativo, ou seja, o código `Node.js` que é a essência do Marbles! Às vezes, é chamado de código do `node` ou do `server`. Funciona como a cola entre o administrador da bola de gude e nosso blockchain. Esses arquivos vivem em `/utils` e `/routes`.

Lembre-se: estas três partes são isoladas umas das outras. Não compartilham variáveis nem funções. Vão se comunicar por um protocolo de rede como gRPC ou WebSockets. ***

# Configuração do Marbles
Tenho uma boa notícia e uma má notícia. A boa notícia é que o Marbles e a rede de blockchain podem ser configurados com configurações diferentes, dependendo da sua preferência. A má notícia é que isso complica as instruções. **Caso seja iniciante no Hyperledger Fabric e queira a configuração mais simples, siga o emoji :lollipop:.** Sempre que houver opções e você precisar escolher sua própria aventura, colocarei um emoji :lollipop: na opção mais simples. Esta é a opção para você.

### 0. Configuração do Ambiente Local
Siga estas [instruções](./docs/env_setup.md) de configuração do ambiente para instalar **Git, Go** e **Node.js**.
- Quando terminar, volte para este tutorial. Inicie a próxima seção, "Faça download do Marbles", abaixo. <a name="downloadmarbles"></a>

### 1. Faça download do Marbles
Precisamos fazer o download do Marbles no seu sistema local. Vamos fazer isso com Git, clonando esse repositório. Você precisará realizar essa etapa mesmo se quiser hospedar o Marbles no Bluemix.
- Abra um terminal/prompt de comando e navegue até o diretório de trabalho desejado
- Execute o comando a seguir:
```
git clone https://github.com/IBM-Blockchain/marbles.git --depth 1 cd marbles git checkout v4.0
```
- Ótimo! Vejo você na 2ª etapa. <a name="getnetwork"></a>

### 2. Faça um Network
Hello novamente. Agora, precisamos de uma rede de blockchain. **Escolha uma opção abaixo:**
- **Opção 1:** Crie uma rede com o Bluemix IBM Blockchain Service - [instruções](./docs/use_bluemix_hyperledger.md)
- **Opção 2:** :lollipop: Use uma rede Hyperledger Fabric hospedada localmente - [instruções](./docs/use_local_hyperledger.md) <a name="installchaincode"></a>

### 3. Instale e crie uma instância do chaincode
OK, estamos quase lá! Agora, precisamos colocar o chaincode do Marbles em execução. Lembre-se: o chaincode é um componente vital que, em última análise, cria as transações de bolas de gude no ledger. O código GoLang precisa ser instalado no nosso par e, em seguida, instanciado em um canal. O código já foi escrito para você! Precisamos apenas colocá-lo em execução. Há duas maneiras de fazer isso.

Escolha a **única** opção que é relevante para sua configuração:
- **Opção 1:** Instale e crie uma instância do chaincode com seu IBM Blockchain Service - [instruções](./docs/install_chaincode.md)
- **Opção 2:** :lollipop: Instale e crie uma instância do chaincode com o SDK localmente - [instruções](./docs/install_chaincode_locally.md) <a name="hostmarbles"></a>

### 4. Hospede o Marbles
Finalmente, precisamos executar o Marbles em algum lugar. **Escolha uma opção abaixo:**
- **Opção 1:** Hospede o Marbles no Bluemix - [instruções](./docs/host_marbles_bluemix.md)
- **Opção 2:** :lollipop: Hospede o Marbles localmente - [instruções](./docs/host_marbles_locally.md) *** <a name="use"></a>

# Use o Marbles

1. Se você está nesta etapa, seu ambiente deve estar configurado, a rede de blockchain deve ter sido criada, o aplicativo Marbles e o chaincode devem estar em execução. Certo? Caso contrário, procure ajuda (na página).
1. Abra seu navegador favorito e navegue até [http://localhost:3001](http://localhost:3001) ou até a rota www do Bluemix.
    - Se o site não carregar, verifique o nome do host/IP e a porta que o Marbles está usando nos logs do console do nó.
1. Por fim, podemos testar o aplicativo. Clique no ícone "+" em um dos seus usuários, na seção "United Marbles"


![](/doc_images/use_marbles1.png)
4. Preencha todos os campos e, a seguir, clique no botão "CREATE"
1. Depois de alguns segundos, sua nova bola de gude deve aparecer.
    - Caso contrário, pressione o botão de atualização no seu navegador ou pressione F5 para atualizar a página.

1. Em seguida, vamos trocar uma bola de gude. Arraste e solte uma bola de gude de um proprietário para outro. Negocie com proprietários em "United Marbles" somente se tiver várias empresas de bolas de gude. A bola de gude deve desaparecer temporariamente e, depois, ser redesenhada com o novo proprietário. Isso significa que funcionou!
    - Caso contrário, atualize a página

1. Agora, para excluir uma bola de gude, vamos arrastá-la e soltá-la na lixeira. Ela deve desaparecer depois de alguns segundos.

![](/doc_images/use_marbles2.png)
8. Atualize a página para verificar novamente se suas ações "pegaram".

1. Use a caixa de procura para filtrar os proprietários de bolas de gude ou os nomes das empresas de bolas de gude. Isso é útil quando há muitas empresas/proprietários. - O ícone do pino impedirá que um usuário seja filtrado pela caixa de procura.

1. Agora, vamos ativar o passo a passo especial. Clique no botão "Settings", perto da parte superior da página. - Será aberta uma caixa de diálogo.
    - Clique no botão "Enabled" para habilitar Story Mode
    - Clique no "x", no canto superior direito, para fechar o menu.
    - Agora, escolha outra bola de gude e arraste-a para outro usuário. Você deve ver uma análise do processo da transação. Esperamos que ela lhe dê uma ideia melhor de como o Fabric funciona.
    - Lembre-se: é possível desativar o Story Mode quando ele se tornar frustrantemente repetitivo e você não se reconhecer mais.

1. Parabéns por ter um aplicativo Marbles que funciona :)!

# História do Blockchain

Antes de falarmos sobre o funcionamento do Marbles, vamos discutir o fluxo e a topologia do Hyperledger Fabric. Primeiro, vamos ver algumas definições.
### Definições:

**Par** - Um par é um membro do blockchain e executa o Hyperledger Fabric. No contexto da bola de gude, os pares pertencem e são operados pela minha empresa de bolas de gude.

**CA** - A CA (Autoridade de Certificação) é responsável pelo gatekeeping da rede de blockchain. Ela fornecerá certificados de transação para clientes como o aplicativo Marbles node.js.

**Ordenador** - Um ordenador ou serviço de ordenação é um membro da rede de blockchain cuja principal responsabilidade é agrupar transações em blocos.

**Usuários** - Um usuário é uma entidade autorizada a interagir com o blockchain. No contexto do Marbles, é nosso administrador. O usuário pode consultar e escrever no ledger.

**Blocos** - Os blocos contêm transações e um hash para verificar a integridade.

**Transações** ou

**Propostas** - Representam interações com o ledger do blockchain. Uma solicitação de leitura ou escrita do ledger é enviada como uma transação/proposta.

**Ledger** - É o armazenamento do blockchain em um par. Contém os dados reais do bloco, que consistem em parâmetros da transação e pares chave-valor. É escrito por chaincode.

**Chaincode** - Chaincode é como o Hyperledger Fabric se refere a contratos inteligentes. Define os ativos e todas as regras a respeito deles.

**Ativos** - Um ativo é uma entidade que existe no ledger. É um par chave-valor. No contexto do Marbles, é uma bola de gude ou um proprietário de bolas de gude.

Vamos dar uma olhada nas operações envolvidas na criação de uma nova bola de gude.
1. A primeira coisa que acontece no Marbles é o registro do `user` administrativo com a `CA` da rede. Se for concluído com sucesso, a `CA` enviará certificados de inscrição no Marbles que o SDK armazenará para nós em nosso sistema de arquivos local.
1. Quando o administrador cria uma nova bola de gude na interface com o usuário, o SDK cria uma transação de invocação.
1. A transação de criação de bola de gude é desenvolvida como uma `proposal` para invocar a função de chaincode `init_marble()`.
1. O Marbles (pelo SDK) enviará essa `proposal` a um `peer` para aprovação.
1. O `peer` simulará a transação executando a função Go `init_marble()` e registrará todas as mudanças que tentou escrever no `ledger`.
1. Se a função for gerada com sucesso, o `peer` aprovará a `proposal` e vai devolvê-la ao Marbles. Erros também serão devolvidos, mas a `proposal` não será aprovada.
1. Em seguida, o Marbles (pelo SDK) enviará a `proposal` aprovada ao `orderer`.
1. O `orderer` organizará uma sequência de `proposals` de toda a rede. Para verificar se a sequência de transações é válida, procurará transações em conflito umas com as outras. Todas as transações que não podem ser adicionadas ao bloco por causa de conflitos serão marcadas como erros. O `orderer` transmitirá o novo bloco para pares na rede.
1. Nosso `peer` receberá o novo bloco e, para validá-lo, examinará várias assinaturas e hashes. Em seguida, será finalmente confirmado no `ledger` do `peer`.
1. Neste momento, a nova bola de gude existe em nosso ledger e, em breve, deverá existir nos ledgers de todos os pares.

# Detalhes do SDK
Agora, vamos ver como é a interface com o Fabric Client SDK. A maioria das opções de configuração está disponível em `/config/connection_profile_tls.json`. Esse arquivo mostra o nome do host (ou IP) e a porta de vários componentes da rede de blockchain. As funções `helper` recuperarão IPs e portas do arquivo de configuração.
### Configure o SDK:

A primeira ação é inscrever o administrador. Observe o fragmento de código a seguir na inscrição. Há comentários/instruções abaixo do código.

```js
//enroll admin enrollment.enroll = function (options, cb) { // [Step 1] var client = new FabricClient(); var channel = client.newChannel(options.channel_id); logger.info('[fcw] Going to enroll for mspId ', options); // [Step 2] // Make eCert kvs (Key Value Store) FabricClient.newDefaultKeyValueStore({ path: path.join(os.homedir(), '.hfc-key-store/' + options.uuid) //store eCert in the kvs directory }).then(function (store) { client.setStateStore(store); // [Step 3] return getSubmitter(client, options); //do most of the work here }).then(function (submitter) { // [Step 4] channel.addOrderer(new Orderer(options.orderer_url, options.orderer_tls_opts)); // [Step 5] channel.addPeer(new Peer(options.peer_urls[0], options.peer_tls_opts)); logger.debug('added peer', options.peer_urls[0]); // [Step 6] // --- Success --- // logger.debug('[fcw] Successfully got enrollment ' + options.uuid); if (cb) cb(null, { channel: channel, submitter: submitter }); return; }).catch( // --- Failure --- // function (err) { logger.error('[fcw] Failed to get enrollment ' + options.uuid, err.stack ? err.stack : err); var formatted = common.format_error_msg(err); if (cb) cb(formatted); return; } ); };
```



Etapa 1. A primeira coisa que o código faz é criar uma instância do nosso SDK.

Etapa 2. Em seguida, criamos um armazenamento de valor da chave para armazenar os certificados de inscrição com `newDefaultKeyValueStore`

Etapa 3. Depois, inscrevemos nosso administrador. É neste momento que ocorre a autenticação com a CA, usando o ID da inscrição e o segredo da inscrição. A CA emitirá certificados de inscrição que o SDK armazenará no armazenamento de valor da chave. Como estamos usando o armazenamento de valor da chave, ele será armazenado no sistema de arquivos local.

Etapa 4. Após uma inscrição concluída com êxito, definimos a URL do ordenador. O ordenador ainda não é necessário, mas será quando tentarmos invocar o chaincode. - O negócio com `ssl-target-name-override` será necessário somente se você tiver certificados autoassinados. Defina este campo para ser igual ao `common name` que você usou para criar o arquivo PEM.

Etapa 5. Em seguida, vemos as URLs do par. Elas tampouco são necessárias no momento, mas vamos configurar por completo nosso objeto de cadeia de SDK.

Etapa 6. Neste momento, o SDK está totalmente configurado e pronto para interagir com o blockchain.

# Detalhes do Marbles

Tomara que você tenha conseguido trocar uma ou duas bolas de gude entre os usuários. Para ver como ocorre uma transferência de bola de gude, vamos começar no chaincode. __/chaincode/marbles.go__
```go
type Marble struct { ObjectType string `json:"docType"` Id string `json:"id"` Color string `json:"color"` Size int `json:"size"` Owner OwnerRelation `json:"owner"` }
```
__/chaincode/write_ledger.go__
```go
func set_owner(stub shim.ChaincodeStubInterface, args []string) pb.Response { var err error fmt.Println("starting set_owner") // this is quirky // todo - get the "company that authed the transfer" from the certificate instead of an argument // should be possible since we can now add attributes to the enrollment cert // as is.. this is a bit broken (security wise), but it's much much easier to demo! holding off for demos sake if len(args) != 3 { return shim.Error("Incorrect number of arguments. Expecting 3") } // input sanitation err = sanitize_arguments(args) if err != nil { return shim.Error(err.Error()) } var marble_id = args[0] var new_owner_id = args[1] var authed_by_company = args[2] fmt.Println(marble_id + "-&gt;" + new_owner_id + " - |" + authed_by_company) // check if user already exists owner, err := get_owner(stub, new_owner_id) if err != nil { return shim.Error("This owner does not exist - " + new_owner_id) } // get marble's current state marbleAsBytes, err := stub.GetState(marble_id) if err != nil { return shim.Error("Failed to get marble") } res := Marble{} json.Unmarshal(marbleAsBytes, &amp;res) //un stringify it aka JSON.parse() // check authorizing company if res.Owner.Company != authed_by_company{ return shim.Error("The company '" + authed_by_company + "' cannot authorize transfers for '" + res.Owner.Company + "'.") } // transfer the marble res.Owner.Id = new_owner_id //change the owner res.Owner.Username = owner.Username res.Owner.Company = owner.Company jsonAsBytes, _ := json.Marshal(res) //convert to array of bytes err = stub.PutState(args[0], jsonAsBytes) //rewrite the marble with id as key if err != nil { return shim.Error(err.Error()) } fmt.Println("- end set owner") return shim.Success(nil) }
```
A função `set_owner()` alterará o proprietário de uma bola de gude específica. Utiliza uma array de cadeias de caracteres para inserir argumento e gera `nil` quando é bem-sucedido. Dentro da array, o primeiro índice deve ter o ID da bola de gude, que também é a chave no par chave/valor. Primeiro, precisamos recuperar a estrutura de bola de gude atual usando esse ID. Isso é feito com `stub.GetState(marble_id)`; depois, desordene em uma estrutura de bola de gude com `json.Unmarshal(marbleAsBytes, &amp;res)`. Ali, podemos indexar na estrutura com `res.Owner.Id` e substituir o proprietário da bola de gude pelo ID do novo proprietário. A seguir, é possível ordenar a estrutura novamente para podermos usar `stub.PutState()` a fim de substituir a bola de gude pelos novos atributos.

Vamos avançar uma etapa e ver como esse chaincode foi ativado a partir do aplicativo node.js.

__/utils/websocket_server_side.js__
```js
//process web socket messages ws_server.process_msg = function (ws, data) { const channel = helper.getChannelId(); const first_peer = helper.getFirstPeerName(channel); var options = { peer_urls: [helper.getPeersUrl(first_peer)], ws: ws, endorsed_hook: endorse_hook, ordered_hook: orderer_hook }; if (marbles_lib === null) { logger.error('marbles lib is null...'); //can't run in this state return; } // create a new marble if (data.type == 'create') { logger.info('[ws] create marbles req'); options.args = { color: data.color, size: data.size, marble_owner: data.username, owners_company: data.company, owner_id: data.owner_id, auth_company: process.env.marble_company, }; marbles_lib.create_a_marble(options, function (err, resp) { if (err != null) send_err(err, data); else options.ws.send(JSON.stringify({ msg: 'tx_step', state: 'finished' })); }); } // transfer a marble else if (data.type == 'transfer_marble') { logger.info('[ws] transferring req'); options.args = { marble_id: data.id, owner_id: data.owner_id, auth_company: process.env.marble_company }; marbles_lib.set_marble_owner(options, function (err, resp) { if (err != null) send_err(err, data); else options.ws.send(JSON.stringify({ msg: 'tx_step', state: 'finished' })); }); } ...
```
Esse fragmento de `process_msg()` recebe todas as mensagens de websocket (código encontrado em app.js). Detectará qual tipo de mensagem ws (websocket) foi enviado. Em nosso caso, deve detectar um tipo `transfer_marble`. Olhando para esse código, podemos ver que ele configurará uma variável `options` e iniciará `marbles_lib.set_marble_owner()`. Essa é a função que dirá ao SDK para desenvolver a proposta e processar a ação de transferência.

Em seguida, vamos dar uma olhada nessa função.

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

A função `set_marble_owner()` está listada acima.
O importante é que está configurando o nome da função de invocação da proposta como "set_owner" com a linha `fcn: 'set_owner'`.
Observe que as URLs do par e do ordenador já haviam sido configuradas quando inscrevemos o administrador.
Por padrão, o SDK enviará essa transação a todos os pares que foram adicionados com `channel.addPeer`.
Em nosso caso, o SDK enviará para apenas um par, já que adicionamos apenas um par.
Lembre-se: esse par foi adicionado na seção `enrollment`.

Agora, vamos avançar mais uma etapa e ver como enviamos essa mensagem de websocket a partir da IU. __/public/js/ui_building.js__
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
Na primeira seção que faz referência a `$('.innerMarbleWrap’)`, é possível ver que usamos jQuery e jQuery-UI para implementar a funcionalidade de arrastar e soltar. Com esse código, conseguimos um acionador de evento para soltar eventos arrastados. Grande parte do código é usada em uma análise sintática dos detalhes da bola de gude que foi solta e do usuário para o qual foi solta.

Quando o evento é acionado, primeiramente verificamos se a bola de gude realmente mudou de proprietário ou se foi apenas apanhada e solta novamente. Se o proprietário mudou, passamos para a função `transfer_marble()`. Essa função cria uma mensagem JSON com todos os dados necessários e usa nosso websocket para enviá-la com `ws.send()`.

A última peça do quebra-cabeça, que mostra como o Marbles faz a transferência, foi montada. Bem, o Marbles verificará periodicamente todas as bolas de gude e comparará isso com o último estado conhecido. Se houver uma diferença, o novo estado da bola de gude será transferido para todos os clientes JS conectados. Os clientes receberão essa mensagem de websocket e redesenharão as bolas de gude.

Agora, você já conhece todo o fluxo. O administrador moveu a bola de gude, o JS detectou a ação de arrastar/soltar, o cliente envia uma mensagem de websocket, o Marbles recebe a mensagem de websocket, o SDK desenvolve/envia uma proposta, o par aprova a proposta, o SDK envia a proposta para ordenação, o ordenador ordena e envia um bloco ao par, o par confirma o bloco, o código de nó do Marbles recebe um novo status da bola de gude periodicamente, uma mensagem de websocket da bola de gude é enviada ao cliente e, por fim, o cliente redesenha a bola de gude em seu novo lar.

É isso! Espero que você tenha se divertido com a transferência de bolas de gude.

# Perguntas mais frequentes sobre o Marbles
Você tem alguma dúvida sobre _por que_ algo acontece de determinada maneira no Marbles? Ou sobre _como_ fazer alguma coisa? Confira as [FAQs](./docs/faq.md) .

# Feedback
Estou muito interessado no seu feedback. Esta demonstração foi feita para pessoas como você e continuará sendo adaptada para pessoas como você. Em uma escala de tratamento de canal sem anestesia a cesta com filhotes de cachorro, como foi? Se você tiver alguma ideia a respeito de como melhorar a demonstração/tutorial, entre em contato! Especificamente:
- O formato do readme funcionou bem para você?
- Em quais pontos você se perdeu?
- Alguma coisa está com defeito!?
- Seu crescimento aumentou graças ao tutorial?
- Algo foi particularmente complicado?
- Você acabou tendo uma crise existencial e, de repente, não sabe mais o que significa ser você?

Use a seção [GitHub Issues](https://github.com/IBM-Blockchain/marbles/issues) para comunicar melhorias/bugs e pontos críticos!
# Contribua
Se quiser ajudar a melhorar a demonstração, confira o [guia de contribuição](./CONTRIBUTING.md)
# Licença
[Apache 2.0](LICENÇA)

***
