<script lang="ts">
    /**
     * Redirects to keycloak sign in form
     * Then keycloak will redirect to `redirect/index.svelte`
     */
    import {onMount} from "svelte";



    onMount(() => {
        const host = window.location.hostname
        const redirect = `https://${host}/auth/redirect/`
        const realm = 'master'
        const keycloak = 'https://moncompte.ademe.fr'

        window.location.href =
            `${keycloak}/auth/realms/${realm}/protocol/openid-connect/auth`
            + `?client_id=territoiresentransitions&response_type=code&redirect_uri=${redirect}`

    })
</script>
<h1>Redirection en cours</h1>