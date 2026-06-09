---
title: "[K8s] Argo Rollouts로 Canary/Blue-Green 배포해보기"
date: 2026-06-08 00:00:00 +0900
categories: ['Kubernetes', 'DevOps']
tags: ['kubernetes', 'argo-rollouts', 'canary', 'blue-green', 'istio', 'progressive-delivery']
description: "Argo Rollouts를 사용해 Bookinfo 환경에서 Canary 배포와 Blue/Green 배포를 직접 해보고, 자동 분석·롤백·승격까지 동작을 관찰한 내용을 정리합니다."
image: assets/images/2026-06-08/thumbnail.webp
---

이번 글에서는 **Argo Rollouts**를 사용해 Kubernetes 환경에서 **Canary 배포**와 **Blue/Green 배포**를 직접 해본 내용을 정리해보려 합니다. 기존 Deployment의 RollingUpdate만으로는 표현하기 어려운 "점진적 트래픽 이동", "메트릭 기반 자동 롤백", "전환 전 사전 검증" 같은 시나리오를 Argo Rollouts가 어떻게 풀어내는지 실제로 돌려보며 관찰했습니다.

> 이번 글은 **사전 구성해둔 리소스** 위에서 진행했습니다. **사내 베어메탈 Kubernetes 클러스터**에 Istio가 설치되어 있고(`istio-system`), Bookinfo 샘플이 배포되어 있으며(`istio-lab`), Prometheus가 메트릭을 수집하고 있는 상태를 전제로 합니다. 이 환경 구성 자체는 글의 범위를 벗어나므로, 본문은 Argo Rollouts 부분에 집중하겠습니다. 접속 주소의 IP는 `<노드IP>`로 표기합니다.

처음부터 새 애플리케이션을 만드는 대신, **이미 `istio-lab` 네임스페이스에 Bookinfo 매니페스트로 배포되어 있던 리소스를 그대로 활용**해서 진행했습니다. Bookinfo는 Istio가 데모용으로 제공하는 샘플 애플리케이션으로, `productpage` / `details` / `ratings` / `reviews` 네 개의 마이크로서비스로 구성됩니다. 그중 `reviews`는 v1(별점 없음) · v2(검은 별점) · v3(빨간 별점)로 버전이 나뉘어 있어, 배포 전략 실습에 딱 맞는 예제입니다.

