import classNames from 'classnames';
import {FicheAction} from '../../FicheAction/data/types';
import {Button} from '@tet/ui';
import FAListeActeurs from './FAListeActeurs';
import {useState} from 'react';
import FAActeursModal from './FAActeursModal';
import EmptyActeursPicto from './EmptyActeursPicto';
import PersonnePilotePicto from './PictosActeurs/PersonnePilotePicto';
import ServicePilotePicto from './PictosActeurs/ServicePilotePicto';
// import CollaborateurPicto from './PictosActeurs/CollaborateurPicto';
import StructurePilotePicto from './PictosActeurs/StructurePilotePicto';
import EluPicto from './PictosActeurs/EluPicto';
import PartenairePicto from './PictosActeurs/PartenairePicto';
import CiblePicto from './PictosActeurs/CiblePicto';
// import CitoyenPicto from './PictosActeurs/CitoyenPicto';

type FicheActionActeursProps = {
  isReadonly: boolean;
  fiche: FicheAction;
  className?: string;
  updateFiche: (fiche: FicheAction) => void;
};

const FicheActionActeurs = ({
  isReadonly,
  fiche,
  className,
  updateFiche,
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

  return (
    <div
      className={classNames(
        'bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col gap-7 relative',
        {
          'items-start': !isEmpty,
          'items-center': isEmpty,
        },
        className
      )}
    >
      {!isReadonly && (
        <Button
          icon="edit-line"
          size="xs"
          variant="grey"
          className="absolute top-4 right-3"
          onClick={() => setIsModalOpen(true)}
        />
      )}

      {!isEmpty ? (
        <div className="flex flex-col gap-y-3 gap-x-6">
          <div className="flex flex-col gap-3">
            <FAListeActeurs
              titre="Personne pilote"
              liste={pilotes?.map(pilote => pilote.nom!)}
              picto={className => <PersonnePilotePicto className={className} />}
            />
            {/* <FAListeActeurs
              titre="Collaborateurs"
              liste={[]}
              picto={className => <CollaborateurPicto className={className} />}
            /> */}
            <FAListeActeurs
              titre="Direction ou service pilote"
              liste={services?.map(service => service.nom!)}
              picto={className => <ServicePilotePicto className={className} />}
            />
            <FAListeActeurs
              titre="Structure pilote"
              liste={structures?.map(structure => structure.nom!)}
              picto={className => (
                <StructurePilotePicto className={className} />
              )}
            />
          </div>

          <div className="flex flex-col gap-3">
            <FAListeActeurs
              titre="Élu·e référent·e"
              liste={referents?.map(referent => referent.nom!)}
              picto={className => <EluPicto className={className} />}
            />
            <FAListeActeurs
              titre="Partenaires"
              liste={partenaires?.map(partenaire => partenaire.nom!)}
              picto={className => <PartenairePicto className={className} />}
            />
            <FAListeActeurs
              titre="Cibles"
              liste={cibles?.map(cible => cible)}
              picto={className => <CiblePicto className={className} />}
            />
            {/* <FAListeActeurs
              titre="Participation citoyenne"
              liste={[]}
              picto={className => <CitoyenPicto className={className} />}
            /> */}
          </div>
        </div>
      ) : (
        <>
          <EmptyActeursPicto className="mx-auto" />

          <h6 className="text-lg leading-5 text-center text-primary-9 mb-0 px-2">
            Aucun acteur du projet n'est renseigné !
          </h6>

          <p className="text-base text-primary-9 text-center mb-0">
            Personne pilote | Structures pilotes | Élu·es référent·es |
            Directions ou service pilote | Partenaires | Cibles
          </p>

          {!isReadonly && (
            <Button size="xs" onClick={() => setIsModalOpen(true)}>
              Ajouter les acteurs
            </Button>
          )}
        </>
      )}

      <FAActeursModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        fiche={fiche}
        updateFiche={updateFiche}
      />
    </div>
  );
};

export default FicheActionActeurs;
