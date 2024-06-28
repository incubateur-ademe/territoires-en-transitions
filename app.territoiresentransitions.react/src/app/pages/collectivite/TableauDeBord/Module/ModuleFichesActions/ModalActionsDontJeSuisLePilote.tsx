import {useState} from 'react';

import {modulesSave} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/actions/modules.save';
import {ModuleFicheActionsSelect} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import {
  Field,
  FormSection,
  FormSectionGrid,
  Modal,
  ModalFooterOKCancel,
  ModalProps,
  SelectFilter,
  SelectMultiple,
  useEventTracker,
} from '@tet/ui';
import {generateTitle} from 'app/pages/collectivite/PlansActions/FicheAction/data/utils';
import {usePlansActionsListe} from 'app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {QueryKey, useQueryClient} from 'react-query';
import PersonnesDropdown from 'ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {Filtre as FiltreFichesAction} from '@tet/api/dist/src/fiche_actions/fiche_resumes.list/domain/fetch_options.schema';
import {
  ficheActionNiveauPrioriteOptions,
  ficheActionStatutOptions,
} from 'app/pages/collectivite/PlansActions/FicheAction/data/options/listesStatiques';
import {TFicheActionNiveauxPriorite, TFicheActionStatuts} from 'types/alias';
import BadgeStatut from 'app/pages/collectivite/PlansActions/components/BadgeStatut';
import BadgePriorite from 'app/pages/collectivite/PlansActions/components/BadgePriorite';
import {useAuth} from 'core-logic/api/auth/AuthProvider';

type Props = ModalProps & {
  module: ModuleFicheActionsSelect;
  keysToInvalidate?: QueryKey[];
};

const ModalActionsDontJeSuisLePilote = ({
  openState,
  module,
  keysToInvalidate,
}: Props) => {
  const collectiviteId = useCollectiviteId();
  const queryClient = useQueryClient();
  const userId = useAuth().user?.id;

  const plansActions = usePlansActionsListe(collectiviteId!);

  const [filtreState, setFiltreState] = useState<FiltreFichesAction>(
    module.options.filtre
  );

  const trackEvent = useEventTracker(
    'app/tdb/personnel/actions-dont-je-suis-pilote'
  );

  const getPilotesValues = (filtreState: FiltreFichesAction) => {
    const pilotes = [];
    if (filtreState.utilisateurPiloteIds) {
      pilotes.push(...filtreState.utilisateurPiloteIds);
    }
    if (filtreState.personnePiloteIds) {
      pilotes.push(...filtreState.personnePiloteIds.map(String));
    }
    return pilotes;
  };

  const pilotes = getPilotesValues(filtreState);

  return (
    <Modal
      openState={openState}
      render={() => (
        <>
          <h3 className="mb-4 text-center text-2xl">{module.titre}</h3>
          <FormSection title="Filtrer sur :" className="!grid-cols-1">
            <Field title="Plans d'action :">
              <SelectMultiple
                values={filtreState.planActionIds}
                options={
                  plansActions?.plans.map(p => ({
                    label: generateTitle(p.nom),
                    value: p.id,
                  })) ?? []
                }
                onChange={({values}) =>
                  setFiltreState({
                    ...filtreState,
                    planActionIds: values as number[],
                  })
                }
              />
            </Field>
            <FormSectionGrid>
              <Field title="Statut">
                <SelectFilter
                  values={filtreState.statuts ?? undefined}
                  options={ficheActionStatutOptions}
                  onChange={({values}) =>
                    setFiltreState({
                      ...filtreState,
                      statuts: values as TFicheActionStatuts[],
                    })
                  }
                  customItem={item => (
                    <BadgeStatut statut={item.value as TFicheActionStatuts} />
                  )}
                />
              </Field>
              <Field title="Niveau de priorité">
                <SelectFilter
                  values={filtreState.priorites ?? undefined}
                  options={ficheActionNiveauPrioriteOptions}
                  onChange={({values}) =>
                    setFiltreState({
                      ...filtreState,
                      priorites: values as TFicheActionNiveauxPriorite[],
                    })
                  }
                  customItem={item => (
                    <BadgePriorite
                      priorite={item.value as TFicheActionNiveauxPriorite}
                    />
                  )}
                />
              </Field>
            </FormSectionGrid>
            <Field title="Pilote">
              <PersonnesDropdown
                values={pilotes.length ? pilotes : undefined}
                onChange={() => null}
                disabled
                disabledOptionsIds={[userId!]}
              />
            </Field>
          </FormSection>
        </>
      )}
      renderFooter={({close}) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: () => close(),
          }}
          btnOKProps={{
            onClick: async () => {
              trackEvent('tdb_valider_filtres_actions_pilotes', {
                collectivite_id: collectiviteId!,
              });
              await modulesSave({
                dbClient: supabaseClient,
                module: {
                  ...module,
                  options: {
                    ...module.options,
                    filtre: filtreState,
                  },
                },
              });

              keysToInvalidate?.forEach(key =>
                queryClient.invalidateQueries(key)
              );

              close();
            },
          }}
        />
      )}
    />
  );
};

export default ModalActionsDontJeSuisLePilote;
