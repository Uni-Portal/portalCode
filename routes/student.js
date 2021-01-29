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

router.get("/invite/:id", (req, res, next) => {
  Refer.findOne({ _id: req.params.id }, (err, refer) => {
    if (err) {
      return res.send("<h3>Something wrong happened</h3>");
    }
    if (!refer) {
      return res.send("Sorry buddy you are not invited, better luck next time");
    } else {
      return res.render("student-entry", {
        inviteId: refer.teacher,
        error: "",
      });
    }
  });
});

router.post("/key", (req, res) => {
  Refer.findOne({ teacher: req.body.inviteId }, (err, refer) => {
    let error;
    if (err) {
      error = "Something wrong happened.";
    } else {
      if (refer) {
        //console.log(refer.key + " ::: " + req.body.uniqueKey);
        if (parseInt(req.body.uniqueKey) === refer.key) {
          return res.render("signup", {
            email: " ",
            userType: 3,
            key: "",
            teacher: refer.teacher,
          });
        } else {
          return res.render("student-entry", {
            error: "Invalid Key.",
            inviteId: refer.teacher,
          });
        }
      } else {
        error = "Something wrong happened.";
      }
    }
    res.render("student-entry", {
      error: error,
      inviteId: req.body.inviteId,
    });
  });
});

//route under construction
router.get("/dashboard", (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  let enrollClass, enrollMessage;
  if (req.query.status === "success") {
    enrollClass = "success";
    enrollMessage = "Successfully Enrolled !";
  } else if (
    req.query.status === "fail" ||
    req.query.status === "exist" ||
    req.query.status === "notfound"
  ) {
    enrollClass = "fail";
    if (req.query.status === "exist")
      enrollMessage = "You are already enrolled !";
    else if (req.query.status === "notfound")
      enrollMessage = "No such course exists !";
    else enrollMessage = "Enrollment Failed !";
  }
  const user = req.user.username;
  let courses;
  Student.findOne({ email: user }, (err, student) => {
    if (err) {
      return res.redirect("/logout");
    }
    if (!student) {
      return res.redirect("/logout");
    }
    var cookies = new Cookies(req, res, { keys: keys });
    cookies.set("User", student.name, { signed: true });
    const currentUser = student.name;
    courses = student.courses;
    (async function main() {
      try {
        const result = await Promise.all(
          courses.map((course) => {
            //console.log(course);
            return Course.findOne({ _id: course }, (err, c) => {
              //console.log(c.title);
              // return c.title;
            });
          })
        );
        //console.log(result);
        const courseData = [];
        result.forEach((r) => {
          if (r === null) {
            return;
          }
          const c = {
            id: r._id,
            title: r.title,
            uniqueCode: r.uniqueCode,
            description: r.description,
          };
          courseData.push(c);
        });
        return res.render("student/dashboard", {
          loggedUserName: currentUser,
          courses: courseData,
          enrollClass: enrollClass,
          enrollMessage: enrollMessage,
        });

        // console.log(assignments);
        //another await for fetching assignment
        //await for fetching due assignment
        //-----------------------
        //console.log(result);
      } catch (err) {
        console.log("something wrong happened" + err);
        return res.render("student/dashboard", {
          loggedUserName: currentUser,
          courses: [],
          enrollClass: enrollClass,
          enrollMessage: enrollMessage,
        });
      }
    })();
  });
  // res.render("student/dashboard", {
  //   loggedUserName: currentUser,
  //   enrollClass: enrollClass,
  //   enrollMessage: enrollMessage,
  // });
});
//---------------under construction------------------------------------

//student enroll --route under construction -- fix error page /error
router.post("/enroll", (req, res, next) => {
  const code = req.body.code;
  const username = req.user.username;
  Course.findOne({ uniqueCode: code }, (err, course) => {
    if (course) {
      const creator = course.teacher;
      Student.findOne({ email: username }, (err, student) => {
        if (err) {
          //error page yet to fix
          console.log("error in student fetch");
          return res.redirect("/error");
        }
        if (!student) {
          //error page yet to fix
          console.log("no student found");
          return res.redirect("/error");
        }
        const update = { $push: { courses: course._id } };
        if (!student.teachers.includes(course.teacher)) {
          update = {
            $push: { courses: course._id },
            $push: { teachers: course.teacher },
          };
        }
        let stat;
        if (!student.courses.includes(course._id)) {
          Student.updateOne({ email: student.email }, update, (err) => {
            if (err) {
              stat = encodeURIComponent("fail");
              console.log("error in update" + err);
              return res.redirect("/student/dashboard/?status=" + stat);
            }
            stat = encodeURIComponent("success");
            console.log("success");
            Course.updateOne(
              { uniqueCode: code },
              { $push: { students: student._id } },
              (err) => {
                if (!err) {
                  return res.redirect("/student/dashboard/?status=" + stat);
                } else {
                  stat = encodeURIComponent("fail");
                  console.log("error in course student update" + err);
                  return res.redirect("/student/dashboard/?status=" + stat);
                }
              }
            );
          });
        } else {
          stat = encodeURIComponent("exist");
          console.log("already exists !");
          return res.redirect("/student/dashboard?status=" + stat);
        }
      });
    } else {
      stat = encodeURIComponent("notfound");
      console.log("error in course finding");
      return res.redirect("/teacher/dashboard?status=" + stat);
    }
  });
});

