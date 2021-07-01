<svelte:head>
  <title>Territoires en transitions - Mentions légales</title>
</svelte:head>

<script context="module">
  export const hydrate = false;
  export const prerender = true;

  export async function load({ fetch }) {
    const fetcher = async (file) => await fetch('/bridge?file=' + file);

    const [terms] = await Promise.all([
      fetcher('terms/content.md'),
    ]);

    return {
      props: {
        terms: await terms.text(),
      }
    };
  }
</script>

<script>
  import Title from '../../components/Markdown/Title.svelte'
  import Link from '../../components/Markdown/Link.svelte'
  import SvelteMarkdown from 'svelte-markdown'
  import Page from '../../components/Layout/Page.svelte'

  export let terms

  const renderers = {
    heading: Title,
    link: Link
  }
</script>

<Page>
  <SvelteMarkdown source={terms} {renderers} />
</Page>

