import { RouterInput } from '@/api/utils/trpc/client';
import StatutsSelectDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsSelectDropdown';
import { Button, Event, Field, useEventTracker } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';
import ActionsGroupeesModale from './ActionsGroupeesModale';
import { useFichesActionsBulkEdit } from './useFichesActionsBulkEdit';

type StatusEnumType = RouterInput['plans']['fiches']['bulkEdit']['statut'];

type ModaleEditionStatutProps = {
  openState: OpenState;
  selectedIds: number[];
};

const ModaleEditionStatut = ({
  openState,
  selectedIds,
}: ModaleEditionStatutProps) => {
  const [status, setStatus] = useState<StatusEnumType>();

  const tracker = useEventTracker();

  const mutation = useFichesActionsBulkEdit();

  return (
    <ActionsGroupeesModale
      openState={openState}
      title="Associer un statut"
      actionsCount={selectedIds.length}
      onSave={() => {
        tracker(Event.fiches.updateStatutGroupe);
        mutation.mutate({
          ficheIds: selectedIds,
          statut: status,
        });
      }}
    >
      <Field title="Statut" className="col-span-2">
        <StatutsSelectDropdown
          values={status}
          onChange={(statut) => setStatus((statut as StatusEnumType) ?? null)}
        />
      </Field>
    </ActionsGroupeesModale>
  );
};

type EditionStatutProps = {
  selectedIds: number[];
};

const EditionStatut = ({ selectedIds }: EditionStatutProps) => {
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
          selectedIds={selectedIds}
        />
      )}
    </>
  );
};

export default EditionStatut;
