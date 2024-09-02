import {Button} from '@tet/ui';
import ModaleCreerIndicateur from 'app/pages/collectivite/PlansActions/FicheAction/Indicateurs/ModaleCreerIndicateur';
import {makeCollectiviteTousLesIndicateursUrl} from 'app/paths';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {useState} from 'react';
import {useHistory} from 'react-router-dom';
import PictoDashboard from 'ui/pictogrammes/PictoDashboard';

const EmptyIndicateurFavori = () => {
  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite?.collectivite_id;

  const isReadonly = collectivite?.readonly ?? false;

  const history = useHistory();

  const [isNewIndicateurOpen, setIsNewIndicateurOpen] = useState(false);

  return (
    <div className="py-12 border-t border-primary-3">
      <div className="min-h-[21rem] flex flex-col items-center gap-4 p-8 bg-white border border-primary-4 rounded-xl">
        <PictoDashboard />
        <h4 className="mb-0 text-primary-8">
          Vous n'avez pas encore d'indicateur.
        </h4>
        <p className="m-0 text-primary-9">
          Ajoutez les depuis notre bibliothèque ou créez vos propres
          indicateurs.
        </p>
        <div className="flex items-center gap-6 mt-6">
          <Button
            onClick={() =>
              history.push(
                makeCollectiviteTousLesIndicateursUrl({
                  collectiviteId: collectiviteId!,
                })
              )
            }
          >
            Explorer les indicateurs
          </Button>
          {!isReadonly && (
            <>
              <Button
                variant="outlined"
                onClick={() => setIsNewIndicateurOpen(true)}
              >
                Créer un indicateur
              </Button>
              {isNewIndicateurOpen && (
                <ModaleCreerIndicateur
                  isOpen={isNewIndicateurOpen}
                  setIsOpen={setIsNewIndicateurOpen}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmptyIndicateurFavori;
