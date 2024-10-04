import { Personne } from '@tet/api/shared/domain';
import { Icon, Tooltip } from '@tet/ui';
import classNames from 'classnames';
import { isBefore, startOfToday } from 'date-fns';
import { Fragment } from 'react';
import { getTextFormattedDate } from '../utils';

type FicheActionFooterInfoProps = {
  pilotes: Personne[] | null | undefined;
  dateDeFin: string | null | undefined;
  ameliorationContinue: boolean | null | undefined;
};

const FicheActionFooterInfo = ({
  pilotes,
  dateDeFin,
  ameliorationContinue,
}: FicheActionFooterInfoProps) => {
  const hasPilotes = !!pilotes && pilotes.length > 0;
  const hasDateDeFin = !!dateDeFin;

  if (!hasPilotes && !hasDateDeFin && !ameliorationContinue) return null;

  const isLate = hasDateDeFin && isBefore(new Date(dateDeFin), startOfToday());

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      {/* Personnes pilote */}
      {hasPilotes && (
        <span title="Pilotes">
          <Icon icon="user-line" size="sm" className="mr-1" />
          {pilotes[0].nom}
          {pilotes.length > 1 && (
            <Tooltip
              openingDelay={250}
              label={
                <ul className="max-w-xs list-disc list-inside">
                  {pilotes.map((pilote, i) => (
                    <li key={i}>{pilote.nom}</li>
                  ))}
                </ul>
              }
            >
              <span className="ml-1.5 font-medium text-primary-8">
                +{pilotes.length - 1}
              </span>
            </Tooltip>
          )}
        </span>
      )}

      {/* Date de fin prévisionnelle */}
      {!!dateDeFin && (
        <Fragment>
          {hasPilotes && <div className="w-[1px] h-4 bg-grey-5" />}
          <span
            title="Échéance"
            className={classNames({ 'text-error-1': isLate })}
          >
            <Icon icon="calendar-line" size="sm" className="mr-1" />
            {getTextFormattedDate({
              date: dateDeFin,
              shortMonth: true,
            })}
          </span>
        </Fragment>
      )}

      {/* Action récurrente */}
      {!hasDateDeFin && ameliorationContinue && (
        <Fragment>
          {hasPilotes && <div className="w-[1px] h-4 bg-grey-5" />}
          <span title="Échéance">
            <Icon icon="loop-left-line" size="sm" className="mr-1" />
            Tous les ans
          </span>
        </Fragment>
      )}
    </div>
  );
};

export default FicheActionFooterInfo;
