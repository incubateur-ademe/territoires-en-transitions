import { referentielToName } from '@/app/app/labels';
import { Divider, Icon, Tooltip } from '@/ui';
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

  const hasPilotes = pilotes && pilotes.length > 0;
  const hasServices = serviceIds && serviceIds.length > 0;

  const displayInfo =
    hasPilotes || hasServices || participationScore || !composeSansAgregation;

  return displayInfo ? (
    <div className="flex max-md:flex-col gap-3 items-center mt-3 mb-4 py-3 text-sm text-grey-8 border-y border-primary-3">
      {/* Pilotes */}
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

      {/* Participe au score CAE */}
      {participationScore && (
        <>
          {hasPilotes && (
            <div className="max-md:hidden w-[1px] h-5 bg-grey-5" />
          )}
          <span>Participe au score {referentielToName.cae}</span>
        </>
      )}

      {/* Badges */}
      {!composeSansAgregation && (
        <>
          {(hasPilotes || participationScore) && (isPerso || hasOpenData) && (
            <div className="max-md:hidden w-[1px] h-5 bg-grey-5" />
          )}
          {isPerso && <BadgeIndicateurPerso size="sm" />}
          {hasOpenData && <BadgeOpenData size="sm" />}
        </>
      )}
    </div>
  ) : (
    <Divider className="mt-4" />
  );
};

export default IndicateurInfos;
