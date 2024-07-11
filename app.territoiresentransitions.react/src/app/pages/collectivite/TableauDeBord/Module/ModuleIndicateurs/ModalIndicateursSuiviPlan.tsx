import {useState} from 'react';

import {modulesSave} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/actions/modules.save';
import {ModuleIndicateursSelect} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import {Indicateurs} from '@tet/api';
import {
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  ModalProps,
  Select,
  SelectMultiple,
  useEventTracker,
} from '@tet/ui';
import {generateTitle} from 'app/pages/collectivite/PlansActions/FicheAction/data/utils';
import {usePlansActionsListe} from 'app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {QueryKey, useQueryClient} from 'react-query';
import PersonnesDropdown from 'ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import ThematiquesDropdown from 'ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import {splitPersonnesAndUsers} from 'ui/dropdownLists/PersonnesDropdown/utils';

type Props = ModalProps & {
  module: ModuleIndicateursSelect;
  keysToInvalidate?: QueryKey[];
};

const ModalIndicateursSuiviPlan = ({
  openState,
  module,
  keysToInvalidate,
}: Props) => {
  const collectiviteId = useCollectiviteId();
  if (!collectiviteId) {
    throw new Error('Aucune collectivité associée');
  }

  const plansActions = usePlansActionsListe(collectiviteId);
  const queryClient = useQueryClient();

  const [filtreState, setFiltreState] = useState<Indicateurs.domain.Filtre>(
    module.options.filtre
  );

  const trackEvent = useEventTracker(
    'app/tdb/personnel/indicateurs-de-suivi-de-mes-plans'
  );

  const getPilotesValues = (filtreState: Indicateurs.domain.Filtre) => {
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
            <Field title="Nom du plan :">
              <SelectMultiple
                values={filtreState.planActionIds}
                options={
                  plansActions?.plans.map(p => ({
                    label: generateTitle(p.nom),
                    value: p.id,
                  })) ?? []
                }
                onChange={({values, selectedValue}) =>
                  ((filtreState.planActionIds?.length === 1 &&
                    selectedValue !== filtreState.planActionIds[0]) ||
                    (filtreState.planActionIds &&
                      filtreState.planActionIds.length > 1)) &&
                  setFiltreState({
                    ...filtreState,
                    planActionIds: values as number[],
                  })
                }
              />
            </Field>
            <Field title="Pilote de l'indicateur :">
              <PersonnesDropdown
                values={pilotes.length ? pilotes : undefined}
                onChange={({personnes}) =>
                  setFiltreState({
                    ...filtreState,
                    ...splitPersonnesAndUsers(personnes),
                  })
                }
              />
            </Field>
            <Field title="Thématique de l'indicateur :">
              <ThematiquesDropdown
                values={
                  filtreState.thematiqueIds &&
                  filtreState.thematiqueIds.length > 0
                    ? filtreState.thematiqueIds
                    : undefined
                }
                onChange={({thematiques}) =>
                  setFiltreState({
                    ...filtreState,
                    thematiqueIds: thematiques.map(t => t.id),
                  })
                }
              />
            </Field>
            <Field title="Complétion indicateur :">
              <Select
                values={
                  filtreState.estComplet === undefined
                    ? undefined
                    : filtreState.estComplet
                    ? 'rempli'
                    : 'incomplet'
                }
                options={[
                  {
                    label: 'Complet',
                    value: 'rempli',
                  },
                  {
                    label: 'Incomplet',
                    value: 'incomplet',
                  },
                ]}
                onChange={value =>
                  setFiltreState({
                    ...filtreState,
                    estComplet:
                      value === undefined ? undefined : value === 'rempli',
                  })
                }
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
              trackEvent('tdb_valider_filtres_indicateurs', {
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

export default ModalIndicateursSuiviPlan;
