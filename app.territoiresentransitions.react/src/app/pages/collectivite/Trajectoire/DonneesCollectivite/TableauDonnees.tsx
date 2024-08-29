import classNames from 'classnames';
import {useDebouncedCallback} from 'use-debounce';
import {Table, THead, TBody, TRow, THeadCell, TCell, Input} from '@tet/ui';
import {
  getNomSource,
  IndicateurTrajectoire,
  SEQUESTRATION_CARBONE,
  SourceIndicateur,
} from '../constants';

type Source = {
  id: string;
  nom: string;
};

type Valeur = {
  id?: number;
  source: string;
  valeur: number | null;
};

type TableauDonneesProps = {
  /** secteurs à afficher dans le tableau */
  indicateur: IndicateurTrajectoire | typeof SEQUESTRATION_CARBONE;
  /** données sectorielles */
  valeursSecteurs: (
    | {
        identifiant: string;
        indicateur_id: number;
        valeurs: Valeur[];
      }
    | undefined
  )[];
  /** sources des données */
  sources: Source[];
  /** appelé lorsqu'un champ a été modifié */
  onChange: (args: {
    id?: number;
    indicateur_id: number;
    valeur: number | null;
  }) => void;
};

// pour formater les chiffres
const NumFormat = Intl.NumberFormat('fr', {maximumFractionDigits: 3});

/**
 * Affiche un tableau regroupant les valeurs open data et celles de la
 * collectivité. Ces dernières sont éditables.
 */
export const TableauDonnees = (props: TableauDonneesProps) => {
  const {indicateur, sources: sourcesDispo} = props;
  // pour toujours avoir la colonne "Données de la collectivité"
  // même si aucune donnée n'est encore disponible pour cette source
  const sources = sourcesDispo?.find(
    s => s.id === SourceIndicateur.COLLECTIVITE
  )
    ? sourcesDispo
    : [
        ...sourcesDispo,
        {
          id: SourceIndicateur.COLLECTIVITE,
          nom: getNomSource(SourceIndicateur.COLLECTIVITE),
        },
      ];

  return (
    <Table className="mt-7">
      <THead>
        <TRow>
          <THeadCell className="text-left uppercase">Secteur</THeadCell>
          {sources.map(source => (
            <THeadCell
              key={source.id}
              className={classNames('w-1/5', {
                uppercase: source.id !== 'collectivite',
              })}
            >
              {source.nom}
            </THeadCell>
          ))}
        </TRow>
      </THead>
      <TBody>
        {indicateur.secteurs.map(secteur => {
          return (
            <TRow key={secteur.identifiant}>
              <TCell variant="title">{secteur.nom}</TCell>
              {sources.map(source => (
                <CellNumber
                  {...props}
                  key={source.id}
                  identifiantSecteur={secteur.identifiant}
                  source={source}
                />
              ))}
            </TRow>
          );
        })}
      </TBody>
    </Table>
  );
};

type CellProps = TableauDonneesProps & {
  source: Source;
  identifiantSecteur: string;
};

// Affiche une cellule du tableau (chiffre ou champ de saisie)
const CellNumber = ({
  identifiantSecteur,
  valeursSecteurs,
  source,
  onChange,
}: CellProps) => {
  const {valeurs, indicateur_id} =
    valeursSecteurs?.find(v => v?.identifiant === identifiantSecteur) || {};

  const estSourceCollectivite = source.id === SourceIndicateur.COLLECTIVITE;

  const entry = valeurs?.find(v => v.source === source.id);
  const valNumber = entry?.valeur;
  const val = valNumber?.toString() ?? '';

  const handleChange = useDebouncedCallback(value => {
    return (
      indicateur_id &&
      onChange?.({
        id: entry?.id,
        indicateur_id,
        valeur: isNaN(value) ? null : value,
      })
    );
  }, 500);

  return (
    <TCell key={source.id} variant={estSourceCollectivite ? 'input' : 'number'}>
      {estSourceCollectivite ? (
        <Input
          type="number"
          numType="float"
          value={val}
          onValueChange={(values, sourceInfo) => {
            if (sourceInfo.source === 'event') {
              handleChange(values.floatValue);
            }
          }}
        />
      ) : typeof valNumber === 'number' ? (
        NumFormat.format(valNumber)
      ) : (
        '--'
      )}
    </TCell>
  );
};
