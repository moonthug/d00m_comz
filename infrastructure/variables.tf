# -----------------------------------------------------------------------------
# Variables: General
# -----------------------------------------------------------------------------

variable "namespace" {
  description = "Namespace and AWS prefix"
  default = "d00m"
}

variable "environment" {
  description = "Environment to use"
}

variable "domain" {
  description = "Main domain"
}


# -----------------------------------------------------------------------------
# Variables: AWS
# -----------------------------------------------------------------------------

variable "region" {
  description = "AWS Region"
}

variable "profile" {
  description = "AWS Profile to use"
}


# -----------------------------------------------------------------------------
# Variables: Cognito
# -----------------------------------------------------------------------------

variable "admin_password" {
  description = "Cognito Admin password"
}

variable "cognito_create_users" {
  description = "List of cognito users to create"
  type        = list(string)
  default     = [
    "a",
    "b",
    "c",
  ]
}


# -----------------------------------------------------------------------------
# Variables: Locals
# -----------------------------------------------------------------------------

locals {
  tags = {
    "namespace": var.namespace
    "environment": var.environment
  }
}
