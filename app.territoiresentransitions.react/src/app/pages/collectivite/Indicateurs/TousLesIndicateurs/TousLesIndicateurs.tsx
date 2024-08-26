import {FetchFiltre} from '@tet/api/dist/src/indicateurs';
import {Button, ButtonMenu} from '@tet/ui';
import IndicateursListe from 'app/pages/collectivite/Indicateurs/lists/IndicateursListe';
import MenuFiltresTousLesIndicateurs from 'app/pages/collectivite/Indicateurs/TousLesIndicateurs/MenuFiltresTousLesIndicateurs';
import ModaleCreerIndicateur from 'app/pages/collectivite/PlansActions/FicheAction/Indicateurs/ModaleCreerIndicateur';
import {makeCollectiviteTousLesIndicateursUrl} from 'app/paths';
import {useSearchParams} from 'core-logic/hooks/query';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {useState} from 'react';

const nameToParams: Record<keyof FetchFiltre, string> = {
  thematiqueIds: 't',
  actionId: 'a',
  planActionIds: 'pa',
  utilisateurPiloteIds: 'up',
  personnePiloteIds: 'pp',
  servicePiloteIds: 's',
  categorieNoms: 'cat',
  participationScore: 'ps',
  estComplet: 'r',
  estConfidentiel: 'c',
  fichesNonClassees: 'fnc',
  text: 'text',
  estPerso: 'p',
  hasOpenData: 'od',
};

/** Page de listing de toutes les fiches actions de la collectivité */
const TousLesIndicateurs = () => {
  const collectivite = useCurrentCollectivite();

  const isReadonly = collectivite?.readonly ?? false;

  const [isNewIndicateurOpen, setIsNewIndicateurOpen] = useState(false);

  const [filters, setFilters] = useSearchParams<FetchFiltre>(
    makeCollectiviteTousLesIndicateursUrl({
      collectiviteId: collectivite?.collectivite_id!,
    }),
    {},
    nameToParams
  );

  return (
    <div className="min-h-[44rem] flex flex-col gap-8">
      <div className="flex items-end">
        <h2 className="mb-0 mr-auto">Tous les indicateurs</h2>
        {!isReadonly && (
          <>
            <Button size="sm" onClick={() => setIsNewIndicateurOpen(true)}>
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
      <IndicateursListe
        filtres={filters}
        resetFilters={() => setFilters({})}
        sortSettings={{defaultSort: 'estComplet'}}
        settings={openState => (
          <ButtonMenu
            openState={openState}
            variant="outlined"
            icon="equalizer-line"
            size="sm"
          >
            <MenuFiltresTousLesIndicateurs
              filters={filters}
              setFilters={newFilters => {
                setFilters(newFilters);
              }}
            />
          </ButtonMenu>
        )}
      />
    </div>
  );
};

export default TousLesIndicateurs;
