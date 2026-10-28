import { Box, Stack } from '@tet/ui';

/**
 * Proposition : nouveau composant
 * Besoin : un chiffre clé avec son libellé (budget total, consommé…) ; le
 * design system n'a pas de carte de statistique.
 */
export const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <Box padding="lg" className="rounded-lg border border-grey-3">
    <Stack gap="xs">
      <span className="text-sm text-grey-8">{label}</span>
      <span className="text-2xl font-bold text-primary-9">{value}</span>
    </Stack>
  </Box>
);
