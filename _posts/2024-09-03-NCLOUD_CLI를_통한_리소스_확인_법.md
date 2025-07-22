---
title: "[NCP] CLI를 통한 리소스 확인 법"
date: 2024-09-03 00:00:00 +0900
categories: ['NCP']
tags: ['cli', 'server', 'ssh']
description: "NCP CLI를 활용 해 보자"
image: https://cdn-images-1.medium.com/max/800/1*tSPy2aIX-xYw2edGvBRoRg.png
---

NCP(네이버 클라우드 플랫폼)에서는 제공하는 서비스와 솔루션을 효과적으로 관리할 수 있도록 CLI(Command Line Interface, 명령줄 인터페이스)를 제공하고 있습니다.

Linux와 Windows에서 개발 도구를 설치하고 구성한 후 네이버 클라우드 플랫폼의 다양한 서비스들을 명령줄에서 제어하고 스크립트를 개발하여 자동화할 수 있습니다. 크게 기본 CLI, 호환 CLI로 구분할 수 있습니다.

* * *

이번 주제에서는 NCP CLI를 이용해서 사용중인 클라우드 리소스 확인 법에 대해 알아보겠습니다.

저는 간단하게 운영중인 테스트 서버에서 VPC, Subnet, Server 를 조회 해 보도록 하겠습니다.

* * *

### 개요

#### 1\. NCP CLI 설치

#### 2\. CLI를 통한 VPC 조회

#### 3\. CLI를 통한 Subnet 조회

#### 4\. CLI를 통한 Server 조회

* * *

#### 1\. NCP CLI 설치

  * 사전에 대상 서버 보유 & 인증키 발급 필요



**Access KEY & Secret KEY 확인법**

>  _NCP 포털 > 마이페이지 > 계정관리 > 인증키 관리_

