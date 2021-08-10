<script>
    import Footer from '$components/shared/DesignSystem/Footer.svelte'
</script>

<Footer />

<footer class="footer fr-footer fr-mt-10w" role="contentinfo" id="footer">
    <div class="fr-container">
        <div class="fr-footer__body">
            <div class="fr-footer__brand fr-enlarge-link">
                <p class="fr-logo" title="république française">
                    république
                    <br>française
                </p>
                <div class="fr-footer__logo fr-p-1w">
                    <picture>
                        <source srcset="https://territoiresentransitions.fr/img/ademe.jpg 118w" sizes="118px" />
                        <img class="footer__logo" height="100" src="https://territoiresentransitions.fr/img/ademe.jpg" alt="ADEME" loading="lazy" />
                    </picture>
                </div>
                <div class="fr-header__service">
                    <a href="https://territoiresentransitions.fr" title="Accueil">
                        <p class="fr-header__service-title">Territoires en Transitions</p>
                    </a>
                </div>
            </div>
            <div class="fr-footer__content">
                <!-- A small sentence in the footer to describe the service -->
                <slot name="description"></slot>

                <ul class="fr-footer__content-list">
                    <li class="fr-footer__content-item">
                        <a class="fr-footer__content-link" href="https://www.ademe.fr/">ademe.fr</a>
                    </li>
                    <li class="fr-footer__content-item">
                        <a class="fr-footer__content-link" href="https://beta.gouv.fr/">beta.gouv</a>
                    </li>
                    <li class="fr-footer__content-item">
                        <a class="fr-footer__content-link" href="http://citergie.ademe.fr/">citergie.fr</a>
                    </li>
                </ul>
            </div>
        </div>

        <!-- The footer navigation bar -->
        <slot name="navigation"></slot>

    </div>
</footer>
<style>
    .footer :global(.fr-footer__brand .fr-logo::after) {
        min-width: 1.96875rem;
        background-size: 3.9375rem 2.8125rem;
        background-position: 0 calc(100% + 1.40625rem);
        padding-top: 1.65625rem;
    }

    .footer :global(.fr-footer__brand .fr-logo) {
        font-size: 0.7875rem;
    }

    .footer :global(.fr-footer__logo) {
        width: auto;
    }
</style>