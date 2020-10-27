# Grey Payments
## Setup
1. Download and install Node.js (includes npm) https://nodejs.org/en/download/
2. Fork this repository and download it locally
3. Inside the server folder create a file named '.env' and fill it with the contents described in the 'Server .env' section in this document
4. Navigate to the server folder in a terminal/CMD and run 'npm install'
5. Run 'npm start' in the server folder (this will open the server and initialise your database and tables)
6. Navigate to the server folder in a terminal/CMD and run 'npm install'
7. In the frontend folder edit the package.json and change the line with 'proxy' on to match the port that you used for the express server
8. Run 'npm start' in the frontend folder (this will take a little longer but will open the React app in your web browser)

This should get the app up and running.

Leave the server and frontend running while developing. Both have hot-reloading so you can just develop without worrying about restarting either. Although if the server is reloaded sessions do not persist.

## Server .env
Each line consists of a key-value pair of the form 'KEY=VALUE'
|Key|Value|Explanation|
|---|-----|-----------|
|DB_NAME|The name of the database on your system|Used to store the tables for the server, it is advisable to create the database but the tables will be automatically created on first run|
|DB_USERNAME|Username for an account that can access the database|Details for accessing the database|
|DB_PASSWORD|Username for an account that can access the database|Details for accessing the database|
|DB_HOST|The hostname where the database can be accessed|e.g. localhost|
|DB_DIALECT|mysql/postgre|You will need to refer to https://sequelize.org/v5/manual/dialects.html if you use anything other than mysql|
|EXPRESS_PORT|Server port|Can use whatever value you want, e.g. 9000|
|SESSION_SECRET|Any string|Used to verify sessions. Best to avoid spaces|
|STRIPE_SECRET_KEY|Starts with sk_...|Used by the server to verify with Stripe This should never be published to the repo. Keys starting with pk_... are public and can be published|
|JWT_SECRET|A string|Secret used to sign JWTs for transactions|
|JWT_EXPIRY|A number in milliseconds|The time until a JWT expires|
|WEB_ADDRESS|A URL without the ending slash|The web address of the server to redirect back to|
