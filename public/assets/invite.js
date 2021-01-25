if ($("title").text() === "Course Invitation") {
  $("hr").hide();
  $(".link").css("width", "30%");
  $(".copy-link").text("Copy Invitation");
}

function copyInvitation() {
  var copyText = document.getElementById("inviteLink");

  /* Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 99999); /* For mobile devices */

  /* Copy the text inside the text field */
  document.execCommand("copy");

  /* Alert the copied text */
  let alertText;
  if ($("title").text() === "Referral") {
    alertText =
      "Link Copied!\nShare this link and the key with students to get them register in the portal.\n";
  } else if ($("title").text() === "Course Invitation") {
    alertText =
      "Copied!\nShare this code with your students to get them enrolled.";
  } else {
    alertText =
      "Link Copied !\nShare the link and get user registered within next 3 days.\n";
  }
  alert(alertText);
}
try {
  if ($(".message").hasClass("fail")) {
    $(".copy-link").prop("disabled", "true");
  }
} catch (err) {}
