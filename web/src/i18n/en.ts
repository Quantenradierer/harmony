/** English messages. The source of truth for message keys. */
export const en = {
  'app.title': 'Harmony Trainer',
  'nav.back': 'Back',
  'nav.settings': 'Settings',
  'nav.feedback': 'Feedback',

  'module.notes': 'Notes',
  'module.intervals': 'Intervals',
  'module.chords': 'Chords',

  'interval.m2': 'Minor 2nd',
  'interval.M2': 'Major 2nd',
  'interval.m3': 'Minor 3rd',
  'interval.M3': 'Major 3rd',
  'interval.P4': 'Perfect 4th',
  'interval.TT': 'Tritone',
  'interval.P5': 'Perfect 5th',
  'interval.m6': 'Minor 6th',
  'interval.M6': 'Major 6th',
  'interval.m7': 'Minor 7th',
  'interval.M7': 'Major 7th',
  'interval.P8': 'Octave',

  'direction.ascending': 'Ascending',
  'direction.descending': 'Descending',
  'direction.harmonic': 'Together',

  'home.practice': 'Free practice',
  'home.locked': 'Locked',
  'home.passed': 'Passed',

  'lesson.title': 'Lesson {n}',
  'lesson.progress': '{correct} of {answered} correct (last {window})',
  'lesson.goal': 'Goal: {percent}% over {window} questions',
  'lesson.unlocked': 'Next lesson unlocked!',
  'lesson.next': 'Go to next lesson',
  'lesson.count': '{n} to tell apart',
  'lesson.theory': 'New in this lesson',

  'practice.title': 'Free practice: {module}',
  'practice.pick': 'Pick what to practise',
  'practice.start': 'Start practice',
  'practice.change': 'Change selection',
  'practice.empty': 'Pick at least two.',
  'practice.direction': 'Direction',

  'quiz.start': 'Start',
  'quiz.replay': 'Play again',
  'quiz.reference': 'Reference C4',
  'quiz.next': 'Next',
  'quiz.tryAgain': 'Not quite – one more try.',
  'quiz.correct': 'Correct!',
  'quiz.wrong': 'The answer was {answer}.',

  'score.session': 'Session',
  'score.total': 'Total',
  'score.accuracy': 'Accuracy',

  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.reference': 'Reference pitch',
  'settings.referenceHint': 'Plays C4 before each question.',
  'settings.on': 'On',
  'settings.off': 'Off',
  'settings.register': 'Octave: {module}',
  'register.low': 'Low',
  'register.medium': 'Medium',
  'register.high': 'High',
  'register.random': 'Random',
  'settings.playback': 'Intervals and chords',
  'playback.together': 'Together',
  'playback.sequence': 'Note by note',
  'language.de': 'Deutsch',
  'language.en': 'English',
};

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
