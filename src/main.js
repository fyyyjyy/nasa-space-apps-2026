// Bootstrap entry point.
import './styles/tokens.css';
import './styles/base.css';
import './styles/opening.css';

import site from './data/site.json';
import rawMissions from './data/missions.json';
import quizzes from './data/quizzes.json';
import audio from './data/audio.json';
import { createStore } from './core/stateMachine.js';
import { findQuiz } from './core/quizLookup.js';
import { loadContent } from './core/contentLoader.js';
import { isWebGLAvailable } from './engine/webglSupport.js';
import { mount as mountWebGLFallback } from './ui/webglFallback.js';

// Validate on load. Development throws with the full error list. Production logs,
// drops invalid chapters and flags missions whose content cannot be shown.
const content = loadContent(
  { missions: rawMissions, quizzes, audio },
  { isDev: import.meta.env?.DEV === true },
);
const missions = content.missions;

async function bootstrap() {
  const store = createStore();
  const data = { site, missions, unavailableMissions: content.unavailable };
  window.__app = { store, data };

  if (!isWebGLAvailable()) {
    store.dispatch('WEBGL_UNAVAILABLE');
    // Static message only: no scene code is loaded or run.
    document.getElementById('scene')?.remove();
    document.getElementById('main')?.replaceChildren();
    mountWebGLFallback(document.getElementById('main') || document.body);
    return;
  }

  // Loaded lazily so the Three.js bundle is never fetched without WebGL.
  const sceneManager = await import('./engine/sceneManager.js');
  const canvas = document.getElementById('scene');
  try {
    sceneManager.init(canvas);
  } catch (err) {
    console.error('Scene initialisation failed', err);
    store.dispatch('WEBGL_UNAVAILABLE');
    canvas?.remove();
    mountWebGLFallback(document.getElementById('main') || document.body);
    return;
  }

  const { createStarfield } = await import('./engine/starfield.js');
  const starfield = createStarfield();
  sceneManager.addToScene(starfield.points);
  window.__app.starfield = starfield;

  const { createCelestialBodies } = await import('./engine/celestialBodies.js');
  const bodies = createCelestialBodies(site, sceneManager);
  sceneManager.addToScene(...bodies.group);
  window.__app.bodies = bodies;

  await wireOpeningScene({ store, sceneManager, canvas });

  store.dispatch('ASSETS_READY');
  sceneManager.start();
}

/**
 * Camera rig, markers, opening overlay and the screen-driven side effects for
 * OPENING, ORBIT and FLY_IN (Requirements 2, 3, 4.1).
 */
