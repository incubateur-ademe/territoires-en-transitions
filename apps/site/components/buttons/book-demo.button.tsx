import { Button } from '@tet/ui';

export const BookDemoButton = ({
  label = 'Réserver une démo',
  href = 'https://calendly.com/territoiresentransitions/demo-fonctionnalite-plans-d-action',
}: {
  label?: string;
  href?: string;
}) => (
  <Button icon="calendar-2-line" variant="outlined" href={href}>
    {label}
  </Button>
);
