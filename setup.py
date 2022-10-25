import random
import string
import os
import json
from pathlib import Path

def repeated_input(msg, condition, err):
    value = input(f"{msg}: ")

    while not condition(value):
        err(value)
        value = input(f"{msg}: ")

    return value

def setup_env():
    print("Firstly, you will need to setup the database. The website is setup to use MySQL.")
    print("This can be installed via brew on MacOS and Linux")
    print("On Windows follow the instructions at this link: https://dev.mysql.com/doc/mysql-installation-excerpt/5.7/en/")
    print()
    print("Once it is installed and running, execute the following commands in a terminal:")
    print("mysql")
    print("CREATE DATABASE grey-db;")
    print("ALTER USER 'root'@'localhost' IDENTIFIED BY 'password';")
    print("You can change the password and database name if you want to")

    db_name = repeated_input("Database Name (enter grey-db if you followed the commands above)", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
    db_username = repeated_input("Database Username", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
    db_password = repeated_input("Database Password", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
    db_host = "localhost"
    db_dialect = "mysql"

    express_port = 9000
    session_secret = "".join(random.choice(string.ascii_uppercase + string.ascii_lowercase + string.digits) for _ in range(64))
    web_address = "http://localhost:3000/"

    stripe_endpoint_secret = input("Stripe Endpoint Secret (leave blank if not sure)")

    setup_email = repeated_input("Do you want to setup the account to email from? [recommended to enter N] (Y/N)", lambda s: s.upper() == "Y" or s.upper() == "N", lambda _: print("Input must be Y or N")).upper()
    setup_email = setup_email == "Y"

    email_host, email_port, email_secure, email_username, email_password, email_sender, local_email = "", "", "", "", "", "", False

    if setup_email:
        email_host = repeated_input("Email Host Server", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
        email_port = repeated_input("Email Port", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
        email_secure = repeated_input("Email Secure", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
        email_username = repeated_input("Email Username", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
        email_password = repeated_input("Email Password", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
        email_sender = repeated_input("Email Sender Address", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
    
    with_schedule = repeated_input("Use Scheduler [recommended to enter Y] (Y/N)", lambda s: s.upper() == "Y" or s.upper() == "N", lambda _: print("Input must be Y or N")).upper()
    with_schedule = with_schedule == "Y"
    non_member_password = "password"
    redis_port = 6379
    redis_host = "localhost"
    redis_password = "notusedforlocalbuilds"

    # write the file
    with open("./server/.env", "w+") as file:
        file.write(f"DB_NAME={db_name}{os.linesep}")
        file.write(f"DB_USERNAME={db_username}{os.linesep}")
        file.write(f"DB_PASSWORD={db_password}{os.linesep}")
        file.write(f"DB_HOST={db_host}{os.linesep}")
        file.write(f"DB_DIALECT={db_dialect}{os.linesep}")

        file.write(f"EXPRESS_PORT={express_port}{os.linesep}")
        file.write(f"SESSION_SECRET={session_secret}{os.linesep}")
        file.write(f"WEB_ADDRESS={web_address}{os.linesep}")
        file.write(f"STRIPE_SECRET_KEY={stripe_endpoint_secret}{os.linesep}")

        file.write(f"EMAIL_HOST={email_host}{os.linesep}")
        file.write(f"EMAIL_PORT={email_port}{os.linesep}")
        file.write(f"EMAIL_SECURE={email_secure}{os.linesep}")
        file.write(f"EMAIL_USERNAME={email_username}{os.linesep}")
        file.write(f"EMAIL_PASSWORD={email_password}{os.linesep}")
        file.write(f"EMAIL_SENDER={email_sender}{os.linesep}")
        file.write(f"LOCAL_EMAIL={local_email}{os.linesep}")

        file.write(f"WITH_SCHEDULE={with_schedule}{os.linesep}")
        file.write(f"NON_MEMBER_PASSWORD={non_member_password}{os.linesep}")
        file.write(f"REDIS_PORT={redis_port}{os.linesep}")
        file.write(f"REDIS_HOST={redis_host}{os.linesep}")
        file.write(f"REDIS_PASSWORD={redis_password}{os.linesep}")

def setup_jsons():
    create_debtors = True

    if os.path.exists("./server/debtors.json"):
        create_debtors = repeated_input("debtors.json exists - do you want to overwrite it?", lambda s: s.upper() == "Y" or s.upper() == "N", lambda _: print("Input must be Y or N")).upper() == "Y"

    if create_debtors:
        with open("./server/debtors.json", "w") as f:
            json.dump([], f)

    create_prepaid = True

    if os.path.exists("./server/prepaid_memberships.json"):
        create_prepaid = repeated_input("prepaid_memberships.json exists - do you want to overwrite it?", lambda s: s.upper() == "Y" or s.upper() == "N", lambda _: print("Input must be Y or N")).upper() == "Y"

    if create_prepaid:
        with open("./server/prepaid_memberships.json", "w") as f:
            json.dump({}, f)

def setup_folders():
    Path("./exports/events").mkdir(parents=True, exist_ok=True)
    Path("./exports/gym").mkdir(parents=True, exist_ok=True)
    Path("./exports/memberships").mkdir(parents=True, exist_ok=True)
    Path("./exports/stash").mkdir(parents=True, exist_ok=True)
    Path("./exports/swapping").mkdir(parents=True, exist_ok=True)

    Path("./manifestos").mkdir(parents=True, exist_ok=True)

    Path("./uploads/complaints/procedure").mkdir(parents=True, exist_ok=True)
    Path("./uploads/complaints/signatures").mkdir(parents=True, exist_ok=True)
    Path("./uploads/jcr").mkdir(parents=True, exist_ok=True)
    Path("./uploads/toastie").mkdir(parents=True, exist_ok=True)

    Path("./uploads/images/bar").mkdir(parents=True, exist_ok=True)
    Path("./uploads/images/events").mkdir(parents=True, exist_ok=True)
    Path("./uploads/images/profile").mkdir(parents=True, exist_ok=True)
    Path("./uploads/images/stash").mkdir(parents=True, exist_ok=True)
    Path("./uploads/images/toastie_bar").mkdir(parents=True, exist_ok=True)

    # put allegens and procedure in?

def main():
    setup_env()
    setup_jsons()
    setup_folders()

main()
