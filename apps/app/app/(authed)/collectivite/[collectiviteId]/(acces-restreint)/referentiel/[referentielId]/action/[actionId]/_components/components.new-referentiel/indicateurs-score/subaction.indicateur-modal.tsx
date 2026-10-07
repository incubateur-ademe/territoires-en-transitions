import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { useGetIndicateur } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { appLabels } from '@/app/labels/catalog';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import Markdown from '@/app/ui/Markdown';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { CalculScoreIndicatif } from '@tet/domain/referentiels';
import { Button, cn, Modal, ModalFooter, Tab, Tabs } from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { OpenState } from '@tet/ui/utils/types';
import { useGetValeursUtilisables } from '../../score-indicatif/use-get-valeurs-utilisables';
import { SubactionIndicateurModalResultats } from './subaction.indicateur-modal-resultats';

type Props = {
  openState: OpenState;
  action: ActionListItem;
  titre: string;
  unite: string;
  indicateurId: number;
  identifiantReferentiel: string;
  calcul: CalculScoreIndicatif | null;
};

export const SubactionIndicateurModal = ({
  openState,
  action,
  titre,
  unite,
  indicateurId,
  identifiantReferentiel,
  calcul,
}: Props) => {
  const { collectiviteId, hasReferentielPermission } = useCurrentCollectivite();
  const referentielId = useReferentielId();

  const canEditReferentiel = hasReferentielPermission(
    'referentiels.mutate',
    referentielId
  );

  const { data: valeursUtilisables } = useGetValeursUtilisables(
    action.actionId,
    indicateurId
  );
  const hasValeurUtilisable = (valeursUtilisables?.sources ?? []).some(
    (source) => source.fait.length > 0
  );

  const { data: indicateurDefinition } = useGetIndicateur(
    indicateurId,
    collectiviteId
  );

  const indicateurURL = makeCollectiviteIndicateursUrl({
    collectiviteId,
    indicateurView: getIndicateurGroup(identifiantReferentiel),
    indicateurId,
    identifiantReferentiel,
  });

  return (
    <Modal
      openState={openState}
      size="md"
      title={`${titre} (${unite})`}
      render={() => (
        <Tabs size="sm">
          {canEditReferentiel ? (
            <Tab
              label={capitalize(appLabels.indicateurResultat({ plural: true }))}
              icon="line-chart-line"
            >
              <SubactionIndicateurModalResultats
                action={action}
                unite={unite}
                indicateurId={indicateurId}
                calcul={calcul}
              />
            </Tab>
          ) : undefined}
          <Tab
            label={capitalize(appLabels.description())}
            icon="information-line"
          >
            <Markdown
              className="mb-2 [&>*]:mb-2 [&>*]:text-sm [&>*]:text-primary-9"
              content={
                indicateurDefinition?.description?.trim()
                  ? indicateurDefinition.description.replaceAll('\n', '\n\n')
                  : appLabels.cetteSectionEstVide
              }
              openLinksInNewTab
            />
          </Tab>
          <Tab label={appLabels.methodeCalcul} icon="filter-line">
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
      renderFooter={() => (
        <ModalFooter variant="space">
          <Button
            className={cn(!canEditReferentiel && 'ml-auto')}
            variant={
              canEditReferentiel && !hasValeurUtilisable
                ? 'primary'
                : 'outlined'
            }
            size="xs"
            href={indicateurURL}
            external
          >
            {canEditReferentiel
              ? hasValeurUtilisable
                ? appLabels.indicateurAjouterOuModifierResultat
                : appLabels.indicateurAjouterResultat
              : appLabels.voirFicheIndicateur}
          </Button>
        </ModalFooter>
      )}
    />
  );
};
