import ServiceTagDropdown from '@/app/collectivites/tags/service-tag.dropdown';
import { appLabels } from '@/app/labels/catalog';
import { BulkEditRequest } from '@/app/plans/fiches/list-all-fiches/data/use-bulk-fiches-edit';
import { TagWithCollectiviteId } from '@tet/domain/collectivites';
import { Button, Event, Field, useEventTracker } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import ActionsGroupeesModale from './ActionsGroupeesModale';

type ModaleEditionServiceProps = {
  openState: OpenState;
  onUpdate: (input: Pick<BulkEditRequest, 'services'>) => void;
};

const ModaleEditionService = ({
  openState,
  onUpdate,
}: ModaleEditionServiceProps) => {
  const [servicesToAdd, setServicesToAdd] = useState<
    TagWithCollectiviteId[] | undefined
  >();
  const [servicesToRemove, setServicesToRemove] = useState<
    TagWithCollectiviteId[] | undefined
  >();

  const tracker = useEventTracker();

  return (
    <ActionsGroupeesModale
      openState={openState}
      title={appLabels.directionOuServicePiloteEditer}
      onSave={() => {
        tracker(Event.fiches.updateService.multiple);
        onUpdate({
          services: {
            add: servicesToAdd?.map((s) => ({ id: s.id })),
            remove: servicesToRemove?.map((s) => ({ id: s.id })),
          },
        });
      }}
    >
      <>
        <Field
          title={appLabels.directionOuServicePiloteAjouter}
          className="col-span-2"
        >
          <ServiceTagDropdown
            values={servicesToAdd?.map((s) => s.id)}
            onChange={({ values: services }) => setServicesToAdd(services)}
          />
        </Field>
        <Field
          title={appLabels.directionOuServicePiloteDissocier}
          className="col-span-2"
        >
          <ServiceTagDropdown
            disableEdition
            values={servicesToRemove?.map((s) => s.id)}
            onChange={({ values: services }) => setServicesToRemove(services)}
          />
        </Field>
      </>
    </ActionsGroupeesModale>
  );
};

type EditionServiceProps = {
  onUpdate: (input: Pick<BulkEditRequest, 'services'>) => void;
};

const EditionService = ({ onUpdate }: EditionServiceProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        icon="briefcase-line"
        size="xs"
        variant="outlined"
        onClick={() => setIsModalOpen(true)}
      >
        {appLabels.directionOuServicePiloteEditer}
      </Button>
      {isModalOpen && (
        <ModaleEditionService
          openState={{ isOpen: isModalOpen, setIsOpen: setIsModalOpen }}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

export default EditionService;
