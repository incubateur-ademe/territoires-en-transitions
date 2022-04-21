import './CritereActionTable.css';
import {CritereLabellisationListeActions} from './types';

export type TCritereActionTableProps = CritereLabellisationListeActions & {
  onClickRow: (action_id: string) => void;
};

/**
 * Affiche le tableau des critères associés à des actions
 */
export const CritereActionTable = (props: TCritereActionTableProps) => {
  const {criteres} = props;
  return (
    <div className="critere-action-table">
      <table>
        <thead>
          <tr>
            <th className="pl-10" colSpan={2}>
              Sous-action ou tâche
            </th>
            <th>Statut ou score requis</th>
          </tr>
        </thead>
        <tbody>
          {criteres.map(({id}, index) => (
            <CritereActionRow key={id} rowIndex={index} {...props} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** Affiche une ligne du tableau */
const CritereActionRow = (
  props: TCritereActionTableProps & {rowIndex: number}
) => {
  const {rowIndex, criteres, onClickRow} = props;
  const {action_id, formulation, statut_ou_score} = criteres[rowIndex];

  // extrait l'id d'action sans le préfixe
  const actionId = action_id.split('_').pop();

  return (
    <tr onClick={() => onClickRow(action_id)}>
      <td className="pl-10 text-right text-xs w-12 text-grey625">
        <span className="pl-2">{actionId}</span>
      </td>
      <td className="pl-4">{formulation}</td>
      <td>{statut_ou_score}</td>
    </tr>
  );
};
