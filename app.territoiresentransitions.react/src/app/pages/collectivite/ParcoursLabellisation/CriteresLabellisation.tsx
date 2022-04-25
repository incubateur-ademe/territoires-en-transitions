import {ParcoursLabellisation} from './types';
import {Critere} from './Critere';

export type TCriteresLabellisationProps = {
  parcours: ParcoursLabellisation;
};

/**
 * Affiche la liste des critères à remplir pour un niveau de labellisation
 */
export const CriteresLabellisation = (props: TCriteresLabellisationProps) => {
  const {parcours} = props;
  const {criteres} = parcours;
  return (
    <>
      <h2>Critères de labellisation</h2>
      <ul>
        {criteres.map(critere => (
          <Critere key={critere.id} critere={critere} parcours={parcours} />
        ))}
      </ul>
    </>
  );
};
