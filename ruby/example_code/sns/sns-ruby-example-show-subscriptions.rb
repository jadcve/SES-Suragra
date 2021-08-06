# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

# Purpose:
# sns-ruby-example-show-subscriptions.rb demonstrates how to list subscriptions to the Amazon Simple Notification Services (SNS) topic using
# the AWS SDK for JavaScript (v3).

# Inputs:
# - REGION
# - SNS_TOPIC

# snippet-start:[sns.Ruby.showSubscription]

require 'aws-sdk-sns'  # v2: require 'aws-sdk'

def show_subscriptions?(sns_client, topic_arn)
  topic = sns_client.topic(topic_arn)
  topic.subscriptions.each do |s|
    puts s.attributes['Endpoint']
  end

rescue StandardError => e
  puts "Error while sending the message: #{e.message}"
end

def run_me

  topic_arn = 'arn:aws:sns:eu-west-1:164794437551:brmurrubytopic'
  region = 'eu-west-1'

  sns_client = Aws::SNS::Resource.new(region: region)

  puts "Listing subscriptions to the topic."

  if show_subscriptions?(sns_client, topic_arn)
  else
    puts 'There was an error. Stopping program.'
    exit 1
  end
end

run_me if $PROGRAM_NAME == __FILE__

# snippet-end:[sns.Ruby.showSubscription]
