import {useState} from 'react';

import {
  Checkbox,
  Field,
  FormSection,
  FormSectionGrid,
  Modal,
  ModalFooterOKCancel,
  ModalProps,
} from '@tet/ui';
import {QueryKey} from 'react-query';
import PersonnesDropdown from 'ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {Filtre} from '@tet/api/dist/src/fiche_actions/fiche_resumes.list/domain/fetch_options.schema';
import {
  getPilotesValues,
  getReferentsValues,
  splitPilotePersonnesAndUsers,
  splitReferentPersonnesAndUsers,
} from 'ui/dropdownLists/PersonnesDropdown/utils';
import ServicesPilotesDropdown from 'ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import ThematiquesDropdown from 'ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import FinanceursDropdown from 'ui/dropdownLists/FinanceursDropdown/FinanceursDropdown';
import StatutsFilterDropdown from 'ui/dropdownLists/ficheAction/statuts/StatutsFilterDropdown';
import PrioritesFilterDropdown from 'ui/dropdownLists/ficheAction/priorites/PrioritesFilterDropdown';

type Props = ModalProps & {
  filters: Filtre;
  setFilters: (filters: Filtre) => void;
  keysToInvalidate?: QueryKey[];
};

const ModalFiltresToutesLesFichesAction = ({
  openState,
  filters,
  setFilters,
  keysToInvalidate,
}: Props) => {
  const [filtreState, setFiltreState] = useState<Filtre>(filters);

  const pilotes = getPilotesValues(filtreState);
  const referents = getReferentsValues(filtreState);

  return (
    <Modal
      openState={openState}
      render={() => (
        <>
          <FormSection title="Nouveau filtre :" className="!grid-cols-1">
            <Field title="Personne pilote">
              <PersonnesDropdown
                values={pilotes}
                onChange={({personnes}) => {
                  const {personnePiloteIds, utilisateurPiloteIds, ...rest} =
                    filtreState;
                  const {personnePiloteIds: pIds, utilisateurPiloteIds: uIds} =
                    splitPilotePersonnesAndUsers(personnes);
                  setFiltreState({
                    ...rest,
                    ...(pIds.length > 0 ? {personnePiloteIds: pIds} : {}),
                    ...(uIds.length > 0
                      ? {
                          utilisateurPiloteIds: uIds,
                        }
                      : {}),
                  });
                }}
              />
            </Field>
            <Field title="Direction ou service pilote">
              <ServicesPilotesDropdown
                values={filtreState.servicePiloteIds}
                onChange={({services}) => {
                  const {servicePiloteIds, ...rest} = filtreState;
                  setFiltreState({
                    ...rest,
                    ...(services
                      ? {servicePiloteIds: services.map(s => s.id)}
                      : {}),
                  });
                }}
              />
            </Field>

            <Field title="Élu·e référent·e">
              <PersonnesDropdown
                values={referents}
                onChange={({personnes}) => {
                  const {
                    personneReferenteIds,
                    utilisateurReferentIds,
                    ...rest
                  } = filtreState;
                  const {
                    personneReferenteIds: pIds,
                    utilisateurReferentIds: uIds,
                  } = splitReferentPersonnesAndUsers(personnes);
                  setFiltreState({
                    ...rest,
                    ...(pIds.length > 0 ? {personneReferenteIds: pIds} : {}),
                    ...(uIds.length > 0
                      ? {
                          utilisateurReferentIds: uIds,
                        }
                      : {}),
                  });
                }}
              />
            </Field>

            <FormSectionGrid>
              <Field title="Statut de l'action">
                <StatutsFilterDropdown
                  values={filtreState.statuts}
                  onChange={({statuts}) => {
                    const {statuts: st, ...rest} = filtreState;
                    setFiltreState({
                      ...rest,
                      ...(statuts ? {statuts} : {}),
                    });
                  }}
                />
              </Field>
              <Field title="Niveau de priorité">
                <PrioritesFilterDropdown
                  values={filtreState.priorites}
                  onChange={({priorites}) => {
                    const {priorites: st, ...rest} = filtreState;
                    setFiltreState({
                      ...rest,
                      ...(priorites ? {priorites} : {}),
                    });
                  }}
                />
              </Field>
            </FormSectionGrid>
            <Field title="Thématique">
              <ThematiquesDropdown
                values={filtreState.thematiqueIds}
                onChange={({thematiques}) => {
                  const {thematiqueIds, ...rest} = filtreState;
                  setFiltreState({
                    ...rest,
                    ...(thematiques.length > 0
                      ? {thematiqueIds: thematiques.map(t => t.id)}
                      : {}),
                  });
                }}
              />
            </Field>
            <Field title="Financeur">
              <FinanceursDropdown
                values={filtreState.financeurIds}
                onChange={({financeurs}) => {
                  const {financeurIds, ...rest} = filtreState;
                  setFiltreState({
                    ...rest,
                    ...(financeurs ? {financeurIds: financeurs} : {}),
                  });
                }}
              />
            </Field>
          </FormSection>

          <Checkbox
            label="Budget prévisionnel total renseigné"
            checked={filtreState.budgetPrevisionnel}
            onChange={() => {
              const {budgetPrevisionnel, ...rest} = filtreState;
              setFiltreState({
                ...rest,
                ...(!budgetPrevisionnel ? {budgetPrevisionnel: true} : {}),
              });
            }}
          />
          <Checkbox
            label="Fiche action en mode privé"
            checked={filtreState.restreint}
            onChange={() => {
              const {restreint, ...rest} = filtreState;
              setFiltreState({
                ...rest,
                ...(!restreint ? {restreint: true} : {}),
              });
            }}
          />
          <Checkbox
            label="Indicateur(s) lié(s)"
            checked={filtreState.hasIndicateurLies}
            onChange={() => {
              const {hasIndicateurLies, ...rest} = filtreState;
              setFiltreState({
                ...rest,
                ...(!hasIndicateurLies ? {hasIndicateurLies: true} : {}),
              });
            }}
          />
        </>
      )}
      renderFooter={({close}) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: () => close(),
          }}
          btnOKProps={{
            onClick: () => {
              setFilters(filtreState);
              close();
            },
          }}
        />
      )}
    />
  );
};

export default ModalFiltresToutesLesFichesAction;
