---
title: "[NCP] CLI를 통한 서버 생성과 웹 서비스 구현"
date: 2024-09-24 00:00:00 +0900
categories: ['NCP']
tags: ['cli']
description: "NCP CLI를 활용 해 보자"
image: https://cdn-images-1.medium.com/max/800/1*qT_CNWUROdrOgSbCRtcXbQ.png
---

저번 포스트에서 **Ncloud CLI** 를 이용하여 리소스 확인법에 대해 알아보았습니다.

[**[NCLOUD] CLI를 통한 리소스 확인 법**  
 _Ncloud CLI를 활용 해 보자_ medium.com](https://medium.com/brickmate-cloud/ncp-cli%EB%A5%BC-%ED%86%B5%ED%95%9C-%EB%A6%AC%EC%86%8C%EC%8A%A4-%ED%99%95%EC%9D%B8-%EB%B2%95-bbf0d1029bb4 "https://medium.com/brickmate-cloud/ncp-cli%EB%A5%BC-%ED%86%B5%ED%95%9C-%EB%A6%AC%EC%86%8C%EC%8A%A4-%ED%99%95%EC%9D%B8-%EB%B2%95-bbf0d1029bb4")[](https://medium.com/brickmate-cloud/ncp-cli%EB%A5%BC-%ED%86%B5%ED%95%9C-%EB%A6%AC%EC%86%8C%EC%8A%A4-%ED%99%95%EC%9D%B8-%EB%B2%95-bbf0d1029bb4)

이번 주제에서는 **Ncloud CLI** 를 이용하여 **VPC, Subnet, Server** 를 생성하는 포스트를 작성 해 보겠습니다.

* * *

![](https://cdn-images-1.medium.com/max/800/1*EcMYHHXgTHQ7KMhxg0a4-w.png)**CLI를 통해 구성 할 Infra 아키텍처 입니다.**

* * *

### 개요

### 1\. CLI를 통한 VPC 생성

### 2\. CLI를 통한 Subnet 생성

### 3\. CLI를 통한 Server 생성

>  _대상 서버 및_** _Ncloud CLI_** _설치 법은 이전 포스트를 참고 부탁드립니다 !_

* * *

#### 1\. CLI를 통한 VPC 생성

  * 요청 파라미터

![](https://cdn-images-1.medium.com/max/800/1*1ioYgyMtb6ddOsQ8CC4GZA.png)

  * 예시

```bash    
./ncloud vpc createVpc --regionCode KR --vpcName test-*** --ipv4CidrBlock ***.***.0.0/16


./ncloud vpc createVpc - regionCode KR - vpcName cli-test-vpc - ipv4CidrBlock 10.1.0.0/16
```
  * 생성 할 **VPC name** , **CIDR** 를 명시 합니다.
  * **CLI 실행**

```bash
root@cli-server:~/cli_linux# ./ncloud vpc createVpc --regionCode KR --vpcName cli-test-vpc --ipv4CidrBlock 10.1.0.0/16  

{  
  "createVpcResponse": {  
    "totalRows": 1,  
    "vpcList": [  
      {  
        "vpcNo": "76248",  
        "vpcName": "cli-test-vpc",  
        "ipv4CidrBlock": "10.1.0.0/16",  
        "vpcStatus": {  
          "code": "INIT",  
          "codeName": "준비중"  
        },  
        "regionCode": "KR",  
        "createDate": "2024-09-24T17:35:25+0900"  
      }  
    ],  
    "requestId": "89e3185b-b43e-4280-874c-e7b2a2f0496e",  
    "returnCode": "0",  
    "returnMessage": "success"  
  }  
}
```
![](https://cdn-images-1.medium.com/max/800/1*BRZbsdLVBYOVJmFUymZw3A.png)
    
```bash    
root@cli-server:~/cli_linux# ./ncloud vpc getVpcList --regionCode KR --vpcStatusCode RUN  
{  
  "getVpcListResponse": {  
    "totalRows": 3,  
    "vpcList": [  
      {  
        "vpcNo": "76248", #VPC No 확인  
        "vpcName": "cli-test-vpc",  
        "ipv4CidrBlock": "10.1.0.0/16",  
        "vpcStatus": {  
          "code": "RUN",  
          "codeName": "운영중"  
        },  
        "regionCode": "KR",  
        "createDate": "2024-09-24T17:35:25+0900"  
      }  
    ],  
    "requestId": "d2dd5d86-4e42-47d2-b335-138a38499934",  
    "returnCode": "0",  
    "returnMessage": "success"  
  }  
}
```
  * 콘솔 및 VPC 조회 CLI로 VPC가 생성 된 것을 확인 할 수 있습니다.



* * *

#### 2\. CLI를 통한 Subnet 생성

  * 요청 파라미터

![](https://cdn-images-1.medium.com/max/800/1*ZmkAw_GpHU1Vc1vgu1k-bA.png)

  * 예시
```bash  
./ncloud vpc createSubnet --regionCode KR --zoneCode KR-1 --vpcNo ***04 --subnetName test-*** --subnet ***.***.1.0/24 --networkAclNo ***31 --subnetTypeCode PUBLIC --usageTypeCode GEN
```
  * **일반 Public Subnet** 을 생성
  * **VPC & NACL & Region** 정보 명시



>  _파라미터에_** _NACL_** _정보가 필요하기 때문에_** _NACL_** _정보 조회를 먼저 합니다. (콘솔에서도 확인 가능)_
    
```bash    
root@cli-server:~/cli_linux# ./ncloud vpc getNetworkAclList --regionCode KR  
{  
  "getNetworkAclListResponse": {  
    "totalRows": 3,  
    "networkAclList": [  
      {  
        "networkAclNo": "111301", #No 확인  
        "networkAclName": "cli-test-vpc-default-network-acl",  
        "vpcNo": "76248",  
        "networkAclStatus": {  
          "code": "RUN",  
          "codeName": "운영중"  
        },  
        "networkAclDescription": "VPC [cli-test-vpc] default Network ACL",  
        "createDate": "2024-09-24T17:35:25+0900",  
        "isDefault": true  
      },  
    "requestId": "2460fcaf-daac-41aa-96a5-8d0178e34bff",  
    "returnCode": "0",  
    "returnMessage": "success"  
  }  
}
```

  * **CLI 실행**

```bash    
./ncloud vpc createSubnet --regionCode KR --zoneCode KR-1 --vpcNo 76248 --subnetName cli-test-pub-web-subnet-kr1 --subnet 10.1.16.0/24 --networkAclNo 111301 --subnetTypeCode PUBLIC --usageTypeCode GEN


root@cli-server:~/cli_linux# ./ncloud vpc createSubnet --regionCode KR --zoneCode KR-1 --vpcNo 76248 --subnetName cli-test-pub-web-subnet-kr1 --subnet 10.1.16.0/24 --networkAclNo 111301 --subnetTypeCode PUBLIC --usageTypeCode GEN  
{  
  "createSubnetResponse": {  
    "totalRows": 1,  
    "subnetList": [  
      {  
        "subnetNo": "174257",  
        "vpcNo": "76248",  
        "zoneCode": "KR-1",  
        "subnetName": "cli-test-pub-web-subnet-kr1",  
        "subnet": "10.1.16.0/24",  
        "subnetStatus": {  
          "code": "CREATING",  
          "codeName": "생성중"  
        },  
        "createDate": "2024-09-24T17:44:22+0900",  
        "subnetType": {  
          "code": "PUBLIC",  
          "codeName": "Public"  
        },  
        "usageType": {  
          "code": "GEN",  
          "codeName": "General"  
        },  
        "networkAclNo": "111301"  
      }  
    ],  
    "requestId": "9443c84d-3185-4ed8-acf8-3ebabadaf551",  
    "returnCode": "0",  
    "returnMessage": "success"  
  }  
}
```
![](https://cdn-images-1.medium.com/max/800/1*uIwDCZ9OJDddVIJLijl8wQ.png)

  * 콘솔에서 Subnet이 생성 된 것을 확인 할 수 있습니다.



* * *

#### 3\. CLI를 통한 Server 생성

  * 요청 파라미터 (아래 가이드 확인)



<https://cli.ncloud-docs.com/docs/cli-vserver-server-createserverinstances>

  * 예시

```bash    
ncloud vserver createServerInstances --regionCode KR --serverImageProductCode SW.VSVR.OS.LNX64.CNTOS.0703.B050 --vpcNo ***04 --subnetNo ***43 --serverProductCode SVR.VSVR.STAND.C002.M004.NET.SSD.B050.G001 --feeSystemTypeCode MTRAT --serverCreateCount 1 --serverName test-*** --networkInterfaceList "networkInterfaceOrder='0', accessControlGroupNoList=['***63', '***64']" "networkInterfaceOrder='1', subnetNo='***43', accessControlGroupNoList=['***63', '***64']" --placementGroupNo ***61 --isProtectServerTermination false --initScriptNo ***44 --loginKeyName test-*** --associateWithPublicIp true
```

> ** _서버 정보_**

>  _OS : CentOS 7.8_

>  _Spec : vCPU 2EA, Memory 4GB, [SSD]Disk 50GB_

>  _저는 미리 생성 해 둔 I_** _nit Script_** _를 통해 서버 생성 시 바로 웹 서비스(_**_Apache_** _)를 동작하게 만들어 보겠습니다._

  * **VPC & NACL & ACG & Init Script** 정보 명시
  * 사전에 등록/보유중인 키페어 명시



> **ACG & Init Script 정보 조회 CLI (콘솔에서도 확인 가능)**
    
```bash    
# Get Init Script List(info)  
./ncloud vserver getInitScriptList   
  
# Get ACG List(Info)  
./ncloud vserver getAccessControlGroupList --regionCode KR --vpcNo  --accessControlGroupStatusCode RUN
```

  * **CLI 실행**


    
```bash    
root@cli-server:~/cli_linux# ./ncloud vserver createServerInstances --regionCode KR --serverImageProductCode SW.VSVR.OS.LNX64.CNTOS.0708.B050 --vpcNo 76248 --subnetNo 174257 --serverProductCode SVR.VSVR.HICPU.C002.M004.NET.SSD.B050.G002 --feeSystemTypeCode MTRAT --serverCreateCount 1 --serverName cli-test-web-kr1 --networkInterfaceList "networkInterfaceOrder='0', accessControlGroupNoList=['204589']" --isProtectServerTermination false --initScriptNo 63194 --loginKeyName  clova-test --associateWithPublicIp true  

{  
  "createServerInstancesResponse": {  
    "totalRows": 1,  
    "serverInstanceList": [  
      {  
        "serverInstanceNo": "26695183",  
        "serverName": "cli-test-web-kr1",  
        "serverDescription": "",  
        "cpuCount": 2,  
        "memorySize": 4294967296,  
        "platformType": {  
          "code": "LNX64",  
          "codeName": "Linux 64 Bit"  
        },  
        "loginKeyName": "clova-test",  
        "publicIpInstanceNo": "",  
        "publicIp": "",  
        "serverInstanceStatus": {  
          "code": "INIT",  
          "codeName": "서버 INIT 상태"  
        },  
        "serverInstanceOperation": {  
          "code": "NULL",  
          "codeName": "서버 NULL OP"  
        },  
        "serverInstanceStatusName": "init",  
        "createDate": "2024-09-24T18:16:19+0900",  
        "uptime": "2024-09-24T18:16:19+0900",  
        "serverImageProductCode": "SW.VSVR.OS.LNX64.CNTOS.0708.B050",  
        "serverProductCode": "SVR.VSVR.HICPU.C002.M004.NET.SSD.B050.G002",  
        "isProtectServerTermination": false,  
        "zoneCode": "KR-1",  
        "regionCode": "KR",  
        "vpcNo": "",  
        "subnetNo": "",  
        "networkInterfaceNoList": [],  
        "initScriptNo": "63194",  
        "serverInstanceType": {  
          "code": "HICPU",  
          "codeName": "High CPU"  
        },  
        "baseBlockStorageDiskType": {  
          "code": "NET",  
          "codeName": "네트웍 스토리지"  
        },  
        "baseBlockStorageDiskDetailType": {  
          "code": "SSD",  
          "codeName": "SSD"  
        },  
        "placementGroupNo": "",  
        "placementGroupName": "",  
        "memberServerImageInstanceNo": "",  
        "hypervisorType": {  
          "code": "XEN",  
          "codeName": "XEN"  
        },  
        "serverImageNo": "16187001",  
        "serverSpecCode": "c2-g2-s50"  
      }  
    ],  
    "requestId": "6e49efcb-f58e-4a9b-a1a5-082092e9674b",  
    "returnCode": "0",  
    "returnMessage": "success"  
  }  
}
```
  * CLI 실행 후 시간이 조금 지났다면 콘솔을 접속 하여 생성 된 서버를 확인 할 수 있습니다.

![](https://cdn-images-1.medium.com/max/800/1*RwphmN7l-INAe6CJ5K94eQ.png)

  * **ACG Inbound Rule 수정**



>  _서버에_** _Apache_** _를 설치 했기에 Inbound Rule 에 80 port를 추가 합니다._

![](https://cdn-images-1.medium.com/max/800/1*P-pMyMVNi_F0L91KP7UwEQ.png)

  * 공인 IP:80 접속 테스트



>  _브라우저에서 웹 서비스가 정상적으로 동작하는지 확인 합니다._

![](https://cdn-images-1.medium.com/max/800/1*cJbowPAqFtOZHBXotKoLhA.png)

* * *

### 마치며..

이번 주제에서 Ncloud CLI를 통해 리소스 생성법에 대해 알아보았습니다.

해당 포스트에서 소개 하지 않은 리소스들 (EX: Loadbalancer , ETC )도 많기 때문에 더 많은 CLI 사용법에 대해 알고 싶으신 분들은 아래 가이드 링크에서 확인 부탁드립니다 !

[**CLI 개요**  
 _Classic/VPC 환경에서 이용 가능합니다. 네이버 클라우드 플랫폼에서 제공하는 서비스와 솔루션을 효과적으로 관리할 수 있도록 CLI(Command Line Interface, 명령줄 인터페이스)를 제공하고…_ cli.ncloud-docs.com](https://cli.ncloud-docs.com/docs/guide "https://cli.ncloud-docs.com/docs/guide")[](https://cli.ncloud-docs.com/docs/guide)

감사합니다.