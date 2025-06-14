---
title: "[NCP] Cloud Log Analytics 이용 가이드"
date: 2024-05-24 00:00:00 +0900
categories: ['NCP']
tags: ['log']
description: "[NCP] Cloud Log Analytics 이용 가이드"
image: https://cdn-images-1.medium.com/max/800/1*0FhbX6YiKcYHbrLjUZpcrw.png
---

### 개요

Naver Cloud Platform의 **Cloud Log Analytics(CLA)** 서비스는 다양한 서비스에서 발생하는 로그를 수집, 저장, 분석할 수 있도록 지원하는 로그 통합 관리 서비스입니다.

이번 가이드에서는 CLA를 통해 Nginx의 에러 로그를 수집하는 실습 과정을 단계별로 설명합니다.

![](https://cdn-images-1.medium.com/max/800/1*0FhbX6YiKcYHbrLjUZpcrw.png)

---

## 📝 실습 목차

1. Cloud Log Analytics란?
2. Log 수집 대상 서버 생성 및 Nginx 설치
3. 대상 서버 CLA 등록
4. CLA Agent 설치
5. 수집 테스트 (Nginx 에러 로그 확인)

---

## 1. Cloud Log Analytics란?

> 다양한 인프라 및 서비스에서 발생하는 로그를 수집하고, 실시간 모니터링 및 분석이 가능한 로그 분석 플랫폼입니다.

- 지원 대상: 서버, DB, 보안 장비 등
- 통합 대시보드, 검색 기능 제공

📎 [서비스 소개](https://www.ncloud.com/product/management/cloudLogAnalytics)

---

## 2. Log 수집 대상 서버 생성 및 Nginx 설치

Ubuntu 20.04 서버에 Nginx를 설치하고 로그를 생성할 준비를 합니다.

![](https://cdn-images-1.medium.com/max/800/1*AAkomJE4ElzSpMNA6O6IdA.png)

📎 [서버 생성 & SSH 접속 가이드](https://medium.com/brickmate-cloud/ncp-server-%EC%83%9D%EC%84%B1-%EB%B0%8F-ssh-%EC%A0%91%EC%86%8D-%ED%8F%AC%ED%8A%B8-%EB%B3%80%EA%B2%BD-%EA%B0%80%EC%9D%B4%EB%93%9C-00f9caf44799)

```bash
ssh root@<공인IP>
apt update -y
apt install nginx -y
systemctl restart nginx
curl localhost:80
```

---

## 3. Cloud Log Analytics 대상 서버 등록

- CLA 콘솔에서 로그 수집 대상 서버 등록
- `nginx.conf` 파일에서 에러 로그 경로 확인

```bash
cat /etc/nginx/nginx.conf | grep -i error
# 출력 예: error_log /var/log/nginx/error.log;
```

![](https://cdn-images-1.medium.com/max/800/1*AGhOEWI6KcTeX48YURoGgQ.png)
![](https://cdn-images-1.medium.com/max/800/1*q1tl6m_vmt10PVJlZ6PmnA.png)

CLA 콘솔에서 로그 경로 등록 후 **적용하기**를 누르면, 에이전트 설치 가이드가 나타납니다.

![](https://cdn-images-1.medium.com/max/800/1*7lZnR89nUgysamSoEJ1HNw.png)

---

## 4. CLA Agent 설치

콘솔에서 제공하는 설치 명령어를 서버에 붙여넣기만 하면 자동으로 설치됩니다.

```bash
curl -s http://cm.vcla.ncloud.com/setUpClaVPC/<agent-key> | sudo sh
```

```bash
==================== Start Installation ====================
1. Check the Configuration for Installation
   Configuration Success
2. Connection Success for Installation
   http_status_code: 200
3. Remove Agent
4. Download the Agent for Installation
   Download Success
5. Install and config the Agent
   Installation Success
   Configuration Success
6. Run the Agent
==================== Finish Installation ====================
```

---

## 5. CLA 로그 수집 테스트

### 📌 Nginx 설정 오류 유발

![](https://cdn-images-1.medium.com/max/800/1*hiqTDbaLtsOBAT4aTiThjw.png)

```bash
vim /etc/nginx/nginx.conf
# http 블록 내에 존재하지 않는 설정 추가
http {
  ...
  invalid_directive on;
  ...
}
nginx -t
```

```bash
# 오류 메시지 출력 예시
nginx: [emerg] unknown directive "invalid_directive"
```

CLA 대시보드에서 수집된 로그를 확인합니다.

![](https://cdn-images-1.medium.com/max/800/1*_p3etHn8q4yfXunpv3YwZA.png)

CLA Search 탭에서 로그 상세 조회도 가능합니다.

![](https://cdn-images-1.medium.com/max/800/1*hiqTDbaLtsOBAT4aTiThjw.png)

### 🧹 원상 복구

테스트 후에는 잘못된 설정을 제거하고 nginx를 재시작합니다.

```bash
vim /etc/nginx/nginx.conf
# invalid_directive on; 제거
systemctl restart nginx
curl localhost
```

Nginx 정상 페이지가 출력되면 복구 완료입니다.

---

## ✅ 마무리

이번 실습을 통해 NCP Cloud Log Analytics 서비스의 기본 사용법과 로그 수집 흐름을 체험해보았습니다. 다양한 인프라 자원의 로그를 통합적으로 분석해야 하는 경우 CLA는 매우 유용한 솔루션입니다.

> 특히 Cloud DB, 보안 장비, WAS 등과 함께 활용하면 큰 시너지를 낼 수 있습니다.

---

## 참고 URL

1. CLA 공식 가이드: [https://guide.ncloud-docs.com/docs/cla-overview](https://guide.ncloud-docs.com/docs/cla-overview)