let fetch = require('node-fetch')
let config = require('config')
let secrets = require(`../secrets/${process.env.NODE_ENV || 'default'}`)

const googleClientWebId = config.googleClientWebId
const googleClientAppId = config.googleClientAppId
const googleClientAppSecret = secrets.googleClientAppSecret




/**
 * Provides authentication from different OAuth
 * services. Currently only supporting Google
 *
 */
class OauthProvider {

    constructor(oauthType = OauthType.GoogleWeb) {
        if (!this.validateOauthType(oauthType))
            throw('Invalid Oauth type')

        this._oauthType = oauthType
    }

    fetchTokenInfo(token) {
        return new Promise((resolve, reject) => {
            if (this._oauthType === OauthType.GoogleWeb) {
                this._fetchTokenInfo(token)
                .then(result => resolve(result))
                .catch(err => reject(err))
            }
            else if (this._oauthType === OauthType.GoogleApp) {
                return this._getAccessToken(token)
                .then(accessToken => {
                    this._fetchUserInfo(accessToken)
                    .then(userInfo => {
                        resolve({
                            isValid: true,
                            data: userInfo
                        })
                    })
                    .catch(err => reject(err))
                });
            }
            else
                reject('Unsupported token')
        });
    }

    getSignInUrl() {
        let scopes = ['profile', 'email'];
        return `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=${scopes.join('%20')}&response_type=code&client_id=${googleClientAppId}&redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob`
    }


    validateOauthType(oauthType) {
        for(let type in OauthType) {
            if (OauthType[type] !== OauthType.Unknown && OauthType[type] === oauthType)
                return true;
        }

        return false;
    }


    _fetchTokenInfo(token) {
        return new Promise((resolve, reject) => {

            fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`)
            .then(response => response.json())
            .then(json => {
                if (!json.error_description) {
                    json.id = json.sub
                    return resolve({isValid: true, data: json})
                }
                else
                    return resolve({ isValid: false })
            })
            .catch(err => reject(err))

        });
    }


    _getAccessToken(authorizationCode) {

        return new Promise((resolve, reject) => {

            const data = JSON.stringify({
                code: authorizationCode,
                client_id: googleClientAppId,
                client_secret: googleClientAppSecret,
                grant_type: 'authorization_code',
                redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'
            });

            var serializedData = `code=${authorizationCode}&client_id=${googleClientAppId}&client_secret=${googleClientAppSecret}&grant_type=authorization_code&redirect_uri=urn:ietf:wg:oauth:2.0:oob`;

            fetch('https://accounts.google.com/o/oauth2/token', {
                method: 'post',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: serializedData
            })
            .then(response => response.json())
            .then(json => {
                if (json.access_token)
                    resolve(json.access_token)
                else
                    reject(json.error)
            })
            .catch(err => reject(err))
        });
    }


    _fetchUserInfo(accessToken) {
        return new Promise((resolve, reject) => {
            fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            .then(response => response.json())
            .then(json => {
                if (json && json.id) {
                    resolve(json)
                }
                else
                    reject(json.error)
            })
            .catch(err => reject(err))
        })
    }

    _getClientId() {
        switch(this._oauthType) {
            case OauthType.GoogleWeb: return googleClientWebId
            case OauthType.GoogleApp: return googleClientAppId
            default: throw('Invalid Oauth Type')
        }
    }

}

/**
 * GoogleWeb is used to authenticate directly on the webserver
 * GoogleApp is used to authenticate from Atom
 *
 */
const OauthType = {
    Unknown: 0,
    GoogleWeb: 1,
    GoogleApp: 2
}


module.exports = { OauthProvider, OauthType };
