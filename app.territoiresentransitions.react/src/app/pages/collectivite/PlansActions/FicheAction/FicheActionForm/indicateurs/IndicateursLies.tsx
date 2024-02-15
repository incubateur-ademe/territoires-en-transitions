import FormField from 'ui/shared/form/FormField';
import {FicheAction, Indicateur} from '../../data/types';
import {
  IndicateurViewParamOption,
  makeCollectiviteIndicateursUrl,
} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {NavLink} from 'react-router-dom';
import {Button} from '@tet/ui';
import IndicateursPanel from 'app/pages/collectivite/PlansActions/FicheAction/FicheActionForm/indicateurs/Panel/Panel';
import {CreerIndicateurPersoModal} from 'app/pages/collectivite/PlansActions/FicheAction/FicheActionForm/indicateurs/CreerIndicateurPersoModal';

type Props = {
  fiche: FicheAction;
  indicateurs: Indicateur[] | null;
  onSelect: (indicateurs: Indicateur[]) => void;
  isReadonly: boolean;
};

const IndicateursLies = ({fiche, indicateurs, onSelect, isReadonly}: Props) => {
  const collectiviteId = useCollectiviteId();

  /**
   * Retourne le groupe auquel appartient l'indicateur.
   * Si l'id est undefined, on assume que c'est un indicateur personnalisé.
   */
  const getIndicateurGroup = (
    indicateur_id?: string | null
  ): IndicateurViewParamOption => {
    if (indicateur_id) {
      return indicateur_id.split('_')[0] as IndicateurViewParamOption;
    } else {
      return 'perso';
    }
  };

  return (
    <>
      <hr />
      <div className="flex items-center justify-between gap-8 mb-6">
        <div>Indicateurs liés :</div>
        <div className="flex gap-4">
          <IndicateursPanel />
          <CreerIndicateurPersoModal fiche={fiche} />
        </div>
      </div>
      {indicateurs && indicateurs.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {indicateurs.map(indicateur => (
            <div
              key={
                indicateur.indicateur_id ??
                indicateur.indicateur_personnalise_id
              }
              className="border border-gray-200 hover:bg-grey975"
            >
              <NavLink
                target="_blank"
                rel="noopener noreferrer"
                className="after:!hidden"
                to={makeCollectiviteIndicateursUrl({
                  collectiviteId: collectiviteId!,
                  indicateurView: getIndicateurGroup(indicateur.indicateur_id),
                  indicateurId:
                    indicateur.indicateur_id ??
                    indicateur.indicateur_personnalise_id ??
                    undefined,
                })}
              >
                <div className="flex h-full py-4 px-6">
                  <div className="mb-auto pr-2 font-bold line-clamp-3">
                    {indicateur.nom}
                  </div>
                  <span className="fr-fi-arrow-right-line self-end ml-auto mt-4 text-bf500 scale-75" />
                </div>
              </NavLink>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default IndicateursLies;
