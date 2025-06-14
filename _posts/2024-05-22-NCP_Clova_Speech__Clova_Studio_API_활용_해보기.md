---
title: "[NCP] Clova Speech & Clova Studio API 활용 해보기"
date: 2024-05-22 00:00:00 +0900
categories: ['NCP']
tags: ['Clova', 'STT', 'LLM']
description: "[NCP] Clova Speech & Clova Studio API 활용 해보기"
image: https://cdn-images-1.medium.com/max/800/0*DeJmdsIPxmlZrsU8.png
---

### 개요

빠르게 성장 중인 Naver Cloud Platform의 **Clova AI API**를 활용하여 음성 → 텍스트 → 요약 과정을 하나의 파이프라인으로 구성해보는 실습 가이드입니다.

![](https://cdn-images-1.medium.com/max/800/0*DeJmdsIPxmlZrsU8.png)

> 💡 **Clova Speech**: 음성 파일을 텍스트로 변환하는 STT API  
> 💡 **Clova Studio (요약)**: 장문 텍스트를 간결하게 요약하는 AI 서비스

- Language: Python 3.11.7 (Flask 3.0.2)
- 참고 가이드: 
  - [Clova Speech](https://api.ncloud-docs.com/docs/ai-application-service-clovaspeech-longsentence)  
  - [Clova Studio](https://guide.ncloud-docs.com/docs/clovastudio-playground01#%ED%85%8C%EC%8A%A4%ED%8A%B8%EC%95%B1%EC%83%9D%EC%84%B1)

---

### 🧩 작업 순서 요약

1. Object Storage 생성 및 Clova Speech API 테스트
2. Clova Studio 요약 API 테스트
3. 두 API를 하나의 흐름으로 통합
4. 웹 인터페이스(Flask 기반)에서 파일 업로드 및 결과 확인 기능 구현

---

## 1. Object Storage & Clova Speech API 테스트

- Object Storage 생성 → 음성 파일 업로드 (권한: 전체 공개)
- Clova Speech 도메인 생성 후 API 호출 준비

```python
# Clova Speech API
import requests
CLOVA_SPEECH_SECRET_KEY = ''
CLOVA_SPEECH_INVOKE_URL = ''

def convert_speech_to_text(file_url):
    headers = {'X-CLOVASPEECH-API-KEY': CLOVA_SPEECH_SECRET_KEY}
    data = {'url': file_url, 'language': 'ko-KR', 'completion': 'sync'}
    response = requests.post(f'{CLOVA_SPEECH_INVOKE_URL}/recognizer/url', headers=headers, json=data)
    return response.json()
```

---

## 2. Clova Studio 요약 API 테스트

```python
# Clova Studio 요약 API
import json, http.client
class CompletionExecutor:
    def __init__(self, host, api_key, api_key_primary_val, request_id):
        self._host = host
        self._api_key = api_key
        self._api_key_primary_val = api_key_primary_val
        self._request_id = request_id
    def execute(self, completion_request):
        headers = {
            'Content-Type': 'application/json; charset=utf-8',
            'X-NCP-CLOVASTUDIO-API-KEY': self._api_key,
            'X-NCP-APIGW-API-KEY': self._api_key_primary_val,
            'X-NCP-CLOVASTUDIO-REQUEST-ID': self._request_id
        }
        conn = http.client.HTTPSConnection(self._host)
        conn.request('POST', '/testapp/v1/api-tools/summarization/v2/', json.dumps(completion_request), headers)
        result = json.loads(conn.getresponse().read().decode('utf-8'))
        conn.close()
        return result['result']['text'] if result['status']['code'] == '20000' else 'Error'
```

---

## 3. 통합 테스트: 음성 파일 → 텍스트 변환 → 요약

```python
# 통합 테스트 코드
file_url = 'Object Storage 경로'
speech_text = convert_speech_to_text(file_url).get('text', '')
summary = CompletionExecutor(...).execute({"texts": [speech_text], ...})
print(summary)
```

---

## 4. Flask 웹 애플리케이션 구현

> 사용자가 업로드한 음성 파일을 Clova Speech로 변환 → 변환된 텍스트를 Clova Studio로 요약해 화면에 출력

디렉토리 구성:
```
├── app.py
├── templates/
│   ├── index.html
│   └── result.html
└── uploads/
```

### app.py 주요 코드 요약

```python
from flask import Flask, request, render_template
...
@app.route('/', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        file_url = request.form.get('file_url')
        voice_file = request.files.get('voice_file')
        ...
        text = convert_speech_to_file(file_path or file_url)
        summary = summarization_executor.execute({...})
        return render_template('result.html', text=text, summary=summary)
    return render_template('index.html')
```

> 파일 또는 URL을 통해 음성파일을 제출하고, 변환 및 요약 결과를 출력합니다.

---

### 결과 예시

#### 웹 화면

- 파일 업로드
- 음성 파일 URL 입력
- 요약 결과 출력

![](https://cdn-images-1.medium.com/max/800/0*7LCMTu4FNEIaK1Y6.png)

---

📎 전체 소스코드는 GitHub에서 확인 가능합니다:

[https://github.com/tkwk5445/Clova-API](https://github.com/tkwk5445/Clova-API)

감사합니다 🙌