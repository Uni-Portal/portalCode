const mongoose = require("mongoose");
const { transformAuthInfo } = require("passport");

const userSchema = mongoose.Schema({
  email: String,
  password: String,
  userType: Number,
});

const adminSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mobile: Number,
  userType: Number,
  isActive: Boolean,
});

const teacherSchema = mongoose.Schema({
  name: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mobile: Number,
  students: [String],
  courses: [String],
  userType: Number,
  isActive: Boolean,
  time: {
    type: Date,
    default: Date.now,
  },
});

const studentSchema = mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
    required: true,
  },
  teachers: [String],
  courses: [String],
  userType: Number,
  isActive: Boolean,
  time: {
    type: Date,
    default: Date.now,
  },
});

const inviteSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  expiry: {
    type: Date,
  },
  userType: {
    type: Number,
  },
  isExpired: Boolean,
});

const referralSchema = mongoose.Schema({
  teacher: {
    type: String,
    unique: true,
  },
  key: {
    type: Number,
    required: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

const courseSchema = mongoose.Schema({
  teacher: {
    type: String,
    required: true,
  },
  uniqueCode: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  students: [String],
  assignments: [String],
  isActive: Boolean,
});

const assignmentSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  created: {
    type: Date,
    deafualt: Date.now,
  },
  description: {
    type: String,
    default: "Questions Here",
  },
  file: String,
  submissions: [String],
  dueDate: {
    type: Date,
  },
  isActive: Boolean,
});

const submissionSchema = mongoose.Schema({
  assignment: {
    type: String,
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  student: {
    type: String,
    required: true,
  },
  file: String,
  description: String,
  date: {
    type: Date,
    default: Date.now,
  },
  marks: Number,
  isChecked: Boolean,
});

module.exports = {
  userSchema: userSchema,
  adminSchema: adminSchema,
  teacherSchema: teacherSchema,
  studentSchema: studentSchema,
  inviteSchema: inviteSchema,
  referralSchema: referralSchema,
  courseSchema: courseSchema,
  assignmentSchema: assignmentSchema,
  submissionSchema: submissionSchema,
};
