import classNames from 'classnames';
import {Badge} from '@tet/ui';
import {FicheAction} from '../data/types';
import MenuDescription from './MenuDescription';

type FicheActionDescriptionProps = {
  isReadonly: boolean;
  fiche: FicheAction;
  className?: string;
  updateFiche: (fiche: FicheAction) => void;
};

const FicheActionDescription = ({
  isReadonly,
  fiche,
  className,
  updateFiche,
}: FicheActionDescriptionProps) => {
  const {
    thematiques,
    sous_thematiques: sousThematiques,
    description,
    ressources,
  } = fiche;

  return (
    <div
      className={classNames(
        'bg-primary-7 rounded-lg py-7 lg:py-8 px-5 lg:px-6 xl:px-7 flex flex-col gap-7',
        className
      )}
    >
      <div
        className={classNames('flex justify-between items-start', {
          'max-sm:-mb-4 -mb-8': !thematiques || !thematiques?.length,
        })}
      >
        {/* Liste des thématiques et sous-thématiques sous forme de badges */}
        {(thematiques?.length || sousThematiques?.length) && (
          <div className="flex flex-wrap gap-4">
            {thematiques?.map(thematique => (
              <Badge
                key={thematique.id}
                title={thematique.nom}
                uppercase={false}
                state="info"
              />
            ))}
            {sousThematiques?.map(ssThematique => (
              <Badge
                key={ssThematique.id}
                title={ssThematique.sous_thematique}
                uppercase={false}
                state="info"
              />
            ))}
          </div>
        )}

        {/* Boutons d'action sur la fiche */}
        <MenuDescription
          isReadonly={isReadonly}
          fiche={fiche}
          updateFiche={updateFiche}
          className="ml-auto"
        />
      </div>

      {/* Description de l'action */}
      <div>
        <h6 className="text-lg leading-6 text-grey-1 mb-2">
          Description de l'action :
        </h6>
        <p className="text-base text-grey-1 whitespace-pre-wrap mb-0">
          {description || 'Non renseigné'}
        </p>
      </div>

      {/* Moyens humains et techniques */}
      <div>
        <h6 className="text-lg leading-6 text-grey-1 mb-2">
          Moyens humains et techniques :
        </h6>
        <p className="text-base text-grey-1 whitespace-pre-wrap mb-0">
          {ressources || 'Non renseigné'}
        </p>
      </div>
    </div>
  );
};

export default FicheActionDescription;
