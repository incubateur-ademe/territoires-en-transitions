import { appLabels } from '@/app/labels/catalog';
import { ButtonProps } from '@tet/ui';
import { RiFileAddLine, RiLink } from '@remixicon/react';

export const linkIndicateursButtonProps: ButtonProps = {
  icon: <RiLink />,
  variant: 'primary',
  size: 'xs',
  children: appLabels.lierIndicateurExistant,
};

export const createIndicateurButtonProps: ButtonProps = {
  icon: <RiFileAddLine />,
  variant: 'outlined',
  size: 'xs',
  children: appLabels.creerIndicateur,
};
