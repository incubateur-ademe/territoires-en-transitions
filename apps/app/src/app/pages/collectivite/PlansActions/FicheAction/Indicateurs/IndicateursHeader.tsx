import { FicheWithRelations } from '@/domain/plans/fiches';
import { htmlToText } from '@/domain/utils';
import { Badge, Button, RichTextEditor } from '@/ui';
import { cn } from '@/ui/utils/cn';
import { useState } from 'react';
import ModaleIndicateursHeader from './ModaleIndicateursHeader';

type IndicateursHeaderProps = {
  isReadonly: boolean;
  fiche: FicheWithRelations;
};

const IndicateursHeader = ({ isReadonly, fiche }: IndicateursHeaderProps) => {
  const [isFullObjectifs, setIsFullObjectifs] = useState(false);

  const { objectifs, effetsAttendus } = fiche;

  const isObjectifsTruncated = htmlToText(objectifs ?? '').length > 1000;

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
        {objectifs ? (
          <>
            <RichTextEditor
              disabled
              className={cn('border-none !text-sm !p-0 min-h-4', {
                'max-h-[8rem] overflow-hidden': !isFullObjectifs,
              })}
              initialValue={objectifs}
            />
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
          </>
        ) : (
          <span className="text-sm text-grey-7">Non renseignés</span>
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
