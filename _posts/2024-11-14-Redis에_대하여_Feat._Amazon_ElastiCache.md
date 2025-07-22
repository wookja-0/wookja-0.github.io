---
title: "Redis에 대하여 (Feat. Amazon ElastiCache)"
date: 2024-11-14 00:00:00 +0900
categories: ['AWS']
tags: ['elasticache', 'redis']
description: "Redis 및 ElastiCache에 대하여"
image: https://cdn-images-1.medium.com/max/800/1*5cbeEwlEvOAtGHIxf87xZw.png
---

이번 주제에서는 **Redis** 와 **Amazon ElastiCache** 서비스에 대해 알아보는 시간을 가져보겠습니다.

### 1\. Redis란?

![](https://cdn-images-1.medium.com/max/800/0*MLIoHUfQkkj4HVmh.png)<https://redis.io/>

[Redis](https://aws.amazon.com/ko/elasticache/what-is-redis/)는 [**NoSQL**](https://aws.amazon.com/ko/nosql/) 데이터베이스로, 데이터를 빠르게 저장하고 꺼내는 고성능 데이터 저장소입니다. 여기서 **NoSQL** 이란 전통적인 관계형 데이터베이스(SQL)와 달리, **테이블이나 스키마 없이 유연하게 데이터를 저장** 할 수 있는 방식을 말합니다. Redis는 데이터를 **메모리(RAM)에 저장** 하여 매우 빠른 속도로 데이터를 읽고 쓸 수 있는 특징이 있습니다.

Redis는 **키-값** 형태로 데이터를 저장합니다. 예를 들어, 사용자의 이름이나 점수 같은 정보를 “이름-홍길동” 또는 “점수-90점”처럼 **이름표(키)**와 **값** 을 짝지어 저장합니다. Redis는 이외에도 **리스트, 셋(집합), 해시(딕셔너리)** 같은 다양한 자료형을 지원해 유연하게 데이터를 다룰 수 있습니다.

빠른 속도와 유연성 덕분에, Redis는 웹사이트의 **세션 관리** , **캐싱(임시 저장)** , **실시간 데이터 분석** 같은 빠르게 데이터가 필요한 상황에서 많이 사용됩니다. 쉽게 말해, Redis는 많은 데이터를 신속하게 다뤄야 하는 프로그램이나 웹사이트에서 **캐시** 또는 **임시 저장소** 로 자주 사용되는 NoSQL 데이터베이스입니다.

[**Redis란 무엇입니까? - Amazon Web Services(AWS)**  
_Redis는 빠른 오픈 소스 인 메모리 키 값 데이터 구조 스토어입니다. Redis는 다양한 인 메모리 데이터 구조 집합을 제공하므로 다양한 사용자 정의 애플리케이션을 손쉽게 생성할 수 있습니다._ aws.amazon.com](https://aws.amazon.com/ko/elasticache/what-is-redis/ "https://aws.amazon.com/ko/elasticache/what-is-redis/")[](https://aws.amazon.com/ko/elasticache/what-is-redis/)

* * *

### 2\. Redis 사용 사례

  1. **세션 관리** :  
사용자 세션 데이터를 Redis에 저장해 빠르게 읽고 쓰며, 로그인 세션이나 장바구니 정보 등을 효율적으로 관리합니다.
  2. **캐싱** :  
데이터베이스 조회 결과를 캐시해 주기적으로 조회하는 데이터를 빠르게 제공하여 시스템 성능을 높입니다. 예를 들어, 뉴스 웹사이트에서 인기 기사를 Redis에 캐시합니다.
  3. **실시간 분석** :  
실시간 대량 데이터를 집계 및 순위 계산에 활용하여, 소셜 미디어의 트렌딩 해시태그 순위나 실시간 분석이 필요한 데이터를 제공합니다.
  4. **메시지 큐** :  
비동기 데이터 처리를 위해 Redis 리스트 자료형을 메시지 큐로 활용하며, 주문 처리 시스템에서 상태 전환과 같은 작업을 관리합니다.
  5. **게임 순위표 및 리더보드** :  
게임의 사용자 점수 순위를 실시간으로 업데이트하고 조회할 수 있어, 모바일 게임에서 실시간 리더보드 기능에 적합합니다.
  6. **지리적 데이터 저장 및 검색** :  
위치 기반 데이터 저장과 검색을 지원하여, 예를 들어 음식 배달 앱에서 사용자 위치 기반으로 가까운 음식점을 검색할 수 있습니다.



* * *

### 3\. ElastiCache란?

**AWS ElastiCache** 는 AWS에서 제공하는 완전 관리형 인메모리 데이터베이스 서비스입니다. **Redis** 와 **Memcached** 를 지원하며, 인프라 구성 및 유지 관리 부담 없이 고성능 인메모리 데이터 저장소를 쉽게 구축할 수 있도록 돕습니다. ElastiCache는 자동 백업, 장애 복구(Failover) 기능을 제공해 안정성과 운영 편의성을 높여줍니다.

![](https://cdn-images-1.medium.com/max/600/0*LmwDDun7DbtdSou4)![](https://cdn-images-1.medium.com/max/800/0*8sq7IYe69K_ovia2.png)Amazon ElastiCache

[**Valkey, Memcached, Redis OSS 호환 캐시 - Amazon ElastiCache - AWS**  
 _Amazon ElastiCache는 Valkey, Memcached, Redis OSS와 호환되는 완전관리형 서비스로서 99.99%의 가용성으로 현대적 애플리케이션에 비용 최적화된 실시간 성능을 제공합니다._ aws.amazon.com](https://aws.amazon.com/ko/elasticache/?p=ft&c=db&z=3 "https://aws.amazon.com/ko/elasticache/?p=ft&c=db&z=3")[](https://aws.amazon.com/ko/elasticache/?p=ft&c=db&z=3)

* * *

### 4\. ElastiCache 클러스터 유형 (Redis, Memcached)

AWS ElastiCache는 Redis와 Memcached를 지원하며, 각 클러스터 유형은 다음과 같습니다.

![](https://cdn-images-1.medium.com/max/800/0*vHUNilAkdkQUgZ1Y.png)

#### 1\. Redis 클러스터

![](https://cdn-images-1.medium.com/max/800/0*VirJqDJsf_0qup5n.png)ElastiCache를 사용한 아키텍처(Redis OSS)

**장점:**

  * **데이터 구조 지원** : Redis는 리스트, 해시, 셋 등 다양한 데이터 구조를 지원하여, 복잡한 데이터 저장과 처리를 효율적으로 수행할 수 있습니다.
  * **퍼시스턴스 옵션** : 인메모리 데이터 외에도 데이터를 디스크에 영구적으로 저장할 수 있는 옵션이 있어, 데이터 보존이 중요한 경우 유리합니다.
  * **고급 기능 제공** : 트랜잭션 지원, Lua 스크립트, 복제 및 클러스터링을 통해 확장 가능하며, 지리적 데이터 검색(GEO)이나 메시지 큐와 같은 기능도 내장되어 있습니다.
  * **고가용성 및 자동 장애 조치** : 복제본을 통해 자동 Failover를 지원해 가용성을 보장합니다.



**단점:**

  * **싱글 스레드 기반** : 기본적으로 싱글 스레드로 동작하기 때문에, CPU 활용도에 한계가 있을 수 있습니다. (단, I/O 작업은 멀티스레드로 처리 가능)
  * **비용** : Redis의 고급 기능과 자동화된 관리 기능이 추가된 만큼, 일반적으로 Memcached보다 비용이 높습니다.



**사용 추천 시나리오:**

  * **데이터 복잡성 및 다양성** : 다양한 데이터 구조(리스트, 해시, 셋 등)를 사용하는 경우.
  * **데이터 내구성** : 캐시에 영구적인 데이터 보존이 필요하거나 장애 상황에서 데이터 복구가 필요한 경우.
  * **실시간 데이터 처리** : 실시간 분석, 순위 리스트, 세션 관리, 메시지 큐와 같은 고성능이 요구되는 작업.



#### 2\. Memcached 클러스터

![](https://cdn-images-1.medium.com/max/600/0*k2FuiEZmH0SQSHvt.png)![](https://cdn-images-1.medium.com/max/600/0*2GZuiDeyz8Xo_L_y.png)

**장점:**

  * **간단한 아키텍처** : 단순 키-값 저장소로, 쉽게 확장 가능하며, 분산 환경에서 높은 속도로 데이터를 처리하는 데 적합합니다.
  * **멀티스레드 지원** : 멀티스레드 기반으로 설계되어 있어 대량의 데이터를 효율적으로 처리하고, 읽기 성능이 뛰어납니다.
  * **비용 효율성** : 단순 구조 덕분에 Redis보다 비용이 낮아, 대규모 읽기 캐시에 효율적입니다.



**단점:**

  * **데이터 영구성 미지원** : 인메모리 캐시로만 사용되며, 디스크에 영구적인 데이터 저장이 불가능하여 데이터 내구성이 보장되지 않습니다.
  * **복제 및 장애 조치 미지원** : 장애 발생 시 데이터가 복구되지 않으며, 고가용성이 필요한 환경에서는 직접 분산 시스템을 설정해야 합니다.



**사용 추천 시나리오:**

  * **단순한 캐시 요구** : 데이터 구조가 단순하고 복잡한 연산이 필요 없는 경우.
  * **읽기 성능 최적화** : 대규모 읽기 요청이 자주 발생하고, 캐시가 필요한 데이터 내구성 없이 일시적인 데이터 저장이 필요한 경우.
  * **비용 제한이 있는 환경** : 관리 기능이 필요하지 않은 단순 캐시 용도로, 비용 효율성을 우선시하는 경우.

![](https://cdn-images-1.medium.com/max/800/1*0uWx48w_JQh0KJwkLQHfDA.png)각 type 별 특성

* * *

### 5\. Redis 운영 방식 비교

Redis는 다음 세 가지 방식으로 운영할 수 있습니다.

**1\. Managed Redis (AWS ElastiCache)**

  * **장점** : 자동 백업, 장애 복구, Failover 기능 제공, 기본 모니터링 제공
  * **단점** : 높은 비용과 제한된 설정 옵션
  * **예제** : AWS 콘솔에서 ElastiCache로 Redis를 생성하고 애플리케이션과 연결하여 `redis-cli`나 Python 라이브러리로 데이터 저장 및 조회를 테스트합니다.



**2\. Self-Managed Redis on EC2**

  * **장점** : 제어권이 높고 비용 효율적이며, 메모리 및 CPU 설정을 세부적으로 조정 가능
  * **단점** : 장애 복구와 모니터링을 직접 관리해야 함
  * **예제** : EC2에 Redis를 설치 후 설정하여 원격 접근을 허용하고 `redis-cli`로 데이터 저장과 조회를 테스트합니다.



**3\. Redis 컨테이너 on EC2**

  * **장점** : Kubernetes 등 오케스트레이션 도구를 사용해 스케일링과 장애 복구를 자동화 가능
  * **단점** : 컨테이너 관리와 오케스트레이션 도구에 대한 추가 지식 필요
  * **예제** : Docker로 Redis 컨테이너를 실행 후 `docker exec` 명령으로 CLI에 접근해 데이터 저장과 조회를 테스트합니다.



* * *

### 6\. 비용 비교 및 요금 선택 기준

서울 리전 기준, ElastiCache와 Self-Managed Redis의 비용은 다음과 같습니다.

![](https://cdn-images-1.medium.com/max/800/1*1P71dSoVve1234uOhIJd-Q.png)

**선택 기준** :

  * **비용 최적화가 필요한 경우** : Self-Managed Redis는 비용을 절감할 수 있지만, 운영 관리에 대한 추가 부담이 있습니다.
  * **운영 관리 편의성을 우선하는 경우** : Managed Redis(AWS ElastiCache)는 자동화된 관리 기능을 제공하여 운영 부담을 줄여주지만, 비용이 높습니다.



* * *

### 7\. CPU 활용도와 메모리 관리

  * **Redis CPU 활용도** : 기본적으로 싱글 스레드 기반이라 고성능 인스턴스를 사용해도 CPU 활용도가 제한될 수 있습니다. ElastiCache의 일부 고사양 인스턴스는 멀티스레드 I/O 지원으로 보완합니다.
  * **컨테이너 기반 운영** : 컨테이너를 활용하면 Kubernetes 등의 오케스트레이션 도구로 CPU와 메모리 할당을 최적화할 수 있습니다.



* * *

### 8\. 장애 복구와 운영 관리

#### 1\. Memcached

  * **Failover 및 고가용성 지원 없음** : ElastiCache for Memcached는 복제본과 자동 장애 조치(Failover) 기능을 지원하지 않기 때문에, 개별 노드에 장애가 발생하면 해당 노드의 데이터가 복구되지 않습니다. 이를 보완하기 위해 여러 노드로 구성하여 부하를 분산하는 **수평 확장(샤딩)** 방식을 사용할 수 있습니다.
  * **멀티 AZ 설정 미지원** : Memcached는 멀티 AZ 구성을 지원하지 않기 때문에 특정 가용 영역(AZ)에 장애가 발생하면 해당 AZ의 모든 Memcached 노드가 중단될 수 있습니다. Memcached를 멀티 AZ에서 사용할 경우, 애플리케이션 측에서 **수동으로 노드 관리** 를 처리해야 합니다.
  * **사용 추천 사례** : 고가용성이나 데이터 영구 보관이 필수적이지 않은 단순한 캐시 용도로 Memcached를 사용하는 것이 적합합니다.



#### 2\. Redis

  * **Failover 및 고가용성 지원** : ElastiCache for Redis는 멀티 AZ 구성을 지원하여, 한 AZ에서 장애가 발생하면 다른 AZ에 있는 복제본으로 **자동 Failover** 가 이루어집니다. 이로 인해 Redis는 중요한 데이터가 요구되는 환경에서 안정적인 고가용성을 제공합니다.
  * **복제 및 멀티 AZ 구성 지원** : Redis는 기본적으로 데이터 복제본을 생성하고 여러 가용 영역에 걸쳐 분산할 수 있어, 장애 시 다른 가용 영역에서 데이터 접근이 가능합니다. 멀티 AZ 구성을 통해 안정성과 장애 복구 능력을 극대화할 수 있습니다.
  * **사용 추천 사례** : 고가용성과 데이터 영구 보관이 필요한 세션 관리, 실시간 데이터 분석, 순위 리스트와 같은 용도에서 Redis를 사용하는 것이 적합합니다.



#### 3\. 요약

  * **Memcached** 는 **Failover 및 멀티 AZ 구성을 지원하지 않으므로** , 장애 복구가 필요하지 않은 일시적 데이터 캐시에 적합합니다.
  * **Redis** 는 **Failover와 멀티 AZ 구성을 모두 지원하여 고가용성이 필요한 환경** 에 적합하며, 중요 데이터의 안전성을 보장합니다.



* * *

### 마치며

Redis와 ElastiCache의 운영 방식은 사용 목적과 관리 요구 사항에 따라 적합한 옵션이 달라질 수 있습니다. 비용과 관리 편의성을 고려해 각 운영 방식을 선택하시기 바랍니다.

추후에 AWS ElastiCache 클러스터를 실제로 생성하여 실제 서비스에서 어떻게 활용 하는지에 대한 주제로 찾아 뵙겠습니다.


### Reference

[**Performance at Scale with Amazon ElastiCache**  
 _In-memory caching improves application performance by storing frequently accessed data items in memory, so that they…_ docs.aws.amazon.com](https://docs.aws.amazon.com/whitepapers/latest/scale-performance-elasticache/scale-performance-elasticache.html "https://docs.aws.amazon.com/whitepapers/latest/scale-performance-elasticache/scale-performance-elasticache.html")[](https://docs.aws.amazon.com/whitepapers/latest/scale-performance-elasticache/scale-performance-elasticache.html)

[**Valkey, Memcached, Redis OSS 호환 캐시 - Amazon ElastiCache 요금 - AWS**  
 _Valkey, Memcached, Redis OSS를 위한 관리형 캐싱 서비스인 Amazon ElastiCache는 사용한 만큼만 요금을 지불합니다. 무료로 시작하세요._ aws.amazon.com](https://aws.amazon.com/ko/elasticache/pricing/ "https://aws.amazon.com/ko/elasticache/pricing/")[](https://aws.amazon.com/ko/elasticache/pricing/)

[**관리형 캐싱 서비스 - Redis OSS 호환 Amazon ElastiCache - AWS**  
 _Amazon ElastiCache는 Redis OSS 호환 인 메모리 데이터 스토어 서비스로서, 실시간 애플리케이션의 데이터베이스, 캐시, 메시지 브로커 및 대기열로 사용될 수 있습니다. 이 서비스는 Redis…_ aws.amazon.com](https://aws.amazon.com/ko/elasticache/redis/ "https://aws.amazon.com/ko/elasticache/redis/")[](https://aws.amazon.com/ko/elasticache/redis/)