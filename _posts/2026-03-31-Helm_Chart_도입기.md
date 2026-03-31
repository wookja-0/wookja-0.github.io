---
title: "[K8s] Helm Chart 도입기"
date: 2026-03-31 00:00:00 +0900
categories: ['Kubernetes', 'DevOps']
tags: ['kubernetes', 'helm', 'argocd', 'jenkins', 'gitops', 'migration']
description: "운영 중인 K8s 리소스를 서비스 다운타임 없이 Helm Chart로 전환하고, ArgoCD Application과 Jenkins CI/CD 파이프라인까지 함께 마이그레이션한 과정을 정리합니다."
image: assets/images/2026-03-31/260331_thumbnail.png
---

이번 글에서는 기존에 raw YAML + ArgoCD 조합으로 운영하던 Kubernetes 리소스들을 Helm Chart 기반으로 전환한 경험을 정리해보려 합니다. ArgoCD Application 구조 변경부터 Jenkins 파이프라인 수정까지, 실제로 작업하면서 겪었던 시행착오 위주로 다뤄보겠습니다.

> 참고로, 회사에서 `dmp`, `dmp-poc` 두 개의 네임스페이스에서 메인 서비스를 운영하고 있습니다. 본문에 나오는 서비스명이나 리소스명은 실제 환경의 이름인데, 구조와 흐름을 파악하는 데 참고만 해주시면 됩니다.

---

## 1. 배경

![배경](/assets/images/2026-03-31/260331_배경.png)

부서에서 DevOps를 담당하는 사람이 저 혼자다 보니, K8s manifest 작성부터 배포까지 쭉 혼자 진행해왔습니다. 서비스별로 `deployment.yaml`, `service.yaml`, `pvc.yaml` 같은 파일들을 각각 폴더에 나누고, ArgoCD Application도 서비스마다 하나씩 만들어서 쓰고 있었습니다.

처음에는 이래도 괜찮았는데, 서비스가 점점 늘다 보니 혼자 감당하기에 불편한 점들이 쌓이기 시작했습니다.

- ArgoCD Application이 **14개**나 되다 보니 관리 자체가 부담
- 이미지 레지스트리 주소, 네임스페이스, 프록시 설정 같은 공통값이 각 YAML에 하드코딩
- dev/staging/prod 환경 분리가 사실상 불가능
- Jenkins에서 이미지 태그를 바꿀 때 `find + sed`로 deployment.yaml을 직접 긁어야 하는 구조

서비스가 새로 생길 때마다 폴더 만들고, YAML 복사하고, ArgoCD App 추가하고... 이걸 매번 반복하다 보니 이대로는 안 되겠다 싶어서 Helm으로 구조를 잡아야겠다고 마음을 먹었습니다. 이전에 작성한 [Jenkins Shared Library로 GitOps 파이프라인 표준화하기](/posts/Jenkins_Shared_library_사용/) 글 마지막에도 "추후 Helm 기반으로 리팩토링할 계획"이라고 적어뒀었는데, 이번에 드디어 진행하게 되었습니다.

개발환경에서 먼저 PoC를 돌려보고 절차를 검증한 다음, 운영환경에도 동일하게 적용했습니다. 이 글에서 다루는 내용은 개발환경 PoC 기준이지만, 운영에서도 그대로 사용한 절차입니다.

---

## 2. Helm이란?

