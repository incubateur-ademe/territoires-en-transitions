import {useHistory, useParams} from 'react-router-dom';
import {Breadcrumbs} from '@tet/ui';
import {makeCollectiviteFichesNonClasseesUrl} from 'app/paths';
import {TAxeInsert} from 'types/alias';
import TitreFiche from './TitreFiche';
import CheminFiche from './CheminFiche';

type FicheActionHeaderProps = {
  titre: string | null;
  collectiviteId: number;
  axes: TAxeInsert[] | null;
  isReadonly: boolean;
  updateTitle: (value: string) => void;
};

const FicheActionHeader = (props: FicheActionHeaderProps) => {
  const {titre, collectiviteId, axes} = props;
  const history = useHistory();

  // Plan actuellement consulté
  const {planUid} = useParams<{planUid: string}>();

  // Si plusieurs emplacements, on récupère l'axe qui correpond
  // au plan actuellement consulté
  const axeId = !!axes
    ? axes.length === 1
      ? axes[0].id
      : axes.find(a => a.plan === parseInt(planUid))?.id
    : null;

  return (
    <div className="w-full mb-10">
      {/* Titre éditable de la fiche action */}
      <TitreFiche {...props} />

      {/* Fil d'ariane avec emplacement actuellement consulté de la fiche action */}
      {axeId ? (
        <CheminFiche
          titre={titre ?? 'Sans titre'}
          axeId={axeId}
          collectiviteId={collectiviteId}
        />
      ) : (
        <Breadcrumbs
          items={[
            {
              label: 'Fiches non classées',
              onClick: () =>
                history.push(
                  makeCollectiviteFichesNonClasseesUrl({
                    collectiviteId: collectiviteId,
                  })
                ),
            },
            {
              label: titre ?? 'Sans titre',
            },
          ]}
        />
      )}
    </div>
  );
};

export default FicheActionHeader;
