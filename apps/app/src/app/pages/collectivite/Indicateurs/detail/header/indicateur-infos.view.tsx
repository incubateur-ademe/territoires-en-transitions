import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { appLabels } from '@/app/labels/catalog';
import { IndicateurPeriodiciteBadge } from '@/app/indicateurs/valeurs/indicateur-periodicite.badge';
import { MetadataLine, MetadataSeparator } from '@/app/ui/metadata-line';
import { Fragment, ReactNode } from 'react';
import BadgeIndicateurPerso from '../../components/BadgeIndicateurPerso';
import BadgeOpenData from '../../components/BadgeOpenData';
import {
  IndicateurPilotes,
  IndicateurServicesPilotes,
} from './indicateur-pilotes.view';

type Props = {
  indicateur: IndicateurDetaille;
  isPerso: boolean;
  isComposeSansAgregation: boolean;
  isReadonly: boolean;
};

type InfosVisibility = {
  showPeriodicite: boolean;
  showPilotes: boolean;
  showServices: boolean;
  showParticipationScore: boolean;
  showBadges: boolean;
};

export const getInfosVisibility = ({
  indicateur,
  isPerso,
  isComposeSansAgregation,
  isReadonly,
}: Props): InfosVisibility => ({
  showPeriodicite: !isComposeSansAgregation,
  showPilotes: !isReadonly || (indicateur.pilotes ?? []).length > 0,
  showServices: !isReadonly || (indicateur.services ?? []).length > 0,
  showParticipationScore: Boolean(indicateur.participationScore),
  showBadges:
    !isComposeSansAgregation && (isPerso || Boolean(indicateur.hasOpenData)),
});

export const hasIndicateurInfos = (props: Props): boolean =>
  Object.values(getInfosVisibility(props)).some(Boolean);

export const IndicateurInfos = (props: Props) => {
  const { indicateur, isPerso, isReadonly } = props;
  const { hasOpenData } = indicateur;
  const {
    showPeriodicite,
    showPilotes,
    showServices,
    showParticipationScore,
    showBadges,
  } = getInfosVisibility(props);

  const items: ReactNode[] = [
    showPeriodicite && (
      <IndicateurPeriodiciteBadge
        periodicite={indicateur.periodicite}
        participationScore={showParticipationScore}
      />
    ),
    showPilotes && <IndicateurPilotes isReadonly={isReadonly} />,
    showServices && <IndicateurServicesPilotes isReadonly={isReadonly} />,
    showParticipationScore && (
      <span>{appLabels.indicateurParticipeAuScore}</span>
    ),
    showBadges && (
      <>
        {isPerso && <BadgeIndicateurPerso />}
        {hasOpenData && <BadgeOpenData />}
      </>
    ),
  ].filter(Boolean);

  return (
    <MetadataLine>
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && <MetadataSeparator />}
          {item}
        </Fragment>
      ))}
    </MetadataLine>
  );
};
