import { EventModelConfig, LocaleManager } from '@bryntum/scheduler';
import { BryntumScheduler } from '@bryntum/scheduler-react';
import '@bryntum/scheduler/locales/scheduler.locale.FrFr';
import { useEffect, useRef } from 'react';

import { useCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users/user-context/user-provider';
import { FicheResume } from '@/domain/plans';
import { preset } from '@/ui';
import { FicheCardScheduler } from './fiche-card.scheduler';

// Configure la langue française
LocaleManager.applyLocale('FrFr');

export type FicheActionEvent = EventModelConfig & {
  fiche?: FicheResume;
};

export type SchedulerProps = {
  events: FicheActionEvent[];
  isLoading: boolean;
};

const SchedulerBase = ({ events, isLoading }: SchedulerProps) => {
  const currentCollectivite = useCurrentCollectivite();
  const user = useUser();

  const resources = events.map((event) => ({ id: event.resourceId }));

  const schedulerRef = useRef<BryntumScheduler>(null);

  useEffect(() => {
    // Centre la vue à la date du jour à l'arriver sur la page calendrier
    if (schedulerRef.current) {
      schedulerRef.current.instance.visibleDate = {
        date: new Date(),
        block: 'center',
      };
    }
  }, []);

  return (
    <BryntumScheduler
      ref={schedulerRef}
      rowHeight={72} // Nécessite d'avoir des fiches avec toujours la même hauteur
      rowLines={false}
      /** Time axis */
      viewPreset="year"
      infiniteScroll
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
      scrollButtonsFeature
      /** Events */
      events={events}
      resources={resources}
      eventRenderer={({ eventRecord }: { eventRecord: FicheActionEvent }) => {
        if (!eventRecord.fiche) return '';
        return (
          <FicheCardScheduler
            ficheAction={eventRecord.fiche}
            currentCollectivite={currentCollectivite}
            currentUserId={user.id}
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
