import {FicheAction} from '../../data/types';
import {
  IndicateurViewParamOption,
  makeCollectiviteIndicateursUrl,
} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import IndicateursPanel from 'app/pages/collectivite/PlansActions/FicheAction/FicheActionForm/indicateurs/Panel/Panel';
import {CreerIndicateurPersoModal} from 'app/pages/collectivite/PlansActions/FicheAction/FicheActionForm/indicateurs/CreerIndicateurPersoModal';
import IndicateurCard from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import {Indicateur} from 'app/pages/collectivite/Indicateurs/types';
import {selectIndicateur} from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import {usePanelDispatch} from 'app/pages/collectivite/CollectivitePageLayout/Panel/PanelContext';
import Content from 'app/pages/collectivite/PlansActions/FicheAction/FicheActionForm/indicateurs/Panel/Content';

type Props = {
  fiche: FicheAction;
  indicateurs: Indicateur[] | null;
  onSelect: (indicateurs: Indicateur[]) => void;
  isReadonly: boolean;
};

const IndicateursLies = ({fiche, indicateurs, onSelect, isReadonly}: Props) => {
  const collectiviteId = useCollectiviteId();

  const panelDispatch = usePanelDispatch();

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
          <IndicateursPanel
            selectedIndicateurs={indicateurs}
            onSelect={onSelect}
          />
          <CreerIndicateurPersoModal fiche={fiche} />
        </div>
      </div>
      {indicateurs && indicateurs.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {indicateurs.map(indicateur => (
            <IndicateurCard
              key={indicateur.nom}
              className="h-full"
              definition={{
                id:
                  indicateur.indicateur_id ??
                  indicateur.indicateur_personnalise_id!,
                nom: indicateur.nom,
              }}
              href={makeCollectiviteIndicateursUrl({
                collectiviteId: collectiviteId!,
                indicateurView: getIndicateurGroup(indicateur.indicateur_id),
                indicateurId:
                  indicateur.indicateur_id ??
                  indicateur.indicateur_personnalise_id ??
                  undefined,
              })}
              card={{external: true}}
              selectState={{
                selected: true,
                setSelected: indicateur => {
                  const newIndicateurs = selectIndicateur({
                    indicateur,
                    selected: true,
                    selectedIndicateurs: indicateurs,
                  });
                  onSelect(newIndicateurs);
                  panelDispatch({
                    type: 'updateContent',
                    content: (
                      <Content
                        selectedIndicateurs={newIndicateurs}
                        onSelect={onSelect}
                      />
                    ),
                  });
                },
              }}
              autoRefresh
              readonly={isReadonly}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default IndicateursLies;
