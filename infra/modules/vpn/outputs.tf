output "public_ip" {
  description = "IP publique de la passerelle : Endpoint des postes opérateurs, et source à autoriser sur le 22 des serveurs applicatifs."
  value       = scaleway_instance_ip.vpn.address
}

output "private_ip" {
  description = "IP privée de la passerelle. Source des flux opérateurs dans l'ACL du VPC."
  value       = scaleway_ipam_ip.vpn.address
}

output "endpoint" {
  description = "Endpoint WireGuard (ip:port) à mettre dans la configuration des postes opérateurs."
  value       = "${scaleway_instance_ip.vpn.address}:${var.listen_port}"
}

output "client_allowed_ips" {
  description = "AllowedIPs de chaque poste opérateur, par nom de pair : ce que la passerelle lui relaie, passerelle comprise (10.99.0.1, cible SSH tet-ops)."
  value = {
    for name, p in var.peers : name => join(", ", concat(
      ["${local.gateway_tunnel_address}/32"],
      p.routed_cidrs == null ? var.routed_cidrs : p.routed_cidrs,
    ))
  }
}

output "sshd_host_public_key" {
  description = "Clé d'hôte SSH de la passerelle, à épingler dans known_hosts."
  value       = trimspace(tls_private_key.sshd_host.public_key_openssh)
}
