/* eslint-disable react/no-unescaped-entities */
import Section from '@components/sections/Section';
import AstronautCat from 'public/pictogrammes/AstronautCat';

const NoResult = () => {
  return (
    <Section className="flex-col items-center md:pt-24">
      <h4 className="text-center">
        Oups... La page que vous cherchez n'a pas pu être chargée !
      </h4>
      <AstronautCat className="max-h-[500px]" />
    </Section>
  );
};

export default NoResult;
