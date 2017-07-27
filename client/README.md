# Wallace Frontend

1 page app Frontend with AngularJS.

## Getting Started

1. Clone repo: `git clone git@github.com:roamandwander/wallace-frontend.git`
2. `cd` into folder: `cd wallace-frontend`
3. Install npm dependencies: `npm install`
4. Install bower dependencies: `bower install`
5. Start server: `npm start`

## Testing

1. Start frontend server with `npm start`
2. Start [wallace-server](https://github.com/roamandwander/wallace-server)
3. Go to [http://localhost:8080](http://localhost:8080)
4. Page will be automatically reloaded whenever a file change is detected.

## Deploying

Deployments compare files in `/dist` to S3 bucket contents and updates all changed files. The deployment script uses [AWS shared credentials](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SharedIniFileCredentials.html). 
The profile name saved on your machine should be `[rw]` for staging.

To deploy run:

    npm run deploy-staging