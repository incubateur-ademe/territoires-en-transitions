'use client';

import { useEventTracker, type EventName } from '@tet/ui';
import type {
  DemarchePcaetObligation,
  DemarchePcaetStatus,
} from '@tet/domain/demarches';
import { useEffect, useEffectEvent, useRef } from 'react';
import type { DemarchePcaet } from './types';

/**
 * Ce que les événements client disent de la démarche : les mêmes propriétés
 * communes que les événements serveur (`DemarchePcaetTrackingService`), pour
 * que les deux se croisent dans PostHog.
 */
export type DemarcheTrackingSubject = {
  id: number;
  status?: DemarchePcaetStatus;
  obligation?: DemarchePcaetObligation;
  transmittedOffPlatform?: boolean;
  isScotAec?: boolean;
};

export type DemarcheActeur = 'collectivite' | 'instructeur' | 'public';

export const toDemarcheTrackingSubject = (
  demarche: Pick<
    DemarchePcaet,
    'id' | 'statut' | 'obligation' | 'transmisHorsPlateforme' | 'isScotAec'
  >
): DemarcheTrackingSubject => ({
  id: demarche.id,
  status: demarche.statut,
  obligation: demarche.obligation,
  transmittedOffPlatform: demarche.transmisHorsPlateforme,
  isScotAec: demarche.isScotAec,
});

const toProperties = (
  subject: DemarcheTrackingSubject | null | undefined,
  acteur: DemarcheActeur
) => ({
  acteur,
  ...(subject && {
    demarcheId: subject.id,
    demarcheStatus: subject.status,
    demarcheObligation: subject.obligation,
    transmittedOffPlatform: subject.transmittedOffPlatform,
    isScotAec: subject.isScotAec,
  }),
});

/**
 * `useEventTracker` augmenté des propriétés communes de la démarche. Le
 * tracker ajoute déjà la collectivité courante et les paramètres de route.
 */
export const useDemarcheTracker = (
  subject: DemarcheTrackingSubject | null | undefined,
  acteur: DemarcheActeur = 'collectivite'
) => {
  const tracker = useEventTracker();
  return (event: EventName, properties?: Record<string, unknown>) =>
    tracker(event, { ...toProperties(subject, acteur), ...properties });
};

/**
 * Émet un événement une fois par valeur de `key` — une vue d'écran, pas un
 * rendu. Attend que le sujet soit chargé quand `enabled` le demande.
 */
export const useTrackDemarcheView = (
  event: EventName,
  {
    subject,
    acteur = 'collectivite',
    properties,
    key,
    enabled = true,
  }: {
    subject?: DemarcheTrackingSubject | null;
    acteur?: DemarcheActeur;
    properties?: Record<string, unknown>;
    key: string;
    enabled?: boolean;
  }
) => {
  const track = useDemarcheTracker(subject, acteur);
  // Les propriétés du moment de la vue, sans relancer l'effet à chaque rendu.
  const emit = useEffectEvent(() => track(event, properties));
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || lastKey.current === key) return;
    lastKey.current = key;
    emit();
  }, [enabled, key]);
};

/**
 * Le cycle d'une modale de confirmation : ouverte, puis confirmée ou annulée.
 * La fermeture qui suit une confirmation n'est pas une annulation.
 */
export const useTrackedModal = (
  event: EventName,
  track: ReturnType<typeof useDemarcheTracker>,
  properties?: Record<string, unknown>
) => {
  const confirmed = useRef(false);
  return {
    onOpen: () => {
      confirmed.current = false;
      track(event, { ...properties, etat: 'ouverte' });
    },
    onConfirm: () => {
      confirmed.current = true;
      track(event, { ...properties, etat: 'confirmee' });
    },
    onClose: () => {
      if (!confirmed.current) {
        track(event, { ...properties, etat: 'annulee' });
      }
      confirmed.current = false;
    },
  };
};
