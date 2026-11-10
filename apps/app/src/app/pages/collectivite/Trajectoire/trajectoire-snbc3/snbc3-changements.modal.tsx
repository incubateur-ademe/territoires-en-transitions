import { appLabels } from '@/app/labels/catalog';
import { Modal } from '@tet/ui';

/** Modale « Ce qui change avec la SNBC 3 », ouverte depuis le bandeau ou sous le titre. */
export const Snbc3ChangementsModal = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) => (
  <Modal
    size="lg"
    title={appLabels.trajectoireSnbc3ChangementsTitre}
    openState={{ isOpen, setIsOpen }}
    dataTest="indicateurs.trajectoires.snbc3.changements-modal"
    render={() => (
      <ul className="text-base list-disc ml-4 mb-0 flex flex-col gap-2">
        {appLabels.trajectoireSnbc3Changements.map(({ titre, desc }) => (
          <li key={titre}>
            <span className="font-semibold">{titre}</span>&nbsp;
            {desc}
          </li>
        ))}
      </ul>
    )}
  />
);
