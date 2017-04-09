/**
 * Wrap a promise object so it sends the result to an
 * express.js response
 *
 * @param  {Promise} promise
 * @param  {Object} res    express.js response object
 */
function bindMethod(promise, res) {
    return promise
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
}





module.exports = bindMethod;
