variable "name" {
  description = "Nom du bucket."
  type        = string
}

variable "tags" {
  description = "Tags du bucket."
  type        = map(string)
  default     = {}
}

variable "admin_principals" {
  description = "Opérateurs autorisés sur le bucket, sous la forme user_id:<uuid> ou application_id:<uuid>. Doit contenir toute identité qui lance terraform apply sur le stack : une bucket policy refuse tout ce qu'elle ne liste pas, y compris la lecture de l'état du bucket."
  type        = list(string)
  validation {
    condition = length(var.admin_principals) > 0 && alltrue([
      for p in var.admin_principals : can(regex("^(user_id|application_id):[0-9a-f-]{36}$", p))
    ])
    error_message = "Au moins un principal, chacun sous la forme user_id:<uuid> ou application_id:<uuid>."
  }
}

variable "statements" {
  description = "Déclarations de la bucket policy propres à l'usage du bucket (Sid, Effect, Principal, Action, Resource), au format Scaleway. La déclaration des opérateurs est ajoutée par le module."
  type        = any
  default     = []
}
