import FicheShareInfoDiv from '@/app/plans/fiches/share-fiche/fiche-share-info';
import { FicheWithRelations } from '@tet/domain/plans';
import { Button, Notification } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import ModaleAcces from './ModaleAcces';
import TooltipRestreint from './TooltipRestreint';

type FicheActionAccesProps = {
  isReadonly: boolean;
  fiche: FicheWithRelations;
  onUpdateAccess: (
    params: Pick<FicheWithRelations, 'restreint' | 'sharedWithCollectivites'>
  ) => void;
};

const FicheActionAcces = ({
  isReadonly,
  fiche,
  onUpdateAccess,
}: FicheActionAccesProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { sharedWithCollectivites, restreint } = fiche;
  const isRestreint = restreint ?? false;

  return (
    <TooltipRestreint isRestreint={isRestreint}>
      <div
        onClick={!isReadonly ? () => setIsModalOpen(true) : undefined}
        className={classNames(
          'relative bg-white border border-grey-3 rounded-lg py-6 px-6 text-sm text-primary-10 font-medium flex gap-2 items-center max-md:justify-center',
          {
            'cursor-pointer hover:bg-primary-2 transition-colors': !isReadonly,
          },
          {
            'h-18': !sharedWithCollectivites?.length,
          },
          {
            'h-30':
              sharedWithCollectivites && sharedWithCollectivites.length > 0,
          }
        )}
      >
        <span className="w-full flex flex-col gap-2">
          <span className="flex justify-between items-center">
            <h6 className="text-sm leading-4 text-primary-9 uppercase mb-2">
              Gestion des droits d&apos;accès :
            </h6>
            {!isReadonly && (
              <Button
                data-test="acces-fiche"
                title="Modifier les droits d'accès"
                icon="edit-line"
                size="xs"
                variant="grey"
                onClick={() => setIsModalOpen(true)}
              />
            )}
          </span>
          <span className="flex flex-col gap-3 italic">
            <div className="flex items-start gap-2">
              <Notification
                icon={isRestreint ? 'lock-fill' : 'group-fill'}
                size="xs"
                classname="h-6 w-8 justify-center"
              />
              <span>
                Cette fiche est en mode{' '}
                <span className="font-extrabold">
                  {isRestreint ? 'privé' : 'public'}
                </span>
              </span>
            </div>
            <FicheShareInfoDiv fiche={fiche} />
          </span>
        </span>

        <ModaleAcces
          isOpen={isModalOpen && !isReadonly}
          setIsOpen={setIsModalOpen}
          fiche={fiche}
          onUpdateAccess={onUpdateAccess}
        />
      </div>
    </TooltipRestreint>
  );
};

export default FicheActionAcces;
