import {fr} from '@codegouvfr/react-dsfr';

export default function Home() {
  return <div className="fr-container">
    <div className="fr-mt-1w fr-mt-md-4w fr-mb-5w">
      <h1 className="fr-header__body">Mentions légales</h1>
      <p>Territoires en Transitions est un service créé par l&apos;<a
        href="https://www.ademe.fr/" rel="external">ADEME</a> en partenariat
        avec <a href="https://beta.gouv.fr/" rel="external">Beta.gouv.fr</a>.
      </p>
      <p>Siège social de l&apos;ADEME :
        <br />
        20, avenue du Grésillé
        <br />
        BP 90406
        <br />
        49004 Angers Cedex 01
        <br />
        Tél. : 02 41 20 41 20
        <br />
      </p>
      <h3>Directeur de publication</h3>
      <p>Nicolas VALLÉE - ADEME</p>
      <h3>Prestataire d&apos;hébergement</h3>
      <p>SCALINGO SAS<br />3 place de Haguenau, 67000 Strasbourg, France</p>
    </div>
  </div>;

}
