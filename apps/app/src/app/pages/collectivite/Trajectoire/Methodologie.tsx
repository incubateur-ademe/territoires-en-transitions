import {
  isTrajectoireSecteur,
  TrajectoirePropertiesType,
} from '@tet/domain/indicateurs';
import { Accordion } from '@tet/ui';
import { METHODO_PAR_SECTEUR } from '../../../../indicateurs/trajectoires/trajectoire-constants';
import { MethodologieSection } from './MethodologieSection';

/** Affiche l'encadré "Méthodologie" (lorsqu'un secteur est sélectionné) */
export const Methodologie = ({
  secteur,
}: {
  secteur: TrajectoirePropertiesType['secteurs'][number];
}) => {
  const secteurNom = secteur.nom;
  if (isTrajectoireSecteur(secteurNom) === false) {
    return null;
  }
  const methodo = METHODO_PAR_SECTEUR[secteurNom];
  return (
    <Accordion
      title="Méthodologie"
      initialState={false}
      containerClassname="border-b-0"
      content={
        <div>
          {'snbc2' in methodo && (
            <MethodologieSection title="SNBC 2" content={methodo.snbc2} />
          )}
          {methodo.pivots && (
            <MethodologieSection
              title="Méthode de territorialisation"
              content={methodo.pivots}
            />
          )}
        </div>
      }
    />
  );
};
