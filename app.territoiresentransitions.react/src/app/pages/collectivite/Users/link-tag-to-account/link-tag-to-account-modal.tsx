import { useLinkTag } from '@/app/app/pages/collectivite/Users/link-tag-to-account/use-link-tag';
import { Tag } from '@/app/app/pages/collectivite/Users/tags-liste/use-tags-list';
import { useCollectiviteMembres } from '@/app/app/pages/collectivite/Users/useCollectiviteMembres';
import { CurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { Alert, Button, Field, Modal, OptionValue, Select } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';

type Props = {
  openState: OpenState;
  collectivite: CurrentCollectivite;
  tag: Tag;
};

const LinkTagToAccountModal = ({ openState, collectivite, tag }: Props) => {
  const [selectedUser, setSelectedUser] = useState<OptionValue | undefined>();

  const {
    data: { membres },
    isLoading,
  } = useCollectiviteMembres();

  const { mutate: linkTag } = useLinkTag();

  const options = membres
    .filter((m) => !!m.user_id && (!!m.nom || !!m.prenom))
    .map((m) => ({ value: m.user_id!, label: `${m.prenom} ${m.nom}` }));

  return (
    <Modal
      openState={openState}
      title="Associer ce tag à un compte"
      subTitle={tag.tagNom}
      render={() => (
        <>
          <Alert
            rounded
            description="Si vous souhaitez, vous pouvez associer ce tag à un utilisateur inscrit, afin que les fiches actions, indicateurs et mesures des référentiels soient associées à cet utilisateur."
          />
          <Field title="Associer ce tag à un compte utilisateur">
            <Select
              isSearcheable
              options={options}
              isLoading={isLoading}
              values={selectedUser}
              onChange={setSelectedUser}
            />
          </Field>
        </>
      )}
      renderFooter={({ close }) => (
        <Button
          disabled={!selectedUser}
          onClick={() => {
            if (selectedUser)
              linkTag({
                userId: selectedUser as string,
                tagIds: [tag.tagId],
                collectiviteId: collectivite.collectiviteId,
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

export default LinkTagToAccountModal;
