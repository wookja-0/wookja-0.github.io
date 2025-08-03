---
title: "[OpenStack] Kolla-Ansible을 활용한 OpenStack 개발 환경 구축 해보기"
date: 2025-08-01 00:00:00 +0900
categories: ['OpenStack']
tags: ['kolla-ansible', 'openstack', 'ubuntu', 'network']
description: "Kolla-Ansible을 사용하여 OpenStack을 배포해보자"
image: /assets/images/2025-08-01/thumbnail.png
---


안녕하세요. 오랜만에 블로그에 글을 남깁니다.

최근 SI 쪽으로 이직하여 DevOps 엔지니어로 첫 공공기관 프로젝트를 진행하게 되었습니다. 전달받은 인프라는 OpenStack 기반의 MSA 구조였으며, 신규 하드웨어 도입과 개발 고도화가 주요 과제였습니다. 저는 인프라 및 쿠버네티스 엔지니어로 참여하여 OpenStack 환경을 직접 구축하게 되었고, 이전에는 AWS, Azure, NCP 등 퍼블릭 클라우드만 경험했기 때문에 OpenStack은 처음 접하는 플랫폼이었습니다. 여러 시행착오(삽질..)를 겪었지만, 일주일 만에 개발 환경을 성공적으로 구성할 수 있었습니다.

최종 목표는 개발용 물리 서버에 OpenStack을 설치하고, K8s용 VM을 생성하여 개발 환경 애플리케이션과 다양한 오픈소스 솔루션을 배포하는 것입니다. 실습 당시에는 물리 서버 2대로 환경을 구축했지만, 실제 운영에서는 10대 이상의 서버로 확장할 예정입니다.

이 글에서는 Kolla-Ansible을 활용한 컨테이너 기반 OpenStack 배포 과정을 정리합니다. 실습 환경, 네트워크 구성, 설치 및 배포 절차, 주요 설정 파일까지 실제 경험을 바탕으로 단계별로 공유합니다. OpenStack을 처음 접하는 분들께 도움이 되었으면 합니다.

이번 글에서는 VM을 생성해 실제 물리 네트워크와 통신이 가능한지 확인하는 데 집중합니다. 쿠버네티스 구성 등 추가 내용은 다음 포스팅에서 다룰 예정입니다!

---
## 1. 오픈스택이란?
![](/assets/images/2025-08-01/openstack_icon.png)

