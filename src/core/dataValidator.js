// Data validation. Pure functions, no DOM and no network.
// Every validator returns { ok, errors[] }.

import { greatCircleKm, BODY_RADIUS_KM } from './geo.js';

export const EXPECTED_CHAPTER_COUNTS = Object.freeze({
  surveyor3: 6,
  apollo11: 4,
  apollo17: 4,
  viking1: 5,
  opportunity: 4,
  insight: 5,
});

export const LIMITS = Object.freeze({
  minChapters: 3,
  maxChapters: 6,
  captionMax: 120,
  tooltipMax: 80,
  descriptionMax: 160,
  markerMaxKm: 100,
  modelZoomMin: 0.5,
  modelZoomMax: 5,
  textureMaxPx: 2048,
  modelMaxBytes: 5 * 1024 * 1024,
});

const NASA_IMAGE_HOSTS = ['images.nasa.gov', 'images-assets.nasa.gov'];
const ALLOWED_LICENSES = ['Public domain', 'CC0', 'CC BY 4.0', 'Royalty-free'];

const result = (errors) => ({ ok: errors.length === 0, errors });
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isVec3 = (v) => Array.isArray(v) && v.length === 3 && v.every(isNum);

function parseHttpUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u : null;
  } catch {
    return null;
  }
}

function hostIsNasa(host) {
  const h = host.toLowerCase();
  return h === 'nasa.gov' || h.endsWith('.nasa.gov');
}

/** True for http(s) URLs whose host is nasa.gov or a subdomain of it. */
export function isNasaUrl(url) {
  const u = parseHttpUrl(url);
  return u !== null && hostIsNasa(u.hostname);
}

function isNasaImageHostUrl(url) {
  const u = parseHttpUrl(url);
  return u !== null && NASA_IMAGE_HOSTS.includes(u.hostname.toLowerCase());
}

function checkCitation(c, where, errors) {
  if (!isObj(c)) {
    errors.push(`${where}: citation must be an object`);
    return;
  }
  if (!isStr(c.label)) errors.push(`${where}: citation label is missing`);
  if (!isNasaUrl(c.url)) errors.push(`${where}: citation url must be on nasa.gov (got ${JSON.stringify(c.url)})`);
}

function checkImage(img, where, errors) {
  if (!isObj(img)) {
    errors.push(`${where}: image must be an object`);
    return;
  }
  if (!isStr(img.src)) {
    errors.push(`${where}: image src is missing`);
  } else if (/^[a-z][a-z0-9+.-]*:/i.test(img.src) || img.src.startsWith('//')) {
    // Remote image: must be on a NASA image host. Otherwise it is a local path.
    if (!isNasaImageHostUrl(img.src)) {
      errors.push(`${where}: image src must be on images.nasa.gov or images-assets.nasa.gov (got ${img.src})`);
    }
  }
  if (!isStr(img.nasaId)) errors.push(`${where}: image nasaId is missing`);
  if (!isNasaImageHostUrl(img.sourceUrl)) {
    errors.push(`${where}: image sourceUrl must be on images.nasa.gov or images-assets.nasa.gov`);
  } else if (isStr(img.nasaId) && !img.sourceUrl.includes(encodeURIComponent(img.nasaId)) && !img.sourceUrl.includes(img.nasaId)) {
    errors.push(`${where}: image sourceUrl does not contain nasaId ${img.nasaId}`);
  }
  if (!isStr(img.alt)) errors.push(`${where}: image alt text is missing`);
  if (!isStr(img.caption)) {
    errors.push(`${where}: image caption is missing`);
  } else {
    if (img.caption.length > LIMITS.captionMax) {
      errors.push(`${where}: caption is ${img.caption.length} chars (max ${LIMITS.captionMax})`);
    }
    if (!/Credit:\s*NASA/.test(img.caption)) errors.push(`${where}: caption must include "Credit: NASA"`);
  }
}

