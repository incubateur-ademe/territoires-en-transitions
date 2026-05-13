import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import ServiceTagDropdown from '@/app/collectivites/tags/service-tag.dropdown';
import { IndicateurDefinitionListItem } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import { appLabels } from '@/app/labels/catalog';
import ThematiquesDropdown from '@/app/shared/thematiques/thematiques.dropdown';
import { PersonneTagOrUser, Tag } from '@tet/domain/collectivites';
import { Thematique } from '@tet/domain/shared';
import { Field } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
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

  const pilotesValues = state.pilotes
    ?.map((p) => p.userId || p.tagId?.toString())
    .filter((pilote) => !!pilote) as string[];

  const { mutate: updateIndicateur } = useUpdateIndicateur(indicateur.id);

  const initialState = {
    pilotes: indicateur.pilotes ?? [],
    services: indicateur.services ?? [],
    thematiques: indicateur.thematiques ?? [],
  };
  const isDirty = JSON.stringify(initialState) !== JSON.stringify(state);

  return (
    <Modal openState={{ isOpen: openState.isOpen, setIsOpen: openState.setIsOpen }}>
      <Modal.Header>
        <Modal.Title>{appLabels.modifierIndicateur}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="flex flex-col gap-6">
          <Field title={appLabels.champPersonnePiloteColon}>
            <PersonneTagDropdown
              values={pilotesValues}
              onChange={({ personnes }) =>
                setState({
                  ...state,
                  pilotes: personnes,
                })
              }
            />
          </Field>
          <Field title={appLabels.champDirectionServicePiloteColon}>
            <ServiceTagDropdown
              values={state.services.map((s) => s.id)}
              onChange={({ values: services }) =>
                setState({
                  ...state,
                  services,
                })
              }
            />
          </Field>
          {indicateur.estPerso && (
            <Field title={appLabels.champThematiqueColon}>
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
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel>{appLabels.annuler}</Modal.Cancel>
        <Modal.Ok
          disabled={!isDirty}
          onClick={() => {
            updateIndicateur({
              pilotes: state.pilotes,
              services: state.services,
              thematiques: state.thematiques,
            });
            openState.setIsOpen(false);
          }}
        >
          {appLabels.valider}
        </Modal.Ok>
      </Modal.Footer>
    </Modal>
  );
};

export default IndicateurCardEditModal;
