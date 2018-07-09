*Read this in other languages: [English](README.md), [中国](README-cn.md), [português](README-pt.md)
# Marbles Demo

## 예제 소개
- 이 애플리케이션은 Linux Foundation 프로젝트 [Hyperledger Fabric](https://github.com/hyperledger/fabric/tree/master/docs) 네트워크를 기반으로 한 예제입니다. Hyperledger Fabric에 대한 이해가 필요하다면 아래에 별첨되는 지침(instructions)들을 확인하세요.
- **이 데모는 개발자가 Fabric 네트워크를 이용하여 체인코드와 앱 개발의 기본을 배울 수 있도록 도와 줍니다.**
- 이 예제는 `매우 단순하게` 자산(asset, 예제에서는 marble)이 이동하는 것을 시연한 데모이며, 여러 사용자가 서로 자산을 만들어 전달할 수 있습니다.

	![](/doc_images/marbles-peek.gif)

### 버젼
Marbles 예제에는 여러가지 버전이 있습니다. 이 버전은 **Hyperledger Fabric v1.1x**과 호환됩니다. 다른 버젼의 예제는 다른 브랜치에서 확인할 수 있습니다.

***

# 애플리케이션 설명

이 애플리케이션을 통해 Hyperledger Fabric을 이용하여 여러 marbles 소유자들 간에 자산(marble)이 이동하는 과정을 확인할 수 있습니다.
위 과정은 Node.js와 GoLang로 구현되었으며, 이 애플리케이션의 백엔드에서 GoLang으로 구현된 코드가 블록체인 네트워크에서 실행됩니다.
아래 내용부터는 GoLang으로 구현된 코드를 '체인코드(chaincode)' 또는 'cc'로 부르도록 하겠습니다.
체인코드는 자체적으로 체인코드 상태를 기록(저장)하여 marble을 만들며, key/value 문자열쌍을 데이터로 저장할 수 있습니다.
따라서, 체인코드에는 다양한 구조의 데이터를 저장할 수 있도록 JSON 형식으로 변환(stringify)되어 저장됩니다.

marble 데이터 속성:

  1. id (unique string, 키 값으로 사용되는 유니크한 문자)
  2. color (string, css 색상 값)
  3. size (int, marble(구슬) 사이즈)
  4. owner (string, 소유자명)

우리는 위의 값들을 설정할 수 있는 UI를 만들어 블록체인의 원장에 저장할 예정입니다.
marble은 key와 value 쌍으로 이루어져 있으며,
`key`는 marble의 ID이고, `value`는 marble의 속성을 담고 있는 JSON 문자열입니다(위에 나열됨).
체인코드(cc)는 gRPC 프로토콜을 이용하여 네트워크의 peer로 접속되어 상호작용합니다.
gRPC 프로토콜에 대한 상세 내용은 [Hyperledger Fabric Client](https://www.npmjs.com/package/fabric-client)라고 불리는 SDK에서 확인할 수 있습니다.
토폴로지에 대한 상세 내용은 아래 그림을 참고하십시오.

### 애플리케이션 통신 흐름

![](/doc_images/comm_flow.png)

1. 관리자는 브라우저에서 Node.js으로 구현된 애플리케이션을 통해 Marble들을 관리할 것입니다.
1. 이 클라이언트 측 JS 코드는 백엔드 Node.js 애플리케이션과 연결을 위한 websocket을 엽니다. 관리자가 사이트에서 액션을 취하면 클라이언트 측 JS 코드가 백엔드로 메시지를 보냅니다.
1. 원장(ledger)을 읽거나 쓰는 것은 제안(proposal)이란 방법을 이용하는데, 이 제안은 `Marbles`(SDK를 통해)에서 작성된 다음 블록체인 `Peer`로 전송(queries)됩니다.
1. `Peer`는 `Marbles`의 체인코드 컨테이너와 통신합니다. 체인코드가 트랜잭션을 실행 및 테스트(run/simulate)한 후, 만약 어떤 문제가 없다면 그 트랜잭션을 승인하고 그 결과를 `Marbles` 애플리케이션으로 돌려 보냅니다.
1. `Marbles` 애플리케이션은 (SDK를 통해) 승인된 제안을 `Ordering Service`로 보낼 것이며, orderer는 수신한 여러 제안을 블록으로 패키징 한 다음, 네트워크의 peer에 새 블록을 브로드캐스트 합니다.
1. 최종적으로 `Peer`는 블록의 유효성을 확인하고 원장에 기록합니다. 이제 제안을 통한 트랜잭션이 적용되었으며 이후의 모든 요청에 이러한 변경 사항이 반영됩니다.

***

# Marbles Setup

아래의 다양한 지침에 따라 **당신이** *정말* 원하는 설치 유형을 결정하세요.
개발자용 설치를 건너뛰고 싶을 경우 단순한(brainless) 2-3번의 클릭으로 Marbles를 실행할 수 있으며,
개발자용 설치를 원하는 경우에는 아래의 0에서 4까지의 지침을 따릅니다.
설치가 끝날 때쯤에는 당신은 Hyperledger Fabric 전문가가 될 것이고, 스스로 설계(design)한 애플리케이션을 개발할 준비가 될 것입니다.

이 모든 것을 건너뛰고 IBP([IBM Blockchain Platform](https://console.bluemix.net/developer/blockchain/dashboard)) 네트워크에서 Marbles를 사용해 보려면 [Toolchain 설치 흐름](./.bluemix/README.md)을 따르십시오. 친구들에게 깊은 인상을 심어 주고 싶다면, 둘 다 해 보세요.

이미 Toolchain 설치를 완료한 경우에는 [Marbles 사용하기로 건너뛰기](./README.md#use)를 선택하세요.
개발자용 설치를 선택한 경우에는 아래 내용을 계속해서 읽어 보세요.
좋은 소식은 Marbles 예제와 블록체인 네트워크가 사용자의 선호도에 따라 다른 구성으로 설치 될 수 있다는 것입니다.
나쁜 소식은 이것이 지침을 복잡하게 만든다는 것이다.
**Hyperledger Fabric을 처음 사용하는 경우, 가장 간단한 설치 과정을 원한다면 :lollipop: 이모지가 표시된 지침을 따르세요.**
당신은 지침을 따를 때(your own adventure)마다, 옵션을 선택할 수 있고 저는 가장 간단한 옵션에 :lollipop:를 떨어뜨려 놓을 것입니다. 이것은 당신을 위한 옵션입니다.

### 0. 로컬환경에 설치

**Git**과 **Go**, **Node.js**를 설치하기 위해 [지침](./docs/env_setup.md)에 따라 환경을 세팅합니다.

- 완료되면 이 자습서로 돌아오십시오. 아래의 "Marbles 다운로드" 섹션을 시작합니다.

<a name="downloadmarbles"></a>

### 1. Marbles 다운로드
로컬환경에 Marbles을 다운로드 받아야 합니다.
Git을 사용하여 이 저장소를 내려받습니다 (clone).
IBM Cloud에서 Marbles을 호스팅 하려는 경우에도 이 단계를 수행해야 합니다.

- 명령 프롬프트/터미널을 열고 원하는 작업 디렉토리로 이동합니다.
- 다음 명령을 실행합니다:

	```
	git clone https://github.com/IBM-Blockchain/marbles.git --depth 1
	cd marbles
	```

- 좋습니다. 2단계로 넘어갑니다.

<a name="getnetwork"></a>

### 2. 네트워크 연결

다시 만났군요. 이제 우리는 블록체인 네트워크가 필요합니다.

**아래 옵션 중 한가지를 선택하세요:**

- **Option 1:** IBM Cloud, IBM Blockchain Service에 네트워크 생성 - [지침](./docs/use_bluemix_hyperledger.md)
- **Option 2:** :lollipop: 로컬 환경에서 Hyperledger Fabric 네트워크 사용 - [지침](./docs/use_local_hyperledger.md)

<a name="installchaincode"></a>

### 3. 체인코드 설치 및 인스턴스화

좋아요, 거의 다 왔어요! 이제 우리는 marbles의 체인코드를 실행할 필요가 있어요.
체인코드는 궁극적으로 원장에서 marbles 트랜잭션을 만드는 중요한 요소라는 것을 기억하세요.
체인코드는 GoLang으로 작성된 코드로 우리의 peer 위에 설치하고 채널에서 인스턴스화 할 필요가 있습니다.
코드는 이미 작성되어 있고, 우리는 단지 그것을 실행시키기만 하면 됩니다.
체인코드를 실행하는데는 두가지 방법이 있습니다.

진행중인 설치방법과 관련된 옵션 **한가지**를 선택하세요:

- **Option 1:** IBM Blockchain Service에 체인코드 설치 및 인스턴스화 - [지침](./docs/install_chaincode.md)
- **Option 2:** :lollipop: 로컬 환경에 SDK와 함께 체인코드 설치 및 인스턴스화 - [지침](./docs/install_chaincode_locally.md)

<a name="hostmarbles"></a>

### 4. Marbles 호스팅

마지막으로 중요한 것은 우리는 어딘가에 marbles이 실행될 곳이 필요하다는 것입니다.

**아래 옵션 한가지를 선택하세요:**

- **Option 1:** IBM Cloud에서 Marbles 호스팅 - [지침](./docs/host_marbles_bluemix.md)
- **Option 2:** :lollipop: 로컬에서 Marbles 호스팅 - [지침](./docs/host_marbles_locally.md)

***

<a name="use"></a>

# Marbles 사용하기

1. 이 단계에서는 환경 설정, 블록체인 네트워크 생성, marbles 앱 및 체인코드가 실행되고 있어야 합니다. 그렇죠? 그렇지 않다면 위에서 진행한 내용을 다시 확인해주세요.
1. 브라우저를 실행하고 [http://localhost:3001](http://localhost:3001) 또는 IBM Cloud의 접속 경로로 이동합니다.
    - 사이트가 로드되지 않는 경우, hostname/ip의 node 콘솔 로그와 marbles 포트가 사용되고 있는지 확인합니다.
1. 이제 애플리케이션을 테스트할 수 있습니다. "United Marbles" 섹션에서 사용자 중 하나의 "+" 아이콘을 클릭합니다.

	![](/doc_images/use_marbles1.png)

1. 모든 필드를 입력한 다음 "CREATE" 버튼을 클릭합니다.
1. 몇초 후, 새로운 구슬(marble)이 표시됩니다.
    - (브라우저의 새로 고침 버튼을 누르거나, F5키를 눌러 페이지를 새로 고치지 않은 경우에 해당 합니다.)
1. 다음으로 구슬을 교환해 봅시다. 구슬을 한 소유자에게서 다른 소유자에게 끌어다 놓으세요. 구슬 회사(marble companies)가 여럿 있을 경우에만 "United Marbles" 내에 있는 소유자들과 바꾸세요. 구슬은 일시적으로 사라지고 새로운 소유자에게서 다시 구슬이 생겨납니다. 그렇다면 정상적으로 작동했다는 것을 의미합니다!
    - (페이지를 새로 고치지 않은 경우에 해당 합니다.)
1. 이제 구슬을 휴지통에 드래그 앤 드롭해 봅시다. 구슬은 몇초 후에 사라질 것입니다.

	![](/doc_images/use_marbles2.png)

1. 페이지를 새로 고쳐 작업이 적용되었는지 다시 확인합니다.
1. 구슬 소유자나 구슬 회사명을 필터링 할 때 검색 상자를 사용합니다. 이것은 회사나 소유자가 많을 때 유용합니다.
    - 핀(pin) 아이콘을 사용하면 해당 사용자가 검색 상자에서 필터링 되지 않습니다.
1. 이제 특별한 기능을 안내 하겠습니다. 페이지 상단의 설정("Settings")버튼을 클릭합니다.
	- 메뉴 상자가 열립니다.
	- "Enabled" 버튼을 클릭하여 스토리 모드를 활성화합니다.
	- 오른쪽 상단의 "x"를 클릭하여 메뉴를 닫습니다.
	- 이제 다른 구슬을 선택하여 다른 사용자에게 끌어다 놓습니다. 트랜잭션 과정이 세분화되어 나타납니다. 이 과정을 통해 Fabric이 어떻게 동작하는지 더 자세히 확인할 수 있습니다.
	- 스토리 모드가 당신을 성가시게 만든다면 다시 스토리 모드를 비활성화할 수 있다는 것을 기억하세요.
1. 축하합니다. 이제 marbles 애플리케이션을 충분히 다룰 수 있습니다 :)!


# 블록체인 배경지식
Marbles의 작동 방식에 대해 이야기하기 전에 Hyperleder Fabric의 흐름과 토폴로지에 대해 살펴보겠습니다.
먼저 몇가지 정의부터 알아봅시다.

### 용어 정의:

**Peer** - Peer는 블록체인 네트워크의 멤버로, Hyperledger Fabric을 실행하고 있습니다. marbles 예제 맥락에서 보면, Peer들은 특정 구슬 회사에 의해 소유되고 운영됩니다.

**CA** - CA(인증 기관)는 블록체인 네트워크의 게이트키핑(gatekeeping)을 담당합니다. 이것은 marbles 예제의 node.js 애플리케이션과 같이, 클라이언트 측의 트랜잭션이 유효한지 증명합니다.

**Orderer** - Orderer 또는 Ordering Service는 블록에 트랜잭션을 묶어서 일괄 처리하는 것이 주 목적인 블록체인 네트워크의 멤버입니다.

**Users** - User는 블록체인과 상호 작용할 수 있는 권한을 가진 하나의 주체(entity)입니다. Marbles 예제에서, User는 관리자(Admin)를 뜻합니다. User는 원장을 조회하거나 가록할 수 있습니다.

**Blocks** - 블록에는 무결성을 확인하기 위한 트랜잭션과 해시(hash)가 포함되어 있습니다.

**Transactions** or **Proposals** - 블록체인의 원장에 대한 상호 작용을 나타냅니다. 원장의 읽기 또는 쓰기 요청은 트랜잭션 또는 제안의 형태로 보내집니다.

**Ledger** - Peer가 블록체인에서 사용하는 저장소(storage)입니다. 여기에는 트랜잭션 파라미터와 key/value 쌍으로 구성된 실제 블록 데이터가 포함됩니다. 원장(Ledger)은 체인코드에 의해 기록됩니다.

**Chaincode** - 체인코드는 스마트 컨트랙트를 Hyperledger Fabric에서 칭하는 용어입니다. 자산(assets) 및 자산과 관련된 모든 규칙을 정의합니다.

**Assets** - 자산은 원장이 가지는 가치 또는 실체(entity)입니다. key/value 쌍으로 이뤄져 있으며, marbles 예제에서 자산은 구슬(marble) 또는 구슬의 소유자입니다.

그럼 새로운 구슬이 만들어질 때 동작하는 과정을 살펴봅시다.

1. Marbles에서 가장 먼저 일어나는 일은 관리자인 `사용자(user)`를 네트워크의 `CA`에 등록하는 것입니다. 만약 성공한다면, `CA`는 SDK가 로컬 파일 시스템에 저장하도록 Marbles 등록 인증서(certificates)를 보낼 것입니다.
1. 관리자가 UI에서 새 구슬을 생성한다면, SDK에서 구술 생성 호출 트랜잭션이 생성됩니다.
1. 구슬 생성 트랜잭션은 기존에 작성된 체인코드 기능인 `init_marble()`을 호출하기 위한 `제안(proposal)`을 만듭니다.
1. (SDK를 통해) Marbles 애플리케이션은 이 `제안(proposal)`의 승인을 받기 위해 `peer` 에게 전달합니다.
1. `peer`는 체인코드(GoLang) 기능인 `init_marble()` 가 실행될때 `ledger`에 쓸 내용에 대해 어떤 변화가 있는지 트랜잭션을 시뮬레이션 할 것입니다.
1. 만약 함수가 성공적으로 리턴된다면 `peer`는 `proposal`을 승인하고, 결과(제안)를 Marbles 애플리케이션으로 전달합니다. 오류 또한 전달될 수 있지만, 이 경우 `proposal`은 승인되지 않습니다.
1. Marbles는 (SDK를 통해) 승인된 `proposal` 를 `orderer` 에게 보낼 것입니다.
1. `orderer`는 네트워크 전체에서 일련의 `proposals`를 취합합니다. 이 작업은 서로 충돌하는 거래 내용(트랜잭션)을 찾음으로써 트랜잭션 순서가 유효한지 확인합니다. 충돌로 인해 블록에 추가할 수 없는 모든 트랜잭션은 오류로 표시됩니다. `orderer`는 이렇게 생성된 새로운 블록을 브로드캐스트(broadcast)로 네트워크에 있는 peer에게 전달합니다.
1. `peer`들은 새로운 블록을 받아 다양한 서명과 해시 내용을 검증할 것입니다. 검증이 완료되면 `peer's` `ledger`에 블록 내용이 기록(committed)됩니다.
1.  이 시점에서 새로운 구슬은 자신의 원장(ledger)에 존재하며, 곧 모든 peer의 원장에 존재해야 합니다.


# SDK 세부 정보
이제 Fabric Client SDK를 사용하는 방법을 살펴보겠습니다.
거의 모든 configuration 옵션은 "connection profile" (aka cp)에서 찾을 수 있습니다.
사용자의 접속 프로필은 `/config/connection_profile_tls.json`과 같은 파일에서 가져온 것이거나, 환경 변수일 수 있습니다.
어떤 것이 확실하지 않으면, marbles이 시작될 때 로그를 확인합니다.
`Loaded connection profile from an environmental variable` 또는 `Loaded connection profile file <some name here>`으로 표시된 내용을 확인할 수 있습니다.
connection profile는 JSON이며, 블록체인 네트워크의 다양한 구성 요소에 대한 호스트 이름(또는 IP)및 포트를 가지고 있습니다.
`./utils` 폴더에 있는 `connection_profile_lib`에는 SDK 데이터를 검색하는 기능이 있습니다.

### SDK 설정:
첫번째 액션은 관리자를 등록하는 것입니다. 관리자 등록 시 다음 코드 내용을 확인하십시오. 코드 아래에 주석 또는 지침이 있습니다.

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
        channel.addOrderer(new Orderer(options.orderer_url, options.orderer_tls_opts));

// [Step 5]
        channel.addPeer(new Peer(options.peer_urls[0], options.peer_tls_opts));
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

Step 1. 코드가 가장 먼저 하는 일은 SDK의 인스턴스를 만드는 것입니다.

Step 2. 그런 다음 `newDefaultKeyValueStore`를 사용하여 등록 인증서를 저장하는 키/값 저장소를 생성합니다.

Step 3. 다음은 관리자를 등록합니다. 이 과정을 통해 등록 ID와 비밀 번호를 사용하여 CA에 인증합니다. CA는 SDK가 키/값 저장소에 저장할 등록 인증서를 발급합니다. 기본 키/값 저장소를 사용하고 있으므로 로컬 파일 시스템에 저장됩니다.

Step 4. 관리자 등록에 성공한 후 Orderer URL을 설정합니다. Orderer는 바로 사용되지는 않지만, 체인코드를 호출할 때 사용됩니다.
    - `ssl-target-name-override` 설정은 인증서를 직접 서명한 경우에만 필요합니다. 이 필드를 PEM파일을 생성할 때 사용한 `common name`과 동일하게 설정하십시오.

Step 5. 그런 다음 Peer URL을 설정합니다. 이 또한 바로 필요하지 않지만, 예제에서 우리는 SDK를 완전히 설정하도록 합니다.

Step 6. 이 시점에서 SDK는 완전히 구성(configured)되었고, 블록체인과 상호 작용할 준비가 되었습니다.

### 코드 구조
이 애플리케이션에는 조정할 수 있는 3가지 코딩 환경이 있습니다.

1. 체인코드 파트 - 블록체인 네트워크의 peer와 함께 실행되는 GoLang 코드입니다. 또한 `cc` 라고도 부릅니다. 모든 구슬/블록체인 거래는 궁극적으로 체인코드에서 이루어집니다. 이 파일들은 `/chaincode`에 저장되어 있습니다.

1. **클라이언트** 사이드 JS 파트 - 사용자 브라우저에서 실행 중인 JavaScript코드입니다. UI 상호 작용은 여기서 발생합니다. 이 파일들은 `/public/js`에 저장되어 있습니다.

1. **서버** 사이드 JS 파트 - 애플리케이션의 백엔드를 실행하는 JavaScript코드입니다. 즉, `Node.js` 코드는 Marbles 예제의 심장 역할을 하고 있으며 `node` 또는 `server` 코드 라고도 합니다. marble 관리자와 블록체인 사이를 연결해주는 역할을 합니다. 이 파일들은 `/utils` 와 `/routes`에 저장되어 있습니다.

이 세 파트는 서로 분리되어 있다는 것을 기억하세요.
각 파트는 변수나 기능을 공유하지 않으며, gRPC, WebSockets, 또는 HTTP와 같은 네트워킹 프로토콜로 각각 통신합니다.

# Marbles 세부 정보
아마도 이제 당신은 예제를 통해 구슬 한,두개 정도는 성공적으로 거래했을 것입니다.
그렇다면 이제 체인코드를 기준으로 구슬을 전송하는 방법을 살펴보겠습니다.

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

`set_owner()` 함수는 특정 구슬 소유자를 바꿀 수 있습니다.
문자열 배열을 파라미터로 넣고 실행하여 성공하면 `nil`을 반환합니다.
배열 내에서 첫번째 인덱스는 키/값 쌍의 키 역할을 하는 ID를 가져야 하며, 우선 이 ID를 사용하여 현재 구슬 구조(상태)를 파악해야합니다(retrieve).
`stub.GetState(marble_id)` 함수를 통해 해당 구슬의 상태를 가져 온 후, `json.Unmarshal(marbleAsBytes, &res)` 함수를 통해 결과를 추출(unmarshal)합니다.
위 과정을 통해 `res.Owner.Id`와 같이 결과에 대한 구조를 색인화할 수 있습니다. 이때 owners Id를 새로운 소요자 ID로 덮어 쓰면 소유자를 바꿀 수 있습니다.
다음으로, 다시 구슬 구조를 재배치(Marshal)합니다. `stub.PutState()`을 사용하여 구슬에 새로운 ID 및 속성으로 덮어쓸 수 있습니다.

이제 node.js 앱에서 이 chaincode가 어떻게 호출되는지 알아봅시다.

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


위 내용은 `process_msg()` 함수의 일부분으로 모든 웹소켓 메시지(app.js에 있는 코드)를 수신합니다.
이 함수는 어떤 종류의 웹소켓 메시지가 보내졌는지 탐지(detect)할 수 있습니다.
우리 경우에는 `transfer_marble` 탐지해야 하며, 이 코드를 보면 `options` 변수를 설정한 다음에 `marbles_lib.set_marble_owner()`를 실행할 수 있습니다. 이 함수는 SDK에 제안를 생성하고 전송 작업을 처리하도록 지시하는 기능을 수행합니다.

다음으로 아래 기능을 살펴보겠습니다.

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

위 내용은 `set_marble_owner()` 함수에 대한 내용입니다.
중요한 것은 이 제안의 호출 함수 명칭을 `cc_function: 'set_owner'` 라인으로 설정하는 것입니다.
관리자를 등록할 때 Peer 및 Orderer URL이 이미 설정되어 있습니다.
기본적으로 SDK는 `channel.addPeer`로 추가된 모든 peer에 이 트랜잭션을 전송합니다.
우리의 경우에는 SDK가 오직 1개의 Peer만 추가했기에 하나의 peer에게만 전송될 것입니다.
이때 peer가 `enrollment` 섹션에서 추가되었다는 점을 기억하십시오.

그럼, 마지막으로 UI에서 위 웹소켓 메시지를 어떻게 보냈는지 살펴보겠습니다.

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

첫번째 섹션의 `$('.innerMarbleWrap')` 부분에서, jQuery와 jQuery-UI를 이용해 드래그 앤 드랍 기능을 구현한 것을 볼 수 있습니다.
이 코드를 사용하면 droppable 관련 이벤트 트리거를 얻을 수 있습니다.
코드의 대부분이 끌어다 놓은 구슬과 사용자에 대한 자세한 정보를 찾는데 사용됩니다.

이벤트가 발생할 때, 우리는 먼저 해당 구슬이 실제로 특정 소요자에게 옮겼는지, 아니면 그냥 집어 들었다가 놓았는지를 확인합니다.
만약 구슬 소유자가 바뀐다면 `transfer_marble()` 함수가 실행됩니다.
이 기능은 필요한 데이터를 모두 포함한 JSON 메시지를 생성하고 웹소캣을 이용하여 `ws.send()`로 보냅니다.

마지막으로 구슬이 전송이 완료되었다는 것을 인지하는 방법입니다.
구슬은 주기적으로 모든 구슬을 검사하고, 마지막으로 알려진 상태를 비교합니다.
구슬 상태에 차이가 있을 경우, 새로운 구슬 상태와 연결된 모든 JS 클라이언트에게 브로드캐스트로 전달 합니다.
각 클라이언트들은 웹소켓을 통해 메시지를 전달 받고 구슬을 다시 그리게 됩니다.

이제 여러분은 모든 흐름을 알게 되었습니다.
관리자는 구슬을 움직였고, JS는 drag/drop을 감지했으며, 클라이언트는 웹소켓 메시지를 보내고, Marbles 애플리케이션은 웹소켓 메시지를 받습니다. SDK는 제안을 생성하거나 보내고, Peer는 제안를 승인합니다. SDK 정렬하기 위한 제안을 Orderer에게 보냅니다, Orderer는 정렬(패키징)하여 생성된 블록을 Peer에게 보냅니다, Peer는 블록을 커밋 합니다. node.js 코드는 주기적으로 새로운 구슬 상태를 얻습니다, 새로운 구슬 상태를 클라이언트에게 전달하면, 마침내 웹소켓 메시지를 받은 클라이언트는 새로운 구슬을 다시 그리게 됩니다.

네, 끝입니다! 구슬을 옮기면서 즐거운 시간 보내셨기를 바랍니다.

# Marbles FAQs
marbles에 대해 궁금한점이 있으면 [FAQ](./docs/faq.md)를 확인해주세요.

# Feedback
피드백은 언제나 환영합니다.
이 데모는 여러분과 같은 사람들을 위해 만들어진 데모입니다. 그리고 계속해서 개선될 것입니다.
데모에 개선할 수 있는 방법이 있으면 손을 뻗어 도와주세요!
구체적인 내용은 아래와 같습니다:

- readme 양식은 괜찮았나요?
- 진행에 막힌 부분이 있었나요?
- 링크나 이미지가 누락된 것이 있나요?
- 튜토리얼이 마칠때쯤 학습에 도움이 되었나요?
- 당신을 고통받게 한 부분이 있었나요?
- 어느부분이 당신에게 멘붕(existential crisis)을 주었고, 혼란하게 만들었나요?

개선점과 버그, 또는 당신을 고통 받게한 부분은 [GitHub Issues](https://github.com/IBM-Blockchain/marbles/issues) 섹션을 통해 커뮤니케이션합니다.

# Contribute
이 데모의 개선에 기여를 원하신다면 [contributing guide](./CONTRIBUTING.md)를 확인해주세요.

# License
[Apache 2.0](LICENSE)

***