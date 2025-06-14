---
title: "[NCP] Server 생성 및 SSH 접속 & 포트 변경 가이드"
date: 2024-05-10 00:00:00 +0900
categories: ['NCP']
tags: ['acg', 'NCP', 'server', 'ssh']
description: "클라우드 환경에서 서버 생성을 하고 접속을 해보자"
image: https://cdn-images-1.medium.com/max/800/1*ZrxvyfYzNAoHZDSNbJhKcw.png
---

오늘은 NCP(Naver Cloud Platform)에서 서버 생성 및 SSH 접속 & 포트 변경 방법에 대해 알아보겠습니다.

### [개요]

  1. VPC & Subnet 생성
  2. Server 생성 & ACG 설정
  3. SSH 접속 & SSH 포트 번호 변경
  4. 변경된 포트로 SSH 접속 테스트

### 1\. VPC & Subnet 생성

>  _콘솔 > VPC > VPC Managemnet > VPC 생성_

![](https://cdn-images-1.medium.com/max/800/1*NNaTv67c3m3FIcY_mGdKQw.png)![](https://cdn-images-1.medium.com/max/600/1*N4Jy65CLfvVgyzQhzAkWWg.png)

>  _콘솔 > VPC > Subnet Management > Subnet 생성_

![](https://cdn-images-1.medium.com/max/800/1*Ji3Rbs6kEc9_Xdwzom_ERQ.png)![](https://cdn-images-1.medium.com/max/600/1*YDijdneB6RCBYeMSPdAcCw.png)

* * *

### 2\. Server 생성 & ACG 설정

#### 서버 생성

> ** _Server > 서버생성 > ubuntu 20.04 선택 > 공인 IP 신청_**

![](https://cdn-images-1.medium.com/max/800/1*v0314k9ZWIxwo6doYiTn2w.png)![](https://cdn-images-1.medium.com/max/800/1*wHIQvAWVY4mfn7C9bS6qTA.png)

> ** _새로운 인증키 생성 > 인증키 생성 및 저장_**

![](https://cdn-images-1.medium.com/max/800/1*02pIqVNFywggwpBjmZWjnA.png)

> ** _ACG 설정 : default acg 선택 후 서버 생성_**

![](https://cdn-images-1.medium.com/max/800/1*2tAtjRTkkQrZM7k23zM0mQ.png)

* * *

서버가 생성 되는 동안,  
서버에 적용된 ACG 내 SSH 기본 포트인 22번 포트가 허용 되어 있는지 확인 합니다

* * *

#### ACG 설정

> ** _Server > ACG > test-vpc-default-acg > ACG 설정_**

![](https://cdn-images-1.medium.com/max/800/1*zElNCIBCltDH3BkB1i2HQA.png)![](https://cdn-images-1.medium.com/max/800/1*e0tevKAJREP5iaPzqo74OQ.png)

  * NCP에서는 기본적으로 VPC 생성시 생성되는 default ACG에서는 22번, 3389 포트가 허용 되어 있는 걸 확인 할 수 있습니다.

* * *

### 3\. SSH 접속 & SSH 포트 번호 변경

> ** _생성된 Server > 서버 관리 및 설정 > 서버 생성시 다운 받은 키페어 첨부 > 비밀번호 확인_**

![](https://cdn-images-1.medium.com/max/800/1*F-OwqhPpGQ9P4i8Vum0Nmw.png)![](https://cdn-images-1.medium.com/max/400/1*riJeG9gWMKU_OVlDiSa4Rw.png)![](https://cdn-images-1.medium.com/max/200/1*X9vJv1FP22EJ7gLuLo31Ow.png)

#### SSH 접속

> ** _생성된 Server > 공인 IP 확인_**

![](https://cdn-images-1.medium.com/max/800/1*GZYcHyPCoD3gOhuzV9rKIg.png)

  * Terminal (터미널)에서 SSH 접속

```bash
$ ssh root@공인IP
```

```bash
MacBook-Pro-2 ~ % ssh root@223.130.134.244
The authenticity of host '223.130.134.244 (223.130.134.244)' can't be established.
ED25519 key fingerprint is SHA256:~~~~~~~~~~~~~~~~~/uCfk.
...
root@223.130.134.244's password: "패스워드 입력"
```

  * fingerprint 메시지가 나타나면 “yes” 입력 > 이전에 확인 했던 패스워드 입력

```bash
wookja@MacBook-Pro-2 ~ % ssh root@223.130.134.244
root@223.130.134.244's password:
...
root@test-server:~#
```

#### SSH 포트 번호를 2022로 변경 (/etc/ssh/sshd_config)

  * 기본 ssh 포트 번호를 22번에서 2022번으로 변경하기 위해 /etc/ssh/sshd_config 파일을 수정 합니다.

```bash
root@test-server ~% vim /etc/ssh/sshd_config

#Port 22
Port 2022
...
```

> **_:wq로 vim 편집기를 저장 및 종료_**

* * *

```bash
systemctl restart sshd
```

* * *

#### ACG Inbound Rule 추가하기

> **_Server > ACG > test-vpc-default-acg > ACG 설정 > inbound rule 소스 0.0.0.0 / 2022 포트 추가 > 적용_**

![](https://cdn-images-1.medium.com/max/800/1*UbmG_6lFLlzpmy04PjVcgA.png)

* * *

#### 터미널에서 2022포트로 SSH 접속 하기

```bash
$ ssh root@공인IP -p 2022
```

```bash
MacBook-Pro-2 ~ % ssh root@223.130.134.244 -p 2022
...
root@test-server:~#
```

* * *

이렇게 NCP 서버 생성 및 SSH 접속 & 포트 변경 법에 대해 알아보았습니다.

감사합니다.
