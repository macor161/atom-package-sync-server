let ObjectId = require('mongodb').ObjectId
let config = require('config')
let dbFactory = require('mongo-factory')


/**
 * User provider
 *
 */
class UserProvider {

    constructor() {

    }

    /**
     * Updates Google information for a specific user.
     * If the user doesn't exists, creates it.
     *
     * @param info
     */
    updateGoogleInfo(oauthInfo) {
        //dbFactory.
        return new Promise((resolve, reject) => {

            dbFactory.getConnection(config.database)
            .then(db => db.collection('users').find({ user_id: oauthInfo.user_id || oauthInfo.id }).limit(1).toArray())
            .then((users) => {
                if (users.length === 0) {
                    return this._createUserFromOathInfo(oauthInfo)
                    .then(() => resolve())
                    .catch(err => reject(err));
                }
                else {
                    return this._updateOathInfo(users[0]._id, oauthInfo)
                    .then(() => resolve())
                    .catch(err => reject(err));
                }
            })
            .catch(err => {
                let faew = 24;
                reject(err);
            });

        });
    }

    /**
     * Returns a user from his id
     *
     * @param  {string|ObjectId} id User ID
     * @return {Promise}
     */
    findById(id) {
        return new Promise((resolve, reject) => {
            if (!(id instanceof ObjectId))
                id = ObjectId(id);

            dbFactory.getConnection(config.database)
            .then(db => db.collection('users').find({ _id: id }).limit(1).toArray())
            .then(users => {
                if (users.length === 0)
                    throw("No user found");
                else
                    resolve(users[0])
            })
            .catch(err => reject(err));
        });
    }

    /**
     * Returns a user from his OAuth ID
     *
     * @param  {string} oauthId OAuth ID
     * @return {Promise}        
     */
    findByOauthId(oauthId) {
        return new Promise((resolve, reject) => {
            dbFactory.getConnection(config.database)
            .then(db => db.collection('users').find({ user_id: oauthId }).limit(1).toArray())
            .then(users => {
                if (users.length === 0)
                    throw("No user found");
                else
                    resolve(users[0])
            })
            .catch(err => reject(err));
        });
    }


    _createUserFromOathInfo(oauthInfo) {
        oauthInfo = this._extractOauthInfo(oauthInfo);

        return dbFactory.getConnection(config.database)
               .then(db => db.collection('users').insertOne(oauthInfo))
    }

    _updateOathInfo(_id, oauthInfo) {
        oauthInfo = this._extractOauthInfo(oauthInfo);

        return dbFactory.getConnection(config.database)
               .then(db => db.collection('users').updateOne({ _id: _id }, { $set: oauthInfo }))
    }


    _extractOauthInfo(oauthInfo) {
        let info = {
            user_id: oauthInfo.user_id || oauthInfo.id,
            email: oauthInfo.email,
            email_verified: oauthInfo.verified_email || oauthInfo.email_verified
        };

        if (oauthInfo.name) info.name = oauthInfo.name;
        if (oauthInfo.picture) info.picture = oauthInfo.picture;
        if (oauthInfo.locale) info.locale = oauthInfo.locale;

        return info;
    }
}



module.exports = UserProvider;
