import { describe, it, expect } from 'vitest';
import {
  buildTrackConfig,
  isNavigatedTransition,
  audioChapterIndex,
  missionTrackId,
} from '../src/audio/audioWiring.js';
import { resolveTrack } from '../src/audio/audioEngine.js';
import audio from '../src/data/audio.json';
import missions from '../src/data/missions.json';

describe('buildTrackConfig', () => {
  const config = buildTrackConfig(audio, missions);
  it('uses real chapter counts and picks the Opportunity variation on the last chapter', () => {
    const opp = missions.find((m) => m.id === 'opportunity');
    const last = opp.chapters.length - 1;
    const state = { screen: 'STORY', missionId: 'opportunity' };
    expect(resolveTrack(state, last, config)).toBe('opportunity-quiet');
    expect(resolveTrack(state, 0, config)).toBe('opportunity');
  });
  it('maps other missions to their base track on every chapter', () => {
    const m = missions.find((x) => x.id === 'apollo11');
    const state = { screen: 'STORY', missionId: 'apollo11' };
    expect(resolveTrack(state, m.chapters.length - 1, config)).toBe('apollo11');
  });
});

describe('isNavigatedTransition', () => {
  it.each([
    ['SUMMARY', 'JOURNEY_TRANSITION', true],
    ['SUMMARY', 'FLY_OUT', true],
    ['STORY', 'FLY_OUT', true],
    ['JOURNEY_CARD', 'FLY_OUT', true],
    ['QUIZ', 'SUMMARY', false],
    ['SUMMARY', 'QUIZ', false],
    ['ORBIT', 'FLY_IN', false],
    ['FLY_OUT', 'FLY_OUT', false],
  ])('%s -> %s = %s', (a, b, expected) => {
    expect(isNavigatedTransition({ screen: a }, { screen: b })).toBe(expected);
  });
});

describe('audioChapterIndex / missionTrackId', () => {
  it('uses the last chapter on SUMMARY', () => {
    expect(audioChapterIndex('SUMMARY', 1, 5)).toBe(4);
    expect(audioChapterIndex('STORY', 2, 5)).toBe(2);
    expect(audioChapterIndex('STORY', undefined, 5)).toBe(0);
  });
  it('reads a mission track id', () => {
    expect(missionTrackId(audio, 'insight')).toBe('insight');
    expect(missionTrackId(audio, 'nope')).toBeNull();
  });
});
