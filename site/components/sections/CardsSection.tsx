import Section from './Section';

type CardsSectionProps = {
  id?: string;
  title: string;
  description?: string;
  cardsList: React.ReactNode;
  children?: React.ReactNode;
  customBackground?: string;
};

const CardsSection = ({
  id,
  title,
  description,
  cardsList,
  children,
  customBackground,
}: CardsSectionProps) => (
  <Section id={id} className="flex-col" customBackground={customBackground}>
    <h3>{title}</h3>
    {description && <p className="text-xl">{description}</p>}
    {cardsList}
    {children}
  </Section>
);

export default CardsSection;
