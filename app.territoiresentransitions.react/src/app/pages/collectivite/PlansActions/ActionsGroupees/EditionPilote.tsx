import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import { PersonneTagOrUser } from '@/domain/collectivites';
import { Button, Field, useEventTracker } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';
import ActionsGroupeesModale from './ActionsGroupeesModale';
import { useFichesActionsBulkEdit } from './useFichesActionsBulkEdit';

type ModaleEditionPiloteProps = {
  openState: OpenState;
  selectedIds: number[];
};

const ModaleEditionPilote = ({
  openState,
  selectedIds,
}: ModaleEditionPiloteProps) => {
  const [pilotesToAdd, setPilotesToAdd] = useState<
    PersonneTagOrUser[] | undefined
  >();
  const [pilotesToRemove, setPilotesToRemove] = useState<
    PersonneTagOrUser[] | undefined
  >();

  const { collectiviteId, niveauAcces, role } = useCurrentCollectivite()!;
  const tracker = useEventTracker('app/actions-groupees-fiches-action');

  const mutation = useFichesActionsBulkEdit();

  return (
    <ActionsGroupeesModale
      openState={openState}
      title="Éditer la personne pilote"
      actionsCount={selectedIds.length}
      onSave={() => {
        tracker('editer_personne_pilote_groupe', {
          collectiviteId,
          niveauAcces,
          role,
        });
        mutation.mutate({
          ficheIds: selectedIds,
          pilotes: {
            add: pilotesToAdd?.map((p) => ({
              tagId: p.tagId,
              userId: p.userId,
            })),
            remove: pilotesToRemove?.map((p) => ({
              tagId: p.tagId,
              userId: p.userId,
            })),
          },
        });
      }}
    >
      <>
        <Field title="Ajouter une personne pilote" className="col-span-2">
          <PersonnesDropdown
            values={pilotesToAdd?.map((p) => getPersonneStringId(p))}
            placeholder="Sélectionnez ou créez un pilote"
            onChange={({ personnes }) => setPilotesToAdd(personnes)}
          />
        </Field>
        <Field title="Dissocier une personne pilote" className="col-span-2">
          <PersonnesDropdown
            disableEdition
            values={pilotesToRemove?.map((p) => getPersonneStringId(p))}
            placeholder="Sélectionnez un ou plusieurs pilotes"
            onChange={({ personnes }) => setPilotesToRemove(personnes)}
          />
        </Field>
      </>
    </ActionsGroupeesModale>
  );
};

type EditionPiloteProps = {
  selectedIds: number[];
};

const EditionPilote = ({ selectedIds }: EditionPiloteProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button icon="user-line" size="xs" onClick={() => setIsModalOpen(true)}>
        Éditer la personne pilote
      </Button>
      {isModalOpen && (
        <ModaleEditionPilote
          openState={{ isOpen: isModalOpen, setIsOpen: setIsModalOpen }}
          selectedIds={selectedIds}
        />
      )}
    </>
  );
};

export default EditionPilote;
