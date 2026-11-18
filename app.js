(function () {
  'use strict';
  const L = window.CalLib;
  const STORE = 'calendar-config-v1';

  // Fond toujours blanc (impression) + 2 couleurs : ink (texte, traits) et acc (accent).
  // Fond toujours blanc (impression) + 2 couleurs : ink (texte, traits) et acc (accent).
  const THEMES = {
    electrique: { name: 'Bleu électrique & orange', bg: '#ffffff', ink: '#2736d9', acc: '#ff6a1f', onacc: '#fff' },
    sapin: { name: 'Vert sapin & rose bonbon', bg: '#ffffff', ink: '#0b6b4d', acc: '#ff4f9a', onacc: '#fff' },
    violet: { name: 'Violet & jaune soleil', bg: '#ffffff', ink: '#5a2bd6', acc: '#ffbf00', onacc: '#141414' },
    tomate: { name: 'Rouge tomate & turquoise', bg: '#ffffff', ink: '#d92d20', acc: '#00a99d', onacc: '#fff' },
    fluo: { name: 'Noir & rose fluo', bg: '#ffffff', ink: '#141414', acc: '#ff2e88', onacc: '#fff' },
  };



  const defaultYear = () => { const d = new Date(); return d.getMonth() >= 9 ? d.getFullYear() + 1 : d.getFullYear(); };
  const HAND = ['main', 'bloc'];
  const DEFAULTS = () => ({
    year: defaultYear(), lang: 'fr', weekStart: 1, theme: 'electrique', colors: { ink: '#2736d9', acc: '#ff6a1f' }, layout: 'titre', font: 'grotesk',
    cantons: { VD: true, GE: true, FR: false }, excluded: [],
    moon: { full: true, names: true, new: true, quarters: false, time: true },
    weekNumbers: false, weekendTint: true, notes: true, mini: true,
  });

  let state = load();
  if (state.theme !== 'perso' && !THEMES[state.theme]) state.theme = DEFAULTS().theme;
  const photos = {}; // mois (0-11) -> dataURL

  function load() {
    const d = DEFAULTS();
    try {
      const raw = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (raw) {
        for (const k of Object.keys(d)) {
          if (raw[k] === undefined) continue;
          d[k] = (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) ? { ...d[k], ...raw[k] } : raw[k];
        }
      }
    } catch (e) { /* stockage indisponible : on garde les valeurs par défaut */ }
    return d;
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignoré */ } }

  /* ---------- liaison formulaire <-> état ---------- */
  const getPath = (o, p) => p.split('.').reduce((a, k) => a[k], o);
  const setPath = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v; };
  function syncForm() {
    document.querySelectorAll('[data-k]').forEach((el) => {
      const v = getPath(state, el.dataset.k);
      if (el.type === 'checkbox') el.checked = !!v; else el.value = v;
    });
    document.getElementById('usePhotos').checked = state.layout === 'photo';
    document.querySelectorAll('.sw').forEach((b) => b.setAttribute('aria-pressed', b.dataset.t === state.theme));
  }
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-k]');
    if (!el) return;
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.type === 'number' || el.dataset.k === 'weekStart') v = Number(v);
    if (el.type === 'number' && !(v >= 1900 && v <= 2100)) return;
    setPath(state, el.dataset.k, v);
    if (el.dataset.k.startsWith('colors.')) { state.theme = 'perso'; syncForm(); }
    save(); render();
  });

  function buildThemes() {
    const box = document.getElementById('themes');
    box.innerHTML = Object.entries(THEMES).map(([id, t]) =>
      `<button type="button" class="sw" data-t="${id}" title="${t.name}" aria-label="${t.name}"><i style="background:linear-gradient(135deg,${t.bg} 55%,${t.ink} 55% 78%,${t.acc} 78%)"></i></button>`).join('');
    box.addEventListener('click', (e) => {
      const b = e.target.closest('.sw'); if (!b) return;
      state.theme = b.dataset.t; state.colors = { ink: THEMES[b.dataset.t].ink, acc: THEMES[b.dataset.t].acc }; save(); syncForm(); render();
    });
  }

  function buildHolidayList() {
    const box = document.getElementById('holList');
    box.innerHTML = L.HOLIDAYS.map((h) =>
      `<label class="chk"><input type="checkbox" data-h="${h.id}"> ${h[state.lang]} <small>${h.cantons.join(' · ')}</small></label>`).join('');
    box.querySelectorAll('input').forEach((i) => { i.checked = !state.excluded.includes(i.dataset.h); });
  }
  document.getElementById('holList').addEventListener('change', (e) => {
    const id = e.target.dataset.h; if (!id) return;
    const set = new Set(state.excluded);
    e.target.checked ? set.delete(id) : set.add(id);
    state.excluded = [...set]; save(); render();
  });

  /* ---------- dates ---------- */
  const pad = L.pad;
  const utc = (y, m, d) => new Date(Date.UTC(y, m, d));
  const keyOf = (dt) => `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
  function isoWeek(dt) {
    const t = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = Date.UTC(t.getUTCFullYear(), 0, 1);
    return Math.ceil(((t - y0) / 86400000 + 1) / 7);
  }
  const locale = () => (state.lang === 'en' ? 'en-GB' : 'fr-CH');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function themeColors() {
    if (state.theme !== 'perso') return THEMES[state.theme];
    const { ink, acc } = state.colors;
    const n = parseInt(acc.slice(1), 16);
    const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return { bg: '#ffffff', ink, acc, onacc: lum > 0.62 ? '#141414' : '#ffffff' };
  }

  function monthName(y, m) { return new Intl.DateTimeFormat(locale(), { month: 'long', timeZone: 'UTC' }).format(utc(y, m, 1)); }
  function weekdayShort(i, long) {
    // 2021-01-04 est un lundi ; i = 0 (dimanche) .. 6
    const dt = utc(2021, 0, 3 + i);
    return new Intl.DateTimeFormat(locale(), { weekday: long ? 'long' : 'short', timeZone: 'UTC' }).format(dt).replace('.', '');
  }

  /* ---------- rendu ---------- */
  function moonIcon(phase) {
    const c = '<circle cx="5" cy="5" r="4.2" fill="none" stroke="currentColor" stroke-width="1"/>';
    const fill = {
      new: '<circle cx="5" cy="5" r="4.2" fill="currentColor"/>',
      full: c,
      first: c + '<path d="M5 .8A4.2 4.2 0 0 1 5 9.2Z" fill="currentColor"/>',
      last: c + '<path d="M5 .8A4.2 4.2 0 0 0 5 9.2Z" fill="currentColor"/>',
    }[phase];
    return `<svg viewBox="0 0 10 10" aria-hidden="true">${fill}</svg>`;
  }

  function miniHTML(y, m, hol) {
    const dt = utc(y, m, 1); const yy = dt.getUTCFullYear(), mm = dt.getUTCMonth();
    const first = utc(yy, mm, 1).getUTCDay();
    const off = (first - state.weekStart + 7) % 7;
    const n = utc(yy, mm + 1, 0).getUTCDate();
    const rows = Math.ceil((off + n) / 7);
    let h = `<div class="mini"><b>${monthName(yy, mm)}</b><table><tr>`;
    for (let i = 0; i < 7; i++) h += `<th>${weekdayShort((state.weekStart + i) % 7).charAt(0).toUpperCase()}</th>`;
    h += '</tr>';
    for (let r = 0; r < rows; r++) {
      h += '<tr>';
      for (let c = 0; c < 7; c++) {
        const d = utc(yy, mm, 1 - off + r * 7 + c);
        const out = d.getUTCMonth() !== mm;
        const isH = !out && hol[keyOf(d)];
        h += `<td class="${out ? 'o' : ''}${isH ? ' h' : ''}">${d.getUTCDate()}</td>`;
      }
      h += '</tr>';
    }
    return h + '</table></div>';
  }

  function linesHTML(rows) {
    const row = '<div class="week">' + '<div class="cell"></div>'.repeat(7) + '</div>';
    return row.repeat(rows);
  }

  function monthHTML(y, m, ctx) {
    const { moons, hol } = ctx;
    const first = utc(y, m, 1).getUTCDay();
    const off = (first - state.weekStart + 7) % 7;
    const n = utc(y, m + 1, 0).getUTCDate();
    const rows = Math.ceil((off + n) / 7);
    const t = themeColors();
    const name = monthName(y, m);

    let dow = state.weekNumbers ? '<div class="wn"></div>' : '';
    for (let i = 0; i < 7; i++) dow += `<div>${weekdayShort((state.weekStart + i) % 7).toUpperCase()}</div>`;

    let weeks = '';
    for (let r = 0; r < rows; r++) {
      let w = '';
      if (state.weekNumbers) w += `<div class="wn">${isoWeek(utc(y, m, 1 - off + r * 7 + (state.weekStart === 0 ? 1 : 0)))}</div>`;
      for (let c = 0; c < 7; c++) {
        const d = utc(y, m, 1 - off + r * 7 + c);
        const k = keyOf(d), out = d.getUTCMonth() !== m, dw = d.getUTCDay();
        const hs = hol[k] || [];
        const isOff = hs.some((x) => !x.optional);
        const isMain = HAND.includes(state.layout);
        const tab = false;
        const cls = ['cell', out ? 'out' : '', tab ? 'tab' : '', state.weekendTint && (dw === 0 || dw === 6) ? 'we' : '', isOff ? 'hol' : ''].join(' ');
        let ev = '';
        for (const h of hs) ev += `<div class="h">${esc(h.label)}</div>`;
        for (const e of moons[k] || []) {
          const mo = state.moon;
          const show = (e.phase === 'full' && mo.full) || (e.phase === 'new' && mo.new) || ((e.phase === 'first' || e.phase === 'last') && mo.quarters);
          if (!show) continue;
          const label = e.phase === 'full' && !mo.names ? e.label : e.name;
          ev += `<div class="mo">${moonIcon(e.phase)}<span>${esc(label)}</span>${mo.time ? `<i>${e.time}</i>` : ''}</div>`;
        }
        if (isMain && out) { w += `<div class="${cls}">${tab ? `<span class="notestab">Notes</span>` : ''}</div>`; continue; }
        w += `<div class="${cls}"><span class="num">${d.getUTCDate()}</span><div class="ev">${ev}</div></div>`;
      }
      weeks += `<div class="week">${w}</div>`;
    }

    const noteLabel = state.lang === 'en' ? 'Notes' : 'Notes';
    const foot = HAND.includes(state.layout)
      ? (state.notes ? `<div class="foot"><div class="notes">${noteLabel}</div></div>` : '')
      : (state.notes || state.mini) ? `<div class="foot">${
      state.notes ? `<div class="notes">${noteLabel}</div>` : '<div style="flex:1"></div>'}${
      state.mini ? `<div class="minis">${miniHTML(y, m - 1, hol)}${miniHTML(y, m + 1, hol)}</div>` : ''}</div>` : '';

    const no = pad(m + 1);
    let head;
    if (state.layout === 'bloc') {
      head = `<div class="titlebox" data-max="42"><span class="title">${esc(name)}</span></div>
        <div class="metarow"><span class="yrbig">${y}</span>${state.mini ? `<div class="minis2">${miniHTML(y, m - 1, hol)}${miniHTML(y, m + 1, hol)}</div>` : ''}</div>`;
    } else if (state.layout === 'main') {
      const img = photos[m]
        ? `<img src="${photos[m]}" alt=""><button class="rm noprint" type="button" data-rm="${m}">Retirer</button>`
        : `<div class="ph noprint">${state.lang === 'en' ? 'Click to add a picture' : 'Cliquer pour ajouter une image'}</div>`;
      head = `<div class="toprow"><div class="photo mphoto${photos[m] ? '' : ' empty'}" data-photo="${m}">${img}</div>
        <div class="side2"><div class="titlebox" data-max="22"><span class="title">${esc(name)}</span></div>
        <div class="yrtag">${y}</div>
        ${state.mini ? `<div class="minis2">${miniHTML(y, m - 1, hol)}${miniHTML(y, m + 1, hol)}</div>` : ''}</div></div>`;
    } else if (state.layout === 'photo') {
      const img = photos[m]
        ? `<img src="${photos[m]}" alt=""><button class="rm noprint" type="button" data-rm="${m}">Retirer</button>`
        : `<div class="ph noprint">${state.lang === 'en' ? 'Click to add a photo' : 'Cliquer pour ajouter une photo'}</div>`;
      head = `<div class="toprow"><div class="photo${photos[m] ? '' : ' empty'}" data-photo="${m}">${img}</div>
        <div class="side2"><div class="titlebox" data-max="24"><span class="title">${esc(name)}</span></div>
        <div class="meta"><span class="yr">${y}</span><span class="no">${no}</span></div></div></div>`;
    } else {
      head = `<div class="titlebox" data-max="44"><span class="title">${esc(name)}</span></div>
        <div class="meta"><span class="yr">${y}</span><span class="no">${no}</span></div>`;
    }

    const style = `--bg:${t.bg};--ink:${t.ink};--acc:${t.acc};--wk:color-mix(in srgb, ${t.ink} 55%, #fff);--line:${t.ink};--rad:3mm;--ttl:${t.acc};--onacc:${t.onacc}`;
    return `<section class="page f-${state.font}${state.weekNumbers ? ' has-wn' : ''}${HAND.includes(state.layout) ? ' lay-main' : ''}${state.layout === 'bloc' ? ' lay-bloc' : ''}" style="${style}">${head}
      <div class="cal"><div class="dow">${dow}</div>${HAND.includes(state.layout) ? `<div class="weeks">${weeks}<div class="lines" aria-hidden="true">${linesHTML(rows)}</div></div>` : weeks}</div>${foot}</section>`;
  }

  let raf = 0;
  function render() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const y = state.year;
      const ctx = {
        moons: L.moonEvents(y, state.lang),
        hol: L.holidaysFor(y, { cantons: Object.keys(state.cantons).filter((c) => state.cantons[c]), excluded: state.excluded, lang: state.lang }),
      };
      const host = document.getElementById('pages');
      let html = '';
      for (let m = 0; m < 12; m++) html += monthHTML(y, m, ctx);
      host.innerHTML = html;
      document.documentElement.lang = state.lang;
      document.title = (state.lang === 'en' ? 'Calendar ' : 'Calendrier ') + y;
      buildHolidayList();
      if (window.__buildSlots) window.__buildSlots();
      fitTitles(); fitZoom();
    });
  }

  function fitTitles() {
    document.querySelectorAll('.titlebox').forEach((box) => {
      const span = box.firstElementChild;
      span.style.fontSize = '100px';
      const w = span.getBoundingClientRect().width / zoomValue();
      const bw = box.clientWidth;
      let fs = 100 * (bw / w);
      const maxPx = (Number(box.dataset.max) || 40) * 3.7795; // mm -> px
      fs = Math.min(fs, maxPx);
      span.style.fontSize = fs.toFixed(1) + 'px';
    });
  }
  const zoomValue = () => parseFloat(getComputedStyle(document.getElementById('pages')).zoom) || 1;
  function fitZoom() {
    const stage = document.querySelector('.stage');
    const avail = stage.clientWidth - 48;
    const z = Math.max(0.3, Math.min(1, avail / 794));
    document.getElementById('pages').style.setProperty('--z', z.toFixed(3));
  }
  window.addEventListener('resize', () => { fitZoom(); fitTitles(); });
  window.addEventListener('beforeprint', () => { fitTitles(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitles);

  /* ---------- photos (isolé : une erreur ici ne casse pas le calendrier) ---------- */
  const fileInput = document.getElementById('file');
  let pendingMonth = null;
  document.getElementById('pages').addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { removePhoto(+rm.dataset.rm); return; }
    const ph = e.target.closest('[data-photo]');
    if (ph) { pendingMonth = +ph.dataset.photo; fileInput.value = ''; fileInput.click(); }
  });
  fileInput.addEventListener('change', () => {
    const f = fileInput.files[0];
    if (!f || pendingMonth == null) return;
    const m = pendingMonth;
    shrink(f).then((url) => {
      photoMsg(''); photos[m] = url; savePhoto(m, url);
      if (state.layout === 'titre') state.layout = 'photo';
      save(); syncForm(); render();
    }).catch(() => photoMsg(`Impossible de lire « ${f.name} » (${f.type || 'format inconnu'}, ${Math.round(f.size / 1024)} Ko). Essayez de l'enregistrer en JPEG ou PNG.`));
  });
  function photoMsg(t) { const el = document.getElementById('photoMsg'); if (el) { el.textContent = t; el.hidden = !t; } }
  document.getElementById('slots').addEventListener('click', (e) => {
    const b = e.target.closest('[data-slot]'); if (!b) return;
    pendingMonth = +b.dataset.slot; fileInput.value = ''; fileInput.click();
  });
  document.getElementById('usePhotos').addEventListener('change', (e) => {
    state.layout = e.target.checked ? 'photo' : 'titre'; save(); syncForm(); render();
  });
  function buildSlots() {
    document.getElementById('slots').innerHTML = Array.from({ length: 12 }, (_, m) => {
      const name = monthName(state.year, m);
      const bg = photos[m] ? ` style="background-image:url(${photos[m]})"` : '';
      return `<button type="button" class="slot${photos[m] ? ' has' : ''}" data-slot="${m}"${bg} title="${name}"><span>${name.slice(0, 4)}</span></button>`;
    }).join('');
  }
  function draw(src, w, h) {
    const k = Math.min(1, 1600 / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.85);
  }
  function shrink(file) {
    const viaImage = () => new Promise((res, rej) => {
      const img = new Image(); const u = URL.createObjectURL(file);
      img.onload = () => { try { res(draw(img, img.naturalWidth || img.width, img.naturalHeight || img.height)); } catch (e) { rej(e); } URL.revokeObjectURL(u); };
      img.onerror = () => { URL.revokeObjectURL(u); rej(new Error('decode')); };
      img.src = u;
    });
    if (typeof createImageBitmap !== 'function') return viaImage();
    return createImageBitmap(file, { imageOrientation: 'from-image' })
      .then((bmp) => { const url = draw(bmp, bmp.width, bmp.height); if (bmp.close) bmp.close(); return url; })
      .catch(viaImage);
  }
  function idb(fn) {
    try {
      const req = indexedDB.open('calendar-photos', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('p');
      req.onsuccess = () => { try { fn(req.result.transaction('p', 'readwrite').objectStore('p')); } catch (e) { /* ignoré */ } };
    } catch (e) { /* ignoré */ }
  }
  const savePhoto = (m, url) => idb((s) => {
    const r = s.put(url, m);
    r.onerror = () => photoMsg('Image affichée mais non enregistrée (stockage du navigateur plein ou bloqué) : elle ne sera pas conservée au rechargement.');
  });
  function removePhoto(m) { delete photos[m]; idb((s) => s.delete(m)); render(); }
  window.__buildSlots = () => buildSlots();
  function loadPhotos() {
    idb((s) => {
      const r = s.openCursor();
      r.onsuccess = () => { const c = r.result; if (c) { photos[c.key] = c.value; c.continue(); } else render(); };
    });
  }

  /* ---------- boutons ---------- */
  document.getElementById('print').addEventListener('click', () => { fitTitles(); window.print(); });
  document.getElementById('reset').addEventListener('click', () => { state = DEFAULTS(); save(); syncForm(); render(); });

  buildThemes(); syncForm(); render(); loadPhotos();
})();
