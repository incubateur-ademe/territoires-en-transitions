<script>
  import links from './../../content/header/links.md';
  import SvelteMarkdown from 'svelte-markdown';
  import HeaderLink from './HeaderLink.svelte';
  import EmptyParagraph from './../Markdown/EmptyParagraph.svelte';

  const renderers = {
    link: HeaderLink,
    paragraph: EmptyParagraph
  };
</script>

<div class="fr-header__tools">
  <div class="fr-header__tools-links">
    <ul class="fr-links-group">
      <SvelteMarkdown source={links.content} {renderers} />
    </ul>
  </div>
</div>
