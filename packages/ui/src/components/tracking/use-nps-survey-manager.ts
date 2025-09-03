import { Event } from './posthog-events';
import { useEventTracker } from './use-event-tracker';

const FICHES_UPDATE_COUNTER = 'fiches_update_counter';
const REFERENTIELS_UPDATE_COUNTER = 'referentiels_update_counter';
const INDICATEURS_UPDATE_COUNTER = 'indicateurs_update_counter';

const keys: Record<'fiches' | 'referentiels' | 'indicateurs', string> = {
  fiches: FICHES_UPDATE_COUNTER,
  referentiels: REFERENTIELS_UPDATE_COUNTER,
  indicateurs: INDICATEURS_UPDATE_COUNTER,
} as const;

const NUMBER_OF_NPS_RELATED_EVENTS_BEFORE_SHOWING_NPS = 2; //15;

export function getNpsCounter(
  type: 'fiches' | 'referentiels' | 'indicateurs'
): number {
  const key = keys[type];
  try {
    return parseInt(localStorage.getItem(key) || '0', 10);
  } catch (error) {
    console.warn(`Failed to read ${type} counter:`, error);
    return 0;
  }
}

export function setNpsCounter(
  type: 'fiches' | 'referentiels' | 'indicateurs',
  count: number
): void {
  const key = keys[type];
  console.log('setNpsCounter |', type, key, count);
  try {
    localStorage.setItem(key, count.toString());
  } catch (error) {
    console.warn(`Failed to update ${type} counter:`, error);
  }
}

export function incrementNpsCounter(
  type: 'fiches' | 'referentiels' | 'indicateurs'
): number {
  const newCount = getNpsCounter(type) + 1;
  console.log('incrementNpsCounter |', type, getNpsCounter(type), newCount);
  setNpsCounter(type, newCount);
  return newCount;
}

export const shouldTriggerShowNPSSurveyEvent = (
  type: 'fiches' | 'referentiels' | 'indicateurs'
) => {
  return getNpsCounter(type) >= NUMBER_OF_NPS_RELATED_EVENTS_BEFORE_SHOWING_NPS;
};

export const useNPSSurveyManager = () => {
  const eventTracker = useEventTracker();
  const trackUpdateOperation = (
    type: 'fiches' | 'referentiels' | 'indicateurs'
  ) => {
    incrementNpsCounter(type);

    if (shouldTriggerShowNPSSurveyEvent(type) === false) {
      return;
    }

    setNpsCounter(type, 0);
    eventTracker(Event.showNps, {
      type,
    });
  };
  return {
    trackUpdateOperation,
  };
};
