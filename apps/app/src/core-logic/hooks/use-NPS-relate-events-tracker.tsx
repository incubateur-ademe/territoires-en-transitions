import { useTRPC } from '@/api/utils/trpc/client';
import { useNPSSurveyManager } from '@/ui/components/tracking/use-nps-survey-manager';
import { Mutation, useQueryClient } from '@tanstack/react-query';
import { TRPCMutationKey } from '@trpc/tanstack-react-query';
import { debounce } from 'es-toolkit';
import { useEffect, useMemo } from 'react';

type TrackerType = 'fiches' | 'referentiels' | 'indicateurs';

const useGetMutationPatterns = () => {
  const { trackUpdateOperation } = useNPSSurveyManager();
  const trpc = useTRPC();
  const MUTATION_KEYS_TO_TRACK_FOR_NPS: Record<
    TrackerType,
    Array<TRPCMutationKey | string>
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
      'upsert_indicateur_perso_def',
      'upsert_indicateur_pilotes',
      trpc.indicateurs.definitions.createIndicateurPerso.mutationKey(),
      'upsert_indicateur_services',
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

  const toString = (key: string | TRPCMutationKey) =>
    Array.isArray(key) ? key.join('.') : key;

  const debouncedTrackUpdateOperation = useMemo(
    () =>
      debounce((mutationTypeToTrack: TrackerType) => {
        trackUpdateOperation(mutationTypeToTrack);
      }, 1000),
    [trackUpdateOperation]
  );

  return {
    trackEvent: (rawMutationKey: string | TRPCMutationKey) => {
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
  const queryClient = useQueryClient();
  const { trackEvent } = useGetMutationPatterns();
  useEffect(() => {
    const unsubscribe = queryClient
      .getMutationCache()
      .subscribe(({ mutation }: { mutation: Mutation }) => {
        const status = mutation?.state.status;

        if (status === 'success') {
          trackEvent(mutation.options.mutationKey);
        }
      });

    return unsubscribe;
  }, [trackEvent, queryClient]);
};