async function wireOpeningScene({ store, sceneManager, canvas }) {
  const THREE = await import('three');
  const { createCameraRig, BODY_DURATION, SITE_DURATION } = await import('./engine/cameraRig.js');
  const markerManager = await import('./engine/markerManager.js');
  const { getMesh, getRadius } = await import('./engine/celestialBodies.js');
  const { latLonToVector3 } = await import('./core/geo.js');
  const { mount: mountOpeningOverlay } = await import('./ui/openingOverlay.js');
  const { STRINGS } = await import('./ui/strings.js');
  const { showToast, mount: mountToastRegion } = await import('./ui/toast.js');
  const { createContextNotice } = await import('./ui/contextNotice.js');
  const { createHardwareModelManager } = await import('./engine/hardwareModelManager.js');
  const { createModelInspector } = await import('./engine/modelInspector.js');
  const { selectLayout } = await import('./core/layoutSelector.js');
  const { shouldResize, rafDebounce } = await import('./core/resizePolicy.js');
  const { openingPose } = await import('./core/openingPose.js');
  const { audioEngine } = await import('./audio/audioEngine.js');
  const { mount: mountAudioController } = await import('./audio/audioController.js');
  const { playHover } = await import('./audio/uiSounds.js');
  const { installPressFeedback } = await import('./ui/pressFeedback.js');
  installPressFeedback(document, { onPress: playHover });
  const { buildTrackConfig, isNavigatedTransition, audioChapterIndex, missionTrackId } = await import(
    './audio/audioWiring.js'
  );
  const { mount: mountStoryColumn, renderCitation } = await import('./ui/storyColumn.js');
  const { mount: mountSummary } = await import('./ui/summaryView.js');
  const { mountScrollProgress, mountJourneyIndicator } = await import('./ui/progressIndicators.js');
  const { showJourneyIntro, showMissionCard } = await import('./ui/transitionCards.js');
  const { mount: mountClosing } = await import('./ui/closingScreen.js');
  const { journeyUiVisible, journeyMissionAt, orderedJourneyMissions } = await import(
    './core/journeyScene.js'
  );
  const { mount: mountPersistentControls } = await import('./ui/persistentControls.js');
  const { siteBasis, storyUnit, cameraPoseForKeyframe, keyframeDurationMs, once } = await import(
    './core/storyPose.js'
  );

  const camera = sceneManager.getCamera();
  const rig = createCameraRig(camera, { minDistance: 2.6, maxDistance: 12 });
  sceneManager.addUpdateCallback((nowMs) => rig.update(nowMs));
  window.__app.cameraRig = rig;

  const reducedMotion = () =>
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bodyMs = () => (reducedMotion() ? BODY_DURATION.min : BODY_DURATION.def);
  const siteMs = () => (reducedMotion() ? SITE_DURATION.min : SITE_DURATION.def);

  // Hardware model (Requirements 4.2, 4.6, 5). The inspector is attached to the canvas only
  // while a model is shown, and the orbit pointer handlers below stand down at the same time.
  const modelManager = createHardwareModelManager({
    scene: sceneManager.getScene(),
    camera,
    getMission: (id) => missions.find((m) => m.id === id),
  });
  sceneManager.addUpdateCallback((nowMs) => modelManager.update(nowMs));
  window.__app.modelManager = modelManager;
  let inspector = null;
  let modelToken = 0;
  const modelShown = () => inspector !== null;

  function unloadModel() {
    modelToken += 1;
    inspector?.destroy();
    inspector = null;
    modelManager.unload();
  }

  // Accessibility (Requirement 8): the toast live region exists before the first toast so the
  // message is announced, and a visually hidden polite region announces chapter changes.
  const uiMain = document.getElementById('main') || document.body;
  mountToastRegion(uiMain);
  const announcer = document.createElement('div');
  announcer.className = 'visually-hidden';
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  uiMain.appendChild(announcer);
  const announce = (text) => {
    announcer.textContent = text;
  };

  // WebGL context lost at runtime: the loop pauses in sceneManager; tell the reader and resume
  // on restore. The story column and controls stay usable.
  const contextNotice = createContextNotice();
  sceneManager.onContextChange(contextNotice.onChange);

  // Audio (Requirements 11, 12). Nothing sounds until the first user gesture unlocks the context.
  audioEngine.init(audio);
  const gestureEvents = ['pointerdown', 'keydown', 'touchstart'];
  const unlockAudio = () => {
    gestureEvents.forEach((t) => window.removeEventListener(t, unlockAudio, true));
    audioEngine.unlockOnGesture().catch((err) => console.warn('[audio] unlock failed', err));
  };
  gestureEvents.forEach((t) => window.addEventListener(t, unlockAudio, { capture: true, passive: true }));
  const audioController = mountAudioController(uiMain, {
    engine: audioEngine,
    config: buildTrackConfig(audio, missions),
  });
  window.__app.audioController = audioController;
  let activeChapter = 0;
  function syncAudio(state, navigated = false) {
    const mission = missions.find((m) => m.id === state.missionId);
    const chapterIndex = audioChapterIndex(state.screen, activeChapter, mission?.chapters?.length);
    audioController.syncToState(state, { chapterIndex, navigated });
  }

  // Markers (hidden until ORBIT).
  markerManager.createMarkers(missions, {
    camera,
    canvas,
    onSelect: (missionId) => {
      if (content.unavailable.includes(missionId)) {
        showToast(STRINGS.story.missionContentUnavailable);
        return;
      }
      store.dispatch({ type: 'SELECT_MISSION', missionId });
    },
  });
  sceneManager.addUpdateCallback((nowMs) => markerManager.update(nowMs));

  // Opening overlay.
  const uiRoot = document.getElementById('main') || document.body;
  const overlay = mountOpeningOverlay(uiRoot, {
    onSelectBody: (body) => store.dispatch({ type: 'SELECT_BODY', body }),
    onStartJourney: () => store.dispatch('START_JOURNEY'),
    onHoverSound: playHover,
  });

  // Orbit HUD: body label (Requirement 2.6) and a borderless way back to the opening view.
  const hud = document.createElement('div');
  hud.className = 'orbit-hud';
  hud.style.display = 'none';
  const hudLabel = document.createElement('p');
  hudLabel.className = 'orbit-hud__label';
  hudLabel.setAttribute('aria-live', 'polite');
  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'btn-text';
  backBtn.textContent = STRINGS.backToOpening;
  backBtn.addEventListener('click', () => store.dispatch('ORBIT_BACK'));
  backBtn.addEventListener('pointerenter', playHover);
  backBtn.addEventListener('focus', playHover);
  hud.append(hudLabel, backBtn);
  uiRoot.appendChild(hud);

  // Keep the surface of the focused body un-clipped when the camera is very close.
  let focusBodyId = null;
  sceneManager.addUpdateCallback(() => {
    let near = 0.1;
    const mesh = focusBodyId ? getMesh(focusBodyId) : null;
    if (mesh) {
      const centre = mesh.getWorldPosition(new THREE.Vector3());
      const altitude = camera.position.distanceTo(centre) - getRadius(focusBodyId);
      near = Math.min(0.1, Math.max(1e-5, altitude * 0.1));
    }
    if (camera.near !== near) {
      camera.near = near;
      camera.updateProjectionMatrix();
    }
  });

  // The bodies spin slowly; hold the active body still while a site pose is in use.
  let lock = null; // { mesh, rotationY }
  sceneManager.addUpdateCallback(() => {
    if (lock) lock.mesh.rotation.y = lock.rotationY;
  });

  // Pointer input on the canvas: drag to orbit, wheel and pinch to zoom.
  // The rig ignores all of it while a fly is running or input is disabled.
  const ORBIT_RAD_PER_PX = 0.005;
  const DRAG_CLICK_SLOP_PX = 4;
  const pointers = new Map();
  let pinchDist = null;
  let dragged = 0;
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', (e) => {
    if (modelShown()) return; // the model inspector owns the canvas
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged = 0;
    pinchDist = null;
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, cur);
    if (pointers.size === 1) {
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      dragged += Math.abs(dx) + Math.abs(dy);
      rig.orbitBy(dx * ORBIT_RAD_PER_PX, dy * ORBIT_RAD_PER_PX);
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      dragged += DRAG_CLICK_SLOP_PX + 1;
      if (pinchDist && d > 0) rig.zoomBy(pinchDist / d - 1);
      pinchDist = d;
    }
  });
  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    pinchDist = null;
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  // A drag must not count as a marker click.
  canvas.addEventListener(
    'click',
    (e) => {
      if (dragged > DRAG_CLICK_SLOP_PX) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
      dragged = 0;
    },
    true,
  );
  canvas.addEventListener(
    'wheel',
    (e) => {
      if (modelShown()) return;
      e.preventDefault();
      rig.zoomBy(Math.max(-0.5, Math.min(0.5, e.deltaY * 0.001)));
    },
    { passive: false },
  );

  // Pose helpers.
  // Evaluated on use so portrait viewports get a pose that frames both bodies.
  const openingPoseNow = () => {
    const p = openingPose(camera.aspect, camera.fov);
    return { target: new THREE.Vector3(...p.target), position: new THREE.Vector3(...p.position) };
  };

  function orbitPose(bodyId) {
    const mesh = getMesh(bodyId);
    const radius = getRadius(bodyId);
    const centre = mesh.getWorldPosition(new THREE.Vector3());
    const vHalf = (camera.fov * Math.PI) / 360;
    const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
    const dist = (radius / Math.sin(Math.min(vHalf, hHalf))) * 1.3; // whole body in frame
    const dir = new THREE.Vector3(0, 0.2, 1).normalize();
    return { target: centre, position: centre.clone().addScaledVector(dir, dist) };
  }

  // Site pose: about 400 m above the surface (model scale), a little south of the site, looking at it.
  const SITE_ALTITUDE_KM = 0.4;
  function siteAnchor(mission) {
    const mesh = getMesh(mission.body);
    const radius = getRadius(mission.body);
    mesh.updateMatrixWorld(true);
    const local = latLonToVector3(mission.landing.lat, mission.landing.lon, radius);
    const sitePoint = mesh.localToWorld(new THREE.Vector3(local.x, local.y, local.z));
    const centre = mesh.getWorldPosition(new THREE.Vector3());
    const normal = sitePoint.clone().sub(centre).normalize();
    return { mesh, radius, sitePoint, normal };
  }

  function sitePose(mission) {
    const { radius, sitePoint, normal } = siteAnchor(mission);
    const alt = SITE_ALTITUDE_KM * (radius / site.bodies[mission.body].radiusKm);
    const north = new THREE.Vector3(0, 1, 0);
    north.addScaledVector(normal, -north.dot(normal));
    if (north.lengthSq() < 1e-8) north.set(1, 0, 0).addScaledVector(normal, -normal.x);
    north.normalize();
    const position = sitePoint.clone().addScaledVector(normal, alt).addScaledVector(north, -3 * alt);
    return { target: sitePoint, position };
  }

  // Screen reactions.
  let flyToken = 0;
  const setCanvasLabel = (text) => canvas.setAttribute('aria-label', text);

  // The page keeps exactly one visible-to-AT h1. While the opening overlay is hidden the h1 moves
  // out of it and is visually hidden; the closing screen has its own h1, so this one is removed.
  const pageTitle = document.getElementById('site-title');
  const overlayHeader = overlay.el.querySelector('.opening-overlay__header');
  function setPageTitle(mode) {
    if (!pageTitle) return;
    pageTitle.hidden = mode === 'none';
    if (mode === 'overlay') {
      pageTitle.classList.remove('visually-hidden');
      if (overlayHeader && pageTitle.parentNode !== overlayHeader) overlayHeader.prepend(pageTitle);
    } else {
      pageTitle.classList.add('visually-hidden');
      if (pageTitle.parentNode !== uiRoot) uiRoot.prepend(pageTitle);
    }
  }

  function hideOverlayAndMarkers() {
    setPageTitle('hidden');
    overlay.el.style.display = 'none';
    hud.style.display = 'none';
    markerManager.setVisibleBody(null);
  }

  async function runFly(pose, opts, onDone) {
    const token = ++flyToken;
    rig.setInputEnabled(false);
    await rig.flyTo(pose, opts);
    if (token !== flyToken) return; // cancelled or retargeted
    onDone();
  }

  function enterOpening(prevScreen) {
    focusBodyId = null;
    lock = null;
    hud.style.display = 'none';
    markerManager.setVisibleBody(null);
    setPageTitle('overlay');
    overlay.el.style.display = '';
    setCanvasLabel(STRINGS.canvasLabel.opening);
    const done = () => {
      rig.setLimits(2.6, 12);
      rig.setInputEnabled(true);
    };
    // After FLY_OUT the camera is already at the opening pose.
    if (prevScreen === 'LOADING' || prevScreen === 'FLY_OUT' || prevScreen === 'CLOSING') {
      done();
      return;
    }
    runFly(openingPoseNow(), { durationMs: bodyMs(), kind: 'body' }, done);
  }

  function enterOrbit(bodyId, prevScreen) {
    focusBodyId = bodyId;
    lock = null;
    setPageTitle('hidden');
    overlay.el.style.display = 'none';
    hudLabel.textContent = site.bodies[bodyId].label;
    hud.style.display = '';
    markerManager.setVisibleBody(bodyId);
    setCanvasLabel(STRINGS.canvasLabel.orbit(site.bodies[bodyId].label));
    if (prevScreen === 'FLY_OUT') {
      // FLY_OUT already flew to the orbit pose.
      rig.setLimits(getRadius(bodyId), 12);
      rig.setInputEnabled(true);
      return;
    }
    runFly(orbitPose(bodyId), { durationMs: bodyMs(), kind: 'body' }, () => {
      rig.setLimits(getRadius(bodyId), 12);
      rig.setInputEnabled(true);
    });
  }

  function enterFlyIn(missionId) {
    const mission = missions.find((m) => m.id === missionId);
    if (!mission) return;
    hideOverlayAndMarkers();
    focusBodyId = mission.body;
    const mesh = getMesh(mission.body);
    if (!lock || lock.mesh !== mesh) lock = { mesh, rotationY: mesh.rotation.y };
    setCanvasLabel(STRINGS.canvasLabel.mission(mission.name));
    // Calling runFly again while flying cancels the current fly and restarts from the
    // interpolated pose (Requirement 4.5).
    // Start loading right away; a missing model, load error or timeout resolves to a
    // placeholder plus a toast, so the fly-in always completes (Requirements 4.6, 5.6).
    unloadModel();
    const token = modelToken;
    const loading = modelManager.load(missionId).catch(() => null);
    runFly(sitePose(mission), { durationMs: siteMs(), kind: 'site' }, async () => {
      await loading;
      if (token !== modelToken) return; // left the site or retargeted while loading
      const s = store.getState();
      if (s.screen !== 'FLY_IN' || s.missionId !== missionId) return;
      try {
        const { sitePoint, normal } = siteAnchor(mission);
        modelManager.show(
          missionId,
          { position: sitePoint, normal },
          { layout: selectLayout(window.innerWidth) === 'stacked' ? 'narrow' : 'wide' },
        );
        const shown = modelManager.getRoot();
        if (shown && shown.children[0]?.userData?.placeholder) {
          setCanvasLabel(STRINGS.canvasLabelModelUnavailable(mission.name));
        }
        if (modelManager.getRoot()) {
          inspector = createModelInspector({ element: canvas, manager: modelManager });
        }
      } catch (err) {
        console.error('Showing the hardware model failed', err);
      }
      store.dispatch('FLY_COMPLETE');
    });
  }

  // Story (Requirements 6.1, 6.5, 6.13, 6.19). The column, scroll progress indicator and
  // persistent control live from STORY until the story UI is left. The column is kept
  // through SUMMARY because it owns the summary slot.
  // The quiz dialog opens over the column, so the story UI also stays through QUIZ.
  const STORY_UI_SCREENS = new Set(['STORY', 'SUMMARY', 'QUIZ']);
  let story = null; // { id, missionId, column, summary, progress, controls, frame, desired }
  let quizDialog = null;
  let quizToken = 0;
  let storyCounter = 0;

  // Ease the camera toward the desired story pose (instant with reduced motion).
  const STORY_CAMERA_TAU_MS = 150;
  let lastStoryFrameMs = 0;
  sceneManager.addUpdateCallback((nowMs) => {
    const dt = lastStoryFrameMs ? Math.min(100, nowMs - lastStoryFrameMs) : 16;
    lastStoryFrameMs = nowMs;
    if (!story || !story.desired) return;
    const k = reducedMotion() ? 1 : 1 - Math.exp(-dt / STORY_CAMERA_TAU_MS);
    // Roll the camera so the site's surface normal is "up"; world +Y is a horizontal
    // direction at equatorial sites and would put the camera top-down on the ground.
    if (story.up) camera.up.lerp(story.up, k).normalize();
    const cur = rig.getPose();
    const curPos = cur.target.clone().add(cur.offset);
    rig.setPose({
      target: cur.target.lerp(story.desired.target, k),
      position: curPos.lerp(story.desired.position, k),
    });
  });

  function applyStoryKeyframe(keyframe) {
    if (!story || !keyframe) return;
    const pose = cameraPoseForKeyframe(story.frame, keyframe);
    if (pose) {
      story.desired = {
        position: new THREE.Vector3(...pose.position),
        target: new THREE.Vector3(...pose.target),
      };
    }
    if (modelManager.getRoot()) {
      modelManager.applyKeyframe(keyframe, keyframeDurationMs(reducedMotion()), performance.now());
    }
  }

  function enterStory(state) {
    const mission = missions.find((m) => m.id === state.missionId);
    if (!mission) return;
    leaveStory();
    const id = ++storyCounter;
    const { sitePoint, normal } = siteAnchor(mission);
    const pose = sitePose(mission);
    story = {
      id,
      missionId: mission.id,
      column: null,
      progress: null,
      controls: null,
      desired: null,
      up: normal.clone(),
      frame: {
        anchor: sitePoint.toArray(),
        basis: siteBasis(normal.toArray()),
        unit: storyUnit(pose.position.distanceTo(pose.target)),
      },
    };
    activeChapter = 0;
    const live = () => story !== null && story.id === id;
    // STORY_END is dispatched once per story.
    const endStory = once(() => {
      if (live() && store.getState().screen === 'STORY') store.dispatch('STORY_END');
    });

    sceneManager.setSplitLayout(true);
    story.progress = mountScrollProgress(uiRoot);
    story.controls = mountPersistentControls(uiRoot, {
      // Journey mode: "Exit Journey" is owned by the journey UI (see syncJourneyUi).
      mode: state.mode === 'JOURNEY' ? 'hidden' : 'explore',
      onReturnToSpace: () => store.dispatch({ type: 'RETURN_TO_SPACE', target: 'opening' }),
      onHover: playHover,
    });
    story.column = mountStoryColumn(uiRoot, {
      mission,
      onChapterChange: (index, keyframe) => {
        if (!live()) return;
        // Manual model rotation and zoom decay when the next chapter activates.
        if (modelManager.getRoot()) modelManager.setInspectionOffset({ yaw: 0, pitch: 0, zoom: 1 });
        applyStoryKeyframe(keyframe);
        activeChapter = index;
        const chapter = mission.chapters[index];
        if (chapter) announce(STRINGS.chapterAnnouncement(index + 1, mission.chapters.length, chapter.title));
        syncAudio(store.getState());
      },
      onProgress: ({ chapterIndex, overall, keyframe }) => {
        if (!live()) return;
        story.progress.update({
          activeIndex: chapterIndex,
          chapterCount: mission.chapters.length,
          progress: overall,
        });
        applyStoryKeyframe(keyframe);
      },
      onStoryEnd: endStory,
    });
  }

  // Summary (Requirements 6.13, 6.14, 7.1): rendered into the column's summary slot.
  function showSummary(state) {
    if (!story || story.summary) return;
    const mission = missions.find((m) => m.id === story.missionId);
    const slot = story.column?.el.querySelector('[data-story-summary]');
    if (!mission || !slot) return;
    const summary = mountSummary(slot, {
      mission,
      mode: state.mode === 'JOURNEY' ? 'JOURNEY' : 'EXPLORE',
      journeyIndex: state.journeyIndex,
      quizEnabled: findQuiz(quizzes, mission.id) !== null,
      onOpenQuiz: () => store.dispatch('OPEN_QUIZ'),
      // Flies to the orbit of the current body; the model is unloaded on leaving the site states.
      onReturnToSpace: () => store.dispatch({ type: 'RETURN_TO_SPACE', target: 'orbit' }),
      onContinue: () => store.dispatch('CONTINUE'),
      onFinish: () => store.dispatch('FINISH_JOURNEY'),
      onHoverSound: playHover,
    });
    if (Array.isArray(mission.citations) && mission.citations.length > 0) {
      const list = document.createElement('div');
      list.className = 'summary-view__citations';
      mission.citations.forEach((c) => list.appendChild(renderCitation(c, document)));
      summary.el.insertBefore(list, summary.el.querySelector('.summary-view__actions'));
    }
    story.summary = summary;
  }

  function closeQuizDialog() {
    quizToken += 1;
    quizDialog?.destroy();
    quizDialog = null;
  }

  // Quiz dialog (Requirement 7): code-split, modal, so the story UI under it is inert.
  async function openQuiz(state) {
    closeQuizDialog();
    const token = quizToken;
    const quiz = findQuiz(quizzes, state.missionId);
    if (!quiz) {
      store.dispatch('CLOSE_QUIZ');
      return;
    }
    const trigger = story?.summary?.el.querySelector('[data-action="quiz"]') || null;
    try {
      const { mount: mountQuiz } = await import('./ui/quizDialog.js');
      if (token !== quizToken) return; // left QUIZ while loading
      quizDialog = mountQuiz(uiRoot, {
        quiz,
        returnFocusTo: trigger,
        onClose: () => store.dispatch('CLOSE_QUIZ'),
      });
    } catch (err) {
      console.error('Opening the quiz failed', err);
      if (token === quizToken) store.dispatch('CLOSE_QUIZ');
    }
  }

  function leaveStory() {
    if (!story) return;
    closeQuizDialog();
    const s = story;
    story = null;
    camera.up.set(0, 1, 0);
    s.summary?.destroy();
    s.column?.destroy();
    s.progress?.destroy();
    s.controls?.destroy();
    sceneManager.setSplitLayout(false);
  }

  // Return to space: fly back to the body orbit pose or the opening pose, then FLY_COMPLETE.
  // Journey FLY_OUT after the last mission has returnTarget null, so it flies to the opening
  // pose and FLY_COMPLETE moves the machine to CLOSING. EXIT_JOURNEY lands in Explore mode
  // with returnTarget 'orbit'.
  // Resize, rotation and crossing the 768px breakpoint. sceneManager has already updated
  // the camera aspect and view offset (its listener is registered first).
  function applyLayoutChange() {
    const layout = selectLayout(window.innerWidth);
    const screen = store.getState().screen;
    // Re-frame the opening view for the new aspect ratio.
    if ((screen === 'OPENING' || screen === 'LOADING') && !rig.isFlying()) {
      rig.setPose(openingPoseNow());
    }
    // The camera pose is kept; only the model fit and the chapter ranges change.
    if (modelManager.getRoot()) {
      modelManager.fitToView(modelManager.getRoot(), camera, {
        layout: layout === 'stacked' ? 'narrow' : 'wide',
      });
    }
    story?.column?.refresh();
    // Marker sizes are recomputed every frame from window.innerWidth/innerHeight.
    markerManager.update?.(performance.now());
  }
  // One run per frame; ignore small height-only changes (mobile URL bar show/hide).
  let lastLayoutSize = null;
  const layoutSize = () => ({
    width: window.innerWidth,
    height: window.innerHeight,
    layout: selectLayout(window.innerWidth),
  });
  const onLayoutChange = rafDebounce(() => {
    const size = layoutSize();
    if (!shouldResize(lastLayoutSize, size)) return;
    lastLayoutSize = size;
    applyLayoutChange();
  });
  lastLayoutSize = layoutSize();
  window.addEventListener('resize', onLayoutChange);
  window.addEventListener('orientationchange', onLayoutChange);
  rig.setPose(openingPoseNow());

  function enterFlyOut(state) {
    hideOverlayAndMarkers();
    const pose = state.returnTarget === 'orbit' && state.body ? orbitPose(state.body) : openingPoseNow();
    runFly(pose, { durationMs: bodyMs(), kind: 'body' }, () => store.dispatch('FLY_COMPLETE'));
  }

  // Full Journey (Requirement 10). The indicator and "Exit Journey" control live across all
  // journey screens except FLY_OUT and CLOSING. The "Return to Space" button is never shown.
  let journeyUi = null; // { indicator, controls }
  let card = null;

  function syncJourneyUi(state) {
    if (!journeyUiVisible(state)) {
      journeyUi?.indicator.destroy();
      journeyUi?.controls.destroy();
      journeyUi = null;
      return;
    }
    if (!journeyUi) {
      journeyUi = {
        indicator: mountJourneyIndicator(uiRoot),
        controls: mountPersistentControls(uiRoot, {
          mode: 'journey',
          onExitJourney: () => store.dispatch('EXIT_JOURNEY'),
          onHover: playHover,
        }),
      };
    }
    const mission = journeyMissionAt(state.journeyIndex, missions);
    if (mission) journeyUi.indicator.update({ index: state.journeyIndex, name: mission.name });
  }

  function clearCard() {
    if (!card) return;
    const c = card;
    card = null;
    c.el.remove();
  }

  // Cards never take focus. onDone only dispatches if the machine is still on the same screen.
  function showCard(screen, build, event) {
    clearCard();
    const mine = build(() => {
      if (card === mine) card = null;
      if (store.getState().screen === screen) store.dispatch(event);
    });
    card = mine;
  }

  function enterJourneyIntro() {
    flyToken += 1;
    hideOverlayAndMarkers();
    focusBodyId = null;
    lock = null;
    setCanvasLabel(STRINGS.canvasLabel.opening);
    rig.setInputEnabled(false);
    showCard('JOURNEY_INTRO', (onDone) => showJourneyIntro(uiRoot, { onDone }), 'JOURNEY_INTRO_DONE');
  }

  // CONTINUE goes straight from SUMMARY to JOURNEY_TRANSITION. The one fly here covers the
  // fly out from the site and the flight forward to the orbit of the next mission's body,
  // with no user input. The next FLY_IN then descends to the site.
  function enterJourneyTransition(state) {
    hideOverlayAndMarkers();
    lock = null;
    focusBodyId = state.body;
    // Warm the next mission's track while the camera flies.
    const next = journeyMissionAt(state.journeyIndex, missions);
    const nextTrack = next && missionTrackId(audio, next.id);
    if (nextTrack) audioEngine.preload(nextTrack).catch(() => {});
    rig.setLimits(getRadius(state.body), 12);
    runFly(orbitPose(state.body), { durationMs: bodyMs(), kind: 'body' }, () =>
      store.dispatch('TRANSITION_COMPLETE'),
    );
  }

  function enterJourneyCard(state) {
    flyToken += 1;
    hideOverlayAndMarkers();
    const mission = journeyMissionAt(state.journeyIndex, missions);
    if (!mission) {
      store.dispatch('CARD_DONE');
      return;
    }
    showCard('JOURNEY_CARD', (onDone) => showMissionCard(uiRoot, mission, { onDone }), 'CARD_DONE');
  }

  let closing = null;
  function enterClosing() {
    flyToken += 1;
    hideOverlayAndMarkers();
    focusBodyId = null;
    lock = null;
    rig.setInputEnabled(false);
    closing?.destroy();
    setPageTitle('none');
    closing = mountClosing(uiRoot, {
      missions: orderedJourneyMissions(missions),
      onExploreOnYourOwn: () => store.dispatch('EXPLORE_ON_OWN'),
      onHoverSound: playHover,
    });
    // The rest of the page is inert while the closing screen is shown (mute stays reachable).
    for (const child of uiRoot.children) {
      if (child !== closing.el && child !== announcer && !child.matches('#scene, .audio-controller, .toast-region')) child.inert = true;
    }
    closing.focusHeading?.();
  }

  function leaveClosing() {
    closing?.destroy();
    closing = null;
    for (const child of uiRoot.children) child.inert = false;
    pageTitle && (pageTitle.hidden = false);
  }

  // The model stays through the site states and is released everywhere else.
  const MODEL_SCREENS = new Set(['FLY_IN', 'STORY', 'SUMMARY', 'QUIZ']);

  store.subscribe((state, prev) => {
    const entered = state.screen !== prev.screen;
    if (entered && !MODEL_SCREENS.has(state.screen)) unloadModel();
    if (entered && story && !STORY_UI_SCREENS.has(state.screen)) leaveStory();
    if (entered && card && state.screen !== 'JOURNEY_INTRO' && state.screen !== 'JOURNEY_CARD') {
      clearCard();
    }
    if (entered && closing && state.screen !== 'CLOSING') leaveClosing();
    syncJourneyUi(state);
    if (entered && !STORY_UI_SCREENS.has(state.screen)) activeChapter = 0;
    switch (state.screen) {
      case 'OPENING':
        if (entered) enterOpening(prev.screen);
        break;
      case 'ORBIT':
        if (entered) enterOrbit(state.body, prev.screen);
        break;
      case 'FLY_IN':
        if (entered || state.missionId !== prev.missionId) enterFlyIn(state.missionId);
        break;
      case 'STORY':
        if (entered || state.missionId !== prev.missionId) enterStory(state);
        break;
      case 'SUMMARY':
        // The story UI stays mounted (see STORY_UI_SCREENS).
        if (entered && prev.screen === 'QUIZ') closeQuizDialog();
        showSummary(state);
        break;
      case 'QUIZ':
        if (entered) openQuiz(state);
        break;
      case 'FLY_OUT':
        if (entered) enterFlyOut(state);
        break;
      case 'JOURNEY_INTRO':
        if (entered) enterJourneyIntro();
        break;
      case 'JOURNEY_TRANSITION':
        if (entered) enterJourneyTransition(state);
        break;
      case 'JOURNEY_CARD':
        if (entered) enterJourneyCard(state);
        break;
      case 'CLOSING':
        if (entered) enterClosing();
        break;
      default:
        if (entered) {
          flyToken += 1;
          hideOverlayAndMarkers();
        }
    }
    syncAudio(state, isNavigatedTransition(prev, state));
  });
}

bootstrap();
