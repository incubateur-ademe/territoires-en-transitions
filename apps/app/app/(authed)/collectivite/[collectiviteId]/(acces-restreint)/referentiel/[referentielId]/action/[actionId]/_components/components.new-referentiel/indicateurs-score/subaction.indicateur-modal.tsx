import { IndicateurReferenceOutput } from '@/app/app/pages/collectivite/Indicateurs/data/use-indicateur-reference';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import Markdown from '@/app/ui/Markdown';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, cn, Modal, ModalFooter, Tab, Tabs } from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { OpenState } from '@tet/ui/utils/types';
import { SubactionIndicateurModalResultats } from './subaction.indicateur-modal-resultats';

type Props = {
  openState: OpenState;
  action: ActionListItem;
  titre: string;
  unite: string;
  reference: NonNullable<IndicateurReferenceOutput>;
};

export const SubactionIndicateurModal = ({
  openState,
  action,
  titre,
  unite,
  reference,
}: Props) => {
  const { collectiviteId, hasReferentielPermission } = useCurrentCollectivite();
  const referentielId = useReferentielId();

  const canEditReferentiel = hasReferentielPermission(
    'referentiels.mutate',
    referentielId
  );

  const indicateurURL = makeCollectiviteIndicateursUrl({
    collectiviteId,
    indicateurView: getIndicateurGroup(reference.identifiantReferentiel),
    indicateurId: reference.indicateurId,
    identifiantReferentiel: reference.identifiantReferentiel,
  });

  return (
    <Modal
      openState={openState}
      size="md"
      title={`${titre} (${unite})`}
      render={() => (
        <Tabs>
          {canEditReferentiel ? (
            <Tab
              label={capitalize(appLabels.indicateurResultat({ plural: true }))}
            >
              <SubactionIndicateurModalResultats reference={reference} />
            </Tab>
          ) : undefined}
          <Tab label={capitalize(appLabels.description())}>
            <Markdown
              className="mb-2 [&>*]:mb-2 [&>*]:text-sm [&>*]:text-primary-9"
              content={
                action.description?.trim()
                  ? action.description.replaceAll('\n', '\n\n')
                  : appLabels.cetteSectionEstVide
              }
              openLinksInNewTab
            />
          </Tab>
          <Tab label={appLabels.methodeCalcul}>
            <Markdown
              className="mb-2 [&>*]:mb-2 [&>*]:text-sm [&>*]:text-primary-9"
              content={
                action.exemples?.trim()
                  ? action.exemples.replaceAll('\n', '\n\n')
                  : appLabels.cetteSectionEstVide
              }
              openLinksInNewTab
            />
          </Tab>
        </Tabs>
      )}
      renderFooter={({ close }) => (
        <ModalFooter variant="space">
          <Button
            className={cn(!canEditReferentiel && 'ml-auto')}
            variant="outlined"
            size="xs"
            href={indicateurURL}
            external
          >
            {appLabels.voirFicheIndicateur}
          </Button>
          {canEditReferentiel && (
            <div className="flex gap-2">
              <Button variant="outlined" size="xs" onClick={close}>
                {appLabels.annuler}
              </Button>
              <Button variant="primary" size="xs" onClick={() => null}>
                {appLabels.valider}
              </Button>
            </div>
          )}
        </ModalFooter>
      )}
    />
  );
};
