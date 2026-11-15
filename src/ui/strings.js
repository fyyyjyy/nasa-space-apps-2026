// All visible labels that are not in site.json or missions.json.
// Dynamic labels are functions so layout code never builds text itself.

export const STRINGS = {
  loading: 'Loading…',
  returnToSpace: 'Return to Space',
  exitJourney: 'Exit Journey',
  testWhatYouLearned: 'Test what you learned',
  continueToNextMission: 'Continue to Next Mission',
  finishTheJourney: 'Finish the Journey',
  backToOpening: 'Back to Moon and Mars',

  opening: {
    selectBody: (bodyLabel) => `Explore ${bodyLabel}`,
    bodiesGroupLabel: 'Choose a world to explore'
  },

  summary: {
    hardware: 'Hardware',
    dates: 'Dates',
    finalStatus: 'Final status'
  },

  story: {
    scienceCallout: 'Key science discovery',
    source: 'Source',
    citationUnavailable: 'unavailable',
    imageUnavailable: 'Image unavailable',
    missionContentUnavailable: 'Mission content is unavailable right now.',
    sources: 'Sources'
  },

  quiz: {
    dialogLabel: 'Mission quiz',
    closeLabel: 'Close quiz',
    correct: 'Correct',
    incorrect: 'Not quite',
    next: 'Next question',
    seeScore: 'See your score',
    retake: 'Try again',
    scoreMessages: [
      'Every explorer starts somewhere. Read the story again and give it another try.',
      'Good start. You picked up some of the mission details.',
      'Great work. You remember most of this mission.',
      'Perfect score. You are a true silent explorer.'
    ]
  },

  audio: {
    mute: 'Mute audio',
    unmute: 'Unmute audio'
  },

  toast: {
    modelLoadFailed: 'The 3D model could not be loaded.',
    contextLost: 'The 3D view was interrupted and should return on its own. If it does not, please reload the page.'
  },

  closing: {
    heading: 'Journey complete'
  },

  canvasLabel: {
    opening: 'Space view showing the Moon and Mars',
    orbit: (bodyLabel) => `Orbital view of ${bodyLabel}`,
    mission: (missionName) => `${missionName} landing site with 3D model`
  },

  modelUnavailable: (missionName) => `${missionName} – model unavailable`,
  chapterLabel: (current, total) => `Chapter ${current} of ${total}`,
  journeyProgress: (index, name) => `Mission ${index + 1} of 6 · ${name}`,
  markerLabel: (missionName, locationName) => `${missionName}, ${locationName}`,
  quizProgress: (current, total) => `Question ${current} of ${total}`,
  quizScore: (score, total) => `You scored ${score} out of ${total}`,
  transitionCard: (name, hardwareName, year) => `${name} · ${hardwareName} · ${year}`,
  chapterAnnouncement: (current, total, title) => `Chapter ${current} of ${total}: ${title}`,
  storyRegionLabel: (missionName) => `${missionName} story`,
  audioGroupLabel: 'Audio',
  canvasLabelModelUnavailable: (missionName) =>
    `${missionName} landing site. The 3D model is unavailable, so a labelled placeholder box is shown.`
};

export default STRINGS;
