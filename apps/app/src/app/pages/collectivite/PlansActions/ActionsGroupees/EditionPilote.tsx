import { BulkEditRequest } from '@/app/plans/fiches/list-all-fiches/data/use-bulk-fiches-edit';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import { PersonneTagOrUser } from '@/domain/collectivites';
import { Button, Event, Field, useEventTracker } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';
import ActionsGroupeesModale from './ActionsGroupeesModale';

type ModaleEditionPiloteProps = {
  openState: OpenState;
  onUpdate: (input: Pick<BulkEditRequest, 'pilotes'>) => void;
};

const ModaleEditionPilote = ({
  openState,
  onUpdate,
}: ModaleEditionPiloteProps) => {
  const [pilotesToAdd, setPilotesToAdd] = useState<
    PersonneTagOrUser[] | undefined
  >();
  const [pilotesToRemove, setPilotesToRemove] = useState<
    PersonneTagOrUser[] | undefined
  >();

  const tracker = useEventTracker();

  return (
    <ActionsGroupeesModale
      openState={openState}
      title="Éditer la personne pilote"
      onSave={() => {
        tracker(Event.fiches.updatePilote.multiple);
        onUpdate({
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
  onUpdate: (input: Pick<BulkEditRequest, 'pilotes'>) => void;
};

const EditionPilote = ({ onUpdate }: EditionPiloteProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button icon="user-line" size="xs" onClick={() => setIsModalOpen(true)}>
        Éditer la personne pilote
      </Button>
      {isModalOpen && (
        <ModaleEditionPilote
          openState={{ isOpen: isModalOpen, setIsOpen: setIsModalOpen }}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

export default EditionPilote;
