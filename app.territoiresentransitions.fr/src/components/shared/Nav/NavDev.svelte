<script lang="ts">
    /**
     * A navigation bar shown only for testing features.
     */

    import type {UtilisateurConnecteStorable} from "$storables/UtilisateurConnecteStorable";
    import {onMount} from "svelte";
    import Navigation from '$components/shared/DesignSystem/Navigation.svelte'
    import Tags from '$components/shared//DesignSystem/Tags.svelte'
    import {testUIVisibility} from '../../../api/currentEnvironment'


    let connected = false
    let user: UtilisateurConnecteStorable
    let showTestNavigation = false

    onMount(async () => {
        showTestNavigation = testUIVisibility()

        if (showTestNavigation) {
            const auth = await import("$api/authentication")
            connected = auth.connected()
            user = auth.currentUser()
        }
    })
</script>

<Navigation />
<Tags />

<div class="navDev">
    {#if showTestNavigation }
        <nav class="fr-nav" id="header-navigation" role="navigation" aria-label="Menu principal">
            <ul class="fr-nav__list">
                <li class="fr-nav__item">
                    <a class="fr-tag" href="/">EN TEST</a>
                </li>
                {#if connected }
                    <li class="fr-nav__item">
                        <a class="fr-nav__link" href="auth/signout/">Déconnexion</a>
                    </li>
                {:else }
                    <li class="fr-nav__item">
                        <a class="fr-nav__link" href="auth/signin/" target="_self">Se connecter</a>
                    </li>
                    <li class="fr-nav__item">
                        <a class="fr-nav__link" href="auth/register/" target="_self">Création de compte</a>
                    </li>
                {/if}
            </ul>
        </nav>
    {/if}
</div>

<style>
    .navDev {
        background-color: var(--g700);
        padding-right: 1.5rem;
        padding-left: 1.5rem;
    }

    .navDev :global(.fr-nav__link) {
        color: var(--w);
    }

    .navDev :global(.fr-tag) {
        margin: 0.9rem;
    }
</style>