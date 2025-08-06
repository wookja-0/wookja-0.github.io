---
title: "[K8s] Helm을 이용한 Ingress-NGINX 사용 해보기"
date: 2025-08-06 00:00:00 +0900
categories: ['Kubernetes']
tags: ['helm', 'ingress-nginx', 'kubernetes']
description: "Helm Chart로 Ingress-NGINX를 설치하고 경로기반 라우팅을 구성 해보자."
image: assets/images/2025-08-06/nginx-ingress-1.png
---

안녕하세요. 이번 포스팅에서는 Kubernetes 환경에서 Helm을 활용해 Ingress-NGINX를 설치하고, 실제로 간단한 서비스 라우팅을 실습하는 방법을 정리 해보려합니다.

---
## 1. Ingress-NGINX란?


![nginx-ingress](assets/images/2025-08-06/nginx-ingress.png)

Ingress-NGINX는 Kubernetes에서 가장 널리 사용되는 Ingress Controller 중 하나로, 외부 트래픽을 클러스터 내부 서비스로 라우팅해주는 역할을 합니다.

> **L4/L7 역할 쉽게 이해하기**
> - L4(Transport Layer) 로드밸런서는 IP/Port 단위로 트래픽을 전달하는 역할만 합니다. 즉, "어떤 서버의 몇 번 포트로 보낼지"만 결정합니다.
> - L7(Application Layer, Ingress-NGINX 등)은 HTTP/HTTPS 경로, 호스트명, 헤더, 쿠키 등 애플리케이션 정보를 기반으로 트래픽을 세부적으로 분기합니다.
> - 브라우저에서 `/api`, `/web` 등 경로 기반으로 요청하면, L7에서 해당 경로에 맞는 서비스로 라우팅합니다. 즉, 경로·도메인별 분기는 L7에서 처리합니다.
> - 실무에서는 L4가 클러스터로 트래픽을 전달하고, L7이 서비스별로 분기하는 구조가 일반적입니다. 하지만 경로·도메인별 분기는 반드시 L7에서만 가능합니다.

Ingress-NGINX는 다양한 라우팅 규칙, TLS, 인증, 리다이렉트 등 웹 트래픽 제어에 필수적인 기능을 제공합니다.

