import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {useCreateFicheAction} from '../PlansActions/FicheAction/data/useUpsertFicheAction';
import FichesLiees from '../PlansActions/FicheAction/FicheActionForm/FichesLiees';
import {FicheResume} from '../PlansActions/FicheAction/data/types';
import {useFichesActionLiees} from './useFichesActionLiees';
import {useUpdateFichesActionLiees} from './useUpdateFichesActionLiees';

export type TFichesActionProps = {
  actionId: string;
};

/**
 * Affiche les fiches actions liées à une action du référentiel
 */
export const FichesActionLiees = (props: TFichesActionProps) => {
  const {actionId} = props;
  const collectivite = useCurrentCollectivite();
  const {data: fiches} = useFichesActionLiees(actionId);
  const {mutate: createFicheAction} = useCreateFicheAction({
    actionId,
    openInNewTab: true,
  });
  const {mutate: updateFichesActionLiees} =
    useUpdateFichesActionLiees(actionId);
  const isReadonly = collectivite?.readonly ?? false;

  return (
    <>
      {!isReadonly && (
        <button
          className="fr-btn fr-btn--icon-left fr-icon-add-line fr-mb-4w"
          onClick={() => createFicheAction()}
        >
          Créer une fiche action
        </button>
      )}

      <FichesLiees
        ficheCouranteId={null}
        fiches={fiches}
        onSelect={(fiches_liees: FicheResume[]) =>
          updateFichesActionLiees({fiches, fiches_liees})
        }
        isReadonly={isReadonly}
      />
    </>
  );
};
