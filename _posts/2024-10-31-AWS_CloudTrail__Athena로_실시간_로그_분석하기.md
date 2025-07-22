---
title: "[AWS] CloudTrail + Athena로 실시간 로그 분석하기"
date: 2024-10-31 00:00:00 +0900
categories: ['AWS']
tags: ['athena', 'cloudtrail']
description: "AWS Cloudtrail을 통해 효과적인 모니터링 전략을 세워보자"
image: https://cdn-images-1.medium.com/max/800/0*ZsLoNcIrUUsaJSN0.png
---

이번 글에서는 AWS의 강력한 로그 분석 도구인 **CloudTrail** 과 **Athena** 를 이용해 보안을 강화하고 시스템 이벤트를 효과적으로 모니터링하는 방법을 알아보겠습니다.

**CloudTrail** 로그를 **Athena** 와 연동하여 쿼리 기반의 분석을 수행함으로써, 빠르고 효율적인 로그 조회와 검색이 가능합니다.

이 글에서는 각 서비스의 소개와 함께 기본 설정부터 실질적인 로그 분석까지 단계별로 살펴보겠습니다.

* * *

### AWS CloudTrail 소개

![](https://cdn-images-1.medium.com/max/800/0*ZsLoNcIrUUsaJSN0.png)

CloudTrail은 AWS 계정의 모든 API 호출 기록을 추적하는 서비스로, 사용자의 활동 및 AWS 리소스에 대한 변경사항을 로그로 남깁니다. 이를 통해 계정 내 발생하는 이벤트를 투명하게 파악할 수 있으며, 보안 모니터링 및 감사의 중요한 도구로 자리 잡고 있습니다.

CloudTrail의 주요 기능은 다음과 같습니다:

  * **AWS API 호출 기록** : AWS 계정 내 발생하는 모든 API 호출을 추적하고 로그로 남깁니다.
  * **로그 저장 및 분석** : 로그를 S3에 저장해 두고 Athena나 Amazon CloudWatch와 같은 분석 도구와 연계하여 조회 및 모니터링이 가능합니다.
  * **경고 및 알림 설정** : 특정 조건에 따라 알림을 설정하여, 중요한 보안 이벤트를 실시간으로 모니터링할 수 있습니다.



[**API 로그 - 표준화된 보안 로깅 서비스 - AWS CloudTrail - AWS**  
 _AWS CloudTrail은 AWS 계정의 거버넌스, 규정 준수, 운영 감사, 위험 감사를 지원합니다._ aws.amazon.com](https://aws.amazon.com/ko/cloudtrail/ "https://aws.amazon.com/ko/cloudtrail/")[](https://aws.amazon.com/ko/cloudtrail/)

* * *

### AWS Athena 소개

![](https://cdn-images-1.medium.com/max/800/0*fkbQU9QuA2Y9aq2h.jpeg)

Athena는 S3에 저장된 데이터를 [**SQL**](https://docs.aws.amazon.com/ko_kr/athena/latest/ug/ddl-sql-reference.html) 쿼리를 통해 분석할 수 있는 서버리스 데이터 분석 서비스입니다. 로그 데이터와 같은 구조화되지 않은 대규모 데이터에 특히 유용하며, 별도의 데이터베이스 설정 없이도 빠르게 데이터를 조회할 수 있습니다. CloudTrail과 함께 사용하면, S3에 저장된 로그 데이터를 Athena에서 바로 쿼리하여 분석할 수 있습니다.

Athena의 주요 기능은 다음과 같습니다:

  * **서버리스 환경** : 별도의 서버 설정 없이 S3 데이터를 쿼리할 수 있어 관리 부담이 적습니다.
  * **SQL 쿼리 지원** : 표준 SQL을 사용하여 데이터를 조회할 수 있어, 기존의 SQL 지식을 그대로 활용할 수 있습니다.
  * **확장성과 비용 효율성** : 저장된 데이터에 따라 요금이 부과되며, 필요한 경우에만 쿼리를 실행하므로 비용 효율적입니다.



[**대화형 SQL - 서버리스 쿼리 서비스 - Amazon Athena - AWS**  
 _Amazon Athena는 서버리스 방식의 대화형 분석 서비스입니다. 이 서비스를 사용하면 페타바이트 규모의 데이터를 데이터가 있는 위치에서 간편하고 유연한 방법으로 분석할 수 있습니다._ aws.amazon.com](https://aws.amazon.com/ko/athena/ "https://aws.amazon.com/ko/athena/")[](https://aws.amazon.com/ko/athena/)

* * *

### Demo 시작해보기

![](https://cdn-images-1.medium.com/max/800/1*Lv9xjnaAn5PcLu0QLr26JA.png)CloudTrail 로그를 수집하고 Athena에서 쉽게 분석할 수 있는 구조

### 1\. CloudTrail

#### 1–1. CloudTrail 추적 생성

1)**AWS Management Console** 에 로그인하고, **CloudTrail** 서비스로 이동합니다.

2) 왼쪽 메뉴에서 [추적]를 선택한 후, **[추적 생성]** 버튼을 클릭합니다.

![](https://cdn-images-1.medium.com/max/800/1*DupnTxLh5OpRdouj2hN09Q.png)

3)**추적 이름** 에 원하는 이름을 입력합니다. 예를 들어 `wj-cloudtrail`로 설정합니다.

4)**스토리지 위치** 섹션에서 **[새 S3 버킷 생성]** 을 선택하고, 버킷 이름을 입력합니다. 예를 들어 `wj-cloudtrail-logs-bucket`으로 설정합니다.

5) 로그 파일 SSE-KMS 암호화 등 추가 설정은 필요에 따라 구성합니다. (저는 설정하지 않았습니다.)

6) 로그 이벤트 선택에서는 기본값으로 설정 합니다.

7)**[추적 생성]** 버튼을 눌러 설정을 저장합니다.

