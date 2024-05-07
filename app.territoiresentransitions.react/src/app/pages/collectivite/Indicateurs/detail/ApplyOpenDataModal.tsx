import {Alert, Checkbox} from '@tet/ui';
import {OpenDataComparaison} from './useApplyOpenData';
import {SourceType, TIndicateurDefinition} from '../types';
import {SOURCE_TYPE_LABEL} from '../constants';
import classNames from 'classnames';

export type Props = {
  /** Indicateur concerné */
  definition: TIndicateurDefinition;
  /** Comparaison entre les données de la collectivité et celles à appliquer */
  comparaison: OpenDataComparaison;
  /** Informations sur la source de données à appliquer */
  source: {
    type: SourceType;
    id: string;
    nom: string;
  };
  /** Indique si les données en conflit doivent être écrasées */
  overwrite: boolean;
  /** Appeler pour changer le flag indiquant si les données en conflit doivent être écrasées */
  setOverwrite: (value: boolean) => void;
};

// pour formater les chiffres
const NumFormat = Intl.NumberFormat('fr', {maximumFractionDigits: 3});

/**
 * Affiche le contenu de la modale de confirmation avant écrasement des données
 * utilisateur par les données importées.
 */
export const ApplyOpenDataModal = ({
  definition,
  comparaison,
  source,
  overwrite,
  setOverwrite,
}: Props) => {
  if (!comparaison || !source || !definition) return;

  const {lignes, conflits} = comparaison;
  const {type, nom} = source;
  const sourceType = SOURCE_TYPE_LABEL[type];

  return (
    <>
      {!!conflits && (
        <>
          <Alert
            state="warning"
            title="Conflit détecté"
            description={`Vous êtes sur le point d’appliquer les « ${sourceType} ${nom} » à vos ${sourceType}.
            Attention : certaines données des « ${sourceType} ${nom} » entrent en conflit avec vos ${sourceType} et ont des valeurs différentes.`}
          />
          <Checkbox
            id="replace-data"
            label={`Remplacer mes ${sourceType} en cours par les ${sourceType} ${nom}`}
            checked={overwrite}
            onChange={() => setOverwrite(!overwrite)}
          />
        </>
      )}
      <div className="flex flex-wrap gap-4 w-full">
        <table className="fr-table fr-table--bordered grow md:max-w-[calc(68%-1rem)]">
          <thead>
            <tr>
              <th scope="col" className="whitespace-break-spaces">
                Date{`\n`}
              </th>
              <th scope="col">
                Mes {sourceType}
                <span className="font-normal"> ({definition.unite})</span>
              </th>
              <th scope="col">
                <span className="capitalize">{sourceType}</span> {nom}
                <span className="font-normal"> ({definition.unite})</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lignes.map(({annee, valeur, nouvelleValeur, conflit}) => (
              <tr key={annee}>
                <td>{annee}</td>
                <td
                  className={classNames({
                    'line-through': conflit && overwrite,
                  })}
                >
                  {valeur === null || isNaN(valeur)
                    ? ''
                    : NumFormat.format(valeur)}
                </td>
                <td>{NumFormat.format(nouvelleValeur ?? valeur)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="fr-table fr-table--bordered fr-table--blue-ecume md:max-w-[32%]">
          <thead>
            <tr>
              <th className="whitespace-break-spaces !text-center !px-8 !py-[0.31rem]">
                Après validation{`\n`}
                <span className="capitalize">
                  {sourceType} {nom}
                </span>
                <span className="font-normal"> ({definition.unite})</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lignes.map(({annee, valeur, nouvelleValeur, conflit}) => {
              const v = !conflit || overwrite ? nouvelleValeur : valeur;
              return (
                <tr key={annee}>
                  <td>{isNaN(v) ? <>&nbsp;</> : NumFormat.format(v)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};
