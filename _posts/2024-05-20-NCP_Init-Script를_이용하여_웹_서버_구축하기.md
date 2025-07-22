---
title: "[NCP] Init Script로 웹 서버(Nginx) 자동 설치하기"
date: 2024-05-20 00:00:00 +0900
categories: [NCP]
tags: [init-script, nginx, cloud, server, automation]
description: "NCP Init Script 기능을 활용해 서버 생성 시 자동으로 Nginx를 설치하고 실행하는 방법을 알아봅니다."
image: https://cdn-images-1.medium.com/max/800/1*XlGbc2gcv9i57WjfNhjUDg.png
---

> NCP Init Script 기능을 이용하면 서버 생성과 동시에 원하는 환경을 자동으로 구성할 수 있습니다. 이번 포스트에서는 Nginx 웹 서버를 자동 설치하는 예제를 통해 Init Script 사용법을 알아봅니다.

---

## 🧾 목차

1. [Init Script란?](#init-script란)
2. [Nginx 설치 Init Script 작성](#nginx-설치-init-script-작성)
3. [서버 생성 시 Init Script 적용](#서버-생성-시-init-script-적용)
4. [웹 서버 접속 확인](#웹-서버-접속-확인)
5. [접속 오류 시 점검 방법](#접속-오류-시-점검-방법)

---

## Init Script란?

**Init Script**는 서버 생성 시 실행할 스크립트를 미리 등록해 자동으로 서버 초기 설정을 적용하는 기능입니다.

- 여러 서버를 동일한 설정으로 자동 구성 가능
- 반복적인 설치/설정 업무 자동화
- DevOps 및 IaC 환경과 연동 시 유용

> 위치: `NCP Console > Server > Init Script`

---

## Nginx 설치 Init Script 작성

콘솔에서 아래 스크립트를 등록합니다:

```bash
#!/bin/bash

# Nginx 설치 및 활성화
apt-get update -y
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
systemctl status nginx
```

스크립트 등록 화면 예시:

![Init Script 작성](https://cdn-images-1.medium.com/max/800/1*XlGbc2gcv9i57WjfNhjUDg.png)

---

## 서버 생성 시 Init Script 적용

서버 생성 단계에서 **이전에 등록한 Init Script**를 선택합니다.

![서버 생성 - Init Script 적용](https://cdn-images-1.medium.com/max/800/1*LLijGxhLgR16dA583GiVEA.png)

> Script 적용 후 서버가 자동으로 Nginx를 설치 및 구동합니다.

---

## 웹 서버 접속 확인

서버 생성 후 아래 방법으로 접속 확인:

- 브라우저에서 `http://공인IP`
- 터미널에서:

```bash
curl http://공인IP
```

접속 성공 시 아래처럼 기본 Nginx 페이지가 출력됩니다.

![Nginx 접속 결과](https://cdn-images-1.medium.com/max/800/1*oS44Iab0SzexGxEV6MjsjQ.png)

---

## 접속 오류 시 점검 방법

만약 접속이 되지 않는다면 SSH로 접속하여 Nginx 상태를 점검하세요.

```bash
systemctl status nginx
```

오류 예시:

```bash
nginx: [emerg] socket() [::]:80 failed (97: Unknown error)
```

> 이는 IPv6 소켓 바인딩 실패로, 설정 파일에서 `listen [::]:80` 항목을 제거해야 합니다.

### 설정 파일 수정

```bash
vim /etc/nginx/sites-available/default
```

```nginx
server {
    listen 80 default_server;
    # listen [::]:80 default_server;  # 주석 처리 또는 제거
    server_name _;
    ...
}
```

변경 후 Nginx 재시작:

```bash
systemctl restart nginx
```

---

## ✅ 마무리

NCP Init Script 기능을 통해 서버 생성과 동시에 웹 서버 구성이 가능하다는 것을 확인했습니다. 서버 프로비저닝 시간을 줄이고, 인프라 자동화를 실현하는 데 Init Script는 매우 유용한 도구입니다.

감사합니다 🙌