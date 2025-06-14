---
title: "[NCP] Backup 서비스에 대하여"
date: 2024-07-08 00:00:00 +0900
categories: ['NCP']
tags: ['backup']
description: "관리형 Backup 서비스에 대해 알아보자"
image: https://cdn-images-1.medium.com/max/800/1*dO3ZlCZtP4rGML_MbyrN7A.png
---

이번 시간에는 NCP(Naver Cloud Platform)의 [**Backup**](https://www.ncloud.com/product/storage/backup) 서비스에 대해 알아보겠습니다.

---

### 개요

1. Backup 서비스란?  
2. Backup 서비스 사용 시나리오  
3. Backup 서비스 Demo 실습

---

### 1. Backup 서비스란?

> 정책기반으로 데이터를 쉽고 안전하게 백업하고 복구할 수 있는 서비스

#### 다양한 플랫폼 및 데이터베이스 지원
- 다양한 운영 체제와 데이터베이스의 온라인 백업 지원  
- 원본과 다른 서버에서도 복구 가능  

#### 간편한 설치와 백업 단위 선택
- 웹 콘솔에서 에이전트 설치 및 정책 구성 가능  

#### 다양한 백업 방식 제공
- 증분 백업 및 소산(이중화) 백업 기능 제공  

#### 경제적인 비용 설계
- 변경된 데이터만 추출 백업 가능  
- 최대 365일 보관, 백업 저장소 별도 불필요  

#### 유연한 백업 정책
- 백업 주기: 일간/주간/월간/일회성  
- 보관 기간: 7~364일  
- 최대 용량: 단일 서버 1TB/일  

#### 리포트 기능 제공
- 일간/월간 리포트 및 이메일 수신 기능 제공  

#### 소산 백업
- 다른 존에 복제해 안정성 확보 가능  

#### 백업 서비스 유형
- 파일 시스템 백업  
- 데이터베이스 백업 (MSSQL, MySQL, PostgreSQL 등)

---

### 2. Backup 서비스 사용 시나리오

> 백업 대상 서버 구성 → 저장소 & 리소스 생성 → Policy 생성 → Job 생성 → Schedule 설정

- **저장소**: 백업 파일이 저장될 공간  
- **리소스**: 백업 대상 서버/DB  
- **Job**: 백업 경로 및 대상 정의  
- **Policy**: 보관 기간  
- **Schedule**: 주기 및 시간 설정  

---

### 3. Backup 서비스 Demo 실습

> 매일 00시 backup-test-vm 대상 /var/nginx/log 폴더 전체 백업 구성

#### 3-1. 백업 대상 서버 구성

![](https://cdn-images-1.medium.com/max/800/1*wbfps5e_lLRVHQjMGFBg9Q.png)  
해당 서버에 nginx 서비스 설치

![](https://cdn-images-1.medium.com/max/800/1*bo_JlfBSorWre4i6e2WM3A.png)  
> ACG 규칙 설정 필요  
> 참고: [Backup 고급 설정 가이드](https://guide.ncloud-docs.com/docs/backup-advance)

![](https://cdn-images-1.medium.com/max/800/1*0Zy0uhjhcjkp7AAo7LHXQQ.png)

---

#### 3-2. Backup 저장소 생성

![](https://cdn-images-1.medium.com/max/800/1*J7a6Nf-IACamNvSZ3GIzMw.png)  
![](https://cdn-images-1.medium.com/max/800/1*2OJAh6RNce_-tJoyLcC5xw.png)

---

#### 3-3. Backup 리소스 생성

![](https://cdn-images-1.medium.com/max/800/1*AYOMeQ9vscHSKcxLDdEoww.png)  
![](https://cdn-images-1.medium.com/max/800/1*EBYFSSbdHtrbz6-a2GK6fQ.png)

> Agent 설치를 위한 일회성 계정 필요 (예: root 또는 서브 계정 사용 가능)

![](https://cdn-images-1.medium.com/max/800/1*fgmAbhENs6FroDXLmOcgAg.png)  
→ Agent 설치 완료 확인

---

#### 3-4. Policy 생성

![](https://cdn-images-1.medium.com/max/800/1*VK0OUgbv1X2rXeDJP9B5bg.png)  
![](https://cdn-images-1.medium.com/max/800/1*x_AlEzWY4m4GXHmWALCnWw.png)

> 가용영역 지정 시 저장소 자동 연결 확인

---

#### 3-5. Job 생성

![](https://cdn-images-1.medium.com/max/800/1*2zzoMSh7Mk-ja6ZC_PGoxw.png)  
![](https://cdn-images-1.medium.com/max/800/1*w3xuBeI7hD3uf5oPiNI6xg.png)

- /var/log/nginx 폴더 전체 백업  
- 보관 기간 1일 (policy 적용)  

![](https://cdn-images-1.medium.com/max/800/1*eUAIIBeMxaaraThbnlieGA.png)

---

#### 3-6. Schedule 생성

![](https://cdn-images-1.medium.com/max/800/1*8CiZIZu77vMLjwmTK7MPLg.png)  
![](https://cdn-images-1.medium.com/max/800/1*SudB3-ly4Ee-LtCaUQpkAg.png)

→ 매일 00시에 백업 진행

> 📊 리포트 메뉴에서 백업 상태 및 결과 확인 가능 (.xls 다운로드 지원)

![](https://cdn-images-1.medium.com/max/800/1*b7wZYK2PsMsDKqg3TUPNBA.png)

---

### 마치며

이번 주제에서 Backup 서비스에 대해 알아보았습니다.

**최종 구성 요약:**  
매일 00시 `backup-test-vm` 대상 `/var/nginx/log` 폴더 전체 백업

> 🔗 자세한 사항은 공식 문서 참고  
> [https://www.ncloud.com/product/storage/backup](https://www.ncloud.com/product/storage/backup)

감사합니다.