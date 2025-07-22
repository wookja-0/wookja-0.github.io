---
title: "[NCP] Certificate Manager 활용법"
date: 2024-10-10 00:00:00 +0900
categories: ['NCP']
tags: ['ssl']
description: "네이버클라우드에 외부 SSL 인증서를 등록 해 보자"
image: https://cdn-images-1.medium.com/max/800/1*txA3xew4qNAryfe9vMJ7sQ.png
---

이번에는 **Certificate Manager** 에서 외부 인증서를 등록하는 방법에 대해 알아보겠습니다.

* * *

### 개요

#### 1\. 외부 인증서 파일 확인 / 준비

#### 2\. (Certificate Manager) 외부 인증서 등록

#### 3\. 로드밸런서 HTTPS 리스너 내에 인증서 적용

* * *

#### 1\. 외부 인증서 파일 확인 / 준비

  * 저는 “가비아" 도메인 업체에서 외부 관리형 SSL 인증서를 구매했다고 가정하겠습니다.

![](https://cdn-images-1.medium.com/max/800/1*Fqh5v0-5HjAAgGIDrHSWvA.png)

  * 메인 도메인에 SSL 인증이 되었다면, 인증서 파일을 다운로드 가능합니다.

![](https://cdn-images-1.medium.com/max/800/1*MPYzq__jJHc-SN9M2ZH9ng.png)발급받은 인증서 파일 목록

> [인증서 파일명]_cert.crt : 도메인에 대한 인증서

> [인증서 파일명]_chain_cert.crt : 체인 인증서

> [인증서 파일명]_root_cert.crt : 루트 인증서

> [인증서 파일명]_key : Private Key(개인키)

* * *

#### 2\. (Certificate Manager) 외부 인증서 등록

  * 네이버클라우드 콘솔 > Certificate Manager > 외부 인증서 등록

![](https://cdn-images-1.medium.com/max/800/1*AdebF6EQF-7SLIgKwJ4olw.png)![](https://cdn-images-1.medium.com/max/800/1*JQi3EENZSxNCcoQnRHN1VA.png)

  * Private Key : 보유중인 (.key) 개인 키 입력
  * Certificate Body : 인증서 파일(cert.crt) 입력
  * Certificate Chain : chain 인증서 + Root 인증서 입력



> Certificate Chain의 경우, 상위 Chain 인증서를 입력하고 다음 줄(Enter)에 Root 인증서를 입력 하면 됩니다.

![](https://cdn-images-1.medium.com/max/800/1*ReNH99OdbZPiSCaVCKpbSw.png)추가 후 등록 된 외부 인증서 확인

* * *

#### 3\. 로드밸런서 HTTPS 리스너 내에 인증서 적용

Certificate Manager 에 외부 인증서를 등록하였으니 이제 로드밸런서의 HTTPS 리스너에 추가 해 보도록 하겠습니다.

  * 네이버클라우드 콘솔 > Load Balancer > 리스너 설정 변경

![](https://cdn-images-1.medium.com/max/800/1*3reiaH0y-_QewavaGUPinQ.png)![](https://cdn-images-1.medium.com/max/800/1*6TxFFQ4ecfZtYetxWF9npg.png)리스너 추가![](https://cdn-images-1.medium.com/max/800/1*Wjdo4jMNJtDZG-S6jdloCA.png)HTTPS 및 포트 기입 후 등록한 외부 인증서(test-cert)를 적용 합니다.

  * HTTPS(443) 리스너 적용 확인

![](https://cdn-images-1.medium.com/max/800/1*K89AIdJmjLwnbagc8iS14w.png)

* * *

### 마치며..

이번 주제에서 외부인증서를 Certificate Manager 에 등록하는 주제에 대해 알아 보았습니다.

사실 저도 외부 인증서 등록을 처음 시도 했을 때에는 애를 먹었던 기억이 있습니다.

보유중인 인증서 종류에 따라 필요시 파일 변환을 해야할 수도 있기 때문에 쉽지 않았던거 같습니다 :D

더 자세한 가이드는 네이버 클라우드 플랫폼에서 제공하는 [**Certificate Manager 가이드**](https://guide.ncloud-docs.com/docs/ko/security-security-15-1)에서 참고 해 주시면 감사하겠습니다 !

감사합니다.