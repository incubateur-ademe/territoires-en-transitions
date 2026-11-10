import { avancementToLabel } from '@/app/app/labels';
import { actionAvancementColors } from '@/app/app/theme';
import { Meta } from '@storybook/nextjs-vite';
import { ActionTypeEnum } from '@tet/domain/referentiels';
import { ActionListItem } from '../actions/use-list-actions';
import ProgressBarWithTooltip from './progress-bar-with-tooltip';
import { ScoreProgressBar } from './score.progress-bar';

export default {
  component: ScoreProgressBar,
} as Meta;

// Score courant réel d'une collectivité dont la 3.3.5 est plafonnée par la 1.2.3 (44 %)
const rows = [
  {
    id: '3.3.5',
    nom: 'Valoriser les déchets',
    type: ActionTypeEnum.ACTION,
    pot: 2,
    fait: 0.88,
    prog: 0.04,
    pasFait: 0.54,
  },
  {
    id: '3.3.5.1',
    nom: 'Valoriser la matière',
    type: ActionTypeEnum.SOUS_ACTION,
    pot: 0.6,
    fait: 0.223,
    prog: 0,
    pasFait: 0.24,
  },
  {
    id: '3.3.5.2',
    nom: "Valoriser l'énergie issue de la gestion des déchets",
    type: ActionTypeEnum.SOUS_ACTION,
    pot: 0.6,
    fait: 0.31,
    prog: 0,
    pasFait: 0.1,
  },
  {
    id: '3.3.5.3',
    nom: 'Valoriser les biodéchets',
    type: ActionTypeEnum.SOUS_ACTION,
    pot: 0.8,
    fait: 0.347,
    prog: 0.04,
    pasFait: 0.2,
  },
];

const toAction = (r: (typeof rows)[number]) =>
  ({
    identifiant: r.id,
    actionType: r.type,
    score: {
      actionId: `cae_${r.id}`,
      concerne: true,
      pointPotentiel: r.pot,
      pointFait: r.fait,
      pointProgramme: r.prog,
      pointPasFait: r.pasFait,
      pointNonRenseigne: 0,
    },
  } as unknown as ActionListItem);

const Avant = ({ r }: { r: (typeof rows)[number] }) => (
  <ProgressBarWithTooltip
    score={[
      {
        label: avancementToLabel.fait,
        value: r.fait,
        color: actionAvancementColors.fait,
      },
      {
        label: avancementToLabel.programme,
        value: r.prog,
        color: actionAvancementColors.programme,
      },
      {
        label: avancementToLabel.pas_fait,
        value: r.pasFait,
        color: actionAvancementColors.pas_fait,
      },
    ]}
    total={r.pot}
    defaultScore={{
      label: avancementToLabel.non_renseigne,
      color: actionAvancementColors.non_renseigne,
    }}
  />
);

export const PlafonnementAvantApres = () => (
  <table className="text-sm border-separate border-spacing-x-6 border-spacing-y-3">
    <thead>
      <tr className="text-left">
        <th>Mesure</th>
        <th className="w-64">Avant (gris « non renseigné »)</th>
        <th className="w-64">Après (segment plafonné)</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((r) => (
        <tr key={r.id}>
          <td className="text-primary-9">
            {r.id} - {r.nom}
          </td>
          <td>
            <Avant r={r} />
          </td>
          <td>
            <ScoreProgressBar action={toAction(r)} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
