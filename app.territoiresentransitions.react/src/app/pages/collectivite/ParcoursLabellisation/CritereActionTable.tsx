import './CritereActionTable.css';
import {CritereLabellisationListeActions} from './types';

export type TCritereActionTableProps = CritereLabellisationListeActions & {
  className?: string;
  onClickRow: (action_id: string) => void;
};

/**
 * Affiche le tableau des critères associés à des actions
 */
export const CritereActionTable = (props: TCritereActionTableProps) => {
  const {className, criteres} = props;
  return (
    <div className={`critere-action-table ${className || ''}`}>
      <table>
        <thead>
          <tr>
            <th className="pl-10" colSpan={3}>
              Sous-action ou tâche
            </th>
            <th className="pr-6">Statut ou score requis</th>
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
  const {action_id, formulation, statut_ou_score, rempli} = criteres[rowIndex];

  // extrait l'id d'action sans le préfixe
  const actionId = action_id.split('_').pop();

  return (
    <tr onClick={() => onClickRow(action_id)}>
      <td className="text-center w-[56px]">
        {rempli ? (
          <i className="fr-icon fr-fi-checkbox-circle-fill before:text-[#5FD68C]" />
        ) : null}
      </td>
      <td className="text-right text-xs w-[40px] text-grey625">
        <span>{actionId}</span>
      </td>
      <td className="pl-4 pr-8">{formulation}</td>
      <td>{statut_ou_score}</td>
    </tr>
  );
};
