import { BulkEditRequest } from '@/app/plans/fiches/list-all-fiches/data/use-bulk-fiches-edit';
import StatutsSelectDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsSelectDropdown';
import { RouterInput } from '@tet/api';
import { Button, Event, Field, useEventTracker } from '@tet/ui';
import { useState } from 'react';
import ActionsGroupeesModale from './ActionsGroupeesModale';

type StatusEnumType = RouterInput['plans']['fiches']['bulkEdit']['statut'];

type ModaleEditionStatutProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (input: Pick<BulkEditRequest, 'statut'>) => void;
};

const ModaleEditionStatut = ({
  isOpen,
  onOpenChange,
  onUpdate,
}: ModaleEditionStatutProps) => {
  const [statut, setStatus] = useState<StatusEnumType>();

  const tracker = useEventTracker();

  return (
    <ActionsGroupeesModale
      isOpen={isOpen}
      onOpenChange={onOpenChange}
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
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

export default EditionStatut;
