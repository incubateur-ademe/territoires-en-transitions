import TagsSuiviPersoDropdown from '@/app/ui/dropdownLists/TagsSuiviPersoDropdown/TagsSuiviPersoDropdown';
import { Tag } from '@/domain/collectivites';
import { BulkEditRequest } from '@/domain/plans/fiches';
import { Button, Event, Field, useEventTracker } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';
import ActionsGroupeesModale from './ActionsGroupeesModale';

type ModaleEditionTagsLibresProps = {
  openState: OpenState;
  onUpdate: (input: Pick<BulkEditRequest, 'libreTags'>) => void;
};

const ModaleEditionTagsLibres = ({
  openState,
  onUpdate,
}: ModaleEditionTagsLibresProps) => {
  const [tags, setTags] = useState<Tag[] | null | undefined>();

  const tracker = useEventTracker();

  return (
    <ActionsGroupeesModale
      openState={openState}
      title="Associer des tags personnalisés"
      onSave={() => {
        tracker(Event.fiches.updateTagsLibres.multiple);
        onUpdate({
          libreTags: {
            add: tags?.map((t) => ({ id: t.id })) ?? undefined,
          },
        });
      }}
    >
      <Field title="Tags" className="col-span-2">
        <TagsSuiviPersoDropdown
          values={tags?.map((t) => t.id)}
          onChange={({ libresTag }) => setTags(libresTag)}
        />
      </Field>
    </ActionsGroupeesModale>
  );
};

type EditionTagsLibresProps = {
  onUpdate: (input: Pick<BulkEditRequest, 'libreTags'>) => void;
};

const EditionTagsLibres = ({ onUpdate }: EditionTagsLibresProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        icon="bookmark-line"
        size="xs"
        variant="outlined"
        onClick={() => setIsModalOpen(true)}
      >
        Associer des tags personnalisés
      </Button>
      {isModalOpen && (
        <ModaleEditionTagsLibres
          openState={{ isOpen: isModalOpen, setIsOpen: setIsModalOpen }}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

export default EditionTagsLibres;
