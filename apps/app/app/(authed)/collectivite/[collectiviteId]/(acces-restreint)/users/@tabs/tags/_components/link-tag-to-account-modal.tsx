import { useMembres } from '@/app/referentiels/tableau-de-bord/referents/useMembres';
import { Alert, Button, Field, Modal, OptionValue, Select } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';
import { useLinkTag } from '../../../_components/use-link-tag';
import { Tag } from '../../../_components/use-list-tags';

type Props = {
  openState: OpenState;
  collectiviteId: number;
  tag: Tag;
};

const LinkTagToAccountModal = ({ openState, collectiviteId, tag }: Props) => {
  const [selectedUser, setSelectedUser] = useState<OptionValue | undefined>();

  const { data: membresResponse, isLoading } = useMembres({ collectiviteId });
  const membres = membresResponse?.data;

  const { mutate: linkTag } = useLinkTag();

  if (!membres) return null;

  const options = membres
    .filter((m) => !!m.userId && (!!m.nom || !!m.prenom))
    .map((m) => ({ value: m.userId, label: `${m.prenom} ${m.nom}` }));

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
