import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
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
  definition: IndicateurDefinition;
  isPerso: boolean;
  composeSansAgregation: boolean;
  isReadonly: boolean;
};

export const hasIndicateurInfos = ({
  definition,
  isPerso,
  composeSansAgregation,
  isReadonly,
}: Props): boolean => {
  const { participationScore, hasOpenData } = definition;
  const pilotes = definition.pilotes ?? [];
  const services = definition.services ?? [];
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
  definition,
  isPerso,
  composeSansAgregation,
  isReadonly,
}: Props) => {
  const { participationScore, hasOpenData } = definition;

  const showPilotes = !isReadonly || (definition.pilotes ?? []).length > 0;
  const showServices = !isReadonly || (definition.services ?? []).length > 0;
  const showBadges = !composeSansAgregation && (isPerso || hasOpenData);

  const items: ReactNode[] = [
    !composeSansAgregation && (
      <IndicateurPeriodiciteBadge
        periodicite={definition.periodicite}
        participationScore={Boolean(participationScore)}
      />
    ),
    showPilotes && (
      <IndicateurPilotes definition={definition} isReadonly={isReadonly} />
    ),
    showServices && (
      <IndicateurServicesPilotes
        definition={definition}
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
