/* global DocumentTouch */

const FontFaceObserver = require('fontfaceobserver');
const Panzoom = require('@panzoom/panzoom');
const linkify = require('linkifyjs');

const root = document.documentElement;
const nfoCanvas = document.querySelector('#nfo-img');
const linkRegions = [];
let rainbow = false;

const canvasPos = (e) => {
  const rect = nfoCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  return { x, y };
};

// eslint-disable-next-line max-len
const isIntersect = (x, y, linkX, linkY, linkW, linkH) => (x >= linkX && x <= linkX + linkW && y >= linkY && y <= linkY + linkH);

nfoCanvas.addEventListener('click', (e) => {
  const { x, y } = canvasPos(e);
  for (let i = 0; i < linkRegions.length; i += 1) {
    const link = linkRegions[i];
    if (isIntersect(x, y, link.x, link.y, link.w, link.h)) {
      window.open(link.href, '_blank');
      break;
    }
  }
});

nfoCanvas.addEventListener('mousemove', (e) => {
  const { x, y } = canvasPos(e);
  nfoCanvas.style.cursor = 'auto';

  for (let i = 0; i < linkRegions.length; i += 1) {
    const link = linkRegions[i];
    if (isIntersect(x, y, link.x, link.y, link.w, link.h)) {
      nfoCanvas.style.cursor = 'pointer';
      break;
    }
  }
});