//course assignment page --------------------------
router.get("/course/:id", (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  Student.findOne({ email: req.user.username }, (err, user) => {
    if (err) {
      return res.redirect("/student/dashboard");
    }
    if (!user) {
      return res.redirect("/login");
    }
    const cookies = new Cookies(req, res, { keys: keys });
    const currentUser = cookies.get("User", { signed: true });
    const courseId = req.params.id;
    Course.findOne({ _id: req.params.id }, (err, course) => {
      if (err) {
        return res.redirect("/course/dashboard");
      }
      if (!course) {
        return res.redirect("/student/dashboard");
      }
      const assignments = course.assignments;
      const courseName = course.title;

      (async function main() {
        try {
          const submissions = await Promise.all(
            assignments.map((assignment) => {
              return Submission.findOne({
                assignment: assignment,
                student: user._id,
              });
            })
          );
          const submittedAssignment = [];
          submissions.forEach((submission) => {
            if (submission === null) return;
            submittedAssignment.push(submission.assignment);
          });
          //console.log(submittedAssignment);
          //console.log(assignments);
          //console.log(submissions);
          const assData = await Promise.all(
            assignments.map((assignment) => {
              return Assignment.findOne({ _id: assignment });
            })
          );
          const assignmentData = [];
          //console.log(assData);
          assData.forEach((assignment) => {
            //console.log(assignment);
            let status, symbol;
            const pending = "fa fa-exclamation";
            const missed = "fa fa-times";
            const done = "fa fa-check-circle";
            let submitted = false;
            // try {
            //   if (
            //     submissions.some(
            //       (sub) =>
            //         sub.assignment === assignment._id && sub.assignment != null
            //     )
            //   ) {
            //     status = "done";
            //     symbol = done;
            //     submitted = true;
            //   }
            // } catch (err) {}
            // console.log(
            //   assignment._id +
            //     "---------" +
            //     submittedAssignment.includes(assignment)
            // );
            if (submittedAssignment.includes(assignment._id.toString())) {
              status = "done";
              symbol = done;
              submitted = true;
            }
            let today = new Date();
            if (today <= assignment.dueDate && !submitted) {
              status = "pending";
              symbol = pending;
            } else if (
              today > assignment.dueDate &&
              assignment.dueDate != null
            ) {
              if (!submitted) {
                status = "missed";
                symbol = missed;
              }

              Assignment.updateOne(
                { _id: assignment._id },
                { isActive: false },
                (err) => {
                  if (err) console.log("error while updating active status !");
                  else {
                    console.log("assignment status update success");
                  }
                }
              );
            } else {
              if (!submitted) {
                status = "pending";
                symbol = pending;
              }
            } //end else

            let submissionDate;
            try {
              const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              const month = [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ];

              let dt = assignment.dueDate;
              submissionDate =
                days[dt.getDay()] +
                " " +
                month[dt.getMonth()] +
                " " +
                dt.getDate() +
                " " +
                dt.getFullYear();
              submissionDate +=
                "\n" +
                "Time: " +
                dt.getHours() +
                ":" +
                dt.getMinutes() +
                ":" +
                dt.getSeconds();
            } catch (err) {
              submissionDate = "Any Time";
            }

            const as = {
              id: assignment._id,
              courseId: courseId,
              title: assignment.title,
              created: assignment.created,
              actualDue: assignment.dueDate,
              dueDate: submissionDate,
              status: status,
              symbol: symbol,
              isActive: assignment.isActive,
            };
            assignmentData.push(as);
          }); //asignment end for each

          function compare(a, b) {
            const statA = a.status.toLowerCase();
            const statB = b.status.toLowerCase();
            let comparision = 0;
            if (statA > statB) comparision = -1;
            else if (statA < statB) comparision = 1;
            return comparision;
          }

          assignmentData.sort(compare);

          res.render("student/assignment_list", {
            loggedUserName: currentUser,
            course: courseName,
            assignments: assignmentData,
          }); //render end
        } catch (err) {
          console.log(err);
          res.render("student/assignment_list", {
            loggedUserName: currentUser,
            course: courseName,
            assignments: [],
          });
        }
        // console.log(assignments);
      })();
    }); //---------end course
  }); //student end
});
// ----------course assignment page --------------------------------

