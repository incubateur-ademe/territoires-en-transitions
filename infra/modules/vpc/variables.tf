variable "environment" {
  description = "Nom de l'environnement (preprod, staging, prod)."
  type        = string
  validation {
    condition     = contains(["preprod", "staging", "prod"], var.environment)
    error_message = "environment doit être l'une des valeurs : preprod, staging, prod."
  }
}

variable "region" {
  description = "Région Scaleway où provisionner le VPC."
  type        = string
  default     = "fr-par"
}

variable "ipv4_subnet" {
  description = "Subnet CIDR IPv4 du Private Network (ex: 10.0.1.0/24 pour preprod, 10.0.2.0/24 pour staging, 10.0.3.0/24 pour prod). Chaque environnement doit avoir un subnet distinct."
  type        = string
}