[Helm](https://helm.sh/)은 Kubernetes의 패키지 매니저입니다. Linux에서 `apt`나 `yum`으로 패키지를 관리하듯, Helm은 K8s 리소스들을 **Chart**라는 단위로 묶어서 설치하고 업그레이드하고 롤백할 수 있게 해줍니다.

> Helm 설치 방법은 이전에 작성한 [Helm을 이용한 Ingress-NGINX 사용 해보기](/posts/Helm을_이용한_ingress-nginx_실습/) 글에 정리해두었으니 참고해주세요.

### 핵심 개념

| 용어 | 설명 |
|------|------|
| **Chart** | K8s 리소스 정의 파일들의 묶음. 하나의 패키지 |
| **Release** | Chart를 클러스터에 설치한 인스턴스. 같은 Chart도 여러 번 설치 가능 |
| **Repository** | Chart를 저장하고 공유하는 곳 (Artifact Hub, Harbor 등) |
| **values.yaml** | Chart의 설정값 파일. 환경별로 다른 values를 넣을 수 있음 |

### 왜 Helm을 쓰는가?

raw YAML로 리소스를 관리하면, 서비스가 늘어날수록 복붙과 하드코딩이 걷잡을 수 없어집니다.

**1) 템플릿으로 반복 제거**

서비스마다 거의 같은 Deployment, Service, PVC를 복사해서 만드는 대신, 공통 구조를 한 번만 정의하고 값만 바꿔 쓸 수 있습니다.

{% raw %}
```yaml
# raw YAML — 매번 하드코딩
image: <Registry URL>/dmp/dmp-main:v0.231
namespace: dmp

# Helm 템플릿 — 값을 변수로 분리
image: {{ .Values.global.registry }}/{{ .Values.services.dmpMain.image.repository }}:{{ .Values.services.dmpMain.image.tag }}
namespace: {{ .Values.global.namespace }}
```
{% endraw %}

**2) 환경별 설정 분리**

같은 Chart에 다른 `values.yaml`을 넣어서 dev, prod를 구분할 수 있습니다.

```bash
helm install dmp ./charts/dmp -f values-dev.yaml    # 개발
helm install dmp ./charts/dmp -f values-prod.yaml   # 운영
```

**3) 릴리스 관리와 롤백**

설치/업그레이드할 때마다 revision이 기록되므로, 문제가 생기면 바로 되돌릴 수 있습니다.

```bash
helm history dmp -n dmp          # revision 이력 확인
helm rollback dmp 3 -n dmp      # revision 3으로 롤백
```

**4) 의존성 관리**

`Chart.yaml`에서 다른 Chart를 dependency로 걸 수 있습니다. Redis나 PostgreSQL 같은 공용 Chart를 가져다 쓸 때 유용합니다.

---

## 3. Helm Chart 구성 방식

Chart는 정해진 디렉토리 구조를 따릅니다.

```
mychart/
├── Chart.yaml          # Chart 메타데이터 (이름, 버전, 설명)
├── values.yaml         # 기본 설정값
└── templates/          # K8s 리소스 템플릿
    ├── _helpers.tpl    # 재사용 가능한 헬퍼 함수
    ├── deployment.yaml
    ├── service.yaml
    └── ...
```

### Chart.yaml

Chart의 이름, 버전 등 메타데이터를 정의하는 파일입니다.

```yaml
apiVersion: v2
name: dmp
description: DMP main services Helm Chart
type: application
version: 0.1.0        # Chart 자체 버전
appVersion: "1.0.0"   # 배포 대상 앱 버전
```

### values.yaml

템플릿에서 참조하는 설정값들을 모아두는 파일입니다. `helm install` 할 때 `--set`이나 `-f`로 덮어쓸 수 있습니다.

```yaml
global:
  registry: <Registry URL>
  namespace: dmp

services:
  dmpMain:
    image:
      repository: dmp/dmp-main
      tag: v0.231
    port: 9000
    livenessProbe:
      path: # Health Check Endpoint
    readinessProbe:
      path: # Health Check Endpoint
```

### templates/

Go 템플릿 문법으로 K8s 리소스를 정의합니다. {% raw %}`{{ .Values.xxx }}`{% endraw %}로 values.yaml 값을 참조합니다.

{% raw %}
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dmp-main
  namespace: {{ .Values.global.namespace }}
spec:
  template:
    spec:
      containers:
        - name: dmp-main
          image: {{ .Values.global.registry }}/{{ .Values.services.dmpMain.image.repository }}:{{ .Values.services.dmpMain.image.tag }}
