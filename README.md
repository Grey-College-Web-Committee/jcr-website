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
DB_NAME=grey-shop
DB_USERNAME=username
DB_PASSWORD=password
DB_HOST=localhost
DB_DIALECT=mysql
EXPRESS_PORT=9000
SESSION_SECRET=randomstringshouldgohere
STRIPE_SECRET_KEY=<Stripe Secret sk_...>
JWT_SECRET=somesecretkeyhere
JWT_EXPIRY=7200000
WEB_ADDRESS=http://localhost:9000
