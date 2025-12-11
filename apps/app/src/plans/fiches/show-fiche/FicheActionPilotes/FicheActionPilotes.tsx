import { FicheWithRelations } from '@tet/domain/plans';
import { Button, EmptyCard } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import EmptyActeursPicto from '../FicheActionActeurs/PictosActeurs/EmptyActeursPicto';
import ModalePilotes from './ModalePilotes';
import PersonnePilotePicto from './PersonnePilotePicto';

type FicheActionPilotesProps = {
  isReadonly: boolean;
  fiche: FicheWithRelations;
  className?: string;
};

const FicheActionPilotes = ({
  isReadonly,
  fiche,
  className,
}: FicheActionPilotesProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { pilotes } = fiche;

  const isEmpty = !pilotes || pilotes.length === 0;

  return (
    <>
      {!isEmpty ? (
        <div
          className={classNames(
            'bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 relative flex flex-col items-start gap-y-3 gap-x-6',
            className
          )}
        >
          {!isReadonly && (
            <Button
              title="Modifier les pilotes"
              icon="edit-line"
              size="xs"
              variant="grey"
              className="!absolute top-4 right-3"
              onClick={() => setIsModalOpen(true)}
            />
          )}
          <div className="w-full flex flex-col gap-4 items-center">
            <PersonnePilotePicto className="w-16 h-16" />
            <div className="flex flex-col gap-2">
              <h6 className="text-sm leading-4 text-primary-9 uppercase text-center mb-1">
                Personnes pilotes
              </h6>
              {pilotes.map((pilote, index) => (
                <p
                  key={index}
                  className="text-sm leading-4 mb-0 text-primary-10 text-center"
                >
                  {pilote.nom}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <EmptyCard
          picto={(props) => <EmptyActeursPicto {...props} />}
          title="Aucun pilote du projet n'est renseigné !"
          isReadonly={isReadonly}
          actions={[
            {
              dataTest: 'pilotes',
              children: 'Ajouter les pilotes',
              onClick: () => setIsModalOpen(true),
            },
          ]}
          className={className}
          size="xs"
        />
      )}

      {isModalOpen && !isReadonly && (
        <ModalePilotes
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          fiche={fiche}
        />
      )}
    </>
  );
};

export default FicheActionPilotes;
