import { NiveauPriorite } from '@tet/api/plan-actions';
import { Button, Field, useEventTracker } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useState } from 'react';
import PrioritesSelectDropdown from 'ui/dropdownLists/ficheAction/priorites/PrioritesSelectDropdown';
import ActionsGroupeesModale from './ActionsGroupeesModale';
import { useFichesActionsBulkEdit } from './useFichesActionsBulkEdit';

type ModaleEditionPrioriteProps = {
  openState: OpenState;
  selectedIds: number[];
};

const ModaleEditionPriorite = ({
  openState,
  selectedIds,
}: ModaleEditionPrioriteProps) => {
  const [priorite, setPriorite] = useState<NiveauPriorite>();

  const collectiviteId = useCollectiviteId()!;
  const tracker = useEventTracker('app/actions-groupees-fiches-action');

  const mutation = useFichesActionsBulkEdit();

  return (
    <ActionsGroupeesModale
      openState={openState}
      title="Associer un niveau de priorité"
      actionsCount={selectedIds.length}
      onSave={() => {
        tracker('associer_priorite_groupe', {
          collectivite_id: collectiviteId,
        });
        mutation.mutate({
          ficheIds: selectedIds,
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
  selectedIds: number[];
};

const EditionPriorite = ({ selectedIds }: EditionPrioriteProps) => {
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
          selectedIds={selectedIds}
        />
      )}
    </>
  );
};

export default EditionPriorite;
