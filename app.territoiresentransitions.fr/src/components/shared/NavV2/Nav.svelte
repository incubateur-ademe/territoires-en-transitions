<script>
    /**
     * Top navigation bar
     */
    import {onMount} from 'svelte'
    import {testUIVisibility} from '../../../api/currentEnvironment'
    import {getCurrentEpciId} from '../../../api/currentEpci'

    export let segment // Type string. Typing this variable makes sapper crash.
    export let slot

    let showTestNavigation = false
    let epciId = ''

    $: isLogged = segment && segment !== 'connexion'

    onMount(async () => {
        showTestNavigation = testUIVisibility()
        try {
            epciId = getCurrentEpciId()
        } catch (e) {
            // not signed in, it's fine
        }
    })
</script>

<div class="fr-header__tools">
    <div class="fr-header__tools-links">
        <ul class="fr-links-group">
            {#if isLogged}
                <li>
                    <a class="fr-link" href="fiches/?ecpi_id={epciId}">Mon plan d'actions</a>
                </li>
                <li>
                    <a class="fr-link" href="actions_referentiels/?epci_id={epciId}">Référentiels</a>
                </li>
                <li>
                    <a class="fr-link" href="indicateurs/?epci_id={epciId}">Indicateurs</a>
                </li>
                <li>
                    <a class="fr-link fr-fi-account-line" href="connexion/?epci_id={epciId}">Déconnexion</a>
                </li>
            {:else}
                {#if !segment }
                    <li>
                        <a class="fr-link" href="fiches/?epci_id=test">Tester</a>
                    </li>
                    <li>
                        <a class="fr-link fr-fi-account-line" href="connexion/?epci_id={epciId}">Se connecter</a>
                    </li>
                {/if}
            {/if}
        </ul>
    </div>
</div>