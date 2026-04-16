import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { appLabels } from '@/app/labels/catalog';
import { BulkEditRequest } from '@/app/plans/fiches/list-all-fiches/data/use-bulk-fiches-edit';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import { Button, Event, Field, useEventTracker } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
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
      title={appLabels.editionPiloteTitre}
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
        <Field title={appLabels.editionAjouterPilote} className="col-span-2">
          <PersonneTagDropdown
            values={pilotesToAdd?.map((p) => getPersonneStringId(p))}
            placeholder={appLabels.selectionnerOuCreerPilote}
            onChange={({ personnes }) => setPilotesToAdd(personnes)}
          />
        </Field>
        <Field title={appLabels.editionDissocierPilote} className="col-span-2">
          <PersonneTagDropdown
            disableEdition
            values={pilotesToRemove?.map((p) => getPersonneStringId(p))}
            placeholder={appLabels.placeholderSelectionnezPlusieursPilotes}
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
        {appLabels.editionPiloteTitre}
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
