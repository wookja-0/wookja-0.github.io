// Visitor Counter Component - 사이드바 하단에 삽입
(function() {
  let retryCount = 0;
  const maxRetries = 50;

  const insertCounter = () => {
    if (document.querySelector('.visitor-counter')) return;

    retryCount++;
    if (retryCount > maxRetries) return;

    const sidebar = document.querySelector('#sidebar, aside#sidebar, aside.sidebar, .sidebar, [id*="sidebar"]');
    const sidebarBottom = document.querySelector('.sidebar-bottom, [class*="sidebar-bottom"], .sidebar .sidebar-bottom');

    let targetElement = null;
    if (sidebar) {
      const children = Array.from(sidebar.children);
      if (sidebarBottom && sidebar.contains(sidebarBottom)) {
        targetElement = sidebarBottom;
      } else if (children.length > 0) {
        targetElement = children[children.length - 1];
      } else {
        targetElement = sidebar;
      }
    }

    if (!targetElement) {
      setTimeout(insertCounter, 200);
      return;
    }

    const counterHTML = `
      <div class="visitor-counter">
        <span class="vc-icon" aria-hidden="true">👥</span>
        <span class="vc-badge" title="pageviews">방문자</span>
        <span class="vc-label">오늘</span>
        <span id="visitor-today" class="vc-number">-</span>
        <span class="vc-divider">|</span>
        <span class="vc-label">총</span>
        <span id="visitor-total" class="vc-number">-</span>
      </div>
    `;

    const wrap = document.createElement('div');
    wrap.innerHTML = counterHTML.trim();
    const counterEl = wrap.firstElementChild;

    try {
      if (targetElement === sidebarBottom || (targetElement !== sidebar && targetElement.parentNode)) {
        if (targetElement.parentNode) {
          targetElement.parentNode.insertBefore(counterEl, targetElement);
        } else {
          sidebar.appendChild(counterEl);
        }
      } else {
        sidebar.appendChild(counterEl);
      }
      updateVisitorCount();
    } catch (err) {
      setTimeout(insertCounter, 500);
    }
  };

  const updateVisitorCount = () => {
    const todayEl = document.getElementById('visitor-today');
    const totalEl = document.getElementById('visitor-total');
    if (!todayEl || !totalEl) {
      setTimeout(updateVisitorCount, 100);
      return;
    }

    // siteId 읽기
    let siteId = (window.GOATCOUNTER_SITE_ID || '').trim();
    if (!siteId) {
      const meta = document.querySelector('meta[name="goatcounter-site-id"]');
      if (meta) siteId = (meta.content || '').trim();
    }

    // lambdaUrl 읽기
    let lambdaUrl = (window.GOATCOUNTER_LAMBDA_URL || '').trim();
    if (!lambdaUrl) {
      const meta = document.querySelector('meta[name="goatcounter-lambda-url"]');
      if (meta) lambdaUrl = (meta.content || '').trim();
    }

    if (!siteId || !lambdaUrl) return;

    const todayISO = new Date().toISOString().split('T')[0];
    const cleanUrl = lambdaUrl.replace(/\/$/, '');

    // 오늘 방문자
    fetch(`${cleanUrl}?siteId=${encodeURIComponent(siteId)}&start=${todayISO}&end=${todayISO}`, { mode: 'cors' })
      .then(r => r.json())
      .then(data => {
        const count = parseInt(data.total) || 0;
        todayEl.textContent = count.toLocaleString('ko-KR');
      })
      .catch(() => { todayEl.textContent = '-'; });

    // 총 방문자
    fetch(`${cleanUrl}?siteId=${encodeURIComponent(siteId)}&endpoint=total`, { mode: 'cors' })
      .then(r => r.json())
      .then(data => {
        const count = parseInt(data.total) || 0;
        totalEl.textContent = count.toLocaleString('ko-KR');
      })
      .catch(() => { totalEl.textContent = '-'; });
  };

  const runWhenReady = () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', insertCounter);
    } else {
      insertCounter();
    }
    setTimeout(() => { if (!document.querySelector('.visitor-counter')) insertCounter(); }, 1000);
    window.addEventListener('load', () => { if (!document.querySelector('.visitor-counter')) insertCounter(); });
  };

  runWhenReady();
})();
