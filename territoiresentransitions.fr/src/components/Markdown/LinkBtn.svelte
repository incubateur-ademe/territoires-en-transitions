<script>
  export let href = '';
  export let title = undefined;
</script>

<div class="fr-col-md-3 fr-grid-row fr-grid-row--center">
  <a {href} {title} class="fr-btn fr-btn">
    <slot />
  </a>
</div>
