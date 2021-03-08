# Grey College JCR - New Website
## Setup
1. Download and install Node.js (includes npm) https://nodejs.org/en/download/
2. Download and install MySQL https://www.mysql.com/downloads/
3. Download the repository locally
4. Create a file called '.env' in the server folder. Fill it with the contents described in the Server .env section below.
5. In the same directory create a file called 'prepaid_memberships.json' with the contents: `{}`.
5. Create a new database in MySQL called 'grey-shop'. Change the DB_USERNAME and DB_PASSWORD in the .env file to match your account for MySQL.
6. Inside the server folder, open new a terminal and run 'npm install'.
7. Once it is complete, run 'npm start' in the server folder. This will start the server and create the necessary tables.
8. Inside the frontend folder, open new a terminal and run 'npm install'.
9. Once it is complete, run 'npm start' in the frontend folder. This will open the page in your default web browser.

This should get the site up and running locally.

Leave the server and frontend running while developing. Both have hot-reloading so you can just develop without worrying about restarting either. Although if the server is reloaded sessions do not persist so it will log you out.

## Server .env
```
DB_NAME=grey-shop
DB_USERNAME=username
DB_PASSWORD=password
DB_HOST=localhost
DB_DIALECT=mysql
EXPRESS_PORT=9000
SESSION_SECRET=randomstringshouldgohere
STRIPE_SECRET_KEY=<Stripe Secret sk_...>
WEB_ADDRESS=http://localhost:9000
STRIPE_ENDPOINT_SECRET=string provided by Stripe
EMAIL_HOST=url
EMAIL_PORT=email port
EMAIL_SECURE=(true if the port is 465, false otherwise)
EMAIL_USERNAME=emailaddress
EMAIL_PASSWORD=emailpassword
EMAIL_SENDER=yourname
TOASTIE_BAR_EMAIL_TO=Where to send the orders
DEBUG=false
```

For setting the .env up for Durham email addresses, use the following: ([More information here](https://www.dur.ac.uk/cis/faqs/?faqno=2721))
```
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USERNAME=<cis username goes here>@durham.ac.uk
EMAIL_PASSWORD=<cis password goes here>
EMAIL_SENDER=<an alias or the cis username for the account>@durham.ac.uk
```
