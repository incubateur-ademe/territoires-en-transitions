import {
  Checkbox,
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  ModalProps,
} from '@tet/ui';
import PersonnesDropdown from 'ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {
  getPilotesValues,
  splitPilotePersonnesAndUsers,
} from 'ui/dropdownLists/PersonnesDropdown/utils';
import ServicesPilotesDropdown from 'ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import ThematiquesDropdown from 'ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import {Filtre} from '@tet/api/dist/src/indicateurs/domain';
import PlansActionDropdown from 'ui/dropdownLists/PlansActionDropdown';
import IndicateurCompletsDropdown from 'ui/dropdownLists/indicateur/IndicateurCompletsDropdown';
import IndicateurTypesDropdown from 'ui/dropdownLists/indicateur/IndicateurTypesDropdown';
import {useState} from 'react';

type Props = ModalProps & {
  filters: Filtre;
  setFilters: (filters: Filtre) => void;
};

const ModalFiltresTousLesIndicateurs = ({
  openState,
  filters,
  setFilters,
}: Props) => {
  const [filtreState, setFiltreState] = useState<Filtre>(filters);
  return (
    <Modal
      openState={openState}
      render={() => (
        <>
          <FormSection title="Pilotage :" className="!grid-cols-1">
            <Field title="Plan d'action">
              <PlansActionDropdown
                values={filtreState.planActionIds}
                onChange={({plans}) => {
                  const {planActionIds, ...rest} = filtreState;
                  setFiltreState({
                    ...rest,
                    ...(plans ? {planActionIds: plans} : {}),
                  });
                }}
              />
            </Field>
            <Field title="Personne pilote">
              <PersonnesDropdown
                values={getPilotesValues(filtreState)}
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
                    ...(services ? {servicePiloteIds: services} : {}),
                  });
                }}
              />
            </Field>
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
          </FormSection>

          <FormSection title="Typologie :" className="!grid-cols-1">
            <Field title="Type">
              <IndicateurTypesDropdown
                disabled
                values={
                  filtreState.type && filtreState.type.length > 0
                    ? filtreState.type[0]
                    : undefined
                }
                onChange={value => {
                  const {type, ...rest} = filtreState;
                  setFiltreState({
                    ...rest,
                    ...(value ? {type: [value]} : {}),
                  });
                }}
              />
            </Field>
            <Field title="Indicateur complété">
              <IndicateurCompletsDropdown
                values={
                  filtreState.estComplet === undefined
                    ? undefined
                    : filtreState.estComplet
                    ? 'rempli'
                    : 'incomplet'
                }
                onChange={value => {
                  const {estComplet, ...rest} = filtreState;
                  setFiltreState({
                    ...rest,
                    ...(value
                      ? {
                          estComplet: value === 'rempli' ? true : false,
                        }
                      : {}),
                  });
                }}
              />
            </Field>
            <Checkbox
              label="Participe au score Climat Air Énergie"
              checked={filtreState.participationScore}
              onChange={() => {
                const {participationScore, ...rest} = filtreState;
                setFiltreState({
                  ...rest,
                  ...(!participationScore ? {participationScore: true} : {}),
                });
              }}
            />
            <div className="w-full border-t border-primary-3" />
            <Checkbox
              label="Données Open Data"
              checked={false}
              onChange={() => null}
              disabled
            />
            <Checkbox
              label="Indicateur privé"
              checked={filtreState.confidentiel}
              onChange={() => {
                const {confidentiel, ...rest} = filtreState;
                setFiltreState({
                  ...rest,
                  ...(!confidentiel ? {confidentiel: true} : {}),
                });
              }}
            />
            <Checkbox
              label="Indicateur personnalisé"
              checked={filtreState.isPerso}
              onChange={() => {
                const {isPerso, ...rest} = filtreState;
                setFiltreState({...rest, ...(!isPerso ? {isPerso: true} : {})});
              }}
            />
          </FormSection>
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

export default ModalFiltresTousLesIndicateurs;
