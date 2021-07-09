resource "aws_ssm_parameter" "domain" {
  name        = "/${var.namespace}/${var.environment}/domain"
  type        = "String"
  value       = var.domain
}

resource "aws_ssm_parameter" "cognito_user_pool_id" {
  name        = "/${var.namespace}/${var.environment}/cognito_user_pool_id"
  type        = "String"
  value       = aws_cognito_user_pool.main.id
}

resource "aws_ssm_parameter" "cognito_user_pool_arn" {
  name        = "/${var.namespace}/${var.environment}/cognito_user_pool_arn"
  type        = "String"
  value       = aws_cognito_user_pool.main.arn
}

resource "aws_ssm_parameter" "cognito_identity_pool_id" {
  name        = "/${var.namespace}/${var.environment}/cognito_identity_pool_id"
  type        = "String"
  value       = aws_cognito_identity_pool.main.id
}

resource "aws_ssm_parameter" "cognito_frontend_client_id" {
  name        = "/${var.namespace}/${var.environment}/cognito_frontend_client_id"
  type        = "String"
  value       = aws_cognito_user_pool_client.frontend.id
}