![](https://cdn-images-1.medium.com/max/800/1*tQDYTX5627rPMGgFS77zqA.png)

  * 서버 SSH 접속 -> wget 명렁어 실행 -> 압축 해제 -> Key 값 입력

```bash    
$ wget https://www.ncloud.com/api/support/download/5/65  
  
--2024-09-03 12:59:29--  https://www.ncloud.com/api/support/download/5/65  
www.ncloud.com (www.ncloud.com) 해석 중... 110.165.28.15, 110.165.28.14  
다음으로 연결 중: www.ncloud.com (www.ncloud.com)|110.165.28.15|:443... 연결했습니다.  
HTTP 요청을 보냈습니다. 응답 기다리는 중... 200 OK  
길이: 237885515 (227M) [application/zip]  
저장 위치: '65'  
  
  
$ unzip 65  
  
$ cd cli_linux/  
$ chmod 755 -R *  
  
$ ./ncloud configure  
  
$ set [DEFAULT]'s configuration.  
Ncloud Access Key ID []: api-key  
Ncloud Secret Access Key []: secret-key  
Ncloud API URL (default:https://ncloud.apigw.ntruss.com) []: (Enter)  s
```   
  

* ncloud script 를 실행 후 Access key ID 및 Secret Access Key를 입력 해야합니다.



#### 2\. CLI를 통한 VPC 조회

  * VPC 조회
    
```bash
$ ~/cli_linux# ./ncloud vpc getVpcList --regionCode KR --vpcStatusCode RUN

root@test-server:~/cli_linux# ./ncloud vpc getVpcList --regionCode KR --vpcStatusCode RUN  
{  
  "getVpcListResponse": {  
    "totalRows": 2,  
    "vpcList": [  
      {  
        "vpcNo": "62764",  
        "vpcName": "test-vpc",  
        "ipv4CidrBlock": "192.168.0.0/16",  
        "vpcStatus": {  
          "code": "RUN",  
          "codeName": "운영중"  
        },  
        "regionCode": "KR",  
        "createDate": "2024-05-10T14:21:54+0900"  
      },  
      {  
        "vpcNo": "46814",  
        "vpcName": "bm-vpc-test",  
        "ipv4CidrBlock": "10.0.0.0/16",  
        "vpcStatus": {  
          "code": "RUN",  
          "codeName": "운영중"  
        },  
        "regionCode": "KR",  
        "createDate": "2023-09-19T10:36:01+0900"  
      }  
    ],  
    "requestId": "18ab542e-b69b-4efa-b4b9-d62648550a53",  
    "returnCode": "0",  
    "returnMessage": "success"  
  }  
}  
```

  * CLI 실행 시 VPC CIDR 대역, ZONE, VPC 이름, 생성 일자등을 확인 할 수 있습니다.



#### 3\. CLI를 통한 Subnet 조회
    
```bash    
$ ~/cli_linux# ./ncloud vpc getSubnetList


root@clova-server:~/cli_linux# ./ncloud vpc getSubnetList  
{  
  "getSubnetListResponse": {  
    "totalRows": 13,  
    "subnetList": [  
      {  
        "subnetNo": "170049",  
        "vpcNo": "46814",  
        "zoneCode": "KR-1",  
        "subnetName": "priv-subnet",  
        "subnet": "10.0.120.0/24",  
        "subnetStatus": {  
          "code": "RUN",  
          "codeName": "운영중"  
        },  
        "createDate": "2024-08-29T12:29:38+0900",  
        "subnetType": {  
          "code": "PRIVATE",  
          "codeName": "Private"  
        },  
        "usageType": {  
          "code": "GEN",  
          "codeName": "General"  
        },  
        "networkAclNo": "71994"  
      },  
      {  
        "subnetNo": "169393",  
        "vpcNo": "46814",  
        "zoneCode": "KR-1",  
        "subnetName": "saas-lb-subnet",  
        "subnet": "10.0.99.0/24",  
        "subnetStatus": {  
          "code": "RUN",  
          "codeName": "운영중"  
        },  
        "createDate": "2024-08-27T11:04:18+0900",  
        "subnetType": {  
          "code": "PUBLIC",  
          "codeName": "Public"  
        },  
        "usageType": {  
          "code": "LOADB",  
          "codeName": "LoadBalancer Only"  
        },  
        "networkAclNo": "71994"  
      },  
      {  
        "subnetNo": "163555",  
        "vpcNo": "46814",  
        "zoneCode": "KR-1",  
        "subnetName": "bm-test-nat-sub",  
        "subnet": "10.0.142.0/24",  
        "subnetStatus": {  
          "code": "RUN",  
          "codeName": "운영중"  
        },  
        "createDate": "2024-07-25T15:53:00+0900",  
        "subnetType": {  
          "code": "PUBLIC",  
          "codeName": "Public"  
        },  
        "usageType": {  
          "code": "NATGW",  
          "codeName": "NAT Gateway Only"  
        },  
        "networkAclNo": "71994"  
      }
```

  * CLI 실행 시 Subnet CIDR 대역, ZONE, 서브넷 별 VPC, 생성일자 등을 확인 할 수 있습니다.



* * *

#### 4\. CLI를 통한 Server 조회
```bash    
~/cli_linux# ./ncloud vserver getServerInstanceList --regionCode KR --vpcNo 9006 --serverInstanceStatusCode RUN
```
> — vpcNo 부분에 조회 할 서버의 VPC 번호 입력이 필요 합니다.

> 이전 vpc 조회 당시 확인 되는 vpcNo 입력 !
    
```bash    
root@clova-server:~/cli_linux# ./ncloud vserver getServerInstanceList --regionCode KR --vpcNo 46814 --serverInstanceStatusCode RUN  
{  
  "getServerInstanceListResponse": {  
    "totalRows": 3,  
    "serverInstanceList": [  
      {  
        "serverInstanceNo": "26234296",  
        "serverName": "saas-kit",  
        "serverDescription": "",  
        "cpuCount": 2,  
        "memorySize": 4294967296,  
        "platformType": {  
          "code": "UBD64",  
          "codeName": "Ubuntu Desktop 64 Bit"  
        },  
        "loginKeyName": "clova-test",  
        "publicIpInstanceNo": "26234311",  
        "publicIp": " ",  
        "serverInstanceStatus": {  
          "code": "RUN",  
          "codeName": "서버 RUN 상태"  
        },  
        "serverInstanceOperation": {  
          "code": "NULL",  
          "codeName": "서버 NULL OP"  
        },  
        "serverInstanceStatusName": "running",  
        "createDate": "2024-08-26T18:57:47+0900",  
        "uptime": "2024-08-26T19:00:04+0900",  
        "serverImageProductCode": "SW.VSVR.OS.LNX64.UBNTU.SVR22.G003",  
        "serverProductCode": "SVR.VSVR.HICPU.C002.M004.G003",  
        "isProtectServerTermination": false,  
        "zoneCode": "KR-1",  
        "regionCode": "KR",  
        "vpcNo": "46814",  
        "subnetNo": "145818",  
        "networkInterfaceNoList": [  
          "4254833"  
        ],  
        "initScriptNo": "87902",  
        "serverInstanceType": {  
          "code": "HICPU",  
          "codeName": "High CPU"  
        },  
        "baseBlockStorageDiskType": {  
          "code": "NET",  
          "codeName": "네트웍 스토리지"  
        },  
        "placementGroupNo": "",  
        "placementGroupName": "",  
        "memberServerImageInstanceNo": "",  
        "hypervisorType": {  
          "code": "KVM",  
          "codeName": "KVM"  
        },  
        "serverImageNo": "23214590",  
        "serverSpecCode": "c2-g3"  
      },  
      {  
        "serverInstanceNo": "24261553",  
        "serverName": "clova-server",  
        "serverDescription": "",  
        "cpuCount": 2,  
        "memorySize": 4294967296,  
        "platformType": {  
          "code": "UBD64",  
          "codeName": "Ubuntu Desktop 64 Bit"  
        },  
        "loginKeyName": "clova",  
        "publicIpInstanceNo": "24237406",  
        "publicIp": "223.130.143.59",  
        "serverInstanceStatus": {  
          "code": "RUN",  
          "codeName": "서버 RUN 상태"  
        },  
        "serverInstanceOperation": {  
          "code": "NULL",  
          "codeName": "서버 NULL OP"  
        },  
        "serverInstanceStatusName": "running",  
        "createDate": "2024-05-23T10:31:13+0900",  
        "uptime": "2024-05-23T10:32:28+0900",  
        "serverImageProductCode": "SW.VSVR.OS.LNX64.UBNTU.SVR22.G003",  
        "serverProductCode": "SVR.VSVR.HICPU.C002.M004.G003",  
        "isProtectServerTermination": true,  
        "zoneCode": "KR-1",  
        "regionCode": "KR",  
        "vpcNo": "46814",  
        "subnetNo": "145818",  
        "networkInterfaceNoList": [  
          "4032652"  
        ],  
        "initScriptNo": "",  
        "serverInstanceType": {  
          "code": "HICPU",  
          "codeName": "High CPU"  
        },  
        "baseBlockStorageDiskType": {  
          "code": "NET",  
          "codeName": "네트웍 스토리지"  
        },  
        "placementGroupNo": "",  
        "placementGroupName": "",  
        "memberServerImageInstanceNo": "",  
        "hypervisorType": {  
          "code": "KVM",  
          "codeName": "KVM"  
        },  
        "serverImageNo": "23214590",  
        "serverSpecCode": "c2-g3"  
      }  
    ],  
    "requestId": "4297a660-b1fc-4901-b5df-1577a4d39bb3",  
    "returnCode": "0",  
    "returnMessage": "success"  
  }  
}
```

  * CLI 실행 시 서버명, 스펙, 스토리지, OS 버전, 공인 IP, Zone, 서버 생성일자 등을 확인 할 수 있습니다.



* * *

자세한 가이드는 네이버 클라우드 플랫폼 가이드 페이지에서 확인 가능합니다.

[**CLI 개요**  
 _Classic/VPC 환경에서 이용 가능합니다. 네이버 클라우드 플랫폼에서 제공하는 서비스와 솔루션을 효과적으로 관리할 수 있도록 CLI(Command Line Interface, 명령줄 인터페이스)를 제공하고…_ cli.ncloud-docs.com](https://cli.ncloud-docs.com/docs/guide "https://cli.ncloud-docs.com/docs/guide")[](https://cli.ncloud-docs.com/docs/guide)

* * *

추후에 NCP CLI를 통해 서버 및 추가 리소스 생성 방법에 대한 주제로 찾아 뵙도록 하겠습니다.

감사합니다.