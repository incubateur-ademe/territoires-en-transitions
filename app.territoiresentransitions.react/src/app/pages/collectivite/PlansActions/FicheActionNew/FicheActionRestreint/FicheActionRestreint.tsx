import {Button, Notification} from '@tet/ui';
import {useState} from 'react';
import RestreintModal from './RestreintModal';

type FicheActionRestreintProps = {
  isRestreint: boolean;
  updateRestreint: (isRestreint: boolean) => void;
};

const FicheActionRestreint = ({
  isRestreint,
  updateRestreint,
}: FicheActionRestreintProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div
      onClick={() => setIsModalOpen(true)}
      className="relative cursor-pointer bg-white hover:bg-primary-2 transition-colors border border-grey-3 rounded-lg py-2 px-2.5 h-14 text-sm text-primary-10 font-medium italic flex gap-2 items-center max-lg:justify-center"
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
      <Button
        icon="edit-line"
        size="xs"
        variant="grey"
        className="lg:ml-auto max-lg:absolute right-3"
        onClick={() => setIsModalOpen(true)}
      />

      <RestreintModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        isRestreint={isRestreint}
        updateRestreint={updateRestreint}
      />
    </div>
  );
};

export default FicheActionRestreint;
