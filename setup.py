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
    db_name = repeated_input("Database Name", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
    db_username = repeated_input("Database Username", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
    db_password = repeated_input("Database Password", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
    db_host = repeated_input("Database Host", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
    db_dialect = "mysql"

    express_port = 9000
    session_secret = "".join(random.choice(string.ascii_uppercase + string.ascii_lowercase + string.digits) for _ in range(64))
    web_address = "http://localhost:3000/"
    stripe_endpoint_secret = repeated_input("Stripe Endpoint Secret", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
    email_host = repeated_input("Email Host Server", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
    email_port = repeated_input("Email Port", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
    email_secure = repeated_input("Email Secure", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
    email_username = repeated_input("Email Username", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
    email_password = repeated_input("Email Password", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
    email_sender = repeated_input("Email Sender Address", lambda s: len(s) != 0, lambda _: print("Input cannot be empty"))
    with_schedule = repeated_input("Use Scheduler (Y/N)", lambda s: s.upper() == "Y" or s.upper() == "N", lambda _: print("Input must be Y or N")).upper()
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
