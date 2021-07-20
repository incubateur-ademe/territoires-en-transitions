<script lang="ts">
    /**
     * Allow to use tokens as a way to login for development purposes.
     */
    import Button from '../../../components/shared/ButtonV2/Button.svelte'

    let accessToken = ''
    let refreshToken = ''

    const save = async () => {
        const auth = await import("../../../api/authentication")
        auth.saveTokens(accessToken.trim(), refreshToken.trim())
    }

    const saveDummy = async () => {
        const auth = await import("../../../api/authentication")
        auth.saveDummyTokens()
    }
</script>

<style>
    pre {
        display: inline;
    }
</style>

<div class="fr-container">
    <div class="fr-grid-row fr-mb-2w">
        <h1 class="fr-h1">Connexion par token</h1>
        <div>
            Cette action permet d'enregistrer un <pre>AccessToken</pre> collecté via sandbox ou la production dans
            <pre>LocalStorage</pre>. Pour cela :
            <ul>
                <li class="fr-pl-2w">
                    - <a
                       href="https://sandbox.territoiresentransitions.fr/auth/signin"
                       target="_blank">Se connecter</a>
                </li>
                <li class="fr-pl-2w">
                    - Puis, récupérer les tokens dans les dev tools sur la réponse de l'endpoint
                    <pre>v2/auth/token</pre> ou depuis <pre>LocalStorage</pre> et les coller dans leschamps suivants.
                </li>
            </ul>

        </div>
    </div>

    <div class="fr-grid-row">
        <h2 class="fr-h2">Access Token</h2>
    </div>

    <div class="fr-grid-row fr-mb-2w">
        <textarea class="fr-col-12" bind:value={accessToken} rows="10"></textarea>
    </div>

    <div class="fr-grid-row">
        <h2 class="fr-h2">Refresh Token</h2>
    </div>

    <div class="fr-grid-row fr-mb-2w">
        <textarea class="fr-col-12" bind:value={refreshToken} rows="10"></textarea>
    </div>

    <div class="fr-grid-row fr-mb-2w">
        <Button on:click={save}>Se connecter</Button>
    </div>

    <hr>

    <div class="fr-grid-row">
        <h1 class="fr-h1">Connexion avec un faux token</h1>
        <div class="fr-mb-2w">
            Cette méthode fonctionne avec l'API en mode <pre>AUTH_DISABLED_DUMMY_USER</pre>. Cette action enregistre un
            faux token dans <pre>LocalStorage</pre>.
        </div>
    </div>

    <div class="fr-grid-row fr-mb-2w">
        <Button on:click={saveDummy}>Utiliser un faux token</Button>
    </div>

    <hr>

    <div class="fr-grid-row">
        <h1 class="fr-h1">Vérifier l'identité</h1>
    </div>

    <p class="fr-mb-2w">
        <Button classNames="fr-mr-1w" href="/auth/identity" colorVariant="whitelily">Aller à la page identity</Button>
        <Button href="/auth/identity" colorVariant="whitelily">Aller sur les EPCIs</Button>
    </p>
</div>