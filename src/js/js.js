/* global hcaptcha */
const copy = require('clipboard-copy');
const Cookies = require('js-cookie');

document.body.classList.remove('no-js');

/**
 * @returns {('light'|'dark')} theme - Name of the currently applied theme.
 */
const getTheme = () => {
  let currentTheme = document.body.dataset.theme;
  if (!currentTheme && window.matchMedia) {
    if (window.matchMedia('(prefers-color-scheme: light)').matches) currentTheme = 'light';
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) currentTheme = 'dark';
  }
  return currentTheme;
};

const spawnCaptcha = (container, opts = {}, linksUri) => {
  hcaptcha.render(container, {
    size: 'compact',
    sitekey: window.HC_SITE_KEY,
    theme: getTheme(),
    ...opts,
    callback: (token) => {
      const form = document.createElement('form');
      form.setAttribute('method', 'post');
      form.setAttribute('action', linksUri);

      const input = document.createElement('input');
      input.setAttribute('type', 'hidden');
      input.setAttribute('name', 'token');
      input.value = token;
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();
      form.remove();
    },
  });
};

/**
 * Theme toggle button
 */
document.querySelector('.theme-toggle').addEventListener('click', () => {
  const theme = (getTheme() === 'dark' ? 'light' : 'dark');
  document.body.dataset.theme = theme;
  Cookies.set('theme', theme, { sameSite: 'strict' });
});

/**
 * Hamburger menu
 */
const burgerButton = document.querySelector('button.hamburger');
burgerButton.addEventListener('click', () => {
  const menu = document.querySelector('#mobile');
  if (burgerButton.classList.contains('active')) {
    burgerButton.classList.remove('active');
    menu.classList.remove('active');
  } else {
    burgerButton.classList.add('active');
    menu.classList.add('active');
    menu.querySelectorAll('li').forEach((li, i) => { /* eslint-disable no-param-reassign, no-unused-expressions */
      li.style.animation = 'none';
      li.offsetHeight;
      li.style.animation = null;
      li.style.animationDelay = `${i * 100}ms`;
    });
  }
});

/**
 * Load captcha when download trigger clicked
 */
document.addEventListener('click', (event) => {
  if (!event.target.classList.contains('download-captcha-trigger')) return;
  event.preventDefault();
  spawnCaptcha(event.target.parentNode, event.target.dataset, event.target.href);
});

/**
 * Init captchas with data-auto-init="true"
 */
document.addEventListener('captcha-load', () => {
  document.querySelectorAll('.download-captcha-trigger[data-auto-init="true"]').forEach((element) => {
    spawnCaptcha(element, element.dataset, element.href);
  });
});

/**
 * Destroy any captchas inside modals onwhen closed.
 */
document.addEventListener('modal-close', (event) => {
  event.target.querySelectorAll('[data-hcaptcha-widget-id]').forEach((element) => {
    hcaptcha.remove(element.dataset.hcaptchaWidgetId);
  });
});

/**
 * Clipboard triggers for links page.
 */
document.addEventListener('click', (event) => {
  if (event.target.id !== 'copy-links') return;

  event.preventDefault();
  const links = Array.from(event.target.parentElement.querySelectorAll('a.button')).map((b) => b.href).join('\n');
  copy(links);
});

/**
 * Vote trigger.
 */
if (document.querySelector('#reupload')) {
  document.querySelector('#reupload').addEventListener('click', () => {
    const button = document.querySelector('#reupload');
    const captcha = hcaptcha.render(button.parentElement.parentElement, {
      size: 'compact',
      sitekey: window.HC_SITE_KEY,
      theme: getTheme(),
      callback: (token) => {
        fetch(`/api/public/vote/${button.dataset.release}`, {
          method: 'post',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }).then((response) => response.json())
          .then((data) => {
            if (data.status === 'fail') {
              button.innerText = Object.values(data.data).join(', ');
            } else {
              button.innerText = data.data;
            }
            button.setAttribute('disabled', true);
            hcaptcha.remove(captcha);
          });
      },
    });
  });
}

/**
 * Language switcher
 */
if (document.querySelector('#language-switcher')) {
  document.querySelector('#language-switcher').addEventListener('click', (event) => {
    if (!event.target.dataset.language) return;
    Cookies.set('lang', event.target.dataset.language, { sameSite: 'strict' });
    window.history.pushState('', document.title, `${window.location.pathname}${window.location.search}`);
    window.location.reload();
  });
}
