import { Accordion } from '@/ui';
import {
  METHODO_PAR_SECTEUR,
  SecteurTrajectoire,
} from '../../../../indicateurs/trajectoires/trajectoire-constants';
import { MethodologieSection } from './MethodologieSection';

/** Affiche l'encadré "Méthodologie" (lorsqu'un secteur est sélectionné) */
export const Methodologie = ({ secteur }: { secteur: SecteurTrajectoire }) => {
  const methodo = METHODO_PAR_SECTEUR[secteur.nom];
  return methodo ? (
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
  ) : null;
};
