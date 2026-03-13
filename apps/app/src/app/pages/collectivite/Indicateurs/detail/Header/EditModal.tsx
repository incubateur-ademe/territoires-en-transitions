import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import SelectPersonnesCombobox from '@/app/collectivites/tags/select-personnes.combobox';
import SelectServicesPilotesCombobox from '@/app/collectivites/tags/select-service-pilotes.combobox';
import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
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
      openState={openState}
      title="Modifier l'indicateur"
      subTitle={definition.titre}
      render={({ descriptionId }) => (
        <FormSectionGrid formSectionId={descriptionId}>
          {/* Personnes pilote */}
          <Field title="Personne pilote" className="col-span-2">
            <SelectPersonnesCombobox
              placeholder="Sélectionnez ou créez un pilote"
              values={editedPilotes?.map((p) => getPersonneStringId(p))}
              onChange={({ personnes }) => {
                setEditedPilotes(personnes);
              }}
            />
          </Field>

          {/* Directions ou services pilote */}
          <Field title="Direction ou service pilote" className="col-span-2">
            <SelectServicesPilotesCombobox
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
