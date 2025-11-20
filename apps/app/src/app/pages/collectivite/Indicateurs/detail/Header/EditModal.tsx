import { IndicateurDefinition } from '@/app/indicateurs/definitions/use-get-indicateur-definition';
import { useUpdateIndicateurDefinition } from '@/app/indicateurs/definitions/use-update-indicateur-definition';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
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

  const { mutate: updateIndicateur } = useUpdateIndicateurDefinition(
    definition.id
  );

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