```
{% endraw %}

### _helpers.tpl

여러 템플릿에서 반복되는 부분을 함수로 빼놓는 파일입니다. {% raw %}`{{ include "함수명" . }}`{% endraw %}으로 호출합니다.

{% raw %}
```yaml
{{- define "dmp.image" -}}
{{ .registry }}/{{ .repo }}:{{ .tag }}
{{- end }}

# 사용
image: {{ include "dmp.image" (dict "registry" .Values.global.registry "repo" $svc.image.repository "tag" $svc.image.tag) }}
```
{% endraw %}

### 자주 쓰는 Helm CLI

```bash
helm lint ./charts/dmp                          # Chart 문법 검증
helm template dmp ./charts/dmp                  # 렌더링 미리보기 (설치 X)
helm install dmp ./charts/dmp -n dmp            # 설치
helm upgrade dmp ./charts/dmp -n dmp            # 업그레이드
helm rollback dmp 1 -n dmp                      # 롤백
helm list -n dmp                                # 설치된 릴리스 목록
helm uninstall dmp -n dmp                       # 삭제
```

> 공식 문서: [Helm Docs](https://helm.sh/docs/)

---

## 4. 마이그레이션 목표

| 항목 | Before | After |
|------|--------|-------|
| 배포 방식 | raw YAML (ArgoCD path) | Helm Chart (ArgoCD helm) |
| ArgoCD App 수 | 14개 (서비스별) | 2개 (dmp, dmp-poc) |
| 이미지 태그 관리 | 각 deployment.yaml을 sed로 치환 | values.yaml의 해당 키만 수정 |
| 서비스 다운타임 | - | **없음** (기존 Pod 유지) |

---

## 5. 대상 범위

### dmp 네임스페이스 (10개 서비스)

| 서비스 | 리소스 |
|--------|--------|
| dmp-main | Deployment, Service, PVC |
| dmp-front | Deployment, Service(NodePort), PVC |
| dmp-admin | Deployment, Service, PVC |
| dmp-work | Deployment, Service, PVC |
| dmp-dsst | Deployment, Service, PVC |
| dmp-sub | Deployment, Service, PVC |
| dmp-batch | Deployment, Service(NodePort), PVC |
| dmp-batch-work | Deployment, Service, PVC |
| dmp-mobile | Deployment, Service(NodePort), PVC |
| dmp-chat | Deployment, Service, PVC x2, ConfigMap x4, Ingress |
| 공통 | Ingress x2 (dmp-api, dmp-front) |

### dmp-poc 네임스페이스 (8개 서비스)

| 서비스 | 리소스 |
|--------|--------|
| reporting-api | Deployment, Service(NodePort), PVC |
| reporting-llm-api | Deployment, Service(NodePort), PVC |
| reporting-nifi | StatefulSet, Service x2, PVC x2 |
| reporting-portal | Deployment, Service(NodePort), PVC |
| mongodb | StatefulSet, Service(NodePort), PVC |
| naver-mcp-server | Deployment, Service, PVC |
| streamlit | Deployment, Service(NodePort), PVC |
| graphdb | StatefulSet(volumeClaimTemplates), Service(NodePort) |
| 공통 | Ingress x2 |

---

## 6. 실제 만든 Chart 구조

```
k8s-manifest/
├── [기존 서비스 폴더들 유지]     # 백업
└── charts/                       # 새로 추가
    ├── dmp/
    │   ├── Chart.yaml
    │   ├── values.yaml
    │   └── templates/
    │       ├── _helpers.tpl
    │       ├── ingress.yaml
    │       ├── dmp-main.yaml
    │       ├── dmp-front.yaml
    │       ├── ...
    │       ├── dmp-chat.yaml
    │       └── dmp-chat-configmaps.yaml
    └── dmp-poc/
        ├── Chart.yaml
        ├── values.yaml
        └── templates/
            ├── _helpers.tpl
            ├── ingress.yaml
            ├── reporting-api.yaml
            ├── ...
            └── graphdb.yaml
