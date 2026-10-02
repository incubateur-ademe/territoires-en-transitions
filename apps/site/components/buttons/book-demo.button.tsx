import { Button } from '@tet/ui';

export const BookDemoButton = ({
  label = 'Réserver une démo',
}: {
  label?: string;
}) => (
  <Button
    icon="calendar-2-line"
    variant="outlined"
    href="https://calendly.com/territoiresentransitions/demo-fonctionnalite-plans-d-action"
  >
    {label}
  </Button>
);
