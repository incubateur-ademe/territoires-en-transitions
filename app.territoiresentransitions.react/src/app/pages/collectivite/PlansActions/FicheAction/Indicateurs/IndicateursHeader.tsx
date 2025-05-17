import { getTruncatedText } from '@/app/utils/formatUtils';
import { FicheWithRelations } from '@/domain/plans/fiches';
import { Badge, Button } from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';
import ModaleIndicateursHeader from './ModaleIndicateursHeader';

type IndicateursHeaderProps = {
  isReadonly: boolean;
  fiche: FicheWithRelations;
};

const IndicateursHeader = ({
  isReadonly,
  fiche,
}: IndicateursHeaderProps) => {
  const [isFullObjectifs, setIsFullObjectifs] = useState(false);

  const { objectifs, effetsAttendus } = fiche;

  const {
    truncatedText: truncatedObjectifs,
    isTextTruncated: isObjectifsTruncated,
  } = getTruncatedText(objectifs ?? '', 1000);

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Titre et bouton d'édition */}
      <div className="flex justify-between">
        <h5 className="text-primary-8 mb-0">Indicateurs de suivi</h5>
        {!isReadonly && (
          <>
            <Button
              title="Modifier les informations"
              icon="edit-line"
              size="xs"
              variant="grey"
              onClick={() => setIsModalOpen(true)}
            />
            {isModalOpen && (
              <ModaleIndicateursHeader
                fiche={fiche}
                openState={{
                  isOpen: isModalOpen,
                  setIsOpen: setIsModalOpen,
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Objectifs */}
      <div>
        <span className="uppercase text-primary-9 text-sm font-bold leading-6 mr-3">
          Objectifs :
        </span>
        <span
          className={classNames('text-sm leading-6 whitespace-pre-wrap', {
            'text-primary-10': objectifs && objectifs.length,
            'text-grey-7': !objectifs || !objectifs.length,
          })}
        >
          {objectifs && objectifs?.length
            ? isFullObjectifs || !isObjectifsTruncated
              ? objectifs
              : truncatedObjectifs
            : 'Non renseignés'}
        </span>
        {isObjectifsTruncated && (
          <Button
            variant="underlined"
            size="xs"
            className="ml-auto"
            onClick={() => setIsFullObjectifs((prevState) => !prevState)}
          >
            {isFullObjectifs ? 'Voir moins' : 'Voir plus'}
          </Button>
        )}
      </div>

      {/* Effets attendus */}
      <div className="flex gap-x-3 gap-y-2 flex-wrap">
        <span className="uppercase text-primary-9 text-sm font-bold leading-7">
          Effets attendus :
        </span>
        {effetsAttendus && effetsAttendus.length ? (
          effetsAttendus.map((res) => (
            <Badge
              key={res.nom}
              title={res.nom}
              state="standard"
              uppercase={false}
            />
          ))
        ) : (
          <span className="text-sm text-grey-7 leading-7">Non renseignés</span>
        )}
      </div>
    </>
  );
};

export default IndicateursHeader;
