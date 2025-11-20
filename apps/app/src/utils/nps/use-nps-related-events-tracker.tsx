import { useMutationCacheSubscriber } from '@/app/utils/react-query/use-mutation-cache-subscriber';
import { useTRPC } from '@tet/api';
import { useNPSSurveyManager } from '@tet/ui/components/tracking/use-nps-survey-manager';
import { debounce } from 'es-toolkit';
import { useMemo } from 'react';

type TrackerType = 'fiches' | 'referentiels' | 'indicateurs';

const useGetMutationPatterns = () => {
  const { trackUpdateOperation } = useNPSSurveyManager();
  const trpc = useTRPC();
  const MUTATION_KEYS_TO_TRACK_FOR_NPS: Record<
    TrackerType,
    Array<readonly unknown[] | string>
  > = {
    fiches: [
      trpc.plans.fiches.update.mutationKey(),
      'upsert_fiches_action_liees',
      trpc.plans.fiches.budgets.upsert.mutationKey(),
      'create_fiche_resume',
      'update_linked_fiches',
      'upsert_note_suivi',
      trpc.plans.fiches.etapes.upsert.mutationKey(),
      trpc.plans.plans.create.mutationKey(),
      trpc.plans.plans.createAxe.mutationKey(),
      'upsert_preuve_annexe',
      'update_fiche_bibliotheque_fichier_filename',
    ],
    indicateurs: [
      trpc.indicateurs.valeurs.upsert.mutationKey(),
      trpc.indicateurs.definitions.create.mutationKey(),
      trpc.indicateurs.definitions.update.mutationKey(),
      'upsert_indicateur_perso_def',
      'upsert_indicateur_personnalise_thematique',
      'update_indicateur_card',
    ],
    referentiels: [
      'upsert_referentiel_action_commentaire',
      trpc.referentiels.actions.upsertPilotes.mutationKey(),
      trpc.referentiels.actions.upsertServices.mutationKey(),
      'upsert_referentiel_justification',
      'upsert_reponse_potentiel_personnalisation',
      trpc.collectivites.membres.update.mutationKey(),
    ],
  };

  const toString = (key: readonly unknown[] | string | undefined): string => {
    if (!key) {
      return '';
    }
    if (typeof key === 'string') {
      return key;
    }
    return key.join('.');
  };

  const debouncedTrackUpdateOperation = useMemo(
    () =>
      debounce((mutationTypeToTrack: TrackerType) => {
        trackUpdateOperation(mutationTypeToTrack);
      }, 1000),
    [trackUpdateOperation]
  );

  return {
    trackEvent: (rawMutationKey: readonly unknown[] | undefined) => {
      const mutationKey = toString(rawMutationKey);
      const mutationTypeToTrack = Object.entries(
        MUTATION_KEYS_TO_TRACK_FOR_NPS
      ).find(([, patterns]) =>
        patterns.some((pattern) => mutationKey.includes(toString(pattern)))
      )?.[0];

      if (mutationTypeToTrack) {
        /**
         * A debounced tracker is used to avoid tracking the same event multiple times in a short period of time
         * (some mutations perform multiple mutations in cascade that would trigger the tracker multiple times)
         */
        debouncedTrackUpdateOperation(mutationTypeToTrack as TrackerType);
      }
    },
  };
};

export const useNPSRelatedEventsTracker = () => {
  const { trackEvent } = useGetMutationPatterns();
  useMutationCacheSubscriber(({ status, mutationKey }) => {
    if (status === 'success') {
      trackEvent(mutationKey);
    }
  });
};
