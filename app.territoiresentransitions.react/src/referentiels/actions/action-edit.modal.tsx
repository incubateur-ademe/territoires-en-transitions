import { useState } from 'react';
import { isEqual } from 'es-toolkit';

import { Personne } from '@/api/collectivites';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import { Tag } from '@/domain/collectivites';
import { Field, Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { ActionDetailed } from '@/app/referentiels/use-snapshot';
import {
  useActionPilotesList,
  useActionPilotesUpsert,
  useActionPilotesDelete,
} from '@/app/referentiels/actions/use-action-pilotes';
import {
  useActionServicesPilotesList,
  useActionServicesPilotesUpsert,
  useActionServicesPilotesDelete,
} from '@/app/referentiels/actions/use-action-services-pilotes';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';

type Props = {
  action: ActionDetailed;
  openState?: OpenState;
};

const ActionEditModal = ({ action, openState }: Props) => {
  const collectiviteId = useCollectiviteId();

  const { data: pilotes } = useActionPilotesList(action.actionId);
  const { mutate: upsertPilotes } = useActionPilotesUpsert();
  const { mutate: deletePilotes } = useActionPilotesDelete();

  const { data: services } = useActionServicesPilotesList(action.actionId);
  const { mutate: upsertServicesPilotes } = useActionServicesPilotesUpsert();
  const { mutate: deleteServicesPilotes } = useActionServicesPilotesDelete();

  const [editedPilotes, setEditedPilotes] = useState<Personne[] | undefined>(
    pilotes
  );

  const [editedServices, setEditedServices] = useState<Tag[] | undefined>(
    services?.map((s) => ({
      id: s.serviceTagId,
      nom: s.nom ?? '',
      collectiviteId: s.collectiviteId,
    }))
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
        deletePilotes({
          collectiviteId,
          actionId: action.actionId,
        });
      } else {
        upsertPilotes({
          collectiviteId,
          actionId: action.actionId,
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
        services?.map((s) => s.serviceTagId),
        editedServices?.map((s) => s.id)
      )
    ) {
      if (editedServices?.length === 0) {
        deleteServicesPilotes({
          collectiviteId,
          actionId: action.actionId,
        });
      } else {
        upsertServicesPilotes({
          collectiviteId,
          actionId: action.actionId,
          services: (editedServices ?? []).map((s) => ({ serviceTagId: s.id })),
        });
      }
    }
  };

  return (
    <Modal
      openState={openState}
      title="Modifier l'action"
      subTitle={`${action.identifiant} ${action.nom}`}
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
