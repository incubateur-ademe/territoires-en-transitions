import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import ServiceTagDropdown from '@/app/collectivites/tags/service-tag.dropdown';
import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import { appLabels } from '@/app/labels/catalog';
import { PersonneTagOrUser, Tag } from '@tet/domain/collectivites';
import { Field, FormSectionGrid, Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { isEqual } from 'es-toolkit';
import { useEffect, useState } from 'react';

type Props = {
  openState?: OpenState;
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

  // TODO refacto : use react-hook-form

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
    <Modal
      dataTest="IndicateurEditModal"
      openState={openState}
      title={appLabels.modifierIndicateur}
      subTitle={definition.titre}
      render={({ descriptionId }) => (
        <FormSectionGrid formSectionId={descriptionId}>
          {/* Personnes pilote */}
          <Field title={appLabels.personnePilote} className="col-span-2">
            <PersonneTagDropdown
              placeholder={appLabels.selectionnerOuCreerPilote}
              values={editedPilotes?.map((p) => getPersonneStringId(p))}
              onChange={({ personnes }) => {
                setEditedPilotes(personnes);
              }}
            />
          </Field>

          {/* Directions ou services pilote */}
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
