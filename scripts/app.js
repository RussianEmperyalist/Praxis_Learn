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
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 320);
  }, 3000);
}

export async function renderHeader(active) {
  const user = await auth.current();
  const header = document.querySelector('.app-header');
  if (!header) return;

  header.innerHTML = `
    <a href="./index.html" class="logo" aria-label="Praxis Learn — главная">
      <span class="logo-text">PRAXIS LEARN</span>
    </a>
    <nav>
      <a href="./index.html" class="${active === 'home' ? 'active' : ''}">Курсы</a>
      ${user ? `<a href="./dashboard.html" class="${active === 'dash' ? 'active' : ''}">Кабинет</a>` : ''}
    </nav>
    <span class="spacer"></span>
    <div class="user-menu">
      ${user
        ? `<span class="user-name" aria-label="Пользователь">▸ ${user.username}</span>
           <button class="btn btn-ghost btn-sm" id="logoutBtn" aria-label="Выйти">Выход</button>`
        : `<a href="./login.html" class="btn btn-primary btn-sm">Вход</a>`
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
