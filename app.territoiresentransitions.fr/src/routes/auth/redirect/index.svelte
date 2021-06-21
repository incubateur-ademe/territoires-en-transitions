<script lang="ts">
    /**
     * This is where we land after a successful login attempt on ADEME keycloak.
     *
     * We exchange the code for an access token using our API.
     */
    import {onMount} from "svelte";
    import {getCurrentAPI} from "../../../api/currentAPI";
    import {getCurrentEnvironment} from "../../../api/currentEnvironment";

    let code: String = ''
    let tokenResponse: Response

    onMount(async () => {
        const urlParams = new URLSearchParams(window.location.search)
        code = urlParams.get('code')

        const api = getCurrentAPI()
        const endpoint = `${api}/v2/auth/token`

        const environment = getCurrentEnvironment()
        let host = window.location.hostname
        if (environment === 'local') host = 'sandbox.territoiresentransitions.fr'
        const redirect_uri = `https://${host}/auth/redirect/`

        tokenResponse = await fetch(`${endpoint}?redirect_uri=${redirect_uri}&code=${code}`)

        if (tokenResponse.ok) {
            const auth = await import("../../../api/authentication")
            const data = await tokenResponse.json()
            auth.saveTokens(data['access_token'], data['refresh_token'])
        }
    })
</script>

<div>
    {#if tokenResponse}
        {#if tokenResponse.ok}
            <h1 class="text-xl">Bienvenue</h1>
        {:else}
            <h1 class="text-xl">Erreur d'authenfication</h1>
            <div class="pb-5"></div>
            <p>Une erreur s'est produite et nous n'avons pas pu vous authentifier</p>
        {/if}
    {:else }
        <p>Authentification en cours...</p>
    {/if}
</div>
