import { EventModelConfig, LocaleManager } from '@bryntum/scheduler';
import { BryntumScheduler } from '@bryntum/scheduler-react';
import '@bryntum/scheduler/locales/scheduler.locale.FrFr';
import { useEffect } from 'react';

import { useCurrentCollectivite } from '@/api/collectivites';
import { ListFicheResumesOutput } from '@/app/plans/fiches/_data/types';
import { FicheCardScheduler } from './fiche-card.scheduler';
import { getViewPresetScale } from './utils';

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
      viewPreset={getViewPresetScale(events)}
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
