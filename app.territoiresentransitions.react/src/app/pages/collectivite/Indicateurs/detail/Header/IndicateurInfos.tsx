import { referentielToName } from '@/app/app/labels';
import { useServicesPilotesListe } from '@/app/ui/dropdownLists/ServicesPilotesDropdown/useServicesPilotesListe';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { Divider } from '@/ui';
import { useIndicateurPilotes } from '../../Indicateur/detail/useIndicateurPilotes';
import { useIndicateurServices } from '../../Indicateur/detail/useIndicateurServices';
import BadgeIndicateurPerso from '../../components/BadgeIndicateurPerso';
import BadgeOpenData from '../../components/BadgeOpenData';
import { TIndicateurDefinition } from '../../types';

type Props = {
  definition: TIndicateurDefinition;
  isPerso: boolean;
  composeSansAgregation: boolean;
};

const IndicateurInfos = ({
  definition,
  isPerso,
  composeSansAgregation,
}: Props) => {
  const { participationScore, hasOpenData, enfants, sansValeur } = definition;

  const { data: pilotes } = useIndicateurPilotes(definition.id);
  const { data: serviceIds } = useIndicateurServices(definition.id);
  const { data: servicesList } = useServicesPilotesListe();

  const hasPilotes = pilotes && pilotes.length > 0;
  const hasServices = serviceIds && serviceIds.length > 0;

  const services =
    servicesList?.filter((s) => serviceIds?.includes(s.id)) ?? [];

  const displayInfo =
    hasPilotes ||
    hasServices ||
    participationScore ||
    (!composeSansAgregation && (isPerso || hasOpenData));

  return displayInfo ? (
    <div className="flex flex-wrap gap-3 items-center mt-3 mb-4 py-3 text-sm text-grey-8 border-y border-primary-3">
      {/* Pilotes */}
      {hasPilotes && (
        <ListWithTooltip
          title="Pilotes"
          list={pilotes.map((p) => p.nom!)}
          icon="user-line"
        />
      )}

      {/* Services pilotes */}
      {hasServices && (
        <>
          {hasPilotes && <div className="w-[1px] h-5 bg-grey-5" />}
          <ListWithTooltip
            title="Direction ou service pilote"
            list={services.map((s) => s.nom)}
            icon="leaf-line"
          />
        </>
      )}

      {/* Participe au score CAE */}
      {participationScore && (
        <>
          {(hasPilotes || hasServices) && (
            <div className="w-[1px] h-5 bg-grey-5" />
          )}
          <span>Participe au score {referentielToName.cae}</span>
        </>
      )}

      {/* Badges */}
      {!composeSansAgregation && (
        <>
          {(hasPilotes || participationScore) && (isPerso || hasOpenData) && (
            <div className="w-[1px] h-5 bg-grey-5" />
          )}
          {isPerso && <BadgeIndicateurPerso size="sm" />}
          {hasOpenData && <BadgeOpenData size="sm" />}
        </>
      )}
    </div>
  ) : (
    <Divider className="mt-4 pb-4" />
  );
};

export default IndicateurInfos;
