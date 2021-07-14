#!/usr/bin/env sh

# shellcheck disable=SC2039
set -Eeuo pipefail

###########################################################
#
# CONFIG

TABLE_NAME='d00m-dev-monolith'
USERS=("Alex" "Jo")

###########################################################
#
# HELPERS

putUser() {
  ID=`uuidgen`

  echo "Creating user: $1,${ID}"

  aws dynamodb put-item \
    --table-name="$TABLE_NAME" \
    --item='{
        "pk": {"S": "user" },
        "sk": {"S": "'"${ID}"'" },
        "name": {"S": "'"$1"'" }
      }' \
    --profile=home \
    --region=eu-west-1
}

###########################################################
#
# MAIN

# Put users
for user in "${USERS[@]}"; do
  putUser "$user"
done
#
#aws dynamodb put-item \
#  --table-name=d00m-dev-monolith \
#  --item='{
#      "pk": {"S": "user" },
#      "sk": {"S": "123" },
#      "name": {"S": "Alex" }
#    }' \
#  --profile=home \
#  --region=eu-west-1
#
#aws dynamodb put-item \
#  --table-name=d00m-dev-monolith \
#  --item='{
#      "pk": {"S": "user" },
#      "sk": {"S": "234" },
#      "name": {"S": "Jo" }
#    }' \
#  --profile=home \
#  --region=eu-west-1
