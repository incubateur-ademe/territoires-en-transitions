'use client';

import {ToastFloater} from '@components/floating-ui/ToastFloater';
import classNames from 'classnames';
import {useState} from 'react';
import {supabase} from '../initSupabase';
import {options} from './data';
import {Button} from '@tet/ui';

type FormData = {
  categorie: string;
  objet: {value: number | string; label: string};
  prenom: string;
  nom: string;
  email: string;
  message: string;
};

const initFormData: FormData = {
  categorie: '',
  objet: {value: '', label: ''},
  prenom: '',
  nom: '',
  email: '',
  message: '',
};

const ContactForm = () => {
  const [formData, setFormData] = useState<FormData>(initFormData);
  const [status, setStatus] = useState<'success' | 'error' | null>(null);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData(prevState => {
      return {
        ...prevState,
        [event.target.name]: event.target.value,
      };
    });
  };

  const handleChangeSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const option = event.target.options[event.target.selectedIndex];
    const categorie = option.closest('optgroup')?.label ?? '';

    setFormData(prevState => ({
      ...prevState,
      categorie,
      objet: {value: event.target.value, label: option.innerText},
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const sentData = {
      ...formData,
      objet: formData.objet.label,
    };

    const {data, error} = await supabase.functions.invoke('site_send_message', {
      body: sentData,
    });

    if (data) {
      setStatus('success');
      setFormData(initFormData);
    } else if (error) {
      console.error(error);
      setStatus('error');
    } else {
      console.error('site_send_message : aucune donnée reçue');
      setStatus('error');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="fr-input-group">
          <label className="fr-label" htmlFor="input-objet">
            Objet de votre message
          </label>
          <select
            className="fr-select"
            id="objet"
            name="objet"
            required
            onChange={handleChangeSelect}
            value={formData.objet.value}
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
            id="prenom"
            name="prenom"
            required
            onChange={handleChange}
            value={formData.prenom}
          />
        </div>

        <div className="fr-input-group">
          <label className="fr-label" htmlFor="input-surname">
            Votre nom
          </label>
          <input
            className="fr-input"
            type="text"
            id="nom"
            name="nom"
            required
            onChange={handleChange}
            value={formData.nom}
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
          <Button>Envoyer</Button>
        </div>
      </form>

      <ToastFloater
        open={status !== null}
        onClose={() => setStatus(null)}
        className={classNames('!text-white', {
          '!bg-success-1': status === 'success',
          '!bg-error-1': status === 'error',
        })}
      >
        <div className="flex items-center">
          <div
            className={`flex mr-3 ${classNames({
              'fr-icon-check-line': status === 'success',
              'fr-icon-close-line': status === 'error',
            })}`}
          />
          {status === 'success'
            ? 'Votre message a bien été envoyé'
            : status === 'error'
            ? "Une erreur est survenue lors de l'envoi de votre message"
            : ''}
        </div>
      </ToastFloater>
    </>
  );
};

export default ContactForm;
