import { Personne } from '@/api/collectivites';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { TagWithOptionalCollectivite } from '@/domain/collectivites';
import { Icon } from '@/ui';
import classNames from 'classnames';
import { isBefore, startOfToday } from 'date-fns';

type FicheActionFooterInfoProps = {
  pilotes: Personne[] | null | undefined;
  services: TagWithOptionalCollectivite[] | null | undefined;
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
          <ListWithTooltip
            title="Pilotes"
            list={
              pilotes
                .map((p) => p?.nom)
                .filter((nom) => Boolean(nom)) as string[]
            }
            icon="user-line"
          />
        </>
      )}

      {/* Services pilote */}
      {hasServices && (
        <>
          {(hasDateDeFin || ameliorationContinue || hasPilotes) && (
            <div className="w-[0.5px] h-4 bg-grey-5" />
          )}
          <ListWithTooltip
            title="Direction ou service pilote"
            list={services.map((s) => s.nom)}
            icon="leaf-line"
          />
        </>
      )}
    </div>
  );
};

export default FicheActionFooterInfo;
