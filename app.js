const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const fileUpload = require("express-fileupload");
const fs = require("fs");

var Cookies = require("cookies");
var keys = ["keyboard cat"];

const app = express();

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

app.use(
  session({
    secret: "hippopotomonstrosesquipedaliophobia",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// mongoose.connect("mongodb://localhost:27017/examDB", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

mongoose.connect(
  "mongodb+srv://admin-subhayan:Subh@1234@cluster0.j2sww.mongodb.net/examDB?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);

const schema = require("./schema");

const {
  userSchema,
  adminSchema,
  teacherSchema,
  studentSchema,
  inviteSchema,
  referralSchema,
  courseSchema,
  assignmentSchema,
  submissionSchema,
} = schema;

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("user", userSchema);
const Admin = mongoose.model("admin", adminSchema);
const Teacher = mongoose.model("teacher", teacherSchema);
const Student = mongoose.model("student", studentSchema);
const Invite = mongoose.model("invite", inviteSchema);
const Refer = mongoose.model("referral", referralSchema);
const Course = mongoose.model("course", courseSchema);
const Assignment = mongoose.model("assignment", assignmentSchema);
const Submission = mongoose.model("submission", submissionSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const adminRoutes = require("./routes/admin");
const teacherRoutes = require("./routes/teacher");
const studentRoutes = require("./routes/student");
const { patch } = require("./routes/admin");
const { request } = require("express");

app.use("/admin", adminRoutes);

app.use("/teacher", teacherRoutes);

app.post("/register", (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect("/admin");
  }
  let pageTitle;
  let newUser;
  var cookies = new Cookies(req, res, { keys: keys });
  var currentUser = cookies.get("User", { signed: true });
  const userType = parseInt(req.body.userType);
  // const userType = 1;
  if (userType === 1) {
    pageTitle = "Add Admin";
    newUser = new Admin({
      name: req.body.userName, //req.body.userName
      email: req.body.userMail, //req.body.userMail
      mobile: req.body.userMobile, //req.body.userMobile
      userType: 1,
      isActive: true,
    });
  } else if (userType === 2 || userType === 3) {
    if (userType === 2) {
      newUser = new Teacher({
        name: req.body.userName,
        email: req.body.userMail,
        mobile: req.body.userMobile,
        userType: 2,
        isActive: true,
      });
    } else if (userType === 3) {
      newUser = new Student({
        name: req.body.userName,
        email: req.body.userMail,
        userType: 3,
        isActive: true,
      });
    } else {
      return res.send("Bad Value ! Error......");
    }
    pageTitle = "Add User";
  } else {
    return res.render("admin/add-user", {
      loggedUserName: currentUser,
      title: "Add User",
      setClass: "error",
      message: "Wrong Input !",
    });
  }
  //req.body.userMail   req.body.userType     req.body.userMobile
  User.register(
    { username: req.body.userMail, userType: req.body.userType },
    req.body.userMobile,
    function (err, user) {
      if (err) {
        console.log(err.message);
        res.render("admin/add-user", {
          loggedUserName: currentUser,
          title: pageTitle,
          setClass: "error",
          message: err.message,
        });
      } else {
        newUser.save((err) => {
          let setClass, message;
          if (err) {
            User.findOneAndDelete({ username: newUser.email }, (err) => {
              if (!err) {
                console.log("Deletion Success !");
              }
            });
            setClass = "error";
            message = "Wrong Input !";
          } else {
            setClass = "success";
            message = "User Added Successfully !";
          }
          res.render("admin/add-user", {
            loggedUserName: currentUser,
            title: pageTitle,
            setClass: setClass,
            message: message,
          });
        });
      }
    }
  );
});

app.post("/user/register", (req, res, next) => {
  let promise = new Promise((resolve, reject) => {
    if (req.body.userType === "3" && req.body.teacher.length > 0) {
      // console.log("ok done !");
      // return res.send("ok seems fine ");
      const data = {
        userType: req.body.userType,
        email: req.body.email,
        teacherId: req.body.teacher,
      };
      return resolve(data);
    }
    Invite.findOne(
      { _id: req.body.key, email: req.body.email, isExpired: false },
      (err, invite) => {
        if (err) {
          return res.send(
            "Something Wrong Happened....\n Error page under progress......"
          );
        }
        if (!invite) {
          return res.send("Sorry not invited !\nError page in process.....");
        }
        const date = new Date();
        const expiryDate = invite.expiry;
        if (date > expiryDate) {
          Invite.updateOne(
            { email: invite.email },
            { isExpired: true },
            (err) => {
              if (!err) {
                console.log("success !");
                return res.send("Sorry Link Expired!");
              }
            }
          );
        }
        const data = {
          userType: invite.userType,
          email: invite.email,
          expiry: invite.expiry,
        };
        resolve(data);
      }
    );
  });

  promise.then(({ userType, email, teacherId }) => {
    let newUser;
    //console.log(email);
    if (userType === 2) {
      newUser = new Teacher({
        name: req.body.name,
        email: email,
        userType: 2,
        isActive: true,
      });
    } else if (userType === 3 || userType === "3") {
      const teachers = [];
      if (req.body.teacher.length > 0) {
        teachers.push(req.body.teacher);
      }
      newUser = new Student({
        name: req.body.name,
        email: email,
        teachers: teachers,
        userType: 3,
        isActive: true,
      });
    } else {
      return res.send("something wrong hapened !");
    }

    newUser.save((err, nwUser) => {
      if (err) {
        return res.send("Error encountered while adding you !");
      }

      User.register(
        { username: email, userType: userType },
        req.body.password,
        function (err, user) {
          if (err) {
            console.log(err);
            //if ()
            return res.send("<h1>register failed !</h1>");
          }
          Invite.updateOne(
            { email: email },
            { expiry: new Date(), isExpired: true },
            (err) => {
              if (err) {
                return res.send(
                  "<h1>error while updating invitation data</h1>"
                );
              }
              if (userType === "3" || userType === 3) {
                Teacher.findByIdAndUpdate(
                  { _id: teacherId },
                  { $push: { students: nwUser._id } },
                  (err) => {
                    if (!err) {
                      return res.send("log in with your email to get access !");
                      console.log("success");
                    } else {
                      Student.deleteOne({ email: user.username }, (err) => {
                        User.deleteOne({ _id: user._id }, (err) => {
                          return res.send("registration failed !");
                        });
                      });
                    }
                  }
                );
              }
              //render login with message !
              if (userType === "2" || userType === 2)
                return res.send("log in with your email to get access !");
            }
          );
        }
      ); //end register
    }); //end save
  }); //end promise then
});

app.post("/admin/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    }
    if (!user) {
      console.log("error");
    } else {
      passport.authenticate("local", function (err, user, info) {
        if (!user) {
          return res.render("admin/login", {
            error: "Incorrect Credentials !",
          });

          // return res.render("admin/login", {
          //   setClass: "incorrect",
          //   message: "Incorrect Credentials !",
          // });
        }
        return res.redirect("/admin/dashboard");
      })(req, res, function (err) {
        //console.log(req, user.userName);
        res.redirect("/admin/dashboard");
      });
    }
  });
});

app.post("/user/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  let link;
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    }
    if (!user) {
      console.log("error");
    } else {
      passport.authenticate("local", function (err, user, info) {
        if (!user) {
          return res.render("login", {
            setClass: "incorrect",
            message: "Incorrect Credentials !",
          });
        }
        if (user.userType === 2) {
          link = "/teacher/dashboard";
        } else if (user.userType === 3) {
          link = "/student/dashboard";
        } else {
          req.logout();
          return res.render("login", {
            setClass: "incorrect",
            message: "Unauthorised Attempt !",
          });
        }
        return res.redirect(link);
      })(req, res, function (err) {
        res.redirect(link);
      });
    }
  });
});

