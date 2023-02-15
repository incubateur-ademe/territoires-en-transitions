import dynamic from 'next/dynamic';

export default function Page() {
  const CGU = dynamic(import('./cgu.mdx'));

  return (
    <div className="fr-container">
      <div className="fr-mt-1w fr-mt-md-4w fr-mb-5w">
        <h1 className="fr-header__body">Conditions générales d’utilisation</h1>
        <CGU />
      </div>
    </div>
  );
}