router.get("/assignment/:courseId/:assignmentId", (req, res, next) => {
  //res.send(req.params.id);
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  const courseId = req.params.courseId;
  const assignmentId = req.params.assignmentId;
  // console.log(courseId + "   " + assignmentId);
  const username = req.user.username; //wll replace with req.user.username
  Student.findOne({ email: username }, (err, user) => {
    if (err) {
      console.log("errom fron student find");
      return res.redirect("/student/course/" + courseId);
    }
    if (!user) {
      req.logout();
      console.log("student not found");
      return res.redirect("/login");
    }
    let setClass, message;
    if (req.query.status === "success") {
      setClass = "success";
      message = "Hurray, Assignment Completed !";
    } else if (req.query.status === "updated") {
      setClass = "success";
      message = "Submission Changed Successfully !";
    } else if (req.query.status === "fail") {
      setClass = "fail";
      message = "Oops! Something Went Wrong, Try Again Later.";
    }
    const cookies = new Cookies(req, res, { keys: keys });
    const currentUser = cookies.get("User", { signed: true });
    Assignment.findOne({ _id: assignmentId }, (err, assignment) => {
      if (err) {
        // console.log(assignment);
        return res.redirect("/student/course/" + courseId);
      }
      if (!assignment) {
        console.log("no assignments");
        return res.redirect("/student/course/" + courseId);
      }
      let data;
      let setView = "disabled",
        setUpload,
        setQuestion = "disabled",
        setUploadText = "Submit Assignment",
        submissionLink,
        questionLink,
        fileLink;
      const submissions = assignment.submissions;
      try {
        if (new Date() <= assignment.dueDate && assignment.isActive) {
          setUploadText = "Submit Assignment";
        } else if (new Date() > assignment.dueDate && !assignment.isActive) {
          setUpload = "disabled";
          setUploadText = "Missed !";
        }
      } catch (err) {
        setUploadText = "Submit Assignment";
      }
      try {
        if (assignment.file.length > 0) {
          setQuestion = "";
          questionLink = assignment.file;
        }
      } catch (err) {}

      let promise = new Promise((resolve, reject) => {
        // if (!submissions.includes(user._id.toString())) {
        //   console.log("resolving null");
        //   resolve(null);
        // }
        Submission.findOne(
          { student: user._id, assignment: assignmentId },
          (err, submission) => {
            //console.log(submission.file);
            if (err) {
              reject();
            }
            if (!submission) {
              //console.log("resolving null");
              return resolve(null);
            }
            try {
              if (submission.file.length) {
                setView = "";
                fileLink = submission.file;
                console.log("resolving id");
                return resolve(submission._id);
              }
            } catch (err) {
              console.log("resolving id but from eror: \n" + err);
              return resolve(submission._id);
            }
          }
        );
      }); //promise end
      promise.then(
        (id) => {
          //console.log("from then : " + id);
          if (id !== null) {
            // console.log("true");
            setUploadText = "Change Assignment";
          }
          let desc;
          try {
            if (assignment.description.length > 0)
              desc = assignment.description;
          } catch (err) {
            desc = "Question Over Here !";
          }
          let due = assignment.dueDate;
          if (assignment.dueDate === null) {
            due = "Submit Any Time";
          }
          data = {
            id: assignmentId,
            courseId: courseId,
            submissionId: id,
            title: assignment.title,
            description: desc,
            due: due,
            viewButton: setView,
            uploadButton: setUpload,
            questionButton: setQuestion,
            questionLink: questionLink,
            fileLink: fileLink,
            buttonText: setUploadText,
            messageClass: setClass,
            message: message,
          };
          console.log(setUpload);
          return res.render("student/assignment", {
            loggedUserName: currentUser,
            assignment: data,
            messageClass: setClass,
            message: message,
          });
        },
        (err) => {
          console.log("error from fetcing submissions");
          return res.redirect("/student/course/" + courseId);
        }
      );
    }); //end assignment callback
  });
  //res.send(courseId + " " + assignmentId);
});

// router.get("/testId/:id/:second", (req, res, next) => {
//   res.send(req.params.id + " " + req.params.second);
// });

module.exports = router;