![](https://cdn-images-1.medium.com/max/800/1*CnSpedbuZaDqyGi6Y9TRdw.png)![](https://cdn-images-1.medium.com/max/600/1*E471sa24dfBWeMMvRI61kw.png)

![](https://cdn-images-1.medium.com/max/600/1*NcdzmahOMlNGC57kJ3WKwA.png)![](https://cdn-images-1.medium.com/max/600/1*jB-zQU_xnRHBX0XBPUEKHw.png)

#### 1–2. S3 버킷 확인

1)**S3 콘솔** 로 이동하여 방금 생성한 버킷이 있는지 확인합니다.

![](https://cdn-images-1.medium.com/max/800/1*RYoecSWS4AJYM0FC86ETcQ.png)![](https://cdn-images-1.medium.com/max/600/1*Dp65A_1FELoZzjdB8HWcTA.png)

2) 버킷 내부에 **AWSLogs** 폴더가 자동으로 생성되었는지 확인합니다.

  * S3 버킷의 폴더에 CloudTrail 로그가 저장됩니다. **초기에 로그를 수집하는 데 약 5분 정도 소요될 수 있습니다.**
  * CloudTrail 로그는 시간이 지남에 따라 지속적으로 생성되고 버킷에 저장되어 쌓이게 됩니다.
  * **CloudTrail 로그를 S3에 저장하기 위해서는 전용 S3 버킷 정책이 필요합니다.** 하지만 CloudTrail을 생성하면서 S3 버킷을 함께 생성했다면, 해당 버킷 정책이 자동으로 설정됩니다. 이를 통해 추가적인 설정 없이도 로그가 정상적으로 저장됩니다.

![](https://cdn-images-1.medium.com/max/800/1*RN_Q30zhOTH0NI2C3oInaw.png)자동으로 설정된 버킷 정책

* * *

### 2\. Athena

#### 2–1. Athena 설정

1)**Athena** 서비스로 이동합니다.

2) 상단의 **[설정/관리]** 아이콘을 클릭하여 **쿼리 결과 위치** 를 방금 생성한 CloudTrail용 버킷으로 설정합니다.

![](https://cdn-images-1.medium.com/max/1000/1*SMrlpwpBUR6spMzkhTWbPw.png)![](https://cdn-images-1.medium.com/max/400/1*heFvgu2r_4rIJI6IFVd6wg.png)

![](https://cdn-images-1.medium.com/max/800/1*xIIH-iqM6VdtsBG3v-Ef_A.png)![](https://cdn-images-1.medium.com/max/600/1*tkqJmVnaVTp4ELDdkRyALg.png)

3) **[저장]** 버튼을 눌러 설정을 저장합니다.

4)**CloudTrail** 서비스의 **이벤트 기록** 으로 이동합니다.

![](https://cdn-images-1.medium.com/max/800/1*UQ-SNsePGqdev1UBaT2IWw.png)

5) **Athena** 테이블 [**생성]** 버튼을 누릅니다.

![](https://cdn-images-1.medium.com/max/800/1*0R3cq4ADygU8IoY0Oan42Q.png)

6) 스토리지 위치를 방금 생성한 `wj-cloudtrail-logs-bucket`으로 설정하고 [**테이블 생성**] 버튼을 누릅니다.

