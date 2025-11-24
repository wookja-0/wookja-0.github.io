---
title: "[K8s] Naver MCP (Search) Server를 Kubernetes에 배포해보자"
date: 2025-11-24 00:00:00 +0900
categories: ['Kubernetes', 'MCP']
tags: ['kubernetes', 'mcp', 'naver-api', 'sse', 'deployment']
description: "Naver Search MCP Server를 Kubernetes 클러스터에 배포하고, LangChain 등 MCP 클라이언트와 연동하는 방법을 정리해보자."
---

안녕하세요. 이번 포스팅에서는 Naver Search MCP Server를 Kubernetes 환경에 배포하는 방법을 정리해보려 합니다.

Naver Search MCP Server는 Naver 검색 및 DataLab Open API를 MCP(Server-Sent Events) 프로토콜로 중계하는 서비스로, LangChain 등 MCP 클라이언트가 Naver 검색 API와 실시간으로 통신할 수 있도록 도와줍니다.

---

## 배경 및 동기

PoC 프로젝트에서 온톨로지 기반 AI 서비스를 구축하는 과정에서, 초기에는 [Smithery](https://smithery.ai/server/@isnow890/naver-search-mcp)에서 제공하는 Naver Search MCP Server를 사용했습니다.

![아키텍처](/assets/images/2025-11-24/arch.png)

하지만 Smithery의 공용 서버를 여러 사용자가 함께 사용하다 보니, 백엔드 클라이언트에서 Naver MCP Server로 요청 시 **502 Bad Gateway 에러가 빈번하게 발생**하는 문제가 있었습니다. 이는 공용 API의 부하와 리소스 경합 때문으로 보였으며, 안정적인 서비스 운영을 위해서는 자체 인프라 구축이 필요하다고 판단했습니다.

또한 백엔드 클라이언트에서 **SSE(Server-Sent Events) 방식으로 통신**이 필요했기 때문에, 원본 코드를 기반으로 SSE 통신을 지원하도록 수정한 버전을 사용하게 되었습니다.

---

## MCP란?

**MCP(Model Context Protocol)**는 AI 애플리케이션이 외부 데이터 소스, 도구, 서비스와 상호작용할 수 있도록 하는 오픈 프로토콜입니다. MCP를 통해 AI 모델은 실시간으로 검색, 데이터베이스 조회, API 호출 등의 작업을 수행할 수 있습니다.

![MCP 아키텍처](/assets/images/2025-11-24/mcp.png)

주요 특징:
- **표준화된 프로토콜**: 다양한 AI 클라이언트와 서버 간의 일관된 통신 방식 제공
- **도구 확장성**: 외부 API, 데이터베이스, 파일 시스템 등 다양한 리소스에 접근 가능
- **실시간 통신**: SSE(Server-Sent Events) 또는 WebSocket을 통한 양방향 통신 지원
- **언어 독립적**: 다양한 프로그래밍 언어로 MCP 서버와 클라이언트 구현 가능

MCP 서버는 특정 기능(예: 검색, 데이터 분석, 파일 조작 등)을 제공하고, MCP 클라이언트(LangChain, Claude Desktop 등)는 이 서버들과 통신하여 AI 모델의 기능을 확장합니다.

> **참고:** MCP에 대한 자세한 내용은 [Model Context Protocol 공식 웹사이트](https://modelcontextprotocol.io/)에서 확인할 수 있습니다.

---

## Naver MCP Server란?
![Naver Search MCP](/assets/images/2025-11-24/naver-search.png)

**Naver Search MCP Server**는 Naver 검색 및 DataLab Open API를 MCP(Server-Sent Events) 프로토콜로 중계하는 단일 컨테이너 서비스입니다. 하나의 Dockerfile로 빌드 및 실행할 수 있으며, `NAVER_API_BASE_URL` 환경 변수만으로 Naver API 또는 프록시를 지정할 수 있습니다.

주요 특징:
- SSE(Server-Sent Events) 통신을 위한 `mcp-proxy` 사용
- 단일 컨테이너로 간단한 배포
- 프록시 서버 지원 (선택적)
- Kubernetes 환경에서 ConfigMap과 Secret을 통한 설정 관리

> **원본 저장소:** [isnow890/naver-search-mcp](https://github.com/isnow890/naver-search-mcp)  
> **SSE 수정 버전:** [wookja-0/naver-mcp-server](https://github.com/wookja-0/naver-mcp-server)  
> 원본 코드를 기반으로 백엔드 클라이언트의 SSE 통신 요구사항에 맞게 수정한 버전입니다.  
> 원본 소스코드에서는 [Naver Open API](https://openapi.naver.com) 엔드포인트(`https://openapi.naver.com`)로 직접 요청을 보내고 있습니다.

---

## 환경 변수 설정

Naver MCP Server를 배포하기 전에 필요한 환경 변수를 확인하겠습니다.

| 변수명                   | 필수 여부  | 기본값                       | 설명                            |
| --------------------- | ------ | ------------------------- | ----------------------------- |
| NAVER\_API\_BASE\_URL | 선택     | https://openapi.naver.com | Naver API 기본 URL 또는 프록시 주소    |
| NAVER\_API\_KEY       | **필수** | \-                        | Naver API 인증 키                |
| NAVER\_CLIENT\_ID     | **필수** | \-                        | Naver API Client ID           |
| NAVER\_CLIENT\_SECRET | **필수** | \-                        | Naver API Client Secret       |
| NAVER\_PROFILE        | 선택     | \-                        | 서비스 또는 배포 환경을 식별하는 고유 프로파일 ID |
| BRIDGE\_PORT          | 선택     | 8080                      | 서버 포트                         |
| NODE\_ENV             | 선택     | production                | Node 환경 변수                    |

> **참고:** 앱 내부에서는 `NAVER_API_BASE_URL` 뒤에 `/v1/search`, `/v1/datalab` 경로가 자동으로 붙습니다. 후행 `/`는 자동 제거됩니다.

---

## 소스코드 Clone

SSE 통신을 지원하는 수정 버전의 Naver MCP Server 저장소를 클론합니다.

```bash
git clone https://github.com/wookja-0/naver-mcp-server.git
cd naver-mcp-server
```

> **참고:** 이 저장소는 원본 [isnow890/naver-search-mcp](https://github.com/isnow890/naver-search-mcp)를 기반으로 백엔드 클라이언트의 SSE 통신 요구사항에 맞게 수정한 버전입니다.

---

## Docker 이미지 빌드

Kubernetes에 배포하기 전에 Docker 이미지를 빌드합니다.

```bash
docker build -t <registry>/<repo>/naver-mcp:sse .
```

예시:
```bash
docker build -t harbor.example.com/library/naver-mcp:sse .
```

빌드가 완료되면 이미지 레지스트리에 푸시합니다.

```bash
docker push <registry>/<repo>/naver-mcp:sse
```

---

## Kubernetes 리소스 배포

Kubernetes에 배포하기 위해 ConfigMap, Secret, Deployment를 생성합니다.

### 1. ConfigMap 생성

프록시를 사용하는 경우 `NAVER_API_BASE_URL`을 설정하고, 사용하지 않는 경우 해당 항목을 제외합니다.

```yaml
# naver-mcp-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: naver-mcp-config
data:
  NAVER_API_BASE_URL: "http://<proxy-host>:<port>/naver"  # 프록시 서버 사용 시 추가, 미사용 시 제외
  BRIDGE_PORT: "8080"
  NODE_ENV: "production"
```

### 2. Secret 생성

Naver API 인증 정보는 Secret으로 관리합니다.

#### Naver API 키 발급
Naver API 키는 [Naver Developers](https://developers.naver.com/apps/#/list)에서 발급받을 수 있습니다.
![Naver Developers](/assets/images/2025-11-24/naver-developers.png)
1. [Naver Developers](https://developers.naver.com/apps/#/list)에 접속하여 로그인합니다.
2. "애플리케이션 등록"을 클릭하여 새 애플리케이션을 생성합니다.
3. 필요한 API 서비스를 선택합니다 (검색 API, DataLab API 등).
4. 애플리케이션 등록 후 **Client ID**와 **Client Secret**을 확인합니다.
5. 발급받은 정보를 Secret에 등록합니다.

```yaml
# naver-mcp-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: naver-mcp-secret
type: Opaque
stringData:
  NAVER_API_KEY: "<your-api-key>"
  NAVER_CLIENT_ID: "<your-client-id>"
  NAVER_CLIENT_SECRET: "<your-client-secret>"
```

> **보안 주의:** 실제 운영 환경에서는 Secret을 직접 YAML 파일에 작성하지 말고, `kubectl create secret` 명령어를 사용하거나 Sealed Secrets, External Secrets Operator 등을 활용하는 것을 권장합니다.

### 3. Deployment 생성

Deployment 리소스를 생성하여 Naver MCP Server를 배포합니다.

```yaml
# naver-mcp-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: naver-mcp-server
  labels:
    app: naver-mcp-server
spec:
  replicas: 1
  selector:
    matchLabels:
      app: naver-mcp-server
  template:
    metadata:
      labels:
        app: naver-mcp-server
    spec:
      containers:
        - name: naver-mcp-server
          image: <registry>/<repo>/naver-mcp:sse
          imagePullPolicy: IfNotPresent
          envFrom:
            - secretRef:
                name: naver-mcp-secret
            - configMapRef:
                name: naver-mcp-config
          env:
            - name: LOG_DIR
              value: "/var/log/naver-mcp"
          ports:
            - name: http
              containerPort: 8080
          volumeMounts:
            - name: logs
              mountPath: /var/log/naver-mcp
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
      volumes:
        - name: logs
          persistentVolumeClaim:
            claimName: naver-mcp-logs
```

### 4. Service 생성

Service 리소스를 생성하여 Pod에 접근할 수 있도록 합니다.

```yaml
# naver-mcp-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: naver-mcp-service
  labels:
    app: naver-mcp-server
spec:
  type: ClusterIP
  ports:
    - port: 8080
      targetPort: 8080
      protocol: TCP
      name: http
  selector:
    app: naver-mcp-server
```

### 5. PersistentVolumeClaim 생성 (선택)

로그를 영구 저장하려면 PVC를 생성합니다.

```yaml
# naver-mcp-pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: naver-mcp-logs
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: nfs-storage  # 환경에 맞는 StorageClass로 변경
```

---

## 배포 및 확인

### 리소스 배포

위에서 생성한 YAML 파일들을 적용합니다.

```bash
kubectl apply -f naver-mcp-configmap.yaml
kubectl apply -f naver-mcp-secret.yaml
kubectl apply -f naver-mcp-pvc.yaml
kubectl apply -f naver-mcp-deployment.yaml
kubectl apply -f naver-mcp-service.yaml
```

### 배포 상태 확인

```bash
# Deployment 상태 확인
kubectl get deployment naver-mcp-server

# Pod 상태 확인
kubectl get pods -l app=naver-mcp-server

# Service 확인
kubectl get svc naver-mcp-service

# Pod 로그 확인
kubectl logs -l app=naver-mcp-server --tail=50
```

---

### 정상 배포 확인

정상적으로 배포가 되었다면, 클라이언트에서 요청을 보낼 때 아래 로그 예시처럼 확인하실 수 있습니다.

![Kibana 로그 대시보드](/assets/images/2025-11-24/kibana.png)

로그에서 확인할 수 있는 주요 내용:
- **SSE 연결 성공**: `GET /sse HTTP/1.1" 200 OK` - Server-Sent Events 연결이 정상적으로 이루어지고 있음을 확인
- **요청 처리**: `POST /messages/?session_id=... HTTP/1.1" 202 Accepted` - 메시지 요청이 정상적으로 처리되고 있음
- **도구 목록 조회**: `Processing request of type ListToolsRequest` - MCP 도구 목록 조회 요청 처리

> **참고:** 위 이미지는 EFK Stack을 통해 수집된 로그를 시각화한 예시입니다. 

---

## 프록시 서버 설정 (선택)

외부 프록시 서버를 사용하는 경우, NGINX 설정 예시는 다음과 같습니다.

```nginx
# Naver API (MCP 용)
location /naver/ {
    proxy_pass https://openapi.naver.com/;
    proxy_set_header Host openapi.naver.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_ssl_verify off;
    proxy_ssl_server_name on;
    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;

    # SSL 설정 추가
    proxy_ssl_protocols TLSv1.2 TLSv1.3;
    proxy_ssl_ciphers HIGH:!aNULL:!MD5;
}
```

ConfigMap에서 `NAVER_API_BASE_URL`을 프록시 주소로 설정합니다.

```yaml
NAVER_API_BASE_URL: "http://<proxy-host>:<port>/naver"
```

### 폐쇄망 환경에서 Squid 프록시 사용

저의 경우 운영 환경의 Kubernetes 클러스터가 인터넷에 직접 접근할 수 없는 폐쇄망이어서, DMZ 영역에 배포된 Squid(Forward Proxy) 프록시 서버를 통해 외부 통신을 하게끔 구성하였습니다.

#### Squid 프록시란?

**Squid**는 HTTP, HTTPS, FTP 등 다양한 프로토콜을 지원하는 오픈소스 프록시 서버입니다. Forward Proxy로 사용할 경우, 클라이언트의 요청을 대신 전달하여 외부 네트워크에 접근할 수 있게 해줍니다.

**Squid의 주요 특징:**

- **Forward Proxy**: 클라이언트의 요청을 외부 서버로 전달하는 역할을 수행합니다. 폐쇄망 환경에서 내부 클라이언트가 인터넷에 접근할 수 있도록 중계합니다.
- **캐싱 기능**: 자주 요청되는 리소스를 캐시하여 네트워크 트래픽을 감소시키고 응답 속도를 향상시킵니다.
- **접근 제어**: 특정 도메인, IP, 포트에 대한 접근 제어가 가능하여 보안 정책을 적용할 수 있습니다.
- **로깅 및 모니터링**: 프록시를 통과하는 모든 트래픽에 대한 로그를 수집하여 네트워크 사용 현황을 모니터링할 수 있습니다.
- **SSL/TLS 지원**: HTTPS 트래픽도 프록시할 수 있어 보안 통신을 지원합니다.

**폐쇄망 환경에서의 활용:**

폐쇄망 환경에서는 Squid를 DMZ 영역에 배포하여, 내부 Kubernetes 클러스터의 Pod들이 Squid를 통해 외부 API(Naver API 등)에 접근할 수 있도록 구성합니다. 이렇게 하면:

1. 내부 클러스터는 인터넷에 직접 접근하지 않고 Squid를 통해서만 외부 통신
2. DMZ 영역의 Squid만 인터넷에 접근 가능하도록 네트워크 정책 구성
3. 중앙 집중식 프록시 관리를 통해 보안 정책 일원화

이러한 구성으로 폐쇄망 환경에서도 안전하게 외부 API를 활용할 수 있습니다.

> **참고:** Squid에 대한 자세한 내용은 [Squid 공식 웹사이트](https://www.squid-cache.org/)에서 확인할 수 있습니다.

#### 1. Squid 프록시 서버 배포 (DMZ 영역)

DMZ 영역에 Squid 프록시 서버를 배포합니다. 여기서는 Kubernetes 환경이 아닌 단일 Docker 컨테이너로 배포하는 방식을 사용했습니다.

```bash
# Squid 프록시 서버 실행 예시
docker run -d \
  --name squid-proxy \
  -p 3128:3128 \
  ubuntu/squid:latest
```

> **참고:** 실제 운영 환경에서는 Squid 설정 파일을 마운트하여 세부 설정을 구성할 수 있습니다.

#### 2. Deployment Manifest에 프록시 환경 변수 추가

Naver MCP Server의 Deployment에 Squid 프록시 호스트를 환경 변수로 등록합니다.

```yaml
# naver-mcp-deployment.yaml (프록시 설정 추가)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: naver-mcp-server
  labels:
    app: naver-mcp-server
spec:
  replicas: 1
  selector:
    matchLabels:
      app: naver-mcp-server
  template:
    metadata:
      labels:
        app: naver-mcp-server
    spec:
      containers:
        - name: naver-mcp-server
          image: <registry>/<repo>/naver-mcp:sse
          imagePullPolicy: IfNotPresent
          envFrom:
            - secretRef:
                name: naver-mcp-secret
            - configMapRef:
                name: naver-mcp-config
          env:
            - name: LOG_DIR
              value: "/var/log/naver-mcp"
            # Squid 프록시 설정 (폐쇄망 환경)
            - name: HTTP_PROXY
              value: "http://<DMZ-Squid-IP>:<PORT>"  # 예: http://192.168.1.100:3128
            - name: HTTPS_PROXY
              value: "http://<DMZ-Squid-IP>:<PORT>"  # 예: http://192.168.1.100:3128
            - name: NO_PROXY
              value: "localhost,127.0.0.1,.svc.cluster.local"
          ports:
            - name: http
              containerPort: 8080
          # ... 나머지 설정 동일
```

> **참고:** 
> - `HTTP_PROXY`, `HTTPS_PROXY`: DMZ 영역에 배포된 Squid 프록시 서버의 IP 주소와 포트를 지정합니다.
> - `NO_PROXY`: 프록시를 거치지 않을 내부 주소를 지정합니다 (클러스터 내부 통신 등).
> - DMZ 영역의 Squid 프록시 서버는 Kubernetes 클러스터 외부에 배포되므로, IP 주소와 포트를 직접 지정합니다.

이렇게 설정하면 폐쇄망 환경에서도 Squid 프록시를 통해 Naver API에 접근할 수 있습니다.

---

## 클라이언트 연결 예시

LangChain 등 MCP 클라이언트에서 Naver MCP Server에 연결하는 예시입니다.

### Python (LangChain)

```python
from langchain_mcp_adapters.client import MultiServerMCPClient

mcp_client = MultiServerMCPClient(
    {
        "naver-search-mcp": {
            "transport": "sse",
            "url": "http://naver-mcp-service:8080/sse"  # ClusterIP 사용 시
        }
    }
)
```

---

### NodePort로 노출한 경우

Service를 NodePort 타입으로 변경하면 클러스터 외부에서도 접근할 수 있습니다.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: naver-mcp-service
spec:
  type: NodePort
  ports:
    - port: 8080
      targetPort: 8080
      nodePort: 30080
  selector:
    app: naver-mcp-server
```

워커 노드 IP와 NodePort를 사용하여 접근합니다.

```python
mcp_client = MultiServerMCPClient(
    {
        "naver-search-mcp": {
            "transport": "sse",
            "url": "http://<worker-node-ip>:30080/sse"
        }
    }
)
```
---

## 마무리

Naver Search MCP Server를 Kubernetes에 배포하는 방법을 정리해보았습니다. ConfigMap과 Secret을 활용하여 설정을 관리하고, Deployment와 Service를 통해 안정적으로 서비스를 운영할 수 있습니다.

Smithery의 공용 API를 사용하시다가 502 에러가 발생하신 분들은, 이 가이드를 참고하여 자체 Naver MCP Server를 구축해보시는 것을 추천드립니다. 

---

## 참고

- [Model Context Protocol 공식 웹사이트](https://modelcontextprotocol.io/)
- [Naver MCP Server (SSE 수정 버전) GitHub 저장소](https://github.com/wookja-0/naver-mcp-server)
- [원본 Naver Search MCP Server GitHub 저장소](https://github.com/isnow890/naver-search-mcp)
- [Smithery Naver Search MCP Server](https://smithery.ai/server/@isnow890/naver-search-mcp)
- [Squid 공식 웹사이트](https://www.squid-cache.org/)
- [Kubernetes 공식 문서](https://kubernetes.io/ko/docs/)
- [LangChain MCP Adapters](https://github.com/langchain-ai/langchain-mcp-adapters)