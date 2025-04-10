import { isEqual } from 'es-toolkit';
import { useState } from 'react';

import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import {
  useActionPilotesDelete,
  useActionPilotesUpsert,
} from '@/app/referentiels/actions/use-action-pilotes';
import {
  useActionServicesPilotesDelete,
  useActionServicesPilotesUpsert,
} from '@/app/referentiels/actions/use-action-services-pilotes';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import { PersonneTagOrUser, Tag } from '@/domain/collectivites';
import { Field, Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';

type Props = {
  actionId: string;
  actionTitle?: string;
  openState?: OpenState;
  pilotes?: PersonneTagOrUser[];
  services?: Tag[];
};

const ActionEditModal = ({
  actionId,
  actionTitle,
  openState,
  pilotes,
  services,
}: Props) => {
  const collectiviteId = useCollectiviteId();

  const { mutate: upsertPilotes } = useActionPilotesUpsert();
  const { mutate: deletePilotes } = useActionPilotesDelete();

  const { mutate: upsertServicesPilotes } = useActionServicesPilotesUpsert();
  const { mutate: deleteServicesPilotes } = useActionServicesPilotesDelete();

  const [editedPilotes, setEditedPilotes] = useState<
    PersonneTagOrUser[] | undefined
  >(pilotes);

  const [editedServices, setEditedServices] = useState<Tag[] | undefined>(
    services
  );

  const handleSave = () => {
    // Pilotes
    if (
      !isEqual(
        pilotes?.map((p) => getPersonneStringId(p)),
        editedPilotes?.map((p) => getPersonneStringId(p))
      )
    ) {
      if (editedPilotes?.length === 0) {
        deletePilotes({ collectiviteId, actionId });
      } else {
        upsertPilotes({
          collectiviteId,
          actionId,
          pilotes: (editedPilotes ?? []).map((pilote) => ({
            tagId: pilote.tagId ?? undefined,
            userId: pilote.userId ?? undefined,
          })),
        });
      }
    }

    // Services pilotes
    if (
      !isEqual(
        services?.map((s) => s.id),
        editedServices?.map((s) => s.id)
      )
    ) {
      if (editedServices?.length === 0) {
        deleteServicesPilotes({ collectiviteId, actionId });
      } else {
        upsertServicesPilotes({
          collectiviteId,
          actionId,
          services: (editedServices ?? []).map((s) => ({ serviceTagId: s.id })),
        });
      }
    }
  };

  return (
    <Modal
      openState={openState}
      title="Modifier l'action"
      subTitle={actionTitle}
      render={() => (
        <>
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
        </>
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

export default ActionEditModal;
