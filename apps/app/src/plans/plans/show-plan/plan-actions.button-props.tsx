'use client';

import { appLabels } from '@/app/labels/catalog';
import { ButtonProps } from '@tet/ui';

export const addAxeButtonProps: ButtonProps = {
  children: appLabels.creerAxe,
  dataTest: 'AjouterAxe',
  variant: 'outlined',
  size: 'sm',
};

export const createFicheResumeButtonProps: ButtonProps = {
  children: appLabels.creerAction,
  size: 'sm',
};
