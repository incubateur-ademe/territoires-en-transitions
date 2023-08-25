/* eslint-disable react/no-unescaped-entities */
'use server';

import NoResult from '@components/info/NoResult';
import Section from '@components/sections/Section';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import PhoneIcon from 'public/icones/PhoneIcon';
import {fetchSingle} from 'src/strapi/strapi';
import {StrapiItem} from 'src/strapi/StrapiItem';

type ContactData = {
  titre: string;
  description: string;
  couverture?: StrapiItem;
};

export const getData = async () => {
  const data = await fetchSingle('contact');

  const formattedData = data
    ? {
        titre: data.attributes.Titre as unknown as string,
        description:
          (data.attributes.Description as unknown as string) ?? undefined,
        couverture:
          (data.attributes.Couverture.data as unknown as StrapiItem) ??
          undefined,
      }
    : null;

  return formattedData;
};

const Contact = async () => {
  const data: ContactData | null = await getData();

  return data ? (
    <Section className="flex-col">
      <h1>{data.titre}</h1>

      <p className="text-xl">{data.description}</p>

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

      {!!data.couverture && (
        <picture className="w-full my-6">
          <StrapiImage data={data.couverture} className="w-full" />
        </picture>
      )}
    </Section>
  ) : (
    <NoResult />
  );
};

export default Contact;
