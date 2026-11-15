// Story column rendering (Requirements 6.1-6.3, 6.12, 6.17, 9.2, 9.5, 12).
import { isNasaUrl } from '../core/dataValidator.js';
import {
  activeChapterIndex,
  interpolateKeyframe,
  isPastLastChapter,
  normalizeProgress,
  overallProgress
} from '../core/scrollMath.js';
import { STRINGS } from './strings.js';
import '../styles/story.css';

function el(doc, tag, className, text) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Pure render of one citation. Always keeps the label; links only NASA URLs.
 * Returns a <p class="story-citation"> element.
 */
export function renderCitation(citation, doc = document) {
  const p = el(doc, 'p', 'story-citation');
  p.appendChild(doc.createTextNode(`${STRINGS.story.source}: `));
  const label = citation && typeof citation.label === 'string' ? citation.label : '';
  if (citation && isNasaUrl(citation.url)) {
    const a = el(doc, 'a', 'story-citation__link', label);
    a.href = citation.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    p.appendChild(a);
  } else {
    p.appendChild(el(doc, 'span', 'story-citation__label', label));
    p.appendChild(
      el(doc, 'span', 'story-citation__unavailable', ` (${STRINGS.story.citationUnavailable})`)
    );
  }
  return p;
}

/** Replace a failed image with a bordered text placeholder showing its alt text (Req 6.16). */
function swapInPlaceholder(doc, img) {
  if (!img.parentNode) return;
  const ph = el(doc, 'div', 'story-figure__placeholder', img.alt || '');
  ph.setAttribute('role', 'img');
  ph.setAttribute('aria-label', img.alt || '');
  img.replaceWith(ph);
}

/** Delay between a paragraph and its images appearing (ms, within the 400 ms image budget). */
const FIGURE_DELAY_MS = 100;

/**
 * Reveal titles/paragraphs/callouts when 20% visible; figures after their paragraph (Req 6.4).
 * Falls back to showing everything when IntersectionObserver is unavailable.
 * Returns a disconnect function.
 */
function setupReveal(root, win) {
  const targets = root.querySelectorAll(
    '.story-chapter__title, .story-chapter__narrative, .story-callout, .story-figure'
  );
  const timers = new Set();
  const show = (node) => node.classList.add('is-visible');
  const IO = win && win.IntersectionObserver;
  if (typeof IO !== 'function') {
    targets.forEach(show);
    return () => {};
  }
  const reveal = (node) => {
    if (node.classList.contains('is-visible')) return;
    if (node.classList.contains('story-figure')) {
      const chapter = node.closest('.story-chapter');
      const narrative = chapter && chapter.querySelector('.story-chapter__narrative');
      if (narrative && !narrative.classList.contains('is-visible')) show(narrative);
      const t = win.setTimeout(() => {
        timers.delete(t);
        show(node);
      }, FIGURE_DELAY_MS);
      timers.add(t);
    } else {
      show(node);
    }
  };
  const observer = new IO(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.2 }
  );
  targets.forEach((t) => observer.observe(t));
  return () => {
    observer.disconnect();
    timers.forEach((t) => win.clearTimeout(t));
    timers.clear();
  };
}

function renderFigure(doc, image) {
  const fig = el(doc, 'figure', 'story-figure');
  const img = el(doc, 'img', 'story-figure__img');
  img.src = image.src;
  img.alt = image.alt || '';
  img.loading = 'lazy';
  img.addEventListener('error', () => swapInPlaceholder(doc, img));
  fig.appendChild(img);
  fig.appendChild(el(doc, 'figcaption', 'story-figure__caption', image.caption || ''));
  return fig;
}

function renderChapter(doc, chapter, index) {
  const section = el(doc, 'section', 'story-chapter');
  section.dataset.chapterIndex = String(index);
  section.appendChild(el(doc, 'h2', 'story-chapter__title', chapter.title));
  section.appendChild(el(doc, 'p', 'story-chapter__narrative', chapter.narrative));
  for (const image of chapter.images || []) section.appendChild(renderFigure(doc, image));
  if (chapter.callout) {
    const aside = el(doc, 'aside', 'story-callout');
    aside.appendChild(el(doc, 'h3', 'story-callout__label', STRINGS.story.scienceCallout));
    aside.appendChild(el(doc, 'p', 'story-callout__text', chapter.callout.text));
    aside.appendChild(renderCitation(chapter.callout.citation, doc));
    section.appendChild(aside);
  }
  return section;
}

/** Scroll_Trigger line: a chapter activates when its start passes 40% down the viewport. */
const TRIGGER_RATIO = 0.4;

/**
 * Scroll mapping (Requirements 6.5, 6.13). One passive, rAF-throttled scroll handler on the
 * column; chapter ranges are recomputed when the column or any chapter changes size.
 * Returns { refresh, getState, destroy }.
 */
