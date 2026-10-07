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
import { useState } from 'react';

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

  /**
   * L'état ne retient que la saisie en cours : tant qu'on n'a rien modifié, il
   * vaut `undefined` et les champs affichent la définition. Deux effets la
   * recopiaient dans l'état à chaque rendu — et comme `definition.pilotes || []`
   * fabrique un tableau neuf quand la valeur est nulle, ils se redéclenchaient
   * en boucle.
   */
  const pilotesAffiches = editedPilotes ?? pilotes;
  const servicesAffiches = editedServices ?? services;

  const handleSave = () => {
    if (!isEqual(pilotesAffiches, pilotes)) {
      updateIndicateur({
        pilotes: pilotesAffiches,
      });
    }

    if (
      !isEqual(
        servicesAffiches.map((s) => s.id),
        services
      )
    ) {
      updateIndicateur({
        services: servicesAffiches,
      });
    }
  };

  return (
    <Modal
      dataTest="IndicateurEditModal"
      openState={openState}
      title={appLabels.modifierIndicateur}
      subTitle={definition.titre}
      render={() => (
        <FormSectionGrid>
          {/* Personnes pilote */}
          <Field title={appLabels.personnePilote()} className="col-span-2">
            <PersonneTagDropdown
              values={pilotesAffiches.map((p) => getPersonneStringId(p))}
              onChange={({ personnes }) => {
                setEditedPilotes(personnes);
              }}
            />
          </Field>

          {/* Directions ou services pilote */}
          <Field
            title={appLabels.directionOuServicePilote()}
            className="col-span-2"
          >
            <ServiceTagDropdown
              values={servicesAffiches.map((s) => s.id)}
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
