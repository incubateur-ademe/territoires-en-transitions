import { Card, Paragraph, Title } from '@/app/ui/export-pdf/components';

type CalendrierProps = {
  justificationCalendrier?: string | null;
};

const Calendrier = ({ justificationCalendrier }: CalendrierProps) => {
  if (!justificationCalendrier) return null;

  return (
    <Card gap={2}>
      <Title variant="h6" className="uppercase text-[0.7rem]">
        Calendrier :
      </Title>
      <Paragraph className="text-[0.65rem]">
        {justificationCalendrier}
      </Paragraph>
    </Card>
  );
};

export default Calendrier;
