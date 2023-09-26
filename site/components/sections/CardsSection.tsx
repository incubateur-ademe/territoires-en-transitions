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
  <Section id={id} customBackground={customBackground}>
    <h2>{title}</h2>
    {description && <p className="text-xl">{description}</p>}
    {cardsList}
    {children}
  </Section>
);

export default CardsSection;
