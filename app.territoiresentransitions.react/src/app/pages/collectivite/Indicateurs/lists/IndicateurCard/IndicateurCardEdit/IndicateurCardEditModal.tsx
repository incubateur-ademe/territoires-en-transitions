import { Personne } from '@/api/collectivites';
import { useUpdateIndicateurCard } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCardEdit/useUpdateIndicateurCard';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import { Tag } from '@/domain/collectivites';
import { Thematique } from '@/domain/shared';
import { Field, Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useEffect, useState } from 'react';
import { objectToCamel } from 'ts-case-convert';

type Props = {
  indicateurId: number;
  estPerso: boolean;
  openState: OpenState;
  pilotes?: Personne[];
  serviceIds?: number[];
  thematiqueIds?: number[];
};

const IndicateurCardEditModal = ({
  indicateurId,
  estPerso,
  openState,
  pilotes,
  serviceIds,
  thematiqueIds,
}: Props) => {
  const initialState = {
    pilotes: pilotes ?? [],
    // uniquement l'id nous intéresse pour le state initial
    services:
      serviceIds?.map((id) => ({ id, nom: '', collectiviteId: 0 })) ?? [],
    // uniquement l'id nous intéresse pour le state initial
    thematiques: thematiqueIds?.map((id) => ({ id, nom: '' })) ?? [],
  };

  const [state, setState] = useState<{
    pilotes: Personne[];
    services: Tag[];
    thematiques: Thematique[];
  }>(initialState);

  useEffect(() => {
    setState(initialState);
  }, [pilotes, serviceIds, thematiqueIds]);

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
                  pilotes: personnes.map((personne) => ({
                    collectiviteId: personne.collectiviteId!,
                    tagId: personne.tagId,
                    userId: personne.userId,
                  })),
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
                  services: objectToCamel(services),
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
                    thematiques,
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
              updateIndicateur(state);
              close();
            },
          }}
        />
      )}
    />
  );
};

export default IndicateurCardEditModal;
