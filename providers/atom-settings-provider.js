let ObjectId = require('mongodb').ObjectId
let crypto = require('crypto')
let dbFactory = require('mongo-factory')
let config = require('config')
let cacheManager = require('cache-manager')
let redisStore = require('cache-manager-redis')

let redisCache = cacheManager.caching({
	store: redisStore,
	host: config.cacheHost, // default value
	port: config.cachePort, // default value
	//auth_pass: '',
	db: config.cacheDb,/*
    retry_strategy: function (options) {
        return undefined;
    }*/
})


const CACHE_TTL = 3600


redisCache.store.events.on('redisError', function(error) {
	// handle error here
	console.log('Redis cache error: ', error)
})


/**
 * Main provider for Atom settings
 */
class AtomSettingsProvider {

    constructor() {
    }

		/**
		 * Returns Atom settings for a specific user ID
		 *
		 * @param  {string|ObjectId} userId User's ID
		 * @return {Promise}
		 */
    getSettings(userId) {
        if (userId instanceof ObjectId)
            userId = userId.toString();


            return new Promise((resolve, reject) => {
                dbFactory.getConnection(config.database)
                .then(db => db.collection('AtomSettings').find({ _userId: userId }).limit(1).toArray())
                .then(settings => {
                    settings = settings[0];

                    for(let file in settings.files) {
                        let newFileName = file.replace(/\//g, '.');

                        if (newFileName != file) {
                            settings.files[newFileName] = settings.files[file];
                            delete settings.files[file];
                        }
                    }

                    resolve(settings)
                })
                .catch(err => reject(err));
            });
    }

		/**
		 * Set the settings for a specific user
		 * Any previously saved settings are erased
		 *
		 * @param {string|ObjectId} userId   User's ID
		 * @param {Object} settings Atom settings
		 * @return {Promise}
		 */
    setSettings(userId, settings) {
        if (userId instanceof ObjectId)
            userId = userId.toString();

        return this._addTohistory(userId, settings)
        .then(() => this._calculateChecksum(settings.files))
        .then(checksum => {

            // Replace the dots by slashes because mongodb can't store dots in variable names
            for(let file in settings.files) {
                let newFileName = file.replace(/\./g, '/');

                if (newFileName != file) {
                    settings.files[newFileName] = settings.files[file];
                    delete settings.files[file];
                }
            }

            redisCache.del(`AtomSettingsProvider:getLastUpdate:${userId}`)

            return dbFactory.getConnection(config.database)
                .then(db => db.collection('AtomSettings').updateOne({ _userId: userId },
                            { $set: { files: settings.files, lastUpdate: new Date(), checksum: checksum }},
                            { upsert: true}))
        });

    }


		/**
		 * Returns last date/time a specific user's settings
		 * has been updated
		 *
		 * // TODO: Method should not fail if cache server is unreachable
		 *
		 * @param {string|ObjectId} userId   User's ID
		 * @return {Promise}
		 */
    getLastUpdate(userId) {
        if (userId instanceof ObjectId)
            userId = userId.toString()

        return redisCache.wrap(`AtomSettingsProvider:getLastUpdate:${userId}`, function () {

            return dbFactory.getConnection(config.database)
            .then(db => db.collection('AtomSettings').find({ _userId: userId }).limit(1).toArray())
            .then(settings => {
                if (settings.length > 0) {
                    return {
                        lastUpdate: settings[0].lastUpdate,
                        checksum: settings[0].checksum
                    }
                }
                else
                    return {}

            })

        }, {ttl: CACHE_TTL}).
        then(data => {
            if (typeof data.lastUpdate === 'string')
                data.lastUpdate = new Date(data.lastUpdate)

            return data
        })

    }


    _calculateChecksum(files) {
        return new Promise((resolve, reject) => {
            //let serializedFiles = JSON.stringify(files);
            //let serializedFiles = files["snippets.cson"].content
            //let checksum = crypto.createHash('sha256').update(serializedFiles).digest("hex")

            resolve("")
        });
    }


		// In the futur, we'll add an history for the user's settings
    _addTohistory(userId, settings) {
        return new Promise((resolve, reject) => {
            // TODO: Complete method
            resolve()
        });
    }


}


module.exports = AtomSettingsProvider;
