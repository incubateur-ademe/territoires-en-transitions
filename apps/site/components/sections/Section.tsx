import classNames from 'classnames';
import { JSX } from 'react';

type SectionProps = {
  id?: string;
  children: React.ReactNode;
  containerClassName?: string;
  className?: string;
};

const Section = ({
  id,
  children,
  containerClassName = '',
  className = '',
}: SectionProps): JSX.Element => (
  <section id={id} className={classNames('py-14', containerClassName)}>
    <div
      className={classNames(
        'max-w-8xl mx-auto px-4 lg:px-6 flex flex-col gap-4',
        className
      )}
    >
      {children}
    </div>
  </section>
);

export default Section;
