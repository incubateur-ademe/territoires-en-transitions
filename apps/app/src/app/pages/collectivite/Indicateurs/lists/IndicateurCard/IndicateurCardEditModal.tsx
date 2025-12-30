import { IndicateurDefinitionListItem } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import { PersonneTagOrUser, Tag } from '@tet/domain/collectivites';
import { Thematique } from '@tet/domain/shared';
import { Field, Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useEffect, useState } from 'react';

type Props = {
  indicateur: IndicateurDefinitionListItem;
  openState: OpenState;
};

const IndicateurCardEditModal = ({ indicateur, openState }: Props) => {
  const [state, setState] = useState<{
    pilotes: PersonneTagOrUser[];
    services: Tag[];
    thematiques: Thematique[];
  }>({
    pilotes: indicateur.pilotes ?? [],
    services: indicateur.services ?? [],
    thematiques: indicateur.thematiques ?? [],
  });

  useEffect(() => {
    setState({
      pilotes: indicateur.pilotes ?? [],
      services: indicateur.services ?? [],
      thematiques: indicateur.thematiques ?? [],
    });
  }, [indicateur.pilotes, indicateur.services, indicateur.thematiques]);

  // extrait les userId et les tagId
  const pilotesValues = state.pilotes
    ?.map((p) => p.userId || p.tagId?.toString())
    .filter((pilote) => !!pilote) as string[];

  const { mutate: updateIndicateur } = useUpdateIndicateur(indicateur.id);

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
              values={state.services.map((s) => s.id)}
              onChange={({ services }) =>
                setState({
                  ...state,
                  services,
                })
              }
            />
          </Field>
          {indicateur.estPerso && (
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
            disabled:
              JSON.stringify({
                pilotes: indicateur.pilotes ?? [],
                services: indicateur.services ?? [],
                thematiques: indicateur.thematiques ?? [],
              }) === JSON.stringify(state),
            onClick: () => {
              updateIndicateur({
                pilotes: state.pilotes,
                services: state.services,
                thematiques: state.thematiques,
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
