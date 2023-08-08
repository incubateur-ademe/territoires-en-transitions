import ButtonWithLink from '@components/buttons/ButtonWithLink';
import classNames from 'classnames';
import PictoWithBackground from 'public/pictogrammes/PictoWithBackground';
import Section from './Section';

type InfoSectionProps = {
  id?: string;
  content: string;
  pictogram: React.ReactNode;
  button: {title: string; href: string};
  customBackground?: string;
  customTextStyle?: string;
};

const InfoSection = ({
  id,
  content,
  pictogram,
  button,
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
        <ButtonWithLink href={button.href}>{button.title}</ButtonWithLink>
      </div>
    </Section>
  );
};

export default InfoSection;
