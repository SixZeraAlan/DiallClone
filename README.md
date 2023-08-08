# DiallClone  

This document describes how to set up and run the code for the Expo project. Follow the instructions below to get started.

## Table of Contents  

- [DiallClone](#diallclone)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Configuration](#configuration)
    - [Install Amplify CLI](#install-amplify-cli)
    - [Configure Amplify CLI:](#configure-amplify-cli)
    - [Initialize Amplify in the project:](#initialize-amplify-in-the-project)
    - [Use Amplify CLI to add authentication:](#use-amplify-cli-to-add-authentication)
    - [Push Changes:](#push-changes)
    - [make a copy of the aws-exports.js named aws-exports-copy.js with in the root directory:](#make-a-copy-of-the-aws-exportsjs-named-aws-exports-copyjs-with-in-the-root-directory)
    - [Documentation may help:](#documentation-may-help)
    - [Create S3 bucket:](#create-s3-bucket)
  - [Setting Up Firestore Firebase](#setting-up-firestore-firebase)
    - [1. Create a Firestore Project](#1-create-a-firestore-project)
    - [2. Add a Web App](#2-add-a-web-app)
    - [3. Configure Firebase in Your Project](#3-configure-firebase-in-your-project)
    - [4. Build Firestore Collections](#4-build-firestore-collections)
  - [Installation](#installation)
    - [1. Clone the Project](#1-clone-the-project)
    - [2. Navigate to the Project Directory](#2-navigate-to-the-project-directory)
    - [3. Install Dependencies](#3-install-dependencies)
  - [Running the Project](#running-the-project)
    - [1. Start the Project](#1-start-the-project)
    - [2. Start the Backend Service](#2-start-the-backend-service)
  - [Problems identified and Short Action Plan...](#problems-identified-and-short-action-plan)
  - [To be added...](#to-be-added)

## Prerequisites

**AWS CLI**: Make sure you have set up the AWS CLI service on your computer.  
**AWS Amplify & AWS S3 Service**: Ensure that you have configured the appropriate AWS services.  
**Node.js**: This project requires Node.js. Please install it.  
**Expo CLI**: Please install the Expo CLI.  

## Configuration

Create a \`.env\` file in the project root directory with the following content. Replace the placeholders with your actual credentials:  

```
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
SERVER_URL=YOUR_SERVER_URL
BASE_VIDEO_URI=YOUR_BASE_VIDEO_URI
FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
FIREBASE_MEASUREMENT_ID=YOUR_FIREBASE_MEASUREMENT_ID
```

### Install Amplify CLI

Install the Amplify CLI globally by running the following command:
```
npm install -g @aws-amplify/cli
```

### Configure Amplify CLI:  
Configure the Amplify CLI with your AWS credentials.
```
amplify configure
```
Follow the prompts to configure the CLI with your AWS account.

### Initialize Amplify in the project:  
Navigate to the project directory and run: 
```
amplify init
```
Follow the prompts to initialize Amplify in the project.

### Use Amplify CLI to add authentication:
```
amplify add auth
```
### Push Changes: 
Apply the changes to your backend:
```
amplify push
```

After pushing the changes, the aws-exports.js file will be created.

If you already have an Amplify project set up and want to regenerate the aws-exports.js file, you can run the following command:
```
amplify pull
```
### make a copy of the aws-exports.js named aws-exports-copy.js with in the root directory:  
Your aws-export-copy.js could be like this, and be sure to use module.exports in the last: 

const awsmobile = {
  // ... Configuration here
};

module.exports = awsmobile;

### Documentation may help:

https://docs.amplify.aws/cli/start/install/#configure-the-amplify-cli  

https://docs.amplify.aws/lib/auth/getting-started/q/platform/js/

### Create S3 bucket:
Go to AWS console and create a s3 bucket to be used, go to Bucket and click the bucket name you created, then go to the permissions tab to modify the Bucket policy to be public with the following configuration:
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicRead",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::diallclone65bac59de67a4901a7dfca360c0ba623214331-dev/*"
        }
    ]
}
```



## Setting Up Firestore Firebase

Follow the steps below to configure your Firestore project with the required collections and fields.

### 1. Create a Firestore Project  

   Navigate to the Firebase Console. Click on "Add Project" and follow the instructions to create a new project.
### 2. Add a Web App  

   Inside your newly created project, click on "Add App" and choose the Web platform. Follow the instructions to register your web app with Firebase.
### 3. Configure Firebase in Your Project  

   Once your web app is registered, you'll receive a Firebase configuration object. Add these values to the .env file in your project using the following keys:
   
```
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-auth-domain
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### 4. Build Firestore Collections  
   Navigate to the "Database" section in the Firebase Console. Choose Firestore Database and click "Create Database." In the Firestore Database panel, create a collection named \`therapists\`. Add documents to the \`therapists\` collection with the following fields:  

```
profilePic: string,
username: string,
keywords: array of strings
```

## Installation
### 1. Clone the Project
If you haven't already, clone the project to your local machine.

### 2. Navigate to the Project Directory

```
cd your/path
```

### 3. Install Dependencies

Run the following commands to install all required dependencies:

```
expo install
npm install
```



## Running the Project

### 1. Start the Project  

```
npx expo start
```
Then open the iOS simulator or run the project on your iOS device with Expo installed.

### 2. Start the Backend Service
note: if you want to run the project on your physical device, please replace the SERVER_URL in the .env file with this: http://YOUR_IP_ADDRESS:3000
   
Open another terminal within the root of the project:
```
node server.js
```


## Problems identified and Short Action Plan...

[Click here to view the detailed PDF](https://drive.google.com/file/d/1jPefB_fJlLy3-bnSUSmJE2QuN3w3-kvC/view?usp=drive_link)

## To be added...
