import { useUpdateIndicateurCard } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardEdit/useUpdateIndicateurCard';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import { PersonneTagOrUser } from '@/domain/collectivites';
import { IndicateurDefinitionServiceTag } from '@/domain/indicateurs';
import { Thematique } from '@/domain/shared';
import { Field, Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useEffect, useState } from 'react';

type Props = {
  indicateurId: number;
  estPerso: boolean;
  openState: OpenState;
  pilotes?: PersonneTagOrUser[];
  services?: IndicateurDefinitionServiceTag[];
  thematiques?: Thematique[];
};

const IndicateurCardEditModal = ({
  indicateurId,
  estPerso,
  openState,
  pilotes,
  services,
  thematiques,
}: Props) => {
  const initialState = {
    pilotes: pilotes ?? [],
    services: services ?? [],
    thematiques: thematiques ?? [],
  };

  const [state, setState] = useState<{
    pilotes: PersonneTagOrUser[];
    services: IndicateurDefinitionServiceTag[];
    thematiques: Thematique[];
  }>(initialState);

  useEffect(() => {
    setState(initialState);
  }, [pilotes, services, thematiques]);

  // extrait les userId et les tagId
  const pilotesValues = state.pilotes
    ?.map((p) => p.userId || p.tagId?.toString())
    .filter((pilote) => !!pilote) as string[];

  const { mutate: updateIndicateur } = useUpdateIndicateurCard(
    indicateurId,
    estPerso
  );

  return (
    <Modal
      openState={openState}
      title="Modifier l'indicateur"
      render={() => (
        <div className="flex flex-col gap-6">
          <Field title="Personne pilote :">
            <PersonnesDropdown
              values={pilotesValues}
              onChange={({ personnes }) =>
                setState({
                  ...state,
                  pilotes: personnes,
                })
              }
            />
          </Field>
          <Field title="Direction ou service pilote :">
            <ServicesPilotesDropdown
              values={state.services.map((s) => s.serviceTagId)}
              onChange={({ services }) =>
                setState({
                  ...state,
                  services: services.map((service) => ({
                    ...service,
                    indicateurId,
                    serviceTagId: service.id,
                  })),
                })
              }
            />
          </Field>
          {estPerso && (
            <Field title="Thématique :">
              <ThematiquesDropdown
                values={state.thematiques.map((t) => t.id)}
                onChange={(thematiques) =>
                  setState({
                    ...state,
                    thematiques: thematiques.map((id) => ({ id, nom: '' })),
                  })
                }
              />
            </Field>
          )}
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            disabled: JSON.stringify(initialState) === JSON.stringify(state),
            onClick: () => {
              updateIndicateur({
                ...state,
                services: state.services.map((s) => ({
                  id: s.serviceTagId,
                  collectiviteId: s.collectiviteId,
                  nom: s.nom,
                })),
              });
              close();
            },
          }}
        />
      )}
    />
  );
};

export default IndicateurCardEditModal;
