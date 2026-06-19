import type { TourStep } from './Tour';

/**
 * Tour IDs are persisted in localStorage; never rename without migrating
 * `onboarding` store. Adding a new tour or new step is safe.
 */
export const TOUR_IDS = {
  home: 'home@1',
  eventAdmin: 'event-admin@1',
  eventSetup: 'event-setup@1',
  record: 'record@1',
} as const;

export type TourId = (typeof TOUR_IDS)[keyof typeof TOUR_IDS];

export const HOME_TOUR_STEPS: TourStep[] = [
  { titleKey: 'tour.home.welcome.title', descKey: 'tour.home.welcome.desc' },
  {
    selector: '[data-tour="home-new-event"]',
    titleKey: 'tour.home.newEvent.title',
    descKey: 'tour.home.newEvent.desc',
  },
  {
    selector: '[data-tour="home-join"]',
    titleKey: 'tour.home.join.title',
    descKey: 'tour.home.join.desc',
  },
  {
    selector: '[data-tour="nav-archived"]',
    titleKey: 'tour.home.archived.title',
    descKey: 'tour.home.archived.desc',
  },
  {
    selector: '[data-tour="nav-restore"]',
    titleKey: 'tour.home.restore.title',
    descKey: 'tour.home.restore.desc',
  },
  {
    selector: '[data-tour="nav-settings"]',
    titleKey: 'tour.home.settings.title',
    descKey: 'tour.home.settings.desc',
  },
];

export const EVENT_ADMIN_TOUR_STEPS: TourStep[] = [
  { titleKey: 'tour.event.welcome.title', descKey: 'tour.event.welcome.desc' },
  {
    selector: '[data-tour="event-credentials"]',
    titleKey: 'tour.event.credentials.title',
    descKey: 'tour.event.credentials.desc',
  },
  {
    selector: '[data-tour="event-new-game"]',
    titleKey: 'tour.event.newGame.title',
    descKey: 'tour.event.newGame.desc',
  },
  {
    selector: '[data-tour="event-setup"]',
    titleKey: 'tour.event.setup.title',
    descKey: 'tour.event.setup.desc',
  },
  {
    selector: '[data-tour="event-finish"]',
    titleKey: 'tour.event.finish.title',
    descKey: 'tour.event.finish.desc',
  },
];

export const EVENT_SETUP_TOUR_STEPS: TourStep[] = [
  { titleKey: 'tour.setup.welcome.title', descKey: 'tour.setup.welcome.desc' },
  {
    selector: '[data-tour="setup-import"]',
    titleKey: 'tour.setup.import.title',
    descKey: 'tour.setup.import.desc',
  },
  {
    selector: '[data-tour="setup-new-team"]',
    titleKey: 'tour.setup.newTeam.title',
    descKey: 'tour.setup.newTeam.desc',
  },
  {
    selector: '[data-tour="setup-team-card"]',
    titleKey: 'tour.setup.teamCard.title',
    descKey: 'tour.setup.teamCard.desc',
  },
  {
    selector: '[data-tour="setup-done"]',
    titleKey: 'tour.setup.done.title',
    descKey: 'tour.setup.done.desc',
  },
];

export const RECORD_TOUR_STEPS: TourStep[] = [
  { titleKey: 'tour.record.welcome.title', descKey: 'tour.record.welcome.desc' },
  {
    selector: '[data-tour="record-clock"]',
    titleKey: 'tour.record.clock.title',
    descKey: 'tour.record.clock.desc',
  },
  {
    selector: '[data-tour="record-controls"]',
    titleKey: 'tour.record.controls.title',
    descKey: 'tour.record.controls.desc',
  },
  {
    selector: '[data-tour="record-goals"]',
    titleKey: 'tour.record.goals.title',
    descKey: 'tour.record.goals.desc',
  },
  {
    selector: '[data-tour="record-feed"]',
    titleKey: 'tour.record.feed.title',
    descKey: 'tour.record.feed.desc',
  },
];
