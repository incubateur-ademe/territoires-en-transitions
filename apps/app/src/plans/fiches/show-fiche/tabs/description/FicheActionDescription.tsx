import { RichTextView } from '@/app/plans/fiches/update-fiche/components/RichTextView';
import { Badge } from '@tet/ui';
import classNames from 'classnames';
import { useFicheContext } from '../../context/fiche-context';
import ModaleDescription from './ModaleDescription';

type FicheActionDescriptionProps = {
  className?: string;
};

const Title = ({ children }: { children: React.ReactNode }) => (
  <h6 className="text-lg leading-6 mb-0 text-grey-1">{children}</h6>
);

export const FicheActionDescription = ({
  className,
}: FicheActionDescriptionProps) => {
  const { fiche, isReadonly } = useFicheContext();
  const {
    thematiques,
    sousThematiques,
    description,
    instanceGouvernance,
    libreTags,
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

      <div className="text-inherit">
        <Title>{"Description de l'action :"}</Title>
        <RichTextView content={description} placeholder="Non renseigné" />
      </div>

      <div>
        <Title>Instances de gouvernance :</Title>
        <RichTextView content={instanceGouvernance} />
      </div>
    </div>
  );
};
