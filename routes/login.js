const passport		= require('passport');

module.exports = (app)=>{
    app.get('/login',(req,res)=>{
        req.flash('currentUrl',req.headers.referer)
        res.redirect('/auth/google')    
    })

    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/');
    })
    
    app.get('/auth/google',
        passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get('/auth/google/callback', 
        passport.authenticate('google', { failureRedirect: '/login' }),
        function(req, res) {
            let url = req.flash('currentUrl')
            res.redirect((url.length == 1)? url : '/' );
        }
    );
}