```

기존 폴더는 삭제하지 않고 그대로 남겨둬서 백업 겸 레퍼런스로 활용할 수 있게 했습니다.

---

### values.yaml 구조

핵심은 모든 서비스의 이미지 태그가 하나의 파일에 모인다는 점입니다. Jenkins에서 빌드가 끝나면 해당 서비스의 `tag` 값만 바꾸면 됩니다.

```yaml
global:
  registry: <Registry URL>
  namespace: dmp
  storageClass:
    logs: nfs-csi-dmp-logs
    files: nfs-csi-dmp-files

services:
  dmpMain:
    image:
      repository: dmp/dmp-main
      tag: v0.231              # ← Jenkins가 여기만 변경
    port: 9000
    pvc:
      logs: { size: 1Gi }
      files: { size: 1Gi }

  dmpWork:
    image:
      repository: dmp/dmp-work
      tag: v0.150              # ← dmp-work 빌드 시 여기만
    port: 9000
    ...
```

---

### _helpers.tpl

공통으로 쓰이는 이미지 경로 조합, DB 환경변수 주입 등을 헬퍼로 빼뒀습니다.

{% raw %}
```yaml
# 이미지 경로: <Registry URL>/dmp/dmp-main:v0.231
{{- define "dmp.image" -}}
{{ .registry }}/{{ .repo }}:{{ .tag }}
{{- end }}

# DB 환경변수 (Secret 참조)
{{- define "dmp.dbEnv" -}}
- name: JWT_SECRET
  valueFrom:
    secretKeyRef: { name: dmp-jwt, key: JWT_SECRET }
...
{{- end }}
```
{% endraw %}

---

## 7. 마이그레이션 절차

![기도](assets\images\2026-03-31\gido.png)

가장 신경 쓴 부분은 **이미 돌아가고 있는 서비스를 끊기지 않게 하면서** Helm 관리 체계로 넘기는 것이었습니다.

### Step 1. Chart를 Git에 push

기존 파일은 건드리지 않고 `charts/` 폴더만 추가해서 push합니다. ArgoCD App들은 아직 `path: dmp-main` 같은 기존 폴더를 바라보고 있어서, `charts/`가 추가되어도 아무 반응이 없습니다.

### Step 2. 기존 리소스에 Helm 어노테이션 부착 (Adopt)

`helm install`을 하면 이미 존재하는 리소스와 충돌이 나는데, 미리 Helm 관리 어노테이션을 달아주면 "이 리소스는 이미 내꺼야"라고 Helm에게 알려줄 수 있습니다.

```bash
# 대상 리소스마다 반복
kubectl annotate deployment dmp-main -n dmp \
  meta.helm.sh/release-name=dmp \
  meta.helm.sh/release-namespace=dmp --overwrite

kubectl label deployment dmp-main -n dmp \
  app.kubernetes.io/managed-by=Helm --overwrite
