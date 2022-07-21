import {_RejoindreOuActiverDialogContent} from 'app/pages/MesCollectivites/_RejoindreOuActiverDialogContent';
import {allCollectiviteReadEndpoint} from 'core-logic/api/endpoints/CollectiviteReadEndpoints';
import {ReferentContact} from 'core-logic/api/procedures/collectiviteProcedures';
import {AllCollectiviteRead} from 'generated/dataLayer/all_collectivite_read';
import React, {useEffect, useState} from 'react';
import {AutocompleteInput} from 'ui/AutocompleteInput';
import {Spacer} from 'ui/shared/Spacer';
import {UiDialogButton} from 'ui/UiDialogButton';

export type TAssocierCollectiviteDialogProps = {
  getReferentContacts: (collectiviteId: number) => Promise<ReferentContact[]>;
};
export const AssocierCollectiviteDialog = ({
  getReferentContacts,
}: TAssocierCollectiviteDialogProps) => {
  const [opened, setOpened] = React.useState<boolean>(false);
  const [allCollectiviteReads, setAllCollectiviteReads] = useState<
    AllCollectiviteRead[]
  >([]);

  useEffect(() => {
    allCollectiviteReadEndpoint
      .getBy({})
      .then(data => setAllCollectiviteReads(data));
  }, []);

  const [selectedCollectivite, setSelectedCollectivite] =
    React.useState<AllCollectiviteRead>();

  useEffect(() => {
    // uniquement à l'ouverture du dialogue
    if (opened) {
      setSelectedCollectivite(undefined);
    }
  }, [opened]);

  return (
    <UiDialogButton
      useFrBtn
      data-test="btn-select-collectivite"
      title="Associer une collectivité à mon compte"
      buttonClasses="fr-btn"
      buttonWrapperClasses="w-full"
      dialogClasses="overflow-hidden"
      opened={opened}
      setOpened={setOpened}
    >
      <div data-test="collectivite-picker" className="py-7 min-h-[400px]">
        <div className="flex flex-row justify-center">
          <AutocompleteInput
            label="Nom de la collectivité"
            options={allCollectiviteReads.map(
              (collectiviteRead: AllCollectiviteRead) => {
                return {
                  value: collectiviteRead.collectivite_id.toString(),
                  label: collectiviteRead.nom,
                };
              }
            )}
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
                  allCollectiviteReads.find(
                    c => c.collectivite_id === parsedCollectiviteId
                  )
                );
              }
            }}
          />
        </div>
        <Spacer />
        {selectedCollectivite ? (
          <_RejoindreOuActiverDialogContent
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