app.get("/logout", (req, res, next) => {
  let link;
  if (!req.isAuthenticated()) {
    return res.send("bad request !");
  }
  if (req.user.userType === 1) {
    link = "/admin";
  } else if (req.user.userType === 2 || req.user.userType === 3) {
    link = "/login";
  } else {
    return res.send("invalid request !");
  }
  req.logout();
  res.clearCookie("User");
  res.redirect(link);
});

// app.get("/invite/:id", (req, res, next) => {
//   console.log(req.url);
//   console.log(req.params.id);
//   res.send(" Get at Invitation Link !");
// });

app.get("/invite/:id", (req, res, next) => {
  const id = req.params.id;
  Invite.findOne({ _id: id, isExpired: false }, (err, invite) => {
    if (!err) {
      if (invite) {
        if (invite.expiry < new Date()) {
          return res.send("expired ! Contact Admin to get one again !");
        }
        //res.send("sign up page, " + user.userType);
        res.render("signup", {
          email: invite.email,
          userType: invite.userType,
          key: invite._id,
          teacher: "",
        });
      } else if (!invite) {
        res.send("sorry dude, you are not invited. Better luck next time !");
      }
    } else {
      res.send("something wrong happended ! ");
    }
  });
});

app.get("/login", (req, res, next) => {
  if (req.isAuthenticated()) {
    if (req.user.userType === 2) {
      return res.redirect("/teacher/dashboard");
    } else if (req.user.userType === 3) {
      return res.redirect("/student/dashboard");
    }
  }
  res.render("login", {
    setClass: "",
    message: "Welcome Back!",
  });
});

