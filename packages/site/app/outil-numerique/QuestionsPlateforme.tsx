import Accordion from '@components/accordion/Accordion';
import Section from '@components/sections/Section';

type QuestionsPlateformeProps = {
  titre: string;
  liste: {
    id: number;
    titre: string;
    contenu: string;
  }[];
};

const QuestionsPlateforme = ({titre, liste}: QuestionsPlateformeProps) => {
  return (
    <Section containerClassName="bg-primary-0">
      <h2 className="text-center">{titre}</h2>
      <div>
        {liste.map(l => (
          <Accordion
            key={l.id}
            id={l.id.toString()}
            title={l.titre}
            content={l.contenu}
          />
        ))}
      </div>
    </Section>
  );
};

export default QuestionsPlateforme;
