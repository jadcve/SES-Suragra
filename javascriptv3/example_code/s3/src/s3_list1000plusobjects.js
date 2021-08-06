/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
ABOUT THIS NODE.JS EXAMPLE: This example works with AWS SDK for JavaScript version 3 (v3),
which is available at https://github.com/aws/aws-sdk-js-v3. This example is in the 'AWS SDK for JavaScript v3 Developer Guide' at
https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-example-creating-buckets.html.

Purpose:
s3_list1000plusObjects.js demonstrates how to list more than 1000 objects in an Amazon S3 bucket.

Inputs (replace in code):
- BUCKET_NAME

Running the code:
node s3_list1000plusObjects.js

*/
// snippet-start:[s3.JavaScript.buckets.listManyObjectsV3]
// Import required AWS SDK clients and commands for Node.js
import { ListObjectsCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./libs/s3Client.js"; // Helper function that creates Amazon S3 service client module.

// Create the parameters for the bucket
export const bucketParams = { Bucket: "BUCKET_NAME" };

export async function run() {
  // Declare truncated as a flag that we will base our while loop on
  let truncated = true;
  // Declare a variable that we will assign the key of the last element in the response to
  let pageMarker;
  // While loop that runs until response.truncated is false
  while (truncated) {
    try {
      const response = await s3Client.send(new ListObjectsCommand(bucketParams));
      // return response; //For unit tests
      response.Contents.forEach((item) => {
        console.log(item.Key);
      });
      // Log the Key of every item in the response to standard output
      truncated = response.IsTruncated;
      // If 'truncated' is true, assign the key of the final element in the response to our variable 'pageMarker'
      if (truncated) {
        pageMarker = response.Contents.slice(-1)[0].Key;
        // Assign value of pageMarker to bucketParams so that the next iteration will start} from the new pageMarker.
        bucketParams.Marker = pageMarker;
      }
      // At end of the list, response.truncated is false and our function exits the while loop.
    } catch (err) {
      console.log("Error", err);
      truncated = false;
    }
  }
}
run();
// snippet-end:[s3.JavaScript.buckets.listManyObjectsV3]
// For unit testing only.
// module.exports ={run, bucketParams};
