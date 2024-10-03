import classNames from 'classnames';
import Section from './Section';

type CardsSectionProps = {
  id?: string;
  title?: string;
  subtitle?: string;
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
  subtitle,
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
    {!!title && (
      <h2
        className={classNames(
          'text-primary-8 text-center max-md:mb-2',
          textClassname,
        )}
      >
        {title}
      </h2>
    )}
    {!!subtitle && (
      <h3 className="text-primary-9 text-center mb-4">{subtitle}</h3>
    )}
    {!!description && (
      <p className={classNames('text-xl', textClassname)}>{description}</p>
    )}
    {cardsList}
    {children}
  </Section>
);

export default CardsSection;
