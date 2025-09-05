import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import Markdown from '@/app/ui/Markdown';
import { getTruncatedText } from '@/app/utils/formatUtils';
import { Badge, Button } from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';
import ModaleDescription from './ModaleDescription';

type FicheActionDescriptionProps = {
  isReadonly: boolean;
  fiche: Fiche;
  className?: string;
};

const FicheActionDescription = ({
  isReadonly,
  fiche,
  className,
}: FicheActionDescriptionProps) => {
  const {
    thematiques,
    sousThematiques,
    description,
    ressources,
    instanceGouvernance,
    libreTags,
  } = fiche;

  const [isFullDescription, setIsFullDescription] = useState(false);
  const [isFullRessources, setIsFullRessources] = useState(false);
  const [isFullInstances, setIsFullInstances] = useState(false);

  const {
    truncatedText: truncatedDescription,
    isTextTruncated: isDescriptionTruncated,
  } = getTruncatedText(description ?? '', 1000);

  const {
    truncatedText: truncatedRessources,
    isTextTruncated: isRessourcesTruncated,
  } = getTruncatedText(ressources ?? '', 1000);

  const {
    truncatedText: truncatedInstances,
    isTextTruncated: isInstancesTruncated,
  } = getTruncatedText(instanceGouvernance ?? '', 1000);

  return (
    <div
      className={classNames(
        'bg-primary-7 rounded-lg py-7 lg:py-8 px-5 lg:px-6 xl:px-7 flex flex-col gap-7',
        className
      )}
    >
      <div
        className={classNames('flex justify-between items-start', {
          'max-sm:-mb-4 -mb-8':
            (!thematiques || !thematiques?.length) && !libreTags?.length,
        })}
      >
        {/* Liste des thématiques et sous-thématiques sous forme de badges */}
        {(thematiques?.length ||
          sousThematiques?.length ||
          libreTags?.length) && (
          <div className="flex flex-wrap gap-3">
            {thematiques?.map((thematique) => (
              <Badge
                key={thematique.id}
                title={thematique.nom}
                uppercase={false}
                state="info"
              />
            ))}
            {sousThematiques?.map((ssThematique) => (
              <Badge
                key={ssThematique.id}
                title={ssThematique.nom}
                uppercase={false}
                state="info"
              />
            ))}
            {libreTags?.map((tagPerso) => (
              <Badge
                key={tagPerso.id}
                title={tagPerso.nom}
                uppercase={false}
                state="default"
              />
            ))}
          </div>
        )}

        {/* Modale de modification du block description */}
        {!isReadonly && (
          <div className="ml-auto">
            <ModaleDescription fiche={fiche} />
          </div>
        )}
      </div>

      {/* Description de l'action */}
      <div>
        <h6 className="text-lg leading-6 text-grey-1 mb-2">
          {"Description de l'action :"}
        </h6>
        <div className="text-base text-grey-1 whitespace-pre-wrap mb-0">
          {description ? (
            <Markdown
              className="[&_ul]:mb-0 [&_ol]:mb-0 [&_p]:mb-0"
              content={(isFullDescription || !isDescriptionTruncated
                ? description
                : truncatedDescription
              ).replaceAll('\\n', '\n')}
            />
          ) : (
            'Non renseigné'
          )}
        </div>
        {isDescriptionTruncated && (
          <Button
            variant="underlined"
            size="xs"
            className="ml-auto !text-grey-2 !border-grey-2"
            onClick={() => setIsFullDescription((prevState) => !prevState)}
          >
            {isFullDescription ? 'Voir moins' : 'Voir plus'}
          </Button>
        )}
      </div>

      {/* Moyens humains et techniques */}
      <div>
        <h6 className="text-lg leading-6 text-grey-1 mb-2">
          Moyens humains et techniques :
        </h6>
        <p className="text-base text-grey-1 whitespace-pre-wrap mb-0">
          {(isFullRessources || !isRessourcesTruncated
            ? ressources
            : truncatedRessources) || 'Non renseigné'}
        </p>
        {isRessourcesTruncated && (
          <Button
            variant="underlined"
            size="xs"
            className="ml-auto !text-grey-2 !border-grey-2"
            onClick={() => setIsFullRessources((prevState) => !prevState)}
          >
            {isFullRessources ? 'Voir moins' : 'Voir plus'}
          </Button>
        )}
      </div>

      {/* Instances de gouvernance */}
      <div>
        <h6 className="text-lg leading-6 text-grey-1 mb-2">
          Instances de gouvernance :
        </h6>
        <p className="text-base text-grey-1 whitespace-pre-wrap mb-0">
          {(isFullInstances || !isInstancesTruncated
            ? instanceGouvernance
            : truncatedInstances) || 'Non renseigné'}
        </p>
        {isInstancesTruncated && (
          <Button
            variant="underlined"
            size="xs"
            className="ml-auto !text-grey-2 !border-grey-2"
            onClick={() => setIsFullInstances((prevState) => !prevState)}
          >
            {isFullInstances ? 'Voir moins' : 'Voir plus'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FicheActionDescription;