app.post("/teacher/add-assignment", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  const courseId = req.body.courseId;
  Teacher.findOne({ email: req.user.username }, (err, user) => {
    if (err) {
      const stat = encodeURIComponent("fail");
      return res.redirect("/teacher/course/" + courseId + "/?stat=" + stat);
    }
    if (!user) {
      req.logout();
      return res.redirect("/login");
    }
    const id = user._id;
    let promise = new Promise((resolve, reject) => {
      Course.findById({ _id: req.body.courseId }, (err, course) => {
        if (err) {
          const stat = encodeURIComponent("fail");
          return res.redirect("/teacher/course/" + courseId + "/?stat=" + stat);
        }
        if (!course) {
          return res.redirect("/teacher/dashboard");
        }
        if (course.teacher != id) {
          return res.redirect("/error");
        }
        return resolve(user._id);
      });
    });
    promise.then((id) => {
      let file, due;
      try {
        due = req.body.dueDate;
        marks = req.body.marks;
      } catch (err) {}
      if (!req.files || Object.keys(req.files).length === 0) {
        //console.log(req.body.description);
        const ass = new Assignment({
          title: req.body.title,
          description: req.body.description,
          created: new Date(),
          course: req.body.courseId,
          dueDate: due,
          marks: marks,
          isActive: true,
        });
        return saveAssignment(ass);
      }
      file = req.files.assignmentFile;
      let uploadPath = __dirname + "/public/assignments" + "/" + file.name;
      // console.log(uploadPath);

      file.mv(uploadPath, (err) => {
        // /assignments/" + file.name
        if (err) {
          //will fix it
          const stat = encodeURIComponent("fail");
          return res.redirect("/teacher/course/" + courseId + "/?stat=" + stat);
        }
        const ass = new Assignment({
          title: req.body.title,
          description: req.body.description,
          created: new Date(),
          course: req.body.courseId,
          file: "/assignments/" + file.name,
          dueDate: due,
          isActive: true,
        });
        saveAssignment(ass);
      });
      // --------------under construction--------------------------------
      function saveAssignment(assignment) {
        assignment.save((err, a) => {
          if (err) {
            const stat = encodeURIComponent("fail");
            return res.redirect(
              "/teacher/course/" + courseId + "/?stat=" + stat
            );
          }
          Course.updateOne(
            { _id: req.body.courseId },
            { $push: { assignments: a._id } },
            (err) => {
              if (!err) {
                const stat = encodeURIComponent("success");
                return res.redirect(
                  "/teacher/course/" + courseId + "/?stat=" + stat
                );
              }
            }
          );
        }); ///end save
      } //saveassignment end
    });
  });

  // console.log(req.body.courseId);
});

// app.get("/test/up", (req, res) => {
//   res.send(
//     '<form action="/upload" method="POST" encType="multipart/form-data" ><input type="file" name="testFile"><button>Upload</button></form>'
//   );
// });

// app.post("/upload", (req, res) => {
//   console.log(req.files.testFile);
// });

