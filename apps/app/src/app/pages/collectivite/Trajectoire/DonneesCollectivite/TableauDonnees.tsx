import { IndicateurSourceEnum } from '@tet/domain/indicateurs';
import {
  Input,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { getNomSource } from '../../../../../indicateurs/trajectoires/trajectoire-constants';
import { appLabels } from '@/app/labels/catalog';

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
    (s) => s.id === IndicateurSourceEnum.COLLECTIVITE
  )
    ? sourcesDispo
    : [
        ...sourcesDispo,
        {
          id: IndicateurSourceEnum.COLLECTIVITE,
          nom: getNomSource(IndicateurSourceEnum.COLLECTIVITE),
        },
      ];

  return (
    <div className="mt-7 overflow-x-auto rounded-xl border border-grey-3">
      <Table className="table-auto">
        <TableHead>
          <tr>
            <TableHeaderCell title={appLabels.secteur} />
            {sources.map((source) => (
              <TableHeaderCell
                key={source.id}
                className="w-1/5"
                align="center"
                title={source.nom}
                titleClassName={cn({
                  'normal-case':
                    source.id === IndicateurSourceEnum.COLLECTIVITE,
                })}
              />
            ))}
          </tr>
        </TableHead>
        <tbody>
          {secteurs.map((secteur) => (
            <TableRow key={secteur.identifiant}>
              <TableCell className="font-bold text-primary-10">
                {secteur.nom}
              </TableCell>
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
            </TableRow>
          ))}
        </tbody>
      </Table>
    </div>
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

  const estSourceCollectivite = source.id === IndicateurSourceEnum.COLLECTIVITE;

  const entry = valeurs?.find((v) => v.source === source.id);
  const valNumber = entry?.valeur;
  const val = valNumber?.toString() ?? '';

  return (
    <TableCell
      className={cn({
        'py-1': estSourceCollectivite,
        'text-center font-bold text-primary-8': !estSourceCollectivite,
      })}
    >
      {estSourceCollectivite ? (
        <Input
          type="number"
          numType="float"
          value={val}
          onBlur={(e) => {
            if (!indicateurId) {
              console.error(
                `[Trajectoire SNBC] Saisie ignorée pour le secteur "${identifiantSecteur}" : aucun indicateur lié.`
              );
              return;
            }
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
          }}
        />
      ) : typeof valNumber === 'number' ? (
        NumFormat.format(valNumber)
      ) : (
        '--'
      )}
    </TableCell>
  );
};
