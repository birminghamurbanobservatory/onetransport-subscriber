import * as bodyParser from 'body-parser';
import methodOverride from 'method-override';
import express from 'express';
import morgan = require('morgan');
import * as logger from 'node-logger';
import cors from 'cors';
import * as check from 'check-types';

//-------------------------------------------------
// Setup
//-------------------------------------------------
export const app = express();

// Allow for POST requests
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded
app.use(methodOverride());

// Get rid of the unnecessary header X-Powered-By: Express
app.disable('x-powered-by'); 

// Logs this as soon as the request comes in
app.use(morgan(`:method :url`, {
  stream: {write: (text): any => logger.silly(text.trim())},
  immediate: true,
}));
// Logs this as the response goes out
app.use(morgan(`:method :status :url (:res[content-length] bytes) :response-time ms`, {
  stream: {write: (text): any => logger.silly(text.trim())},
  immediate: false,
}));


// Allow cross origin resource sharing, i.e. so applications running on other domains can call the API.
app.use(cors());


//-------------------------------------------------
// Health endpoint
//-------------------------------------------------
// So I can keep the root for just oneTransport requests
app.get('/healthz', (req, res) => {

  return res.send('Ok');

});


//-------------------------------------------------
// Root
//-------------------------------------------------
app.use('/', (req, res) => {

  logger.debug(`Method: ${req.method}`);
  logger.debug('headers', req.headers);
  logger.debug(`X-M2M-RI header: ${req.headers['X-M2M-RI']}`);
  logger.debug('body', req.body);

  // oneTransport asks that X-M2M-RI header is copied to the response
  // N.B. express making incoming request headers lowercase
  if (check.assigned(req.headers['x-m2m-ri'])) {
    res.set('X-M2M-RI', req.headers['x-m2m-ri']);
  }

  // "The Application can tell if it is a subscription verification if it contains the vrq attribute."
  const isSubscriptionVerification = req.body && check.assigned(req.body.vrq);

  // The endpoint must return the value 2001 in the response header X-M2M-RSC to indicate to oneTRANSPORT that the request for the subscription has been accepted.
  res.set('X-M2M-RSC', isSubscriptionVerification ? '2001' : '2000');

  // For the subscription verification requests the HTTP endpoint should return the HTTP status code of 201 Created
  return res.status(isSubscriptionVerification ? 201 : 200).send('Thank you');

});
