---
title: "[AWS] ECS를 이용한 Serverless 웹 서비스 구현하기"
date: 2024-06-10 00:00:00 +0900
categories: ['AWS']
tags: ['AWS', 'container', 'ecr', 'ecs', 'registry', 'server']
description: "[AWS] ECS를 이용한 Serverless 웹 서비스 구현하기"
image: https://cdn-images-1.medium.com/max/800/0*W_CczRr748yjqiDc.png
---

### 개요

ECS(Elastic Container Service)는 AWS의 컨테이너 오케스트레이션 서비스로, 이번 포스트에서는 **Fargate 런타입**을 기반으로 서버리스 환경에서 Node.js 앱을 배포하는 방법을 정리합니다.

이전 포스트에서 다룬 [ECR 실습 가이드]에서 만든 이미지를 활용하여 ECS 서비스로 구성합니다.


---

## 🧩 사용 기술 스택 및 목표

- **ECR**: 이미지 저장소 (사전 구축)
- **ECS + Fargate**: 서버리스 컨테이너 배포
- **ALB**: 로드밸런싱 처리

> 목표: AWS 관리형 인프라를 활용하여 Node.js 웹 앱을 서버리스 형태로 배포하기

---

## 작업 순서

1. ECS 클러스터 생성
2. 테스크 정의(Task Definition) 생성
3. ECS 서비스 생성 및 배포
4. ALB로 접속 테스트

---

## 1. ECS 클러스터 생성

![](https://cdn-images-1.medium.com/max/800/1*uj9osJ1ewmCT8zjT5tVNyg.png)

- 클러스터 이름 설정
- 인프라 유형: **Fargate** 선택

![](https://cdn-images-1.medium.com/max/800/1*Vl58_aFzpdaCVNsi7AN6JA.png)
![](https://cdn-images-1.medium.com/max/800/1*4e_do3UY-yHSwHQ3nPo0SA.png)

---

## 2. Task Definition 생성

![](https://cdn-images-1.medium.com/max/800/1*OEIMNKqFMEcMcNCq8PjbeA.png)
![](https://cdn-images-1.medium.com/max/800/1*v9ja1UMaOSso__7_OFaSsg.png)

- 런타입: **Fargate**
- CPU/Memory 설정
- IAM Task Role 선택

![](https://cdn-images-1.medium.com/max/800/1*FUEmpn6pEmE3QlVUG-IQfA.png)
![](https://cdn-images-1.medium.com/max/800/1*FS5nxXNA8fkmd1Kx4ymbPg.png)

- 컨테이너 정의: 이름, 포트(4000), 이미지 URL(ECR)

![](https://cdn-images-1.medium.com/max/800/1*rFKK4QHaHmLxOcE9Nx9dow.png)
![](https://cdn-images-1.medium.com/max/800/1*l0_PG6nB8N7drlC2w9ntqA.png)

---

## 3. ECS 서비스 생성

![](https://cdn-images-1.medium.com/max/800/1*gxgj4J6ymZTzF5mO72Kq6Q.png)
![](https://cdn-images-1.medium.com/max/800/1*z9cT1cT3CCzfZtMFQNQg-w.png)

- 시작 유형: **FARGATE**
- 서비스 수: 1개

### 배포 구성

![](https://cdn-images-1.medium.com/max/800/1*C8kAC_-AMPzFuAkxZ3ILzw.png)

- 서비스 유형: 서비스
- 패밀리: 이전 생성한 Task Definition 선택

### 로드밸런싱 설정

![](https://cdn-images-1.medium.com/max/800/1*Sby0ft4Om6L_m21j8OIG8w.png)
![](https://cdn-images-1.medium.com/max/800/1*NV8snjA-Fh-6p9xlN3V65Q.png)

- ALB 생성 및 리스너: 포트 4000
- 대상 그룹 구성: 건강 상태 체크 포함

---

## 4. 로드밸런서 접속 테스트

### 대상 그룹 확인

![](https://cdn-images-1.medium.com/max/800/1*3x4HN5MPp6mSNTJYqHoH1Q.png)

- 상태: Healthy 확인

### ALB DNS 접속

![](https://cdn-images-1.medium.com/max/800/1*S651qmEhl5WhOWq6zbB-TQ.png)

- 브라우저에서 ALB DNS로 접속

![](https://cdn-images-1.medium.com/max/800/1*GRaPZNpe5deRIok3CFQLqw.png)

---

## ✅ 마무리

이렇게 AWS의 ECS + Fargate를 기반으로 서버리스 구조의 웹 서비스를 구성해보았습니다. 

ECR에서 이미지를 가져와 ECS에서 배포하고, ALB를 통해 안정적으로 트래픽을 전달받는 구조로 이어지는 전체 흐름을 체험해볼 수 있는 실습이었습니다.

---

📎 관련 문서

- [ECS 공식 문서](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/Welcome.html)

감사합니다 🙌