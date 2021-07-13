#!/usr/bin/env sh

sam local invoke \
    --template ../.aws-sam/build/template.yaml \
    --event ../events/d00m-authorizer.json \
    --env-vars ./env.json \
    AuthorizerFunction