function setupScroll(root, chapters, handlers, win) {
  const sections = Array.from(root.querySelectorAll('.story-chapter'));
  const slot = root.querySelector('[data-story-summary]');
  let ranges = [];
  let activeIndex = -1;
  let ended = false;
  let rafId = 0;
  let destroyed = false;
  let lastState = { chapterIndex: -1, t: 0, overall: 0, keyframe: null };

  const raf = win && win.requestAnimationFrame ? (cb) => win.requestAnimationFrame(cb) : null;
  const caf = win && win.cancelAnimationFrame ? (id) => win.cancelAnimationFrame(id) : null;

  /** Chapter ranges in the column's scroll coordinates (summary slot is excluded). */
  function computeRanges() {
    const rootTop = root.getBoundingClientRect().top;
    const scrollTop = root.scrollTop || 0;
    const tops = sections.map((s) => s.getBoundingClientRect().top - rootTop + scrollTop);
    let lastEnd;
    if (slot) lastEnd = slot.getBoundingClientRect().top - rootTop + scrollTop;
    if (!Number.isFinite(lastEnd) || (tops.length && lastEnd <= tops[tops.length - 1])) {
      const last = sections[sections.length - 1];
      lastEnd = last ? tops[tops.length - 1] + last.getBoundingClientRect().height : 0;
    }
    ranges = tops.map((start, i) => ({ start, end: i + 1 < tops.length ? tops[i + 1] : lastEnd }));
  }

  const keyframeOf = (i) => (chapters[i] && chapters[i].keyframe) || null;

  function update() {
    rafId = 0;
    if (destroyed || ranges.length === 0) return;
    const viewport = root.clientHeight || (win && win.innerHeight) || 0;
    let pos = (root.scrollTop || 0) + viewport * TRIGGER_RATIO;
    // The trigger line sits 40% down the viewport, so with an empty summary slot the column
    // cannot scroll far enough to pass the last chapter. Reaching the bottom counts as the end.
    const atBottom =
      root.scrollHeight > viewport && (root.scrollTop || 0) + viewport >= root.scrollHeight - 2;
    if (atBottom) pos = Math.max(pos, ranges[ranges.length - 1].end);
    const raw = activeChapterIndex(pos, ranges);
    const past = isPastLastChapter(pos, ranges);
    // Before the first chapter use chapter 0; past the last one stay on the final chapter.
    const index = raw >= 0 ? raw : past ? ranges.length - 1 : 0;
    const t = past ? 1 : raw >= 0 ? normalizeProgress(pos, ranges[index].start, ranges[index].end) : 0;
    const overall = overallProgress(pos, ranges);

    const a = keyframeOf(index);
    const b = keyframeOf(Math.min(index + 1, ranges.length - 1));
    const keyframe = a && b ? interpolateKeyframe(a, b, t) : a;
    lastState = { chapterIndex: index, t, overall, keyframe };

    if (index !== activeIndex) {
      activeIndex = index;
      if (handlers.onChapterChange) handlers.onChapterChange(index, keyframeOf(index));
      root.dispatchEvent(new CustomEvent('chapterActivated', { detail: { index } }));
    }
    if (handlers.onProgress) handlers.onProgress(lastState);
    root.dispatchEvent(new CustomEvent('progress', { detail: lastState }));

    if (past && !ended) {
      ended = true;
      if (handlers.onStoryEnd) handlers.onStoryEnd();
    } else if (!past) {
      ended = false;
    }
  }

  function schedule() {
    if (rafId || destroyed) return;
    if (raf) rafId = raf(update);
    else update();
  }

  function refresh() {
    computeRanges();
    schedule();
  }

  root.addEventListener('scroll', schedule, { passive: true });

  let resizeObserver = null;
  const RO = win && win.ResizeObserver;
  if (typeof RO === 'function') {
    resizeObserver = new RO(refresh);
    resizeObserver.observe(root);
    sections.forEach((s) => resizeObserver.observe(s));
  } else if (win) {
    win.addEventListener('resize', refresh);
  }

  computeRanges();
  schedule();

  return {
    refresh,
    getState: () => ({ ...lastState, ranges: ranges.map((r) => ({ ...r })) }),
    destroy() {
      destroyed = true;
      if (rafId && caf) caf(rafId);
      rafId = 0;
      root.removeEventListener('scroll', schedule);
      if (resizeObserver) resizeObserver.disconnect();
      else if (win) win.removeEventListener('resize', refresh);
    }
  };
}

/**
 * mount(parent, { mission, onChapterChange(index, keyframe), onProgress(state), onStoryEnd() })
 *   => { el, refresh, getState, destroy }
 * onProgress state: { chapterIndex, t, overall, keyframe } where keyframe is already
 * interpolated between the active chapter and the next one.
 */
export function mount(parent, props) {
  const doc = parent.ownerDocument || document;
  const root = el(doc, 'div', 'story-column');
  root.setAttribute('data-story-column', '');
  // A scrolling region must be reachable by keyboard so the story can be scrolled without a mouse.
  root.setAttribute('role', 'region');
  root.setAttribute('tabindex', '0');
  const missionName = props && props.mission && props.mission.name;
  if (missionName) root.setAttribute('aria-label', STRINGS.storyRegionLabel(missionName));
  const chapters = (props && props.mission && props.mission.chapters) || [];
  chapters.forEach((c, i) => root.appendChild(renderChapter(doc, c, i)));
  // Container for the end-of-story summary (task 22).
  const summary = el(doc, 'div', 'story-summary-slot');
  summary.setAttribute('data-story-summary', '');
  root.appendChild(summary);
  parent.appendChild(root);
  const stopReveal = setupReveal(root, doc.defaultView);
  const scroll = setupScroll(root, chapters, props || {}, doc.defaultView);
  return {
    el: root,
    refresh: scroll.refresh,
    getState: scroll.getState,
    destroy() {
      scroll.destroy();
      stopReveal();
      root.remove();
    }
  };
}
