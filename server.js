require('dotenv').config();

const express = require('express');
const AWS = require('aws-sdk');
const awsconfig = require('./aws-exports-copy');

const app = express();
const port = 3000;

AWS.config.update({
  region: awsconfig.aws_user_files_s3_bucket_region,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

app.get('/videos', async (req, res) => {
  const bucketParams = {
    Bucket: awsconfig.aws_user_files_s3_bucket,
    Prefix: 'public/', // replace with your folder if any
  };

  try {
    const data = await s3.listObjectsV2(bucketParams).promise();

    const videos = data.Contents.map(({ Key }) => ({
      uri: `https://${awsconfig.aws_user_files_s3_bucket}.s3.${awsconfig.aws_user_files_s3_bucket_region}.amazonaws.com/${Key}`,
      user: 'User', // Add appropriate user data
      title: 'Title', // Add appropriate title
    }));

    res.json(videos);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
