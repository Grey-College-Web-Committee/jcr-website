# Grey College JCR - New Website
## Setup
This setup guide will go through and explain how to setup the website locally assuming that you have not installed any previous software etc. If you already have a database on your computer or Node installed then those steps can be skipped but changes may need to be made to the .env file.
1. Download and install Node.js (includes npm) https://nodejs.org/en/download/
2. Download and install MySQL via XAMPP https://www.apachefriends.org/index.html
4. Download and install Python https://www.python.org/downloads/ (only necessary if you wish to use the simplified setup.py script which is recommended)
3. Download the repository locally via GitHub (GitHub Desktop is an easy client to use https://desktop.github.com/)
4. Open XAMPP and start Apache and MySQL
5. Open a web browser and go to http://localhost/phpmyadmin, click 'New' on the left-hand side
6. Create a new database, make note of the name e.g. grey-website
7. Run setup.py on (requires Python 3.6+) and follow the prompts (add stuff about emails)
8. Inside the server folder, open new a terminal and run 'npm install'.
9. Once it is complete, run 'npm start' in the server folder. This will start the server and create the necessary tables.
10. Inside the frontend folder, open new a terminal and run 'npm install'.
11. Once it is complete, run 'npm start' in the frontend folder. This will open the page in your default web browser.

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
