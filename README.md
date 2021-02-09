# SceneGames
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

## Getting Started
You will need to install [Docker](https://docs.docker.com/install/) and a web server that can act as a reverse proxy. Configurations for [Nginx](https://nginx.org/en/download.html) or [Apache](https://httpd.apache.org/download.cgi) are supplied in this tutorial. Other web servers may work, but are untested.

### Setup
An `app` script is available in the project root to streamline the setup process.  
See all the commands by running the script without any arguments.

1. Make it executable by running `chmod +x app`.
2. Run `./app build` to build, the app will start itself automatically.
3. Next step is to set up a reverse proxy.
	(Edit these to fit your configuration better. Different ports, paths, SSL, etc.)  

	**Nginx**
    
	```nginx
	server {
	  listen 127.0.0.1:80;
	  server_name example.com;
	  location / {
	    proxy_pass http://127.0.0.1:8000;
	  }
	}
	```

	**Apache**

	```xml
	<VirtualHost *:80>
	  ServerName example.com
	  ProxyRequests off
	  <Proxy *>
	    Order deny,allow
	    Allow from all
	  </Proxy>
	  <Location />
	    ProxyPass http://localhost:8000/
	    ProxyPassReverse http://localhost:8000/
	  </Location>
	</VirtualHost>
	```
4. Done, you should be able to access the site by going to whatever URL you specified in your web server config.

### Configuration
Configuration can be overridden by creating a `docker-compose.override.yml`.
Run `./app build` after making any changes.

Here are some changes you may want to make:

**Running on another port**
By default, the site will run on port 8000. This example changes it into 8500.
```yml
version: '2.0'
services:
  web:
    ports:
    - '8500:46374'
```
**Change settings**
```yml
version: '2.0'
services:
  web:
	environment:
	- SG_DOMAIN=https://scenegames.to
	- RELEASE_EXPIRE_SECONDS=2592000
	- SMTP_HOST=smtp.example.com
	- SMTP_USER=user
	- SMTP_PASS=asdf123
	- SMTP_PORT=465
	- SMTP_SECURE=true
	- SMTP_RCPT=recipient@example.com
	- SG_API_KEY=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
	- HC_SITE_KEY=10000000-ffff-ffff-ffff-000000000001
	- HC_SECRET_KEY=0x0000000000000000000000000000000000000000
```
