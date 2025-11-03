sudo -i -u postgres             
psql

postgres=# CREATE USER username WITH PASSWORD 'password';  //!!!!!! make sure to change these values and put then into the connection.js !!!!!!


postgres=# CREATE DATABASE general_usersdb OWNER username;
postgres=# CREATE DATABASE users_activitydb OWNER username;

postgres=# GRANT ALL PRIVILEGES ON DATABASE general_usersdb TO username;
postgres=# GRANT ALL PRIVILEGES ON DATABASE users_activitydb TO username;



IMPORTS

cd backend
npm install pg
npm install crypto
npm install pino
npm install pino-pretty


{
  "dependencies": {
    "name": "backend",
    "version": "1.0.0",
    "type": "module",
    "pg": "^8.16.3"
  }
  
}



to list db and tables:

\c general_usersdb

\dt

\d table_name


