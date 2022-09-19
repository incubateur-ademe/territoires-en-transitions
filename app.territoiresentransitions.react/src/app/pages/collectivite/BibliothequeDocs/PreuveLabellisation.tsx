import {referentielToName} from 'app/labels';
import {Fragment} from 'react';
import {Referentiel} from 'types/litterals';
import {EditablePreuveDoc} from 'ui/shared/preuves/Bibliotheque/PreuveDoc';
import {TPreuveLabellisation} from 'ui/shared/preuves/Bibliotheque/types';
import {numLabels} from '../ParcoursLabellisation/numLabels';

export const PreuvesLabellisation = ({
  preuves,
}: {
  preuves: TPreuveLabellisation[];
}) => {
  const parReferentiel = groupByReferentielEtEtoile(preuves);
  return (
    <>
      {Object.entries(parReferentiel).map(
        ([referentiel, preuvesReferentiel]) => {
          const parEtoile = Object.values(preuvesReferentiel);
          return (
            <Fragment key={referentiel}>
              <h2>
                Documents de labellisation - Référentiel{' '}
                {referentielToName[referentiel as Referentiel]}
              </h2>
              {parEtoile.map(preuvesEtoile => {
                const {
                  demande: {date, etoiles, en_cours},
                } = preuvesEtoile[0];
                const annee = new Date(date).getFullYear();
                const etoile = numLabels[etoiles] as string;
                return (
                  <Fragment key={etoile}>
                    <h3>
                      {annee} - <span className="capitalize">{etoile}</span>{' '}
                      étoile {en_cours ? '(en cours)' : ''}
                    </h3>
                    {preuvesEtoile.map(preuve => (
                      <EditablePreuveDoc
                        key={preuve.id}
                        preuve={preuve}
                        readonly={!preuve.demande?.en_cours}
                        classComment="pb-0 mb-2"
                      />
                    ))}
                  </Fragment>
                );
              })}
            </Fragment>
          );
        }
      )}
    </>
  );
};

// groupe les preuves par référentiel
type TPreuvesParReferentiel = Record<Referentiel, TPreuveLabellisation[]>;
const groupByReferentiel = (
  preuves: TPreuveLabellisation[]
): TPreuvesParReferentiel =>
  preuves.reduce(
    (dict, preuve) => ({
      ...dict,
      [preuve.demande.referentiel]: [
        ...(dict[preuve.demande.referentiel] || []),
        preuve,
      ],
    }),
    {} as TPreuvesParReferentiel
  );

// groupe les preuves par étoile demandée
type TPreuvesParEtoile = Record<string, TPreuveLabellisation[]>;
const groupByEtoile = (preuves: TPreuveLabellisation[]): TPreuvesParEtoile =>
  preuves.reduce(
    (dict, preuve) => ({
      ...dict,
      [preuve.demande.etoiles]: [
        ...(dict[preuve.demande.etoiles] || []),
        preuve,
      ],
    }),
    {} as TPreuvesParEtoile
  );

// groupe les preuves par référentiel et par étoile demandée
type TPreuvesParReferentielEtEtoile = Record<
  string,
  Record<string, TPreuveLabellisation[]>
>;
const groupByReferentielEtEtoile = (
  preuves: TPreuveLabellisation[]
): TPreuvesParReferentielEtEtoile => {
  return Object.entries(groupByReferentiel(preuves)).reduce(
    (dict, [referentiel, preuvesReferentiel]) => ({
      ...dict,
      [referentiel]: groupByEtoile(preuvesReferentiel),
    }),
    {} as TPreuvesParReferentielEtEtoile
  );
};
