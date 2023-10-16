import classNames from 'classnames';
import Section from './Section';

type CardsSectionProps = {
  id?: string;
  title: string;
  textClassname?: string;
  description?: string;
  cardsList: React.ReactNode;
  children?: React.ReactNode;
  containerClassName?: string;
  className?: string;
};

const CardsSection = ({
  id,
  title,
  textClassname,
  description,
  cardsList,
  children,
  containerClassName,
  className,
}: CardsSectionProps) => (
  <Section
    id={id}
    containerClassName={classNames(containerClassName)}
    className={classNames(className)}
  >
    <h2 className={textClassname}>{title}</h2>
    {description && (
      <p className={classNames('text-xl', textClassname)}>{description}</p>
    )}
    {cardsList}
    {children}
  </Section>
);

export default CardsSection;
