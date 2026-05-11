import Section from '@/site/components/sections/Section';
import { Metadata } from 'next';
import { STREAMLIT_IMPACT_IFRAME_SRC } from './streamlit.utils';

export const metadata: Metadata = {
  title: 'Matrice d’impact',
};

export default function MatriceImpactPage() {
  return (
    <>
      <Section containerClassName="bg-primary-1">
        <h1>Matrice d&apos;impact</h1>
        <p>
          Visualisez les chiffres clés de la matrice d&apos;impact du service
          numérique.
        </p>
      </Section>
      <Section>
        <div className="w-full h-[4100px]">
          <iframe
            title="Matrice d'impact Territoires en Transitions"
            src={STREAMLIT_IMPACT_IFRAME_SRC}
            className="w-full h-full border-0"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </Section>
    </>
  );
}
