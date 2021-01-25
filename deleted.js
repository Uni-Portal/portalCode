// const model = require("./model/model");

// app.get("/register", (req, res) => {
//   res.send('<form action="/register" method="POST"><button>Go</button></form>');
// });

// app.get("/admin", (req, res, next) => {
//   if (req.isAuthenticated()) {
//     res.redirect("/admin/dashboard");
//   } else {
//     res.render("admin/login", { error: "" });
//   }
// });

// app.get("/admin/add-user", (req, res, next) => {
//   if (!req.isAuthenticated()) {
//     return res.redirect("/admin");
//   }
//   const cookies = new Cookies(req, res, { keys: keys });
//   const currentUser = cookies.get("User", { signed: true });
//   res.render("admin/add-user", {
//     loggedUserName: currentUser,
//     title: "Add User",
//     setClass: "",
//     message: "",
//   });
// });

// app.get("/admin/dashboard", (req, res, next) => {
//   if (req.isAuthenticated()) {
//     const userMail = req.user.username;
//     Admin.findOne({ email: userMail }, (err, user) => {
//       if (!user) {
//         req.logout();
//         return res.render("admin/login", {
//           error: "Unauthorised Attempt !",
//         });
//       }
//       if (!err) {
//         const teacherSet = [];
//         const name = user.name;
//         var cookies = new Cookies(req, res, { keys: keys });
//         cookies.set("User", name, { signed: true });
//         Teacher.find((err, teachers) => {
//           if (err) {
//             console.log(err);
//           } else {
//             teachers.forEach((teacher) => {
//               if (teacher.isActive) {
//                 const t = {
//                   name: teacher.name,
//                   email: teacher.email,
//                   mobile: teacher.mobile,
//                   totalStudents: teacher.students.length,
//                   time:
//                     teacher.time.getDate() +
//                     "/" +
//                     (teacher.time.getMonth() + 1) +
//                     "/" +
//                     teacher.time.getFullYear(),
//                 };
//                 teacherSet.push(t);
//               }
//             });
//             res.render("admin/dashboard", {
//               loggedUserName: name,
//               teachers: teacherSet,
//             });
//           }
//         });
//       }
//     });
//   } else {
//     res.redirect("/admin");
//   }
// });

// app.get("/admin/add-admin", (req, res, next) => {
//   if (req.isAuthenticated()) {
//     var cookies = new Cookies(req, res, { keys: keys });
//     var user = cookies.get("User", { signed: true });
//     res.render("admin/add-user", {
//       loggedUserName: user,
//       title: "Add Admin",
//       setClass: "",
//       message: "",
//     });
//   } else {
//     res.redirect("/admin");
//   }
// });

// app.post("/admin/teacher/delete", (req, res, next) => {
//   if (req.isAuthenticated()) {
//     Teacher.findOneAndUpdate(
//       { email: req.body.teacherMail },
//       { isActive: false },
//       (err, teacher) => {
//         if (!teacher) {
//           return res.redirect("/admin/dashboard");
//         }
//         if (!err) {
//           return res.redirect("/admin/dashboard");
//         }
//       }
//     );
//   }
// });

// app.post("/admin/teacher/details", (req, res, next) => {
//   res.send("Page under progress !");
// });

// app.get("/admin/user/invite", (req, res, next) => {
//   res.send("under progress !");
// });

// app.post("/login", (req, res, next) => {
//    passport.authenticate("local",function(err,user))
// });

// app.get("/", (req, res, next) => {
//   res.send("working");
// });

// var cors = require("cors");
// app.use(cors);

// app.get("/test", (req, res) => {
//   // console.log("hit");
//   Invite.findOne({ email: "subhayansarkar@outlook.com" }, (err, user) => {
//     if (!err) {
//       console.log(user._id);
//     } else {
//       console.log("failed!");
//     }
//   });
//   res.render("admin/invite");
// });
