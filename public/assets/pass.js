$(document).ready(function () {
  if ($(".teacher").val() && $(".userType").val() === "3") {
    $(".email").removeAttr("readonly");
  }
});