![](https://cdn-images-1.medium.com/max/800/1*M18d9E5pIGOpi9zR5nCjrQ.png)

> 예제
    
```sql    
CREATE EXTERNAL TABLE cloudtrail_logs_wj_cloudtrail_logs_bucket (  
    eventVersion STRING,  
    userIdentity STRUCT<  
        type: STRING,  
        principalId: STRING,  
        arn: STRING,  
        accountId: STRING,  
        invokedBy: STRING,  
        accessKeyId: STRING,  
        userName: STRING,  
        sessionContext: STRUCT<  
            attributes: STRUCT<  
                mfaAuthenticated: STRING,  
                creationDate: STRING>,  
            sessionIssuer: STRUCT<  
                type: STRING,  
                principalId: STRING,  
                arn: STRING,  
                accountId: STRING,  
                username: STRING>,  
            ec2RoleDelivery: STRING,  
            webIdFederationData: MAP<STRING,STRING>>>,  
    eventTime STRING,  
    eventSource STRING,  
    eventName STRING,  
    awsRegion STRING,  
    sourceIpAddress STRING,  
    userAgent STRING,  
    errorCode STRING,  
    errorMessage STRING,  
    requestParameters STRING,  
    responseElements STRING,  
    additionalEventData STRING,  
    requestId STRING,  
    eventId STRING,  
    resources ARRAY<STRUCT<  
        arn: STRING,  
        accountId: STRING,  
        type: STRING>>,  
    eventType STRING,  
    apiVersion STRING,  
    readOnly STRING,  
    recipientAccountId STRING,  
    serviceEventDetails STRING,  
    sharedEventID STRING,  
    vpcEndpointId STRING,  
    tlsDetails STRUCT<  
        tlsVersion: STRING,  
        cipherSuite: STRING,  
        clientProvidedHostHeader: STRING>  
)  
COMMENT 'CloudTrail table for wj-cloudtrail-logs-bucket bucket'  
ROW FORMAT SERDE 'org.apache.hive.hcatalog.data.JsonSerDe'  
STORED AS INPUTFORMAT 'com.amazon.emr.cloudtrail.CloudTrailInputFormat'  
OUTPUTFORMAT 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'  
LOCATION 's3://wj-cloudtrail-logs-bucket/AWSLogs/853881723062/CloudTrail/'  
TBLPROPERTIES ('classification'='cloudtrail');
```

#### 2–2. Athena 테이블 생성 확인 & 쿼리 실행

1) 생성된 테이블을 확인 합니다.

![](https://cdn-images-1.medium.com/max/800/1*HR39Qcd8e6cirBgdKIFxsQ.png)Athena에서 생성된 테이블을 확인할 수 있습니다.

2) 실행할 쿼리를 입력한 후 [**실행]** 버튼을 누릅니다.

  * **AWS** 공식 홈페이지에서 제공되는 예제로 진행 해 보았습니다.



[**CloudTrail 로그 쿼리 예제**  
 _다음 예제는 CloudTrail 이벤트 로그에 대해 생성된 테이블에서 모든 익명(서명되지 않은) 요청을 반환하는 쿼리의 일부를 보여줍니다. 이 쿼리는 useridentity.accountid 가 익명이고…_ docs.aws.amazon.com](https://docs.aws.amazon.com/ko_kr/athena/latest/ug/query-examples-cloudtrail-logs.html "https://docs.aws.amazon.com/ko_kr/athena/latest/ug/query-examples-cloudtrail-logs.html")[](https://docs.aws.amazon.com/ko_kr/athena/latest/ug/query-examples-cloudtrail-logs.html)

![](https://cdn-images-1.medium.com/max/800/1*X4tm-7fs4SK0dYBSllN5rw.png)

> 예제
    
```sql    
SELECT  
  useridentity.arn,  
  eventname,  
  sourceipaddress,  
  eventtime  
FROM cloudtrail_logs  
LIMIT 100;
```

  * **FROM cloutrail_logs** 부분을 방금 생성한 테이블 명 (`cloudtrail_logs_wj_cloudtrail_logs_bucket` ) 으로 변경합니다.

![](https://cdn-images-1.medium.com/max/800/1*loO8dLthnW1haugxPhqKew.png)테이블 명 변경![](https://cdn-images-1.medium.com/max/800/1*ZfSCSqHJ1kOjLUU6bmYlpQ.png)

  * 쿼리 결과는 화면에서 바로 확인할 수 있으며, 필요한 경우 버킷에서 **CSV** 나 **JSON** 형식으로 다운로드 가능합니다.



3) S3 버킷에서 쿼리 결과에 대한 파일들을 확인 합니다.

![](https://cdn-images-1.medium.com/max/800/1*arIGR6JBoUMOWwwhoAQP9g.png)![](https://cdn-images-1.medium.com/max/600/1*dMhgsnggioccBUpGO8qmoA.png)

4) 다른 리소스에 대한 쿼리도 한번 실행 시켜 봅니다.

  * **ec2** 관련 이벤트 쿼리 실행 해보기



> 예제

```sql    
SELECT * FROM "default"."cloudtrail_logs_wj_cloudtrail_logs_bucket" WHERE (eventsource='ec2.amazonaws.com');
```

![](https://cdn-images-1.medium.com/max/800/1*cMhf190CN5Cfkl87iU_cKQ.png)쿼리 결과 확인

* * *

### 마치며..

이렇게 AWS **CloudTrail** 과 **Athena** 를 활용해 로그를 효율적으로 수집하고 분석하는 방법을 알아보았습니다.   
이번 과정을 통해 시스템 내 다양한 이벤트와 보안 상태를 체계적으로 모니터링할 수 있는 기반을 마련할 수 있을 것입니다.

앞으로도 **AWS** 의 다양한 서비스들을 적극 활용하여 더욱 안전하고 효율적인 운영 환경을 구축하시기 바랍니다.