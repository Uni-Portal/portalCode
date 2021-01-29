const express = require("express");

const router = express.Router();

var Cookies = require("cookies");
var keys = ["keyboard cat"];

const mongoose = require("mongoose");

const schema = require("../schema");
const { studentSchema } = require("../schema");
const { adminSchema, teacherSchema, inviteSchema } = schema;

const Admin = mongoose.model("admin", adminSchema);
const Teacher = mongoose.model("teacher", teacherSchema);
const Student = mongoose.model("student", studentSchema);
const Invite = mongoose.model("invite", inviteSchema);

router.get("/", (req, res, next) => {
  if (req.isAuthenticated()) {
    res.redirect("/admin/dashboard");
  } else {
    res.render("admin/login", { error: "" });
  }
});

router.get("/dashboard", (req, res, next) => {
  if (req.isAuthenticated()) {
    const userMail = req.user.username;
    Admin.findOne({ email: userMail }, (err, user) => {
      if (!user) {
        req.logout();
        return res.render("admin/login", {
          error: "Unauthorised Attempt !",
        });
      }
      if (!err) {
        const teacherSet = [];
        const name = user.name;
        var cookies = new Cookies(req, res, { keys: keys });
        cookies.set("User", name, { signed: true });
        Teacher.find({ userType: 2 }, (err, teachers) => {
          if (err) {
            console.log(err);
          } else {
            teachers.forEach((teacher) => {
              if (teacher.isActive) {
                let email = teacher.email.split("@");
                let domain = email[1].split(".");
                const modifiedEmail = email[0] + domain[0] + domain[1];
                var date = new Date();
                // console.log(date - teacher.time);
                const t = {
                  name: teacher.name,
                  email: teacher.email,
                  mobile: teacher.mobile,
                  totalStudents: teacher.students.length,
                  time:
                    teacher.time.getDate() +
                    "/" +
                    (teacher.time.getMonth() + 1) +
                    "/" +
                    teacher.time.getFullYear(),
                  setClass: modifiedEmail,
                };
                teacherSet.push(t);
              }
            });
            res.render("admin/dashboard", {
              loggedUserName: name,
              teachers: teacherSet,
            });
          }
        });
      }
    });
  } else {
    res.redirect("/admin");
  }
});

router.get("/add-admin", (req, res, next) => {
  if (req.isAuthenticated() && req.user.userType === 1) {
    var cookies = new Cookies(req, res, { keys: keys });
    var user = cookies.get("User", { signed: true });
    res.render("admin/add-user", {
      loggedUserName: user,
      postLink: "/register",
      title: "Add Admin",
      setClass: "",
      message: "",
    });
  } else {
    res.redirect("/admin");
  }
});

router.get("/add-user", (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/admin");
  }
  const cookies = new Cookies(req, res, { keys: keys });
  const currentUser = cookies.get("User", { signed: true });
  res.render("admin/add-user", {
    loggedUserName: currentUser,
    postLink: "/register",
    title: "Add User",
    setClass: "",
    message: "",
  });
});

router.post("/invite", (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect("/admin");
  }
  var date = new Date();
  var expiry = new Date();
  expiry.setDate(date.getDate() + 3);

  //will change to user for most appropriate check
  Teacher.findOne({ email: req.body.inviteMail }, (err, user) => {
    if (!err) {
      if (user) {
        return res.render("admin/invite", {
          title: "Invitation",
          message: "Failed !",
          setClass: "fail",
          text: "Already Exists.",
          setLink: "user exists already, invalid request.",
          dashLink: "/admin/dashboard",
        });
      }
    }
  });

  const newInvite = new Invite({
    email: req.body.inviteMail,
    created: date,
    expiry: expiry,
    userType: 2,
    isExpired: false,
  });
  newInvite.save((err, user) => {
    let message, text, setClass, setLink;
    if (!err) {
      message = "Success !";
      setClass = "success";
      text =
        "Click copy link to copy the invitation link and share it with user.";
      link =
        "https://tranquil-brook-44334.herokuapp.com/invite/" + user._id + "/"; //http://localhost:3000/invite/
    } else {
      message = "Failed !";
      setClass = "fail";
      text = err.message;
      link = "invitation failed";
      console.log(err);
    }
    res.render("admin/invite", {
      title: "Invitation",
      message: message,
      setClass: setClass,
      text: text,
      setLink: link,
      dashLink: "/admin/dashboard",
    });
  });
  //console.log(date);
});

router.post("/teacher/delete", (req, res, next) => {
  if (req.isAuthenticated() && req.user.userType === 1) {
    Teacher.findOneAndUpdate(
      { email: req.body.teacherMail },
      { isActive: false },
      (err, teacher) => {
        if (!teacher) {
          return res.redirect("/admin/dashboard");
        }
        if (!err) {
          return res.redirect("/admin/dashboard");
        }
      }
    );
  }
});

