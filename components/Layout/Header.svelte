<script>
    import Header from './../DesignSystem/Header.svelte'
</script>

<Header />
<header role="banner" class="header fr-header">
    <div class="fr-container">
        <div class="fr-header__body-row header__row">
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
                        <source srcset="https://territoiresentransitions.fr/img/ademe.jpg 118w" sizes="118px" />
                        <img src="https://territoiresentransitions.fr/img/ademe.jpg" alt="ADEME" loading="lazy" class="header__logo"/>
                    </picture>
                </div>
                <div class="fr-header__service">
                    <a href="https://territoiresentransitions.fr" title="Accueil">
                        <p class="fr-header__service-title">Territoires en Transitions</p>
                    </a>
                </div>
            </div>

            <slot name="nav"></slot>

        </div>
        <div class="fr-header__menu fr-modal" id="header-navigation" aria-labelledby="button-1">
            <div class="fr-container">
                <button class="fr-link--close fr-link" aria-controls="header-navigation">Fermer</button>
                <div class="fr-header__menu-links" />
            </div>
        </div>
    </div>

    <slot name="secondary"></slot>
</header>

<style>
    .header :global(.fr-header__brand-top) {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        width: auto;
    }

    .header :global(.header__logo) {
        height: 80px;
    }

    .header :global(.header__row) {
        padding: 1rem 0;
    }
</style>
