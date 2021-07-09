# Create Cognito Userpool
resource "aws_cognito_user_pool" "main" {
  name                     = "${var.namespace}-${var.environment}-user-pool"
  tags                     = local.tags

  auto_verified_attributes = ["email"]
  mfa_configuration        = "OFF"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "email"
    required                 = true

    string_attribute_constraints {
      max_length = "2048"
      min_length = "0"
    }
  }

  verification_message_template {
    default_email_option  = "CONFIRM_WITH_LINK"
    email_message_by_link = "Verify here -> {##Click Here##}"
    email_subject_by_link = "Verification Email"
  }

  email_configuration {
    reply_to_email_address = "no-reply@d00m.ch"
  }
}

# Create Identity User Pool Client
resource "aws_cognito_user_pool_client" "identity" {
  name                         = "identity"
  user_pool_id                 = aws_cognito_user_pool.main.id

  read_attributes              = ["email"]
  write_attributes             = ["email"]
  refresh_token_validity       = 30
  supported_identity_providers = ["COGNITO"]
  callback_urls                = ["http://localhost:3000"]
  logout_urls                  = ["http://localhost:3000"]
}

# Create Frontend User Pool Client
resource "aws_cognito_user_pool_client" "frontend" {
  name                         = "frontend"
  user_pool_id                 = aws_cognito_user_pool.main.id

  read_attributes              = ["email"]
  write_attributes             = ["email"]
  refresh_token_validity       = 30
  supported_identity_providers = ["COGNITO"]
  callback_urls                = ["http://localhost:3000"]
  logout_urls                  = ["http://localhost:3000"]
}

//# Create auth sub-domain record in Route53
//resource "aws_route53_record" "auth" {
//  zone_id = data.aws_route53_zone.main.zone_id
//  name    = "auth.${data.aws_route53_zone.main.name}"
//  type    = "A"
//
//  alias {
//    name                   = aws_cognito_user_pool_domain.main.cloudfront_distribution_arn
//    zone_id                = "Z2FDTNDATAQYW2"
//    evaluate_target_health = "false"
//  }
//}
//
//# Link auth sub-domain to cognito as a custom domain
//resource "aws_cognito_user_pool_domain" "main" {
//  domain          = "auth.${data.aws_route53_zone.main.name}"
//  certificate_arn = aws_acm_certificate.default.arn
//  user_pool_id    = aws_cognito_user_pool.main.id
//  depends_on      = [
//    aws_route53_record.main
//  ]
//}

# Create identity pool
resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = "${var.namespace}-${var.environment}-identity-pool"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.identity.id
    provider_name           = aws_cognito_user_pool.main.endpoint
    server_side_token_check = false
  }

//  supported_login_providers = {
//    "graph.facebook.com" = "<your App ID goes here. Refer to picture at the top>"
//  }
}

# Attach IAM roles
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    "authenticated"   = aws_iam_role.api_gateway_access.arn
    "unauthenticated" = aws_iam_role.deny_everything.arn
  }
}

# Create admin user
resource "null_resource" "cognito_user_create" {
  triggers = {
    user_pool_id = aws_cognito_user_pool.main.id
  }

  provisioner "local-exec" {
    command = <<EOT
    aws cognito-idp admin-create-user \
      --user-pool-id ${aws_cognito_user_pool.main.id} \
      --username admin \
      --user-attributes '[{"Name": "email", "Value": "alex@polyglot.rodeo"}]' \
      --profile=${var.profile} \
      --region=${var.region}
    EOT
  }
}

resource "null_resource" "cognito_user_update_password" {
  triggers = {
    user_pool_id = aws_cognito_user_pool.main.id
  }

  provisioner "local-exec" {
    command = <<EOT
    aws cognito-idp admin-set-user-password \
      --user-pool-id ${aws_cognito_user_pool.main.id} \
      --username admin \
      --password ${var.admin_password} \
      --permanent \
      --profile=${var.profile} \
      --region=${var.region}
    EOT
  }
}
