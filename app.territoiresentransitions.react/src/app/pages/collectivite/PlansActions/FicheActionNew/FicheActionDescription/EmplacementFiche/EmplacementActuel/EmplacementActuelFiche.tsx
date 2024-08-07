import {FicheAction} from '../../../../FicheAction/data/types';
import CheminEmplacement from './CheminEmplacement';

type EmplacementActuelFicheProps = {
  fiche: FicheAction;
};

const EmplacementActuelFiche = ({fiche}: EmplacementActuelFicheProps) => {
  const nbEmplacements = fiche.axes?.length ?? 0;

  return (
    <div>
      {/* Indique le nombre d'emplacements actuel */}
      <h6 className="text-sm">
        {nbEmplacements !== 0
          ? `${nbEmplacements} emplacement${
              nbEmplacements > 1 ? 's' : ''
            } sélectionné${nbEmplacements > 1 ? 's' : ''} pour cette fiche`
          : "Cette fiche n'a pas encore d'emplacement sélectionné"}
      </h6>

      {/* Liste des emplacements */}
      <div className="flex flex-col gap-6 overflow-x-auto pb-4">
        {fiche.axes?.map(
          axe =>
            !!axe.id && (
              <CheminEmplacement
                key={`${fiche.id}-${axe.id}`}
                ficheId={fiche.id!}
                axeId={axe.id}
              />
            )
        )}
      </div>
    </div>
  );
};

export default EmplacementActuelFiche;
