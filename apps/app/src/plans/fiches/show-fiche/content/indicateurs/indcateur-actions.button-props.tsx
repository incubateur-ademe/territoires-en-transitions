import { appLabels } from '@/app/labels/catalog';
import { ButtonProps } from '@tet/ui';

export const linkIndicateursButtonProps: ButtonProps = {
  icon: 'link',
  variant: 'primary',
  size: 'xs',
  children: appLabels.lierIndicateurExistant,
};

export const createIndicateurButtonProps: ButtonProps = {
  icon: 'file-add-line',
  variant: 'outlined',
  size: 'xs',
  children: appLabels.creerIndicateur,
};
