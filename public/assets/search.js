const users = [];
try {
  for (var i = 0; i < $(".teacher").length; i++) {
    let email = document
      .querySelectorAll(".teacher-email")
      [i].innerHTML.split("@");
    let domain = email[1].split(".");
    let modifiedEmail = email[0] + domain[0] + domain[1];
    const u = {
      name: document
        .querySelectorAll(".teacher-name")
        [i].innerHTML.toLowerCase(),
      email: modifiedEmail,
    };
    users.push(u);
  }
} catch (err) {}

function searchUser(e) {
  if (e.value.length === 0) {
    $(".teacher").removeClass("hidden");
    $(".invite-button").prop("disabled", true);
    return;
  }

  let key;

  const r = new RegExp("@");
  let value = e.value.toLowerCase();
  if (r.test(value)) {
    let orgKey = value.split("@");
    if (orgKey.length > 1) {
      const k = new RegExp(".");
      if (k.test(orgKey[1])) {
        let domain = orgKey[1].split(".");
        if (domain.length > 1) {
          key = orgKey[0] + domain[0] + domain[1];
        } else if (domain.length === 1) {
          key = orgKey[0] + domain[0];
        }
      } else if (!k.test(orgKey[1])) {
        key = orgKey[0] + orgKey[1];
      }
    } else if (orgKey.length === 1) {
      key = orgKey[0];
    }
  } else if (!r.test(value)) {
    key = value;
  }

  const regex = new RegExp(key);

  try {
    let count = 0;
    users.forEach((user) => {
      if (regex.test(user.email) || regex.test(user.name)) {
        const setClass = "." + user.email;

        $(setClass).removeClass("hidden");
        count++;
      } else if (!regex.test(user.email) || !regex.test(user.name)) {
        $("." + user.email).addClass("hidden");
        if (count === 0) {
          $(".invite-button").removeAttr("disabled");
        }
      }
      if (count > 0) $(".invite-button").prop("disabled", "true");
    });
  } catch (err) {}
}
