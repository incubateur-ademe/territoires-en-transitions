import { isEqual } from 'es-toolkit';
import { useState } from 'react';

import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import ServiceTagDropdown from '@/app/collectivites/tags/service-tag.dropdown';
import { appLabels } from '@/app/labels/catalog';
import {
  useDeleteMesurePilotes,
  useUpsertMesurePilotes,
} from '@/app/referentiels/actions/use-mesure-pilotes';
import {
  useDeleteMesureServicesPilotes,
  useUpsertMesureServicesPilotes,
} from '@/app/referentiels/actions/use-mesure-services-pilotes';
import { useCollectiviteId } from '@tet/api/collectivites';
import { PersonneTagOrUser, Tag } from '@tet/domain/collectivites';
import { Field, Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';

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

  const { mutate: upsertPilotes } = useUpsertMesurePilotes();
  const { mutate: deletePilotes } = useDeleteMesurePilotes();

  const { mutate: upsertServicesPilotes } = useUpsertMesureServicesPilotes();
  const { mutate: deleteServicesPilotes } = useDeleteMesureServicesPilotes();

  const [editedPilotes, setEditedPilotes] = useState<
    PersonneTagOrUser[] | undefined
  >(pilotes);

  const [editedServices, setEditedServices] = useState<Tag[] | undefined>(
    services
  );

  const handleSave = () => {
    if (
      !isEqual(
        pilotes?.map((p) => getPersonneStringId(p)),
        editedPilotes?.map((p) => getPersonneStringId(p))
      )
    ) {
      if (editedPilotes?.length === 0) {
        deletePilotes({ collectiviteId, mesureId: actionId });
      } else {
        upsertPilotes({
          collectiviteId,
          mesureId: actionId,
          pilotes: (editedPilotes ?? []).map((pilote) => ({
            tagId: pilote.tagId ?? undefined,
            userId: pilote.userId ?? undefined,
          })),
        });
      }
    }

    if (
      !isEqual(
        services?.map((s) => s.id),
        editedServices?.map((s) => s.id)
      )
    ) {
      if (editedServices?.length === 0) {
        deleteServicesPilotes({ collectiviteId, mesureId: actionId });
      } else {
        upsertServicesPilotes({
          collectiviteId,
          mesureId: actionId,
          services: (editedServices ?? []).map((s) => ({ serviceTagId: s.id })),
        });
      }
    }
  };

  return (
    <Modal
      openState={openState}
      title={appLabels.modifierAction}
      subTitle={actionTitle}
      render={() => (
        <>
          <Field title="Personne pilote" className="col-span-2">
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