const isTouchDevice = () => {
  const prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');

  const mq = (query) => window.matchMedia(query).matches;

  if (('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch)) {
    return true;
  }

  // include the 'heartz' as a way to have a non matching MQ to help terminate the join
  // https://git.io/vznFH
  const query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
  return mq(query);
};

const isMobileBp = () => {
  return window.matchMedia('(max-width: 768px)').matches;
};

const randColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;

function getMode() {
  return (document.querySelector('#nfo-txt-wrap').hasAttribute('hidden') && !document.querySelector('#nfo-img').hasAttribute('hidden') ? 'image' : 'text');
}

function getCurrentSize() {
  return parseInt(getComputedStyle(root).getPropertyValue('--nfo-size').replace('px', ''), 10);
}

function getColors() {
  return {
    fg: getComputedStyle(root).getPropertyValue('--nfo-fg'),
    bg: getComputedStyle(root).getPropertyValue('--nfo-bg'),
  };
}

function scaleDown(source, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.style.imageRendering = 'crisp-edges';

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function drawFinalImage(source, w, h) {
  nfoCanvas.width = w;
  nfoCanvas.height = h;
  nfoCanvas.style.imageRendering = 'crisp-edges';

  const ctx = nfoCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, nfoCanvas.width, nfoCanvas.height);
}

function generateImage() {
  const { fg, bg } = getColors();
  const scale = 4; // rendered 4x the actual size then scaled down
  const fontSize = 16;

  const nfoText = document.querySelector('#nfo-txt').innerText.split('\n');
  nfoText.unshift('www.SceneGames.to');

  const letterSize = fontSize * scale;
  const width = nfoText.reduce((a, b) => (a.length > b.length ? a : b)).length * (letterSize / 2);
  const height = nfoText.length * letterSize;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = (rainbow ? '#000' : bg);
  ctx.fillRect(0, 0, width, height);
  ctx.font = `${letterSize}px 'PxPlus IBM VGA8'`;

  // Write text
  let offset = 0;
  nfoText.forEach((line, i) => {
    ctx.textBaseline = 'top';
    // Set styling for first line (SG URL)
    if (i === 0) {
      ctx.fillStyle = '#edc600';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2 * scale;
      ctx.strokeText(line, scale, offset);
      ctx.fillText(line, scale, offset);
    } else {
      // Find link in line
      const linky = linkify.find(line);
      if (linky.length > 0) {
        linky.forEach((link) => {
          linkRegions.push({
            x: line.indexOf(link.value) * (fontSize / 2),
            y: offset / scale,
            w: link.href.length * (fontSize / 2),
            h: fontSize,
            href: link.href,
          });
        });
      }

      ctx.fillStyle = fg;
      if (rainbow) {
        ctx.fillStyle = randColor();
      }
      ctx.fillText(line, 0, offset);
    }

    offset += letterSize;
  });

  const scaled = scaleDown(canvas, width / scale, height / scale);
  drawFinalImage(scaled, width / scale, height / scale);
  return scaled;
}

function updateImage(showEl = false) {
  generateImage();
  if (showEl) {
    document.querySelector('#nfo-txt-wrap').setAttribute('hidden', true);
    document.querySelector('#nfo-img').removeAttribute('hidden');
  }
  return nfoCanvas.toDataURL();
}

function scaleImage() {
  const currentSize = getCurrentSize();
  nfoCanvas.style.transform = `scale(${currentSize / 16})`;
}

function setColors(fg, bg) {
  if (rainbow) {
    root.style.setProperty('--nfo-bg', '#000');
    updateImage();
    return;
  }

  root.style.setProperty('--nfo-fg', fg);
  root.style.setProperty('--nfo-bg', bg);

  localStorage.setItem('nfo_fg', fg);
  localStorage.setItem('nfo_bg', bg);

  if (getMode() === 'image') updateImage();
}

// Has JS enabled. Hide text version, generate canvas.
document.body.classList.remove('no-js');
if (document.fonts !== undefined) {
  document.fonts.ready.then(() => {
    document.querySelector('#nfo-txt-wrap').setAttribute('hidden', true);
    updateImage(true);
  });
} else if (document.fonts === undefined) {
  // Polyfill document.fonts
  const font = new FontFaceObserver('PxPlus IBM VGA8');
  font.load().then(() => {
    document.querySelector('#nfo-txt-wrap').setAttribute('hidden', true);
    updateImage(true);
  });
}

if (localStorage.getItem('nfo_fg') && localStorage.getItem('nfo_bg')) {
  setColors(localStorage.getItem('nfo_fg'), localStorage.getItem('nfo_bg'));
}

if (isTouchDevice() && isMobileBp()) {
  Panzoom(nfoCanvas, {
    maxScale: 5,
    canvas: true,
  });
}

document.querySelector('#zoom-in').addEventListener('click', (e) => {
  e.preventDefault();
  const currentSize = getCurrentSize();
  root.style.setProperty('--nfo-size', `${currentSize + 2}px`);

  if (getMode() === 'image') scaleImage();
});

document.querySelector('#zoom-out').addEventListener('click', (e) => {
  e.preventDefault();
  const currentSize = getCurrentSize();
  let newSize;
  if (currentSize <= 12) {
    newSize = 12;
  } else {
    newSize = currentSize - 2;
  }
  root.style.setProperty('--nfo-size', `${newSize}px`);

  if (getMode() === 'image') scaleImage();
});

document.querySelector('#zoom-reset').addEventListener('click', (e) => {
  e.preventDefault();
  root.style.setProperty('--nfo-size', '16px');

  if (getMode() === 'image') scaleImage();
});

document.querySelector('#color-changer').addEventListener('click', (e) => {
  e.preventDefault();
  if (e.target.id === 'activate-rainbow') {
    rainbow = true;
    updateImage(true);
    setColors('#000', '#000');
    return;
  }
  if (e.target.tagName === 'SPAN') {
    rainbow = false;
    const fg = e.target.style.color;
    const bg = e.target.style.backgroundColor;

    setColors(fg, bg);

    // Swap colors
    e.target.style.backgroundColor = fg;
    e.target.style.color = bg;
  }
});

document.querySelector('#toggle-txt').addEventListener('click', (e) => {
  e.preventDefault();
  const txtEl = document.querySelector('#nfo-txt-wrap');
  const imgEl = document.querySelector('#nfo-img');

  if (getMode() === 'image') {
    imgEl.setAttribute('hidden', true);
    txtEl.removeAttribute('hidden');
    e.target.innerText = '[i]';
    e.target.title = 'Image Mode';
  } else {
    txtEl.setAttribute('hidden', true);
    imgEl.removeAttribute('hidden');
    e.target.innerText = '[t]';
    e.target.title = 'Text Mode';
    updateImage();
  }
});

document.querySelector('#save').addEventListener('click', (e) => {
  e.preventDefault();
  let url = nfoCanvas.toDataURL();
  if (getMode() === 'text') {
    url = updateImage();
  }

  const link = document.createElement('a');
  link.download = `${document.title.replace(/\./g, '_')}.png`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
