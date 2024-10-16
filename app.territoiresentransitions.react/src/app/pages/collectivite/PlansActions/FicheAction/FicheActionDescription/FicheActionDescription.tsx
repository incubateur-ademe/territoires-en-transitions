import { useState } from 'react';
import classNames from 'classnames';
import { Badge, Button } from '@tet/ui';
import { FicheAction } from '@tet/api/plan-actions';
import MenuDescription from './MenuDescription';
import { getTruncatedText } from 'utils/formatUtils';
import Markdown from 'ui/Markdown';

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
  const [isFullDescription, setIsFullDescription] = useState(false);
  const [isFullRessources, setIsFullRessources] = useState(false);

  const { thematiques, sousThematiques, description, ressources } = fiche;

  const {
    truncatedText: truncatedDescription,
    isTextTruncated: isDescriptionTruncated,
  } = getTruncatedText(description ?? '', 1000);

  const {
    truncatedText: truncatedRessources,
    isTextTruncated: isRessourcesTruncated,
  } = getTruncatedText(ressources ?? '', 1000);

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
                title={ssThematique.sousThematique}
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
          {description ? (
            <Markdown
              className="[&_ul]:list-disc [&_ul]:pl-8 [&_p]:mb-0"
              content={(isFullDescription || !isDescriptionTruncated
                ? description
                : truncatedDescription
              ).replaceAll('\\n', '\n')}
            />
          ) : (
            'Non renseigné'
          )}
        </p>
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
    </div>
  );
};

export default FicheActionDescription;
