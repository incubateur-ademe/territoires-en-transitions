import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import RichTextEditor from './RichTextEditor';

const meta: Meta<typeof RichTextEditor> = {
  component: RichTextEditor,
  decorators: [
    (Story) => (
      <div className="p-8 max-w-3xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof RichTextEditor>;

const initialValueMarkdown = `
Texte en **gras**, *italique*, <u>souligné</u>,

Liste :
- Item 1
- Item 2

- Item 3
- Item 4 avec un lien https://ademe.fr`;

const initialValueHtml = `
      <p>
        Texte en <strong>gras</strong>, <em>italique</em>, <u>souligné</u>,
        <span data-text-color="red">couleur</span>,
        <span data-background-color="yellow">sur fond de couleur</span>
      </p>
      <p>Liste à puces :</p>
      <ul>
        <li><p>item 1</p></li>
        <li><p>item 2</p></li>
      </ul>
      <p>Liste numérotée</p>
      <ol>
        <li><p>item A</p></li>
        <li><p>item B</p></li>
      </ol>
      <p>
        <a target="_blank" rel="noopener noreferrer nofollow" href="https://ademe.fr/"
          >Lien</a
        >
      </p>
      <p></p>
      <p data-text-alignment="center">Aligné au centre</p>
      <p data-text-alignment="right">Aligné au droite</p>
      <p data-text-alignment="justify"><strong>Justifié</strong> : Donec libero. Quisque vitae est quis dui bibendum suscipit. Fusce leo felis, sagittis non, vehicula ac, ultricies vitae, diam. Aenean congue libero et metus. Nulla convallis libero a lacus. Donec hendrerit lorem sit amet leo. Mauris libero. Pellentesque pulvinar molestie dolor. Proin nibh mauris, ornare at, pretium sit amet, porttitor vel, mi. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.</p>
  `;

const initialValuePlainText = `SYNTHESE
La CCPA accompagnement les entreprises notamment via :
-Sa convention avec la CMA : diagnostics transition écologique / éclairage
-Ses actions sur la qualité des ZAE : participation du CAUE en cours de lancement
-Ses actions contre la vacance commerciale : subventionnement des travaux avec priorité aux travaux énergétique
L'ALTE est aussi présente sur le territoire et conseille le petit tertiaire (pas de CR détaillé à la CCPA)
La CCPA suit précisément les actions qu'elle a mises en oeuvre (nombre de diagnostics, travaux réalisés, chiffrage des économies…)`;

const initialValuePlainText2 = `Il y a un parking P+R à Saint-Etienne de Saint-Geoirs avec : 69 places de stationnement dont 2 pour les PMR et 5 supports-vélo ; un quai bus ; de l'information multimodale ; un site de covoiturage
Il y a un parking P + R à la Côté Saint André
Il y a un parking relais sur la ZAE du Rival

VISITE 2025
Affermissement, poursuite de la création et promotion des quatre P+R «structurants identifiés dans le PADD du PLUi à Saint Etienne de Saint Geoirs, Le Rival, La Côte Saint André et Saint Jean de Bournay pour les convertir à terme en pôles d’intermodalités (PIM)
Equiper les P+R Mandrin (installation box à vélo 2025) et Rival de box à vélo. (1 par an)
Fin de la réalisation des travaux sur le P + R du rival dédié au covoiturage avec mise à disposition (invitation_inauguration_p+r_rival) :
- d'un box à vélo (8 recharges électrique et station réparation/gonflage)
- d'un arret de bus
- de 2 bornes de recharge (4 véhicules)
- de sanitaire
- d'une amorce de piste cyclable
Mise en place d'une expérimentation NUDGE sur le P+R le Mandrin pour dynamiser la ligne de bus. Communication et analyse des résultats de cette expérimentation (P+R_Mandrin_Etude_Nudge) :
-L’objectif : inciter les automobilistes à utiliser le parking relais Mandrin situé à Saint-Étienne-de-Saint-Geoirs pour emprunter la ligne X08, reliant Beaurepaire à Grenoble. La cible du dispositif est les voyageurs effectuant des trajets domicile-travail en voiture vers l’agglomération Grenobloise.
-Dispositif nudge : iconographie ; informations sur la fréquence, etc.
-Résultats : Augmentation de la fréquentation après mise en place du dispositif`;

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-grey-8">Vide</h3>
        <RichTextEditor onChange={action('onChange-empty')} />
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-grey-8">Chargement</h3>
        <RichTextEditor isLoading onChange={action('onChange-loading')} />
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-grey-8">Markdown</h3>
        <RichTextEditor
          initialValue={initialValueMarkdown}
          onChange={action('onChange-markdown')}
        />
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-grey-8">HTML</h3>
        <RichTextEditor
          initialValue={initialValueHtml}
          onChange={action('onChange-html')}
        />
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-grey-8">
          Texte plat (format BDD)
        </h3>
        <RichTextEditor
          initialValue={initialValuePlainText}
          onChange={action('onChange-plain')}
        />
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-grey-8">
          Texte plat (format BDD)
        </h3>
        <RichTextEditor
          initialValue={initialValuePlainText2}
          onChange={action('onChange-plain')}
        />
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-grey-8">Lecture seule</h3>
        <RichTextEditor
          initialValue="Contenu en <b>lecture seule</b>"
          disabled
          onChange={action('onChange-readonly')}
        />
      </section>
    </div>
  ),
};