router.post("/teacher/details", (req, res, next) => {
  res.send("Page under progress !");
});

router.get("/teacher/invitations/:sort", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/admin");
  }
  if (req.params.sort === "active") {
    let isExpired = encodeURIComponent("0");
    // return res.redirect("/teacher/dashboard/?status=" + stat);
    return res.redirect("/admin/teacher/invitations/?isExpired=" + isExpired);
  } else if (req.params.sort === "expired") {
    let isExpired = encodeURIComponent("1");
    return res.redirect("/admin/teacher/invitations/?isExpired=" + isExpired);
  }
});

router.get("/teacher/invitations/", (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/admin");
  }

  const cookies = new Cookies(req, res, { keys: keys });
  const currentUser = cookies.get("User", { signed: true });
  const invitationSet = [];
  let category = "All Invites";

  let q = { userType: 2 };
  if (req.query.isExpired === "0" || req.query.isExpired === 0) {
    q = {
      userType: 2,
      isExpired: false,
    };
    category = "Active";
  } else if (req.query.isExpired === "1" || req.query.isExpired === 0) {
    q = {
      userType: 2,
      isExpired: true,
    };
    category = "Expired";
  }

  Invite.find(q, (err, invitations) => {
    if (!err) {
      let count = 0;
      invitations.forEach((invite) => {
        let expiry = invite.expiry;
        let checked = "checked";
        let remaining;
        let status = invite.isExpired;
        if (expiry <= new Date()) {
          status = true;
          checked = "";
          remaining = 0;
        } else {
          remaining = expiry.getDate() - new Date().getDate();
        }
        let email = invite.email.split("@");
        let domain = email[1].split(".");
        let id = email[0] + domain[0] + domain[1];
        const i = {
          sl: ++count,
          setId: id,
          id: invite._id,
          email: invite.email,
          expiry:
            expiry.getDate() +
            "/" +
            (expiry.getMonth() + 1) +
            "/" +
            expiry.getFullYear(),
          remaining: remaining,
          checked: checked,
        };
        invitationSet.push(i);
        Invite.updateOne({ email: invite.email }, { isExpired: status });
      });
    }
    //console.log(invitations);
    res.render("admin/invitations", {
      category: category,
      loggedUserName: currentUser,
      invitations: invitationSet,
    });
  });
});

router.post("/invite/status/:stat", (req, res, next) => {
  let status = req.params.stat;
  let date = new Date();
  //console.log(status);
  if (status === 0 || status === "0") {
    Invite.updateOne(
      { _id: req.body.id },
      { expiry: date, isExpired: true },
      (err) => {
        if (!err) {
          res.redirect("/admin/teacher/invitations");
        }
      }
    );
  } else if (status === 1 || status === "1") {
    let newdt = date;
    newdt.setDate(date.getDate() + 3);
    Invite.updateOne(
      { _id: req.body.id },
      { expiry: newdt, isExpired: false },
      (err) => {
        if (!err) {
          res.redirect("/admin/teacher/invitations");
        }
      }
    );
  }
});

//hardest route till now
router.get("/students", (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/admin");
  }

  const cookies = new Cookies(req, res, { keys: keys });
  const currentUser = cookies.get("User", { signed: true });
  let studentSet = [],
    count = 0;

  async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }
  let len;
  Student.find((err, students) => {
    if (err) {
      console.log(err);
      return res.render("admin/students", {
        loggedUserName: currentUser,
        students: [],
      });
    }
    if (!students) {
      console.log("no student");
      return res.render("admin/students", {
        loggedUserName: currentUser,
        students: [],
      });
    }
    len = students.length;
    asyncForEach(students, async (student) => {
      //console.log("for each");
      getData(student);
      //console.log(studentSet);
    });
    // console.log(studentSet);
  }); //end student

  const getData = (student) => {
    Teacher.findOne({ _id: student.teachers[0] }, (err, teacher) => {
      //console.log("in teacher");
      let date = student.time;
      const s = {
        sl: ++count,
        id: student._id,
        name: student.name,
        email: student.email,
        teacherName: teacher.name,
        teacherMail: teacher.email,
        joined:
          date.getDate() + "/" + date.getMonth() + 1 + "/" + date.getFullYear(),
      };
      //console.log("pushing");
      studentSet.push(s);
      if (count === len) {
        return res.render("admin/students", {
          loggedUserName: currentUser,
          students: studentSet,
        });
      }
    }); //end teacher
  };
});

//testing route
// router.get("/user/invite", (req, res, next) => {
//   res.send("under progress !");
// });

module.exports = router;
