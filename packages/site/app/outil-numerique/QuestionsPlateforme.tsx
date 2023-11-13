import Accordion from '@components/accordion/Accordion';
import Section from '@components/sections/Section';

const QuestionsPlateforme = () => {
  return (
    <Section containerClassName="bg-primary-0">
      <h2 className="text-center">Question fréquentes</h2>
      <Accordion
        id="1"
        title="Faut-il être engagé dans le programme Territoire Engagé Transition Ecologique pour pouvoir utiliser la plateforme ?"
        content="Non, ce n'est pas obligatoire. L'outil Territoires en Transitions est accessible gratuitement à toutes les collectivités sans distinction !"
      />
    </Section>
  );
};

export default QuestionsPlateforme;
