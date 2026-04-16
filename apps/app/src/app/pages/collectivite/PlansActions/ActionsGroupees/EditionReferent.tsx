import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { appLabels } from '@/app/labels/catalog';
import { BulkEditRequest } from '@/app/plans/fiches/list-all-fiches/data/use-bulk-fiches-edit';
import FranceIcon from '@/app/plans/plans/components/france-icon.svg';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import { Button, Event, Field, useEventTracker } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import ActionsGroupeesModale from './ActionsGroupeesModale';

type ModaleEditionReferentProps = {
  openState: OpenState;
  onUpdate: (input: Pick<BulkEditRequest, 'referents'>) => void;
};

const ModaleEditionReferent = ({
  openState,
  onUpdate,
}: ModaleEditionReferentProps) => {
  const [referentsToAdd, setReferentsToAdd] = useState<
    PersonneTagOrUser[] | undefined
  >();
  const [referentsToRemove, setReferentsToRemove] = useState<
    PersonneTagOrUser[] | undefined
  >();

  const tracker = useEventTracker();

  return (
    <ActionsGroupeesModale
      openState={openState}
      title={appLabels.editionReferentTitre}
      onSave={() => {
        tracker(Event.fiches.updateReferent.multiple);
        onUpdate({
          referents: {
            add: referentsToAdd?.map((r) => ({
              tagId: r.tagId,
              userId: r.userId,
            })),
            remove: referentsToRemove?.map((r) => ({
              tagId: r.tagId,
              userId: r.userId,
            })),
          },
        });
      }}
    >
      <>
        <Field title={appLabels.editionAjouterReferent} className="col-span-2">
          <PersonneTagDropdown
            values={referentsToAdd?.map((r) => getPersonneStringId(r))}
            placeholder={appLabels.placeholderSelectionnezEluReferent}
            onChange={({ personnes }) => setReferentsToAdd(personnes)}
          />
        </Field>
        <Field
          title={appLabels.editionDissocierReferent}
          className="col-span-2"
        >
          <PersonneTagDropdown
            disableEdition
            values={referentsToRemove?.map((r) => getPersonneStringId(r))}
            placeholder={appLabels.placeholderSelectionnezPlusieursEluReferent}
            onChange={({ personnes }) => setReferentsToRemove(personnes)}
          />
        </Field>
      </>
    </ActionsGroupeesModale>
  );
};

type EditionReferentProps = {
  onUpdate: (input: Pick<BulkEditRequest, 'referents'>) => void;
};

const EditionReferent = ({ onUpdate }: EditionReferentProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        icon={<FranceIcon />}
        size="xs"
        variant="outlined"
        onClick={() => setIsModalOpen(true)}
      >
        {appLabels.editionReferentTitre}
      </Button>
      {isModalOpen && (
        <ModaleEditionReferent
          openState={{ isOpen: isModalOpen, setIsOpen: setIsModalOpen }}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

export default EditionReferent;
