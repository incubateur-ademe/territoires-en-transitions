import { referentielToName } from '@/app/app/labels';
import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { Divider, Icon } from '@tet/ui';
import classNames from 'classnames';
import { format } from 'date-fns';
import { useState } from 'react';
import BadgeIndicateurPerso from '../../components/BadgeIndicateurPerso';
import BadgeOpenData from '../../components/BadgeOpenData';
import EditModal from './EditModal';

type Props = {
  definition: IndicateurDefinition;
  isPerso: boolean;
  composeSansAgregation: boolean;
  isReadonly: boolean;
  isSticky: boolean;
};

export const IndicateurInfos = ({
  definition,
  isPerso,
  composeSansAgregation,
  isReadonly,
  isSticky,
}: Props) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { participationScore, hasOpenData, modifiedAt, modifiedBy } =
    definition;

  const pilotes = definition.pilotes || [];
  const services = definition.services || [];

  const hasPilotes = pilotes && pilotes.length > 0;
  const hasServices = services && services.length > 0;

  const displayInfo =
    hasPilotes ||
    hasServices ||
    participationScore ||
    (!composeSansAgregation && (isPerso || hasOpenData));

  return displayInfo ? (
    <>
      <div
        className={classNames(
          'flex flex-wrap gap-3 items-center py-3 text-sm text-grey-8 border-y border-primary-3',
          { 'pt-2 pb-0 border-b-0': isSticky }
        )}
      >
        {/* Infos de modification (date et auteur) */}
        {!!modifiedAt && (
          <span>
            <Icon icon="calendar-2-line" size="sm" className="mr-1" />
            Modifié le {format(new Date(modifiedAt), 'dd/MM/yyyy')}{' '}
            {modifiedBy ? `par ${modifiedBy?.prenom} ${modifiedBy?.nom}` : ''}
          </span>
        )}

        {/* Pilotes */}
        {hasPilotes && (
          <>
            {!!modifiedAt && <div className="w-[1px] h-5 bg-grey-5" />}
            <ListWithTooltip
              title="Pilotes"
              list={
                pilotes
                  .map((p) => p.nom)
                  .filter((nom) => Boolean(nom)) as string[]
              }
              icon="user-line"
              hoveringColor="grey"
              onClick={() => setIsEditModalOpen(true)}
              disabled={isReadonly}
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
              icon="briefcase-line"
              hoveringColor="grey"
              onClick={() => setIsEditModalOpen(true)}
              disabled={isReadonly}
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
          {...{ definition }}
        />
      )}
    </>
  ) : (
    !isSticky && <Divider />
  );
};
