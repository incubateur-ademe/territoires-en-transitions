/* eslint-disable react/no-unescaped-entities */
import Section from '@components/sections/Section';
import PhoneIcon from 'public/icones/PhoneIcon';

const Contact = () => {
  return (
    <Section className="flex-col">
      <h1>Contacter l'équipe</h1>
      <p className="text-xl">
        Des questions sur le programme ou sur la plateforme ? Écrivez-nous et
        nous vous répondrons dès que possible, en 48h ouvrées.
      </p>
      <div className="p-4 md:p-14 lg:px-28 bg-gray-100 mb-6">
        <p className="text-sm">Information requises</p>
        <form>
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="input-objet">
              Objet de votre message
            </label>
            <select
              className="fr-select"
              id="input-objet"
              name="input-objet"
              required
            >
              <option value="" selected disabled hidden>
                Selectionnez une option
              </option>

              <optgroup label="Questions relatives au programme Territoire Engagé Transition Écologique">
                <option value="1">
                  Informations sur le programme Territoire Engagé Transition
                  Écologique
                </option>
                <option value="2">Processus d’audit et de labellisation</option>
                <option value="3">Référentiel Climat Air Énergie</option>
                <option value="4">Référentiel Économie circulaire</option>
              </optgroup>

              <optgroup label="Questions relatives à la plateforme Territoires en transitions">
                <option value="5">Création de compte ou connexion</option>
                <option value="6">Suggestions d’améliorations</option>
                <option value="7">
                  Questions sur l’utilisation de la plateforme
                </option>
              </optgroup>

              <optgroup label="Aucun de ces sujets ?">
                <option value="8">Autre</option>
              </optgroup>
            </select>
          </div>
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="input-name">
              Votre prénom
            </label>
            <input
              className="fr-input"
              type="text"
              id="input-name"
              name="input-name"
              required
            />
          </div>
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="input-surname">
              Votre nom
            </label>
            <input
              className="fr-input"
              type="text"
              id="input-surname"
              name="input-surname"
              required
            />
          </div>
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="input-email">
              Votre adresse email professionnelle
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
            <label className="fr-label" htmlFor="input-message">
              Votre message
            </label>
            <textarea
              className="fr-input"
              id="input-message"
              name="input-message"
              required
            />
          </div>
          <div className="flex justify-end">
            <button className="fr-btn rounded-lg">Envoyer</button>
          </div>
        </form>
      </div>
      <div>
        <p className="font-bold flex gap-2 mb-0">
          <PhoneIcon />
          Tél. : 04 15 09 82 07
        </p>
        <p className="text-[#666]">
          Permanence de 9h à 12h30 et de 14h à 16h30, du lundi au vendredi
        </p>
      </div>
    </Section>
  );
};

export default Contact;
