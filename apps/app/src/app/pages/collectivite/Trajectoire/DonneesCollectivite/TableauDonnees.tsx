import { SourceIndicateur } from '@/domain/indicateurs';
import {
  DEPRECATED_Table,
  DEPRECATED_TBody,
  DEPRECATED_TCell,
  DEPRECATED_THead,
  DEPRECATED_THeadCell,
  DEPRECATED_TRow,
  Input,
} from '@/ui';
import classNames from 'classnames';
import { getNomSource } from '../../../../../indicateurs/trajectoires/trajectoire-constants';

type Source = {
  id: string;
  nom: string;
};

type Valeur = {
  id?: number;
  source: string;
  valeur: number | null;
};

export type Secteur = {
  identifiant: string;
  nom: string;
};

type TableauDonneesProps = {
  /** secteurs à afficher dans le tableau */
  secteurs: Secteur[];
  /** données sectorielles */
  valeursSecteurs: {
    secteurId: string;
    indicateurId: number;
    valeurs: Valeur[];
  }[];
  /** sources des données */
  sources: Source[];
  /** appelé lorsqu'un champ a été modifié */
  onChange: (args: {
    id?: number;
    indicateurId: number;
    valeur: number | null;
  }) => void;
};

// pour formater les chiffres
const NumFormat = Intl.NumberFormat('fr', { maximumFractionDigits: 3 });

/**
 * Affiche un tableau regroupant les valeurs open data et celles de la
 * collectivité. Ces dernières sont éditables.
 */
export const TableauDonnees = (props: TableauDonneesProps) => {
  const { secteurs, sources: sourcesDispo, valeursSecteurs, onChange } = props;
  // pour toujours avoir la colonne "Données de la collectivité"
  // même si aucune donnée n'est encore disponible pour cette source
  const sources = sourcesDispo?.find(
    (s) => s.id === SourceIndicateur.COLLECTIVITE
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
    <DEPRECATED_Table className="mt-7">
      <DEPRECATED_THead>
        <DEPRECATED_TRow>
          <DEPRECATED_THeadCell className="text-left uppercase">
            Secteur
          </DEPRECATED_THeadCell>
          {sources.map((source) => (
            <DEPRECATED_THeadCell
              key={source.id}
              className={classNames('w-1/5', {
                uppercase: source.id !== 'collectivite',
              })}
            >
              {source.nom}
            </DEPRECATED_THeadCell>
          ))}
        </DEPRECATED_TRow>
      </DEPRECATED_THead>
      <DEPRECATED_TBody>
        {secteurs.map((secteur) => {
          return (
            <DEPRECATED_TRow key={secteur.identifiant}>
              <DEPRECATED_TCell variant="title">{secteur.nom}</DEPRECATED_TCell>
              {sources.map((source) => (
                <CellNumber
                  secteurs={secteurs}
                  sources={sources}
                  valeursSecteurs={valeursSecteurs}
                  onChange={onChange}
                  key={source.id}
                  identifiantSecteur={secteur.identifiant}
                  source={source}
                />
              ))}
            </DEPRECATED_TRow>
          );
        })}
      </DEPRECATED_TBody>
    </DEPRECATED_Table>
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
  const { valeurs, indicateurId } =
    valeursSecteurs?.find((v) => v?.secteurId === identifiantSecteur) || {};

  const estSourceCollectivite = source.id === SourceIndicateur.COLLECTIVITE;

  const entry = valeurs?.find((v) => v.source === source.id);
  const valNumber = entry?.valeur;
  const val = valNumber?.toString() ?? '';

  return (
    <DEPRECATED_TCell
      key={source.id}
      variant={estSourceCollectivite ? 'input' : 'number'}
    >
      {estSourceCollectivite ? (
        <Input
          type="number"
          numType="float"
          value={val}
          onBlur={(e) => {
            if (indicateurId) {
              const value = parseFloat(
                e.currentTarget.value
                  .trim()
                  .replaceAll(',', '.')
                  .replaceAll(' ', '')
              );
              onChange?.({
                id: entry?.id,
                indicateurId,
                valeur: isNaN(value) ? null : value,
              });
            }
          }}
        />
      ) : typeof valNumber === 'number' ? (
        NumFormat.format(valNumber)
      ) : (
        '--'
      )}
    </DEPRECATED_TCell>
  );
};
