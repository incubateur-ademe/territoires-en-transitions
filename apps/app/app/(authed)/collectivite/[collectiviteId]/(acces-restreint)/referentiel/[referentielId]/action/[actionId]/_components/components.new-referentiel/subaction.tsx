import { ActionStatutDropdownWithDetailleButton } from '@/app/referentiels/actions/action-statut-with-detaille-button.dropdown';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ColorVariant } from '@tet/design-tokens';
import { ActionAdaptationNiveau } from '@tet/domain/referentiels';
import { Badge, Card, cn, Icon, Tooltip, useStickyHeaderHeight } from '@tet/ui';
import { useEffect } from 'react';
import { ActionExplicationField } from '../action-explication.field';
import { useActionSidePanel } from '../side-panel/context';
import { InformationsSidePanelButton } from '../side-panel/informations.button';
import { hasActionInformationsSections } from '../side-panel/informations.config';
import { SubactionCommentsButton } from './subaction-comments.button';
import { SubactionScoreIndicatifList } from './subaction-score-indicatif';

type Props = {
  subAction: ActionListItem;
};

type AdaptationNiveauConfig = {
  label: string;
  question: string;
  badgeVariant: ColorVariant;
};
const adaptationNiveauToConfig: Partial<
  Record<ActionAdaptationNiveau, AdaptationNiveauConfig>
> = {
  exposition_forte: {
    label:
      "La sous-mesure est fortement exposée au changement climatique. Il s'agit d'une contrainte structurante qui doit être prise en compte dès la phase de conception et tout au long de sa mise en œuvre. La contrainte climatique influence directement les objectifs, les méthodes et les résultats attendus de la sous-mesure, voire sa pertinence.",
    question:
      'Les enjeux climatiques du territoire ont-ils été explicitement pris en compte dans la définition des objectifs et du contenu de cette sous-mesure ? Comment les enjeux ont-ils été pris en compte ?',
    badgeVariant: 'error',
  },
  exposition_partielle: {
    label:
      "La sous-mesure est partiellement concernée par le changement climatique. Il s'agit d'un risque externe à surveiller qui peut affecter les résultats de la sous-mesure. Ses hypothèses de base pourraient être remises en cause par les évolutions du climat. Une vigilance active est requise pour garantir la robustesse des résultats.",
    question:
      'A-t-on vérifié que les hypothèses sur lesquelles repose cette action resteront valides dans un contexte climatique évolutif ?',
    badgeVariant: 'warning',
  },
};

export const Subaction = ({ subAction }: Props) => {
  const { hasCollectivitePermission } = useCurrentCollectivite();

  const canReadComments = hasCollectivitePermission(
    'referentiels.discussions.read'
  );

  const { activeActionId } = useActionSidePanel();

  const active = activeActionId === subAction.actionId;

  const adaptationNiveauConfig =
    subAction.adaptationNiveau &&
    adaptationNiveauToConfig[subAction.adaptationNiveau];

  useEffect(() => {
    if (active) {
      requestAnimationFrame(() => {
        document
          .getElementById(subAction.actionId)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [active, subAction.actionId]);

  const stickyHeaderHeight = useStickyHeaderHeight();

  return (
    <Card
      id={subAction.actionId}
      className={cn('p-6', { 'border border-primary-7': active })}
      style={{ scrollMarginTop: stickyHeaderHeight + 16 }}
    >
      <div
        data-test={`SousActionHeader-${subAction.identifiant}`}
        className="max-sm:flex-col-reverse gap-6 flex items-baseline justify-between"
      >
        <span className="text-lg">
          {subAction.identifiant} {subAction.nom}
        </span>
        {subAction.adaptationNiveau && adaptationNiveauConfig && (
          <Tooltip
            label={
              <div className="flex flex-col gap-4 w-fit max-w-sm p-1 font-normal">
                <span className="!text-sm">{adaptationNiveauConfig.label}</span>
                <div className="p-3 bg-info-2 rounded-md [&_*]:!text-sm text-info-1">
                  <div className="flex items-baseline gap-2">
                    <Icon icon="information-line" />
                    <span>{adaptationNiveauConfig.question}</span>
                  </div>
                </div>
              </div>
            }
          >
            <Badge
              size="xs"
              variant={adaptationNiveauConfig.badgeVariant}
              title="adaptation"
              icon="information-line"
              iconPosition="left"
            />
          </Tooltip>
        )}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-4 justify-between">
        <div className="flex items-center gap-2">
          <ActionStatutDropdownWithDetailleButton
            action={subAction}
            disabledDetailleALaTache
          />
          <ScoreRatioBadge action={subAction} size="xs" className="shrink-0" />
          <ScoreProgressBar
            action={subAction}
            className="w-[16rem]"
            valuePosition="left"
          />
        </div>
        <div className="flex items-center gap-2">
          {hasActionInformationsSections(subAction) && (
            <InformationsSidePanelButton
              targetActionId={subAction.actionId}
              openedSections={['description', 'exemples']}
            />
          )}
          {canReadComments && <SubactionCommentsButton subAction={subAction} />}
        </div>
      </div>
      <SubactionScoreIndicatifList subAction={subAction} />
      <ActionExplicationField action={subAction} />
    </Card>
  );
};