**[OpenStack](https://docs.openstack.org/)**은 퍼블릭 및 프라이빗 클라우드를 위한 오픈소스 인프라 플랫폼입니다. IaaS(Infra as a Service) 구조로, 가상 서버를 빠르게 생성하고 네트워크, 스토리지, 인증 등 인프라 자원을 자동화하여 클라우드 환경을 구축할 수 있습니다.

OpenStack의 네트워크 구조는 크게 Provider 네트워크와 Self-Service 네트워크로 나뉩니다. **[Neutron](https://docs.openstack.org/neutron/latest/)**을 통해 구현됩니다. Provider 네트워크는 물리 네트워크와 직접 연결되어 외부와 통신이 가능하며, Self-Service 네트워크는 프로젝트(테넌트)별로 분리된 가상 네트워크로, 라우터를 통해 외부 네트워크와 연결됩니다.

제가 구성한 환경에서는 VM들이 Self-Service 네트워크(10.0.0.x 대역)에 위치하고, 외부 네트워크(192.168.0.x)와 **[Floating IP](https://docs.openstack.org/python-openstackclient/pike/cli/command-objects/floating-ip.html)**를 통해 통신합니다. Floating IP는 외부에서 VM에 접근할 때 **[DNAT](https://docs.openstack.org/developer/dragonflow/specs/distributed_dnat.html)**로 내부 IP로 변환되고, VM에서 외부로 나갈 때는 **[SNAT](https://docs.openstack.org/neutron/pike/admin/intro-nat.html)**로 외부 IP로 변환되어 트래픽이 전달됩니다. 이러한 네트워크 흐름은 Neutron의 L3 Agent와 **[OVS](https://docs.openstack.org/neutron/latest/admin/deploy-ovs-selfservice.html)**(Open vSwitch)에서 처리됩니다.

실제 운영 환경에서는 Self-Service 네트워크를 활용해 각 프로젝트별로 독립적인 네트워크를 구성할 수 있고, 라우터와 Floating IP를 통해 외부와 안전하게 통신할 수 있습니다.

### OpenStack 주요 노드 역할

- **Controller Node**:  
    OpenStack의 핵심 서비스(Keystone, Glance, Horizon, Neutron-server, Nova-api 등)를 실행하는 중앙 관리 노드입니다. 인증, API 요청 처리, 네트워크 제어, 대시보드 제공, 데이터베이스 및 메시지 큐 관리 등 전체 인프라의 제어와 조정을 담당합니다. 네트워크 라우팅(SNAT/DNAT, Floating IP), 서비스 스케줄링, 사용자 인증 등 대부분의 제어 작업이 이 노드에서 이루어집니다.

- **Compute Node**:  
    실제 가상 머신(VM)을 생성·실행하는 역할을 담당합니다. Nova-compute, libvirt, Neutron-agent 등이 동작하며, VM의 CPU, 메모리, 디스크 등 리소스를 할당하고, 네트워크 브리징을 통해 VM이 외부와 통신할 수 있도록 지원합니다. Controller Node의 명령에 따라 VM을 배치하고, 각 VM의 라이프사이클을 관리합니다.

OpenStack은 여러 컴포넌트(오브젝트)로 구성되어 있으며, 각 컴포넌트가 역할을 분담해 전체 인프라를 관리합니다. 주요 오브젝트는 다음과 같습니다:

![](/assets/images/2025-08-01/openstack_arch.png)

- **[Nova](https://docs.openstack.org/nova/latest/)**: 컴퓨트(가상 서버) 관리. VM 생성/삭제/스케줄링 등 핵심 역할을 담당합니다.
- **[Neutron](https://docs.openstack.org/neutron/latest/)**: 네트워크 관리. 가상 네트워크, 라우터, 서브넷, Floating IP 등 네트워크 자원과 연결을 제공합니다.
- **[Cinder](https://docs.openstack.org/cinder/latest/)**: 블록 스토리지 관리. VM에 연결 가능한 디스크(볼륨)를 생성/삭제/스냅샷 관리합니다.
- **[Glance](https://docs.openstack.org/glance/latest/)**: 이미지 관리. VM 생성에 사용할 OS 이미지 등록/배포/관리 기능을 제공합니다.
- **[Keystone](https://docs.openstack.org/keystone/latest/)**: 인증 및 권한 관리. 사용자, 프로젝트, 서비스 인증과 권한 제어를 담당합니다.
- **[Horizon](https://docs.openstack.org/horizon/latest/)**: 웹 기반 관리 대시보드. OpenStack 자원을 GUI로 손쉽게 관리할 수 있습니다.
- **[Swift](https://docs.openstack.org/swift/latest/)**: 오브젝트 스토리지. 대용량 파일 저장 및 관리에 사용됩니다.

이 외에도 [Heat](https://docs.openstack.org/heat/latest/)(오케스트레이션), [Ceilometer](https://docs.openstack.org/ceilometer/latest/)(모니터링), [Barbican](https://docs.openstack.org/barbican/latest/)(보안) 등 다양한 컴포넌트가 존재하며, 필요에 따라 선택적으로 배포할 수 있습니다.

저는 간단하게 배포하려 Cinder, Glance, Swift 는 제외하였습니다.



---
## 2. Kolla-Ansible이란?
![](/assets/images/2025-08-01/kolla-ansible_icon.png)

**[Kolla-Ansible](https://docs.openstack.org/kolla-ansible/latest/)**은 OpenStack을 컨테이너 기반으로 쉽고 빠르게 설치·운영할 수 있도록 도와주는 오픈소스 툴입니다. 기존 OpenStack 설치는 복잡한 패키지 의존성과 설정 파일 관리가 필요했지만, Kolla-Ansible은 모든 OpenStack 서비스를 **[Docker](https://docs.docker.com/)** 컨테이너로 배포해 관리 복잡도를 크게 줄여줍니다.

주요 특징은 다음과 같습니다:
- **[Ansible](https://docs.ansible.com/)** 플레이북 기반으로 설치/업데이트/운영 자동화
- 서비스별 **[Docker](https://docs.docker.com/)** 컨테이너로 격리 및 관리
- 다양한 OS(Ubuntu, CentOS 등)와 네트워크 구성 지원
- 멀티노드 환경, 고가용성(HA), 롤링 업그레이드 등 엔터프라이즈 기능 제공

실제 운영 환경에서도 빠른 배포와 장애 복구, 확장성 측면에서 매우 유용합니다.

---


---
## 3. 구축 환경 요약

### 서버 구성

| 역할            | 호스트명    | IP 주소         | OS           | NIC 이름 | 용도                          | CPU   | Memory  |
|-----------------|------------|----------------|--------------|----------|-------------------------------|-------|---------|
| Controller Node | controller | 192.168.0.117  | Ubuntu 22.04 | eno1     | 관리/외부 통신                | 16c   | 16GB    |
|                 |            |                |              | eno2     | 내부 네트워크(브릿지 연결)    |       |         |
| Compute Node    | compute    | 192.168.0.118  | Ubuntu 22.04 | eno1     | 관리/외부 통신                | 32c   | 126GB   |
|                 |            |                |              | eno2     | 내부 네트워크(브릿지 연결)    |       |         |

---

#### Controller Node (192.168.0.117) 주요 컨테이너 목록

| 컨테이너 이름              | 설명                                                      |
|----------------------------|----------------------------------------------------------|
| horizon                    | OpenStack Dashboard (웹 UI)                              |
| neutron-server             | Neutron API 서버 (네트워크 서비스 제어 중심)             |
| neutron-l3-agent           | L3 라우터 기능 제공 (SNAT, DNAT, Floating IP 등)         |
| neutron-dhcp-agent         | VM에 DHCP를 통한 IP 주소 제공                            |
| neutron-metadata-agent     | VM 내부에서 메타데이터 접근 지원 (http://169.254.169.254)|
| neutron-openvswitch-agent  | OVS를 통한 네트워크 연결 및 포트 바인딩                  |
| nova-api                   | Nova API 서비스, VM 생성 요청 처리                       |
| nova-conductor             | Nova의 DB 연산 처리, scheduler와 compute 간 중재 역할    |
| nova-novncproxy            | 웹 기반 콘솔(VNC) 프록시 서비스                          |
| nova-scheduler             | VM 배치 스케줄링 담당                                    |
| keystone                   | 인증 및 권한 관리 서비스                                 |
| keystone-fernet/ssh        | Keystone 토큰 발급 및 key 동기화                         |
| glance-api                 | 이미지 서비스 API                                        |
| placement-api              | 리소스 스케줄링용 Placement 서비스                       |
| mariadb-server             | OpenStack 내부 서비스용 DB 서버                          |
| mariadb-clustercheck       | DB 상태 모니터링용 클러스터 체크                         |
| rabbitmq                   | 메시지 큐 (서비스 간 통신 처리)                          |
| memcached                  | 토큰 및 기타 캐시 저장소                                 |
| openvswitch_db             | OVS DB 서비스 (ovs-vsctl 설정 반영)                      |
| openvswitch_vswitchd       | 실제 패킷을 처리하는 OVS 데몬                            |
| cron                       | 주기적 작업 (백업, 정리 등)                              |
| fluentd                    | 로그 수집 및 전달                                        |
| kolla-toolbox              | kolla-ansible 내부 유틸 도구                             |

---
#### Compute Node (192.168.0.118) 주요 컨테이너 목록

| 컨테이너 이름              | 설명                                                      |
|----------------------------|----------------------------------------------------------|
| nova-compute               | VM 생성/삭제/관리 담당                                   |
| nova-libvirt               | libvirt 기반 하이퍼바이저                                 |
| nova-ssh                   | nova-compute 간 SSH 통신                                 |
| neutron-openvswitch-agent  | VM 네트워크 포트 구성, OVS 통한 브릿지 연결              |
| openvswitch_db             | OVS DB (compute 노드용)                                  |
| openvswitch_vswitchd       | 실제 패킷 포워딩 수행                                    |
| cron                       | 주기적 작업 (내부 유지관리 목적)                         |
| fluentd                    | 로그 수집 및 전달                                        |
| kolla-toolbox              | ansible 내부 유틸 도구                                   |

### NIC 및 네트워크 구성
- eno1: 관리 및 외부 통신용 (192.168.0.x)
- eno2: OpenStack 내부 네트워크용 (10.0.0.x, 브릿지 처리) # IP 할당 X



### 최종 아키텍처
아래와 같이 환경을 구성했습니다.

네트워크 노드를 별도로 분리 하였으면 좋았겠지만, 구비 된 서버가 2대 뿐이어서 네트워크 처리는 전부 controller node에서 처리되도록 구성하였습니다.

![최종 아키텍처](/assets/images/2025-08-01/architecture.png)


| **VM 이름**    | **역할**     | **IP 주소 (Self-Service)** | **Floating IP**    |
|:--------------:|:-----------:|:-------------------------:|:------------------:|
| k8s-master     | K8s Master  | 10.0.0.10/24              | 192.168.0.161      |
| k8s-worker1    | K8s Worker  | 10.0.0.11/24              | 192.168.0.162      |
| k8s-worker2    | K8s Worker  | 10.0.0.12/24              | 192.168.0.163      |

> 💡 **회사 내부망(192.168.0.0/24)에서 VM에 할당할 Floating IP는 미사용 중인 IP를 지정해야 합니다.**<br>
> 남는 IP 풀: `192.168.0.160 ~ 192.168.0.170`<br>
> - `192.168.0.160`: 라우터 external gateway<br>
> - `192.168.0.161~170`: VM Floating IP<br>
> 이렇게 하면 회사 네트워크에서 VM으로 직접 접근이 가능하며, 네트워크 충돌 없이 안전하게 외부 통신이 가능합니다.

> 📡 **192.168.0.0/24 대역에서 VM으로 직접 통신 가능**


### 네트워크 흐름

1️⃣ **외부에서 VM 접근 (DNAT)**<br>
회사 네트워크 사용자가 `192.168.0.161`(Floating IP)로 접속하면, controller 노드의 neutron-l3-agent 컨테이너에서 DNAT 처리가 이루어집니다.<br>
Floating IP가 내부 IP(`10.0.0.10` 등)로 변환되어 Open vSwitch를 통해 VM까지 트래픽이 전달됩니다.

2️⃣ **VM에서 외부 통신 (SNAT)**<br>
VM이 `10.0.0.0/24` 대역에서 외부(예: `8.8.8.8`)로 접속할 때, controller의 neutron-l3-agent에서 SNAT 처리가 되어 출발지 IP가 Floating IP(`192.168.0.160` 등)로 변경됩니다.<br>
이를 통해 VM이 외부와 정상적으로 통신할 수 있습니다.

> 🔗 [Neutron](https://docs.openstack.org/neutron/latest/)과 [Open vSwitch(OVS)](https://docs.openstack.org/neutron/latest/admin/ovs.html)가 [SNAT/DNAT 및 Floating IP](https://docs.openstack.org/neutron/latest/admin/config-nat.html) 처리를 담당합니다.<br>
> VM에서 외부로 나가는 트래픽은 controller 노드의 neutron-l3-agent에서 SNAT되어 Floating IP로 변환되고, 외부에서 VM으로 들어오는 트래픽은 DNAT되어 내부 IP로 전달됩니다.<br>
> compute 노드의 OVS는 VM 네트워크 패킷 브리징을 담당하며, [DVR(분산 라우팅)](https://docs.openstack.org/neutron/latest/admin/deploy-ovs-ha-dvr.html)을 사용하지 않으므로 모든 SNAT/DNAT 작업은 controller 노드에서 처리됩니다.

<!-- 중복 설명(네트워크 흐름, SNAT/DNAT, Floating IP, OVS 역할 등)이 기존 본문에 이미 있으므로, 핵심만 간결하게 정리하고 참고 링크를 통합했습니다. -->



---
## 4. 설치 전 준비 (모든 노드)

### 각 서버별 네트워크 설정 (netplan)
Ubuntu 22.04 기준, `/etc/netplan/01-netcfg.yaml` 파일에 아래와 같이 네트워크를 설정합니다.

컨트롤러 노드 예시:
```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eno1:
      addresses: [192.168.0.117/24]   # 관리/외부 통신용 IP
      gateway4: 192.168.0.1           # 외부 게이트웨이
      nameservers:
        addresses: [8.8.8.8]  # DNS 서버
    eno2:
      dhcp4: no                      # 내부 네트워크(브릿지용), DHCP 미사용
      optional: true
```

Compute 노드의 경우 `eno1` IP만 192.168.0.118로 변경하면 됩니다.

설정 후 아래 명령어로 적용합니다:
```bash
sudo netplan apply
```

---
```bash
# /etc/hosts 파일에 각 노드의 IP와 호스트명을 등록합니다. (네트워크 통신 및 Ansible 인벤토리에서 사용)
127.0.0.1 localhost
192.168.0.117 controller
192.168.0.118 compute
```

```bash
# 기존 OVS(Open vSwitch) 데몬을 중지 및 비활성화합니다. (Kolla에서 OVS를 컨테이너로 관리하므로 충돌 방지)
sudo systemctl stop openvswitch-switch
sudo systemctl disable openvswitch-switch
```

```bash
# Docker 및 Python 관련 패키지를 설치합니다. (Kolla-Ansible은 Docker 컨테이너와 Python 기반 Ansible을 사용)
apt update
apt install -y docker.io python3-pip python3-venv git python3-dev libffi-dev gcc libssl-dev
pip3 install docker
```



---
## 5. 가상 환경 생성 및 Kolla-Ansible 설치

```bash
# Kolla-Ansible 실행을 위한 Python 가상환경을 생성하고, 필요한 패키지를 설치합니다.
mkdir -p /openstack

python3 -m venv /openstack/venv
source /openstack/venv/bin/activate

# Ansible Core와 Kolla-Ansible(지정 버전)을 설치합니다.
pip install 'ansible-core>=2.16,<2.17.99'
pip install git+https://opendev.org/openstack/kolla-ansible@stable/2025.1
```



---
## 6. 설정 파일 구성

```bash
# Kolla-Ansible 예제 설정 파일을 복사하고, 인벤토리 파일을 준비합니다.
mkdir -p /etc/kolla
cp -r /openstack/venv/share/kolla-ansible/etc_examples/kolla/* /etc/kolla/

mkdir /etc/kolla/ansible
cp /openstack/venv/share/kolla-ansible/ansible/inventory/multinode /etc/kolla/ansible/inventory

# 추가 의존성 설치 및 Ansible 컬렉션 설치
kolla-ansible install-deps

# 서비스 비밀번호 자동 생성
kolla-genpwd
```



---
## 7. /etc/kolla/globals.yml 설정

```yaml
# Kolla-Ansible 전체 서비스 설정 파일입니다. (배포 환경에 맞게 수정)

kolla_base_distro: "ubuntu"                # 베이스 OS
kolla_internal_vip_address: "192.168.0.117" # 내부 VIP(Controller IP)
network_interface: "eno1"                   # 관리/외부 통신용 NIC
neutron_external_interface: "eno2"          # OpenStack 내부 네트워크용 NIC
enable_neutron_dvr: "no"                    # Neutron DVR(분산 라우팅) 비활성화
enable_horizon: "yes"                       # Horizon(웹 대시보드) 활성화
enable_cinder: "no"                         # Cinder(블록 스토리지) 비활성화
enable_heat: "no"                           # Heat(오케스트레이션) 비활성화
enable_proxysql: "no"
enable_haproxy: "no"
enable_keepalived: "no"
```
저는 단일 Controller 환경 이기 때문에 kolla_internal_vip_address를 Controller IP인 117로 설정하였고,
proxysql, haproxy, keepalived 옵션을 전부 no로 하였습니다.


---
## 8. inventory 구성 (/etc/kolla/ansible/inventory)

```ini
# Ansible 인벤토리 파일 예시 (노드 역할별 그룹 지정)
[control]
controller

[network]
controller

[compute]
compute

[monitoring]
controller

[deployment]
localhost ansible_connection=local
```



---
## 9. SSH Key 설정

```bash
# 컨트롤러 노드에서 compute 노드로 SSH 무비밀번호 접속을 위해 키를 생성/복사합니다.
ssh-keygen -t rsa -b 4096

ssh-copy-id root@compute
```



---
## 10. 배포

```bash
# Kolla-Ansible 명령어로 OpenStack 배포를 진행합니다.
kolla-ansible bootstrap-servers -i /etc/kolla/ansible/inventory   # 서버 초기화
kolla-ansible prechecks -i /etc/kolla/ansible/inventory           # 사전 점검
kolla-ansible deploy -i /etc/kolla/ansible/inventory              # 실제 배포
kolla-ansible post-deploy -i /etc/kolla/ansible/inventory         # 배포 후 작업
source /etc/kolla/admin-openrc.sh                                 # OpenStack CLI 환경 변수 적용
```


---
## 11. Horizon 접속
![](/assets/images/2025-08-01/horizon.png)

`post-deploy` 작업을 완료하면 `/etc/kolla/admin-openrc.sh`와 `clouds.yaml` 파일이 생성됩니다. `clouds.yaml`에는 아래와 같이 kolla-admin 계정 정보가 포함되어 있습니다.

```yaml
clouds:
    kolla-admin:
        auth:
            auth_url: http://192.168.0.117:5000
            project_domain_name: Default
            user_domain_name: Default
            project_name: admin
            username: admin
            password: <생성된 비밀번호>
```

`kolla_internal_vip_address`로 웹 브라우저에서 접속하면 Horizon(OpenStack Dashboard)에 로그인할 수 있습니다. username과 password는 위 파일에서 확인 가능합니다.


---
## 12. OpenStack CLI 설치

OpenStack 환경을 관리하려면 OpenStack CLI를 설치해야 합니다. 아래 명령어로 설치할 수 있습니다.

```bash
pip install python-openstackclient -c https://releases.openstack.org/constraints/upper/master
```

참고로, 퍼블릭 클라우드(AWS, NCP 등)에서는 Terraform을 많이 사용했지만, 이번 프로젝트는 규모가 크지 않아 OpenStack CLI로 직접 리소스를 관리했습니다. 필요에 따라 Terraform 등 IaC 도구도 활용할 수 있습니다.


---
## 13. 네트워크 구성

외부(public) 네트워크와 내부(private) 네트워크, 라우터 및 Floating IP 풀을 아래와 같이 생성합니다.

```bash
# 외부(public) 네트워크 생성
openstack network create public \
    --external \
    --provider-network-type flat \
    --provider-physical-network physnet1

# provider-physical-network` 값(`physnet1`)은 `/etc/kolla/neutron-server/ml2_conf.ini`의 `flat_networks`와 일치해야 합니다.

# 외부(public) 네트워크에 서브넷 생성 및 Floating IP 풀 지정
openstack subnet create public-subnet \
    --network public \
    --subnet-range 192.168.0.0/24 \
    --no-dhcp \
    --gateway 192.168.0.1 \
    --dns-nameserver 8.8.8.8 \
    --allocation-pool start=192.168.0.160,end=192.168.0.170

# 내부(private) 네트워크 생성 (Self-Service 네트워크)
openstack network create private
openstack subnet create private-subnet \
    --network private \
    --subnet-range 10.0.0.0/24 \
    --gateway 10.0.0.1

# 라우터 생성 및 네트워크 연결
openstack router create router
openstack router set router --external-gateway public --fixed-ip subnet=public-subnet,ip-address=192.168.0.160
openstack router add subnet router private-subnet
```



---
## 14. 보안 그룹

```bash
# ICMP(ping) 허용
openstack security group rule create --protocol icmp default
# SSH(22번 포트) 허용
openstack security group rule create --protocol tcp --dst-port 22 default
```

---
## 15. VM 생성

### 1) Ubuntu 이미지 다운로드 및 등록

```bash
# Ubuntu 클라우드 이미지 다운로드
wget https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img -O ubuntu-jammy.img

# OpenStack에 이미지 등록
openstack image create "ubuntu-jammy" \
    --file ubuntu-jammy.img \
    --disk-format qcow2 \
    --container-format bare \
    --public
```

### 2) SSH 키페어 생성 및 등록

```bash
# SSH 키 생성
ssh-keygen -t rsa -b 4096 -f ./dev-key

# 공개키를 OpenStack에 등록
openstack keypair create --public-key ./dev-key.pub dev-key
```

### 3) VM 스펙(flavor) 생성

```bash
openstack flavor create --id 1 --ram 4096 --disk 10 --vcpus 2 m1.medium
```

### 4) VM 생성 (이미지, 네트워크, 키페어, 보안그룹 적용)

```bash
openstack server create \
--flavor m1.medium \
--image ubuntu-22.04 \
--nic net-id=private,v4-fixed-ip=10.0.0.10 \
--security-group default \
--key-name dev-key \
test-vm
```

### 5) Floating IP 생성 및 VM에 할당

```bash
openstack floating ip create --floating-ip-address 192.168.0.161 public
openstack server add floating ip test-vm <FLOATING_IP>
```

### 6) 네트워크 토폴로지 확인

네트워크와 VM을 생성 한 후 최종적으로 네트워크 토폴로지를 확인 합니다.
![](/assets/images/2025-08-01/topology.png)

---
## 16. SSH 접속

```bash
# 권한 설정 필요 
cd /root/.ssh
chmod 600 dev-key
ssh -i dev-key ubuntu@<Floating IP>
```
---

### 1) 접속 후 통신 확인
```bash
ping 8.8.8.8

# 회사 내부망에 ping 보내보기
ping 192.168.0.1
ping 192.168.0.117
ping 192.168.0.118

# 아웃바운드 (인터넷) 통신 확인
apt update -y
apt install -y net-tools
```
---


---
## 17. kolla-ansible deploy 당시 트러블슈팅

### 1) Compute node libvirt 충돌 (이미 로컬에 libvirt가 실행 중인 경우)

```bash
TASK [nova-cell : Checking that host libvirt is not running] ******************
skipping: [controller]
fatal: [compute]: FAILED! => {"changed": false, "failed_when_result": true, "stat": {"atime": 1753692261.6405613, "attr_flags": "", "attributes": [], "block_size": 4096, "blocks": 0, "charset": "binary", "ctime": 1753692256.6485736, "dev": 25, "device_type": 0, "executable": true, "exists": true, "gid": 0, "gr_name": "root", "inode": 24405, "isblk": false, "ischr": false, "isdir": false, "isfifo": false, "isgid": false, "islnk": false, "isreg": false, "issock": true, "isuid": false, "mimetype": "inode/socket", "mode": "0777", "mtime": 1753692256.6485736, "nlink": 1, "path": "/var/run/libvirt/libvirt-sock", "pw_name": "root", "readable": true, "rgrp": true, "roth": true, "rusr": true, "size": 0, "uid": 0, "version": null, "wgrp": true, "woth": true, "writeable": true, "wusr": true, "xgrp": true, "xoth": true, "xusr": true}}
```

Kolla-Ansible 환경에서는 libvirt를 컨테이너로 관리하므로, 로컬에 libvirt가 실행 중이면 충돌이 발생할 수 있습니다. 아래 명령어로 libvirtd를 중지 및 비활성화하고, 소켓 파일을 삭제합니다.

```bash
sudo systemctl stop libvirtd
sudo systemctl disable libvirt
sudo rm -f /var/run/libvirt/libvirt-sock
```

### 2) ovsdb-server: pidfile check failed 에러

```bash
ovsdb-server: /var/run/openvswitch/ovsdb-server.pid: pidfile check failed (No such process), aborting
```

`ovsdb-server.pid` 파일이 남아 있거나, 프로세스가 비정상적으로 종료된 경우 발생합니다. 아래 명령어로 pid 파일을 삭제합니다.

```bash
rm -f /var/run/openvswitch/ovsdb-server.pid
rm -f /run/openvswitch/ovsdb-server.pid
```

### 3) ovs-vswitchd: pidfile check failed 에러

```bash
ovs-vswitchd: /var/run/openvswitch/ovs-vswitchd.pid: pidfile check failed (No such process), aborting
```

OVS 커널 모듈이 로드되지 않았거나, 런타임 디렉터리가 비정상적으로 남아 있을 때 발생합니다. 아래 명령어로 커널 모듈을 확인하고, 디렉터리를 재생성한 뒤 OVS 컨테이너를 재시작합니다.

```bash
modprobe openvswitch
lsmod | grep openvswitch

rm -rf /run/openvswitch
mkdir -p /run/openvswitch
chown root:root /run/openvswitch
chmod 775 /run/openvswitch

docker restart openvswitch_db
sleep 2
docker start openvswitch_vswitchd
docker logs -f openvswitch_vswitchd --tail 100

docker exec -it openvswitch_vswitchd bash
ovs-vsctl show
```

---

