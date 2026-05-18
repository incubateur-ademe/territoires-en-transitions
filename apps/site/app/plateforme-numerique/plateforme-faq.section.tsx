import Section from '@/site/components/sections/Section';
import { TitreSection } from '@/site/components/sections/TitreSection';
import { Accordion } from '@tet/ui';

const ContentContainer = ({ children }: { children: React.ReactNode }) => {
  return <div className="px-8 pt-4">{children}</div>;
};

const questions = [
  {
    question: 'L’outil est-il vraiment gratuit ?',
    answer: (
      <ContentContainer>
        <p>
          Oui. L’utilisation de Territoires en Transitions est gratuite pour les
          collectivités.
        </p>
        <p>
          La plateforme vise à aider les collectivités à piloter leurs actions
          de transition écologique, à suivre leurs plans d’action et à valoriser
          leur progression.
        </p>
      </ContentContainer>
    ),
  },
  {
    question: 'Puis-je importer mes plans existants ?',
    answer: (
      <ContentContainer>
        <p>
          Oui. Si vous avez déjà un plan d’action, deux options principales
          permettent de le mettre en ligne sur Territoires en Transitions :
        </p>
        <ul className="list-disc list-inside">
          <li>
            utiliser le modèle d’import Excel disponible, puis nous le renvoyer
            une fois complété.
          </li>
          <li>renseigner directement votre plan dans la plateforme.</li>
        </ul>
        <p>
          Le modèle d’import Excel permet de reprendre les informations
          principales et la structure de votre plan existant. Une fois le
          fichier complété, nous nous occupons de l’importer dans la plateforme.
        </p>
        <p>
          Vous pourrez ensuite compléter progressivement vos actions directement
          en ligne avec les informations utiles au pilotage : indicateurs,
          personnes pilotes, statuts d’avancement, liens avec les référentiels,
          budgets, financeurs, etc.
        </p>
      </ContentContainer>
    ),
  },
  {
    question: 'Ai-je besoin d’une formation ?',
    answer: (
      <ContentContainer>
        <p>
          Non, vous pouvez commencer à utiliser la plateforme dès votre
          inscription, qui se fait en autonomie. Des ressources sont disponibles
          pour vous guider à chaque étape dans le Centre d’aide de la
          plateforme.
        </p>
        <p>
          L’équipe anime également des démos chaque semaine pour accompagner les
          collectivités dans la découverte et la prise en main de la plateforme.
        </p>
      </ContentContainer>
    ),
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer: (
      <ContentContainer>
        <p>
          Oui. Les données personnelles sont traitées conformément au RGPD et
          accessibles uniquement aux personnes et prestataires habilités, dans
          le cadre de l’administration, de la gestion et de l’amélioration du
          service.
        </p>
        <p>
          Vous disposez de droits sur vos données personnelles, notamment un
          droit d’accès, de rectification, de limitation et d’opposition. Ces
          droits peuvent être exercés à l’adresse : rgpd@ademe.fr.
        </p>
      </ContentContainer>
    ),
  },
];

export const PlateformeFAQSection = async () => {
  return (
    <Section containerClassName="bg-primary-1 border-y border-primary-3">
      <TitreSection>Questions fréquentes</TitreSection>
      <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">
        {questions.map((question) => (
          <Accordion
            key={question.question}
            title={question.question}
            content={question.answer}
            containerClassname="p-4 border bg-white rounded-xl"
            headerClassname="py-2 text-primary-10 font-medium"
          />
        ))}
      </div>
    </Section>
  );
};
