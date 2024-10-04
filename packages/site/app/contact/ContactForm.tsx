'use client';

import { ToastFloater } from '@tet/site/components/floating-ui/ToastFloater';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { supabase } from '../initSupabase';
import { options } from './data';
import {
  Button,
  Field,
  FormSectionGrid,
  Input,
  OptionValue,
  Select,
  Textarea,
  useEventTracker,
} from '@tet/ui';
import { useRouter, useSearchParams } from 'next/navigation';

type FormData = {
  categorie: string;
  objet: { value: number | string; label: string };
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  message: string;
};

const initFormData: FormData = {
  categorie: '',
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
  const tracker = useEventTracker('site/contact');

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

  const handleChangeSelect = (value: OptionValue) => {
    const categorie = options.find((opt) =>
      opt.options.some((o) => o.value === value)
    );
    const option = categorie?.options.find((opt) => opt.value === value);

    setFormData((prevState) => ({
      ...prevState,
      categorie: categorie?.title ?? '',
      objet: option ?? { value: '', label: '' },
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !formData.objet ||
      !formData.nom ||
      !formData.prenom ||
      !formData.email
    ) {
      setIsError(true);
    } else {
      setIsError(false);
      const sentData = {
        ...formData,
        objet: formData.objet.label,
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
    if (objet === 'panier' || objet === 'programme') {
      const stringToFind =
        objet === 'panier'
          ? "Informations sur le panier d'actions à impact"
          : 'Informations sur le programme Territoire Engagé Transition Écologique';

      const optionGroup = options.find((opt) =>
        opt.options.some((o) => o.label === stringToFind)
      );
      const option = optionGroup?.options.find(
        (opt) => opt.label === stringToFind
      );

      if (optionGroup && option) {
        setFormData((prevState) => ({
          ...prevState,
          categorie: optionGroup.title,
          objet: option,
          message:
            objet === 'panier'
              ? 'Bonjour, le panier d’actions à impact m’intéresse. Pourriez vous me recontacter ?'
              : 'Bonjour, le programme Territoire Engagé Transition Écologique m’intéresse. Pourriez vous me recontacter ?',
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <form
        onSubmit={(event) => {
          handleSubmit(event);
          tracker('envoyer_message', {});
        }}
        className="border border-grey-4 rounded-lg max-md:p-4 md:max-lg:p-10 p-20"
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
              disabled={objet !== null}
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

          <Field title="Votre message" className="col-span-2">
            <Textarea
              id="message"
              name="message"
              onChange={handleChange}
              value={formData.message}
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
