$(".side-link").click(function () {
  console.log("clicked");
});

var pageURL = $(location).attr("href");
function setName(e) {
  if (e.value.length === 0) {
    return $(".user-name").text("User Name");
  }
  $(".user-name").text(e.value);
}

function setMail(e) {
  if (e.value.length === 0) {
    return $(".user-email").text("Email");
  }
  $(".user-email").text(e.value);
}

$(".reset").click(function () {
  $(".user-name").text("User Name");
  $(".user-email").text("Email");
});
if ($("title").html() === "Add Admin") {
  $("select").prop("disabled", true);
  $("select").prepend('<option value="1" selected="Admin">Admin</option>');
  $("select").after('<input value="1" name="userType" hidden />');
}

try {
  if ($(".alert").html().length === 0) {
    $(".alert").css("display", "none");
  }
} catch (err) {}

// try {
//   $(".success").fadeOut(4000, "swing");
//   $(".error").fadeOut(4000, "swing");
// } catch (err) {
//   console.log();
// }

let title = $("title").html();
if (title === "Dashboard") {
  $(".dashboard").css("color", "black");
} else if (title === "Add User") {
  $(".add-user").css("color", "black");
} else if (title === "Student") {
  $(".student").css("color", "black");
} else if (title === "Admin Section") {
  $(".admin-section").css("color", "black");
} else if (title === "Invitations") {
  $(".invitations").css("color", "black");
}

function deleteTeacher(e) {
  console.log(e.value);
}