//student assignment submission route under construction
app.post("/student/submit", (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  Student.findOne({ email: req.user.username }, (err, user) => {
    if (err) {
      //will fix sooon
      return res.send("error");
    }
    if (!user) {
      return res.redirect("/login");
    }
    const assignmentId = req.body.assignmentId;
    const courseId = req.body.courseId;
    let fileLink, submissionId;
    try {
      fileLink = req.body.fileLink;
      submissionId = req.body.submissionId;
    } catch (err) {
      fileLink = "";
      submissionId = "";
    }
    let changeFile = false;
    if (fileLink.length > 0 && submissionId.length > 0) {
      changeFile = true;
    }
    if (!changeFile) {
      saveFile();
    } else {
      //case for changing file delete previous one
      console.log(fileLink);
      const fpath = __dirname + "/public/" + fileLink;
      fs.unlink(fpath, function (err) {
        if (err && err.code == "ENOENT") {
          console.log(err);
        } else if (err) {
          console.error("Error occurred while trying to remove file");
        } else {
          console.info(`removed`);
          return saveFile();
        }
      });
    }
    function saveFile() {
      let file = req.files.assignmentFile;
      let uploadPath = __dirname + "/public/submissions" + "/" + file.name;
      file.mv(uploadPath, (err) => {
        // /assignments/" + file.name
        if (err) {
          //will fix it
          // const stat = encodeURIComponent("fail");
          // return res.redirect("/teacher/course/" + courseId + "/?stat=" + stat);
          console.log("error adding file");
          const stat = encodeURIComponent("fail");
          return res.redirect(
            "/student/assignment/" +
              courseId +
              "/" +
              assignmentId +
              "/" +
              "?status=" +
              stat
          );
          // return res.redirect("/student/dashboard");
        }
        if (changeFile) {
          Submission.updateOne(
            { _id: submissionId },
            { file: "/submissions/" + file.name, date: new Date() },
            (err) => {
              if (err) {
                const stat = encodeURIComponent("fail");
                return res.redirect(
                  "/student/assignment/" +
                    courseId +
                    "/" +
                    assignmentId +
                    "/" +
                    "?status=" +
                    stat
                );
                // return res.send("error");
                //will fix soon
              }
              const stat = encodeURIComponent("updated");
              return res.redirect(
                "/student/assignment/" +
                  courseId +
                  "/" +
                  assignmentId +
                  "/" +
                  "?status=" +
                  stat
              );
              // return res.send("success");
            }
          );
        } else {
          let desc;
          try {
            if (req.body.description.length > 0) desc = req.body.description;
            else desc = "";
          } catch (err) {
            desc = "";
          }

          const sub = new Submission({
            assignment: assignmentId,
            course: courseId,
            student: user._id,
            file: "/submissions/" + file.name,
            description: desc,
            date: new Date(),
            isChecked: false,
          });
          sub.save((err, s) => {
            if (err) {
              //will change

              const stat = encodeURIComponent("fail");
              return res.redirect(
                "/student/assignment/" +
                  courseId +
                  "/" +
                  assignmentId +
                  "/" +
                  "?status=" +
                  stat
              );
              //return res.send("error while saving into db");
            }
            Assignment.updateOne(
              { _id: assignmentId },
              { $push: { submissions: s._id } },
              (err) => {
                const stat = encodeURIComponent("success");
                return res.redirect(
                  "/student/assignment/" +
                    courseId +
                    "/" +
                    assignmentId +
                    "/" +
                    "?status=" +
                    stat
                );
                // return res.send("success uploaded");
              }
            ); //assignment end
          }); //submission save error
        }
      }); //end mv
    } //end save file
  }); //end of student
});

// ------------------route under construction------------

app.use("/student", studentRoutes);

//-file deletion--------------------------------
// app.get("/test/", (req, res) => {
//   const fpath =
//     __dirname +
//     "/public/assignments" +
//     "/MOOC_cerificate_Subhayan_Sarkar_123180703096.pdf";
//   fs.unlink(fpath, function (err) {
//     if (err && err.code == "ENOENT") {
//       // file doens't exist
//       console.info("File doesn't exist, won't remove it.");
//     } else if (err) {
//       // other errors, e.g. maybe we don't have enough permission
//       console.error("Error occurred while trying to remove file");
//     } else {
//       console.info(`removed`);
//     }
//   });
// });
// -----------file deletion----------------------------------------

// app.get("/test2", (req, res) => {
//   var str = encodeURIComponent("check");
//   res.redirect("/test/?status=" + str);
// });

app.use("/", (req, res, next) => {
  res.render("error404");
  // res.send("<h1>404 NOT FOUND PAGE !</h1>");
});

app.listen(process.env.PORT || 3000, (req, res) => {
  console.log("listening at port 3000....");
});
