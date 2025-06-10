import { FicheWithRelations } from '@/domain/plans/fiches';
import { Button, Notification } from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';
import ModaleAcces from './ModaleAcces';
import TooltipRestreint from './TooltipRestreint';

export const getFicheActionShareIcon = (
  fiche: Pick<FicheWithRelations, 'sharedByOtherCollectivite'>
) => {
  return fiche.sharedByOtherCollectivite ? 'share-forward-fill' : 'team-fill';
};

export const getFicheActionShareText = (
  fiche: Pick<
    FicheWithRelations,
    'sharedByOtherCollectivite' | 'collectiviteNom' | 'sharedWithCollectivites'
  >
) => {
  return fiche.sharedByOtherCollectivite ? (
    <span>
      Cette fiche vous est partagée en édition par la collectivité{' '}
      <span className="font-extrabold">{fiche.collectiviteNom}</span>
    </span>
  ) : (
    <span>
      Cette fiche est partagée en édition avec{' '}
      <span className="font-extrabold">
        {fiche.sharedWithCollectivites?.length === 1
          ? 'une collectivité'
          : `${fiche.sharedWithCollectivites?.length || 0} collectivités`}
      </span>
    </span>
  );
};

type FicheActionAccesProps = {
  isReadonly: boolean;
  fiche: Pick<
    FicheWithRelations,
    | 'titre'
    | 'sharedWithCollectivites'
    | 'collectiviteId'
    | 'collectiviteNom'
    | 'restreint'
    | 'sharedByOtherCollectivite'
  >;
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
            {sharedWithCollectivites && sharedWithCollectivites.length > 0 ? (
              <div className="flex items-start gap-2">
                <Notification
                  variant="success"
                  icon={getFicheActionShareIcon(fiche)}
                  size="xs"
                  classname="h-6 w-8 justify-center"
                />
                {getFicheActionShareText(fiche)}
              </div>
            ) : null}
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
