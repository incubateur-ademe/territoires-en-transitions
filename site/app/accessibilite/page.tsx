import dynamic from 'next/dynamic';

export default function Page() {
  const Content = dynamic(import('./accessibilite.mdx'));

  return (
    <div className="fr-container">
      <div className="fr-mt-1w fr-mt-md-4w fr-mb-5w">
        <h1 className="fr-header__body">Déclaration d’accessibilité</h1>
        <Content />
      </div>
    </div>
  );
}
