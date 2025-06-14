---
title: "[NCP] Cloud Outbound Mailer 사용 가이드"
date: 2024-10-29 00:00:00 +0900
categories: ['NCP']
tags: ['mail']
description: "NCP Outbound Mailer를 활용해보자"
image: https://cdn-images-1.medium.com/max/800/0*1Nu_Ih7umwLgx21i
---

이번 주제에서는 **네이버 클라우드 플랫폼의**[**Cloud Outbound Mailer**](https://www.ncloud.com/product/applicationService/cloudOutboundMailer#overview)**서비스** 에 대해 알아보겠습니다. Cloud Outbound Mailer는 대량의 이메일을 손쉽고 안정적으로 발송할 수 있는 서비스로, 뉴스레터나 알림 메일 발송에 적합한 기능을 제공합니다. 다양한 활용 사례와 함께 주요 기능을 살펴보도록 하겠습니다.

* * *

### Cloud Outbound Mailer란?

[**Cloud Outbound Mailer**](https://www.ncloud.com/product/applicationService/cloudOutboundMailer#overview)는 네이버 클라우드 플랫폼이 제공하는 **대량 메일 발송 서비스** 로, 기업의 이메일 마케팅 및 고객 공지 사항 전달을 쉽게 할 수 있도록 돕습니다. 이 서비스는 높은 보안성과 발송 속도를 갖추어 다량의 이메일을 신속하게 발송하는 데 최적화되어 있습니다.

* * *

### 주요 기능

  1. **확장 가능한 메일 발송**  
Cloud Outbound Mailer는 대량 메일 발송이 필요할 때 발송 속도와 안정성을 보장하여 비즈니스 요구에 적합한 유연한 발송 환경을 제공합니다.
  2. **편리한 모니터링**  
발송 상태와 성공률, 클릭률 등을 실시간으로 확인할 수 있는 대시보드를 통해 메일의 전송 현황을 추적할 수 있습니다. 이를 통해 마케팅 효과를 쉽게 분석하고 전략을 조정할 수 있습니다.
  3. **보안 및 신뢰성 강화**  
Cloud Outbound Mailer는 네이버 클라우드의 보안 인프라를 바탕으로 스팸 필터링과 높은 보안성을 제공하여 메일이 정상적으로 수신될 확률을 높입니다.



* * *

### 활용 사례

Cloud Outbound Mailer는 다양한 비즈니스 목적에 활용할 수 있습니다.

  * **마케팅 이메일 발송** : 뉴스레터, 프로모션 알림, 이벤트 초대장 등
  * **고객 공지사항 전달** : 신규 서비스 안내, 서비스 유지보수 알림 등



* * *

### 시작하기

> `Demo에 사용된 설정 값들은 포스팅 후 삭제 되었습니다.`

  1. 네이버 클라우드 플랫폼 콘솔에서 **Cloud Outbound Mailer 서비스** 를 선택합니다.



![](https://cdn-images-1.medium.com/max/800/1*dIGeIqqGYzbjiGxIDQGKuQ.png)![](https://cdn-images-1.medium.com/max/600/1*dYXgLqNjcw7Jv-HwyFig9g.png)Outbound 서비스 이용 신청

2\. 도메인 등록을 선택하여 발신자로 사용할 도메인을 등록합니다.

![](https://cdn-images-1.medium.com/max/1000/1*VNJMKuzRYb-AzwCDW6BFsw.png)![](https://cdn-images-1.medium.com/max/400/1*lnutRCeqmnbcNsQjppvCtw.png)도메인 등록

> 저는 사전에 가비아에서 `wookja.site` 라는 도메인을 구매 해 놓았습니다.

![](https://cdn-images-1.medium.com/max/800/1*UB2p0QL-O5qmYw13zWF-lw.png)

3\. 도메인 등록이 완료가 되면, 이전에 발급 받은 인증 토큰을 DNS TXT 레코드에 추가 합니다.

![](https://cdn-images-1.medium.com/max/800/1*lwVNS6UnuFFa_Lq4VvM1_g.png)TXT 레코드 값 확인

4\. 가비아에서 DNS 레코드를 추가합니다.

![](https://cdn-images-1.medium.com/max/1200/1*pHW41qM4a_RvHQpwhVCRow.png)![](https://cdn-images-1.medium.com/max/1200/1*f7IsD5PLj1u-wTeQfMC81Q.png)레코드 값 추가 후 인증 버튼을 눌러 도메인 인증이 된것을 확인할 수 있습니다.

* * *

![](https://cdn-images-1.medium.com/max/1200/1*W6zss82hHJdHtsKrqtGxcw.png)

Cloud Outbound Mailer 서비스를 원활하게 이용하려면 `SPF, DKIM, DMARC` 인증이 필수입니다.

각 인증값에 대한 상세 설명은 아래에서 확인할 수 있습니다:

#### 1\. [SPF](https://www.cloudflare.com/ko-kr/learning/dns/dns-records/dns-spf-record/) (Sender Policy Framework)

**SPF** 는 이메일을 발송하는 서버의 IP 주소가 해당 도메인의 인증된 서버 목록에 포함되어 있는지 확인하는 메커니즘입니다.   
SPF 인증을 설정하면, 수신 서버가 해당 이메일의 발신 서버가 진짜인지 확인하여 **스팸 및 피싱 공격** 으로부터 보호할 수 있습니다.   
이를 통해 다른 사람들이 무단으로 해당 도메인의 이메일을 발송하지 못하게 막아줍니다.

#### 2\. [DKIM](https://www.cloudflare.com/ko-kr/learning/dns/dns-records/dns-dkim-record/) (DomainKeys Identified Mail)

**DKIM** 은 이메일에 디지털 서명을 추가하여 수신자가 발신자의 도메인 소유 여부를 확인할 수 있게 해줍니다.   
발신자가 이메일 본문에 서명한 후, 수신자가 이 서명을 검증함으로써 이메일이 전송 과정에서 **변조되지 않았음을 보증** 할 수 있습니다.  
DKIM은 발신 도메인의 신뢰도를 높여 스팸함으로 분류될 가능성을 줄여줍니다.

#### 3\. [DMARC](https://www.cloudflare.com/ko-kr/learning/dns/dns-records/dns-dmarc-record/) (Domain-based Message Authentication, Reporting & Conformance)

**DMARC** 는 SPF와 DKIM 인증을 기반으로 한 추가적인 인증 정책으로, 이메일이 SPF와 DKIM 검증을 모두 통과해야 수신자에게 안전한 이메일로 인식됩니다.  
DMARC 정책은 수신 서버가 검증 실패 시 취할 액션(거부, 격리, 허용 등)을 설정하고, 검증 결과를 발신 도메인 소유자에게 보고할 수 있습니다.  
이를 통해 **피싱 및 스팸 메일** 을 더욱 효과적으로 차단할 수 있으며, 발신 도메인에 대한 신뢰성을 높입니다.

* * *

### SPF 인증

  1. SPF 레코드 **보기** 를 선택하여 TXT 레코드 값 확인 후 DNS 레코드에 추가 합니다.

![](https://cdn-images-1.medium.com/max/800/1*pDYLjgzwBKnTpfvn04RdKA.png)

![](https://cdn-images-1.medium.com/max/600/1*6YQEXjfAX_dJkPe5iS_ojw.png)![](https://cdn-images-1.medium.com/max/800/1*njGriS3Xo-9q1uyT2TX-ig.png)TXT 레코드 값 추가

2\. `nslookup` 명령어를 통해 레코드 값이 적용 된 것을 확인 가능합니다.

![](https://cdn-images-1.medium.com/max/800/1*Om9688jYMsjkqVayeRZM4g.png)nslookup -q=txt “도메인"

3\. SPF **인증** 을 선택 후 인증이 완료 되면 **사용** 선택

![](https://cdn-images-1.medium.com/max/1200/1*gedJFRGyWie_32hzDxaxmA.png)

### DKIM 인증

  1. DKIM **보기** 를 선택하여 TXT 레코드 값 확인 후 DNS 레코드에 추가 합니다.

![](https://cdn-images-1.medium.com/max/800/1*NdGkIkPiDHe3Ic1xjLnrZg.png)

> DKIM 서명 인증을 위해서는 아래 형태의 도메인의 TXT 레코드에 아래 인증 정보를 추가해 주세요.

> **ex :**`**mailer._domainkey.{domain}**`

> ※ TXT 레코드는 255자의 길이 제한을 갖고 있으므로 분할하여 등록하셔야 하며, multi-line으로 등록하셔야 합니다.

  * **레코드 이름(호스트):**`**mailer._domainkey**`
  * **레코드 값 : 큰 따옴표로 묶어서 Multi-line으로 등록**

![](https://cdn-images-1.medium.com/max/800/1*XC-IyxaNBaDtb0AVJavvkA.png)

2\. `nslookup` 명령어를 통해 레코드 값이 적용 된 것을 확인 가능합니다.

![](https://cdn-images-1.medium.com/max/800/1*RydvqbXEqinCR__VZuP53Q.png)nslookup -q=txt mailer._domainkey.”도메인"

DKIM 인증이 되는데까지 1시간 정도 소요 되기 때문에 조금 기다렸다가 인증을 하시면 좋습니다.

3\. DKIM **인증** 을 선택 후 인증이 완료 되면 **사용** 선택

### DMARC 인증

  1. DMARC 인증을 위한 `TXT` 레코드 값 확인 후 DNS 레코드에 추가 합니다.



> 가이드 : <https://guide.ncloud-docs.com/docs/cloudoutboundmailer-use-domain>

![](https://cdn-images-1.medium.com/max/800/1*cTPC27jhiOxoT5FHPUa1hw.png)![](https://cdn-images-1.medium.com/max/800/1*YCrhzg5odNSDzMo6jSAoew.png)

  * 레코드 명 : `_dmarc`
  * 레코드 값 : `v=DMARC1; p=none; aspf=r; adkim=r;`



> 간단한 Demo이기 때문에 rua(해당 도메인의 DMARC 처리 보고서를 수신할 이메일 주소) 설정은 안 하였습니다.

2\. `nslookup` 명령어를 통해 레코드 값이 적용 된 것을 확인 가능합니다.

![](https://cdn-images-1.medium.com/max/800/1*-37397qUvDo-jDpbXmBooQ.png)`nslookup -q=txt _dmarc.”도메인"`

3\. DMARC **사용** 선택

![](https://cdn-images-1.medium.com/max/800/1*R_6e7wQFGXit3M-6K3l0gw.png)DMARC 인증 확인

* * *

### Cloud Outbound Mailer API 사용하기

SPF, DKIM, DMARC 인증이 전부 완료 되었으니, 로컬 환경에서 API를 통해 메일 발송 테스트를 진행 해 보겠습니다.

> API 가이드 : <https://api.ncloud-docs.com/docs/ai-application-service-cloudoutboundmailer-createmailrequest>

#### **Python 사용**

> Ncloud Access Key & Secret Key 준비

#### .env
    
    
    NAVER_ACCESS_KEY= "Access KEY"  
    NAVER_SECRET_KEY= "Secret KEY"  
    NAVER_OUTBOUND_MAILER_API_ENDPOINT=https://mail.apigw.ntruss.com/api/v1/mails

#### main.py
    
```python      
import hmac  
import hashlib  
import base64  
import time  
import requests  
import os  
from dotenv import load_dotenv  
  
# 환경 변수 로드  
load_dotenv()  
  
class NaverOutboundMailer:  
    def __init__(self):  
        self._access_key = os.getenv('NAVER_ACCESS_KEY', '')  
        self._secret_key = os.getenv('NAVER_SECRET_KEY', '')  
        self._url = os.getenv('NAVER_OUTBOUND_MAILER_API_ENDPOINT', 'https://mail.apigw.ntruss.com/api/v1/mails')  
  
    def _make_signature(self):  
        method = 'POST'  
        url = '/api/v1/mails'  
        timestamp = str(int(time.time() * 1000))  
        access_key = self._access_key  
        secret_key = self._secret_key  
  
        message = f"{method} {url}\n{timestamp}\n{access_key}"  
        signature = hmac.new(secret_key.encode('utf-8'), message.encode('utf-8'), hashlib.sha256).digest()  
        signature_base64 = base64.b64encode(signature).decode('utf-8')  
  
        return timestamp, signature_base64  
  
    def send_mail_test(self):  
        print('SEND TESTING EMAIL')  
        timestamp, signature = self._make_signature()  
  
        headers = {  
            'Content-Type': 'application/json',  
            'x-ncp-apigw-timestamp': timestamp,  
            'x-ncp-iam-access-key': self._access_key,  
            'x-ncp-apigw-signature-v2': signature,  
        }  
  
        data = {  
            "senderAddress": "no_reply@wookja.site", // 발신자 정의  
            "title": "안녕하세요 ${customer_name}님.",  // title 정의  
            "body": "고객님의 등급이 ${BEFORE_GRADE}에서 ${AFTER_GRADE}로 변경 되었습니다.",  
            "recipients": [  
                {  
                    "address": "arnold@brickmate.kr",  // 수신자 정의  
                    "name": "Arnold",  
                    "type": "R",  
                    "parameters": {  
                        "customer_name": "Arnold",    // 파라미터 정의  
                        "BEFORE_GRADE": "SILVER",  
                        "AFTER_GRADE": "GOLD"  
                    }  
                }  
            ],  
            "individual": True,  
            "advertising": False  
        }  
  
        try:  
            response = requests.post(self._url, json=data, headers=headers)  
            print('Response:', response.json())  
        except requests.exceptions.RequestException as e:  
            print(f'Error: {e}')  
  
# 실행 코드  
if __name__ == '__main__':  
    mailer = NaverOutboundMailer()  
    mailer.send_mail_test()
```

#### 코드 설명

  * **클래스 초기화** : `NaverOutboundMailer` 클래스는 네이버 클라우드 API를 사용하기 위한 액세스 키, 시크릿 키, API URL을 설정합니다.
  * **서명 생성** : `_make_signature` 메서드에서 서명을 생성하여 인증에 사용됩니다. HMAC SHA256으로 서명한 후 Base64로 인코딩하여 반환합니다.
  * **이메일 전송** : `send_mail_test` 메서드에서 이메일 데이터와 헤더를 설정하여 POST 요청으로 이메일을 전송합니다. 수신자 정보와 개인화된 메시지 내용을 포함하여, 맞춤형 이메일 발송이 가능합니다.
  * **실행 코드** : 마지막에 메일러 객체를 생성하고 `send_mail_test` 메서드를 호출해 테스트 메일을 전송합니다.



#### 코드 실행 (venv)

  * `python main.py`

```bash    
(venv)  wookja@Mac  ~/Desktop/MAILER  
 python main.py  
  
SEND TESTING EMAIL  
Response: {'requestId': '20241029000115563003', 'count': 1}
```

![](https://cdn-images-1.medium.com/max/800/1*0TnHYlsj4YJ321GX4fcorg.png)

  * `requestId` 확인 후 콘솔에서 발송 여부를 확인 합니다.

![](https://cdn-images-1.medium.com/max/800/1*jydT5od49JxvzxIijlcf1Q.png)

  * 수신자 측에서 받은 메일을 확인 합니다.

![](https://cdn-images-1.medium.com/max/800/1*ary52bPOT2Sdmu_myp_f2A.png)

#### 해당 python 예제 코드를 통해 메일 전송 API를 테스트 할 수 있습니다.

* * *

감사합니다.
