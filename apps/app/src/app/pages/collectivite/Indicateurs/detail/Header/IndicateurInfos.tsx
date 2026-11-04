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
} from './IndicateurPilotes';

type Props = {
  indicateur: IndicateurDetaille;
  isPerso: boolean;
  composeSansAgregation: boolean;
  isReadonly: boolean;
};

export const hasIndicateurInfos = ({
  indicateur,
  isPerso,
  composeSansAgregation,
  isReadonly,
}: Props): boolean => {
  const { participationScore, hasOpenData } = indicateur;
  const pilotes = indicateur.pilotes ?? [];
  const services = indicateur.services ?? [];
  return (
    !isReadonly ||
    !composeSansAgregation ||
    pilotes.length > 0 ||
    services.length > 0 ||
    Boolean(participationScore) ||
    (!composeSansAgregation && (isPerso || Boolean(hasOpenData)))
  );
};

export const IndicateurInfos = ({
  indicateur,
  isPerso,
  composeSansAgregation,
  isReadonly,
}: Props) => {
  const { participationScore, hasOpenData } = indicateur;

  const showPilotes = !isReadonly || (indicateur.pilotes ?? []).length > 0;
  const showServices = !isReadonly || (indicateur.services ?? []).length > 0;
  const showBadges = !composeSansAgregation && (isPerso || hasOpenData);

  const items: ReactNode[] = [
    !composeSansAgregation && (
      <IndicateurPeriodiciteBadge
        periodicite={indicateur.periodicite}
        participationScore={Boolean(participationScore)}
      />
    ),
    showPilotes && (
      <IndicateurPilotes indicateur={indicateur} isReadonly={isReadonly} />
    ),
    showServices && (
      <IndicateurServicesPilotes
        indicateur={indicateur}
        isReadonly={isReadonly}
      />
    ),
    participationScore && <span>{appLabels.indicateurParticipeAuScore}</span>,
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
