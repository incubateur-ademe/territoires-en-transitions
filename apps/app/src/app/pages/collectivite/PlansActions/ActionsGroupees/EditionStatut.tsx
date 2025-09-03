import { RouterInput } from '@/api/utils/trpc/client';
import StatutsSelectDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsSelectDropdown';
import { BulkEditRequest } from '@/domain/plans/fiches';
import { Button, Event, Field, useEventTracker } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';
import ActionsGroupeesModale from './ActionsGroupeesModale';

type StatusEnumType = RouterInput['plans']['fiches']['bulkEdit']['statut'];

type ModaleEditionStatutProps = {
  openState: OpenState;
  onUpdate: (input: Pick<BulkEditRequest, 'statut'>) => void;
};

const ModaleEditionStatut = ({
  openState,
  onUpdate,
}: ModaleEditionStatutProps) => {
  const [statut, setStatus] = useState<StatusEnumType>();

  const tracker = useEventTracker();

  return (
    <ActionsGroupeesModale
      openState={openState}
      title="Associer un statut"
      onSave={() => {
        tracker(Event.fiches.updateStatut.multiple);
        onUpdate({
          statut,
        });
      }}
    >
      <Field title="Statut" className="col-span-2">
        <StatutsSelectDropdown
          values={statut}
          onChange={(statut) => setStatus((statut as StatusEnumType) ?? null)}
        />
      </Field>
    </ActionsGroupeesModale>
  );
};

type EditionStatutProps = {
  onUpdate: (input: Pick<BulkEditRequest, 'statut'>) => void;
};

const EditionStatut = ({ onUpdate }: EditionStatutProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        icon="stop-circle-line"
        size="xs"
        onClick={() => setIsModalOpen(true)}
      >
        Associer un statut
      </Button>
      {isModalOpen && (
        <ModaleEditionStatut
          openState={{ isOpen: isModalOpen, setIsOpen: setIsModalOpen }}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

export default EditionStatut;
