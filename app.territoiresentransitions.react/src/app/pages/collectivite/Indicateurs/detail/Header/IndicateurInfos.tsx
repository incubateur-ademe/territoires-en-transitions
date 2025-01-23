import { referentielToName } from '@/app/app/labels';
import { useServicesPilotesListe } from '@/app/ui/dropdownLists/ServicesPilotesDropdown/useServicesPilotesListe';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { Divider, Icon } from '@/ui';
import { format } from 'date-fns';
import { useState } from 'react';
import { useIndicateurPilotes } from '../../Indicateur/detail/useIndicateurPilotes';
import { useIndicateurServices } from '../../Indicateur/detail/useIndicateurServices';
import BadgeIndicateurPerso from '../../components/BadgeIndicateurPerso';
import BadgeOpenData from '../../components/BadgeOpenData';
import { TIndicateurDefinition } from '../../types';
import EditModal from './EditModal';

type Props = {
  collectiviteId: number;
  definition: TIndicateurDefinition;
  isPerso: boolean;
  composeSansAgregation: boolean;
};

const IndicateurInfos = ({
  collectiviteId,
  definition,
  isPerso,
  composeSansAgregation,
}: Props) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { participationScore, hasOpenData, modifiedAt } = definition;

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
    <>
      <div className="flex flex-wrap gap-3 items-center mt-3 mb-4 py-3 text-sm text-grey-8 border-y border-primary-3">
        {/* Infos de modification (date et auteur) */}
        {!!modifiedAt && (
          <span>
            <Icon icon="calendar-2-line" size="sm" className="mr-1" />
            Modifié le {format(new Date(modifiedAt), 'dd/MM/yyyy')}
          </span>
        )}

        {/* Pilotes */}
        {hasPilotes && (
          <>
            {!!modifiedAt && <div className="w-[1px] h-5 bg-grey-5" />}
            <ListWithTooltip
              title="Pilotes"
              list={pilotes.map((p) => p.nom!)}
              icon="user-line"
              hoveringColor="grey"
              onClick={() => setIsEditModalOpen(true)}
            />
          </>
        )}

        {/* Services pilotes */}
        {hasServices && (
          <>
            {(!!modifiedAt || hasPilotes) && (
              <div className="w-[1px] h-5 bg-grey-5" />
            )}
            <ListWithTooltip
              title="Direction ou service pilote"
              list={services.map((s) => s.nom)}
              icon="leaf-line"
              hoveringColor="grey"
              onClick={() => setIsEditModalOpen(true)}
            />
          </>
        )}

        {/* Participe au score CAE */}
        {participationScore && (
          <>
            {(!!modifiedAt || hasPilotes || hasServices) && (
              <div className="w-[1px] h-5 bg-grey-5" />
            )}
            <span>Participe au score {referentielToName.cae}</span>
          </>
        )}

        {/* Badges */}
        {!composeSansAgregation && (
          <>
            {(!!modifiedAt ||
              hasPilotes ||
              hasServices ||
              participationScore) &&
              (isPerso || hasOpenData) && (
                <div className="w-[1px] h-5 bg-grey-5" />
              )}
            {isPerso && <BadgeIndicateurPerso size="sm" />}
            {hasOpenData && <BadgeOpenData size="sm" />}
          </>
        )}
      </div>

      {/* Edition des pilotes et services pilotes */}
      {isEditModalOpen && (
        <EditModal
          openState={{ isOpen: isEditModalOpen, setIsOpen: setIsEditModalOpen }}
          {...{ collectiviteId, definition }}
        />
      )}
    </>
  ) : (
    <Divider className="mt-4 pb-4" />
  );
};

export default IndicateurInfos;
