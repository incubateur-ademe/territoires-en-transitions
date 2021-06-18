<script>
  export let footerLinks;
  import SvelteMarkdown from 'svelte-markdown';
  import FooterLink from './Footer/FooterLink.svelte';

  const renderers = {
    link: FooterLink
  }
</script>

<footer class="fr-footer fr-mt-10w" role="contentinfo" id="footer">
  <div class="fr-container">
    <div class="fr-footer__body">
      <div class="fr-footer__brand fr-enlarge-link">
        <p class="fr-logo">
          république
          <br />française
        </p>
        <div class="fr-header__ademe">
          <picture>
            <source srcset="./img/ademe.jpg 118w" sizes="118px" />
            <img src="./img/ademe.jpg" alt="ADEME" loading="lazy" />
          </picture>
        </div>
      </div>
    </div>
    <div class="fr-footer__bottom">
      <ul class="fr-footer__bottom-list">
        <SvelteMarkdown source={footerLinks} {renderers} />
      </ul>
      <div class="fr-footer__bottom-copy">
        <p></p>
      </div>
    </div>
  </div>
</footer>
