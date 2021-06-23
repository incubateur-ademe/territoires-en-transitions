<script>
  import cards from '../../content/home/cards/cards.json';
  import FooterLink from "../Footer/FooterLink.svelte";
</script>

{#each cards as card}
  <div class="Cards fr-col-xs-12 fr-col-sm-12 fr-col-md-4 fr-col-lg-4">
    <div class="fr-card {card.link ? 'fr-enlarge-link' : 'fr-card--no-arrow'}">
      <div class="fr-card__body">
        <h3 class="fr-card__title">
          {#if card.link}
            <a href="/" class="fr-card__link">{card.title}</a>
          {:else}
            {card.title}
          {/if}
        </h3>
        <p class="fr-card__desc fr-text--sm">
          {@html card.description}
        </p>
      </div>
      {#if Object.keys(card.image).length}
        <div class="fr-card__img">
          <img src={card.image.image} title={card.image.title} alt={card.image.alt} />
        </div>
      {:else}
        <div class="fr-card__img">
          <img src="./img/missing-image.svg" alt="Image d'illustration" />
        </div>
      {/if}
    </div>
  </div>
{/each}

<style>
  .Cards :global(.fr-card__img img) {
    object-fit: none;
    top: 15%;
  }

  .Cards :global(.fr-card__img::before) {
    padding-bottom: 35%;
  }
</style>
