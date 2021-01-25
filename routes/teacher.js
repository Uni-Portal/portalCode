const express = require("express");
const randomstring = require("randomstring");

const router = express.Router();

var Cookies = require("cookies");
var keys = ["keyboard cat"];

const mongoose = require("mongoose");

function generateRandom() {
  let num = Math.random();
  num = num * (999999 - 100000);
  num = Math.floor(num) + 100000;
  return num;
}

const schema = require("../schema");
const { assignmentSchema } = require("../schema");
const {
  adminSchema,
  teacherSchema,
  inviteSchema,
  referralSchema,
  studentSchema,
  courseSchema,
} = schema;

const Admin = mongoose.model("admin", adminSchema);
const Teacher = mongoose.model("teacher", teacherSchema);
const Student = mongoose.model("student", studentSchema);
const Invite = mongoose.model("invite", inviteSchema);
const Refer = mongoose.model("referral", referralSchema);
const Course = mongoose.model("course", courseSchema);
const Assignment = mongoose.model("assignment", assignmentSchema);

router.get("/dashboard", (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  let setClass = "",
    message = "";
  if (req.query.status === "success" || req.query.status === "fail") {
    if (req.query.status === "success") {
      setClass = "success";
      message = "Course Added !";
    } else {
      setClass = "fail";
      message = "Error in course Adding !";
    }
  }
  const email = req.user.username;
  Teacher.findOne({ email: email }, (err, user) => {
    if (!err) {
      if (!user) {
        req.logout();
        return res.render("login", {
          setClass: "incorrect",
          message: "Unauthorised Attempt !",
        });
      }
    }
    var cookies = new Cookies(req, res, { keys: keys });
    cookies.set("User", user.name, { signed: true });
    const courseSet = [];
    let promise = new Promise((resolve, reject) => {
      Course.find({ teacher: req.user.username }, (err, courses) => {
        if (!err) {
          if (courses) {
            courses.forEach((course) => {
              const newCourse = {
                id: course._id,
                title: course.title,
                description: course.description,
                uniqueCode: course.uniqueCode,
              };
              courseSet.push(newCourse);
            });
          } else if (!courses) {
            const newCourse = {
              title: "Course Name",
              description: "Short description of your course",
            };
            courseSet.push(newCourse);
          }
        }
        resolve(courseSet);
      });
    });
    promise.then((courses) => {
      res.render("teacher/dashboard", {
        setClass: setClass,
        message: message,
        loggedUserName: user.name,
        courses: courses,
      });
    });
  });
});

router.get("/referral", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }

  Teacher.findOne({ email: req.user.username }, (err, user) => {
    if (err) {
      // return something have to add error invite ejs
    }
    if (!user) {
      return res.redirect("/login");
    }
    Refer.findOne({ teacher: user._id }, (err, refer) => {
      if (err) {
        return res.send("something wrong happened!");
      }
      let setClass, message, text, link;
      if (!refer) {
        const key = generateRandom();
        const newRefer = new Refer({
          teacher: user._id,
          key: key,
        });

        newRefer.save((err, rf) => {
          if (err) {
            message = "Error !";
            setClass = "fail";
            text = "something wrong happened, try after some time !";
            link = "failed.....";
          } else {
            message = "Key: " + key;
            setClass = "success";
            text = "Share this key and referral link with students.";
            link =
              "https://tranquil-brook-44334.herokuapp.com/student/invite/" +
              rf._id +
              "/";
          }
          return res.render("admin/invite", {
            title: "Referral",
            setClass: setClass,
            message: message,
            text: text,
            setLink: link,
            dashLink: "/teacher/dashboard",
          });
        });
      } else if (refer) {
        message = "Key: " + refer.key;
        setClass = "success";
        text = "Share this key and referral link with students.";
        link =
          "https://tranquil-brook-44334.herokuapp.com/student/invite/" +
          refer._id +
          "/";
        return res.render("admin/invite", {
          title: "Referral",
          setClass: setClass,
          message: message,
          text: text,
          setLink: link,
          dashLink: "/teacher/dashboard",
        });
      }
    });
  });
});

