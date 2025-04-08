/********************************************************************************
 * WEB322 – Assignment 05
 *
 * I declare that this assignment is my own work in accordance with Seneca's
 * Academic Integrity Policy:
 *
 * https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
 *
 * Name: __Guan-Wei Huang__ Student ID: __172641235__ Date: __2024/03/25___
 *
 ********************************************************************************/
const projectData = require("./modules/projects");
const authData = require("./modules/auth-service");
const express = require("express");
const path = require("path");
const clientSessions = require("client-sessions");

const app = express();
const port = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, "public")));

// Set ejs engine
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

// client session to manage client state (store data into cookie)
app.use(clientSessions({
  cookieName: "session",
  secret: "o6LjQ5EVNC28ZgK64hDELM18ScpFQr",
  duration: 2 * 60 * 1000,
  activeDuration: 1 * 60 * 1000
}));

// Using urlencoded form data
app.use(express.urlencoded({ extended: true }));

// Add middleware: All ejs file can handle session
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Define login function
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
}

projectData
  .Initialize() // Wait for initialization to complete before proceeding. This prevents race conditions.
  .then(authData.initialize)   // Need initialize (connect) mongoDB 
  .then(() => {
    // Rout: show my information in root
    app.get("/", (req, res) => {
      //res.sendFile(path.join(__dirname, "views", "home.html"));
      res.render("home");
    });

    // Rout: show projects array
    app.get("/solutions/projects", (req, res) => {
      const sector = req.query.sector;

      (sector
        ? projectData.getProjectsBySector(sector)
        : projectData.getAllProjects()
      )
        .then((project) => {
          // Change to project page with ejs
          //res.json(project);
          res.render("projects", { projects: project });
        })
        .catch((err) => {
          console.error("Error fetching all projects:", err);
          //res.status(404).sendFile(path.join(__dirname, "views", "404.html"));
          res.status(404).render("404", {
            message: `No projects found for sector: ${sector}`,
          });
        });
    });

    // Rout: show project with id
    app.get("/solutions/projects/:id", (req, res) => {
      const projectId = parseInt(req.params.id);
      projectData
        .getProjectById(projectId)
        .then((project) => {
          //res.json(project);
          res.render("project", { project: project });
        })
        .catch((err) => {
          console.error("Error fetching project by ID:", err);
          //res.status(404).sendFile(path.join(__dirname, "views", "404.html"));
          res.status(404).render("404", {
            message: `Unable to find requested project id: ${projectId}`,
          });
        });
    });

    // Rout: show my information in root
    app.get("/about", (req, res) => {
      //res.sendFile(path.join(__dirname, "views", "about.html"));
      res.render("about");
    });

    // Rout: get addProject
    app.get("/solutions/addProject", ensureLogin, (req, res) => {
      projectData
        .getAllSectors()
        .then((sectorData) => {
          res.render("addProject", { sectors: sectorData });
        })
        .catch((err) => {
          res.render("500", {
            message: `I'm sorry, but we have encountered the following error: ${err}`,
          });
        });
    });

    // Rout: post addProject
    app.post("/solutions/addProject", ensureLogin, (req, res) => {
      projectData
        .addProject(req.body)
        .then(() => {
          res.redirect("/solutions/projects");
        })
        .catch((err) => {
          res.render("500", {
            message: `I'm sorry, but we have encountered the following error: ${err}`,
          });
        });
    });

    //Rout: Get, Edit a project
    app.get("/solutions/editProject/:id", ensureLogin, (req, res) => {
      Promise.all([
        projectData.getProjectById(req.params.id),
        projectData.getAllSectors(),
      ])
        .then(([project, sectors]) => {
          res.render("editProject", {
            project: project,
            sectors: sectors,
          });
        })
        .catch((err) => {
          res.status(404).render("404", {
            message: err,
          });
        });
    });

    //Rout: Post, Edit a project
    app.post("/solutions/editProject", ensureLogin, (req, res) => {
      projectData
        .editProject(req.body.id, req.body)
        .then(() => {
          res.redirect("/solutions/projects");
        })
        .catch((err) => {
          res.render("500", {
            message: `I'm sorry, but we have encountered the following error: ${err}`,
          });
        });
    });

    //Rout: Delete a project
    app.get("/solutions/deleteProject/:id", ensureLogin, (req, res) => {
      projectData
        .deleteProject(req.params.id)
        .then(() => {
          res.redirect("/solutions/projects");
        })
        .catch((err) => {
          res.render("500", {
            message: `I'm sorry, but we have encountered the following error: ${err}`,
          });
        });
    });
    
    // Rout: login
    app.get("/login",(req,res)=>{
      res.render("login",{
        errorMessage:"",
        userName:""
      });
    })

    // Rout: register
    app.get("/register",(req,res)=>{
      res.render("register",{
        errorMessage:"",
        successMessage:"",
        userName:""
      })
    })

    // Rout: post register
    app.post("/register",(req,res)=>{
      authData
      .registerUser(req.body)
      .then(()=>{
        res.render("register",{
          errorMessage: "",
          successMessage: "User created",
          userName: ""
        })
      })
      .catch((err)=>{
        res.render("register",{
          errorMessage: err,
          successMessage: "",
          userName: req.body.userName
        })
      })
    })
    
    // Rout: post login
    app.post("/login",(req,res)=>{
      req.body.userAgent = req.get('User-Agent');
      
      authData
      .checkUser(req.body)
      .then((user)=>{
        req.session.user = {
          userName: user.userName,        // authenticated user's userName
          email: user.email,              // authenticated user's email
          loginHistory: user.loginHistory// authenticated user's loginHistory
      }
      // Login success, redirect to products rout
      res.redirect('/solutions/projects');
      })
      .catch((err)=>{
        res.render("login",{
          errorMessage: err,
          userName: req.body.userName
        })
      })
    })
    
    // Rout: logout
    app.get("/logout",(req,res)=>{
      req.session.reset();
      res.redirect('/');
    })
    
    // Rout: userHistory
    app.get("/userHistory", ensureLogin,(req,res)=>{
      res.render("userHistory");
    })

    // 404 Handling
    app.use((req, res, next) => {
      res.status(404).render("404", {
        message: "I'm sorry, we're unable to find what you're looking for",
      });
    });

    app.listen(port, () => console.log(`App listening on port: ${port}`));
  })
  .catch((err) => {
    console.error("Error initializing projects:", err);
  });
