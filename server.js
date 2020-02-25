require('dotenv').load()
const Twilio = require('twilio')
const express = require('express')
const app = express()
const AccessToken = Twilio.jwt.AccessToken;
var VideoGrant = AccessToken.VideoGrant;

app.get('/token/:identity', function (req, res) {
  const identity = req.params.identity;

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET,
  )

  const grant = new VideoGrant();
  token.addGrant(grant);

  res.send({
    identity: identity,
    jwt: token.toJwt()
  })
})

app.listen(3001, function () {
  console.log('Programmable Video Chat token server listening on port 3001!')
})
