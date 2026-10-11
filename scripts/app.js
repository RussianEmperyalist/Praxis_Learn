import { auth } from './auth.js';

export function toast(message, type = 'info') {
  let host = document.getElementById('toasts');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toasts';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = `toast ${type === 'info' ? '' : type}`;
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s, transform .3s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(120%)';
    setTimeout(() => el.remove(), 320);
  }, 3200);
}

export async function renderHeader(active) {
  const user = await auth.current();
  const header = document.querySelector('.app-header');
  if (!header) return;

  header.innerHTML = `
    <a href="./index.html" class="logo">
      <span class="glitch" data-text="PRAXIS LEARN">PRAXIS LEARN</span>
    </a>
    <nav>
      <a href="./index.html" class="${active === 'home' ? 'active' : ''}">Курсы</a>
      ${user ? `<a href="./dashboard.html" class="${active === 'dash' ? 'active' : ''}">Кабинет</a>` : ''}
    </nav>
    <span class="spacer"></span>
    <div class="user-menu">
      ${user
        ? `<span class="mono" style="color:var(--cyan); font-size:.85rem;">▸ ${user.username}</span>
           <button class="btn btn-ghost" id="logoutBtn" style="padding:6px 14px; font-size:.75rem;">Выход</button>`
        : `<a href="./login.html" class="btn btn-primary" style="padding:6px 16px; font-size:.78rem;">Вход</a>`
      }
    </div>
  `;

  const logoutBtn = header.querySelector('#logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await auth.logout();
      location.href = './index.html';
    });
  }
}

export function qs(sel, root = document) { return root.querySelector(sel); }
export function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }

export function getQuery(name) {
  return new URLSearchParams(location.search).get(name);
}