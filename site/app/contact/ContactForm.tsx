'use client';

import {useState} from 'react';

type FormData = {
  object: string;
  name: string;
  surname: string;
  email: string;
  message: string;
};

const options = [
  {
    group:
      'Questions relatives au programme Territoire Engagé Transition Écologique',
    options: [
      {
        value: 1,
        label:
          'Informations sur le programme Territoire Engagé Transition Écologique',
      },
      {
        value: 2,
        label: 'Processus d’audit et de labellisation',
      },
      {
        value: 3,
        label: 'Référentiel Climat Air Énergie',
      },
      {
        value: 4,
        label: 'Référentiel Économie circulaire',
      },
    ],
  },
  {
    group: 'Questions relatives à la plateforme Territoires en transitions',
    options: [
      {
        value: 5,
        label: 'Création de compte ou connexion',
      },
      {
        value: 6,
        label: 'Suggestions d’améliorations',
      },
      {
        value: 7,
        label: 'Questions sur l’utilisation de la plateforme',
      },
    ],
  },
  {
    group: 'Aucun de ces sujets ?',
    options: [
      {
        value: 8,
        label: 'Autre',
      },
    ],
  },
];

const ContactForm = () => {
  const [formData, setFormData] = useState<FormData>({
    object: '',
    name: '',
    surname: '',
    email: '',
    message: '',
  });

  const handleChange = (
    event: React.ChangeEvent<
      HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData(prevState => ({
      ...prevState,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="fr-input-group">
        <label className="fr-label" htmlFor="input-objet">
          Objet de votre message
        </label>
        <select
          className="fr-select"
          id="object"
          name="object"
          required
          onChange={handleChange}
          value={formData.object}
        >
          <option value="" disabled hidden>
            Selectionnez une option
          </option>
          {options.map(group => (
            <optgroup key={group.group} label={group.group}>
              {group.options.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="fr-input-group">
        <label className="fr-label" htmlFor="input-name">
          Votre prénom
        </label>
        <input
          className="fr-input"
          type="text"
          id="name"
          name="name"
          required
          onChange={handleChange}
          value={formData.name}
        />
      </div>

      <div className="fr-input-group">
        <label className="fr-label" htmlFor="input-surname">
          Votre nom
        </label>
        <input
          className="fr-input"
          type="text"
          id="surname"
          name="surname"
          required
          onChange={handleChange}
          value={formData.surname}
        />
      </div>

      <div className="fr-input-group">
        <label className="fr-label" htmlFor="input-email">
          Votre adresse email professionnelle
        </label>
        <input
          className="fr-input"
          type="email"
          id="email"
          name="email"
          required
          onChange={handleChange}
          value={formData.email}
        />
      </div>

      <div className="fr-input-group">
        <label className="fr-label" htmlFor="input-message">
          Votre message
        </label>
        <textarea
          className="fr-input"
          id="message"
          name="message"
          required
          onChange={handleChange}
          value={formData.message}
        />
      </div>

      <div className="flex justify-end">
        <button className="fr-btn rounded-lg">Envoyer</button>
      </div>
    </form>
  );
};

export default ContactForm;
