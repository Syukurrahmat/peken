const passport			= require('passport');
const GoogleStrategy    = require('passport-google-oauth20').Strategy;
const { Users, sequelize} = require('../config/db')


passport.use(new GoogleStrategy({
    clientID: '500883531451-vosfjs87c326ta0qtue8i7apacshu3uo.apps.googleusercontent.com',
    clientSecret: 'pdGqWJE6AcD76fILLqnnzIND',
    callbackURL: "https://peken.herokuapp.com/auth/google/callback/"
  },
  async function(accessToken, refreshToken, profile, done) {
    Users.findOrCreate({
        where:{id: profile.id},
        defaults: {
            username: profile.displayName.split(' ').filter(e=>e.length>3 && e.length<7)[0] || (profile.displayName.split(' ')[0].slice(0,6)) ,
            id:profile.id,
            name : profile.displayName,
            email : profile.emails[0].value,
            }
        })
    .then(([user, created]) => {
        return done(null,user)
    })
    .catch(console.error)
        
}))


passport.serializeUser(function(user, done) {

    done(null, user); 
});

passport.deserializeUser(function(user, done) {
    Users.findByPk(user.id).then(user=>{
        done(null,user);
    });
})


function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) return next();
	res.redirect('/login');
}

function isLoggedOut(req, res, next) {
	if (!req.isAuthenticated()) return next();
	res.redirect('/');
}

module.exports = {passport, isLoggedIn, isLoggedOut}