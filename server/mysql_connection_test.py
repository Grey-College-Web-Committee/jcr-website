# Requirements: pip install python-dotenv mysql-connector-python

import mysql.connector
from dotenv import load_dotenv
import os

def connect_to_database(host, user, password, database):
    connection = mysql.connector.connect(
        host=host,
        user=user,
        password=password,
        database=database
    )

    return connection

def fetch_permissions(connection):
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM Permissions")
    permissions = cursor.fetchall()

    return permissions

use_env = True

if use_env:
    print("Using .env file")

    load_dotenv()
    host = os.getenv("DB_HOST")
    user = os.getenv("DB_USERNAME")
    password = os.getenv("DB_PASSWORD")
    database = os.getenv("DB_NAME")
else:
    print("Using hardcoded values")

    host = "localhost"
    user = "root"
    password = "root_password"
    database = "grey-db"

print(f"host={host}, user={user}, password={password}, database={database}")
connection = connect_to_database(host, user, password, database)
permissions = fetch_permissions(connection)

if permissions is None or len(permissions) == 0:
    print("Permissions is empty but MySQL connection didn't break, testing INSERT-SELECT-DELETE instead")

    cursor = connection.cursor()
    cursor.execute("INSERT INTO Permissions (name, description, internal) VALUES (%s, %s, %s)", ("Test Perm", "This is a test", "test.perm"))
    connection.commit()
    permission_id = cursor.lastrowid

    print(f"Inserted with ID {permission_id}")

    permissions = fetch_permissions(connection)
    assert permissions is not None, "Still unable to fetch"

    for record in permissions: 
        print(record)

    cursor = connection.cursor()
    cursor.execute("DELETE FROM Permissions WHERE id = %s", (permission_id,))
    connection.commit()

    print("Success ISD")
else:
    for record in permissions: 
        print(record)

    print("Success REG")