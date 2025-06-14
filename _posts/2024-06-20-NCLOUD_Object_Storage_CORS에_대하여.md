---
title: "[NCP] Object Storage CORS에 대하여"
date: 2024-06-20 00:00:00 +0900
categories: ['NCP']
tags: ['cli', 'cors', 'NCP', 's3']
description: "[NCP] Object Storage CORS에 대하여"
image: https://cdn-images-1.medium.com/max/800/0*vhxV4g72RJ3lInbP.png
---

# [NCP] Object Storage CORS에 대하여

Cross-Origin Resource Sharing? 실제 사례를 통해 이해해보자

---

## Object Storage란?

Object Storage는 파일 및 데이터를 객체 단위로 저장/관리하는 클라우드 스토리지 방식입니다. 각 객체는 고유한 식별자와 메타데이터를 갖고, 대용량 데이터의 저장 및 관리에 적합합니다.

### 주요 특징

1. **확장성**: 필요에 따라 무한히 확장 가능
2. **내구성**: 복제본을 통해 높은 내구성 보장
3. **유연성**: 다양한 데이터 형식 지원, 메타데이터 활용 가능
4. **접근성**: HTTP/HTTPS 기반으로 어디서나 접근 가능

### 활용 사례

- 백업 및 아카이브
- 멀티미디어 콘텐츠 저장
- 데이터 레이크 구성
- 웹 애플리케이션의 데이터 저장소

---

## CORS란?

CORS(Cross-Origin Resource Sharing)는 웹 애플리케이션이 **다른 출처(origin)** 의 리소스에 접근할 수 있도록 허용하는 메커니즘입니다.

브라우저는 기본적으로 보안상의 이유로 교차 출처 요청을 차단하지만, CORS 설정을 통해 이를 허용할 수 있습니다.

![CORS 개념도](https://cdn-images-1.medium.com/max/800/0*vhxV4g72RJ3lInbP.png)

### CORS가 필요한 이유

프론트엔드에서 다른 출처의 API나 이미지 리소스를 요청할 때 CORS 정책이 없으면 아래와 같은 오류가 발생할 수 있습니다:

```js
fetch('https://kr.objectstorage.ncloud.com/your-bucket/sample-image.jpg')
  .then(response => response.blob())
  .then(imageBlob => {
    const imageURL = URL.createObjectURL(imageBlob);
    document.getElementById('image').src = imageURL;
  })
  .catch(error => console.error('Error fetching image:', error));
```

**CORS 설정이 없을 경우:**

```
Access to XMLHttpRequest at 'https://kr.objectstorage.ncloud.com/cors-test/cors-test.txt'
from origin 'http://cors-test.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

---

## NCP Object Storage에서 CORS 설정하기

### 방법 1. AWS CLI 사용

> CLI 설치 및 인증은 [공식 가이드](https://cli-gov.ncloud-docs.com/docs/guide-objectstorage) 참고

#### 1. cors.json 파일 생성

```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedOrigins": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

> 특정 도메인만 허용하고 싶다면 `"*"` 대신 `"http://example.com"` 식으로 작성 가능

#### 2. 명령어로 버킷에 적용

```bash
aws --endpoint-url=https://kr.object.ncloudstorage.com \
  s3api put-bucket-cors \
  --bucket arnold-cors-test \
  --cors-configuration file://cors.json
```

#### 3. 설정 확인

```bash
aws --endpoint-url=https://kr.object.ncloudstorage.com \
  s3api get-bucket-cors \
  --bucket arnold-cors-test
```

---

### 방법 2. Python 코드로 설정

```python
import boto3

endpoint_url = 'https://kr.object.ncloudstorage.com'
access_key = 'ACCESS_KEY'
secret_key = 'SECRET_KEY'
bucket_name = 'arnold-cors-test'

s3 = boto3.client('s3', endpoint_url=endpoint_url,
                  aws_access_key_id=access_key,
                  aws_secret_access_key=secret_key)

cors_configuration = {
    'CORSRules': [{
        'AllowedHeaders': ['*'],
        'AllowedMethods': ['GET', 'PUT', 'POST'],
        'AllowedOrigins': ['*'],
        'MaxAgeSeconds': 3000
    }]
}

s3.put_bucket_cors(Bucket=bucket_name, CORSConfiguration=cors_configuration)
response = s3.get_bucket_cors(Bucket=bucket_name)
print(response['CORSRules'])
```

---

## 번외: CDN + 서비스와 연동한 경우

CDN + Object Storage 연동 시, Object Storage에 직접 CORS 설정을 하지 않아도 **CDN 사용자 응답 헤더 수정 기능**을 통해 허용 가능합니다.

![CDN 사용자 응답 헤더 설정 예시](https://cdn-images-1.medium.com/max/800/1*6fLCw6-rP85jxfe68hkGrQ.png)

---

## 마치며

이번 글에서는 Object Storage의 개념과 함께, 웹 애플리케이션에서 자주 마주치는 CORS 문제와 이를 해결하는 실습 방법을 정리해 보았습니다.

- CORS 오류는 프론트에서 이미지, 데이터 요청 시 자주 발생하는 문제
- NCP에서는 CLI 또는 코드로 CORS 정책 설정 필요

감사합니다.