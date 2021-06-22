<script>
  export let href = '';
  export let title = undefined;
</script>

<li>
  <a {href} {title} class="fr-link" rel={href.substring(0, 4) === 'http' ? 'external' : undefined} target={href.substring(0, 4) === 'http' ? undefined : '_self'}>
    <span class="fr-fi-user fr-ds-picto fr-fi--sm fr-mr-2v" /><slot></slot>
  </a>
</li>

<style>
  .fr-fi--sm {
    font-size: 1rem;
  }
  .fr-ds-picto::before {
    width: 1rem;
    height: 1rem;
    display: block;
    background-repeat: no-repeat;
    background-position: left center;
    content: '';
  }
  .fr-fi-user::before {
    background-image: url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M6.99919 0.333099C10.6792 0.333099 13.6659 3.31977 13.6659 6.99977C13.6659 10.6798 10.6792 13.6664 6.99919 13.6664C3.31919 13.6664 0.33252 10.6798 0.33252 6.99977C0.33252 3.31977 3.31919 0.333099 6.99919 0.333099ZM3.01452 9.2771C3.99319 10.7371 5.46252 11.6664 7.10585 11.6664C8.74852 11.6664 10.2185 10.7378 11.1965 9.2771C10.087 8.24016 8.62448 7.6643 7.10585 7.66643C5.58699 7.66414 4.12419 8.24001 3.01452 9.2771ZM6.99919 6.3331C8.10376 6.3331 8.99919 5.43767 8.99919 4.3331C8.99919 3.22853 8.10376 2.3331 6.99919 2.3331C5.89462 2.3331 4.99919 3.22853 4.99919 4.3331C4.99919 5.43767 5.89462 6.3331 6.99919 6.3331Z' fill='%23000091'/%3E%3C/svg%3E%0A");
  }
</style>
