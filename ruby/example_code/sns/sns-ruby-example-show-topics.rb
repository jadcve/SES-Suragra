# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

# Purpose:
# sns-ruby-example-show-topics.rb demonstrates how to list Amazon Simple Notification Services (SNS) topics using
# the AWS SDK for JavaScript (v3).

# Inputs:
# - REGION

# snippet-start:[sns.Ruby.showTopics]

require 'aws-sdk-sns'  # v2: require 'aws-sdk'

def list_topics?(sns_client)
  sns_client.topics.each do |topic|
    puts topic.arn
rescue StandardError => e
  puts "Error while listing the topics: #{e.message}"
  end
  end

def run_me

  region = 'eu-west-1'
  sns_client = Aws::SNS::Resource.new(region: region)

  puts "Listing the topics."

  if list_topics?(sns_client)
  else
    puts 'The bucket was not created. Stopping program.'
    exit 1
  end
end
run_me if $PROGRAM_NAME == __FILE__

# snippet-end:[sns.Ruby.showTopics]
