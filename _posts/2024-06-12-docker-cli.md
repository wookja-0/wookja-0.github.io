---
title: "Docker 컨테이너 관리를 위한 CLI 정리"
date: 2024-06-12 18:30:00 +0900
categories: [DevOps, Docker]
tags: [docker, container, cli, nodejs]
description: "Docker 컨테이너 실행, 빌드, 모니터링, 로그, exec 등 자주 쓰는 CLI 명령어 정리와 실습 예제"
image: https://blog.kakaocdn.net/dn/cjwYXh/btscY5g2gef/s2mskX6Xh9WVEBw9HR9i50/img.png
---

## Docker 컨테이너 관리를 위한 CLI 정리

![](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FcyjToV%2FbtsLuqr5E0v%2FrKwgv2bSb8qofWc2rKPcvK%2Fimg.png)

---

## Docker 명령어 및 실습 가이드

### 기본 명령어: `docker run [options] image [command]`

| 옵션 | 설명 |
|------|------|
| `-i`, `--interactive` | 대화식 모드 (쉘 입력 가능) |
| `-t` | TTY 할당 (터미널 연결용) |
| `-d`, `--detach` | 백그라운드 실행 |
| `--name` | 컨테이너 이름 지정 |
| `--rm` | 종료 시 자동 제거 |
| `--restart` | 재시작 정책 지정 |
| `-e`, `--env` | 환경 변수 설정 |
| `--env-file` | 다중 env 변수 파일 지정 |
| `-v`, `--volume` | 볼륨 마운트 (호스트:컨테이너) |
| `-h` | 호스트명 지정 |
| `-p` | 포트 매핑 (호스트:컨테이너) |
| `-P` | 자동 포트 매핑 |
| `-w`, `--workdir` | 컨테이너 작업 디렉토리 설정 |

---

## 실습 환경

- **환경**: UTM 기반 VM (Rocky Linux)
- **도구**: Docker, Node.js

![](https://velog.velcdn.com/images/wookja/post/6e3f7fc3-a52d-4824-b1eb-11a50e01e439/image.png)

---

## JS 파일 및 Dockerfile 생성

```bash
cat > runapp.js <<EOF
const http = require('http');
const server = http.createServer().listen(6060);
server.on('request', (req, res) => {
  console.log('Your request arrived.');
  res.write("HostName: " + process.env.HOSTNAME + "\n");
  res.end();
});
server.on('connection', (socket) => {
  console.log("Your Connected.");
});
EOF
```

```Dockerfile
FROM node:20-alpine3.17
RUN apk add --no-cache tini curl
WORKDIR /app
COPY runapp.js .
EXPOSE 6060
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "runapp.js"]
```

---

## Docker 이미지 빌드

```bash
docker build -t noderun:1.0 .
docker images | grep noderun
```

---

## Docker 컨테이너 실행

```bash
docker run -d --name=node-run -p 6060:6060 noderun:1.0
docker ps
curl localhost:6060
```

---

## 컨테이너 정보 확인 (top, port, stats)

```bash
docker top node-run
docker port node-run
docker stats node-run
```

---

## 컨테이너 로그 확인

```bash
docker logs -f node-run
```

---

## 컨테이너 수정 및 재시작

```bash
docker cp runapp.js node-run:/app/runapp.js
docker restart node-run
```

---

## 컨테이너 내부 접속

```bash
docker exec -it mynginx /bin/sh
```

---

## 이미지 및 컨테이너 정리

```bash
docker stop [container]
docker rm [container]
docker images
docker image rm [image]
```

> 💡 불필요한 이미지나 컨테이너는 주기적으로 정리하여 시스템 리소스 확보!!.
