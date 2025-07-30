import { Meta } from '@storybook/nextjs';
import { avancementToLabel } from '../../app/labels';
import { actionAvancementColors } from '../../app/theme';
import ProgressBar from './progress-bar';

export default {
  component: ProgressBar,
} as Meta;

export const ToutFait = () => (
  <ProgressBar
    score={[
      {
        label: avancementToLabel.fait,
        value: 100,
        color: actionAvancementColors.fait,
      },
      {
        label: avancementToLabel.programme,
        value: 0,
        color: actionAvancementColors.programme,
      },
      {
        label: avancementToLabel.pas_fait,
        value: 0,
        color: actionAvancementColors.pas_fait,
      },
    ]}
    total={100}
    defaultScore={{
      label: avancementToLabel.non_renseigne,
      color: actionAvancementColors.non_renseigne,
    }}
  />
);

export const RienRenseigne = () => (
  <ProgressBar
    score={[
      {
        label: avancementToLabel.fait,
        value: 0,
        color: actionAvancementColors.fait,
      },
      {
        label: avancementToLabel.programme,
        value: 0,
        color: actionAvancementColors.programme,
      },
      {
        label: avancementToLabel.pas_fait,
        value: 0,
        color: actionAvancementColors.pas_fait,
      },
    ]}
    total={100}
    defaultScore={{
      label: avancementToLabel.non_renseigne,
      color: actionAvancementColors.non_renseigne,
    }}
  />
);

export const Mixte = () => (
  <ProgressBar
    score={[
      {
        label: avancementToLabel.fait,
        value: 20,
        color: actionAvancementColors.fait,
      },
      {
        label: avancementToLabel.programme,
        value: 28,
        color: actionAvancementColors.programme,
      },
      {
        label: avancementToLabel.pas_fait,
        value: 20,
        color: actionAvancementColors.pas_fait,
      },
    ]}
    total={100}
    defaultScore={{
      label: avancementToLabel.non_renseigne,
      color: actionAvancementColors.non_renseigne,
    }}
  />
);
