import { Card, Stack } from '@tet/ui';
import { ReactNode } from 'react';

/**
 * Proposition : nouveau composant
 * Besoin : un chiffre clé (libellé, grande valeur, élément de contexte,
 * légende) dans une carte ; le design system n'a pas de carte de statistique.
 */
export const KpiCard = ({
  label,
  value,
  caption,
  children,
}: {
  label: string;
  value: string;
  caption: string;
  /** Barre de progression ou badge sous la valeur. */
  children?: ReactNode;
}) => (
  <Card>
    <Stack gap="sm" className="font-normal">
      <span className="text-sm text-grey-8">{label}</span>
      <span className="text-3xl font-bold text-primary-9">{value}</span>
      {children}
      <span className="text-sm text-grey-8">{caption}</span>
    </Stack>
  </Card>
);
