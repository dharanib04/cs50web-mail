document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // By default, load the inbox
  load_mailbox("inbox");
});

function sendMail(e) {
  e.preventDefault();
  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: document.querySelector("#compose-recipients").value,
      subject: document.querySelector("#compose-subject").value,
      body: document.querySelector("#compose-body").value,
    }),
  });
  load_mailbox("sent");
}

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  document.querySelector("#display-view").style.display = "none";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";

  document.querySelector("#compose-view").onsubmit = sendMail;
}

function createButton(mailbox, id, element) {
  const button = document.createElement("button");
  button.style.float = "right";
  if (mailbox == "inbox") {
    button.textContent = "Archive";
  } else {
    button.textContent = "Unarchive";
  }
  buttonClick(button, id);
  element.appendChild(button);
}

function elementClick(element, id) {
  element.addEventListener("click", function (e) {
    e.stopPropagation();
    document.querySelector("#display-view").style.display = "block";
    fetch("/emails/" + id, {
      method: "PUT",
      body: JSON.stringify({
        read: true,
      }),
    });

    fetch("/emails/" + id)
      .then((response) => response.json())
      .then((mail) => {
        mailContent(mail);
      });
  });
}
function displayEmail(email, mailbox) {
  const element = document.createElement("div");
  element.innerHTML =
    email.sender + " " + email.subject + " " + email.timestamp;
  element.style.border = "solid 1px black";
  element.style.padding = "1%";
  if (email.read) {
    element.style.backgroundColor = "lightgray";
  } else {
    element.style.backgroundColor = "white";
  }
  if (mailbox != "sent") {
    createButton(mailbox, email.id, element);
  }
  document.querySelector("#emails-view").append(element);
  elementClick(element, email.id);
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#display-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;
  fetch("/emails/" + mailbox)
    .then((response) => response.json())
    .then((emails) => {
      // Print emails
      for (let i = 0; i < emails.length; i++) {
        displayEmail(emails[i], mailbox);
      }
    });
}

function buttonClick(button, email_id) {
  button.addEventListener("click", function (e) {
    e.stopPropagation();
    fetch("/emails/" + email_id, {
      method: "PUT",
      body: JSON.stringify({
        archived: button.textContent == "Archive",
      }),
    });
    button.dataset.clicked = "true";
    load_mailbox("inbox");
  });
}

function mailContent(email) {
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";

  const from = document.createElement("div"),
    to = document.createElement("div"),
    subject = document.createElement("div"),
    body = document.createElement("div"),
    timestamp = document.createElement("div"),
    reply = document.createElement("button"),
    ruler = document.createElement("hr");
  from.innerHTML = "<b>From: </b>" + email.sender;
  to.innerHTML = "<b>To: </b>" + email.recipients;
  subject.innerHTML = "<b>Subject: </b>" + email.subject;
  timestamp.innerHTML = "<b>Timestamp: </b>" + email.timestamp;
  reply.textContent = "Reply";

  reply.addEventListener("click", function () {
    compose_email();
    document.querySelector("#compose-recipients").value = email.sender;
    if (email.subject.includes("Re:")) {
      document.querySelector("#compose-subject").value = email.subject;
    } else {
      document.querySelector("#compose-subject").value = "Re: " + email.subject;
    }
    document.querySelector("#compose-body").value =
      "On " + email.timestamp + " " + email.sender + " wrote:" + email.body;
  });

  ruler.style.border = "solid 0.25px lightgray";
  body.innerHTML = email.body;
  document
    .querySelector("#display-view")
    .append(from, to, subject, timestamp, reply, ruler, body);
}
