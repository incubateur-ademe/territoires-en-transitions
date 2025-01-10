import { Personne } from '@/api/collectivites';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { Tag } from '@/domain/collectivites';
import { Icon, Tooltip } from '@/ui';
import classNames from 'classnames';
import { isBefore, startOfToday } from 'date-fns';

type FicheActionFooterInfoProps = {
  pilotes: Personne[] | null | undefined;
  services: Tag[] | null | undefined;
  dateDeFin: string | null | undefined;
  ameliorationContinue: boolean | null | undefined;
};

const FicheActionFooterInfo = ({
  pilotes,
  services,
  dateDeFin,
  ameliorationContinue,
}: FicheActionFooterInfoProps) => {
  const hasPilotes = !!pilotes && pilotes.length > 0;
  const hasServices = !!services && services.length > 0;
  const hasDateDeFin = !!dateDeFin;

  const isLate = hasDateDeFin && isBefore(new Date(dateDeFin), startOfToday());

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-primary-10 min-h-5">
      {/* Date de fin prévisionnelle */}
      {!!dateDeFin && (
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
      )}

      {/* Action récurrente */}
      {!hasDateDeFin && ameliorationContinue && (
        <span title="Échéance">
          <Icon icon="loop-left-line" size="sm" className="mr-1" />
          Tous les ans
        </span>
      )}

      {/* Personnes pilote */}
      {hasPilotes && (
        <>
          {(hasDateDeFin || ameliorationContinue) && (
            <div className="w-[0.5px] h-4 bg-grey-5" />
          )}
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
        </>
      )}

      {/* Services pilote */}
      {hasServices && (
        <>
          {(hasDateDeFin || ameliorationContinue || hasPilotes) && (
            <div className="w-[0.5px] h-4 bg-grey-5" />
          )}{' '}
          <span title="Direction ou service pilote">
            <Icon icon="leaf-line" size="sm" className="mr-1" />
            {services[0].nom}
            {services.length > 1 && (
              <Tooltip
                openingDelay={250}
                label={
                  <ul className="max-w-xs list-disc list-inside">
                    {services.map((service, i) => (
                      <li key={i}>{service.nom}</li>
                    ))}
                  </ul>
                }
              >
                <span className="ml-1.5 font-medium text-primary-8">
                  +{services.length - 1}
                </span>
              </Tooltip>
            )}
          </span>
        </>
      )}
    </div>
  );
};

export default FicheActionFooterInfo;
