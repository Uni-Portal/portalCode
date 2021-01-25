// alert("Hello");
var popup = document.getElementsByClassName("pop-upbackground");
var addButton = document.getElementById("add_course");
var closeBtn = document.getElementById("closeBtn");

if ($(".message").hasClass("success") || $(".message").hasClass("fail")) {
  $(".message").fadeOut(4000);
}

addButton.addEventListener("click", function () {
  popup[0].style.display = "block";
});
closeBtn.addEventListener("click", function () {
  popup[0].style.display = "none";
});

window.onclick = function (event) {
  if (event.target == popup[0]) {
    popup[0].style.display = "none";
  }
};

function share() {
  let code = $(".share-code").val();
  alert(code);
}
