# LoadTap Assignment

This code was written for the interview assignment for LoadTap. The code is written in Nodejs and it monitors an email for a mail with an xml file. The xml file is parsed and converted to csv format and sent to the destination email. 


# Setup
	- Copy the .env file and copy the contents from the .env.example
		- EMAIL the client email that the app should monitor
		- Password the password for the above email
		- DEST_EMAIL the email the parsed csv file should be sent too.
		- MAIL_BOX the mail box that should be monitored on the client 		email
		- EMAIL_HOST we are using imap to connect to the email and this should be the imap address for the client. for google it should be imap.gmail.com
		- EMAIL_PORT the email port imap should connect too
		- CLIENT_ID (for gmail only) Gmail does not allow imap to connect directly with the username and password and requires xoauth2 token. the steps to generate the xoauth2 token will be explained below.
		- CLIENT_SECRET the client secret of your gmail project
		- REFRESH_TOKEN the refresh token retrieved from Oauth Playground Steps listed below.
		- GMAIL (boolean) if the email client to be monitered is gmail or not.
	- After creating the .env file . We have to install the dependencies . Run npm i.
## Run the project
	You can run this project with the following command
	yarn dev

## Modules used

We are using IMAP to monitor the email client . Imap connects to the mail server and pulls mail for a specified period. However google does not let unsecured apps to connect with email and password and we have to generate the xoauth2 token to connect to the mail client.