function checkKeyframe(k, where, errors) {
  if (!isObj(k)) {
    errors.push(`${where}: keyframe is missing`);
    return;
  }
  for (const key of ['cameraOffset', 'lookAt', 'modelRotation']) {
    if (!isVec3(k[key])) errors.push(`${where}: keyframe.${key} must be an array of 3 numbers`);
  }
  if (!isNum(k.modelZoom) || k.modelZoom < LIMITS.modelZoomMin || k.modelZoom > LIMITS.modelZoomMax) {
    errors.push(`${where}: keyframe.modelZoom must be within ${LIMITS.modelZoomMin}..${LIMITS.modelZoomMax}`);
  }
  if (!isNum(k.lightAzimuthDeg)) errors.push(`${where}: keyframe.lightAzimuthDeg must be a number`);
  if (!isNum(k.lightIntensity)) errors.push(`${where}: keyframe.lightIntensity must be a number`);
}

function checkChapter(ch, where, errors) {
  if (!isObj(ch)) {
    errors.push(`${where}: chapter must be an object`);
    return;
  }
  if (!isStr(ch.id)) errors.push(`${where}: chapter id is missing`);
  if (!isStr(ch.title)) errors.push(`${where}: chapter title is missing`);
  if (!isStr(ch.narrative)) errors.push(`${where}: chapter narrative is missing`);
  if (!isObj(ch.callout) || !isStr(ch.callout.text)) {
    errors.push(`${where}: callout text is missing`);
  } else {
    checkCitation(ch.callout.citation, `${where} callout`, errors);
  }
  if (!Array.isArray(ch.images) || ch.images.length < 1) {
    errors.push(`${where}: chapter needs at least one image`);
  } else {
    ch.images.forEach((img, i) => checkImage(img, `${where} image[${i}]`, errors));
  }
  checkKeyframe(ch.keyframe, where, errors);
}

function checkLatLon(p, where, errors) {
  if (!isObj(p) || !isNum(p.lat) || !isNum(p.lon) || p.lat < -90 || p.lat > 90 || p.lon < -180 || p.lon > 180) {
    errors.push(`${where}: must have lat in [-90, 90] and lon in [-180, 180]`);
    return false;
  }
  return true;
}

/** Validates the missions array (design: missions.json). */
export function validateMissions(missions) {
  const errors = [];
  if (!Array.isArray(missions)) return result(['missions must be an array']);

  const seen = new Set();
  const perBody = { moon: 0, mars: 0 };

  missions.forEach((m, idx) => {
    if (!isObj(m)) {
      errors.push(`missions[${idx}] must be an object`);
      return;
    }
    const id = isStr(m.id) ? m.id : `#${idx}`;
    const w = `mission ${id}`;
    if (!isStr(m.id)) errors.push(`${w}: id is missing`);
    else if (seen.has(m.id)) errors.push(`${w}: duplicate id`);
    else seen.add(m.id);

    if (m.body === 'moon' || m.body === 'mars') perBody[m.body] += 1;
    else errors.push(`${w}: body must be "moon" or "mars"`);

    if (!isStr(m.name)) errors.push(`${w}: name is missing`);

    // Tooltip and description limits (3.4, 3.5, 8.5)
    if (!isStr(m.tooltip)) errors.push(`${w}: tooltip is missing`);
    else if (m.tooltip.length > LIMITS.tooltipMax) {
      errors.push(`${w}: tooltip is ${m.tooltip.length} chars (max ${LIMITS.tooltipMax})`);
    }
    if (!isStr(m.description)) errors.push(`${w}: description is missing`);
    else if (m.description.length > LIMITS.descriptionMax) {
      errors.push(`${w}: description is ${m.description.length} chars (max ${LIMITS.descriptionMax})`);
    }

    // Marker coordinates within 100 km of published coordinates (9.3)
    const landingOk = checkLatLon(m.landing, `${w}: landing`, errors);
    const refOk = checkLatLon(m.referenceLanding, `${w}: referenceLanding`, errors);
    if (landingOk && refOk && BODY_RADIUS_KM[m.body]) {
      const km = greatCircleKm(m.landing, m.referenceLanding, BODY_RADIUS_KM[m.body]);
      if (km > LIMITS.markerMaxKm) {
        errors.push(`${w}: landing is ${km.toFixed(1)} km from referenceLanding (max ${LIMITS.markerMaxKm} km)`);
      }
    }

    // Citations (9.2, 6.17, 6.18)
    if (!Array.isArray(m.citations) || m.citations.length < 1) {
      errors.push(`${w}: at least one citation is required`);
    } else {
      m.citations.forEach((c, i) => checkCitation(c, `${w} citation[${i}]`, errors));
    }

    // Chapters (6.3, 6.12)
    if (!Array.isArray(m.chapters)) {
      errors.push(`${w}: chapters must be an array`);
      return;
    }
    const n = m.chapters.length;
    if (n < LIMITS.minChapters || n > LIMITS.maxChapters) {
      errors.push(`${w}: has ${n} chapters (must be ${LIMITS.minChapters} to ${LIMITS.maxChapters})`);
    }
    const expected = EXPECTED_CHAPTER_COUNTS[m.id];
    if (expected === undefined) {
      errors.push(`${w}: unknown mission id`);
    } else if (n !== expected) {
      errors.push(`${w}: has ${n} chapters (expected exactly ${expected})`);
    }
    m.chapters.forEach((ch, i) => checkChapter(ch, `${w} chapter[${i}]`, errors));
  });

  if (missions.length > 0) {
    if (perBody.moon !== 3) errors.push(`expected exactly 3 Moon missions, found ${perBody.moon}`);
    if (perBody.mars !== 3) errors.push(`expected exactly 3 Mars missions, found ${perBody.mars}`);
  }
  for (const id of Object.keys(EXPECTED_CHAPTER_COUNTS)) {
    if (missions.length > 0 && !seen.has(id)) errors.push(`mission ${id} is missing`);
  }

  return result(errors);
}

