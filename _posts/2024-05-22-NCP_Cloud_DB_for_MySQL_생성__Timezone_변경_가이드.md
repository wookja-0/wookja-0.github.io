---
title: "[NCP] Cloud DB for MySQL 생성 & Timezone 변경 가이드"
date: 2024-05-22 00:00:00 +0900
categories: ['NCP']
tags: ['mysql', 'NCP', 'Cloud DB']
description: "[NCP] Cloud DB for MySQL 생성 & Timezone 변경 가이드"
image: https://cdn-images-1.medium.com/max/800/0*_dZvVH8OpKb0bW7q
---

### 개요

NCP에서 제공하는 완전 관리형 데이터베이스 서비스인 **Cloud DB for MySQL**을 생성하고, 운영 환경에서 자주 필요한 **Timezone 설정 변경 방법**까지 실습을 통해 알아봅니다.

---

### MySQL을 이용한 완전 관리형 클라우드 데이터베이스

> 네이버클라우드의 최적화 설정을 통해 별도 작업 없이 MySQL 데이터베이스를 설치하고 운영할 수 있는 완성형 서비스입니다.

📎 [Cloud DB for MySQL 상품 소개](https://www.ncloud.com/product/database/cloudDbMysql)

---

### VPC 및 Subnet 구성

#### VPC 생성

VPC 환경에서 Cloud DB를 생성하기 위해 먼저 VPC를 구성합니다.

![VPC 생성](https://cdn-images-1.medium.com/max/800/0*gTPNtsiBYbQBQsxJ.jpg)

![VPC 생성 확인](https://cdn-images-1.medium.com/max/800/1*1YfQIcQWKSZsHwaypPKZKw.png)

#### Subnet 생성

Subnet은 **Public**과 **일반** 타입으로 생성합니다.

![Subnet 생성](https://cdn-images-1.medium.com/max/800/0*cBExFErZcGdMQI8F.jpg)

![Subnet 생성 확인](https://cdn-images-1.medium.com/max/800/1*qEZkIazQmNfqcp-neE-oOg.png)

---

### Cloud DB for MySQL 생성

![Cloud DB 생성](https://cdn-images-1.medium.com/max/800/1*C_v3_gR6YYVJECAFERZG7w.png)

이전에 생성한 VPC/Subnet을 선택하고, DB 서버 이름과 사용자 정보를 입력합니다.

> ✅ 사용자 ID/비밀번호 입력 시 Host IP는 `%`로 설정하여 모든 클라이언트 IP 허용 가능

![DB 설정 예시](https://cdn-images-1.medium.com/max/800/1*PCR1p5Iyo5Zb9Cys-qfOVw.png)

최종 확인 후 DB 서버를 생성합니다.

![DB 생성 완료](https://cdn-images-1.medium.com/max/800/1*50kpDat3p705q6PGucD6ug.png)

---

### ACG 설정 및 DB 접속

#### ACG 확인

DB 생성 시 자동 생성된 ACG를 수정하여 접속 허용 IP 설정을 추가합니다.

> `Server > ACG > cloud-mysql-* > ACG 설정`

![ACG 설정](https://cdn-images-1.medium.com/max/800/1*PHDK_DLo8SDvTA82cOeQ8g.png)

> 인바운드 규칙: `0.0.0.0/0` / 포트 `3306` 추가

![ACG 인바운드 설정](https://cdn-images-1.medium.com/max/800/1*r8bI3z2z3ef8HFvKLzkCjA.png)

#### Public 도메인 발급 및 접속

`Cloud DB for MySQL > DB 관리 > Public 도메인 관리`에서 **Public 도메인 신청**을 진행합니다.

이후 MySQL Workbench 등을 이용하여 아래 정보로 접속합니다:

- Hostname: 발급된 도메인 주소
- Username / Password: DB 생성 시 입력값

![Workbench 접속](https://cdn-images-1.medium.com/max/800/1*pLoTKZSByObBU8Dq3LWC9g.png)

![접속 완료](https://cdn-images-1.medium.com/max/800/1*O9uI4IZwwidJm0KzhoQL4A.png)

---

### Timezone 이란?

- 타임존(Timezone)은 동일한 표준시를 사용하는 지역을 나타냅니다.
- 국가 혹은 지역마다 서로 다른 타임존을 사용할 수 있습니다.

### 왜 Timezone 설정이 중요할까?

- 앱/서버/DB 간 시간이 맞지 않으면 스케줄링, 비교 연산 등 오류 발생 가능
- 서버의 시간 기반 함수 사용 시 문제가 발생할 수 있음

---

### 현재 Timezone 확인

MySQL Workbench에서 아래 쿼리 실행:

```sql
SELECT @@GLOBAL.time_zone, @@SESSION.time_zone, @@system_time_zone;
```

![timezone 확인](https://cdn-images-1.medium.com/max/800/1*pt9Yu0WKwQ3B7Kje-TV8Zw.png)

---

### Timezone 변경 방법

#### 1. DB Config 수정

`Cloud DB > DB Config 관리 > default-time-zone` 설정 추가

- config key: `default-time-zone`
- config 값: `+00:00` (UTC 기준)

![DB Config](https://cdn-images-1.medium.com/max/800/1*jrLRxeeM-Y7sZ8R3R-Kb9g.png)

![Config 저장](https://cdn-images-1.medium.com/max/800/1*uoK2xjhJGUNcaBE6zcmtOw.png)

#### 2. 변경 후 확인

```sql
SELECT @@GLOBAL.time_zone, @@SESSION.time_zone, @@system_time_zone;
```

![timezone 변경 확인](https://cdn-images-1.medium.com/max/800/1*H9lax6rYoTCis6ESlwVL5g.png)

> `system_time_zone` 값은 변경되지 않지만, 실제 시간 연산은 global/session timezone 기준으로 동작합니다.

---

이상으로 NCP Cloud DB for MySQL 생성과 Timezone 변경 방법을 실습해보았습니다.  
운영 시 시간 관련 장애를 예방하기 위해 반드시 점검하고 설정해 두는 것을 권장합니다.

감사합니다! 🙌
