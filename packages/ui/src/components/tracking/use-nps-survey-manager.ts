import { useLocalStorage } from 'react-use';
import { Event } from './posthog-events';
import { useEventTracker } from './use-event-tracker';
const FICHES_UPDATE_COUNTER = 'fiches_update_counter';
const REFERENTIELS_UPDATE_COUNTER = 'referentiels_update_counter';
const INDICATEURS_UPDATE_COUNTER = 'indicateurs_update_counter';

type TrackerType = 'fiches' | 'referentiels' | 'indicateurs';

const storageKeys: Record<TrackerType, string> = {
  fiches: FICHES_UPDATE_COUNTER,
  referentiels: REFERENTIELS_UPDATE_COUNTER,
  indicateurs: INDICATEURS_UPDATE_COUNTER,
} as const;

export function incrementNpsCounter({
  value,
  setValue,
}: {
  value: number;
  setValue: (value: number) => void;
}): number {
  const newCount = value + 1;
  setValue(newCount);
  return newCount;
}
export const shouldTriggerShowNPSSurveyEvent = (value: number) => {
  const NUMBER_OF_NPS_RELATED_EVENTS_BEFORE_SHOWING_NPS = 15;
  /**
   * event is triggered once from the app then posthog manages it on its own
   */
  return value === NUMBER_OF_NPS_RELATED_EVENTS_BEFORE_SHOWING_NPS;
};

const useCustomLocalStorage = (type: TrackerType) => {
  const [value, setValue, remove] = useLocalStorage(storageKeys[type], 0, {
    raw: false,
    serializer: (value: number) => value.toString(),
    deserializer: (value: string) => parseInt(value, 10),
  });
  return { value: value ?? 0, setValue, remove };
};

const useGetActionCounters = () => {
  const fichesStorage = useCustomLocalStorage('fiches');
  const referentielsStorage = useCustomLocalStorage('referentiels');
  const indicateursStorage = useCustomLocalStorage('indicateurs');
  return {
    fiches: fichesStorage,
    referentiels: referentielsStorage,
    indicateurs: indicateursStorage,
  };
};
export const useNPSSurveyManager = () => {
  const counters = useGetActionCounters();
  const eventTracker = useEventTracker();

  const trackUpdateOperation = (type: TrackerType) => {
    const newCount = incrementNpsCounter(counters[type]);

    if (shouldTriggerShowNPSSurveyEvent(newCount)) {
      eventTracker(Event.showNps, {
        type,
      });
    }
  };
  return {
    trackUpdateOperation,
  };
};
