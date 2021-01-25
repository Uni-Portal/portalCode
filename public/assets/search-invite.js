const invites = $(".invites");
const users = [];
for (let i = 0; i < invites.length; i++) {
  users.push($(".invites")[i].id);
  //console.log();
}

function searchUser(e) {
  if (e.value.length === 0) {
    $(".invites").removeClass("hidden");
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
      if (regex.test(user)) {
        const setId = "#" + user;

        $(setId).removeClass("hidden");
        count++;
      } else if (!regex.test(user)) {
        $("#" + user).addClass("hidden");
        if (count === 0) {
          $(".invite-button").removeAttr("disabled");
        }
      }
      if (count > 0) $(".invite-button").prop("disabled", "true");
    });
  } catch (err) {}
}
