<script>
  import links from './../content/footer/links.md'
  import SvelteMarkdown from 'svelte-markdown'
  import FooterLink from './Footer/FooterLink.svelte'
  import FooterListItem from './Footer/FooterListItem.svelte'
  import Footer from '../../../components/Layout/Footer.svelte'

  const renderers = {
    link: FooterLink,
    listitem: FooterListItem,
  }
</script>

<Footer>
  <div class="fr-footer__bottom">
    <ul class="fr-footer__bottom-list">
      <SvelteMarkdown source={links.content} {renderers} />
    </ul>
  </div>
</Footer>
