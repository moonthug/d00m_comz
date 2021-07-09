provider "aws" {
  region  = var.region
  profile = "home"
}

provider "aws" {
  region = "us-east-1"
  profile = "home"
  alias = "us-east-1"
}
