import ButtonWithLink from '@components/buttons/ButtonWithLink';
import classNames from 'classnames';
import PictoWithBackground from 'public/pictogrammes/PictoWithBackground';
import Section from './Section';

type InfoSectionProps = {
  id?: string;
  content: string;
  pictogram: React.ReactNode;
  buttons: {
    title: string;
    href: string;
    secondary?: boolean;
    external?: boolean;
  }[];
  customBackground?: string;
  customTextStyle?: string;
};

const InfoSection = ({
  id,
  content,
  pictogram,
  buttons,
  customBackground,
  customTextStyle,
}: InfoSectionProps) => {
  return (
    <Section
      id={id}
      className="items-center lg:px-52 !gap-10 flex-col lg:flex-row"
      customBackground={customBackground}
    >
      <PictoWithBackground pictogram={pictogram} />
      <div className="text-center lg:text-left">
        <p className={classNames('text-xl', customTextStyle)}>{content}</p>
        <div className="fr-btns-group fr-btns-group--inline-md justify-center lg:justify-start">
          {buttons.length > 0 &&
            buttons.map(button => (
              <ButtonWithLink
                key={button.title}
                href={button.href}
                secondary={button.secondary}
                external={button.external}
              >
                {button.title}
              </ButtonWithLink>
            ))}
        </div>
      </div>
    </Section>
  );
};

export default InfoSection;
