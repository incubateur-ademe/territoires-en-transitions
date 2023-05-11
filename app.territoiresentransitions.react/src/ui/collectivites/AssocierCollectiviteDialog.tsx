import {RejoindreOuActiverDialogContent} from 'app/pages/collectivite/RejoindreCetteCollectiviteDialog/RejoindreOuActiverDialogContent';
import {ReferentContact} from 'core-logic/api/procedures/collectiviteProcedures';
import {TNomCollectivite} from 'types/alias';
import React, {useEffect} from 'react';
import {AutocompleteInput} from 'ui/AutocompleteInput';
import {Spacer} from 'ui/dividers/Spacer';
import {UiDialogButton} from 'ui/UiDialogButton';
import {useAllCollectivites} from './useAllCollectivites';

export type TAssocierCollectiviteDialogProps = {
  getReferentContacts: (collectiviteId: number) => Promise<ReferentContact[]>;
};
export const AssocierCollectiviteDialog = ({
  getReferentContacts,
}: TAssocierCollectiviteDialogProps) => {
  const [opened, setOpened] = React.useState(false);
  const [selectedCollectivite, setSelectedCollectivite] =
    React.useState<TNomCollectivite>();
  const allCollectivites = useAllCollectivites();

  useEffect(() => {
    // uniquement à l'ouverture du dialogue
    if (opened) {
      setSelectedCollectivite(undefined);
    }
  }, [opened]);

  return (
    <UiDialogButton
      useFrBtn
      data-test="AssocierCollectivite"
      title="Rejoindre une collectivité"
      dialogClasses="overflow-hidden"
      opened={opened}
      setOpened={setOpened}
    >
      <div className="py-7 min-h-[400px]">
        <div className="flex flex-row justify-center">
          <AutocompleteInput
            label="Nom de la collectivité"
            options={allCollectivites.map(({collectivite_id, nom}) => ({
              value: collectivite_id.toString(),
              label: nom,
            }))}
            onChange={collectiviteId => {
              if (!collectiviteId) {
                setSelectedCollectivite(undefined);
                return;
              }

              const parsedCollectiviteId = parseInt(collectiviteId);
              if (
                parsedCollectiviteId !== selectedCollectivite?.collectivite_id
              ) {
                setSelectedCollectivite(
                  allCollectivites.find(
                    c => c.collectivite_id === parsedCollectiviteId
                  ) || undefined
                );
              }
            }}
          />
        </div>
        <Spacer />
        {selectedCollectivite ? (
          <RejoindreOuActiverDialogContent
            collectivite={selectedCollectivite}
            getReferentContacts={getReferentContacts}
          />
        ) : (
          <p className="fr-text--sm" data-test="no-selection-msg">
            Vous ne trouvez pas la collectivité que vous recherchez ? <br />
            Merci d'envoyer un mail à{' '}
            <a href="mailto:contact@territoiresentransitions.fr">
              contact@territoiresentransitions.fr
            </a>{' '}
            avec le nom et numéro SIREN de cette collectivité pour que nous
            puissions vous aider.
          </p>
        )}
      </div>
    </UiDialogButton>
  );
};
