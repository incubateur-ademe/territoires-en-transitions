import { ficheActionParticipationOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { Button, EmptyCard, getOptionLabel } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { useFicheContext } from '../../context/fiche-context';
import ListeActeurs from './ListeActeurs';
import ModaleActeurs from './ModaleActeurs';
import CiblePicto from './PictosActeurs/CiblePicto';
import CitoyenPicto from './PictosActeurs/CitoyenPicto';
import EluPicto from './PictosActeurs/EluPicto';
import EmptyActeursPicto from './PictosActeurs/EmptyActeursPicto';
import PartenairePicto from './PictosActeurs/PartenairePicto';
import ServicePilotePicto from './PictosActeurs/ServicePilotePicto';
import StructurePilotePicto from './PictosActeurs/StructurePilotePicto';

type FicheActionActeursProps = {
  className?: string;
};

export const FicheActionActeurs = ({ className }: FicheActionActeursProps) => {
  const { fiche, isReadonly } = useFicheContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    pilotes,
    services,
    structures,
    referents,
    partenaires,
    cibles,
    participationCitoyenne,
    participationCitoyenneType,
  } = fiche;

  const isEmpty =
    !pilotes &&
    !services &&
    !structures &&
    !referents &&
    !partenaires &&
    (!cibles || cibles.length === 0) &&
    !participationCitoyenne &&
    !participationCitoyenneType;

  return (
    <>
      {!isEmpty ? (
        <div
          className={classNames(
            'bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 relative flex flex-col md:max-lg:grid md:max-lg:grid-cols-2 items-start gap-y-3 gap-x-6',
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
            {/* <ListeActeurs
              titre="Collaborateurs"
              liste={[]}
              picto={className => <CollaborateurPicto className={className} />}
            /> */}
            <ListeActeurs
              titre="Direction ou service pilote"
              liste={services?.map((service) => service.nom)}
              picto={(className) => (
                <ServicePilotePicto className={className} />
              )}
            />
            <ListeActeurs
              titre="Structure pilote"
              liste={structures?.map((structure) => structure.nom)}
              picto={(className) => (
                <StructurePilotePicto className={className} />
              )}
            />
            <ListeActeurs
              titre="Élu·e référent·e"
              liste={referents?.map((referent) => referent.nom)}
              picto={(className) => <EluPicto className={className} />}
            />
          </div>

          <div className="flex flex-col gap-3">
            <ListeActeurs
              titre="Partenaires"
              liste={partenaires?.map((partenaire) => partenaire.nom)}
              picto={(className) => <PartenairePicto className={className} />}
            />
            <ListeActeurs
              titre="Cibles"
              liste={cibles?.map((cible) => cible)}
              picto={(className) => <CiblePicto className={className} />}
            />
            <ListeActeurs
              titre="Participation citoyenne"
              liste={
                participationCitoyenneType
                  ? [
                      getOptionLabel(
                        participationCitoyenneType,
                        ficheActionParticipationOptions
                      ) as string,
                    ]
                  : undefined
              }
              comment={participationCitoyenne ?? undefined}
              picto={(className) => <CitoyenPicto className={className} />}
            />
          </div>
        </div>
      ) : (
        <EmptyCard
          picto={(props) => <EmptyActeursPicto {...props} />}
          title="Aucun acteur du projet n'est renseigné !"
          tags={[
            'Structure pilote',
            'Élu·e référent·e',
            'Direction ou service pilote',
            'Partenaires',
            'Cibles',
            'Participation citoyenne',
          ]}
          isReadonly={isReadonly}
          actions={[
            {
              dataTest: 'acteurs',
              children: 'Ajouter les acteurs',
              onClick: () => setIsModalOpen(true),
            },
          ]}
          className={className}
          size="xs"
        />
      )}

      {isModalOpen && !isReadonly && (
        <ModaleActeurs
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          fiche={fiche}
        />
      )}
    </>
  );
};
