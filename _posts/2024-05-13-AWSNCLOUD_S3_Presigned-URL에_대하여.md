---
title: "[AWS/NCLOUD] S3 Presigned-URL에 대하여"
date: 2024-05-13 00:00:00 +0900
categories: ['AWS']
tags: ['s3']
description: "클라우드 환경에서 Presigned URL을 활용 해보자"
image: https://cdn-images-1.medium.com/max/800/1*iknT9-qjY3mbVL3021LNtw.png
---

이번 시간에는 **Presigned-URL** 에 대해 알아가는 시간을 가져보겠습니다.

### 개요

  1. Presigned URL이란
  2. Presigned URL의 필요성
  3. AWS S3 Presigned URL 생성  
\- AWS 콘솔에서 생성  
\- AWS CLI로 생성
  4. NCP Object Storage Presigned URL 생성  
\- AWS CLI로 생성



* * *

### Presigned-URL 이란 ?

클라우드 스토리지 서비스에서 제공하는 기능으로, 사용자가 생성한 URL을 통해 지정된 시간 동안 서버의 자원(파일 등)에 접근할 수 있게 해주는 임시 링크입니다. 이 URL은 서버에 저장된 자원에 대한 요청을 사전에 승인하며, 서명된 쿼리 파라미터를 포함하여 생성됩니다. URL은 생성 시 설정한 유효 기간 동안만 유효하며, 이 기간이 지나면 자동으로 접근이 불가능해집니다.

* * *

### Presigned URL의 필요성

  * **보안 강화** : 자원에 대한 접근을 허가받은 사용자만이 제한된 시간 동안 접근할 수 있도록 함으로써, 미인증 접근을 방지하고 데이터 보안을 유지할 수 있습니다.
  * **대역폭 관리** : 자원에 대한 접근을 관리함으로써, 불필요한 트래픽과 비용을 줄일 수 있습니다.
  * **사용 편의성** : 사용자가 직접 서버에 접속하지 않고도 필요한 자원을 안전하게 다운로드하거나 업로드할 수 있게 해주므로, 사용자 경험을 향상시킬 수 있습니다.
  * **컨텐츠 배포** : 특히 미디어 파일이나 대용량 데이터를 시간 제한이 있는 링크를 통해 배포할 때 유용하며, 컨텐츠 제공자가 자원의 배포를 효율적으로 관리할 수 있습니다.



* * *

> _예를 들어, 온라인 교육 플랫폼에서 강사가 학생들에게 특정 자료를 제공하려 할 때, 강사는 파일을 클라우드 스토리지에 업로드하고 그 파일에 대한_** _presigned URL_** _을 생성합니다. 이_** _URL_** _을 학생들에게 공유하면, 학생들은 설정된 시간(예: 24시간) 동안 해당 파일을 다운로드할 수 있습니다. 시간이 지나면 URL은 자동으로 만료되어 더 이상 접근할 수 없게 되므로, 외부인의 무단 다운로드를 방지할 수 있습니다._

* * *

### AWS S3 Presigned URL 생성

  * AWS 에서 Presigned Url 을 발급 받는 방법은 콘솔을 이용하는 방법과 CLI 를 통해 발급 받는 방법이 있습니다.
  * 먼저 테스트용 S3 버킷을 생성 한 후 버킷 내부에 이미지 파일을 업로드 하였습니다.



