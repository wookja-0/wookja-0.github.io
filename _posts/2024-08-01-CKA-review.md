---
title: "Certified Kubernetes Administrator (CKA) 합격 후기"
date: 2024-08-01 19:00:00 +0900
categories: [Certification, Kubernetes]
tags: [cka, kubernetes, 자격증, 후기]
description: "2024년 6월 CKA(Certified Kubernetes Administrator) 시험을 준비하며 느낀 점과 합격을 위한 실제 공부 전략, 후기 공유"
image: https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FbA0Qaz%2FbtsLdg3WPz7%2F1jcna8MZ5OtugWMvxlCPv1%2Ftfile.dat
---

> 2024년 6월에 취득한 **CKA 자격증 후기** 입니다.

![](https://blog.kakaocdn.net/dn/btsLdg3WPz7/1jcna8MZ5OtugWMvxlCPv1/img.png)

---

## 💡 시험 계기

현재 회사에서 클라우드 엔지니어로 재직 중이며, VM 위에 Docker 컨테이너 기반으로 프로젝트를 운영 중입니다.  
향후 **EKS 및 Kubernetes 기반으로 전환**을 대비해 CKA 자격증에 도전하게 되었습니다.

(사실 작년 40% 할인에 미리 구매해 놓고... 막판 몰아치기 공부했어요 😅)

---

## 📚 사전 지식

- Linux 및 Vi(Vim) 사용에 익숙함
- AWS, NCP 기반의 인프라 경험
- 컨테이너 및 K8s 기본 구조 이해

기본적인 리눅스 조작 능력과 K8s 리소스 개념이 큰 도움이 되었습니다.

---

## ⏱️ 준비 기간

- **총 기간**: 약 2개월
- **평일**: 1시간 30분
- **주말**: 3~4시간

퇴근 후, 주말 집중 학습으로 준비하였습니다.

---

## 🛠️ 시험 준비 방법

### 1. Udemy 강의 수강

![](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FsslEZ%2FbtsLdhV4glT%2FwGz0QtSMypBK3hlymgcg6K%2Ftfile.dat)

- Lightning Lab + Mock Exams 중심으로 반복 학습
- 실전 스타일 문제로 감각 익히기

### 2. YouTube 강의 활용

- [TTABAE-LEARN CKA 강의](https://www.youtube.com/playlist?list=PLApuRlvrZKojqx9-wIvWP3MPtgy2B372f) (이성미 강사님)
- 3회 반복 시청 → 구조적 이해에 도움

![](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FGCYxQ%2FbtsLbPl7FZW%2FgVTaRwAkGixxgoRWIweKEk%2Ftfile.dat)

### 3. 기출문제 후기 정독

- [피터의 개발이야기](https://peterica.tistory.com/348) 블로그 활용
- 기출 내용과 실제 문제 유사성 높음

### 4. Killer.sh 모의고사

- 복붙 연습(Ctrl+C / Shift+V)
- `kubectl config use-context` 반복 훈련
- 난이도는 실전의 4~5배..

---

## 🧪 시험 당일

- **시험일**: 일요일 오전 1시
- **환경**: 회사 회의실 (MacBook Pro 16", 거치대 + 블루투스 키보드)

### 사전 준비

- 여권 재발급 (본인 인증용)
- PSI 접속 → 여권/얼굴 촬영 → 감독관과 영어 채팅
- 카메라로 360도 공간 확인, 손목/귀, 키보드 밑 비추기 등

---

## 🔎 기억나는 문제들

다수 문제는 [피터의 개발이야기](https://peterica.tistory.com/348)와 거의 일치:

- Node NotReady → Ready 처리
- etcd snapshot save/restore
- PVC 용량 수정, Pod 연동
- sidecar log 확인
- Ingress + 서비스 연결
- NetworkPolicy 생성
- ClusterRole, ServiceAccount 설정
- log grep & 저장
- `NodePort` 서비스 노출
- 가장 CPU 많이 쓰는 Pod 찾기

→ 대부분 실무 상황 기반 문제

---

## 🧾 합격 후기

- 결과 통보: 시험 응시 24시간 후
- 최종 점수: **83점** (커트라인: 66점)

![](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FbkOlim%2FbtsLditXIyO%2F3k98HXn7LRgirRVcJfkg7K%2Ftfile.dat)

### 아마도 틀린 문제

- Network Policy
- NodePort 설정 실수
- Sidecar 로그 확인 (log 파일 경로 실수?)

```bash
kubectl logs <pod-name> -c sidecar
```

---

![](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FTrMN9%2FbtsLdz3h3te%2FYlIa9dZFeaLw31tp7kEZC0%2Ftfile.dat)
![](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FbtCoBM%2FbtsLdim9VYb%2FcPTKQscIwgTIwn850AQCM1%2Ftfile.dat)

---

CKA는 제게 있어 **첫 실습형 국제 자격증**이었고,  
AWS SAA 이후 두 번째 글로벌 인증이었습니다.  

단순 암기보다는 실습 반복이 핵심이며, K8s 기반 실무를 준비하는 모든 분께 추천드립니다.
