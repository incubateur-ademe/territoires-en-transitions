import {_RejoindreOuActiverDialogContent} from 'app/pages/collectivite/RejoindreCetteCollectiviteDialog/_RejoindreOuActiverDialogContent';
import {ReferentContact} from 'core-logic/api/procedures/collectiviteProcedures';
import {AllCollectiviteRead} from 'generated/dataLayer/all_collectivite_read';
import React from 'react';
import {UiDialogButton} from 'ui/UiDialogButton';

export type TRejoindreCetteCollectiviteDialogProps = {
  getReferentContacts: (collectiviteId: number) => Promise<ReferentContact[]>;
  collectivite: AllCollectiviteRead;
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
        <_RejoindreOuActiverDialogContent
          getReferentContacts={getReferentContacts}
          collectivite={collectivite}
        />
      </UiDialogButton>
    </div>
  );
};
