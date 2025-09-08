import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import { PersonneTagOrUser, Tag } from '@/domain/collectivites';
import { Field, FormSectionGrid, Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { isEqual } from 'es-toolkit';
import { useEffect, useState } from 'react';
import {
  useIndicateurPilotes,
  useUpsertIndicateurPilote,
} from '../../Indicateur/detail/useIndicateurPilotes';
import {
  useIndicateurServices,
  useUpsertIndicateurServices,
} from '../../Indicateur/detail/useIndicateurServices';
import { TIndicateurDefinition } from '../../types';

type Props = {
  openState?: OpenState;
  collectiviteId: number;
  definition: TIndicateurDefinition;
};

const EditModal = ({ openState, collectiviteId, definition }: Props) => {
  const [editedPilotes, setEditedPilotes] = useState<
    PersonneTagOrUser[] | undefined
  >();
  const [editedServices, setEditedServices] = useState<Tag[] | undefined>();

  const { data: pilotes } = useIndicateurPilotes(definition.id);
  const { data: services } = useIndicateurServices(definition.id);

  // fonctions de mise à jour des données
  const { mutate: upsertIndicateurPilote } = useUpsertIndicateurPilote();
  const { mutate: upsertIndicateurServicePilote } =
    useUpsertIndicateurServices();

  // TODO refacto : use react-hook-form

  useEffect(() => {
    setEditedPilotes(pilotes);
  }, [pilotes]);

  useEffect(
    () =>
      setEditedServices(
        services?.map((s) => ({
          ...s,
          id: s.serviceTagId,
        }))
      ),
    [services]
  );

  const handleSave = () => {
    if (!isEqual(editedPilotes, pilotes)) {
      upsertIndicateurPilote({
        collectiviteId,
        indicateurId: definition.id,
        indicateurPilotes: (editedPilotes ?? []).map((pilote) => ({
          tagId: pilote.tagId,
          userId: pilote.userId,
        })),
      });
    }

    if (
      !isEqual(
        editedServices?.map((s) => s.id),
        services
      ) &&
      !!editedServices
    ) {
      upsertIndicateurServicePilote({
        collectiviteId,
        indicateurId: definition.id,
        indicateurServicesPilotesIds: editedServices.map((s) => s.id),
      });
    }
  };

  return (
    <Modal
      openState={openState}
      title="Modifier l'indicateur"
      subTitle={definition.titre}
      render={({ descriptionId }) => (
        <FormSectionGrid formSectionId={descriptionId}>
          {/* Personnes pilote */}
          <Field title="Personne pilote" className="col-span-2">
            <PersonnesDropdown
              placeholder="Sélectionnez ou créez un pilote"
              values={editedPilotes?.map((p) => getPersonneStringId(p))}
              onChange={({ personnes }) => {
                setEditedPilotes(personnes);
              }}
            />
          </Field>

          {/* Directions ou services pilote */}
          <Field title="Direction ou service pilote" className="col-span-2">
            <ServicesPilotesDropdown
              placeholder="Sélectionnez ou créez un pilote"
              values={editedServices?.map((s) => s.id)}
              onChange={({ services }) => setEditedServices(services)}
            />
          </Field>
        </FormSectionGrid>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: () => {
              handleSave();
              close();
            },
          }}
        />
      )}
    />
  );
};

export default EditModal;