- 공식 문서: [Ingress-NGINX](https://kubernetes.github.io/ingress-nginx/)

---
## 2. Helm Chart로 Ingress-NGINX 설치

![helm](assets/images/2025-08-06/helm.png)

Helm은 Kubernetes에서 애플리케이션을 쉽고 일관되게 배포·관리할 수 있도록 도와주는 패키지 매니저입니다. 복잡한 리소스(Deployment, Service, ConfigMap 등)를 하나의 Chart로 묶어버릴 수 있어, 반복적인 배포나 환경별 설정 관리에 매우 유용합니다.

Helm Chart는 템플릿 기반으로 동작하며, values.yaml 파일을 통해 다양한 옵션을 손쉽게 커스터마이징할 수 있습니다. Ingress-NGINX 역시 Helm Chart로 설치하면, 서비스 타입(NodePort, LoadBalancer 등), 리소스 옵션, 컨트롤러 설정 등을 명령어 한 줄로 관리할 수 있습니다.

### 2-1. Helm 설치

```bash
curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
```


### 2-2. Helm 저장소 추가 및 업데이트
```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
```


### 2-3. Ingress-NGINX Chart(NodePort) 설치
NodePort로 설치하면 클러스터 외부에서 직접 Ingress Controller에 접근할 수 있습니다.
```bash
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.service.type=NodePort \
  --set controller.service.nodePorts.http=30080 \
  --set controller.service.nodePorts.https=30443
```

설치가 완료되면 아래 명령어로 리소스 상태와 NodePort를 확인할 수 있습니다.
```bash
kubectl get svc -n ingress-nginx
```

---

## 3. 테스트용 서비스 및 Ingress Path 기반 라우팅 실습

실습을 위해 두 개의 echo 서버(echo1, echo2)와 Ingress 리소스를 배포하여, 경로(path)에 따라 서로 다른 서비스로 트래픽을 라우팅하는 예제를 진행합니다.


### 3-1. Echo 서버 2개 배포 (포트 설정 주의)
> **중요:** echo-server 이미지는 기본적으로 80번 포트에서 동작합니다. Service와 Deployment의 포트 설정이 실제 컨테이너 포트와 일치해야 정상적으로 라우팅됩니다. 만약 targetPort나 containerPort가 8080 등으로 잘못 지정되면, Ingress에서 502 Bad Gateway 에러가 발생할 수 있습니다.

`echo1.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: echo1-service
spec:
  selector:
    app: echo1
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: echo1-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: echo1
  template:
    metadata:
      labels:
        app: echo1
    spec:
      containers:
      - name: echo
        image: ealen/echo-server
        ports:
        - containerPort: 80
```

`echo2.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: echo2-service
spec:
  selector:
    app: echo2
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: echo2-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: echo2
  template:
    metadata:
      labels:
        app: echo2
    spec:
      containers:
      - name: echo
        image: ealen/echo-server
        ports:
        - containerPort: 80
```

적용:
```bash
kubectl apply -f echo1.yaml
kubectl apply -f echo2.yaml
```

> **실제 포트 확인 방법:**
> Pod 로그에서 `Listening on port 80.` 메시지가 보이면, echo-server가 80번 포트에서 동작 중임을 의미합니다. Service와 Deployment의 포트 설정이 반드시 80으로 맞춰져야 합니다.

### 3-2. Ingress 리소스 생성 (Path 기반 라우팅)
`echo-ingress.yaml`:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: echo-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - http:
      paths:
      - path: /echo1
        pathType: Prefix
        backend:
          service:
            name: echo1-service
            port:
              number: 80
      - path: /echo2
        pathType: Prefix
        backend:
          service:
            name: echo2-service
            port:
              number: 80
```

적용:
```bash
kubectl apply -f echo-ingress.yaml
```

---
## 4. 테스트 및 확인

### 4-1. Ingress Controller NodePort 확인
```bash
kubectl get svc -n ingress-nginx
```
`ingress-nginx-controller`의 `PORT(S)` 항목에서 `30080:NodePort`를 확인합니다.

### 4-2. 접속 테스트 (curl)

Ingress-NGINX Controller가 배포된 노드의 IP를 확인한 뒤, 아래와 같이 curl 명령어로 각각의 서비스에 접근합니다.

```bash
kubectl get po -n ingress-nginx -o wide
kubectl get no -o wide | grep <노드명>
```

예시:
```
ingress-nginx-controller-6874c77fbb-qlkrp   1/1   Running   10.244.2.69   dev-k8s-worker01
dev-k8s-worker01   Ready    <none>   ...   10.0.0.11   ...
```

이제 해당 노드의 IP(예: 10.0.0.11)와 NodePort(30080)를 사용해 서비스에 접근합니다.

```bash
# echo1 서비스로 라우팅
curl http://10.0.0.11:30080/echo1

# echo2 서비스로 라우팅
curl http://10.0.0.11:30080/echo2
```

> **실제 결과에서 확인할 포인트**
> - `environment.HOSTNAME` 값이 각각 echo1/echo2 Pod의 이름으로 다르게 나오는지 확인. (예: `echo1-deployment-xxxx`, `echo2-deployment-xxxx`)
> - 요청 경로(`/echo1`, `/echo2`)에 따라 응답이 다르게 오면, Ingress 경로 기반 라우팅이 정상적으로 동작하는 것입니다.
> - 기타 헤더(`x-forwarded-for`, `host` 등)도 정상적으로 전달되는지 참고.


---

### 4-3. 접속 테스트 (브라우저 및 응답 예시)

외부 브라우저에서 클러스터 노드의 **Public IP**와 NodePort를 입력해 직접 접속할 수 있습니다.

예시 (Public IP가 `192.168.0.162`인 경우):

브라우저 주소창에 아래와 같이 입력합니다.

```
http://192.168.0.162:30080/echo1
```

접속하면 echo1 서버의 응답을 확인할 수 있습니다.

![echo1](assets/images/2025-08-06/echo1.png)

또는

```
http://192.168.0.162:30080/echo2
```

접속하면 echo2 서버의 응답을 확인할 수 있습니다.

![echo2](assets/images/2025-08-06/echo2.png)


응답 예시 (echo2):

```json
{
    "host": { "hostname": "192.168.0.162" },
    "environment": { "HOSTNAME": "echo2-deployment-xxxx" }
}
```

브라우저에서도 `http://192.168.0.162:30080/echo1` 또는 `http://192.168.0.162:30080/echo2`로 접속하면 각각의 echo 서버 응답을 확인할 수 있습니다.


---
## 5. 마무리 및 참고

Helm Chart를 활용하면 Ingress-NGINX 설치와 관리가 매우 간편해집니다. 다양한 Ingress 규칙, TLS, 인증 등 고급 기능은 공식 문서를 참고 부탁드립니다.

- [Helm 공식 문서](https://helm.sh/docs/)
- [Ingress-NGINX 공식 문서](https://kubernetes.github.io/ingress-nginx/)
- [Ingress 리소스 가이드](https://kubernetes.io/ko/docs/concepts/services-networking/ingress/)

---