- 샘플 위치: [istio/istio · samples/bookinfo](https://github.com/istio/istio/tree/master/samples/bookinfo)
- 배포 매니페스트: [bookinfo.yaml](https://github.com/istio/istio/blob/master/samples/bookinfo/platform/kube/bookinfo.yaml)

```bash
# Bookinfo 샘플 배포 (이미 적용되어 있던 매니페스트 — 참고용)
kubectl apply -n istio-lab \
  -f https://raw.githubusercontent.com/istio/istio/master/samples/bookinfo/platform/kube/bookinfo.yaml
```

배포 시작 시점의 `istio-lab` 네임스페이스 상태는 다음과 같습니다. 각 구성요소가 모두 `2/2`(애플리케이션 + Istio 사이드카)로 떠 있고, 이 위에서 `reviews`만 배포 전략을 바꿔가며 실습을 진행했습니다.

![istio-lab 네임스페이스 Pod 현황](/assets/images/2026-06-08/lab-pods.webp)

또한 `productpage`는 브라우저로 결과를 바로 확인할 수 있도록 **NodePort 타입 Service로 노출**해, 클러스터 외부에서 `http://<노드IP>:<NodePort>/productpage`로 접속할 수 있게 초기 구성해 두었습니다. 이후 배포 단계마다 이 페이지를 새로고침하며 reviews 버전(별점) 변화를 확인합니다.

> 이 글의 본문은 이 Bookinfo 리소스 중 **`reviews` 워크로드 하나를 Argo Rollouts로 전환**하는 과정에 집중합니다. 나머지 구성요소는 그대로 두고 진행합니다.

---

## 1. Argo Rollouts란?

![Argo Rollouts](/assets/images/2026-06-08/argo-rollouts-logo.png){: width="240" }
_Argo Rollouts 로고 (출처: [argoproj/argo-rollouts](https://github.com/argoproj/argo-rollouts))_

[Argo Rollouts](https://argoproj.github.io/rollouts/)는 Kubernetes에서 **점진적 배포(Progressive Delivery)**를 지원하는 컨트롤러입니다. 기본 `Deployment` 리소스를 `Rollout`이라는 커스텀 리소스로 대체하여, Canary나 Blue/Green 같은 고급 배포 전략을 선언적으로 사용할 수 있게 해줍니다.

기존 Deployment의 `RollingUpdate`는 단순히 Pod를 순차적으로 교체할 뿐, "트래픽의 10%만 새 버전으로 보내고 메트릭을 확인한 뒤 점점 늘린다" 같은 제어는 불가능합니다. Argo Rollouts는 여기에 더해 다음을 제공합니다.

### Deployment vs Rollout

| | Deployment | Rollout |
|---|---|---|
| 배포 방식 | RollingUpdate (전체 교체) | Canary / Blue-Green |
| 트래픽 가중치 제어 | 불가 | 가능 (Istio VirtualService 자동 조작) |
| 자동 분석 | 없음 | AnalysisTemplate (Prometheus 등) |
| 자동 rollback | 없음 | 분석 실패 시 자동 |
| 조회 명령 | `kubectl get deploy` | `kubectl argo rollouts get rollout` |

### 수동 vs 자동 비교

Argo Rollouts 없이 Istio만으로 Canary를 하려면, VirtualService의 weight를 **수동으로** 바꿔가며 진행해야 합니다. 단계마다 직접 yaml을 apply하고 확인하는 방식이죠.

```
[수동 방식]
개발자가 직접:
  kubectl apply vs-reviews-canary-20.yaml   # 80/20
  (확인)
  kubectl apply vs-reviews-canary-50.yaml   # 50/50
  (확인)
  kubectl apply vs-reviews-v3-only.yaml     # 100%
  (문제 시) kubectl apply vs-reviews-v1-only.yaml  # rollback

[자동 - Argo Rollouts]
개발자는 이미지만 변경 → 나머지는 Rollouts가 알아서:
  10% → (메트릭 확인) → 30% → (메트릭 확인) → 60% → 100%
  어느 단계에서든 에러율 높으면 → 자동 rollback
```

이번 글의 핵심은 이 "**개발자는 이미지만 바꾸고, 나머지는 Rollouts가 알아서**" 흐름을 직접 확인하는 것입니다.

---

## 2. Argo Rollouts 설치

### 2-1. Controller 설치

```bash
kubectl create namespace argo-rollouts
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
```

설치 확인:

```bash
kubectl get pods -n argo-rollouts
```

```
NAME                            READY   STATUS    RESTARTS   AGE
argo-rollouts-xxxxxxxxx-xxxxx   1/1     Running   0          30s
```

![Controller 설치](/assets/images/2026-06-08/controller-install.webp)

### 2-2. kubectl 플러그인 설치

Rollout 상태를 터미널에서 실시간으로 확인하는 데 사용합니다.

```bash
# Linux AMD64 기준
curl -LO https://github.com/argoproj/argo-rollouts/releases/latest/download/kubectl-argo-rollouts-linux-amd64
chmod +x kubectl-argo-rollouts-linux-amd64
mv kubectl-argo-rollouts-linux-amd64 /usr/local/bin/kubectl-argo-rollouts

kubectl argo rollouts version
```

![플러그인 버전 확인](/assets/images/2026-06-08/plugin-version.webp)

### 2-3. Dashboard 설치

웹 UI로 Canary 진행률, stable/canary Pod, 분석 결과 등을 시각적으로 확인할 수 있습니다.

`rollouts-dashboard.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: argo-rollouts-dashboard
  namespace: argo-rollouts
  labels:
    app: argo-rollouts-dashboard
spec:
  replicas: 1
  selector:
    matchLabels:
      app: argo-rollouts-dashboard
  template:
    metadata:
      labels:
        app: argo-rollouts-dashboard
    spec:
      containers:
        - name: dashboard
          image: quay.io/argoproj/kubectl-argo-rollouts:latest
          args: ["dashboard", "--port", "3100"]
          ports:
            - containerPort: 3100
---
apiVersion: v1
kind: Service
metadata:
  name: argo-rollouts-dashboard
  namespace: argo-rollouts
spec:
  type: NodePort
  selector:
    app: argo-rollouts-dashboard
  ports:
    - port: 3100
      targetPort: 3100
      nodePort: 32140
```

```bash
kubectl apply -f rollouts-dashboard.yaml
```

### 2-4. Dashboard RBAC 설정

여기서 한 가지 함정이 있었습니다. `install.yaml`은 **Controller의 RBAC만** 포함하고 Dashboard용 RBAC은 포함하지 않습니다. 그래서 이 설정 없이 대시보드에 접속하면 `Error fetching rollouts` 에러가 뜹니다.

Dashboard Pod가 사용하는 `default` ServiceAccount에 Rollout / Pod / ReplicaSet 조회 권한을 부여합니다.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: argo-rollouts-dashboard
rules:
  - apiGroups: ["argoproj.io"]
    resources: ["rollouts", "rollouts/status", "analysisruns", "analysistemplates", "experiments"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["pods", "services", "endpoints"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["replicasets", "deployments"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: argo-rollouts-dashboard
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: argo-rollouts-dashboard
subjects:
  - kind: ServiceAccount
    name: default
    namespace: argo-rollouts
```

```bash
kubectl apply -f rollouts-dashboard-rbac.yaml

# Dashboard Pod 재시작 (RBAC 반영)
kubectl rollout restart deploy argo-rollouts-dashboard -n argo-rollouts
```

### 2-5. Dashboard 확인

```bash
kubectl get pods -n argo-rollouts
kubectl get svc -n argo-rollouts argo-rollouts-dashboard
```

이제 `http://<노드IP>:32140` 으로 접속하면 대시보드를 볼 수 있습니다.

![Argo Rollouts Dashboard](/assets/images/2026-06-08/dashboard.webp)

> 아직 Rollout 리소스를 만들기 전이라면 **빈 화면이 정상**입니다. 뒤에서 Rollout을 생성하면 그때부터 표시됩니다.

---

## 3. Canary 배포해보기

먼저 Canary 전략부터 해봤습니다. Argo Rollouts는 기존 Deployment 대신 Rollout 리소스를 사용하므로, Bookinfo의 reviews Deployment와 reviews에 걸린 VirtualService / DestinationRule을 먼저 정리하고 시작합니다.

```bash
# 기존 reviews 관련 리소스 정리
kubectl delete vs reviews -n istio-lab
kubectl delete dr reviews -n istio-lab
kubectl delete deploy reviews-v1 reviews-v2 reviews-v3 -n istio-lab
```

> productpage · details · ratings는 그대로 두고 **reviews만 Rollout으로 교체**합니다. 나머지 세 컴포넌트는 도입부에서 적용한 Bookinfo 매니페스트로 이미 떠 있는 상태라 따로 배포할 필요가 없습니다.

### 3-1. DestinationRule (stable / canary)

Argo Rollouts는 stable(현재 버전)과 canary(새 버전) 두 개의 subset을 사용합니다.

```yaml
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  name: reviews
  namespace: istio-lab
spec:
  host: reviews
  subsets:
    - name: stable
      labels:
        app: reviews
    - name: canary
      labels:
        app: reviews
```

> 처음에는 stable/canary subset의 labels가 동일합니다. Argo Rollouts가 실행되면 자동으로 Pod에 `rollouts-pod-template-hash` 라벨을 추가하여 두 버전을 구분합니다.

### 3-2. VirtualService

Argo Rollouts가 weight를 자동으로 조절할 VirtualService입니다. 초기에는 stable 100%로 둡니다.

```yaml
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: reviews
  namespace: istio-lab
spec:
  hosts:
    - reviews
  http:
    - route:
        - destination:
            host: reviews
            subset: stable
          weight: 100
        - destination:
            host: reviews
            subset: canary
          weight: 0
```

### 3-3. AnalysisTemplate (자동 분석)

Canary 진행 중 Prometheus 메트릭을 주기적으로 조회하여 성공/실패를 판단하는 템플릿입니다. reviews 서비스의 성공률(5xx를 제외한 비율)이 95% 이상이면 통과, 3번 연속 실패하면 자동 rollback 합니다.

{% raw %}
```yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: istio-success-rate
  namespace: istio-lab
spec:
  args:
    - name: service-name
  metrics:
    - name: success-rate
      interval: 30s
      successCondition: result[0] >= 0.95   # 성공률 95% 이상이면 통과
      failureLimit: 3
      provider:
        prometheus:
          address: http://prom-stack-prometheus.monitoring:9090
          query: |
            sum(rate(
              istio_requests_total{
                destination_service=~"{{args.service-name}}",
                response_code!~"5.*"
              }[1m]
            ))
            /
            sum(rate(
              istio_requests_total{
                destination_service=~"{{args.service-name}}"
              }[1m]
            ))
```
{% endraw %}

### 3-4. Rollout 리소스

기존 Deployment를 대체하는 핵심 리소스입니다. `strategy.canary` 아래에 Istio 연동과 단계(steps)를 정의합니다.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: reviews
  namespace: istio-lab
spec:
  replicas: 3
  revisionHistoryLimit: 3
  selector:
    matchLabels:
      app: reviews
  template:
    metadata:
      labels:
        app: reviews
        version: stable
      annotations:
        sidecar.istio.io/inject: "true"
    spec:
      serviceAccountName: bookinfo-reviews
      containers:
        - name: reviews
          # 처음에는 v1 이미지로 시작 (별점 없음)
          image: docker.io/istio/examples-bookinfo-reviews-v1:1.20.2
          ports:
            - containerPort: 9080
  strategy:
    canary:
      trafficRouting:
        istio:
          virtualServices:
            - name: reviews
            # VirtualService의 route에 name이 없으므로 routes 필드는 생략
          destinationRule:
            name: reviews
            stableSubsetName: stable
            canarySubsetName: canary
      steps:
        - setWeight: 10
        - pause: { duration: 30s }
        - setWeight: 30
        - pause: { duration: 30s }
        - setWeight: 60
        - pause: { duration: 30s }
        # 마지막 100%는 자동
      analysis:
        templates:
          - templateName: istio-success-rate
        startingStep: 1       # 10% 이후부터 분석 시작
        args:
          - name: service-name
            value: reviews.istio-lab.svc.cluster.local
```

steps의 의미를 풀어보면 이렇습니다.

```
setWeight: 10  → canary weight 10%로 자동 변경
pause: 30s     → 30초 대기 (이 동안 analysis가 메트릭 확인)
setWeight: 30  → 통과하면 30%로 증가
pause: 30s
setWeight: 60  → 통과하면 60%로 증가
pause: 30s
(완료)         → 자동으로 100% 전환, canary가 stable로 승격
```

여기까지(3-4) 완료하면 상태는 이렇습니다.

- Rollout이 **v1 이미지로 최초 배포** → 이게 stable이 됩니다.
- VirtualService는 **stable 100% / canary 0%**.
- 아직 이미지를 변경하지 않았으므로 canary가 없고, **v1(별점 없음)으로만** 트래픽이 갑니다.

즉 이 시점에는 사용자 화면에 아무 변화가 없고, 다음 단계(3-5)에서 이미지를 v3로 바꾸는 순간부터 canary Pod가 생성되며 10% → 30% → 60% → 100% 자동 전환이 시작됩니다. 전체 흐름을 그림으로 정리하면 다음과 같습니다.

![Canary 배포 흐름](/assets/images/2026-06-08/canary-flow.svg)

배포 직후 productpage는 v1(별점 없음) 그대로입니다.

![productpage - v1 상태](/assets/images/2026-06-08/canary-initial-productpage.webp)

Argo Rollouts 대시보드에는 reviews Rollout이 stable 100%(v1)로 떠 있는 것이 보입니다.

![Argo Rollouts 대시보드 - stable 100%](/assets/images/2026-06-08/canary-initial-dashboard.webp)

Rollout을 클릭하면 steps(10/30/60%)와 현재 revision(stable, v1)을 상세히 볼 수 있습니다. 아직 이미지를 바꾸기 전이라 Step이 6/6 · Weight 100으로, 진행할 canary가 없는 상태입니다.

![Argo Rollouts 대시보드 - 상세](/assets/images/2026-06-08/canary-initial-dashboard-detail.webp)

Kiali에서도 reviews로 향하는 트래픽이 v1 한 갈래로만 흐르는 것을 확인할 수 있습니다.

![Kiali - v1 단일 트래픽](/assets/images/2026-06-08/canary-initial-kiali.webp)

### 3-5. Canary 실행 (v1 → v3)

이미지를 v3로 변경하면 Argo Rollouts가 자동으로 Canary를 시작합니다.

```bash
kubectl argo rollouts set image reviews -n istio-lab \
  reviews=docker.io/istio/examples-bookinfo-reviews-v3:1.20.2
```

터미널에서 Rollout 상태를 실시간으로 관찰합니다.

```bash
kubectl argo rollouts get rollout reviews -n istio-lab --watch
```

```
Name:            reviews
Namespace:       istio-lab
Status:          ◑ Progressing
Strategy:        Canary
  Step:          1/6
  SetWeight:     10
  ActualWeight:  10
Images:          docker.io/istio/examples-bookinfo-reviews-v1:1.20.2 (stable)
                 docker.io/istio/examples-bookinfo-reviews-v3:1.20.2 (canary)
```

약 2분에 걸쳐 다음과 같이 자동으로 진행됩니다.

```
[0:00]  canary weight 10% → v3 빨간 별점이 가끔 보임
        analysis 시작: Prometheus에서 성공률 조회
[0:30]  성공률 95% 이상 → 통과 → weight 30%
[1:00]  통과 → weight 60%
[1:30]  통과 → weight 100% → stable로 승격
[완료]  v3가 새로운 stable이 됨
```

![Canary 진행 상황 - kubectl argo rollouts watch](/assets/images/2026-06-08/canary-progress.webp)

Argo Rollouts 대시보드에서도 같은 진행 상황이 보입니다. Revision 2(v3)가 canary로 올라오고, 그 아래에서 AnalysisRun이 함께 동작하며 성공률을 검증하는 것을 확인할 수 있습니다.

![Argo Rollouts 대시보드 - canary 진행 + 분석](/assets/images/2026-06-08/canary-dashboard-progress.webp)

진행 중 실제로 브라우저에서 productpage를 반복 새로고침하면, 처음에는 가끔 v3(빨간 별점)이 섞여 나오다가 점점 비율이 늘어나는 것을 확인할 수 있습니다. 완료 후에는 항상 빨간 별점만 보입니다.

![productpage - v3 빨간 별점](/assets/images/2026-06-08/canary-v3-productpage.webp)

```bash
kubectl argo rollouts get rollout reviews -n istio-lab
```

```
Status:          ✔ Healthy
Images:          docker.io/istio/examples-bookinfo-reviews-v3:1.20.2 (stable)
```

### 3-6. 자동 Rollback 테스트

일부러 실패하는 배포를 해서 자동 rollback을 확인해봤습니다. 존재하지 않는 태그로 이미지를 변경합니다.

```bash
kubectl argo rollouts set image reviews -n istio-lab \
  reviews=docker.io/istio/examples-bookinfo-reviews-v1:99.99.99
```

```
[0:00]  canary Pod 생성 시도 → ImagePullBackOff
        canary weight 10% 설정됐지만 Pod가 Ready 아님
        analysis 시작 → 성공률 미달
[~1분]  failureLimit 도달 → 자동 rollback!
[완료]  stable (v3) 100%로 복원
```

```
Status:          ✖ Degraded
Message:         RolloutAborted: ... metric "success-rate" assessed Failed
```

브라우저는 여전히 빨간 별점(v3) 그대로 — 사용자에게는 영향이 가지 않은 채 자동으로 롤백된 것입니다. 자동 rollback 후 Rollout이 Degraded 상태로 남는데, 다음 명령으로 현재 버전을 유지한 채 정상 상태로 되돌립니다.

```bash
kubectl argo rollouts abort reviews -n istio-lab    # 현재 canary 중단
kubectl argo rollouts promote reviews -n istio-lab  # stable 승격 (현재 버전 유지)
```

> **TIP** — analysis가 `Inconclusive`로 나온다면 Prometheus에 메트릭이 아직 없는 경우(트래픽이 없어서)가 대부분입니다. 별도 터미널에서 productpage로 트래픽을 계속 흘려주면 됩니다.
> ```bash
> kubectl exec -n istio-lab deploy/ratings-v1 -c ratings -- \
>   bash -c 'while true; do curl -s -o /dev/null productpage:9080/productpage; sleep 1; done'
> ```

---

## 4. Blue/Green 배포해보기

Canary가 트래픽을 점진적으로 이동시킨다면, Blue/Green은 **새 버전을 전체 준비한 뒤 한번에 전환**하는 방식입니다.

```
[배포 전]
  reviews (activeService) → Blue Pod (v1) ← 모든 트래픽
  reviews-preview         → 없음

[새 버전 배포 시]
  reviews (activeService) → Blue Pod (v1) ← 여전히 라이브 트래픽
  reviews-preview         → Green Pod (v3) ← 내부 확인용 (preview)

[승격(promote) 시]
  reviews (activeService) → Green Pod (v3) ← 트래픽 전환!
  Blue Pod (v1)           → scaleDownDelay 후 자동 축소
```

![Blue/Green 배포 흐름](/assets/images/2026-06-08/bluegreen-flow.svg)

앞서 만든 Canary 리소스를 정리하고 시작합니다.

```bash
kubectl delete rollout reviews -n istio-lab
kubectl delete analysistemplate istio-success-rate -n istio-lab
kubectl delete vs reviews -n istio-lab
kubectl delete dr reviews -n istio-lab
```

### 4-1. Service 2개 (active + preview)

Blue/Green은 Service를 2개 사용합니다. `reviews`(active)는 실제 사용자 트래픽이 들어오는 Service, `reviews-preview`(preview)는 새 버전을 사전 확인하는 Service입니다. 기존 Bookinfo의 reviews Service는 그대로 있으므로 preview만 추가합니다.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: reviews-preview
  namespace: istio-lab
spec:
  selector:
    app: reviews
  ports:
    - port: 9080
      targetPort: 9080
```

### 4-2. 승격 전 검증 — prePromotionAnalysis 함정

처음에는 Canary 때처럼 승격 전에 성공률을 자동 검증하려고 `prePromotionAnalysis`(Blue/Green용 AnalysisTemplate)를 넣었습니다. 그런데 이미지를 바꾸자마자 Rollout이 **Degraded**로 떨어졌습니다.

```
Status:   ✖ Degraded
Message:  RolloutAborted: ... Blue/green pre-promotion analysis phase error/failed:
          Metric "success-rate" assessed Error due to consecutiveErrors (5) > consecutiveErrorLimit (4):
          "Error Message: reflect: slice index out of range"
```

원인은 단순했습니다. `prePromotionAnalysis`는 **preview Service에 트래픽이 들어와야** 메트릭을 수집할 수 있는데, preview에는 아무도 요청을 보내지 않으니 `istio_requests_total` 결과가 0건 → Prometheus 쿼리 결과가 비어 `slice index out of range` 에러가 난 것입니다.

해결 방법은 두 가지입니다.

1. **analysis 없이 수동 promote** — preview를 사람이 직접 확인한 뒤 promote (실습에선 이 방법을 사용)
2. preview Service로 트래픽을 먼저 발생시킨 다음 analysis 실행
   ```bash
   # preview로 트래픽 발생 후 analysis가 메트릭을 잡도록
   kubectl exec -n istio-lab deploy/ratings-v1 -c ratings -- \
     bash -c 'for i in $(seq 1 50); do curl -s -o /dev/null reviews-preview:9080/reviews/0; sleep 1; done'
   ```

이번 글에서는 1번으로 진행합니다. 즉 Rollout에서 `prePromotionAnalysis`를 빼고, preview를 직접 확인한 뒤 수동으로 promote 합니다. (그래서 Blue/Green에서는 별도 AnalysisTemplate을 만들지 않습니다.)

### 4-3. Rollout 리소스 (Blue/Green 전략)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: reviews
  namespace: istio-lab
spec:
  replicas: 3
  revisionHistoryLimit: 3
  selector:
    matchLabels:
      app: reviews
  template:
    metadata:
      labels:
        app: reviews
        version: stable
      annotations:
        sidecar.istio.io/inject: "true"
    spec:
      serviceAccountName: bookinfo-reviews
      containers:
        - name: reviews
          image: docker.io/istio/examples-bookinfo-reviews-v1:1.20.2
          ports:
            - containerPort: 9080
  strategy:
    blueGreen:
      activeService: reviews            # 라이브 트래픽 Service
      previewService: reviews-preview   # 새 버전 사전 확인용 Service
      autoPromotionEnabled: false       # 수동 승격 (직접 확인 후 promote)
      scaleDownDelaySeconds: 300        # 전환 후 5분간 이전 버전 유지 (즉시 롤백 가능)
      # prePromotionAnalysis 는 사용하지 않음
      #  → preview에 트래픽이 없으면 메트릭이 비어 analysis가 실패하기 때문 (4-2 참고)
```

핵심 옵션을 정리하면 이렇습니다.

- `activeService` / `previewService` → 라이브용 / 사전 확인용 Service
- `autoPromotionEnabled: false` → 사람이 확인한 뒤 직접 promote
- `scaleDownDelaySeconds: 300` → 전환 후 5분간 이전 버전 Pod 유지 → 빠른 롤백 가능
- (`prePromotionAnalysis`는 4-2에서 설명한 이유로 제외)

### 4-4. Blue/Green 실행 (v1 → v3)

```bash
kubectl argo rollouts set image reviews -n istio-lab \
  reviews=docker.io/istio/examples-bookinfo-reviews-v3:1.20.2
```

```bash
kubectl argo rollouts get rollout reviews -n istio-lab --watch
```

```
Status:          ◑ Paused
Strategy:        BlueGreen
Images:          docker.io/istio/examples-bookinfo-reviews-v1:1.20.2 (stable, active)
                 docker.io/istio/examples-bookinfo-reviews-v3:1.20.2 (preview)
Replicas:
  Current:       6    ← Blue 3개 + Green 3개 = 6개
```

Canary와 가장 다른 점은 여기서 **Pod가 6개로 늘어난다**는 것입니다. Blue(v1) 3개가 **여전히 라이브 트래픽(productpage 접속)을 처리**하고, Green(v3) 3개는 함께 떠 있지만 **아직 사용자에게 노출되지 않고 `reviews-preview` Service로만 접근**할 수 있습니다. 즉 promote 하기 전까지 사용자는 계속 v1(별점 없음)을 보게 됩니다.

![Blue/Green Paused 상태 - reviews Pod 6개 (Blue 3 + Green 3)](/assets/images/2026-06-08/bluegreen-paused.webp)

Argo Rollouts 대시보드에서도 Revision 4(v3)가 **preview**, Revision 3(v1)이 **stable·active**로 나뉘어 떠 있는 것을 확인할 수 있습니다. (앞서 4-2에서 prePromotionAnalysis로 실패했던 Revision 2가 `No Pods`로 남아있는 것도 보입니다.)

![Argo Rollouts 대시보드 - preview(v3) / active(v1) 공존](/assets/images/2026-06-08/bluegreen-dashboard-paused.webp)

이 시점의 상태가 Blue/Green의 핵심입니다.

- 브라우저 `productpage` → **여전히 v1 (별점 없음)** — active Service가 아직 Blue를 가리킴
- `reviews-preview` Service → **v3 (빨간 별점)** — Green Pod가 preview에서만 접근 가능

실제로 라이브 productpage는 promote 전까지 v1(별점 없음) 그대로입니다.

![productpage - 라이브는 아직 v1](/assets/images/2026-06-08/bluegreen-live-v1.webp)

즉, **사용자에게는 영향 없이 새 버전을 미리 확인**할 수 있습니다. 클러스터 내부에서 preview Service로 직접 호출해 Green 버전을 검증해봤습니다.

```bash
kubectl exec -n istio-lab deploy/ratings-v1 -c ratings -- \
  curl -s reviews-preview:9080/reviews/0 | python3 -m json.tool
```

응답을 보면 preview(Green)는 이미 v3라서 별점(`stars`)이 빨간색(`"color": "red"`)으로 채워져 나옵니다.

![preview 응답 - v3 (빨간 별점)](/assets/images/2026-06-08/bluegreen-preview-v3.webp)

참고로 Kiali 그래프에서도 `reviews`(stable·active)와 함께 **`reviews-preview`가 별도 노드로 보입니다.** Blue/Green은 preview가 실제로 독립된 Service라서, (뒤의 canary와 달리) Kiali에 그대로 나타납니다.

![Kiali - reviews(active)와 reviews-preview가 별도 노드로 표시](/assets/images/2026-06-08/bluegreen-kiali.webp)

### 4-5. 승격 (Promote)

새 버전에 문제가 없다고 판단되면 승격합니다.

```bash
kubectl argo rollouts promote reviews -n istio-lab
```

```
Status:          ✔ Healthy
Strategy:        BlueGreen
Images:          docker.io/istio/examples-bookinfo-reviews-v1:1.20.2 (delay:...) ← 5분 후 축소
                 docker.io/istio/examples-bookinfo-reviews-v3:1.20.2 (stable, active)
```

![Blue/Green promote 후 - v3가 stable·active](/assets/images/2026-06-08/bluegreen-promoted-cli.webp)

이제 브라우저 `productpage`도 빨간 별점(v3)으로 한번에 전환됩니다. Canary처럼 점진적으로 섞이는 게 아니라 **순간적으로 바뀌는** 점이 인상적이었습니다.

![Blue/Green 전환 완료](/assets/images/2026-06-08/bluegreen-promoted.webp)

`scaleDownDelaySeconds: 300` 덕분에 이전 Blue(v1) Pod는 5분간 그대로 남아있습니다. 이 시간 안에 문제가 발견되면 즉시 롤백이 가능하고, 5분이 지나면 Blue Pod가 자동으로 축소됩니다.

### 4-6. 롤백

전환 후 5분 이내(Blue Pod가 살아있는 동안)라면 즉시 롤백됩니다.

```bash
kubectl argo rollouts undo reviews -n istio-lab
```

이전 Blue(v1) Pod가 아직 떠 있으므로 트래픽이 곧바로 v1으로 복원됩니다. Blue/Green의 가장 큰 장점이 바로 이 **즉시 롤백**입니다.

### 4-7. (옵션) 자동 승격 — `autoPromotionEnabled`

이번에는 preview를 직접 확인하려고 `autoPromotionEnabled: false`(수동 승격)로 진행했지만, 이 값을 `true`로 두면 **사람이 promote를 누르지 않아도 자동으로 전환**됩니다. 직접 적용해보진 않았지만 옵션만 정리해두면 이렇습니다.

```yaml
strategy:
  blueGreen:
    activeService: reviews
    previewService: reviews-preview
    autoPromotionEnabled: true     # 자동 전환
    autoPromotionSeconds: 60       # (선택) Green Ready 후 60초 뒤 자동 promote
    scaleDownDelaySeconds: 300
```

- `false` (이번 설정) → Green이 떠도 **Paused 상태로 대기**, `kubectl argo rollouts promote`를 직접 실행해야 전환
- `true` → Green이 Ready 되면 **자동으로 active 전환**
  - `prePromotionAnalysis`가 있으면 → 분석 통과 시 자동 promote / 실패 시 자동 abort (완전 자동 배포)
  - `autoPromotionSeconds: N`을 주면 → Ready 후 N초 대기했다가 자동 전환

> 참고로 `autoPromotionEnabled`를 **생략하면 기본값이 `true`** 입니다. 그래서 "preview 확인 후 수동 전환" 흐름을 원하면 이번처럼 명시적으로 `false`를 줘야 합니다. 실습·검증 단계에서는 `false`(수동), 분석까지 붙인 완전 자동 파이프라인을 원하면 `true` + `prePromotionAnalysis` 조합이 맞습니다.

---

## 5. 모니터링 — Kiali의 한계와 Argo Rollouts Dashboard

처음에는 당연히 Kiali 그래프에서 canary 트래픽이 stable/canary로 갈라지는 모습을 볼 수 있을 거라 생각했는데, 실제로는 **보이지 않았습니다.** 여기에는 구조적인 이유가 있습니다.

Kiali는 workload를 **Deployment(그리고 `app`/`version` 라벨) 단위로 구분**합니다. 그런데 Argo Rollouts는 Deployment가 아니라 Rollout(내부적으로 ReplicaSet)을 사용하고, stable·canary Pod가 **같은 라벨(`version: stable`)을 공유**합니다. Argo Rollouts는 이 둘을 `rollouts-pod-template-hash`로 구분하지만 Kiali는 이 해시를 버전으로 보지 않기 때문에, **canary가 진행 중이어도 Kiali 그래프에서는 하나의 workload로만 보입니다.**

정리하면:

- **수동 canary** (Deployment 2개 + VirtualService weight 조절) → 버전별 라벨이 다르므로 Kiali에서 stable/canary가 잘 구분되어 보임
- **Argo Rollouts canary** → 단계별 트래픽 분할이 Kiali 그래프에 나타나지 않음 (Kiali의 구조적 한계)
- 따라서 Argo Rollouts의 canary 진행 상태는 **Argo Rollouts Dashboard**(`http://<노드IP>:32140`)에서 확인하는 것이 맞습니다 — step, set/actual weight, 분석 결과까지 전용 UI로 보여줍니다.

> 참고로 앞서 Blue/Green에서는 `reviews-preview`가 **독립된 Service**라 Kiali에 별도 노드로 보였지만, canary는 stable/canary가 하나의 Service·동일 라벨을 공유하기 때문에 이런 분할이 보이지 않습니다.

즉 Argo Rollouts를 쓸 때는 Kiali보다 **Rollouts Dashboard를 주 모니터링 도구로 삼는 편**이 자연스럽습니다.

다만 Kiali가 쓸모없다는 뜻은 아닙니다. **서비스 간 트래픽 토폴로지**를 한눈에 보는 용도로는 여전히 강력해서, 실제 사내 프로젝트에서도 마이크로서비스 간 호출 관계와 트래픽·에러 흐름을 파악하는 데 유용하게 쓰고 있습니다. 아래는 사내 환경의 Kiali 그래프 일부인데, 어떤 서비스가 어디로 얼마나 호출하는지, 어디서 에러가 나는지를 그래프만 보고도 빠르게 짚어낼 수 있습니다.

![사내 프로젝트 Kiali 트래픽 토폴로지](/assets/images/2026-06-08/kiali-inhouse.webp)

한편 Grafana(Prometheus 메트릭)에서는 reviews 서비스 전체의 Request Rate / Error Rate 추이를 볼 수 있어, canary 진행 중 에러율 상승이나 rollback 시점의 스파이크를 시간축으로 확인하는 데 활용했습니다. Tempo 트레이스와 함께 보면 버전 전환 전후의 요청 흐름도 확인할 수 있습니다.

![Grafana - Istio Request Rate / Error Rate / Tracing](/assets/images/2026-06-08/grafana-istio.webp)

---

## 6. Canary vs Blue/Green, 언제 무엇을?

![Canary vs Blue/Green](/assets/images/2026-06-08/canary-vs-bluegreen.svg)

직접 둘 다 돌려보고 정리한 비교표입니다.

| | Canary | Blue/Green |
|---|---|---|
| 방식 | 트래픽 점진 이동 (10→30→60→100%) | 전체 준비 후 한번에 스위칭 |
| 리소스 | 최소 Pod만 추가 | 동일 규모 2세트 (2배) |
| 전환 속도 | 느림 (단계별 대기) | 빠름 (한번에) |
| 롤백 속도 | 빠름 (weight 변경) | 즉시 (이전 버전이 살아있음) |
| 적합한 상황 | 리스크 높은 변경, 점진적 검증 | 빠른 전환 + 즉시 롤백 필요 |

| 상황 | 추천 | 이유 |
|---|---|---|
| 서비스 간 호출 복잡 (MSA) | Canary | 점진적 검증, 일부 사용자만 영향 |
| 독립적 서비스 | Blue/Green | 빠른 전환, 즉시 롤백 |
| 리소스 여유 없음 | Canary | Pod를 적게 사용 |
| 롤백 속도 최우선 | Blue/Green | 이전 버전 Pod가 살아있어 즉시 복원 |
| DB 스키마 변경 포함 | Blue/Green | 한번에 전환이 안전 |

---

## 7. 마무리

이번 글을 통해 느낀 점을 정리하면 이렇습니다.

- 기존 Deployment로는 "이미지만 바꾸면 알아서 점진 배포 + 메트릭 확인 + 자동 롤백"이 불가능했는데, Argo Rollouts는 이걸 선언적으로 풀어준다는 게 가장 큰 매력이었습니다.
- **Canary**는 변화가 점진적이라 관찰할 게 많고, 리스크가 큰 변경에서 일부 사용자에게만 노출하며 검증하기 좋았습니다.
- **Blue/Green**은 preview로 사전 검증한 뒤 한번에 전환하고, 문제가 생기면 살아있는 이전 버전으로 즉시 되돌릴 수 있어 "롤백 속도"가 중요한 경우에 확실히 강력했습니다.
- AnalysisTemplate으로 Prometheus 메트릭을 묶어두니, 사람이 매번 그래프를 들여다보지 않아도 실패 시 알아서 롤백된다는 점이 인상 깊었습니다.

이번 글에서는 `kubectl argo rollouts set image`로 직접 이미지를 바꿨지만, 실제 운영에서는 Git에 Rollout yaml을 두고 ArgoCD가 Sync하는 **GitOps 구조**와 엮는 것이 자연스럽습니다. 다음에는 ArgoCD + Argo Rollouts를 연동해 Git push만으로 Canary가 시작되는 파이프라인까지 정리해보려 합니다.

---