```

Deployment, StatefulSet, Service, PVC, ConfigMap, Ingress 전부 대상입니다.

### Step 3. helm install

```bash
helm install dmp ./charts/dmp -n dmp
helm install dmp-poc ./charts/dmp-poc -n dmp-poc
```

### Step 4. 기존 ArgoCD Application 삭제

```bash
# Application 오브젝트만 삭제됨 — 실제 K8s 리소스는 그대로
kubectl delete application dmp-main dmp-work dmp-dsst ... -n argocd
```

### Step 5. ArgoCD Application을 Helm 타입으로 재생성

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: dmp
  namespace: argocd
spec:
  project: dmp
  source:
    repoURL: <GitLab Repo URL>
    targetRevision: HEAD
    path: charts/dmp
    helm:
      valueFiles:
        - values.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: dmp
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

14개였던 Application이 2개(`dmp`, `dmp-poc`)로 줄어들었습니다.

---

## 8. 트러블슈팅

순탄하게 진행될 줄 알았는데, 예상 못한 이슈가 꽤 있었습니다. 같은 작업을 하실 분들께 도움이 될 것 같아 정리해봅니다.

### 8-1. ConfigMap field manager 충돌

```
INSTALLATION FAILED: conflict occurred while applying object dmp/synapse-config
Apply failed with 1 conflict: conflict with "kubectl-client-side-apply" using v1: .data.homeserver.yaml
```

기존에 `kubectl apply`(client-side)로 만들어진 ConfigMap이 있었는데, Helm은 server-side apply를 쓰다 보니 `.data` 필드의 소유권이 충돌했습니다.

server-side apply로 재적용해서 field manager를 바꿔준 뒤, `--force-conflicts`로 넘겼습니다.

```bash
kubectl get configmap synapse-config -n dmp -o json | \
  python3 -c "
import sys,json
d=json.load(sys.stdin)
d['metadata'].pop('managedFields',None)
d['metadata'].pop('resourceVersion',None)
print(json.dumps(d))
" | kubectl apply --server-side --force-conflicts -f -

helm upgrade dmp ./charts/dmp -n dmp --force-conflicts
```

> 참고: [Kubernetes — Server-Side Apply & Field Management](https://kubernetes.io/docs/reference/using-api/server-side-apply/) / [Helm --force-conflicts 옵션](https://helm.sh/docs/helm/helm_upgrade/)

---

### 8-2. "release name already in use"

```
Error: INSTALLATION FAILED: cannot reuse a name that is still in use
```

첫 `helm install`이 위의 충돌로 실패했는데, Helm Secret에 `failed` 상태의 릴리스가 남아서 같은 이름으로 재설치가 안 됐습니다. `helm upgrade`로 바꾸니 해결.

```bash
helm upgrade dmp ./charts/dmp -n dmp --force-conflicts
```

> 참고: [Helm — cannot reuse a name that is still in use](https://helm.sh/docs/helm/helm_install/)

---

### 8-3. ArgoCD SharedResourceWarning

```
Deployment/reporting-api is part of applications argocd/dmp-poc and reporting-api
```

기존 ArgoCD App을 삭제했는데, 리소스에 박혀 있던 `argocd.argoproj.io/tracking-id` 어노테이션이 캐시에 남아서 새 App과 충돌로 잡혔습니다. OutOfSync에서 빠져나올 수가 없었습니다.

해당 어노테이션을 직접 날려주면 해결됩니다.

```bash
for kind in deployment service pvc; do
  for name in reporting-api reporting-llm-api reporting-portal streamlit; do
    kubectl annotate $kind $name -n dmp-poc argocd.argoproj.io/tracking-id-
  done
