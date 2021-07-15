<script lang="ts">
    /**
     * Top navigation bar
     */
    import {onMount} from 'svelte'
    import {testUIVisibility} from '../../../api/currentEnvironment'
    import {getCurrentEpciId} from '../../../api/currentEpci'
    import {currentUtilisateurDroits} from "../../../api/authentication";
    import {EpciStorable} from "../../../storables/EpciStorable";

    export let segment: string // Type string. Typing this variable makes sapper crash.

    let showTestNavigation = false
    let epciId = ''
    let epci: EpciStorable | null = null
    let readOnly = false

    $: isLogged = segment && segment !== 'connexion'


    /**
     * Hard navigate to the test epci in order to clear Sapper state.
     */
    const handleTest = (_) => {
        window.location.href = 'fiches/?epci_id=test'
    }

    onMount(async () => {
        showTestNavigation = testUIVisibility()

        try {
            epciId = getCurrentEpciId()
            const stores = await import('../../../api/hybridStores')
            epci = await stores.epciStore.retrieveById(epciId)

            const utilisateurDroits = await currentUtilisateurDroits()
            const droits = utilisateurDroits.filter((droits) => {
                return droits.ecriture && droits.epci_id === epciId
            })
            readOnly = droits.length === 0
        } catch (e) {
            // not signed in, it's fine
        }
    })
</script>

<div class="fr-header__tools">
    <div class="fr-header__tools-links">
        <ul class="fr-links-group">
            {#if isLogged}
                {#if epci}
                    <li>
                        {epci.nom} <a class="fr-link" href="epcis/">Changer</a>
                    </li>
                {/if}
                {#if epciId}
                    <li>
                        <a class="fr-link" href="fiches/?epci_id={epciId}">Mon plan d'actions</a>
                    </li>
                    <li>
                        <a class="fr-link" href="actions_referentiels/?epci_id={epciId}">Référentiels</a>
                    </li>
                    <li>
                        <a class="fr-link" href="indicateurs/?epci_id={epciId}">Indicateurs</a>
                    </li>
                {/if}
                <li>
                    <a class="fr-link fr-fi-account-line" href="auth/signout/">Déconnexion</a>
                </li>
            {:else}
                {#if !segment || segment === 'connexion' }
                    <li>
                        <a class="fr-link fr-fi-account-line" href="auth/signin/?epci_id={epciId}">Se connecter</a>
                    </li>
                {/if}
            {/if}
        </ul>
    </div>
</div>

<div>
    {#if readOnly}
        <div class="readOnly">
            <p>lecture seule</p>
        </div>
    {/if}
</div>

<style>
    .readOnly {
        background-color: #F59E0B;
        padding-right: 1.5rem;
        padding-left: 1.5rem;
        position: absolute;
        height: 2em;
        top: 0;
        right: 0;
    }

    .readOnly :global(.fr-nav__link) {
        color: var(--w);
    }

    .readOnly :global(.fr-tag) {
        margin: 0.9rem;
    }

    .readOnly p {
        text-align: center;
    }
</style>