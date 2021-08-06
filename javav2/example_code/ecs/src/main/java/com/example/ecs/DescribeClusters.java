//snippet-sourcedescription:[DescribeClusters.java demonstrates how to describe a cluster for the Amazon Elastic Container Service (Amazon ECS) service.]
//snippet-keyword:[AWS SDK for Java v2]
//snippet-keyword:[Code Sample]
//snippet-service:[Amazon Elastic Container Service]
//snippet-sourcetype:[full-example]
//snippet-sourcedate:[06/20/2021]
//snippet-sourceauthor:[scmacdon-aws]

/*
   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
   SPDX-License-Identifier: Apache-2.0
*/

package com.example.ecs;

import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ecs.EcsClient;
import software.amazon.awssdk.services.ecs.model.DescribeClustersRequest;
import software.amazon.awssdk.services.ecs.model.DescribeClustersResponse;
import software.amazon.awssdk.services.ecs.model.Cluster;
import software.amazon.awssdk.services.ecs.model.EcsException;
import java.util.List;

/**
 To run this Java V2 code example, ensure that you have setup your development environment,
 including your credentials.

 For information, see this documentation topic:
 https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/get-started.html
 */
public class DescribeClusters {

    public static void main(String[] args) {

        final String usage = "\n" +
                "Usage:\n" +
                "  DescribeClusters " +
                "   <clusterArn>  \n\n" +
                "Where:\n" +
                "  clusterArn - the ARN of the ECS cluster to describe.\n"  ;

        if (args.length != 1) {
            System.out.println(usage);
            System.exit(1);
        }

        String clusterArn = args[0] ;
        Region region = Region.US_EAST_1;
        EcsClient ecsClient = EcsClient.builder()
                .region(region)
                .build();

        descCluster(ecsClient, clusterArn);

    }

    public static void descCluster(EcsClient ecsClient, String clusterArn) {

        try {
            DescribeClustersRequest clustersRequest = DescribeClustersRequest.builder()
                    .clusters(clusterArn)
                   .build();

            DescribeClustersResponse response = ecsClient.describeClusters(clustersRequest);
            List<Cluster> clusters = response.clusters();
            for (Cluster cluster: clusters) {
                System.out.println("The cluster name is "+cluster.clusterName());
            }

        } catch (EcsException e) {
            System.err.println(e.awsErrorDetails().errorMessage());
            System.exit(1);
        }
    }
}
