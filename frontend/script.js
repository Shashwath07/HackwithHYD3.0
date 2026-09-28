const chat = document.getElementById("chat");
const form = document.getElementById("chat-form");
const idInput = document.getElementById("customer-id");
const msgInput = document.getElementById("message");
const sendBtn = document.getElementById("send");
const errorBox = document.getElementById("error");


/* ---------------------------------------------------------
   Restore customer ID only
   --------------------------------------------------------- */

try {
  idInput.value = localStorage.getItem("customerId") || "";
} catch (_) {}


/* ---------------------------------------------------------
   Display a chat bubble
   --------------------------------------------------------- */

function addBubble(text, role) {
  const empty = chat.querySelector(".empty");

  if (empty) {
    empty.remove();
  }

  const el = document.createElement("div");

  el.className = "bubble " + role;
  el.textContent = text;

  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;

  return el;
}


/* ---------------------------------------------------------
   Display errors
   --------------------------------------------------------- */

function showError(text) {
  errorBox.textContent = text || "";
  errorBox.hidden = !text;
}


/* ---------------------------------------------------------
   Start a NEW chat
   --------------------------------------------------------- */

function startNewChat() {
  chat.innerHTML =
    '<div class="empty">Start a new conversation.</div>';

  showError("");
}


/* ---------------------------------------------------------
   Customer ID change
   --------------------------------------------------------- */

idInput.addEventListener("change", () => {
  const customerId = idInput.value.trim();

  if (!customerId) {
    startNewChat();
    return;
  }

  try {
    localStorage.setItem(
      "customerId",
      customerId
    );
  } catch (_) {}

  /*
     IMPORTANT:
     Do NOT load previous customer conversations.

     The customer memory is available to the AI
     through Hindsight when a new message is sent.
  */

  startNewChat();
});


/* ---------------------------------------------------------
   Send message
   --------------------------------------------------------- */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const customerId =
    idInput.value.trim();

  const message =
    msgInput.value.trim();

  if (!customerId) {
    return showError(
      "Enter your customer ID first."
    );
  }

  if (!message) {
    return;
  }

  showError("");

  try {
    localStorage.setItem(
      "customerId",
      customerId
    );
  } catch (_) {}

  /* Show ONLY the current session messages */
  addBubble(
    message,
    "user"
  );

  msgInput.value = "";

  sendBtn.disabled = true;

  const loading = addBubble(
    "Typing...",
    "agent loading"
  );

  try {
    const res = await fetch(
      "/api/chat",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          customer_id:
            customerId,

          message:
            message
        })
      }
    );

    const data =
      await res.json();

    loading.remove();

    if (!res.ok) {
      return showError(
        data.error ||
        "Request failed."
      );
    }

    addBubble(
      data.reply,
      "agent"
    );

  } catch (err) {
    loading.remove();

    showError(
      "Can't reach the server. Check that it is running and try again."
    );

  } finally {
    sendBtn.disabled = false;
    msgInput.focus();
  }
});