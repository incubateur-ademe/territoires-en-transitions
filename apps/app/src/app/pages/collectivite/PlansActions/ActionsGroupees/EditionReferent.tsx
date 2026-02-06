import { BulkEditRequest } from '@/app/plans/fiches/list-all-fiches/data/use-bulk-fiches-edit';
import FranceIcon from '@/app/plans/plans/components/france-icon.svg';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
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
      title="Éditer l'élu·e référent·e"
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
        <Field title="Ajouter un·e élu·e référent·e" className="col-span-2">
          <PersonnesDropdown
            values={referentsToAdd?.map((r) => getPersonneStringId(r))}
            placeholder="Sélectionnez ou créez un·e élu·e référent·e"
            onChange={({ personnes }) => setReferentsToAdd(personnes)}
          />
        </Field>
        <Field title="Dissocier un·e élu·e référent·e" className="col-span-2">
          <PersonnesDropdown
            disableEdition
            values={referentsToRemove?.map((r) => getPersonneStringId(r))}
            placeholder="Sélectionnez un ou plusieurs élu·e·s référent·e·s"
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
        {"Éditer l'élu·e référent·e"}
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
