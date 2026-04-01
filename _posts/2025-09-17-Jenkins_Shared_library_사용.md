---
title: "[Jenkins] Shared Library로 GitOps 파이프라인 표준화하기"
date: 2025-09-17
categories: [DevOps, CI/CD]
tags: [jenkins, shared-library, pipeline, groovy, ci/cd]
description: Jenkins Shared Library를 활용해 파이프라인 코드 중복을 줄이고, 효율적으로 DevOps 자동화를 구현하는 방법.
image: /assets/images/2025-09-17/jenkins-shared-lib.webp
---

이번 글에서는 Jenkins의 Shared Library 기능을 활용해 파이프라인 코드의 중복을 줄이고, 효율적으로 DevOps 자동화를 구현하는 방법을 정리해보려 합니다.

---

## 실무 적용 배경
프로젝트를 진행할 당시, MSA 구조의 백엔드 애플리케이션이 10개에서 20개 이상으로 늘어나면서, 각 서비스별로 Jenkins 파이프라인을 개별적으로 구성해야 했습니다.

아래는 실제 프로젝트에 적용한 아키텍처 다이어그램입니다.  

![아키텍처 사례](/assets/images/2025-09-17/arch.webp)
> 해당 다이어그램은 [LucidChart](https://www.lucidchart.com/) 를 사용해 작성하였습니다.


서비스 수가 증가함에 따라 빌드, 테스트, Docker 이미지 생성 및 배포, 공통 환경 변수 관리 등 반복되는 작업이 많아졌고, 이를 효율적으로 표준화하기 위해 Shared Library를 도입하게 되었습니다.


## 적용할 GitOps 기반 CI/CD 파이프라인 Flow

![파이프라인](/assets/images/2025-09-17/gitops.webp)

| 단계 | 주요 내용 |
|---|-------------------------------------------------------------|
| 1 | 개발자가 GitLab 소스 저장소에 코드 Push |
| 2 | Webhook으로 Jenkins 파이프라인 자동 트리거 |
| 3 | Jenkins에서 Maven 빌드 및 Docker 이미지 빌드 |
| 4 | 빌드된 Docker 이미지를 Harbor(이미지 레지스트리)로 Push |
| 5 | Jenkins가 최신 이미지 버전을 확인하고 Manifest 업데이트 준비 |
| 6 | Jenkins가 GitLab Manifest 저장소에서 매니페스트 파일 Pull 및 이미지 태그 업데이트 |
| 7 | ArgoCD가 Manifest 변경을 감지하여 K8s 클러스터에 자동 배포 |
| 8 | K8s가 Harbor에서 최신 이미지를 Pull하여 서비스 배포 |

> 소스코드 저장소와 매니페스트 저장소를 분리하여 관리하고, Jenkins에서 매니페스트 저장소의 deployment 이미지를 업데이트하는 방식으로 구현했습니다. 추후에는 Helm 기반으로 레포지토리 구조를 리팩토링할 계획입니다.

---

## Shared Library란?

[Jenkins Shared Library](https://www.jenkins.io/doc/book/pipeline/shared-libraries/)는 여러 Jenkins Pipeline에서 공통으로 사용하는 코드(스크립트, 함수, 변수 등)를 별도의 저장소에 모아 관리할 수 있는 기능입니다. 이를 통해 파이프라인 코드의 중복을 줄이고, 유지보수성과 확장성을 크게 높일 수 있습니다.

---

## Shared Library를 써야 하는 이유

- **중복 제거**: 여러 프로젝트에서 반복되는 빌드/배포/테스트 로직을 한 곳에서 관리
- **유지보수 용이**: 공통 로직 수정 시, 모든 파이프라인에 자동 반영
- **표준화**: 조직 내 DevOps 프로세스의 일관성 확보
- **버전 관리**: Git 등 VCS로 라이브러리 버전 관리 가능

---

## Shared Library 구조


Shared Library는 보통 별도의 Git 저장소로 관리하며, Jenkinsfile에서 `@Library` 어노테이션으로 불러와 사용합니다.

구조:
![디렉토리 구조](/assets/images/2025-09-17/directory.webp)


- **vars/**: 전역으로 사용할 수 있는 Groovy 스크립트(함수, 파이프라인 스텝)
- **src/**: 패키지 구조로 복잡한 Groovy/Java 클래스 관리
- **resources/**: 템플릿, 설정 파일 등 리소스 관리


실제 구성한 구조 예시:
```
(jenkins-shared-lib)
├── vars/
│   ├── appConfig.groovy
│   ├── dockerBuildPush.groovy
│   ├── mvnDockerBuildPush.groovy
│   ├── updateManifest.groovy
│   └── ...
├── src/
│   └── org/example/...
└── resources/
```

---


## Jenkins에서 Shared Library 기능 활성화

Jenkins에서 Shared Library를 사용하려면 아래와 같이 설정합니다.

1. **Jenkins 관리 > Configure System(시스템 설정) > Global Shared Libraries**
	- `Library name`에 사용할 이름(예: `jenkins-shared-lib`)을 입력합니다.
	- `Default version`에는 브랜치명(예: `main` 또는 `master`)을 입력합니다.
  ![설정1](/assets/images/2025-09-17/setting1.webp)
	- `Retrieval method`는 `Modern SCM` 선택 후, 실제 shared library 코드를 관리/적용 할 Git 저장소 URL과 인증 정보를 입력합니다.
  ![설정2](/assets/images/2025-09-17/setting2.webp)

2. **Jenkinsfile에서 Shared Library 사용**
	- Jenkinsfile 상단에 아래와 같이 선언합니다.
	  ```groovy
	  @Library('jenkins-shared-lib') _
	  ```
	- 등록한 라이브러리의 함수(appConfig, dockerBuildPush 등)를 자유롭게 사용할 수 있습니다.

> 참고: 라이브러리 이름, 브랜치, 저장소 URL 등은 각자의 환경에 맞게 입력해야 합니다.


## 실제 Shared Library 코드 예시 (vars 폴더)

> 아래 코드 예시는 각자의 조직/서비스 환경에 맞게 변수, 정보 등을 추가하거나 정의해야 하며,
> **credential(인증 정보) 등 민감한 내용은 보안상 예시에서 제외**하였습니다. 실제 운영 환경에서는 별도 관리가 필요합니다.

### appConfig.groovy (설정 관리)
> **역할:** 서비스별/공통 설정을 한 곳에서 관리하고, 파이프라인에서 동적으로 참조할 수 있도록 정보를 제공합니다.

```groovy
def call(String appName, Map override = [:]) {

  def common = [
    harborUrl    : 'harbor.example.com',
    dockerHost   : 'tcp://docker-host:2375'
  ]
  def main = [
    'service-a': [
      appRepoUrl: 'https://git.example.com/service-a.git',
      imageName : 'service-a'
    ],
    'service-b': [
      appRepoUrl: 'https://git.example.com/service-b.git',
      imageName : 'service-b'
    ]
  ]
  def perApp = main
  if (!perApp.containsKey(appName)) {
    error "appConfig: 알 수 없는 appName = ${appName}"
  }
  def appConfig = common + perApp[appName] + override
  return appConfig
  ```
  **설명:**  
  공통 설정(`common`)과 서비스별 설정(`main`)을 한 곳에서 관리합니다.  
  새로운 백엔드 애플리케이션이 추가될 경우, 해당 서비스의 설정을 `main` 딕셔너리에 항목으로 추가하면 파이프라인에서 바로 사용할 수 있습니다.

---

### dockerBuildPush.groovy (단일 서비스 빌드/푸시)
> **역할:** 단일 서비스의 소스 체크아웃, Docker 빌드 및 이미지 푸시를 자동화합니다. 단순한 서비스 배포에 적합합니다.
```groovy
def call(String appName, Map override = [:]) {
	def config = appConfig(appName, override)
	def repoUrl = config.appRepoUrl
	def imageName = config.imageName
	def dockerHost = config.dockerHost
	def versionTag = "v0.${env.BUILD_NUMBER}"
	def fullImage = "${imageName}:${versionTag}"
	stage("Checkout Source") {
		checkout([$class: 'GitSCM',
			userRemoteConfigs: [[url: repoUrl]]
		])
	}
	stage("Docker Build & Push") {
		docker.withServer(dockerHost) {
			sh """
				docker build -t ${fullImage} .
				docker push ${fullImage}
			"""
		}
	}
	echo "Build & Push 완료: ${fullImage}"
	return [ image: fullImage, tag: versionTag ]
}
```
**설명:**
서비스별 소스 체크아웃, Docker 빌드/푸시를 간단하게 처리합니다. appConfig에서 필요한 정보만 받아 최소한의 파라미터로 동작합니다.

---

### mvnDockerBuildPush.groovy (Maven 빌드 + Docker 통합)
> **역할:** Maven 빌드(자바/스프링 등)와 Docker 빌드/푸시를 한 번에 처리하는 통합 함수입니다. Java 기반 서비스에 최적화되어 있습니다.

```groovy
def call(String appName, Map override = [:]) {
	def cfg = appConfig(appName, override)
	def repoUrl = cfg.appRepoUrl
	def imageName = cfg.imageName
	def dockerHost = cfg.dockerHost
	def versionTag = "v0.${env.BUILD_NUMBER}"
	def fullImage = "${imageName}:${versionTag}"

  def mvnHome  = tool 'M3'
  def mvnCmd   = "${mvnHome}/bin/mvn -B"
  def runTests = (override.runTests ?: false)

	stage("Checkout Source") {
		checkout([$class: 'GitSCM',
			userRemoteConfigs: [[url: repoUrl]]
		])
	}
		stage('mvn build') {
			withEnv(["PATH=${mvnHome}/bin:${env.PATH}"]) {
				def goals = runTests ? "clean verify" : "clean package -DskipTests"
				sh """
				set -eu
				${mvnCmd} -V ${goals}
				"""
				// target/*.jar → 앱별 jarFileName 으로 맞춤 (Dockerfile COPY와 일치해야 함)
				sh """
				set -eu
				COUNT=\$(ls -1 target/*.jar 2>/dev/null | wc -l)
				if [ \"$COUNT\" -eq 0 ]; then
					echo \"[ERROR] target/*.jar 산출물을 찾지 못했습니다.\"; exit 1
				fi
				if [ \"$COUNT\" -gt 1 ]; then
					echo \"[WARN] JAR가 여러 개입니다. 첫 번째 파일만 사용합니다.\"
				fi
				SRC_JAR=\$(ls -1 target/*.jar | head -n 1)
				cp \"$SRC_JAR\" \"${jarFileName}\"
				ls -lh \"${jarFileName}\"
				"""
				// 산출물 보관 (빌드 산출물 + 복사된 jarFileName)
				archiveArtifacts artifacts: "target/*.jar, ${jarFileName}", fingerprint: true
			}
		}
	stage("Docker Build & Push") {
		docker.withServer(dockerHost) {
			sh """
				docker build -t ${fullImage} .
				docker push ${fullImage}
			"""
		}
	}
	echo "Build & Push 완료: ${fullImage}"
	return [ image: fullImage, tag: versionTag ]
}
```
**설명:**
Maven 빌드와 Docker 빌드/푸시를 한 번에 처리하는 통합 함수입니다. 빌드 산출물 JAR 파일을 app.jar로 복사해 Docker 이미지에 포함시킬 수 있습니다. appConfig에서 최소 정보만 받아 단순하게 동작합니다.

---

### updateManifest.groovy (Manifest 자동 업데이트)
> **역할:** manifest yaml의 이미지 태그를 새로 빌드된 태그로 치환합니다. 이 파일을 업데이트하면 ArgoCD 등 GitOps 도구가 변경을 감지해 자동으로 배포를 진행합니다.
```groovy
def call(String appName, Map builtImageInfo, Map override = [:]) {
	def cfg = appConfig(appName, override)
	def manifestDir = cfg.manifestDir
	def imageName = cfg.imageName
	stage("Update Manifest") {
		// manifest yaml 파일에서 이미지 태그만 치환
		sh "sed -i 's|image: .*$|image: ${imageName}:${builtImageInfo.tag}|' ${manifestDir}/*.yaml"
		// git add/commit/push 등 생략
	}
}
```
**설명:**
manifest yaml의 이미지 태그만 새로 빌드된 태그로 치환하는 간단한 예시입니다. 실제 운영에서는 git push, PR 생성 등 추가 작업이 필요합니다. 
이렇게 manifest가 변경되면 ArgoCD 같은 GitOps 툴이 변경을 감지해 자동으로 배포를 트리거합니다.

---

## Jenkinsfile 예시 (실제 적용)

실제 프로젝트에서 적용한 Spring-boot 애플리케이션 Jenkinsfile 예시 입니다. (간략히)
```groovy

@Library('jenkins-shared-lib') _
pipeline {
    agent any
    environment {
        APP_NAME = "service-a"
    }
    stages {
        stage('CI Stage') {
            steps {
                script {
                    builtImageInfo = mvnDockerBuildPush(APP_NAME)
                }
            }
        }
        stage("CD stage") {
            steps {
                script {
                    updateManifest(APP_NAME, builtImageInfo)
                }
            }
        }
    }
    post {
        always {
            echo "Pipeline finished for ${APP_NAME}"
        }
    }
}
```

## 빌드 성공 시 Pipeline 내역
![pipeline](/assets/images/2025-09-17/pipeline.webp)


---
## 마무리

Jenkins Shared Library와 GitOps 기반 파이프라인을 활용하면 반복적이고 복잡한 CI/CD 작업을 효과적으로 표준화하고 자동화할 수 있습니다.
조직 내 DevOps 효율성과 일관성을 높이고 싶다면 Shared Library 도입을 적극 추천합니다.
또한, 본 포스트에서는 핵심 개념만 다루었지만, 테스트, SonarQube 등 다양한 스테이지를 추가해 DevSecOps 파이프라인으로 확장하는 것도 가능합니다.

---

## 참고

- [Jenkins 공식 Shared Library 문서](https://www.jenkins.io/doc/book/pipeline/shared-libraries/)
- [ArgoCD 공식 문서](https://argo-cd.readthedocs.io/en/stable/)