/**
 * Validates the quizzes array (design: quizzes.json).
 * If `missions` is given, each mission must have exactly one quiz.
 */
export function validateQuizzes(quizzes, missions) {
  const errors = [];
  if (!Array.isArray(quizzes)) return result(['quizzes must be an array']);

  const quizIds = new Map();
  quizzes.forEach((q, qi) => {
    if (!isObj(q)) {
      errors.push(`quizzes[${qi}] must be an object`);
      return;
    }
    const w = `quiz ${isStr(q.missionId) ? q.missionId : `#${qi}`}`;
    if (!isStr(q.missionId)) errors.push(`${w}: missionId is missing`);
    else quizIds.set(q.missionId, (quizIds.get(q.missionId) || 0) + 1);

    if (!Array.isArray(q.questions) || q.questions.length !== 3) {
      errors.push(`${w}: must have exactly 3 questions (found ${Array.isArray(q.questions) ? q.questions.length : 0})`);
    }
    (Array.isArray(q.questions) ? q.questions : []).forEach((question, i) => {
      const qw = `${w} question[${i}]`;
      if (!isObj(question)) {
        errors.push(`${qw}: must be an object`);
        return;
      }
      if (!isStr(question.id)) errors.push(`${qw}: id is missing`);
      if (!isStr(question.prompt)) errors.push(`${qw}: prompt is missing`);
      if (!isStr(question.explanation)) errors.push(`${qw}: explanation is missing`);
      if (!isNasaUrl(question.sourceUrl)) errors.push(`${qw}: sourceUrl must be on nasa.gov`);
      if (!Array.isArray(question.choices) || question.choices.length !== 4) {
        errors.push(`${qw}: must have exactly 4 choices`);
      }
      const choices = Array.isArray(question.choices) ? question.choices : [];
      const ids = new Set();
      let correct = 0;
      choices.forEach((c, ci) => {
        if (!isObj(c) || !isStr(c.id) || !isStr(c.text) || typeof c.correct !== 'boolean') {
          errors.push(`${qw} choice[${ci}]: needs id, text and boolean correct`);
          return;
        }
        if (ids.has(c.id)) errors.push(`${qw} choice[${ci}]: duplicate choice id ${c.id}`);
        ids.add(c.id);
        if (c.correct) correct += 1;
      });
      if (correct !== 1) errors.push(`${qw}: must have exactly one correct choice (found ${correct})`);
    });
  });

  for (const [id, count] of quizIds) {
    if (count > 1) errors.push(`quiz ${id}: duplicated`);
  }
  if (Array.isArray(missions)) {
    const missionIds = new Set(missions.filter(isObj).map((m) => m.id));
    for (const id of missionIds) {
      if (!quizIds.has(id)) errors.push(`mission ${id} has no quiz`);
    }
    for (const id of quizIds.keys()) {
      if (!missionIds.has(id)) errors.push(`quiz ${id} does not match any mission`);
    }
  }

  return result(errors);
}

