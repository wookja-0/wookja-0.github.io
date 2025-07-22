---
title: "[NCP] 로드밸런서 Sticky Session 이란?"
date: 2024-06-11 00:00:00 +0900
categories: ['NCP']
tags: ['loadbalancer', 'NCP']
description: "[NCLOUD] 로드밸런서 Sticky Session 이란?"
image: https://cdn-images-1.medium.com/max/800/0*XFTYuVaZiskiP7XE.gif
---

# [NCP] 로드밸런서 Sticky Session 이란?

세션 처리는 어떻게 할까? Sticky Session을 통해 알아보자.

---

## Sticky Session이란?

**Sticky Session(고정 세션)** 은 로드밸런서가 클라이언트의 세션을 특정 서버에 고정시켜주는 기능입니다.  
일반적인 로드밸런서는 요청을 서버에 분산하지만, Sticky Session을 활성화하면 특정 사용자의 요청은 항상 동일한 서버로 전달됩니다.

![](https://cdn-images-1.medium.com/max/800/0*XFTYuVaZiskiP7XE.gif)  
> 이미지 출처: [https://smjeon.dev/web/sticky-session](https://smjeon.dev/web/sticky-session/)

### 작동 방식

1. 클라이언트 vsh123, oeeen이 로드밸런서에 요청
2. vsh123 → 서버 C, oeeen → 서버 B로 첫 요청 라우팅
3. 이후 각각은 동일 서버로 연결 유지

이 방식은 **서버 간 세션 데이터 공유가 어려운 경우**,  
**세션 데이터 유실 방지**, **쇼핑몰, 로그인 유지 등 사용자 경험 향상**에 도움이 됩니다.

---

## 왜 필요한가?

로드밸런서가 부하 분산으로 클라이언트 요청을 여러 서버로 전달하다 보면  
사용자의 로그인 세션이 유지되지 않는 문제가 발생할 수 있습니다.

예:
- A 서버에 로그인했는데, 다음 요청은 B 서버로 가면 세션이 없으므로 다시 로그인 필요  
- Sticky Session이 이를 방지

---

## 단점도 있다

- 특정 서버에만 요청이 몰려 부하 발생
- 로드밸런싱 효과 감소
- 서버 장애 시 해당 세션 유실 가능성

---

## 실제 동작 예시

- 로드밸런서 뒤에 Nginx A, B 서버 구성
- Sticky Session 활성화
- 브라우저에서 로드밸런서 도메인으로 GET 요청
- 첫 요청은 A 서버로, 이후 요청도 모두 A 서버로 연결됨
- Access 로그는 A 서버에만 쌓임

---

## NCP에서 Sticky Session 설정하기

**Target Group 설정**에서 Sticky Session을 간단히 설정할 수 있습니다.

![](https://cdn-images-1.medium.com/max/800/1*G4UyfDr7Xdo_3jUzy0Ti3Q.png)  
![](https://cdn-images-1.medium.com/max/800/1*el3sQVuNs5_KUGhPVoR6QA.png)

---

## 언제 사용하면 좋을까?

### 1. 서버 간 세션 공유가 어려울 때
Sticky Session을 통해 세션 공유 없이도 사용자 상태 유지 가능

### 2. 세션 데이터가 클 때
세션 복제가 부담될 경우 Sticky Session으로 해결

### 3. 서버 측 캐싱 활용 시
동일한 서버로 요청이 유지되므로 캐시 활용 극대화 가능

### 4. 쇼핑몰처럼 상태 유지가 중요한 경우
쇼핑 카트, 주문 정보 등 유지를 위해 Sticky Session 필수

### 5. 상태 저장형 애플리케이션
사용자 상태가 서버에 저장되는 구조에서는 Sticky Session이 안정성 확보에 도움

---

## 결론

Sticky Session은  
- 서버 간 세션 동기화가 어렵거나  
- 사용자 상태를 유지해야 하는 애플리케이션에 적합합니다.

단점도 존재하므로, **부하 분산 효율과 안정성 사이의 균형**을 고려하여 사용해야 합니다.

감사합니다.