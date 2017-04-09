let UserProvider = require('../../providers/user-provider')
let TokenProvider = require('../../providers/token-provider')
let SettingsProvider = require('../../providers/atom-settings-provider')
let bindMethod = require('../../lib/express-binder')
let express = require('express')

/**
 * Main API for atom-package-sync
 *
 */
class PackageSync {

    constructor() {
        this._express = express
        this._userProvider = new UserProvider()
        this._tokenProvider = new TokenProvider()
        this._settingsProvider = new SettingsProvider()
    }

    /**
     * Save Atom settings to database, erasing previously saved data
     *
     * @param  {string} token    Authentication token
     * @param  {Object} settings Atom settings
     * @return {Promise}
     */
    postSettings(token, settings) {
        return new Promise((resolve, reject) => {

            let user

            if (token == null)
                return reject({ error: 'No token provided'})

            if (!(settings instanceof Object) || !(settings.files instanceof Object))
                return reject({ error: 'Invalid settings'})

            this._tokenProvider.getTokenInfo(token)
            .then(tokenInfo => {
                if (tokenInfo.isValid === true)
                    return this._userProvider.findById(tokenInfo.userId)
                else
                    return reject({ error: 'Invalid token' })
            })
            .then(_user => { user = _user; return this._settingsProvider.setSettings(user._id, settings) })
            .then(() => this._settingsProvider.getLastUpdate(user._id))
            .then(settingsInfo => resolve({ success: true, lastUpdate: settingsInfo.lastUpdate }))
            .catch(err => {
                // TODO: Handle error
                return reject({ error: 'Error'})
            })

        })
    }

    /**
     * Returns the Atom settings corresponding to a
     * specific user.
     * @param  {string} token Authentication token of the user
     * @return {Promise}   A promise that will return the Atom settings
     */
    getSettings(token) {

        return new Promise((resolve, reject) => {

            if (token == null)
                return reject({ error: 'No token provided'});

            this._tokenProvider.getTokenInfo(token)
            .then(tokenInfo => {
                if (tokenInfo.isValid === true)
                    return this._userProvider.findById(tokenInfo.userId);
                else
                    return reject({ error: 'Invalid token' });
            })
            .then(user => this._settingsProvider.getSettings(user._id))
            .then(settings => resolve(settings))
            .catch(err => {
                // TODO: Handle error
                return reject({ error: 'Error'});
            });

        });
    }

    /**
     * Returns last date/time a specific user's settings
     * has been updated
     * @param  {string} token User's authentication token
     * @return {Promise}
     */
    getLastUpdate(token) {
        return new Promise((resolve, reject) => {
            if (token == null)
                return reject({ error: 'No token provided'});

            this._tokenProvider.getTokenInfo(token)
            .then(tokenInfo => {
                if (tokenInfo.isValid === true)
                    return this._userProvider.findById(tokenInfo.userId);
                else
                    return reject({ error: 'Invalid token' });
            })
            .then(user => this._settingsProvider.getLastUpdate(user._id))
            .then(settingsInfo => resolve(settingsInfo))
            .catch(err => {
                // TODO: Handle error
                return reject({ error: 'Error'});
            });
        });
    }

    /**
     * Returns the API routes
     *
     * @return {Router}
     */
    getRouting() {
        var apiRoutes = this._express.Router();

        apiRoutes.get('/', (req, res) => {
            res.json({});
        });

        apiRoutes.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });

        apiRoutes.post('/settings', (req, res) => {
            let token = this._getTokenFromRequest(req);
            let settings = req.body.settings && JSON.parse(req.body.settings) || null;

            bindMethod(this.postSettings(token, settings), res);
        });

        apiRoutes.get('/settings', (req, res) => {
            let token = this._getTokenFromRequest(req);

            bindMethod(this.getSettings(token), res);

        });


        apiRoutes.get('/lastUpdate', (req, res) => {
            let token = this._getTokenFromRequest(req);

            bindMethod(this.getLastUpdate(token), res);
        });

        return apiRoutes;
    }


    _getTokenFromRequest(req) {
        return req.body.token || req.param('token');
    }

}


module.exports = PackageSync;
