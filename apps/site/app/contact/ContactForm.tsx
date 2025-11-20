'use client';

import { ToastFloater } from '@/site/components/floating-ui/ToastFloater';
import {
  Button,
  Field,
  FormSectionGrid,
  Input,
  OptionValue,
  Select,
  Textarea,
} from '@tet/ui';
import classNames from 'classnames';
import { useRouter, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect, useState } from 'react';
import { supabase } from '../initSupabase';
import { options } from './data';

type FormData = {
  objet: { value: number | string; label: string };
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  message: string;
};

const initFormData: FormData = {
  objet: { value: '', label: '' },
  prenom: '',
  nom: '',
  email: '',
  tel: '',
  message: '',
};

const ContactForm = () => {
  const [formData, setFormData] = useState<FormData>(initFormData);
  const [status, setStatus] = useState<'success' | 'error' | null>(null);
  const [isError, setIsError] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  const objet = searchParams.get('objet');

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prevState) => {
      return {
        ...prevState,
        [event.target.name]: event.target.value,
      };
    });
  };

  const handleChangeSelect = (value?: OptionValue) => {
    const option = options.find((opt) => opt.value === value);

    setFormData((prevState) => ({
      ...prevState,
      objet: option ?? { value: '', label: '' },
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !formData.objet ||
      !formData.nom ||
      !formData.prenom ||
      !formData.email ||
      !formData.message
    ) {
      setIsError(true);
    } else {
      setIsError(false);
      const sentData = {
        ...formData,
        objet: formData.objet.value,
      };
      const { data, error } = await supabase.functions.invoke(
        'site_send_message',
        {
          body: sentData,
        }
      );
      if (data) {
        setStatus('success');
        setFormData(initFormData);
        if (objet !== null) {
          router.push('/contact');
        }
      } else if (error) {
        console.error(error);
        setStatus('error');
      } else {
        console.error('site_send_message : aucune donnée reçue');
        setStatus('error');
      }
    }
  };

  useEffect(() => {
    if (objet === 'programme') {
      const option = options.find((opt) => opt.value === objet);

      if (option) {
        setFormData((prevState) => ({
          ...prevState,
          objet: option,
        }));
      }
    }
  }, []);

  return (
    <>
      <form
        onSubmit={(event) => {
          handleSubmit(event);
          posthog.capture('envoyer_message');
        }}
        className="bg-white border border-grey-4 rounded-lg px-4 py-5 md:px-12 md:py-14"
      >
        <FormSectionGrid>
          <Field
            title="Objet de votre message *"
            className="col-span-2"
            state={isError && !formData.objet.value ? 'error' : 'default'}
            message={
              isError && !formData.objet.value
                ? 'Ce champ est obligatoire'
                : undefined
            }
          >
            <Select
              options={options}
              onChange={handleChangeSelect}
              values={formData.objet.value}
            />
          </Field>

          <Field
            title="Votre prénom *"
            className="max-md:col-span-2"
            state={isError && !formData.prenom ? 'error' : 'default'}
            message={
              isError && !formData.prenom
                ? 'Ce champ est obligatoire'
                : undefined
            }
          >
            <Input
              type="text"
              id="prenom"
              name="prenom"
              onChange={handleChange}
              value={formData.prenom}
            />
          </Field>

          <Field
            title="Votre nom *"
            className="max-md:col-span-2"
            state={isError && !formData.nom ? 'error' : 'default'}
            message={
              isError && !formData.nom ? 'Ce champ est obligatoire' : undefined
            }
          >
            <Input
              type="text"
              id="nom"
              name="nom"
              onChange={handleChange}
              value={formData.nom}
            />
          </Field>

          <Field
            title="Votre adresse email professionnelle *"
            className="max-md:col-span-2"
            state={isError && !formData.email ? 'error' : 'default'}
            message={
              isError && !formData.email
                ? 'Ce champ est obligatoire'
                : undefined
            }
          >
            <Input
              type="text"
              id="email"
              name="email"
              onChange={handleChange}
              value={formData.email}
            />
          </Field>

          <Field
            title="Votre numéro de téléphone"
            className="max-md:col-span-2"
            message="Ce champ nous permet de vous recontacter plus rapidement en fonction de votre demande"
          >
            <Input
              type="tel"
              id="tel"
              name="tel"
              onChange={handleChange}
              value={formData.tel}
            />
          </Field>

          <Field
            title="Votre message *"
            className="col-span-2"
            state={isError && !formData.message ? 'error' : 'default'}
            message={
              isError && !formData.message
                ? 'Ce champ est obligatoire'
                : undefined
            }
          >
            <Textarea
              id="message"
              name="message"
              onChange={handleChange}
              value={formData.message}
              placeholder="Afin que nous puissions vous répondre au mieux, merci de préciser votre fonction et votre structure, puis formuler votre question."
              rows={5}
            />
          </Field>
        </FormSectionGrid>

        <Button type="submit" className="ml-auto mt-6">
          Envoyer
        </Button>
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
