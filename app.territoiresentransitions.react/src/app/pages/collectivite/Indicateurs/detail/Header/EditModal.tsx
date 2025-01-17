import { Personne } from '@/api/collectivites';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import { Tag } from '@/domain/collectivites';
import {
  Button,
  Field,
  FormSectionGrid,
  Modal,
  ModalFooterOKCancel,
} from '@/ui';
import { isEqual } from 'es-toolkit';
import { useState } from 'react';
import { objectToCamel } from 'ts-case-convert';
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
  collectiviteId: number;
  definition: TIndicateurDefinition;
  isLoading?: boolean;
};

const EditModal = ({ collectiviteId, definition, isLoading }: Props) => {
  const [editedPilotes, setEditedPilotes] = useState<Personne[] | undefined>();
  const [editedServices, setEditedServices] = useState<Tag[] | undefined>();

  const { data: pilotes } = useIndicateurPilotes(definition.id);
  const { data: serviceIds } = useIndicateurServices(definition.id);

  // fonctions de mise à jour des données
  const { mutate: upsertIndicateurPilote } = useUpsertIndicateurPilote(
    definition.id
  );
  const { mutate: upsertIndicateurServicePilote } = useUpsertIndicateurServices(
    definition.id
  );

  const handleSave = () => {
    if (!isEqual(editedPilotes, pilotes)) {
      upsertIndicateurPilote(
        (editedPilotes ?? []).map((pilote) => ({
          collectiviteId: collectiviteId,
          tagId: pilote.tagId,
          userId: pilote.userId,
        }))
      );
    }

    if (
      !isEqual(
        editedServices?.map((s) => s.id),
        serviceIds
      ) &&
      !!editedServices
    ) {
      upsertIndicateurServicePilote(objectToCamel(editedServices));
    }
  };

  return (
    <Modal
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
    >
      {/* Bouton d'ouverture de la modale */}
      <Button
        disabled={isLoading}
        title="Modifier l'indicateur"
        aria-label="Modifier l'indicateur"
        size="xs"
        variant="grey"
        onClick={() => {
          setEditedPilotes(pilotes);
          setEditedServices(
            serviceIds?.map((s) => ({ nom: '', id: s, collectiviteId: 0 }))
          );
        }}
      >
        Modifier
      </Button>
    </Modal>
  );
};

export default EditModal;
