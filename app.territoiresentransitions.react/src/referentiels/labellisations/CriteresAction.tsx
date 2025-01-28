import { referentielToName } from '@/app/app/labels';
import { makeReferentielTacheUrl } from '@/app/app/paths';
import { TLabellisationParcours } from '@/app/referentiels/labellisations/types';
import classNames from 'classnames';
import './CriteresAction.css';

export type TCriteresActionProps = {
  collectiviteId: number;
  parcours: TLabellisationParcours;
};

type TCriteresActionTable = TCriteresActionProps;

/**
 * Affiche les critères liés aux actions
 */
export const CriteresAction = (props: TCriteresActionProps) => {
  const { parcours } = props;
  const { referentiel } = parcours;

  return (
    <>
      <li className=" fr-mt-2w fr-mb-1w">
        Être une collectivité engagée dans une politique{' '}
        {referentielToName[referentiel]} et le prouver (via les documents
        preuves ou un texte justificatif)
      </li>
      <CritereActionTable {...props} />
    </>
  );
};

/**
 * Affiche le tableau des critères liés aux actions
 */
export const CritereActionTable = (props: TCriteresActionTable) => {
  const { parcours } = props;
  const { criteres_action } = parcours;

  return (
    <div className="critere-action-table fr-my-4">
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
          {criteres_action.map((c, index) => (
            <CritereActionRow
              key={`${c.etoile}.${index + 1}`}
              rowIndex={index}
              {...props}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** Affiche une ligne du tableau */
const CritereActionRow = (
  props: TCriteresActionTable & { rowIndex: number }
) => {
  const { collectiviteId, rowIndex, parcours } = props;
  const { criteres_action, referentiel } = parcours;
  const action = criteres_action[rowIndex];
  const {
    action_id,
    action_identifiant,
    formulation,
    statut_ou_score,
    rempli,
  } = action;

  const pathname = makeReferentielTacheUrl({
    collectiviteId,
    referentielId: referentiel,
    actionId: action_id,
  });

  return (
    <tr>
      <td className="text-center w-[56px]">
        <span
          className={classNames('fr-icon fr-icon-checkbox-circle-fill', {
            'text-success': rempli,
            'text-[#eee]': !rempli,
          })}
        />
      </td>
      <td className="text-right text-xs w-[40px] text-grey-6">
        <span>{action_identifiant}</span>
      </td>
      <td className="pl-4 pr-8">
        <a
          href={pathname}
          target="_blank"
          className="hover:underline"
          rel="noreferrer"
        >
          {formulation}
        </a>
      </td>
      <td>{statut_ou_score}</td>
    </tr>
  );
};
