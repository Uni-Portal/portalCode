const express = require("express");
const randomstring = require("randomstring");

const router = express.Router();
// router.use(fileUpload);

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
const { assignmentSchema, submissionSchema } = require("../schema");
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
const Submission = mongoose.model("submission", submissionSchema);

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
  let teacherId;
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
    teacherId = user._id;
    var cookies = new Cookies(req, res, { keys: keys });
    cookies.set("User", user.name, { signed: true });
    const courseSet = [];
    let promise = new Promise((resolve, reject) => {
      //console.log(teacherId);
      Course.find({ teacher: teacherId }, (err, courses) => {
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
  //console.log(req.user._id);
  const key = randomstring.generate({
    length: 6,
    charset: "alphanumeric",
  });
  Teacher.findOne({ email: req.user.username }, (err, teacher) => {
    if (!err) {
      addCourse(teacher._id);
    }
  });

  const addCourse = (id) => {
    const newCourse = new Course({
      teacher: id,
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
  }; //end add course
});

//route under work -----change get from post at final---------under work---------------
router.get("/course/:id", (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  let messageClass, message;
  if (req.query.stat === "success") {
    messageClass = "success";
    message = "Assignment Created !";
  } else if (req.query.stat === "fail") {
    messageClass = "fail";
    message = "Something went wrong !";
  }
  const cookies = new Cookies(req, res, { keys: keys });
  const currentUser = cookies.get("User", { signed: true });
  const courseId = req.params.id;
  let date = new Date();
  date.setDate(new Date().getDate() + 3);
  // const a = new Assignment({
  //   title: "Assignment 1",
  //   course: req.body.courseId,
  //   dueDate: date,
  //   isActive: true,
  // });
  // a.save();
  Course.findOne({ _id: courseId }, (err, course) => {
    //console.log(course);
    if (err) {
      //will replace with error routes or redirects
      return res.send(err);
    }
    if (!course) {
      //error page will be updated
      return res.send(err);
    }
    const courseId = course._id;
    const code = course.uniqueCode;
    const title = course.title;
    let date = course.created;
    date =
      date.getDate() + "/" + date.getMonth() + 1 + "/" + date.getFullYear();
    const totalStudents = course.students.length;
    (async function main() {
      let students;
      let assignments;
      try {
        students = await Promise.all(
          course.students.map((student) => {
            return Student.findOne({ _id: student });
          })
        );
      } catch (err) {
        students = [];
      }
      try {
        assignments = await Promise.all(
          course.assignments.map((assignment) => {
            return Assignment.findOne({ _id: assignment });
          })
        );
      } catch (err) {
        assignments = [];
      }
      // console.log(students);
      // console.log(assignments);
      const studentData = [];
      const assignmentData = [];
      students.forEach((student) => {
        const st = {
          id: student._id,
          name: student.name,
          email: student.email,
        };
        studentData.push(st);
      });
      assignments.forEach((assignment) => {
        let dueDate;
        try {
          dueDate = assignment.dueDate;
          dueDate = dueDate.getDate() + "/" + dueDate.getMonth() + 1;
        } catch (err) {}
        let as;
        try {
          as = {
            id: assignment._id,
            title: assignment.title,
            description: assignment.description,
            //created
            due: dueDate,
          };
        } catch (err) {
          return;
        }
        // console.log(assignment.created);
        assignmentData.push(as);
      });
      // console.log(studentData);
      //console.log(assignmentData);
      return res.render("teacher/course", {
        loggedUserName: currentUser,
        uniqueCode: code,
        courseId: courseId,
        title: title,
        created: date,
        studentLength: studentData.length,
        assignments: assignmentData,
        students: studentData,
        messageClass: messageClass,
        message: message,
      });
    })();
  });
});

//------------------------under construction route ---------------

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

//route for handling submissions
router.get("/course/submissions/:courseId/:id", (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  const courseId = req.params.courseId;
  const assignmentId = req.params.id;
  const cookies = new Cookies(req, res, { keys: keys });
  const currentUser = cookies.get("User", { signed: true });
  Teacher.findOne({ email: req.user.username }, (err, user) => {
    if (err) {
      return res.redirect("/teacher/course/" + courseId);
    }
    if (!user) {
      return res.redirect("/login");
    }
    const submitted = [],
      notSubmitted = [];
    const data = [];
    Course.findOne({ _id: courseId }, (err, course) => {
      if (err) {
        return res.redirect("/teacher/course/" + courseId);
      }
      if (!course) {
        return res.redirect("/teacher/course/" + courseId);
      }
      const students = course.students;
      (async function () {
        const assignment = await Assignment.findOne({ _id: assignmentId });
        let dis;
        try {
          if (!assignment.file) {
            dis = "disabled";
          }
        } catch (err) {
          dis = "disabled";
        }
        const assignmentData = {
          title: assignment.title,
          description: assignment.description,
          file: assignment.file,
          due: assignment.dueDate,
          disabled: dis,
        };
        //console.log(assignmentData);
        const submissions = await Promise.all(
          students.map((st) => {
            return Submission.findOne({
              student: st,
              assignment: assignmentId,
            });
          })
        );
        var filtered = submissions.filter(function (el) {
          return el != null;
        });
        const submittedStudent = await Promise.all(
          filtered.map((s) => {
            return Student.findOne({ _id: s.student });
          })
        );

        submittedStudent.forEach((st, index) => {
          const dt = {
            name: st.name,
            status: "Submitted",
            date: submissions[index].date,
            file: submissions[index].file,
            disabled: "",
          };
          submitted.push(dt);
          data.push(dt);
        });
        //console.log(data);

        const studentData = await Promise.all(
          students.map((st) => {
            return Student.findOne({ _id: st });
          })
        );
        console.log(studentData);
        studentData.forEach((d) => {
          try {
            if (submissions.some((sb) => sb.student === d._id.toString())) {
              return;
            }
          } catch (err) {}
          const dt = {
            name: d.name,
            status: "Not Submitted",
            date: "-------",
            file: "",
            disabled: "disabled",
          };
          notSubmitted.push(dt);
          data.push(dt);
        });
        return res.render("teacher/submissions", {
          loggedUserName: currentUser,
          submissions: data,
          assignment: assignmentData,
          id: courseId,
        });
      })(); //async end
    });
  }); //end teacher find
});

router.get("/sub", (req, res) => {
  res.render("teacher/submissions");
});

router.get("/test", (req, res) => {
  const cookies = new Cookies(req, res, { keys: keys });
  const currentUser = cookies.get("User", { signed: true });
  res.render("teacher/course", { loggedUserName: currentUser });
});

module.exports = router;
