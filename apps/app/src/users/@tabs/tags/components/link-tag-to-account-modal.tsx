import { useCollectiviteMembres } from '@/app/app/pages/collectivite/Users/useCollectiviteMembres';
import { Alert, Button, Field, Modal, OptionValue, Select } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';
import { useLinkTag } from '../../../components/use-link-tag';
import { Tag } from '../../../components/use-list-tags';

type Props = {
  openState: OpenState;
  collectiviteId: number;
  tag: Tag;
};

const LinkTagToAccountModal = ({ openState, collectiviteId, tag }: Props) => {
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
            description="Vous pouvez associer ce tag à un utilisateur déjà inscrit. Ainsi, toutes les fiches actions, indicateurs et mesures des référentiels seront automatiquement attribués à cette personne."
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

export default LinkTagToAccountModal;
