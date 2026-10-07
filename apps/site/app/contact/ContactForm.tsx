'use client';

import { ToastFloater } from '@/site/components/floating-ui/ToastFloater';
import { getTrpcClient, RouterInput } from '@tet/api';
import {
  Button,
  Field,
  FormSectionGrid,
  Icon,
  Input,
  OptionValue,
  Select,
  Textarea,
} from '@tet/ui';
import classNames from 'classnames';
import { useRouter, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { useState } from 'react';
import { options } from './data';

/**
 * Objets acceptés par le backend. Dérivé du routeur plutôt que redéclaré :
 * ajouter une option dans `./data` sans l'ajouter au schéma Zod côté backend
 * devient une erreur de compilation.
 */
type ContactObjet = RouterInput['shared']['contact']['send']['objet'];

type FormData = {
  objet: { value: number | string; label: string };
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  message: string;
  /**
   * Piège à robots : masqué à l'écran et hors du parcours clavier, un humain
   * ne le remplit jamais. Le backend ignore en silence les envois où il est
   * rempli.
   */
  website: string;
};

const initFormData: FormData = {
  objet: { value: '', label: '' },
  prenom: '',
  nom: '',
  email: '',
  tel: '',
  message: '',
  website: '',
};

const ContactForm = () => {
  const [trpcClient] = useState(() => getTrpcClient());

  const searchParams = useSearchParams();
  const router = useRouter();

  const objet = searchParams.get('objet');
  const objetOption = options.find((opt) => opt.value === objet);

  const [formData, setFormData] = useState<FormData>(() =>
    objetOption ? { ...initFormData, objet: objetOption } : initFormData
  );

  // Préremplit l'objet quand l'URL change (`/contact?objet=…`). L'ajuster
  // pendant le rendu, plutôt que dans un effet, évite d'afficher un instant le
  // champ vide.
  const [previousObjet, setPreviousObjet] = useState(objet);
  if (previousObjet !== objet) {
    setPreviousObjet(objet);
    if (objetOption) {
      setFormData((prevState) => ({ ...prevState, objet: objetOption }));
    }
  }

  const [status, setStatus] = useState<'success' | 'error' | null>(null);
  const [isError, setIsError] = useState(false);

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
      !formData.objet.value ||
      !formData.nom ||
      !formData.prenom ||
      !formData.email ||
      !formData.message
    ) {
      setIsError(true);
    } else {
      setIsError(false);
      try {
        await trpcClient.shared.contact.send.mutate({
          ...formData,
          objet: formData.objet.value as ContactObjet,
        });
        setStatus('success');
        setFormData(initFormData);
        if (objet !== null) {
          router.push('/contact');
        }
      } catch (error) {
        console.error(error);
        setStatus('error');
      }
    }
  };

  return (
    <>
      <form
        onSubmit={(event) => {
          handleSubmit(event);
          posthog.capture('envoyer_message');
        }}
        className="relative bg-white border border-grey-4 rounded-lg px-4 py-5 md:px-12 md:py-14"
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

        {/* Piège à robots. Masqué en position absolue plutôt qu'avec
            `display: none` ou `type="hidden"`, que les robots savent ignorer.
            `aria-hidden` + `tabIndex={-1}` le retirent du parcours clavier et
            des lecteurs d'écran : personne ne peut le remplir par accident. */}
        <div
          aria-hidden="true"
          className="absolute -left-[9999px] h-px w-px overflow-hidden"
        >
          <label htmlFor="website">Ne pas remplir ce champ</label>
          <input
            type="text"
            id="website"
            name="website"
            autoComplete="off"
            tabIndex={-1}
            onChange={handleChange}
            value={formData.website}
          />
        </div>

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
        <div className="flex items-center gap-3">
          {status === 'success' && (
            <>
              <Icon icon="check-line" />
              Votre message a bien été envoyé
            </>
          )}
          {status === 'error' && (
            <>
              <Icon icon="close-line" />
              {"Une erreur est survenue lors de l'envoi de votre message"}
            </>
          )}
        </div>
      </ToastFloater>
    </>
  );
};

export default ContactForm;
