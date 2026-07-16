import { Button } from '@tet/ui';
import { RiCalendar2Line } from '@remixicon/react';

export const BookDemoButton = () => (
  <Button
    icon={<RiCalendar2Line />}
    variant="outlined"
    href="https://calendly.com/territoiresentransitions/demo-fonctionnalite-plans-d-action"
  >
    Réserver une démo
  </Button>
);
