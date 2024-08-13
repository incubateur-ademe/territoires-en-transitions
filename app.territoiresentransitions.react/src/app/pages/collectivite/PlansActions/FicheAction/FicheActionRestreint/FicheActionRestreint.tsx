import {useState} from 'react';
import classNames from 'classnames';
import {Button, Notification} from '@tet/ui';
import ModaleAcces from './ModaleAcces';
import TooltipRestreint from './TooltipRestreint';

type FicheActionRestreintProps = {
  isReadonly: boolean;
  isRestreint: boolean;
  updateRestreint: (isRestreint: boolean) => void;
};

const FicheActionRestreint = ({
  isReadonly,
  isRestreint,
  updateRestreint,
}: FicheActionRestreintProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <TooltipRestreint isRestreint={isRestreint}>
      <div
        onClick={!isReadonly ? () => setIsModalOpen(true) : undefined}
        className={classNames(
          'relative bg-white border border-grey-3 rounded-lg py-2 px-2.5 h-14 text-sm text-primary-10 font-medium italic flex gap-2 items-center max-md:justify-center',
          {'cursor-pointer hover:bg-primary-2 transition-colors': !isReadonly}
        )}
      >
        <Notification
          icon={isRestreint ? 'lock-fill' : 'group-fill'}
          size="xs"
          classname="h-6 w-8 justify-center"
        />
        <span className="mt-1">
          Cette fiche est en mode{' '}
          <span className="font-extrabold">
            {isRestreint ? 'privé' : 'public'}
          </span>
        </span>
        {!isReadonly && (
          <Button
            title="Modifier la restriction d'accès"
            icon="edit-line"
            size="xs"
            variant="grey"
            className="md:ml-auto max-md:absolute right-3"
            onClick={() => setIsModalOpen(true)}
          />
        )}

        <ModaleAcces
          isOpen={isModalOpen && !isReadonly}
          setIsOpen={setIsModalOpen}
          isRestreint={isRestreint}
          updateRestreint={updateRestreint}
        />
      </div>
    </TooltipRestreint>
  );
};

export default FicheActionRestreint;
