require('dotenv').config();
const express = require("express");
const app = express();
const path = require("path");
const hbs = require("hbs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const auth = require("./middleware/auth");

require("./db/conn");
const Register = require("./models/registers");

const port = process.env.PORT || 3000;

const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");
// console.log(path.join(__dirname, "../public"))
app.use(express.static(static_path));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: false}));

app.set("view engine","hbs");
app.set("views",template_path);
hbs.registerPartials(partials_path);


console.log(process.env.SECRET_KEY);

app.get("/",(req,res)=>{   
  // to go home pase used /(forward slash)
  // res.send("Hello from the MegaTech.");
  res.render("index");
})

app.get("/secret", auth , (req,res)=>{
  // first goto auth-> verify -> render-secret
  // console.log(`Cookie from app.get-secret(app.js): ${req.cookies.jwt}`);
  res.render("secret");
})

app.get("/logout", auth , async(req,res)=>{
  try{
    // console.log(`req.user from app.js: ${req.user}`);

    // single device logout:
    // req.user.tokens = req.user.tokens.filter((currentElement)=>{
    //   return currentElement.token !== req.token
    // })

    // all device logout:
    req.user.tokens = [];

    res.clearCookie("jwt");
    console.log(`App.js: Logged out successfully.`);
    
    await req.user.save();
    res.render("login");
  }catch(error){
    res.status(500).send(error);
  }
})

app.get("/register", (req,res)=>{
  res.render("register");
})
app.get("/login", (req,res)=>{
  res.render("login");
})


// create a new user in db:
app.post("/register", async (req,res)=>{
  try{
    // console.log(req.body.firstname);
    // res.send(req.body.firstname);

    const password = req.body.password;
    const cpassword = req.body.confirmpassword;

    if(password === cpassword){
      const registerEmployee = new Register({
        firstname : req.body.firstname,
        lastname : req.body.lastname,
        email : req.body.email,
        gender : req.body.gender,
        phone : req.body.phone,
        age : req.body.age,
        password : password,
        confirmpassword : cpassword
      })

      const token = await registerEmployee.generateAuthToken();

      // res.cookie("jwt", token);
      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 120000),
        httpOnly: true
      });
      console.log(`cookie: ${cookie}`);

      const registered = await registerEmployee.save();
      // console.log(`Page part ${registered}`);
      res.status(201).render("index");
    }else{
      res.send("Password is not matching!")
    }
  }catch(error){
    res.status(400).send(error);
  }
})  // end of .post(/register)


// Login check:
app.post("/login", async (req,res)=>{
  try{
    const email = req.body.email;
    const password = req.body.password;
    // console.log(`Email- ${email} & Password- ${password}`);

    const user = await Register.findOne({email:email});
    // res.send(user.password);
    // console.log(user);

    const isMatch = await bcrypt.compare(password, user.password);
    // console.log(`isMatch value: ${isMatch}`);

    // Authentication during Login:
    const token = await user.generateAuthToken();
    console.log(`Token during Login: ${token}`);

    res.cookie("jwt", token, {
      expires: new Date(Date.now() + 44000),
      httpOnly: true,
      // secure: true,   // works with only https
    });


    // if(user.password === password){
    if(isMatch){
      res.status(201).render("index");
    }else{
      res.send("Invalid password! Try again.");
    }
  }catch(error){
    res.status(400).send(`Invalid information!! Try again. Error-${error}`);
  }
})


// -----x-----
// const bcrypt = require("bcryptjs");

// const securePassword = async (password) =>{
//   const passwordHash = await bcrypt.hash(password, 10);
//   console.log(`Hashed password: ${passwordHash}`);

//   const passwordMatch = await bcrypt.compare(password, passwordHash);
//   console.log(`Compared password: ${passwordMatch}`);
// }
// securePassword("jami@gmail");
// -----x-----


app.listen(port, ()=>{
  console.log(`Server is running at port no: ${port}`);
})  // end of app.listen

