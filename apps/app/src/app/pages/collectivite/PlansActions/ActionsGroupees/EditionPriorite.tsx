import { BulkEditRequest } from '@/app/plans/fiches/list-all-fiches/data/use-bulk-fiches-edit';
import PrioritesSelectDropdown from '@/app/ui/dropdownLists/ficheAction/priorites/PrioritesSelectDropdown';
import { Priorite } from '@/domain/plans';
import { Button, Event, Field, useEventTracker } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';
import ActionsGroupeesModale from './ActionsGroupeesModale';

type ModaleEditionPrioriteProps = {
  openState: OpenState;
  onUpdate: (input: Pick<BulkEditRequest, 'priorite'>) => void;
};

const ModaleEditionPriorite = ({
  openState,
  onUpdate,
}: ModaleEditionPrioriteProps) => {
  const [priorite, setPriorite] = useState<Priorite>();

  const tracker = useEventTracker();

  return (
    <ActionsGroupeesModale
      openState={openState}
      title="Associer un niveau de priorité"
      onSave={() => {
        tracker(Event.fiches.updatePriorite.multiple);
        onUpdate({
          priorite,
        });
      }}
    >
      <Field title="Niveau de priorité" className="col-span-2">
        <PrioritesSelectDropdown
          values={priorite}
          onChange={(priorite) => setPriorite(priorite ?? null)}
        />
      </Field>
    </ActionsGroupeesModale>
  );
};

type EditionPrioriteProps = {
  onUpdate: (input: Pick<BulkEditRequest, 'priorite'>) => void;
};

const EditionPriorite = ({ onUpdate }: EditionPrioriteProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        icon="stairs-line"
        size="xs"
        variant="outlined"
        onClick={() => setIsModalOpen(true)}
      >
        Associer un niveau de priorité
      </Button>
      {isModalOpen && (
        <ModaleEditionPriorite
          openState={{ isOpen: isModalOpen, setIsOpen: setIsModalOpen }}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

export default EditionPriorite;
