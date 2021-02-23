<script lang="typescript">
  import Title from '../shared/Title'
  import Nav from '../shared/Nav'
  import { getUrlParameter } from '../../utils/url'
  import { getCustomMesure } from '../../api/customMesure'

  const id = getUrlParameter('id')
  const mesure = getCustomMesure(id)
</script>

<Nav />
<main class="container mx-auto lg:px-20 px-4" id="mesure-6.5.5">
  <Title name={mesure.name}></Title>
</main>