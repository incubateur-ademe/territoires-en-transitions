'use client';

import classNames from 'classnames';
import Section from './Section';
import {Button, ButtonVariant} from '@tet/ui';

type InfoSectionProps = {
  id?: string;
  content: string;
  buttons: {
    title: string;
    href: string;
    external?: boolean;
    variant?: ButtonVariant;
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
            <Button
              key={button.title}
              href={button.href}
              variant={button.variant}
              external={button.external}
              className={classNames(
                'max-md:w-full max-md:justify-center md:w-auto',
                button.className,
              )}
            >
              {button.title}
            </Button>
          ))}
      </div>
    </Section>
  );
};

export default InfoSection;