done
```

> 참고: [ArgoCD — Resource Tracking](https://argo-cd.readthedocs.io/en/stable/user-guide/resource_tracking/)

---

### 8-4. PersistentVolume — ArgoCD 프로젝트 권한

```
SyncFailed - resource :PersistentVolume is not permitted in project dmp-poc
```

PV를 chart에 포함시켰더니 ArgoCD 프로젝트 권한에서 막혔습니다. PV는 cluster-scoped 리소스라서 namespace-scoped만 허용하는 ArgoCD 프로젝트에서는 관리할 수 없습니다.

PV는 이미 `Bound` 상태로 클러스터에 있으니까, chart에서 빼버리면 됩니다. PVC만 chart에 두고 PV는 인프라 레벨에서 따로 관리하는 게 맞습니다.

> 참고: [ArgoCD — Project Resource Allowlist](https://argo-cd.readthedocs.io/en/stable/user-guide/projects/#resource-allowlists-and-denylists)

---

### 8-5. ArgoCD가 예전 커밋으로 sync

chart를 고치고 push했는데, ArgoCD가 계속 이전 커밋 기준으로 sync를 시도해서 방금 지운 PV를 또 만들려고 했습니다. Git refresh 주기보다 sync가 먼저 걸리면서 캐시된 manifest를 쓴 건데, 커밋 hash를 직접 지정해서 해결했습니다.

```bash
NEW_REV=$(git rev-parse HEAD)
kubectl patch application dmp-poc -n argocd --type=merge -p "{
  \"operation\": {
    \"initiatedBy\": {\"username\": \"admin\"},
    \"sync\": {\"revision\": \"${NEW_REV}\", \"prune\": true}
  }
}"
```

> 참고: [ArgoCD — Sync Options & Revision](https://argo-cd.readthedocs.io/en/stable/user-guide/sync-options/)

---

## 9. Jenkins 파이프라인 수정

매니페스트 구조가 바뀌었으니 Jenkins의 CD 파이프라인도 손을 봐야 합니다. `appConfig.groovy`와 `updateManifest.groovy` 두 파일을 수정했습니다.

### Before: 서비스별 폴더에서 sed로 치환

```groovy
// appConfig.groovy
'dmp-work': [
  manifestDir : 'dmp-work',  // 개별 폴더
  ...
]

// updateManifest.groovy
find "$MANIFEST_DIR" -type f -regex '.*\.ya?ml$' | \
  xargs sed -i "s#image:.*/dmp-work:.*#image:.../dmp-work:v0.151#g"
```

서비스마다 폴더가 따로 있으니까 이 방식이 먹혔습니다.

---

### After: values.yaml의 특정 키만 Groovy로 업데이트

```groovy
// appConfig.groovy — Helm 키 경로 추가
'dmp-work': [
  manifestDir    : 'charts/dmp',
  helmValuesFile : 'charts/dmp/values.yaml',
  helmValuesKey  : '.services.dmpWork.image.tag',
  ...
]

