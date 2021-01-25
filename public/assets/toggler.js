function test(e) {
  console.log(e.value);
  if ($("." + e.value).is(":checked")) {
    $("#activate_" + e.value).submit();
    //alert("activate");
  } else {
    $("#deactivate_" + e.value).submit();
    //alert("deactivate");
  }
}

function copyInvitation(id) {
  var copyText = document.getElementById("inviteLink_" + id);

  /* Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 99999); /* For mobile devices */

  /* Copy the text inside the text field */
  document.execCommand("copy");

  /* Alert the copied text */
  alert("Link Copied !");
}
