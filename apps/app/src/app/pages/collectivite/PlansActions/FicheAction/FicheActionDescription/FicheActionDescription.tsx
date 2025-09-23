import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { htmlToText } from '@/domain/utils';
import { Badge, Button, RichTextEditor } from '@/ui';
import { cn } from '@/ui/utils/cn';
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
  const [isFullDescription, setIsFullDescription] = useState(false);
  const [isFullRessources, setIsFullRessources] = useState(false);
  const [isFullInstances, setIsFullInstances] = useState(false);

  const {
    thematiques,
    sousThematiques,
    description,
    ressources,
    instanceGouvernance,
    libreTags,
  } = fiche;

  const isDescriptionTruncated = htmlToText(description ?? '').length > 1000;
  const isRessourcesTruncated = htmlToText(ressources ?? '').length > 1000;
  const isInstancesTruncated =
    htmlToText(instanceGouvernance ?? '').length > 1000;

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
      <div className="text-grey-1">
        <h6 className="text-lg leading-6 text-inherit mb-0">
          {"Description de l'action :"}
        </h6>
        {description?.length ? (
          <RichTextEditor
            disabled
            className={cn('!bg-transparent border-none !text-grey-1 !px-0', {
              'max-h-[20rem] overflow-hidden': !isFullDescription,
            })}
            initialValue={description}
          />
        ) : (
          'Non renseigné'
        )}
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
      <div className="text-grey-1">
        <h6 className="text-lg leading-6 text-inherit mb-0">
          Moyens humains et techniques :
        </h6>
        {ressources?.length ? (
          <RichTextEditor
            disabled
            className={cn('!bg-transparent border-none !text-grey-1 !px-0', {
              'max-h-[20rem] overflow-hidden': !isFullRessources,
            })}
            initialValue={ressources}
          />
        ) : (
          'Non renseigné'
        )}
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
      <div className="text-grey-1">
        <h6 className="text-lg text-inherit leading-6 mb-0">
          Instances de gouvernance :
        </h6>
        {instanceGouvernance?.length ? (
          <RichTextEditor
            disabled
            className={cn('!bg-transparent border-none !text-grey-1 !px-0', {
              'max-h-[20rem] overflow-hidden': !isFullInstances,
            })}
            initialValue={instanceGouvernance}
          />
        ) : (
          'Non renseigné'
        )}
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
