/**
 * Affiche la liste des thématiques de personnalisation des référentiels
 */

import {ThematiqueFilter, TThematiqueFilterProps} from './ThematiqueFilter';
import {ThematiqueList, TThematiqueListProps} from './ThematiqueList';

export type TThematiquesProps = TThematiqueFilterProps & TThematiqueListProps;

const Thematique = (props: TThematiquesProps) => {
  const {collectivite, selected, items, onChange} = props;
  return (
    <>
      <div className="flex flex-col items-center">
        <h1>Personnalisation des référentiels</h1>
        <h3>{collectivite.nom}</h3>
      </div>
      <p className="fr-text--lg">
        Les actions proposées dans les référentiels Climat Air Énergie et
        Économie circulaire dépendent des compétences et caractéristiques de
        chaque collectivité.
      </p>
      <p>
        Vos réponses aux questions permettront d'identifier les actions qui ne
        concernent pas votre collectivité et d'adapter les points des actions
        des référentiels à votre contexte.
      </p>
      <ThematiqueFilter selected={selected || []} onChange={onChange} />
      {items?.length > 0 && (
        <ThematiqueList
          className="mt-8"
          collectivite={collectivite}
          items={items}
        />
      )}
    </>
  );
};

export default Thematique;
