# Atom Package Sync Server

Server side for hosting the synchronization service of [atom-package-sync](https://atom.io/packages/atom-package-sync).


## How to install


### 1. Install prerequisites

The service uses NodeJs for the server, MongoDB as its database and Redis for caching. On Ubutun/Debian, you can install them like this:

```
sudo apt-get install nodejs mongodb redis-server
```

### 2. Clone atom-package-sync-server

```
git clone https://github.com/macor161/atom-package-sync-server.git
```

### 3. Configure the server

Before running the server, two files must be created:

* config/production.json
* secrets/production.json

The first one contains the configuration settings and the second one contains more sensitive data, like passwords and secret keys.

A basic template exists for both:

```
mv config/default.json.example config/production.json
```

In the config file:

* serverPort: Listening port of the server (default 80)
* database: Url for connecting to MongoDB (default mongodb://localhost:27017/atom-package-sync)
* cacheHost: Redis server host (default localhost)
* cachePort: Redis port (default 6379)
* cacheDb: Redis database number (default 0)
* googleClientAppId: Google Id
* googleClientWebId: Not currently used, you can keep it blank

To copy the second config template:

```
mv secrets/default.json.example secrets/production.json
```

* tokens: Private key for token generation
* googleClientAppSecret: Private key for Google Auth

## 4. Install NPM modules

```
npm install --production
```

## 5. Setup NODE_ENV environment variable

For production use, the server needs NODE_ENV environment variable to be set to production:

```
export NODE_ENV=production
```

## 6. Run the server

```
npm start
```

## Last notes

A docker file is available for easy setup. It doesn't contain MongoDb nor Redis, only the node server.

```
docker build -t atom-package-sync-server -f deploy/Dockerfile .
docker run -d -p 80:80 atom-package-sync-server
```
