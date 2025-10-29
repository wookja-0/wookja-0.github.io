// Visitor Counter Component - 사이드바 하단에 삽입
(function() {
  console.log('Visitor counter script loaded');
  let retryCount = 0;
  const maxRetries = 50;
  
  // DOM이 완전히 로드된 후 실행
  const insertCounter = () => {
    // 이미 추가되었는지 확인
    if (document.querySelector('.visitor-counter')) {
      return;
    }
    
    retryCount++;
    if (retryCount > maxRetries) {
      console.error('Visitor counter: 최대 재시도 횟수 초과');
      return;
    }
    
    // 사이드바 하단 영역 찾기 (여러 선택자 시도)
    const sidebar = document.querySelector('#sidebar, aside#sidebar, aside.sidebar, .sidebar, [id*="sidebar"]');
    const sidebarBottom = document.querySelector('.sidebar-bottom, [class*="sidebar-bottom"], .sidebar .sidebar-bottom');
    
    // 디버깅 정보
    console.log('Visitor counter: sidebar 찾기 시도', { sidebar: !!sidebar, sidebarBottom: !!sidebarBottom, retryCount });
    
    // 사이드바 내의 하단 요소 찾기
    let targetElement = null;
    if (sidebar) {
      // 사이드바 내의 마지막 자식 요소 찾기
      const children = Array.from(sidebar.children);
      if (sidebarBottom && sidebar.contains(sidebarBottom)) {
        targetElement = sidebarBottom;
      } else if (children.length > 0) {
        // 사이드바의 마지막 요소 앞에 삽입
        targetElement = children[children.length - 1];
      } else {
        targetElement = sidebar;
      }
    }
    
    if (!targetElement) {
      // 요소를 찾을 수 없으면 잠시 후 다시 시도
      if (retryCount === 1) {
        console.warn('Visitor counter: 사이드바를 찾을 수 없습니다. DOM 구조:', {
          sidebar: sidebar ? sidebar.tagName : null,
          sidebarChildren: sidebar ? sidebar.children.length : 0,
          bodyChildren: document.body ? document.body.children.length : 0
        });
      }
      setTimeout(insertCounter, 200);
      return;
    }
    
    const counterHTML = `
      <div class="visitor-counter">
        <span class="vc-label">오늘</span>
        <span id="visitor-today" class="vc-number">-</span>
        <span class="vc-divider">|</span>
        <span class="vc-label">어제</span>
        <span id="visitor-yesterday" class="vc-number">-</span>
        <span class="vc-divider">|</span>
        <span class="vc-label">총</span>
        <span id="visitor-total" class="vc-number">-</span>
      </div>
    `;
    
    const wrap = document.createElement('div');
    wrap.innerHTML = counterHTML.trim();
    const counterEl = wrap.firstElementChild;
    
    // 요소 삽입
    try {
      if (targetElement === sidebarBottom || (targetElement !== sidebar && targetElement.parentNode)) {
        // sidebar-bottom 앞에 삽입
        if (targetElement.parentNode) {
          targetElement.parentNode.insertBefore(counterEl, targetElement);
          console.log('Visitor counter: sidebar-bottom 앞에 삽입 성공');
        } else {
          sidebar.appendChild(counterEl);
          console.log('Visitor counter: sidebar에 추가 성공 (parent 없음)');
        }
      } else {
        // 사이드바 맨 아래에 추가
        sidebar.appendChild(counterEl);
        console.log('Visitor counter: sidebar 맨 아래에 추가 성공');
      }
      
      // 카운터 업데이트 함수 실행
      updateVisitorCount();
    } catch (err) {
      console.error('Visitor counter: 삽입 실패', err);
      setTimeout(insertCounter, 500);
    }
  };
  
  // 카운터 숫자 업데이트 (오늘/어제/총 방문자)
  const updateVisitorCount = () => {
    const todayEl = document.getElementById('visitor-today');
    const yesterdayEl = document.getElementById('visitor-yesterday');
    const totalEl = document.getElementById('visitor-total');
    
    if (!todayEl || !yesterdayEl || !totalEl) {
      setTimeout(updateVisitorCount, 100);
      return;
    }
    
    // GoatCounter siteId 가져오기 (여러 소스에서 시도)
    var siteId = '';
    
    // 방법 1: window.GOATCOUNTER_SITE_ID에서 읽기
    if (typeof window !== 'undefined' && window.GOATCOUNTER_SITE_ID) {
      siteId = String(window.GOATCOUNTER_SITE_ID).trim();
    }
    
    // 방법 2: meta 태그에서 읽기
    if (!siteId || siteId === '' || siteId === 'undefined') {
      const metaTag = document.querySelector('meta[name="goatcounter-site-id"]');
      if (metaTag && metaTag.content) {
        siteId = String(metaTag.content).trim();
      }
    }
    
    // 방법 3: 다시 window에서 확인
    if (!siteId || siteId === '' || siteId === 'undefined') {
      setTimeout(() => {
        if (window.GOATCOUNTER_SITE_ID) {
          siteId = String(window.GOATCOUNTER_SITE_ID).trim();
          console.log('Visitor counter: siteId를 나중에 찾음:', siteId);
        }
      }, 100);
    }
    
    const prodHost = 'wookja-0.github.io';
    const isProd = location.hostname.endsWith('github.io') || location.hostname === prodHost || location.hostname === 'wookja-0.github.io';
    
    // siteId는 GoatCounter 추적을 위한 것이며, 현재는 로컬 스토리지 기반 카운터를 사용합니다
    // GoatCounter 추적은 자동으로 작동하며, 통계는 GoatCounter 대시보드에서 확인할 수 있습니다
    
    // 날짜 계산 (로컬 기준)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    const todayISO = today.toISOString().split('T')[0];
    const yesterdayISO = yesterday.toISOString().split('T')[0];
    
    // 로컬 스토리지에서 방문 기록 가져오기
    const getDateVisits = (dateStr) => {
      const key = `gc_visits_${dateStr}`;
      return parseInt(localStorage.getItem(key) || '0');
    };
    
    const setDateVisits = (dateStr, count) => {
      const key = `gc_visits_${dateStr}`;
      localStorage.setItem(key, count.toString());
    };
    
    // 오늘 방문자수 계산 (로컬 스토리지 기반)
    const lastVisitDate = localStorage.getItem('gc_last_visit_date');
    let todayVisits = getDateVisits(todayStr);
    let yesterdayVisits = getDateVisits(yesterdayStr);
    let totalVisits = parseInt(localStorage.getItem('gc_total_visits') || '0');
    
    // 오늘 첫 방문이면 카운트 증가
    if (lastVisitDate !== todayStr) {
      // 어제가 바뀌었으면 어제 값을 저장
      if (lastVisitDate && lastVisitDate !== todayStr && lastVisitDate !== yesterdayStr) {
        const prevYesterday = getDateVisits(lastVisitDate);
        setDateVisits(yesterdayStr, prevYesterday || todayVisits);
      }
      
      todayVisits += 1;
      totalVisits += 1;
      setDateVisits(todayStr, todayVisits);
      localStorage.setItem('gc_last_visit_date', todayStr);
      localStorage.setItem('gc_total_visits', totalVisits.toString());
      
      // 어제 값이 없으면 저장된 어제 값을 가져오기
      if (!yesterdayVisits && lastVisitDate === yesterdayStr) {
        yesterdayVisits = getDateVisits(yesterdayStr);
      }
    }
    
    // 초기 표시 (로컬 스토리지 값)
    todayEl.textContent = todayVisits.toLocaleString('ko-KR');
    yesterdayEl.textContent = (yesterdayVisits || 0).toLocaleString('ko-KR');
    totalEl.textContent = totalVisits.toLocaleString('ko-KR');
    
    // GoatCounter API로 실제 통계 가져오기 (배포 환경에서만)
    // siteId가 아직 설정되지 않았다면 다시 확인
    if (!siteId || siteId === '' || siteId === 'undefined') {
      // window에서 다시 확인
      if (typeof window !== 'undefined' && window.GOATCOUNTER_SITE_ID) {
        siteId = String(window.GOATCOUNTER_SITE_ID).trim();
      }
      // meta 태그에서 확인
      if ((!siteId || siteId === '') && document) {
        const metaTag = document.querySelector('meta[name="goatcounter-site-id"]');
        if (metaTag && metaTag.content) {
          siteId = String(metaTag.content).trim();
        }
      }
    }
    
    // GoatCounter API 호출 (공개 엔드포인트 시도)
    // 참고: GoatCounter는 일반적으로 공개 API를 제공하지 않지만, 일부 엔드포인트는 접근 가능할 수 있습니다
    if (isProd && siteId && siteId !== '' && siteId.indexOf('{') === -1 && siteId !== 'undefined') {
      // Lambda URL 확인
      let lambdaUrl = window.GOATCOUNTER_LAMBDA_URL || '';
      
      // meta 태그에서도 확인
      if (!lambdaUrl || lambdaUrl === '' || lambdaUrl === 'undefined') {
        const lambdaMeta = document.querySelector('meta[name="goatcounter-lambda-url"]');
        if (lambdaMeta && lambdaMeta.content) {
          lambdaUrl = String(lambdaMeta.content).trim();
          window.GOATCOUNTER_LAMBDA_URL = lambdaUrl; // 캐시
        }
      }
      
      const hasLambdaUrl = lambdaUrl && lambdaUrl !== '' && lambdaUrl !== 'undefined';
      
      if (hasLambdaUrl) {
        console.log('Visitor counter: Lambda URL 확인됨');
      }
      
      if (hasLambdaUrl) {
        // Lambda를 통한 API 호출 (안전한 방식)
        const callGoatCounterAPI = async (startDate, endDate, label) => {
          try {
            // Lambda URL 끝의 슬래시 제거
            const cleanUrl = lambdaUrl.replace(/\/$/, '');
            const apiUrl = `${cleanUrl}?siteId=${encodeURIComponent(siteId)}&start=${startDate}&end=${endDate}`;
            const response = await fetch(apiUrl, {
              method: 'GET',
              mode: 'cors'
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            return await response.json();
          } catch (err) {
            console.warn(`Visitor counter: ${label} API 오류`, err);
            throw err;
          }
        };

        // 총 방문자수 전용: /api/v0/stats/total 사용 (대용량 기간 502 회피)
        const callGoatCounterTotal = async () => {
          try {
            const cleanUrl = lambdaUrl.replace(/\/$/, '');
            // 대시보드 Total(pageviews)와 동일하게 기간 파라미터 없이 호출
            const apiUrl = `${cleanUrl}?siteId=${encodeURIComponent(siteId)}&endpoint=total`;
            const response = await fetch(apiUrl, {
              method: 'GET',
              mode: 'cors'
            });
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            return await response.json();
          } catch (err) {
            console.warn('Visitor counter: 총 방문자수 total 엔드포인트 오류', err);
            throw err;
          }
        };
        
        // 응답 파싱 헬퍼 함수
        const parseCount = (data) => {
          if (!data) return 0;
          
          // 다양한 응답 형식 지원
          if (typeof data.total !== 'undefined') {
            return parseInt(data.total) || 0;
          } else if (data.stats && Array.isArray(data.stats)) {
            // 배열 형식인 경우 합산
            return data.stats.reduce((sum, stat) => sum + (parseInt(stat.count || stat.visitors || 0) || 0), 0);
          } else if (data.visitors !== undefined) {
            return parseInt(data.visitors) || 0;
          } else if (typeof data === 'number') {
            return parseInt(data);
          }
          return 0;
        };
        
        // GoatCounter API가 404를 반환하는 경우, 로컬 스토리지 값 사용
        // 오늘 통계
        callGoatCounterAPI(todayISO, todayISO, '오늘 통계')
          .then(data => {
            console.log('Visitor counter: 오늘 통계 API 응답:', data);
            const count = parseCount(data);
            // API 응답이 로컬 계산치보다 작으면 덮어쓰지 않음(초기 집계 지연/타임존 어긋남 보호)
            const current = parseInt((todayEl.textContent || '0').replace(/[^0-9]/g, '')) || 0;
            if (count >= current) {
              todayEl.textContent = count.toLocaleString('ko-KR');
              setDateVisits(todayStr, count);
              console.log('Visitor counter: 오늘 통계 API 성공', count);
            } else {
              console.log('Visitor counter: 오늘 통계 API 값이 현재값보다 작아 유지', { api: count, current });
            }
          })
          .catch((err) => {
            console.warn('Visitor counter: 오늘 통계 API 실패, 로컬 스토리지 값 사용', err.message);
            // API 실패 시 로컬 스토리지 값 유지
          });
        
        // 어제 통계
        callGoatCounterAPI(yesterdayISO, yesterdayISO, '어제 통계')
          .then(data => {
            console.log('Visitor counter: 어제 통계 API 응답:', data);
            const count = parseCount(data);
            // 어제는 0도 유효. 단, 현재 값이 더 크면 유지
            const current = parseInt((yesterdayEl.textContent || '0').replace(/[^0-9]/g, '')) || 0;
            if (count >= current) {
              yesterdayEl.textContent = count.toLocaleString('ko-KR');
              setDateVisits(yesterdayStr, count);
              console.log('Visitor counter: 어제 통계 API 성공', count);
            } else {
              console.log('Visitor counter: 어제 통계 API 값이 현재값보다 작아 유지', { api: count, current });
            }
          })
          .catch((err) => {
            console.warn('Visitor counter: 어제 통계 API 실패, 로컬 스토리지 값 사용', err.message);
            // API 실패 시 로컬 스토리지 값 유지
          });
        
        // 총 방문자수 (지난 1년)
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const oneYearAgoISO = oneYearAgo.toISOString().split('T')[0];
        
        // 우선 total 엔드포인트 시도 → 실패 시 기간 조회 폴백
        callGoatCounterTotal()
          .then(data => {
            console.log('Visitor counter: 총 방문자수 API 응답:', data);
            // 대시보드와 동일: total 사용
            const count = parseCount(data);
            const current = parseInt((totalEl.textContent || '0').replace(/[^0-9]/g, '')) || 0;
            if (count >= current) {
              totalEl.textContent = count.toLocaleString('ko-KR');
              localStorage.setItem('gc_total_visits', count.toString());
              console.log('Visitor counter: 총 방문자수 API 성공', count);
            } else {
              console.log('Visitor counter: 총 방문자수 API 값이 현재값보다 작아 유지', { api: count, current });
            }
          })
          .catch((err) => {
            console.warn('Visitor counter: total 엔드포인트 실패, 기간 조회로 폴백', err.message);
            callGoatCounterAPI(oneYearAgoISO, todayISO, '총 방문자수(폴백)')
              .then(data => {
                console.log('Visitor counter: 총 방문자수(폴백) API 응답:', data);
                const count = parseCount(data);
                if (count >= 0) {
                  totalEl.textContent = count.toLocaleString('ko-KR');
                  localStorage.setItem('gc_total_visits', count.toString());
                  console.log('Visitor counter: 총 방문자수(폴백) API 성공', count);
                }
              })
              .catch((err2) => {
                console.warn('Visitor counter: 총 방문자수 API 실패, 로컬 스토리지 값 사용', err2.message);
                // 최종 폴백: 로컬 스토리지 값 유지
              });
          });
      } else {
        // API 키 없음: 로컬 스토리지 값만 사용
        console.log('Visitor counter: API 키가 없어 로컬 스토리지 값 사용');
      }
    }
    
    // 현재는 로컬 스토리지 기반 카운터를 기본으로 사용
    // GoatCounter API는 대시보드에서 확인하거나, API 키가 있다면 추가 설정 가능
    
    // 총 방문자수는 모든 날짜 합산
    if (totalVisits === 0) {
      // 초기값 설정
      const allKeys = Object.keys(localStorage);
      let sum = 0;
      allKeys.forEach(key => {
        if (key.startsWith('gc_visits_')) {
          sum += parseInt(localStorage.getItem(key) || '0');
        }
      });
      if (sum > 0) {
        totalVisits = sum;
        localStorage.setItem('gc_total_visits', totalVisits.toString());
        totalEl.textContent = totalVisits.toLocaleString('ko-KR');
      }
    }
  };
  
  // 페이지 로드 완료 후 실행 (여러 시점에서 시도)
  const runWhenReady = () => {
    console.log('Visitor counter: 초기화 시작, readyState:', document.readyState);
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        console.log('Visitor counter: DOMContentLoaded 이벤트 발생');
        insertCounter();
      });
    } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
      console.log('Visitor counter: DOM이 이미 준비됨, 즉시 실행');
      insertCounter();
    }
    
    // 추가 안전장치: DOM이 준비될 때까지 기다림
    setTimeout(() => {
      if (!document.querySelector('.visitor-counter')) {
        console.log('Visitor counter: setTimeout 후 재시도');
        insertCounter();
      }
    }, 1000);
    
    // window.onload 후에도 한번 더 시도
    window.addEventListener('load', function() {
      console.log('Visitor counter: window.load 이벤트 발생');
      if (!document.querySelector('.visitor-counter')) {
        insertCounter();
      }
    });
  };
  
  // 즉시 실행 시도
  console.log('Visitor counter: runWhenReady 호출 전');
  runWhenReady();
  console.log('Visitor counter: runWhenReady 호출 후');
})();
console.log('Visitor counter script 끝');

