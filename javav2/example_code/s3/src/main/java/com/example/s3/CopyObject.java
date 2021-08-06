//snippet-sourcedescription:[CopyObject.java demonstrates how to copy an object from one Amazon Simple Storage Service (Amazon S3) bucket to another]
//snippet-keyword:[AWS SDK for Java v2]
//snippet-keyword:[Code Sample]
//snippet-service:[Amazon S3]
//snippet-sourcetype:[full-example]
//snippet-sourcedate:[01/08/2021]
//snippet-sourceauthor:[scmacdon-aws]

/*
   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
   SPDX-License-Identifier: Apache-2.0
*/

package com.example.s3;

// snippet-start:[s3.java2.copy_object.import]
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.CopyObjectResponse;
import software.amazon.awssdk.services.s3.model.S3Exception;
// snippet-end:[s3.java2.copy_object.import]

/**
 * To run this AWS code example, ensure that you have setup your development environment, including your AWS credentials.
 *
 * For information, see this documentation topic:
 *
 * https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/get-started.html
 */


public class CopyObject {

    public static void main(String[] args) {
        final String USAGE = "\n" +
                "Usage:\n" +
                "    CopyObject <objectKey> <fromBucket> <toBucket>\n\n" +
                "Where:\n" +
                "    objectKey - the name of the object (for example, book.pdf).\n\n" +
                "    fromBucket - the S3 bucket name that contains the object (for example, bucket1).\n" +
                "    toBucket - the S3 bucket to copy the object to (for example, bucket2).\n";

        if (args.length != 3) {
            System.out.println(USAGE);
            System.exit(1);
       }

        String objectKey = args[0];
        String fromBucket = args[1];;
        String toBucket =  args[2];;

        System.out.format("Copying object %s from bucket %s to %s\n",
                objectKey, fromBucket, toBucket);

        Region region = Region.US_EAST_1;
        S3Client s3 = S3Client.builder()
                .region(region)
                .build();

        copyBucketObject (s3, fromBucket, objectKey, toBucket);
        s3.close();
    }

    // snippet-start:[s3.java2.copy_object.main]
    public static String copyBucketObject (S3Client s3, String fromBucket, String objectKey, String toBucket) {

        CopyObjectRequest copyReq = CopyObjectRequest.builder()
                .sourceBucket(fromBucket)
                .sourceKey(objectKey)
                .destinationBucket(toBucket)
                .destinationKey(objectKey)
                .build();

        try {
            CopyObjectResponse copyRes = s3.copyObject(copyReq);
            return copyRes.copyObjectResult().toString();
        } catch (S3Exception e) {
            System.err.println(e.awsErrorDetails().errorMessage());
            System.exit(1);
        }
        return "";
    }
    // snippet-end:[s3.java2.copy_object.main]
}
