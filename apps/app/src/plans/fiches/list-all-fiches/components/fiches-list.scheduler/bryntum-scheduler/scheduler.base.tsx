import { EventModelConfig, LocaleManager } from '@bryntum/scheduler';
import { BryntumScheduler } from '@bryntum/scheduler-react';
import '@bryntum/scheduler/locales/scheduler.locale.FrFr';
import { useEffect } from 'react';

import { useCurrentCollectivite } from '@/api/collectivites';
import { ListFicheResumesOutput } from '@/app/plans/fiches/_data/types';
import { preset } from '@/ui';
import { FicheCardScheduler } from './fiche-card.scheduler';

export type FicheActionEvent = EventModelConfig & {
  fiche?: ListFicheResumesOutput['data'][0];
};

export type SchedulerProps = {
  events: FicheActionEvent[];
  isLoading: boolean;
};

const SchedulerBase = ({ events, isLoading }: SchedulerProps) => {
  const currentCollectivite = useCurrentCollectivite();

  const resources = events.map((event) => ({ id: event.resourceId }));

  useEffect(() => {
    // Set the locale for the scheduler
    LocaleManager.applyLocale('FrFr');
  }, []);

  return (
    <BryntumScheduler
      rowHeight={72} // Nécessite d'avoir des fiches avec toujours la même hauteur
      rowLines={false}
      /** Time axis */
      viewPreset="year"
      infiniteScroll
      visibleDate={{
        date: new Date(),
        block: 'center',
      }}
      minDate={new Date(1950, 0, 1)}
      maxDate={new Date(2100, 11, 31)}
      maxZoomLevel={8}
      timeRangesFeature={{
        showCurrentTimeLine: {
          style: `
            border-inline-start-color: ${preset.theme.extend.colors.primary[5]};
            z-index: 0;
          `,
        },
      }}
      /** Events */
      events={events}
      resources={resources}
      eventRenderer={({ eventRecord }: { eventRecord: FicheActionEvent }) => {
        if (!eventRecord.fiche) return '';
        return (
          <FicheCardScheduler
            ficheAction={eventRecord.fiche}
            currentCollectivite={currentCollectivite}
          />
        );
      }}
      emptyText={
        isLoading
          ? 'Chargement ...'
          : 'Aucune fiche action ne correspond à votre recherche'
      }
      /** Disabled features */
      // Attention: Si on réactive les intéractions, il faut probablement désactiver
      // un paquet de fonctionnalités présentes par défaut.
      // ex: eventEditFeature, eventResizeFeature, eventDragFeature, keyboard shortcuts, etc.
      readOnly
      eventStyle={null}
      eventSelectionDisabled
      eventMenuFeature={{
        disabled: true,
      }}
      eventTooltipFeature={{
        disabled: true,
      }}
      eventDragFeature={{
        disabled: true,
      }}
      eventEditFeature={{
        disabled: true,
      }}
      regionResizeFeature={{
        disabled: true,
      }}
      scheduleTooltipFeature={{
        disabled: true,
      }}
    />
  );
};

export default SchedulerBase;
