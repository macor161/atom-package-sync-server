let jwt = require('jsonwebtoken')
let UserProvider = require('../../providers/user-provider')
let TokenProvider = require('../../providers/token-provider')
let { OauthProvider, OauthType } = require('../../providers/oauth-provider')
let config = require('config')
let pool = require('mongo-factory')
let express = require('express')



/**
 * Routes for the authentication pages
 *
 */
class AuthenticationModule {

    constructor() {
        this._userProvider = new UserProvider()
        this._tokenProvider = new TokenProvider()
    }


    getRouting() {
        var apiRoutes = express.Router()

        apiRoutes.get('/', (req, res) => {
            res.render('index', {  })
        });

        apiRoutes.get('/app', (req, res) => {
            let oauthProvider = new OauthProvider(OauthType.GoogleApp)

            res.render('appAuth', { googleAuthUrl: oauthProvider.getSignInUrl()  })
        });

        apiRoutes.post('/', (req, res) => {
            let oauthToken = req.body.token
            let tokenType = parseInt(req.body.tokenType) || OauthType.GoogleWeb
            let returnToken =  req.body.returnToken === "true"
            let oauthProvider = new OauthProvider(tokenType)
            let userProvider = new UserProvider()
            let oauthInfo

            oauthProvider.fetchTokenInfo(oauthToken)
            .then((response) => {
                if (response.isValid === true) {
                    oauthInfo = response.data
                    return this._userProvider.updateGoogleInfo(response.data)
                }
                else
                    res.json({ error: 'Invalid token' })
            })
            .then(() => userProvider.findByOauthId(oauthInfo.user_id || oauthInfo.id))
            .then(user => {
                let serverResponse = { success: true }
                let token = this._tokenProvider.generateToken({ userId: user._id })

                // TODO: Return token as an http only cookie

                if (returnToken === true)
                    serverResponse.token = token

                res.json(serverResponse)
            })
            .catch(err => {
                console.log(err)
            });

        });


        return apiRoutes
    }

}



module.exports = AuthenticationModule
