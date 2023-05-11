import {ReferentContact} from 'core-logic/api/procedures/collectiviteProcedures';
import {TNomCollectivite} from 'types/alias';
import {RejoindreOuActiverDialogContent} from './RejoindreOuActiverDialogContent';
import React from 'react';
import {UiDialogButton} from 'ui/UiDialogButton';

export type TRejoindreCetteCollectiviteDialogProps = {
  getReferentContacts: (collectiviteId: number) => Promise<ReferentContact[]>;
  collectivite: TNomCollectivite;
};

export const RejoindreCetteCollectiviteDialog = ({
  getReferentContacts,
  collectivite,
}: TRejoindreCetteCollectiviteDialogProps) => {
  const [opened, setOpened] = React.useState<boolean>(false);

  return (
    <div className="bg-white">
      <UiDialogButton
        title="Rejoindre cette collectivité"
        opened={opened}
        setOpened={setOpened}
        buttonClasses="fr-btn--secondary fr-btn--sm"
        data-test="RejoindreCetteCollectivite"
      >
        <RejoindreOuActiverDialogContent
          getReferentContacts={getReferentContacts}
          collectivite={collectivite}
        />
      </UiDialogButton>
    </div>
  );
};
