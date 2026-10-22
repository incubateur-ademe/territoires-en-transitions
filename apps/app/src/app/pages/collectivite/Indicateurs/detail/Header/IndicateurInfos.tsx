import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { appLabels } from '@/app/labels/catalog';
import { IndicateurPeriodiciteBadge } from '@/app/indicateurs/valeurs/indicateur-periodicite.badge';
import { cn, Icon } from '@tet/ui';
import { format } from 'date-fns';
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
    Boolean(definition.modifiedAt) ||
    pilotes.length > 0 ||
    services.length > 0 ||
    Boolean(participationScore) ||
    (!composeSansAgregation && (isPerso || Boolean(hasOpenData)))
  );
};

const Separator = () => <div className="w-[1px] h-5 bg-grey-5" />;

export const IndicateurInfos = ({
  definition,
  isPerso,
  composeSansAgregation,
  isReadonly,
}: Props) => {
  const { participationScore, hasOpenData, modifiedAt, modifiedBy } =
    definition;

  const showPilotes = !isReadonly || (definition.pilotes ?? []).length > 0;
  const showServices = !isReadonly || (definition.services ?? []).length > 0;
  const showBadges = !composeSansAgregation && (isPerso || hasOpenData);

  const items: ReactNode[] = [
    !!modifiedAt && (
      <span>
        <Icon icon="calendar-2-line" size="sm" className="mr-1" />
        {appLabels.indicateurModifieLeLabel}{' '}
        {format(new Date(modifiedAt), 'dd/MM/yyyy')}{' '}
        {modifiedBy
          ? appLabels.parPrenomNom({
              prenom: modifiedBy?.prenom,
              nom: modifiedBy?.nom,
            })
          : ''}
      </span>
    ),
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
    <div
      className={cn(
        'flex flex-wrap gap-3 items-center py-3 text-sm text-grey-8'
      )}
    >
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && <Separator />}
          {item}
        </Fragment>
      ))}
    </div>
  );
};
