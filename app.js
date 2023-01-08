const express = require("express");
const app =  express();
const path = require("path");
const bodyParser = require("body-parser");
const { Admins, Elections } = require("./models");
var cookieParser = require("cookie-parser");
var csrf = require("tiny-csrf");

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");

const bcrypt = require("bcrypt");
const saltRounds = 10;

app.use(bodyParser.json());

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! something secret"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(express.static(path.join(__dirname,'public')));

app.use(session({
    secret: "my-super-secret-key-36734828947944847",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000 //24 hrs
    }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
usernameField: "email",
passwordField: "password"
}, (email, password, done) => {
Admins.findOne({ where: { username: email }})
    .then(async (admin) => {
    const result = await bcrypt.compare(password, admin.password)
    if(result){
        return done(null, admin);
    }
    else {
        return done("Invalid password");
    }
    
    }).catch((error) => {
    console.log(error);
    return done("You are not registered, Signup to register");
    })
}));

passport.serializeUser((admin, done) => {
console.log("Serializing user in session", admin.id)
done(null, admin.id)
});

passport.deserializeUser((id, done) =>{
    Admins.findByPk(id)
        .then(admin => {
        done(null, admin)
        }).catch(error => {
        done(error, null)
        })
});


app.get("/", (request, response) => {
    if(request.user) {
        response.redirect("/elections")
    }
    else{
        response.render("index", {
            title: "Online Voting Platform",
            csrfToken: request.csrfToken(),
        
        });
    }
});

app.get(
    '/elections',
    connectEnsureLogin.ensureLoggedIn(),
    async (request,response)=>{
        const loggedInAdmin = request.user.id;
        const elections_list = await Elections.getAllElections(loggedInAdmin);
        response.render('elections',{
        title: 'Elections',
        csrfToken: request.csrfToken(),
        elections: elections_list,
    });
});

app.get(
    '/create-election', 
    connectEnsureLogin.ensureLoggedIn(),
    (request, response) => {
    response.render("new_election", {
        title: "Create new election",
        csrfToken: request.csrfToken(),
    })
})


app.get('/signup',(request,response)=>{
    response.render('signup',{
      title: 'Sign Up',
      csrfToken: request.csrfToken(),
    });
});

app.get("/login", (request, response) => {
    response.render("login", {
      title: "Login",
      csrfToken: request.csrfToken(),
    })
});

app.get("/signout", (request, response, next) => {
    request.logout((error) => {
      if(error) { return next(error); }
      response.redirect("/");
    })
})

app.post(
    "/session", 
    passport.authenticate("local", { 
        failureRedirect: "/login",
    }),
    function (request, response) {
    console.log(request.admin)
    response.redirect("/elections")
});
  

app.post("/admins", async (request, response) => {
    const hasedPwd = await bcrypt.hash(request.body.password, saltRounds);
    try {
        const admin = await Admins.create({
            name: request.body.name,
            username: request.body.email,
            password: hasedPwd,
        });
        request.login(admin, (error) => {
            if(error) {
              console.log(error)
            }
            response.redirect("/elections");
        })
    } catch (error) {
        console.log(error);
    }
});

app.post(
    "/new-election", 
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
        try{
            await Elections.addElection({
                name: request.body.name,
                adminId: request.user.id,
            });
            return response.redirect("/elections");
        } catch (error) {
            console.log(error)
        }
    }
);

module.exports = app;