/**
 * Validates audio config (design: audio.json) and, if `missions` is given,
 * that every mission track id resolves to a track.
 */
export function validateAudio(audio, missions) {
  const errors = [];
  if (!isObj(audio)) return result(['audio config must be an object']);

  const trackIds = new Set();
  const checkEntry = (e, where) => {
    if (!isObj(e)) {
      errors.push(`${where}: must be an object`);
      return;
    }
    if (!isStr(e.id)) errors.push(`${where}: id is missing`);
    if (!isStr(e.file)) errors.push(`${where}: file is missing`);
    if (!isStr(e.source)) errors.push(`${where}: source is missing`);
    if (!isStr(e.license)) errors.push(`${where}: license is missing`);
    else if (!ALLOWED_LICENSES.includes(e.license)) {
      errors.push(`${where}: license "${e.license}" is not one of ${ALLOWED_LICENSES.join(', ')}`);
    }
    if (!isNum(e.gain) || e.gain < 0 || e.gain > 1) errors.push(`${where}: gain must be within 0..1`);
  };

  if (!Array.isArray(audio.tracks)) errors.push('audio.tracks must be an array');
  (Array.isArray(audio.tracks) ? audio.tracks : []).forEach((t, i) => {
    checkEntry(t, `track[${i}]`);
    if (isObj(t) && isStr(t.id)) {
      if (trackIds.has(t.id)) errors.push(`track ${t.id}: duplicate id`);
      trackIds.add(t.id);
    }
  });
  if (Array.isArray(audio.tracks) && !trackIds.has('space-ambient')) {
    errors.push('track space-ambient is missing');
  }
  if (audio.effects !== undefined) {
    if (!Array.isArray(audio.effects)) errors.push('audio.effects must be an array');
    else audio.effects.forEach((e, i) => checkEntry(e, `effect[${i}]`));
  }

  if (Array.isArray(missions)) {
    missions.forEach((m) => {
      if (!isObj(m)) return;
      const w = `mission ${m.id}`;
      // A mission's own `audio` wins; otherwise use the audio.json `missions` map.
      const a = isObj(m.audio) ? m.audio : isObj(audio.missions) ? audio.missions[m.id]?.audio : undefined;
      if (!isObj(a) || !isStr(a.trackId)) {
        errors.push(`${w}: audio.trackId is missing`);
        return;
      }
      if (!trackIds.has(a.trackId)) errors.push(`${w}: audio track "${a.trackId}" does not resolve`);
      if (a.variationTrackId !== undefined && !trackIds.has(a.variationTrackId)) {
        errors.push(`${w}: variation track "${a.variationTrackId}" does not resolve`);
      }
      if (Array.isArray(m.chapters) && m.chapters.some((c) => isObj(c) && c.useVariationTrack) && a.variationTrackId === undefined) {
        errors.push(`${w}: a chapter uses the variation track but audio.variationTrackId is missing`);
      }
    });
  }

  return result(errors);
}

/**
 * Validates asset budgets (13.9). Entries are
 * { kind: 'texture', path, widthPx } or { kind: 'model', path, bytes }.
 * One error per violating entry; exact boundaries (2048 px, 5 MB) are accepted.
 */
export function validateAssetBudget(assets) {
  const errors = [];
  if (!Array.isArray(assets)) return result(['assets must be an array']);

  assets.forEach((a, i) => {
    if (!isObj(a)) {
      errors.push(`asset[${i}]: must be an object`);
      return;
    }
    const name = a.path ?? `#${i}`;
    if (a.kind === 'texture') {
      if (a.widthPx > LIMITS.textureMaxPx) {
        errors.push(`texture ${name}: ${a.widthPx} px wide (max ${LIMITS.textureMaxPx})`);
      }
    } else if (a.kind === 'model') {
      if (a.bytes > LIMITS.modelMaxBytes) {
        errors.push(`model ${name}: ${a.bytes} bytes (max ${LIMITS.modelMaxBytes})`);
      }
    } else {
      errors.push(`asset ${name}: unknown kind ${JSON.stringify(a.kind)}`);
    }
  });

  return result(errors);
}
