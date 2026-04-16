import { Membre } from '@/app/collectivites/membres/list-membres/use-list-membres';
import { appLabels } from '@/app/labels/catalog';
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
import { useLinkMembreToPersonneTag } from '../use-link-membre-to-personne-tag';
import { Tag, useListPersonneTags } from '../../tags/use-list-personne-tags';

type Props = {
  openState: OpenState;
  collectiviteId: number;
  user: Membre;
};

const LinkMembreToPersonneTagModal = ({
  openState,
  collectiviteId,
  user,
}: Props) => {
  const [selectedTags, setSelectedTags] = useState<OptionValue[] | undefined>();

  const { data: tags, isLoading: isLoadingTags } = useListPersonneTags();

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

  const { mutate: linkTag } = useLinkMembreToPersonneTag();

  const options = (filteredTags ?? []).map((t: Tag) => ({
    value: t.tagId,
    label: t.tagNom,
  }));

  return (
    <Modal
      openState={openState}
      title={appLabels.associerCompteTag}
      subTitle={`${user.prenom} ${user.nom} ${user.email}`}
      render={() => (
        <>
          <Alert description={appLabels.associerCompteTagDescription} />
          <Field title={appLabels.associerCompteTagChamp}>
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
          disabled={!selectedTags || selectedTags.length === 0 || !user.userId}
          onClick={() => {
            if (selectedTags && selectedTags.length > 0 && user.userId)
              linkTag({
                userId: user.userId,
                tagIds: selectedTags as number[],
                collectiviteId,
              });
            close();
          }}
          className="ml-auto"
        >
          {appLabels.valider}
        </Button>
      )}
    />
  );
};

export default LinkMembreToPersonneTagModal;
