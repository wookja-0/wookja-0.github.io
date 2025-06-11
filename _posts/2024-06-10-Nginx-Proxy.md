---
title: "Nginx를 활용한 컨테이너 Reverse Proxy"
date: 2024-06-10 17:30:00 +0900
categories: [DevOps, Nginx]
tags: [nginx, reverse-proxy, docker, loadbalancing]
description: "Docker 환경에서 Nginx를 이용한 Reverse Proxy 설정 및 로드밸런싱 구현 실습."
image: https://images.velog.io/post-images/jeff0720/91343f60-eb33-11e8-b115-5df0fc60ff3a/ngnix.png
---
![alt text](nginx-reverse-thumbnail-1200x800.png)
## Nginx를 활용한 컨테이너 Reverse Proxy

![](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2F9CGvL%2FbtsLskNmXuf%2FK1uT4mkuAuHo7d4ueK5FV0%2Fimg.png)

## Nginx Reverse Proxy

- 클라이언트 요청이 특정 포트로 들어오면 준비해둔 애플리케이션 서버의 주소로 트래픽을 분배합니다.
- 기본 분배 방식은 **Round-Robin**이며, 요청 수가 적은 서버에 분배하는 **least-connection**, 클라이언트 IP 기준 분배하는 **ip_hash** 등의 알고리즘도 지원합니다.

> Nginx를 Reverse Proxy로 설정하면 서버의 부하를 줄이고 응답 속도를 향상시킬 수 있습니다. 다양한 로드밸런싱 알고리즘을 활용해 대규모 애플리케이션에서의 안정성을 강화할 수 있습니다.

---

## 실습 환경

- NCP VM (Ubuntu 22.04 / vCPU2, RAM 4GB)
- Docker Engine 사전 설치 완료

컨테이너 기반 환경에서 Nginx를 Reverse Proxy로 구성하는 실습을 진행합니다.

---

## Nginx Container Reverse Proxy

> 공인 IP:8001로 접속 시 5001, 5002, 5003 포트를 사용하는 노드들에 로드밸런싱 적용
![](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FbN3kUs%2FbtsLuYaMDP0%2FqbT8jQk7SKfKt3xjj3H4jK%2Fimg.png)

---

### 1. Nginx Node 컨테이너 생성 (5001, 5002, 5003)

```bash
docker run -it -d -e SERVER_PORT=5001 -p 5001:5001 -h alb-node01 -u root --name=alb-node01 dbgurum/nginxlb:1.0
docker run -it -d -e SERVER_PORT=5002 -p 5002:5002 -h alb-node02 -u root --name=alb-node02 dbgurum/nginxlb:1.0
docker run -it -d -e SERVER_PORT=5003 -p 5003:5003 -h alb-node03 -u root --name=alb-node03 dbgurum/nginxlb:1.0
docker ps -a | grep node
```

![](https://blog.kakaocdn.net/dn/btsLuGVNbER/IfahkuD3zbYkepA4hZN9F1/img.png)

---

### 2. Proxy 역할의 Nginx 컨테이너 생성

```bash
docker run -d -p 8001:80 --name=proxy-container nginx:1.25.0-alpine
```

---

### 3. nginx.conf 생성 및 적용

```nginx
# nginx.conf

events {
    worker_connections 1024;
}

http {
    upstream backend-alb {
        server 223.130.156.230:5001;
        server 223.130.156.230:5002;
        server 223.130.156.230:5003;
    }

    server {
        listen 80 default_server;

        location / {
            proxy_pass http://backend-alb;
        }
    }
}
```

```bash
docker cp nginx.conf proxy-container:/etc/nginx/nginx.conf
docker restart proxy-container
```

---

### 4. curl로 컨테이너 응답 테스트

```bash
curl localhost:5001
curl localhost:5002
curl localhost:5003
```

출력 예시:
```
Listening: 5001, Hosting: alb-node01
```

---

### 5. 브라우저로 Proxy 컨테이너 접속 테스트

브라우저에서 `http://<공인IP>:8001` 접속  
→ 요청이 각 컨테이너로 Round-Robin 방식으로 분산되어 응답이 달라짐

---

### 6. 부하 분산 가중치 설정 (Weight)

![](https://blog.kakaocdn.net/dn/btsLtrSAKmQ/GokKk2PqzQxYVB9wQ0yvyk/img.png)

```nginx
upstream backend-alb {
    server 223.130.156.230:5001 weight=3;
    server 223.130.156.230:5002;
    server 223.130.156.230:5003;
}
```

> 특정 서버에 더 많은 트래픽을 집중하거나, 테스트 시 부하 차등 분산이 가능해집니다.
