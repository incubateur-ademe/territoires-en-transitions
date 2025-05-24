import TagsSuiviPersoDropdown from '@/app/ui/dropdownLists/TagsSuiviPersoDropdown/TagsSuiviPersoDropdown';
import { Tag } from '@/domain/collectivites';
import { Button, Event, Field, useEventTracker } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';
import ActionsGroupeesModale from './ActionsGroupeesModale';
import { useFichesActionsBulkEdit } from './useFichesActionsBulkEdit';

type ModaleEditionTagsLibresProps = {
  openState: OpenState;
  selectedIds: number[];
};

const ModaleEditionTagsLibres = ({
  openState,
  selectedIds,
}: ModaleEditionTagsLibresProps) => {
  const [tags, setTags] = useState<Tag[] | null | undefined>();

  const tracker = useEventTracker();

  const mutation = useFichesActionsBulkEdit();

  return (
    <ActionsGroupeesModale
      openState={openState}
      title="Associer des tags personnalisés"
      actionsCount={selectedIds.length}
      onSave={() => {
        tracker(Event.fiches.updateTagsLibresGroupe);
        mutation.mutate({
          ficheIds: selectedIds,
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
  selectedIds: number[];
};

const EditionTagsLibres = ({ selectedIds }: EditionTagsLibresProps) => {
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
          selectedIds={selectedIds}
        />
      )}
    </>
  );
};

export default EditionTagsLibres;
