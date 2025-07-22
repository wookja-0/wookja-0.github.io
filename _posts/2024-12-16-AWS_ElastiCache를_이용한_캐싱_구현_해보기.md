---
title: "[AWS] ElastiCache를 이용한 캐싱 구현 해보기"
date: 2024-12-16 00:00:00 +0900
categories: ['AWS']
tags: ['container', 'elasticache', 'redis']
description: "AWS ElastiCache를 이용하여 캐싱 동작 방식을 알아보자"
image: https://cdn-images-1.medium.com/max/800/1*3HW6XOTjky3n1McskqETxg.png
---

이번 글에서는 AWS에서 Redis OSS 기반의 ElastiCache 클러스터를 생성하고, 이를 실제 서비스와 연동해 데이터를 효율적으로 캐싱하는 방법을 다뤄보겠습니다.

### 진행 흐름

  1. **Redis 클러스터 생성**
  2. **EC2 Instance 생성 (Frontend, Backend)**
  3. **Frontend와 Backend 컨테이너 배포**
  4. **ElastiCache 캐싱 구현 및 테스트**

![](https://cdn-images-1.medium.com/max/800/1*fwsvVDjX8FzipElcAR6TmQ.png) Demo flow

* * *

### 1\. Redis OSS 클러스터 생성

#### 1) AWS Console에서 생성

  1. AWS Management Console에서 **ElastiCache** 를 검색하고, 서비스 페이지로 이동합니다.
  2. Redis 클러스터를 생성합니다.

![](https://cdn-images-1.medium.com/max/800/1*wFUFfn7O4Zrs_UEdpGZjFQ.png)

  * **Redis 엔진** : OSS 선택
  * **배포 옵션** : 자체 캐시 설계
  * **생성 방법** : 클러스터 캐시
  * **클러스터 모드** : 비활성화 (Demo 용도)
  * **위치** : AWS 클라우드
  * **다중 AZ** : 사용 해제 (Demo 용도)
  * **VPC 및 서브넷 그룹** : EC2와 동일한 네트워크 설정
  * **보안 그룹** : EC2와 통신 가능하도록 설정

![](https://cdn-images-1.medium.com/max/800/1*Wvvkv6aqKkNxffqkQEuDEw.png)![](https://cdn-images-1.medium.com/max/800/1*ljsEBFF49bFUhxyLO7vROQ.png)![](https://cdn-images-1.medium.com/max/800/1*O6G7YWxeHQBkGG6D7eLbyA.png)

3\. 설정을 완료한 후 **ElastiCache 클러스터** 를 생성합니다.

* * *

### 2\. EC2 (Frontend, Backend) 생성하기

#### 1) EC2 인스턴스 생성

  * Redis 클러스터가 생성되는 동안, **Frontend** 와 **Backend** 용도의 EC2 인스턴스를 생성합니다.
  * 생성 시 **ElastiCache와 동일한 VPC 및 가용 영역** 을 선택해야 합니다.



#### 2) Docker 및 Docker Compose 설치

  * 각 EC2 인스턴스에 Docker 및 Docker Compose를 설치합니다:

```bash    
sudo apt update  
sudo apt install -y docker.io docker-compose  
sudo systemctl start docker  
sudo systemctl enable docker
```

* * *

### 3\. 서비스 구성

#### 1) 기술 스택

각 Tier 별 서비스 구성은 이렇습니다:

#### Frontend

  * **Nginx** : 정적 파일(index.html) 서빙
  * **HTML & JavaScript**: 간단한 UI 제공 및 API 호출 처리



#### Backend

  * **FastAPI** : Python 기반의 고성능 API 프레임워크
  * **uvicorn** : FastAPI를 실행하기 위한 ASGI 서버
  * **aioredis** : Redis 클라이언트 라이브러리

![](https://cdn-images-1.medium.com/max/800/1*B3pVK9EaR9tN6pv6YMkRyg.png)![](https://cdn-images-1.medium.com/max/800/1*hrAeMh5YUc5vCj7kOUA0KQ.png)

상세 코드들은 github에서 확인 부탁드립니다.

[**GitHub - tkwk5445/fastapi-redis**  
 _Contribute to tkwk5445/fastapi-redis development by creating an account on GitHub._ github.com](https://github.com/tkwk5445/fastapi-redis "https://github.com/tkwk5445/fastapi-redis")[](https://github.com/tkwk5445/fastapi-redis)

* * *

### 4\. 소스코드 Clone

#### 1) GitHub 저장소 Clone

EC2 인스턴스에 SSH 또는 SSM으로 접속한 후 소스코드를 Clone 합니다:

```bash    
~$ git clone https://github.com/tkwk5445/fastapi-redis  
~$ cd fastapi-redis  
  
ubuntu@ip-172-31-10-197:~/fastapi-redis/backend$ ls -al  
total 24  
drwxrwxr-x 2 ubuntu ubuntu 4096 Dec  6 06:43 .  
drwxrwxr-x 5 ubuntu ubuntu 4096 Dec  6 06:43 ..  
-rw-rw-r-- 1 ubuntu ubuntu   38 Dec  6 06:43 .env  
-rw-rw-r-- 1 ubuntu ubuntu  203 Dec  6 06:43 Dockerfile  
-rw-rw-r-- 1 ubuntu ubuntu 1398 Dec  6 06:43 main.py  
-rw-rw-r-- 1 ubuntu ubuntu   36 Dec  6 06:43 requirements.txt
```

#### 2) 파일 구조

Clone 후 프로젝트 구조는 다음과 같습니다:
    
    
    .  
    ├── frontend/  
    │   ├── Dockerfile       # Frontend Dockerfile  
    │   └── index.html       # HTML/JS for the user interface  
    ├── backend/  
    │   ├── Dockerfile       # Backend Dockerfile  
    │   └── main.py          # FastAPI application  
    ├── docker-compose.yml   # Docker Compose configuration

* * *

### 5\. Backend 설정

#### 1) .env 파일 수정

  * Backend 폴더 내 `.env` 파일에 **Redis 엔드포인트** 를 설정합니다:


    
```bash    
ubuntu@ip-172-31-10-197:~/fastapi-redis/backend$ ls -al  
total 24  
drwxrwxr-x 2 ubuntu ubuntu 4096 Dec  6 06:43 .  
drwxrwxr-x 5 ubuntu ubuntu 4096 Dec  6 06:43 ..  
-rw-rw-r-- 1 ubuntu ubuntu   38 Dec  6 06:43 .env  
-rw-rw-r-- 1 ubuntu ubuntu  203 Dec  6 06:43 Dockerfile  
-rw-rw-r-- 1 ubuntu ubuntu 1398 Dec  6 06:43 main.py  
-rw-rw-r-- 1 ubuntu ubuntu   36 Dec  6 06:43 requirements.txt  
  
ubuntu@ip-172-31-10-197:~/fastapi-redis/backend$ vim .env
```

![](https://cdn-images-1.medium.com/max/800/1*Bo6OxbHD2BBbk2WQqCbHwA.png)ElastiCache 엔드포엔드 확인

#### .env 파일 내용
    
    
    REDIS_ENDPOINT=arnold-demo-redis.sdqb2e.ng.0001.apse1.cache.amazonaws.com:6379

* * *

### 6\. Frontend 설정

#### 1) index.html 수정

  * `frontend` 폴더의 `index.html`에서 fetch 요청의 IP를 인스턴스(Backend)의 Public IP로 수정합니다:

```html
const response = await fetch(`http://<Backend-Public-IP>:8000${endpoint}`, options);
```
* * *

### 7\. Docker Compose로 컨테이너 배포

#### 1) 컨테이너 빌드 및 실행

  * 프로젝트 루트 디렉토리에서 다음 명령어를 실행합니다:


    
```bash    
docker-compose up --build  
  
  ✔ Service backend                     Built                                                                                                           17.6s  
  ✔ Service frontend                    Built                                                                                                            5.6s  
  ✔ Network fastapi-redis_default       Created                                                                                                          0.1s  
  ✔ Container fastapi-redis-backend-1   Started                                                                                                          0.3s  
  ✔ Container fastapi-redis-frontend-1  Started
```

#### 2) 컨테이너 상태 확인

  * 컨테이너가 정상적으로 실행 중인지 확인합니다:

```bash    
docker ps
```

#### 실행 결과 예시
```bash    
CONTAINER ID   IMAGE                    COMMAND                  STATUS          PORTS  
5e3e783a3fb4   fastapi-redis-frontend   "/docker-entrypoint.…"   Up 21 seconds   0.0.0.0:8080->80/tcp  
a98d9d6677f3   fastapi-redis-backend    "uvicorn main:app --…"   Up 21 seconds   0.0.0.0:8000->8000/tcp
```
* * *

### 8\. 캐싱 구현 및 테스트

#### 1) Front-End 테스트

  1. **브라우저 접속**



브라우저에서 **Frontend 인스턴스의 Public IP:8080** 으로 접속합니다:
    
    
    http://<Frontend-Public-IP>:8080

![](https://cdn-images-1.medium.com/max/800/1*HvJ3SGf301vZp4ennsAnIA.png)

**2\. Key/Value 데이터 입력 및 저장**

Key와 Value를 입력한 후 **Set** 버튼을 클릭합니다.

![](https://cdn-images-1.medium.com/max/800/1*Upmape-dfBZJbqJRcGIcfQ.png)Response 블럭 확인

**3\. POST 요청 확인**  
데이터를 저장하면 Backend 컨테이너에서 `/set` 요청이 처리됩니다.

**로그 확인 방법** :  
다음 명령어로 Backend 컨테이너 로그를 실시간 확인할 수 있습니다:
    
```bash    
root@ip-172-31-46-57:~# docker logs -f fastapi-redis-backend-1  
  
INFO:     Started server process [1]  
INFO:     Waiting for application startup.  
INFO:     Application startup complete.  
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)  
INFO:     118.216.172.3:41083 - "OPTIONS /set HTTP/1.1" 200 OK  
INFO:     118.216.172.3:41083 - "POST /set HTTP/1.1" 200 OK  
INFO:     118.216.172.3:7698 - "POST /set HTTP/1.1" 200 OK
```
* * *

#### 2) 데이터 조회 및 TTL 확인

![](https://cdn-images-1.medium.com/max/800/1*MgA5HoIUwVJeHZ6Hc5hEAA.png)

  1. **데이터 조회 (GET 요청)**  
브라우저에서 Key를 입력한 후 **Get** 버튼을 클릭합니다. Backend 컨테이너에서 `/get` 요청이 처리됩니다.



**로그 확인 방법** :  
동일한 명령어로 `/get` 요청 로그를 확인합니다:
    
```bash    
root@ip-172-31-46-57:~# docker logs -f fastapi-redis-backend-1  

INFO:     Started server process [1]  
INFO:     Waiting for application startup.  
INFO:     Application startup complete.  
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)  
INFO:     118.216.172.3:41083 - "OPTIONS /set HTTP/1.1" 200 OK  
INFO:     118.216.172.3:41083 - "POST /set HTTP/1.1" 200 OK  
INFO:     118.216.172.3:7698 - "POST /set HTTP/1.1" 200 OK  
INFO:     118.216.172.3:62545 - "OPTIONS /set HTTP/1.1" 200 OK  
INFO:     118.216.172.3:62545 - "POST /set HTTP/1.1" 200 OK  
INFO:     118.216.172.3:1439 - "POST /set HTTP/1.1" 200 OK  
INFO:     118.216.172.3:6046 - "OPTIONS /get/test HTTP/1.1" 200 OK  
INFO:     118.216.172.3:6046 - "GET /get/test HTTP/1.1" 200 OK  
INFO:     118.216.172.3:63338 - "GET /get/test HTTP/1.1" 200 OK


root@ip-172-31-46-57:~# docker logs -f fastapi-redis-backend-1  
INFO:     Started server process [1]  
INFO:     Waiting for application startup.  
INFO:     Application startup complete.  
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)  
INFO:     118.216.172.3:41083 - "OPTIONS /set HTTP/1.1" 200 OK  
INFO:     118.216.172.3:41083 - "POST /set HTTP/1.1" 200 OK  
INFO:     118.216.172.3:7698 - "POST /set HTTP/1.1" 200 OK  
INFO:     118.216.172.3:62545 - "OPTIONS /set HTTP/1.1" 200 OK  
INFO:     118.216.172.3:62545 - "POST /set HTTP/1.1" 200 OK  
INFO:     118.216.172.3:1439 - "POST /set HTTP/1.1" 200 OK  
INFO:     118.216.172.3:6046 - "OPTIONS /get/test HTTP/1.1" 200 OK  
INFO:     118.216.172.3:6046 - "GET /get/test HTTP/1.1" 200 OK  
INFO:     118.216.172.3:63338 - "GET /get/test HTTP/1.1" 200 OK
```
* * *

**2\. TTL(Time-to-Live) 확인**

FastAPI 백엔드 코드에서 Redis 데이터의 TTL을 60초로 설정했으므로, 60초 이내와 이후에 데이터를 조회하여 캐싱 동작을 확인할 수 있습니다.

> // main.py 참고

  * **TTL 60초 이내** :  
Redis에서 캐싱된 데이터를 반환하며, 응답 메시지에서 `source: cache`로 데이터가 캐싱된 상태임을 확인할 수 있습니다.

![](https://cdn-images-1.medium.com/max/800/1*MgA5HoIUwVJeHZ6Hc5hEAA.png)
    
    
    {  
        "key": "test",  
        "value": "12345",  
        "source": "cache"  
    }

  * **TTL 60초 이후** :  
TTL이 만료되면 Redis에서 데이터가 삭제되고, 조회 시 Key를 찾을 수 없다는 메시지가 반환됩니다.

![](https://cdn-images-1.medium.com/max/800/1*yRHWUY55zzcIPHneVhYfow.png)

  * 60초가 경과한 후 동일한 Key를 조회하면 아래와 같이 데이터가 없다는 응답을 받습니다:


    
    
    {  
        "error": "Key not found"  
    }

* * *

#### 3) 테스트 흐름 요약

  1. **POST 요청 (Key/Value 데이터 저장)**


  * 데이터를 입력하고 저장하면 Redis에 Key/Value가 저장됩니다.
  * Backend 컨테이너 로그에서 `/set` 요청 처리 로그를 확인합니다.



**2\. GET 요청 (데이터 조회)**

  * **TTL 60초 이내** : 캐시된 데이터가 반환되며, 응답에 `source: cache`가 포함됩니다.
  * **TTL 60초 경과 후** : TTL이 만료되어 Redis에서 데이터를 찾을 수 없다는 메시지가 반환됩니다.



* * *

### 마치며

이번 글에서는 AWS ElastiCache를 활용하여 Redis 기반의 캐싱 환경을 구축하고, 이를 실제 서비스에 어떻게 적용할 수 있는지 다뤄보았습니다.  
다음 글에서는 더 좋은 주제로 찾아 뵙겠습니다.

* * *

### Reference

[**What is Amazon ElastiCache?**  
_Set up, manage, and scale a distributed in-memory data store or cache environment in the cloud using the cost-effective…_ docs.aws.amazon.com](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html "https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html")[](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html)

[**TTL**  
 _Returns the expiration time in seconds of a key._ redis.io](https://redis.io/docs/latest/commands/ttl/ "https://redis.io/docs/latest/commands/ttl/")[](https://redis.io/docs/latest/commands/ttl/)

[**FastAPI**  
 _FastAPI framework, high performance, easy to learn, fast to code, ready for production_ fastapi.tiangolo.com](https://fastapi.tiangolo.com/ko/ "https://fastapi.tiangolo.com/ko/")[](https://fastapi.tiangolo.com/ko/)