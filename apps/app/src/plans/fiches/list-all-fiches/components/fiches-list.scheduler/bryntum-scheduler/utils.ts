import { EventModelConfig } from '@bryntum/scheduler';

const getMinYearFromEvents = (events: EventModelConfig[]): number =>
  events
    .reduce((min, event) => {
      if (!event.startDate) return min;
      const date = new Date(event.startDate);
      return date < min ? date : min;
    }, new Date(8640000000000000))
    .getFullYear();

const getMaxYearFromEvents = (events: EventModelConfig[]): number =>
  events
    .reduce((max, event) => {
      if (!event.endDate) return max;
      const date = new Date(event.endDate);
      return date > max ? date : max;
    }, new Date(0))
    .getFullYear();

export const getViewPresetScale = (events: EventModelConfig[]) => {
  const minYear = getMinYearFromEvents(events);
  const maxYear = getMaxYearFromEvents(events);
  if (maxYear - minYear > 3) {
    return 'manyYears';
  } else {
    return 'year';
  }
};
