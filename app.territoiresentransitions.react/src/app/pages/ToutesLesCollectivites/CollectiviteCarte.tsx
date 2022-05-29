import {CollectiviteCarteRead} from 'generated/dataLayer/collectivite_carte_read';
import {Referentiel} from 'types/litterals';
import {toPercentString} from 'utils/score';
import {referentielToName} from 'app/labels';
import {NIVEAUX} from 'app/pages/collectivite/TableauBord/getNiveauInfo';
import {GreenStar, GreyStar} from 'app/pages/collectivite/TableauBord/Star';
import {Card} from '@material-ui/core';

export type TCollectiviteCarteProps = {
  collectivite: CollectiviteCarteRead;
};

/**
 * Carte représentant une collectivité.
 * Utilisée dans la vue toutes les collectivités.
 *
 * Affiche le nom et des éléments de scores.
 * todo: Lie vers le tableau de bord de la collectivité.
 */
export const CollectiviteCarte = (props: TCollectiviteCarteProps) => {
  const {collectivite} = props;

  return (
    <Card className="p-4">
      <h3>{collectivite.nom}</h3>
      <div className="flex">
        <ReferentielCol
          referentiel={'cae'}
          etoiles={collectivite.etoiles_cae}
          scoreRealise={collectivite.score_fait_cae}
          scoreProgramme={collectivite.score_programme_cae}
        />
        <ReferentielCol
          referentiel={'eci'}
          etoiles={collectivite.etoiles_eci}
          scoreRealise={collectivite.score_fait_eci}
          scoreProgramme={collectivite.score_programme_eci}
        />
      </div>
    </Card>
  );
};

export type TReferentielColProps = {
  referentiel: Referentiel;
  etoiles: number;
  scoreRealise: number;
  scoreProgramme: number;
};

/**
 * Une colonne avec les éléments de score pour la carte collectivité.
 */
export const ReferentielCol = (props: TReferentielColProps) => {
  return (
    <div className="flex flex-col flex-1">
      <div>{referentielToName[props.referentiel]}</div>
      <CinqEtoiles etoiles={props.etoiles} />
      <div>icon {toPercentString(props.scoreRealise)} réalisé</div>
      <div>icon {toPercentString(props.scoreProgramme)} programmé</div>
    </div>
  );
};

export type TCinqEtoilesProps = {
  etoiles: number;
};

/**
 * Les étoiles affichées dans la colonne des informations relative au
 * référentiel.
 */
const CinqEtoiles = (props: TCinqEtoilesProps) => {
  const {etoiles} = props;

  return (
    <div className="flex flex-col">
      <div className="flex space-x-4">
        {NIVEAUX.map(niveau => {
          const obtenue = etoiles >= niveau;
          const Star = obtenue ? GreenStar : GreyStar;
          return <Star key={`n${niveau}`} title={''} />;
        })}
      </div>
    </div>
  );
};
