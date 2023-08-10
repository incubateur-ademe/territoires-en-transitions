/* eslint-disable react/no-unescaped-entities */
import Section from '@components/sections/Section';

const Inscription = () => {
  return (
    <Section className="flex-col">
      <h1>
        Suivez les actualités du programme Territoire Engagé Transition
        Écologique
      </h1>
      <p className="text-xl">
        Recevez directement dans votre boîte mail les actualités du programme
        Territoire Engagé Transition Écologique chaque mois en complétant ces
        informations :
      </p>
      <div className="p-4 md:p-14 lg:px-28 bg-gray-100 mb-6">
        <p className="text-sm">
          <span className="align-top">*</span> Champs obligatoires
        </p>
        <form>
          <div className="fr-input-group grid grid-cols-2 gap-8">
            <div>
              <label className="fr-label" htmlFor="input-surname">
                Nom<span className="align-top">*</span>
              </label>
              <input
                className="fr-input"
                type="text"
                id="input-surnam"
                name="input-surnam"
                required
              />
            </div>
            <div>
              <label className="fr-label" htmlFor="input-name">
                Prénom<span className="align-top">*</span>
              </label>
              <input
                className="fr-input"
                type="text"
                id="input-name"
                name="input-name"
                required
              />
            </div>
          </div>
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="input-email">
              Mon adresse e-mail<span className="align-top">*</span>
            </label>
            <input
              className="fr-input"
              type="email"
              id="input-email"
              name="input-email"
              required
            />
          </div>
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="input-work">
              Je travaille pour
            </label>
            <select className="fr-select" id="input-work" name="input-work">
              <option value="" selected disabled hidden>
                Selectionnez une option
              </option>
              <option value="1">une entreprise privée</option>
              <option value="2">une collectivité</option>
              <option value="3">une association privée ou publique</option>
              <option value="4">
                un organisme de l'Etat ou un établissement publique
              </option>
              <option value="5">un organisme européen ou international</option>
              <option value="6">
                aucun, je m'inscris en tant que particulier
              </option>
            </select>
          </div>
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="input-role">
              Ma fonction<span className="align-top">*</span>
            </label>
            <input
              className="fr-input"
              type="text"
              id="input-role"
              name="input-role"
              required
            />
          </div>
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="input-organization">
              Nom de l'organisme<span className="align-top">*</span>
            </label>
            <input
              className="fr-input"
              type="text"
              id="input-organization"
              name="input-organization"
              required
            />
          </div>
          <div className="fr-checkbox-group">
            <input
              name="checkboxes-1"
              id="checkboxes-1"
              type="checkbox"
              aria-describedby="checkboxes-1"
              required
            />
            <label className="fr-label inline" htmlFor="checkboxes-1">
              J'ai lu et j'accepte que l'ADEME collecte mes données afin de
              garantir la bonne utilisation des services offerts et reconnais
              avoir pris connaissance de sa{' '}
              <a
                href="https://agirpourlatransition.ademe.fr/politique-protection-donnees-a-caractere-personnel"
                target="_blank"
              >
                politique de protection des données personnelles
              </a>
              .<span className="align-top">*</span>
            </label>
          </div>

          <div className="flex justify-end">
            <button className="fr-btn rounded-lg">
              Je m'abonne gratuitement
            </button>
          </div>
        </form>
      </div>
    </Section>
  );
};

export default Inscription;
