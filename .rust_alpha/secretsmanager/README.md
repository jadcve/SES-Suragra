# AWS SDK for Rust code examples for AWS Secrets Manager

## Purpose

These examples demonstrate how to perform several Secrets Manager operations using the alpha version of the AWS SDK for Rust.

## Prerequisites

You must have an AWS account, and have configured your default credentials and AWS Region as described in [https://github.com/awslabs/aws-sdk-rust](https://github.com/awslabs/aws-sdk-rust).

## Running the code

### create-secret

This example creates a Secrets Manager secret.

`cargo run --bin create-secret -- -n NAME -c CONTENT [-d DEFAULT-REGION] [-v]`

- _NAME_ is the name of the secret.
- _CONTENT_ is the contents of the secret.
- _DEFAULT-REGION_ is optional name of a region, such as __us-east-1__.
  If this value is not supplied, the region defaults to __us-west-2__.

### get-secret-value

Displays the value of a Secrets Manager secret.

`cargo run --bin get-secret-value -- -n NAME -c CONTENT [-d DEFAULT-REGION]`

- _NAME_ is the name of the secret.
- _CONTENT_ is the contents of the secret.
- _DEFAULT-REGION_ is optional name of a region, such as __us-east-1__.
  If this value is not supplied, the region defaults to __us-west-2__.

### list-secrets

This example lists the names the Secrets Manager secrets in the region.

`cargo run --bin list-secrets -- [-d DEFAULT-REGION]`

- _DEFAULT-REGION_ is optional name of a region, such as __us-east-1__.
  If this value is not supplied, the region defaults to __us-west-2__.

### Notes

- We recommend that you grant this code least privilege,
  or at most the minimum permissions required to perform the task.
  For more information, see
  [Grant Least Privilege](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#grant-least-privilege)
  in the AWS Identity and Access Management User Guide.
- This code has not been tested in all AWS Regions.
  Some AWS services are available only in specific
  [Regions](https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services).
- Running this code might result in charges to your AWS account.

Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. SPDX-License-Identifier: Apache-2.0
