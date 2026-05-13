import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import ServiceTagDropdown from '@/app/collectivites/tags/service-tag.dropdown';
import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import { appLabels } from '@/app/labels/catalog';
import { PersonneTagOrUser, Tag } from '@tet/domain/collectivites';
import { Field, FormSectionGrid } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { OpenState } from '@tet/ui/utils/types';
import { isEqual } from 'es-toolkit';
import { useEffect, useState } from 'react';

type Props = {
  openState: OpenState;
  definition: IndicateurDefinition;
};

const EditModal = ({ openState, definition }: Props) => {
  const [editedPilotes, setEditedPilotes] = useState<
    PersonneTagOrUser[] | undefined
  >();
  const [editedServices, setEditedServices] = useState<Tag[] | undefined>();

  const pilotes = definition.pilotes || [];
  const services = definition.services || [];

  const { mutate: updateIndicateur } = useUpdateIndicateur(definition.id);

  useEffect(() => {
    setEditedPilotes(pilotes);
  }, [pilotes]);

  useEffect(() => setEditedServices(services), [services]);

  const handleSave = () => {
    if (!isEqual(editedPilotes, pilotes)) {
      updateIndicateur({
        pilotes: editedPilotes ?? [],
      });
    }

    if (
      !isEqual(
        editedServices?.map((s) => s.id),
        services
      ) &&
      !!editedServices
    ) {
      updateIndicateur({
        services: editedServices,
      });
    }
  };

  return (
    <Modal openState={{ isOpen: openState.isOpen, setIsOpen: openState.setIsOpen }}>
      <Modal.Header>
        <Modal.Title>{appLabels.modifierIndicateur}</Modal.Title>
        <Modal.Subtitle>{definition.titre}</Modal.Subtitle>
      </Modal.Header>
      <Modal.Body>
        <FormSectionGrid>
          <Field title={appLabels.personnePilote} className="col-span-2">
            <PersonneTagDropdown
              placeholder={appLabels.selectionnerOuCreerPilote}
              values={editedPilotes?.map((p) => getPersonneStringId(p))}
              onChange={({ personnes }) => {
                setEditedPilotes(personnes);
              }}
            />
          </Field>
          <Field
            title={appLabels.directionOuServicePilote}
            className="col-span-2"
          >
            <ServiceTagDropdown
              values={editedServices?.map((s) => s.id)}
              onChange={({ values: services }) => setEditedServices(services)}
            />
          </Field>
        </FormSectionGrid>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel>{appLabels.annuler}</Modal.Cancel>
        <Modal.Ok
          onClick={() => {
            handleSave();
            openState.setIsOpen(false);
          }}
        >
          {appLabels.valider}
        </Modal.Ok>
      </Modal.Footer>
    </Modal>
  );
};

export default EditModal;
