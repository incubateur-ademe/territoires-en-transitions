<script context="module">
  export const hydrate = false;
  export const prerender = true;

  export async function load({ fetch }) {
    const fetcher = async (file) => await fetch('/bridge?file=' + file);

    const [description, buttons, cards, howToStart, contactUs] = await Promise.all([
      fetcher('home/description.md'),
      fetcher('home/buttons.md'),
      fetcher('home/cards.md'),
      fetcher('home/how-to-start.md'),
      fetcher('home/contact-us.md')
    ]);

    return {
      props: {
        description: await description.text(),
        buttons: await buttons.text(),
        cards: await cards.text(),
        howToStart: await howToStart.text(),
        contactUs: await contactUs.text()
      }
    };
  }
</script>

<script>
  import SvelteMarkdown from 'svelte-markdown';
  import Header from '../components/Header.svelte';
  import Title from '../components/Title.svelte';
  import Cards from '../components/Cards.svelte';
  import Link from '../components/Link.svelte';
  import LinkBtn from '../components/LinkBtn.svelte';
  import Footer from "../components/Footer.svelte";

  export let description;
  export let buttons;
  export let cards;
  export let howToStart;
  export let contactUs;

  const renderers = {
    heading: Title,
    link: Link,
  };

  const btnRenderers = {
    link: LinkBtn,
  };
</script>

<Header />
<main role="main">
  <div id="contenu" class="fr-container-fluid ds_banner">
    <div class="fr-container">
      <div class="fr-grid-row fr-grid-row--gutters">
        <div class="fr-mt-3w fr-mt-md-9w fr-mb-5w text-center">
          <SvelteMarkdown source={description} {renderers} />
        </div>
      </div>
      <div class="fr-grid-row fr-grid-row--gutters fr-grid-row--center fr-mb-10w">
        <SvelteMarkdown source={buttons} renderers={btnRenderers} />
      </div>
    </div>
    <div class="fr-container">
      <div class="fr-grid-row fr-grid-row--gutters">
        <SvelteMarkdown source={cards} {renderers} />
      </div>
      <div class="fr-grid-row fr-grid-row--gutters">
        <Cards />
      </div>
    </div>
    <div class="fr-container fr-mt-10w">
      <div class="fr-grid-row fr-grid-row--gutters">
        <SvelteMarkdown source={howToStart} {renderers} />
      </div>
      <div class="fr-grid-row fr-grid-row--gutters fr-grid-row--center fr-mb-10w">
        <SvelteMarkdown source={buttons} renderers={btnRenderers} />
      </div>
    </div>
    <div class="fr-container fr-mt-10w">
      <div class="fr-grid-row fr-grid-row--gutters">
        <SvelteMarkdown source={contactUs} {renderers} />
      </div>
    </div>
  </div>
</main>
<Footer/>

<style global src="../../node_modules/@gouvfr/dsfr/dist/css/dsfr.css"></style>
