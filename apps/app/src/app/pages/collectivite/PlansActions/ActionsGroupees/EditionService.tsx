import { BulkEditRequest } from '@/app/plans/fiches/list-all-fiches/data/use-bulk-fiches-edit';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
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
      title="Éditer la direction ou service pilote"
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
          title="Ajouter une direction ou service pilote"
          className="col-span-2"
        >
          <ServicesPilotesDropdown
            values={servicesToAdd?.map((s) => s.id)}
            placeholder="Sélectionnez ou créez une direction ou service pilote"
            onChange={({ services }) => setServicesToAdd(services)}
          />
        </Field>
        <Field
          title="Dissocier une direction ou service pilote"
          className="col-span-2"
        >
          <ServicesPilotesDropdown
            disableEdition
            values={servicesToRemove?.map((s) => s.id)}
            placeholder="Sélectionnez une ou plusieurs directions ou services pilotes"
            onChange={({ services }) => setServicesToRemove(services)}
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
        Éditer la direction pilote
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
