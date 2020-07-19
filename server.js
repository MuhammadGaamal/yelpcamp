require('dotenv').config();
var express                  = require("express"),
    app                      = express(),
    bodyparse                = require("body-parser"),
    mongoose                 = require("mongoose"),
    flash                    = require("connect-flash"),
    passport                 = require("passport"),
    localstrategy            = require("passport-local"),
    User                     = require("./models/user"),
    expressSanitizer = require("express-sanitizer"),
    methodoverride = require("method-override"),
    seedDB                   = require("./seeds");

// requiring routes
var commentsroutes = require("./routes/comments"),
    campgroundsroutes = require("./routes/campgrounds"),
    reviewRoutes     = require("./routes/reviews"),
    authroutes = require("./routes/auth");

// connect to the database
var url = process.env.DATABASEURL || "mongodb://localhost/yelp-camp"
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
// mongoose.set('useFindAndModify', false);


app.use(bodyparse.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static( __dirname + "/public"));
app.use(expressSanitizer());
app.use(methodoverride("_method"));
app.use(flash());
app.locals.moment = require("moment");

// use seeds every time we start the server.
// seedDB();
// seeding the database
//passport configuration.

app.use(require("express-session")({
    secret: "SECRET",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new localstrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
    res.locals.currentuser = req.user;
    res.locals.error =  req.flash("error");
    res.locals.success =  req.flash("success");
    next();
});
// use routes
app.use("/campgrounds/:id/comments", commentsroutes);
app.use("/campgrounds", campgroundsroutes);
app.use( "/",authroutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.listen(3000, function () {
    console.log("Server Started");
});
