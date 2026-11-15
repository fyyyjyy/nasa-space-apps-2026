import { describe, it, expect } from 'vitest';
import {
  journeyUiVisible,
  journeyPoseKind,
  orderedJourneyMissions,
  journeyMissionAt,
} from '../src/core/journeyScene.js';
import { JOURNEY_ORDER } from '../src/core/journeyPlan.js';

const J = (screen) => ({ mode: 'JOURNEY', screen });

describe('journeyScene helpers', () => {
  it('shows journey UI on journey screens only', () => {
    for (const s of ['JOURNEY_INTRO', 'FLY_IN', 'STORY', 'SUMMARY', 'QUIZ', 'JOURNEY_TRANSITION', 'JOURNEY_CARD']) {
      expect(journeyUiVisible(J(s))).toBe(true);
    }
    expect(journeyUiVisible(J('FLY_OUT'))).toBe(false);
    expect(journeyUiVisible(J('CLOSING'))).toBe(false);
    expect(journeyUiVisible({ mode: 'EXPLORE', screen: 'STORY' })).toBe(false);
  });

  it('picks a pose kind per journey screen', () => {
    expect(journeyPoseKind(J('JOURNEY_INTRO'))).toBe('opening');
    expect(journeyPoseKind(J('JOURNEY_TRANSITION'))).toBe('orbit');
    expect(journeyPoseKind(J('JOURNEY_CARD'))).toBe('hold');
    expect(journeyPoseKind(J('FLY_IN'))).toBe('site');
    expect(journeyPoseKind(J('STORY'))).toBeNull();
    expect(journeyPoseKind({ mode: 'EXPLORE', screen: 'FLY_IN' })).toBeNull();
  });

  it('orders missions by journey order', () => {
    const missions = [...JOURNEY_ORDER].reverse().map((id) => ({ id }));
    expect(orderedJourneyMissions(missions).map((m) => m.id)).toEqual([...JOURNEY_ORDER]);
    expect(journeyMissionAt(1, missions).id).toBe('apollo11');
    expect(journeyMissionAt(6, missions)).toBeNull();
  });
});
