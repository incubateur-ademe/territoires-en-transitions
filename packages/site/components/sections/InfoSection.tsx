import ButtonWithLink from '@components/buttons/ButtonWithLink';
import classNames from 'classnames';
import Section from './Section';

type InfoSectionProps = {
  id?: string;
  content: string;
  buttons: {
    title: string;
    href: string;
    secondary?: boolean;
    tertiary?: boolean;
    external?: boolean;
    className?: string;
  }[];
};

const InfoSection = ({id, content, buttons}: InfoSectionProps) => {
  return (
    <Section
      id={id}
      className="items-center justify-center !gap-8"
      containerClassName="bg-primary-7"
    >
      <h2 className="text-white text-center mb-0">{content}</h2>
      <div className="w-full flex flex-wrap items-stretch justify-center gap-6">
        {buttons.length > 0 &&
          buttons.map(button => (
            <ButtonWithLink
              key={button.title}
              className={classNames(
                '!m-0 !w-full md:!w-auto',
                button.className,
              )}
              href={button.href}
              secondary={button.secondary}
              tertiary={button.tertiary}
              external={button.external}
            >
              {button.title}
            </ButtonWithLink>
          ))}
      </div>
    </Section>
  );
};

export default InfoSection;
