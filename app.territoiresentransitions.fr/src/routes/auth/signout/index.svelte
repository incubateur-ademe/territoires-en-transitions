<script lang="ts">
    /**
     * Redirects to keycloak sign out endpoint
     */
    import {onMount} from "svelte";


    onMount(async () => {
        const auth = await import("../../../api/authentication")
        auth.signOut()

        const host = window.location.hostname
        const logout = `https://${host}`
        const realm = 'master'
        const keycloak = 'https://moncompte.ademe.fr'

        window.location.href =
            `${keycloak}/auth/realms/${realm}/protocol/openid-connect/logout/`
            + `?redirect_uri=${logout}`

    })
</script>
<h1>Redirection en cours</h1>