router.post("/add-course", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  const key = randomstring.generate({
    length: 6,
    charset: "alphanumeric",
  });
  const newCourse = new Course({
    teacher: req.user.username,
    title: req.body.title,
    description: req.body.description,
    uniqueCode: key,
  });
  newCourse.save((err) => {
    if (!err) {
      let stat = encodeURIComponent("success");
      return res.redirect("/teacher/dashboard/?status=" + stat);
    } else {
      let stat = encodeURIComponent("fail");
      return res.redirect("/teacher/dashboard/?status=" + stat);
    }
  });
});

//route under work ! integration remaining with front
router.post("/course", (req, res, next) => {
  const courseId = req.body.courseId;
  let assignments = [],
    students = [];
  let promise = new Promise((resolve, reject) => {
    Course.findById({ _id: courseId }, (err, course) => {
      if (!err) {
        if (course) {
          assignments = course.assignments;
          assignments.push("600ea1da418e8461e0f577cf");
          assignments.push("600ea1da418e8461e0f577df");
          students = course.students;
          students.push("600ea1da418e8461e0f577ch");
          students.push("600ea1da418e8461e0f587ch");
        }
      }
      const data = {
        assignments: assignments,
        students: students,
      };
      return resolve(data);
    }); //course-end
  }); //promise-1 end

  //getting all name of assignments
  promise.then(async ({ assignments, students }) => {
    console.log("after first course find");

    getAssignmentData(assignments, students);
    // getStudentData(students);
    //assignmentData = await getAssignmentData(assignments);

    //const studentData = await getStudentData(students);
    //getAssignmentData(assignments).then(console.log("printing"));
    //console.log(getStudentData);
  }); //1st promise then end

  async function getAssignmentData(assignments, students) {
    console.log("assignment data");
    const dt = [];
    const len = assignments.length;
    for (let i = 0; i < assignments.length; i++) {
      let promise = new Promise((resolve, reject) => {
        Assignment.findById(
          { _id: assignments[0] },
          (err, assignment) => {
            let cr = { name: "test assignment", due: "date/2021" };
            if (!err) {
              if (assignment) {
                cr = {
                  name: assignment.name,
                  due: assignment.dueDate,
                };
              }
            }
            console.log("resolving cr");
            return resolve(cr);
          } //end of assignment callback
        ); //end of assignment -- mongo
      }); //ennd of promise
      promise.then((cr) => {
        console.log("pushing cr into dt");
        dt.push(cr);
        //console.log(dt);
        if (dt.length === len) {
          // console.log(dt);
          getStudentData(students, dt);
          //return dt;
          //console.log(dt);
        }
      });
    } //end of for loop
  } //function of assignment ends here

  //getStudent data starts
  async function getStudentData(students, dt) {
    const st = [];
    let len = students.length;
    let s = { name: "Student name", email: "maili@mail.com" };
    students.forEach((student) => {
      let promise = new Promise((resolve, reject) => {
        Student.findById({ _id: student.id }, (err, student) => {
          if (!err) {
            if (student) {
              s = {
                name: student.name,
                email: student.email,
              };
            }
          }
          return resolve(s);
        }); //end student mongo
      }); //promise ends

      promise.then((s) => {
        //console.log(s);
        st.push(s);
        if (st.length === len) {
          console.log(st);
          console.log("------------------");
          console.log(dt);
        }
      }); //resolve end
    }); //end for each
  } //student func ends
  //res.send("success");
});

router.get("/course/share/:code", (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  res.render("admin/invite", {
    title: "Course Invitation",
    message: req.params.code,
    setClass: "success",
    text: "Share this course code with your students to get them enrolled.",
    setLink: req.params.code,
    dashLink: "/teacher/dashboard",
  });
});

router.get("/test", (req, res) => {
  const cookies = new Cookies(req, res, { keys: keys });
  const currentUser = cookies.get("User", { signed: true });
  res.render("teacher/course", { loggedUserName: currentUser });
});

module.exports = router;
