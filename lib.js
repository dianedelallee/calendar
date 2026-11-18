/* Logique pure : phases de lune, noms des pleines lunes, jours fériés VD/GE.
   Utilisable dans le navigateur (window.CalLib) et dans Node (tests). */
(function (root) {
  'use strict';
  const rad = (d) => (d * Math.PI) / 180;
  const sin = (d) => Math.sin(rad(d));
  const cos = (d) => Math.cos(rad(d));

  /* ---------- Lune : Jean Meeus, Astronomical Algorithms, ch. 49 ---------- */
  function phaseJDE(k, phase) {
    // phase: 0 nouvelle, 1 premier quartier, 2 pleine, 3 dernier quartier
    const kk = k + phase * 0.25;
    const T = kk / 1236.85;
    let jde = 2451550.09766 + 29.530588861 * kk + 0.00015437 * T * T
      - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const M = 2.5534 + 29.1053567 * kk - 0.0000014 * T * T - 0.00000011 * T ** 3;
    const Mp = 201.5643 + 385.81693528 * kk + 0.0107582 * T * T + 0.00001238 * T ** 3 - 0.000000058 * T ** 4;
    const F = 160.7108 + 390.67050284 * kk - 0.0016118 * T * T - 0.00000227 * T ** 3 + 0.000000011 * T ** 4;
    const O = 124.7746 - 1.56375588 * kk + 0.0020672 * T * T + 0.00000215 * T ** 3;
    const E2 = E * E;
    let c;
    if (phase === 0) {
      c = -0.4072 * sin(Mp) + 0.17241 * E * sin(M) + 0.01608 * sin(2 * Mp) + 0.01039 * sin(2 * F)
        + 0.00739 * E * sin(Mp - M) - 0.00514 * E * sin(Mp + M) + 0.00208 * E2 * sin(2 * M)
        - 0.00111 * sin(Mp - 2 * F) - 0.00057 * sin(Mp + 2 * F) + 0.00056 * E * sin(2 * Mp + M)
        - 0.00042 * sin(3 * Mp) + 0.00042 * E * sin(M + 2 * F) + 0.00038 * E * sin(M - 2 * F)
        - 0.00024 * E * sin(2 * Mp - M) - 0.00017 * sin(O) - 0.00007 * sin(Mp + 2 * M)
        + 0.00004 * sin(2 * Mp - 2 * F) + 0.00004 * sin(3 * M) + 0.00003 * sin(Mp + M - 2 * F)
        + 0.00003 * sin(2 * Mp + 2 * F) - 0.00003 * sin(Mp + M + 2 * F) + 0.00003 * sin(Mp - M + 2 * F)
        - 0.00002 * sin(Mp - M - 2 * F) - 0.00002 * sin(3 * Mp + M) + 0.00002 * sin(4 * Mp);
    } else if (phase === 2) {
      c = -0.40614 * sin(Mp) + 0.17302 * E * sin(M) + 0.01614 * sin(2 * Mp) + 0.01043 * sin(2 * F)
        + 0.00734 * E * sin(Mp - M) - 0.00515 * E * sin(Mp + M) + 0.00209 * E2 * sin(2 * M)
        - 0.00111 * sin(Mp - 2 * F) - 0.00057 * sin(Mp + 2 * F) + 0.00056 * E * sin(2 * Mp + M)
        - 0.00042 * sin(3 * Mp) + 0.00042 * E * sin(M + 2 * F) + 0.00038 * E * sin(M - 2 * F)
        - 0.00024 * E * sin(2 * Mp - M) - 0.00017 * sin(O) - 0.00007 * sin(Mp + 2 * M)
        + 0.00004 * sin(2 * Mp - 2 * F) + 0.00004 * sin(3 * M) + 0.00003 * sin(Mp + M - 2 * F)
        + 0.00003 * sin(2 * Mp + 2 * F) - 0.00003 * sin(Mp + M + 2 * F) + 0.00003 * sin(Mp - M + 2 * F)
        - 0.00002 * sin(Mp - M - 2 * F) - 0.00002 * sin(3 * Mp + M) + 0.00002 * sin(4 * Mp);
    } else {
      c = -0.62801 * sin(Mp) + 0.17172 * E * sin(M) - 0.01183 * E * sin(Mp + M) + 0.00862 * sin(2 * Mp)
        + 0.00804 * sin(2 * F) + 0.00454 * E * sin(Mp - M) + 0.00204 * E2 * sin(2 * M)
        - 0.0018 * sin(Mp - 2 * F) - 0.0007 * sin(Mp + 2 * F) - 0.0004 * sin(3 * Mp)
        - 0.00034 * E * sin(2 * Mp - M) + 0.00032 * E * sin(M + 2 * F) + 0.00032 * E * sin(M - 2 * F)
        - 0.00028 * E2 * sin(Mp + 2 * M) + 0.00027 * E * sin(2 * Mp + M) - 0.00017 * sin(O)
        - 0.00005 * sin(Mp - M - 2 * F) + 0.00004 * sin(2 * Mp + 2 * F) - 0.00004 * sin(Mp + M + 2 * F)
        + 0.00004 * sin(Mp - 2 * M) + 0.00003 * sin(Mp + M - 2 * F) + 0.00003 * sin(3 * M)
        + 0.00002 * sin(2 * Mp - 2 * F) + 0.00002 * sin(Mp - M + 2 * F) - 0.00002 * sin(3 * Mp + M);
      const W = 0.00306 - 0.00038 * E * cos(M) + 0.00026 * cos(Mp) - 0.00002 * cos(Mp - M)
        + 0.00002 * cos(Mp + M) + 0.00002 * cos(2 * F);
      c += phase === 1 ? W : -W;
    }
    const A = [
      [299.77 + 0.107408 * kk - 0.009173 * T * T, 0.000325],
      [251.88 + 0.016321 * kk, 0.000165], [251.83 + 26.651886 * kk, 0.000164],
      [349.42 + 36.412478 * kk, 0.000126], [84.66 + 18.206239 * kk, 0.00011],
      [141.74 + 53.303771 * kk, 0.000062], [207.14 + 2.453732 * kk, 0.00006],
      [154.84 + 7.30686 * kk, 0.000056], [34.52 + 27.261239 * kk, 0.000047],
      [207.19 + 0.121824 * kk, 0.000042], [291.34 + 1.844379 * kk, 0.00004],
      [161.72 + 24.198154 * kk, 0.000037], [239.56 + 25.513099 * kk, 0.000035],
      [331.55 + 3.592518 * kk, 0.000023],
    ];
    let add = 0;
    for (const [a, w] of A) add += w * sin(a);
    jde += c + add;
    return jde;
  }

  // JDE (temps dynamique) -> Date (UTC). ΔT ≈ 69 s autour de 2026.
  function jdeToDate(jde) {
    const ms = (jde - 2440587.5) * 86400000 - 69 * 1000;
    return new Date(Math.round(ms));
  }

  const PHASE_KEYS = ['new', 'first', 'full', 'last'];

  /** Toutes les phases entre le 1er déc. de year-1 et le 31 janv. de year+1. */
  function moonPhases(year) {
    const start = Date.UTC(year - 1, 11, 1), end = Date.UTC(year + 1, 1, 1);
    const k0 = Math.floor(((year - 1 + 11 / 12) - 2000) * 12.3685) - 1;
    const out = [];
    for (let k = k0; k < k0 + 12 * 14.5; k++) {
      for (let p = 0; p < 4; p++) {
        const d = jdeToDate(phaseJDE(k, p));
        if (d >= start && d < end) out.push({ date: d, phase: PHASE_KEYS[p] });
      }
    }
    return out.sort((a, b) => a.date - b.date);
  }

  /* ---------- Fuseau Europe/Zurich ---------- */
  const zurichFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  function zurichParts(date) {
    const o = {};
    for (const p of zurichFmt.formatToParts(date)) o[p.type] = p.value;
    return { y: +o.year, m: +o.month, d: +o.day, hh: o.hour, mm: o.minute };
  }
  const pad = (n) => String(n).padStart(2, '0');
  const key = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

  /* ---------- Noms des pleines lunes ---------- */
  const MOON_NAMES = {
    fr: {
      months: ['Lune du Loup', 'Lune des Neiges', 'Lune du Ver', 'Lune Rose', 'Lune des Fleurs',
        'Lune des Fraises', 'Lune du Cerf', "Lune de l'Esturgeon", 'Lune du Maïs', 'Lune du Chasseur',
        'Lune du Castor', 'Lune Froide'],
      harvest: 'Lune des Moissons', hunter: 'Lune du Chasseur', beaver: 'Lune du Castor',
      cold: 'Lune Froide', corn: 'Lune du Maïs', blue: 'Lune Bleue',
      phases: { new: 'Nouvelle lune', first: 'Premier quartier', full: 'Pleine lune', last: 'Dernier quartier' },
    },
    en: {
      months: ['Wolf Moon', 'Snow Moon', 'Worm Moon', 'Pink Moon', 'Flower Moon', 'Strawberry Moon',
        'Buck Moon', 'Sturgeon Moon', 'Corn Moon', "Hunter's Moon", 'Beaver Moon', 'Cold Moon'],
      harvest: 'Harvest Moon', hunter: "Hunter's Moon", beaver: 'Beaver Moon',
      cold: 'Cold Moon', corn: 'Corn Moon', blue: 'Blue Moon',
      phases: { new: 'New Moon', first: 'First quarter', full: 'Full Moon', last: 'Last quarter' },
    },
  };

  function autumnEquinox(year) {
    const Y = (year - 2000) / 1000;
    const jde = 2451810.21715 + 365242.01767 * Y - 0.11575 * Y * Y + 0.00337 * Y ** 3 + 0.00078 * Y ** 4;
    return jdeToDate(jde);
  }

  /**
   * Phases de l'année, avec date locale Zurich et nom (pleines lunes).
   * Retourne { 'YYYY-MM-DD': [ {phase, name, time, date} ] }
   */
  function moonEvents(year, lang) {
    const N = MOON_NAMES[lang] || MOON_NAMES.fr;
    const all = moonPhases(year).map((e) => ({ ...e, loc: zurichParts(e.date) }));
    const fulls = all.filter((e) => e.phase === 'full');
    // Lune des moissons : pleine lune la plus proche de l'équinoxe d'automne.
    const eq = autumnEquinox(year);
    let h = -1, best = Infinity;
    fulls.forEach((f, i) => {
      if (f.loc.y !== year) return;
      const dist = Math.abs(f.date - eq);
      if (dist < best) { best = dist; h = i; }
    });
    const seen = {};
    fulls.forEach((f, i) => {
      const mk = f.loc.y * 12 + f.loc.m;
      seen[mk] = (seen[mk] || 0) + 1;
      let name = N.months[f.loc.m - 1];
      if (i === h) name = N.harvest;
      else if (i === h + 1) name = N.hunter;
      else if (i === h + 2) name = N.beaver;
      else if (i === h + 3) name = N.cold;
      else if (f.loc.m === 9 && f.loc.y === year) name = N.corn;
      if (seen[mk] === 2) name = N.blue;
      f.name = name;
    });
    const out = {};
    for (const e of all) {
      const k = key(e.loc.y, e.loc.m, e.loc.d);
      (out[k] = out[k] || []).push({
        phase: e.phase,
        name: e.phase === 'full' ? e.name : N.phases[e.phase],
        label: N.phases[e.phase],
        time: `${e.loc.hh}:${e.loc.mm}`,
        date: e.date,
      });
    }
    return out;
  }

  /* ---------- Jours fériés ---------- */
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(y, month - 1, day));
  }
  const addDays = (dt, n) => new Date(dt.getTime() + n * 86400000);
  const dayOfWeek = (y, m, d) => new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = dimanche

  function firstSundayOnOrAfter(y, m, d) {
    const w = dayOfWeek(y, m, d);
    return d + ((7 - w) % 7);
  }

  /** Catalogue : id, cantons, noms, calcul de la date. */
  const HOLIDAYS = [
    { id: 'newyear', cantons: ['VD', 'GE', 'FR'], fr: "Nouvel An", en: "New Year's Day", date: (y) => [y, 1, 1] },
    { id: 'berchtold', cantons: ['VD'], fr: 'Lendemain du Nouvel An', en: "Berchtold's Day", date: (y) => [y, 1, 2] },
    { id: 'goodfriday', cantons: ['VD', 'GE'], fr: 'Vendredi saint', en: 'Good Friday', date: (y) => ymd(addDays(easter(y), -2)) },
    { id: 'eastersun', cantons: ['VD', 'GE', 'FR'], fr: 'Pâques', en: 'Easter Sunday', date: (y) => ymd(easter(y)), optional: true },
    { id: 'eastermon', cantons: ['VD', 'GE', 'FR'], fr: 'Lundi de Pâques', en: 'Easter Monday', date: (y) => ymd(addDays(easter(y), 1)) },
    { id: 'ascension', cantons: ['VD', 'GE', 'FR'], fr: 'Ascension', en: 'Ascension Day', date: (y) => ymd(addDays(easter(y), 39)) },
    { id: 'pentecostsun', cantons: ['VD', 'GE', 'FR'], fr: 'Pentecôte', en: 'Whit Sunday', date: (y) => ymd(addDays(easter(y), 49)), optional: true },
    { id: 'pentecostmon', cantons: ['VD', 'GE', 'FR'], fr: 'Lundi de Pentecôte', en: 'Whit Monday', date: (y) => ymd(addDays(easter(y), 50)) },
    { id: 'natday', cantons: ['VD', 'GE'], fr: 'Fête nationale', en: 'Swiss National Day', date: (y) => [y, 8, 1] },
    { id: 'jeunefed', cantons: ['VD'], fr: 'Lundi du Jeûne fédéral', en: 'Federal Fast Monday',
      date: (y) => { const s = firstSundayOnOrAfter(y, 9, 15); return [y, 9, s + 1]; } }, // 3e dimanche + 1
    { id: 'jeunegen', cantons: ['GE'], fr: 'Jeûne genevois', en: 'Genevan Fast',
      date: (y) => { const s = firstSundayOnOrAfter(y, 9, 1); return [y, 9, s + 4]; } }, // jeudi après le 1er dimanche
    { id: 'labour', cantons: ['FR'], fr: 'Fête du Travail', en: 'Labour Day', date: (y) => [y, 5, 1] },
    { id: 'victory', cantons: ['FR'], fr: 'Victoire 1945', en: 'Victory in Europe Day', date: (y) => [y, 5, 8] },
    { id: 'bastille', cantons: ['FR'], fr: 'Fête nationale', en: 'Bastille Day', date: (y) => [y, 7, 14] },
    { id: 'assumption', cantons: ['FR'], fr: 'Assomption', en: 'Assumption Day', date: (y) => [y, 8, 15] },
    { id: 'allsaints', cantons: ['FR'], fr: 'Toussaint', en: "All Saints' Day", date: (y) => [y, 11, 1] },
    { id: 'armistice', cantons: ['FR'], fr: 'Armistice 1918', en: 'Armistice Day', date: (y) => [y, 11, 11] },
    { id: 'christmas', cantons: ['VD', 'GE', 'FR'], fr: 'Noël', en: 'Christmas Day', date: (y) => [y, 12, 25] },
    { id: 'restauration', cantons: ['GE'], fr: 'Restauration de la République', en: 'Restoration of the Republic', date: (y) => [y, 12, 31] },
  ];
  function ymd(dt) { return [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()]; }

  /** options: { cantons: ['VD','GE'], excluded: [ids], lang } -> { key: [{id,label,cantons}] } */
  function holidaysFor(year, opts) {
    const lang = opts.lang === 'en' ? 'en' : 'fr';
    const out = {};
    const selected = opts.cantons || [];
    for (const h of HOLIDAYS) {
      if (opts.excluded && opts.excluded.includes(h.id)) continue;
      const cs = h.cantons.filter((c) => selected.includes(c));
      if (!cs.length) continue;
      const [y, m, d] = h.date(year);
      const showTag = selected.length > 1 && cs.length < selected.length;
      const label = h[lang] + (showTag ? ` (${cs.join('/')})` : '');
      (out[key(y, m, d)] = out[key(y, m, d)] || []).push({ id: h.id, label, cantons: cs, optional: !!h.optional });
    }
    return out;
  }

  const api = { moonPhases, moonEvents, zurichParts, holidaysFor, HOLIDAYS, easter, MOON_NAMES, key, pad };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CalLib = api;
})(typeof window !== 'undefined' ? window : globalThis);