![](https://cdn-images-1.medium.com/max/800/1*87tX0xqnFv6Iw16i2y9x0w.png)![](https://cdn-images-1.medium.com/max/600/1*H4W-UnobkdWoAKDwTayfxg.png)

  * Presigned URL을 발급 받기 전에 먼저 이미지 파일 주소로 접속을 해서 접속 가능 여부를 확인 합니다.

![](https://cdn-images-1.medium.com/max/800/1*w8v1sVWlmm9hZJYghwyMrw.png)

  * 권한이 없어 이미지 파일을 불러오지 못하는 것을 확인 할 수 있습니다.



* * *

#### AWS 콘솔에서 생성

>  _객체(이미지) 파일 선택 - > 작업 -> 미리 서명된 URL와 공유 -> 1분으로 설정 -> URL 생성_

![](https://cdn-images-1.medium.com/max/1200/1*3NQOID9LwsQuL2WIvdj2eg.png)

![](https://cdn-images-1.medium.com/max/800/1*8jtWA_qWpIXAn1DfdZNoyw.png)

![](https://cdn-images-1.medium.com/max/1200/1*upQEzVmaBeiPLZCW7dokXg.png)

![](https://cdn-images-1.medium.com/max/800/1*SGOggOz9muVbSyWCunm_3g.png)

  * 복사된 URL로 접속 해 보면 아까 권한이 없던 이미지를 1분간 확인 할 수 있습니다. (_제가 존경하는 롤모델입니다.. 🦾_)



* * *

#### AWS CLI로 Presigned URL 발급 받기

>  _사전에 IAM에 **AmazonS3FullAccess** 권한 추가 및 **Access KEY & Secret KEY 확인** 필요 !_

  * 터미널에서 접속 후 AWS 자격증명 및 계정 확인

    
    
    ```bash
    MacBook-Pro-2 ~ % aws configure  
    AWS Access Key ID [****************188D]: Access key ID 입력  
    AWS Secret Access Key [****************4F75]: Secret key 입력  
    Default region name [ap-northeast-2]: enter  
    Default output format [json]: enter
    
    
    MacBook-Pro-2 ~ % aws sts get-caller-identity  
    {  
        "UserId": "생략",  
        "Account": "생략",  
        "Arn": "생략:user/USER 명"  
    } 
    ```
    
    
  * Presigned URL 발급하기


    ```bash
    
    aws s3 presign s3://파일경로 --region ap-northeast-2 --expires-in 만료기간(초)
    
    
    MacBook-Pro-2 ~ % aws s3 presign s3://bm-presigned-url-test/Arnold.png --region ap-northeast-2 --expires-in 15  
      
    # 아래에 Presigned URL 발급 된 것 확인하기   
      
    https://bm-presigned-url-test.s3.ap-northeast-2.amazonaws.com/Arnold.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA4NT2RDC3GDVH5QZD%2F20240513%2Fap-northeast-2%2Fs3%2Faws4_request&X-Amz-Date=20240513T101239Z&X-Amz-Expires=15&X-Amz-SignedHeaders=host&X-Amz-Signature=b237708503c088eea4a3406bb1dfcf2bd5a842e0db6aa4fe2b0c1fcd8cc7ff17
    ```

  * URL로 접속 해보기

![](https://cdn-images-1.medium.com/max/800/1*FXlraK4R8-jEEfP5o4Ox0A.png)

* * *

### NCP Object Storage Presigned(Signed) URL 생성

#### AWS CLI로 생성

>  _NCP Object Storage는 콘솔(GUI)에서 Presigned URL 생성을 지원 하지 않습니다._

![](https://cdn-images-1.medium.com/max/800/1*TYled9AHq9s-6eXkzXr8Uw.png)

  * 테스트용 버킷에 이미지를 하나 추가 하였습니다.



* * *

#### Access KEY & Secret KEY 확인

> NCP 포털 > 마이페이지 > 계정관리 > 인증키 관리

![](https://cdn-images-1.medium.com/max/800/1*fFPEGY2gc3ESFUZtnxNJRQ.png)

* * *

  * 터미널에서 접속 후 NCP (AWS) 자격증명


    ```bash
    
    MacBook-Pro-2 ~ % aws configure  
    AWS Access Key ID [****************188D]: Access key ID 입력  
    AWS Secret Access Key [****************4F75]: Secret key 입력  
    Default region name [ap-northeast-2]: enter  
    Default output format [json]: enter
    ```

  * 이미지 파일 URL 확인하기

![](https://cdn-images-1.medium.com/max/800/1*eG-tgZiUBPmophQcXeocKA.png)

  * Presigned URL 발급하기


    ```bash
    
    aws --endpoint-url=https://kr.object.ncloudstorage.com s3 presign s3://버킷명/파일명 --expires-in 만료기간(초)  
      
    # Object Storage도 AWS CLI를 지원 하지만, S3와 EndPoint가 다르기 때문에 --endpoint-url로 경로를 잡아줘야 됩니다.
    
    
    MacBook-Pro-2 ~ % aws --endpoint-url=https://kr.object.ncloudstorage.com s3 presign s3://bm-object-storage/jenkins.png --expires-in 60  
    # 아래에 Presigned URL 발급 된 것 확인하기  
      
    https://bm-object-storage.kr.object.ncloudstorage.com/jenkins.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=603F20D2573C48A383E5%2F20240514%2Fap-northeast-2%2Fs3%2Faws4_request&X-Amz-Date=20240514T020127Z&X-Amz-Expires=60&X-Amz-SignedHeaders=host&X-Amz-Signature=7b779747671c3d36305b2f4823116a8292c320a74b484973cc4eef0c3b2c1d8e
    ```

  * URL로 접속 해보기

![](https://cdn-images-1.medium.com/max/800/1*OfsOxjREyAtUACC8PQCtJw.png)

* * *

오늘은 Presigned URL에 대해 알아보았습니다.

해당 기술을 서버 내에서 생성 하는 로직을 구현 할 수도 있고, 더 많은 방법이 있기 때문에 (SDK 등)잘 활용하면 좋을 것 같습니다.