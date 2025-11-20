import { Membre } from '@/app/app/pages/collectivite/Users/types';
import {
  Alert,
  Button,
  Field,
  Modal,
  OptionValue,
  SelectMultiple,
} from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import { useLinkTag } from '../../_components/use-link-tag';
import { Tag, useListTags } from '../../_components/use-list-tags';

type Props = {
  openState: OpenState;
  collectiviteId: number;
  user: Membre;
};

const LinkAccountToTagModal = ({ openState, collectiviteId, user }: Props) => {
  const [selectedTags, setSelectedTags] = useState<OptionValue[] | undefined>();

  const { data: tags, isLoading: isLoadingTags } = useListTags(collectiviteId);

  const sortedTags: Tag[] | undefined = tags?.sort((a: Tag, b: Tag) => {
    const nameA = a.tagNom.toUpperCase();
    const nameB = b.tagNom.toUpperCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });

  const filteredTags: Tag[] = (sortedTags ?? []).filter(
    (tag: Tag) => !tag.email
  );

  const { mutate: linkTag } = useLinkTag();

  const options = (filteredTags ?? []).map((t: Tag) => ({
    value: t.tagId,
    label: t.tagNom,
  }));

  return (
    <Modal
      openState={openState}
      title="Associer ce compte utilisateur à un tag"
      subTitle={`${user.prenom} ${user.nom} ${user.email}`}
      render={() => (
        <>
          <Alert
            rounded
            description="Vous pouvez associer ce compte utilisateur à un ou plusieurs tags afin que les fiches actions, indicateurs et mesures des référentiels soient associés à cet utilisateur."
          />
          <Field title="Associer ce compte utilisateur à un ou plusieurs tags">
            <SelectMultiple
              options={options}
              values={selectedTags}
              onChange={({ values }) => setSelectedTags(values)}
              isLoading={isLoadingTags}
            />
          </Field>
        </>
      )}
      renderFooter={({ close }) => (
        <Button
          disabled={!selectedTags || selectedTags.length === 0 || !user.user_id}
          onClick={() => {
            if (selectedTags && selectedTags.length > 0 && user.user_id)
              linkTag({
                userId: user.user_id,
                tagIds: selectedTags as number[],
                collectiviteId,
              });
            close();
          }}
          className="ml-auto"
        >
          Valider
        </Button>
      )}
    />
  );
};

export default LinkAccountToTagModal;
