const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const port = 4300;

var app = express();

//Passport
const passport = require('passport');
const saml = require('passport-saml');
const fs = require('fs');
const { profile } = require('console');


console.log("DIRNAME: ", __dirname + '/certs/');

passport.serializeUser( (user, done) => {
    console.log('-----------------------------');
    console.log('serialize user');
    console.log(user);
    console.log('-----------------------------');
    done(null, user);
});

passport.deserializeUser((user, done) => {
    console.log('-----------------------------');
    console.log('deserialize user');
    console.log(user);
    console.log('-----------------------------');
    done(null, user);
});

var samlStrategy = new saml.Strategy({
    //config options here
    callbackUrl: 'http://localhost/login/callback',
    entryPoint: 'http://localhost:8080/simplesaml/saml2/idp/SSOService.php',
    issuer: 'saml-poc',
    identifierFormat: null,
    decryptionPvk: fs.readFileSync(__dirname + '/certs/key.pem', 'utf8'),
    privateCert: fs.readFileSync(__dirname + '/certs/key.pem', 'utf8'),
    cert: fs.readFileSync(__dirname + '/certs/idp_key.pem', 'utf8'),
    validateInResponseTo: false,
    disableRequestedAuthnContext: true
    }, (profile, done) => {
    return done(null, profile);
});

passport.use('samlStrategy', samlStrategy);














app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize({}));
app.use(passport.session({}));





//Routes
app.get('/', (req, res) => {
    res.send('Test Home Page');
});

app.get('/login',
    (req, res, next) => {
        console.log('-----------------------------');
        console.log('/Start login handler');
        next();
    },
    passport.authenticate('samlStrategy'),
);

app.post('/login/callback',
    (req, res, next) => {
        console.log('-----------------------------');
        console.log('/Start login callback ');
        next();
    },
    passport.authenticate('samlStrategy'),
    (req, res) => {
        console.log('-----------------------------');
        console.log('login call back dumps');
        console.log(req.user);
        console.log('-----------------------------');
        res.send('Log in Callback Success');
    }
);

app.get('/metadata',
    function(req, res) {
        res.type('application/xml'); 
        res.status(200).send(
          samlStrategy.generateServiceProviderMetadata(
             fs.readFileSync(__dirname + '/certs/cert.pem', 'utf8'), 
             fs.readFileSync(__dirname + '/certs/cert.pem', 'utf8')
          )
        );
    }
);




app.listen(4300, () => {
    console.log(`Listening on port ${port}`);
});