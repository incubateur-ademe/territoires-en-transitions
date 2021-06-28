<main class="page" role="main">
  <div id="contenu" class="fr-container-fluid ds_banner">
    <div class="fr-container">
      <div class="fr-grid-row fr-grid-row--gutters">
        <div class="fr-mt-3w fr-mt-md-9w fr-mb-5w">

          <slot></slot>

        </div>
      </div>
    </div>
  </div>
</main>

<style>
  @media screen and (min-width: 640px) {
    .page .fr-container {
      padding-right: 6rem;
      padding-left: 6rem;
    }
  }
</style>
