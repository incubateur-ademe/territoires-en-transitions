import {useEffect, useState} from 'react';
import classNames from 'classnames';
import {Button} from '@tet/ui';
import {FicheAction} from '../data/types';
import ListeActeurs from './ListeActeurs';
import ModaleActeurs from './ModaleActeurs';
import EmptyActeursPicto from './PictosActeurs/EmptyActeursPicto';
import PersonnePilotePicto from './PictosActeurs/PersonnePilotePicto';
import ServicePilotePicto from './PictosActeurs/ServicePilotePicto';
// import CollaborateurPicto from './PictosActeurs/CollaborateurPicto';
import StructurePilotePicto from './PictosActeurs/StructurePilotePicto';
import EluPicto from './PictosActeurs/EluPicto';
import PartenairePicto from './PictosActeurs/PartenairePicto';
import CiblePicto from './PictosActeurs/CiblePicto';
import EmptyCard from '../EmptyCard';
// import CitoyenPicto from './PictosActeurs/CitoyenPicto';

type FicheActionActeursProps = {
  isReadonly: boolean;
  fiche: FicheAction;
  className?: string;
  updateFiche: (fiche: FicheAction) => void;
  refetchFiche: () => void;
};

const FicheActionActeurs = ({
  isReadonly,
  fiche,
  className,
  updateFiche,
  refetchFiche,
}: FicheActionActeursProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {pilotes, services, structures, referents, partenaires, cibles} = fiche;

  const isEmpty =
    !pilotes &&
    !services &&
    !structures &&
    !referents &&
    !partenaires &&
    (!cibles || cibles.length === 0);

  useEffect(() => {
    if (!isModalOpen) refetchFiche();
  }, [isModalOpen]);

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
              title="Modifier les acteurs"
              icon="edit-line"
              size="xs"
              variant="grey"
              className="!absolute top-4 right-3"
              onClick={() => setIsModalOpen(true)}
            />
          )}
          <div className="flex flex-col gap-3">
            <ListeActeurs
              titre="Personne pilote"
              liste={pilotes?.map(pilote => pilote.nom!)}
              picto={className => <PersonnePilotePicto className={className} />}
            />
            {/* <ListeActeurs
              titre="Collaborateurs"
              liste={[]}
              picto={className => <CollaborateurPicto className={className} />}
            /> */}
            <ListeActeurs
              titre="Direction ou service pilote"
              liste={services?.map(service => service.nom!)}
              picto={className => <ServicePilotePicto className={className} />}
            />
            <ListeActeurs
              titre="Structure pilote"
              liste={structures?.map(structure => structure.nom!)}
              picto={className => (
                <StructurePilotePicto className={className} />
              )}
            />
          </div>

          <div className="flex flex-col gap-3">
            <ListeActeurs
              titre="Élu·e référent·e"
              liste={referents?.map(referent => referent.nom!)}
              picto={className => <EluPicto className={className} />}
            />
            <ListeActeurs
              titre="Partenaires"
              liste={partenaires?.map(partenaire => partenaire.nom!)}
              picto={className => <PartenairePicto className={className} />}
            />
            <ListeActeurs
              titre="Cibles"
              liste={cibles?.map(cible => cible)}
              picto={className => <CiblePicto className={className} />}
            />
            {/* <ListeActeurs
              titre="Participation citoyenne"
              liste={[]}
              picto={className => <CitoyenPicto className={className} />}
            /> */}
          </div>
        </div>
      ) : (
        <EmptyCard
          picto={className => <EmptyActeursPicto className={className} />}
          title="Aucun acteur du projet n'est renseigné !"
          subTitle="Personne pilote | Structure pilote | Élu·e référent·e | Direction ou service pilote | Partenaires | Cibles"
          isReadonly={isReadonly}
          action={{
            label: 'Ajouter les acteurs',
            onClick: () => setIsModalOpen(true),
          }}
          className={className}
        />
      )}

      <ModaleActeurs
        isOpen={isModalOpen && !isReadonly}
        setIsOpen={setIsModalOpen}
        fiche={fiche}
        updateFiche={updateFiche}
      />
    </>
  );
};

export default FicheActionActeurs;