// updateManifest.groovy — YAML 들여쓰기 기반으로 해당 키만 찾아서 치환
def keys = helmValuesKey.split('\\.').findAll { it }
// → ['services', 'dmpWork', 'image', 'tag']
```

---

### Image Update 시 발생한 이슈

처음에는 `yq`나 `sed`를 shell에서 돌리려고 했습니다.

**삽질 1 — Groovy 파서가 백슬래시를 먹음:**  
`sh """..."""` 블록 안에 `\s`, `\.` 같은 정규식을 넣으면, Groovy 컴파일러가 이걸 먼저 해석하면서 `unexpected char: '\'` 에러가 납니다. `sh '''...'''`로 바꿔도 Python 코드 안에 또 백슬래시가 있으면 똑같이 터집니다.

![Groovy 파서 백슬래시 에러](/assets/images/2026-03-31/sap_1.png)

> 참고: [Jenkins — Pipeline Groovy string interpolation & escaping](https://www.jenkins.io/doc/book/pipeline/jenkinsfile/#string-interpolation)

**삽질 2 — sed로 tag 라인 전부 치환:**  
`values.yaml`에 10개 서비스의 `tag:` 라인이 전부 들어 있는데, sed가 키 경로 구분 없이 모든 `tag:` 라인을 한꺼번에 바꿔버렸습니다. dmp-work만 빌드했는데 나머지 9개 서비스 이미지도 같은 태그로 변경되면서 `ErrImagePullBackOff`가 쏟아졌습니다.

**결론 — 그냥 Groovy로 직접 처리:**  
shell을 쓰면 Groovy 파서 문제를 피할 수 없어서, `readFile`/`writeFile`로 Groovy에서 직접 파일을 읽고 쓰는 방식으로 갈아탔습니다. YAML의 들여쓰기 깊이를 스택으로 추적하면서, `.services.dmpWork.image.tag` 경로와 정확히 일치하는 라인 하나만 바꿉니다. 외부 도구 의존성도 없고, 백슬래시 문제도 없습니다.

이번 이슈를 겪으면서, Groovy 기반 Jenkins Pipeline의 한계를 다시 한번 느꼈습니다. shell 스크립트와 Groovy 파서 사이의 escape 충돌은 구조적인 문제라 근본적으로 해결하기가 어렵습니다. 이 경험을 계기로 `.yml` 기반으로 파이프라인을 선언적으로 작성할 수 있는 **GitHub Actions**, **GitLab CI/CD**로의 전환도 긍정적으로 검토해보기 시작했습니다.

---

## 10. 최종 결과

### Git 레포지토리 구조 변화

**Before — 서비스마다 개별 폴더, ArgoCD App도 서비스별로 하나씩:**

```
k8s-manifest/
├── dmp-main/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── pvc.yaml
├── dmp-work/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── pvc.yaml
├── dmp-front/
├── dmp-admin/
├── dmp-dsst/
├── dmp-sub/
├── dmp-batch/
├── dmp-batch-work/
├── dmp-mobile/
├── dmp-chat/
├── poc/
│   ├── reporting-api/
│   ├── reporting-llm-api/
│   ├── reporting-nifi/
│   ├── reporting-portal/
│   ├── mongodb/
│   ├── streamlit/
│   └── ...
├── dmp-ingress.yaml
├── dmp-poc-ingress.yaml
└── argocd/
    ├── argocd.yaml          # 9개 Application 정의
    └── argocd-poc.yaml      # 5개 Application 정의
```

서비스가 늘어날 때마다 폴더를 만들고, ArgoCD Application도 추가해야 했습니다.

**After — 기존 폴더는 백업으로 유지하고, `charts/`에 Helm Chart 추가:**

```
k8s-manifest/
├── [기존 폴더 전부 유지]          # 백업 겸 레퍼런스
├── charts/
│   ├── dmp/
│   │   ├── Chart.yaml
│   │   ├── values.yaml          # 10개 서비스 이미지 태그 집약
│   │   └── templates/
│   │       ├── _helpers.tpl
│   │       ├── ingress.yaml
│   │       ├── dmp-main.yaml    # Deployment + Service + PVC 통합
│   │       ├── dmp-work.yaml
│   │       └── ...
│   └── dmp-poc/
│       ├── Chart.yaml
│       ├── values.yaml          # 8개 서비스 이미지 태그 집약
│       └── templates/
│           ├── _helpers.tpl
│           ├── ingress.yaml
│           ├── reporting-api.yaml
│           └── ...
└── argocd/
    ├── argocd.yaml              # Application 1개 (dmp)
    └── argocd-poc.yaml          # Application 1개 (dmp-poc)
```

서비스별로 흩어져 있던 YAML들이 네임스페이스 단위 Chart로 정리되었고, ArgoCD Application 정의도 14개에서 2개로 줄었습니다.

---

### Helm / ArgoCD 상태

```
$ kubectl get applications -n argocd
NAME      SYNC STATUS   HEALTH STATUS
dmp       Synced        Healthy
dmp-poc   Synced        Healthy

$ helm list -n dmp
NAME  NAMESPACE  REVISION  STATUS    CHART
dmp   dmp        4         deployed  dmp-0.1.0

$ helm list -n dmp-poc
NAME     NAMESPACE  REVISION  STATUS    CHART
dmp-poc  dmp-poc    2         deployed  dmp-poc-0.1.0
qdrant   dmp-poc    1         deployed  qdrant-1.16.0
```

기존에 돌아가던 Pod는 Rolling Update 없이 그대로 유지됐고, **서비스 다운타임은 없었습니다.**

---

### ArgoCD Application 구조 변화

기존에는 서비스마다 ArgoCD Application이 하나씩 있어서, `dmp-main`, `dmp-work`, `reporting-api` 등 14개의 App을 개별로 관리해야 했습니다.

**Before** — 서비스별로 Application이 나열된 ArgoCD 대시보드:

![ArgoCD Before](/assets/images/2026-03-31/argo_before.png)

Helm 전환 후에는 네임스페이스 단위로 하나의 Application이 해당 네임스페이스의 모든 리소스를 트리 구조로 관리하게 됩니다.

**After** — `dmp`, `dmp-poc` 2개의 Application으로 통합:

![ArgoCD After](/assets/images/2026-03-31/argo_after.png)

**dmp 네임스페이스** — 하나의 `dmp` Application에서 10개 서비스의 Deployment, Service, PVC, Ingress 전체를 관리:

![ArgoCD dmp Application](/assets/images/2026-03-31/argo_dmp.png)

**dmp-poc 네임스페이스** — 하나의 `dmp-poc` Application에서 8개 서비스를 통합 관리:

![ArgoCD dmp-poc Application](/assets/images/2026-03-31/argo_dmppoc.png)

ArgoCD 대시보드에서 한눈에 네임스페이스 전체 상태를 볼 수 있게 되었고, 리소스 간 관계도 트리로 파악할 수 있어서 운영 편의성이 확실히 좋아졌습니다.

---

## 11. 최종 배포 흐름

```
git push (앱 소스 레포)
  └─ Jenkins 빌드 트리거
       ├─ mvnDockerBuildPush: Docker 빌드 & Harbor push
       └─ updateManifest:
            ├─ k8s-manifest 레포 checkout
            ├─ charts/dmp/values.yaml 읽기
            ├─ .services.dmpWork.image.tag 만 새 태그로 변경
            ├─ git commit & push
            └─ ArgoCD 감지 → Helm upgrade → 해당 서비스 Pod만 Rolling Update
```

배포가 완료되면 Slack으로 결과 알림이 옵니다.

![Slack 배포 결과 알림](/assets/images/2026-03-31/deploy_slack_result.png)

---

## 12. 마무리

작업하면서 느낀 점을 정리하면 이렇습니다.

- Helm adopt 패턴(어노테이션/레이블 부착)을 쓰면 이미 돌아가는 리소스를 끊지 않고 Helm 관리로 넘길 수 있다
- PV 같은 cluster-scoped 리소스는 chart에 넣지 않는 게 맞다. ArgoCD 프로젝트 권한 문제도 있고, 어차피 한번 만들면 잘 안 바뀌는 리소스
- ArgoCD Application을 전환할 때는 기존 App이 남긴 tracking 어노테이션을 꼭 정리해야 한다
- Jenkins에서 values.yaml을 고칠 때 sed/yq를 shell로 돌리면 Groovy 파서랑 싸우게 된다. 차라리 Groovy 네이티브로 처리하는 게 깔끔
- `values.yaml` 한 파일에 서비스 태그가 다 모여 있으니, **키 경로를 정확히 지정**해서 해당 서비스 것만 바꾸는 게 중요
- ~~**Jenkins** 말고 **Github Actions** 쓰고싶다.~~

이번 작업은 구글링과 [Claude](https://claude.ai/)의 도움을 정말 많이 받았습니다. 특히 Helm adopt 절차나 ArgoCD 트러블슈팅처럼 공식 문서만으로는 감이 안 오는 부분에서 AI한테 현재 상황을 설명하고 해결 방향을 잡아가는 식으로 진행했는데, 확실히 삽질 시간이 줄었습니다. 물론 AI가 알려준 대로 했다가 또 다른 이슈가 터지기도 했지만, 그래도 혼자 끙끙대는 것보다는 훨씬 나았습니다.

다음 포스팅으로는 **Ingress NGINX → Gateway API 마이그레이션**을 다뤄볼 생각입니다. Ingress NGINX가 2026년 6월부로 지원 종료 예정이라, 슬슬 Gateway API로 넘어갈 준비를 해야 할 것 같습니다. Helm으로 인프라를 정리해둔 김에 이것도 같이 가보려 합니다.

---
