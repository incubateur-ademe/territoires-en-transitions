<script>
  export let headerLinks;
  import SvelteMarkdown from 'svelte-markdown';
  import HeaderLink from './Header/HeaderLink.svelte';
  import EmptyParagraph from './Markdown/EmptyParagraph.svelte';

  const renderers = {
    link: HeaderLink,
    paragraph: EmptyParagraph
  }
</script>

<header role="banner" class="fr-header">
  <div class="fr-container">
    <div class="fr-header__body-row">
      <div class="fr-header__brand fr-enlarge-link">
        <div class="fr-header__brand-top">
          <div class="fr-header__logo">
            <p class="fr-logo">
              République<br /> française
            </p>
          </div>
        </div>
        <div class="fr-header__ademe">
          <picture>
            <source srcset="./img/ademe.jpg 118w" sizes="118px" />
            <img src="./img/ademe.jpg" alt="ADEME" loading="lazy" />
          </picture>
        </div>
        <div class="fr-header__service">
          <a href="/" title="Accueil">
            <p class="fr-header__service-title">Territoires en Transitions</p>
          </a>
        </div>
      </div>
      <div class="fr-header__tools">
        <div class="fr-header__tools-links">
          <ul class="fr-links-group">
            <SvelteMarkdown source={headerLinks} {renderers} />
          </ul>
        </div>
      </div>
    </div>
    <div class="fr-header__menu fr-modal" id="header-navigation" aria-labelledby="button-1">
      <div class="fr-container">
        <button class="fr-link--close fr-link" aria-controls="header-navigation">Fermer</button>
        <div class="fr-header__menu-links" />
      </div>
    </div>
  </div>
</header>

<style>
  .fr-header__brand-top {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    width: auto;
  }
</style>
