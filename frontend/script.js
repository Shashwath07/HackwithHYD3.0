````javascript
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
   Markdown formatting
   --------------------------------------------------------- */

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function formatInlineMarkdown(value) {
  let text = escapeHTML(value);

  // Inline code
  text = text.replace(
    /`([^`]+)`/g,
    "<code>$1</code>"
  );

  // Bold + italic
  text = text.replace(
    /\*\*\*(.+?)\*\*\*/g,
    "<strong><em>$1</em></strong>"
  );

  text = text.replace(
    /\*\*(.+?)\*\*/g,
    "<strong>$1</strong>"
  );

  text = text.replace(
    /___(.+?)___/g,
    "<strong><em>$1</em></strong>"
  );

  text = text.replace(
    /__(.+?)__/g,
    "<strong>$1</strong>"
  );

  // Italic
  text = text.replace(
    /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
    "<em>$1</em>"
  );

  text = text.replace(
    /(?<!_)_([^_\n]+)_(?!_)/g,
    "<em>$1</em>"
  );

  // Links
  text = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return text;
}


function renderMarkdown(markdown) {
  const lines = String(markdown || "")
    .replace(/\r\n/g, "\n")
    .split("\n");

  const output = [];

  let inUl = false;
  let inOl = false;
  let inCode = false;
  let codeLines = [];


  function closeLists() {
    if (inUl) {
      output.push("</ul>");
      inUl = false;
    }

    if (inOl) {
      output.push("</ol>");
      inOl = false;
    }
  }


  function closeCode() {
    if (inCode) {
      output.push(
        `<pre class="ai-code"><code>${escapeHTML(
          codeLines.join("\n")
        )}</code></pre>`
      );

      codeLines = [];
      inCode = false;
    }
  }


  for (const rawLine of lines) {
    const line = rawLine.trimEnd();


    /* Code blocks */

    if (/^```/.test(line)) {
      if (inCode) {
        closeCode();
      } else {
        closeLists();
        inCode = true;
      }

      continue;
    }


    if (inCode) {
      codeLines.push(line);
      continue;
    }


    /* Empty line */

    if (!line.trim()) {
      closeLists();
      continue;
    }


    /* Headings */

    const heading = line.match(
      /^(#{1,4})\s+(.+)$/
    );

    if (heading) {
      closeLists();

      const level = Math.min(
        heading[1].length,
        4
      );

      output.push(
        `<h${level}>${formatInlineMarkdown(
          heading[2]
        )}</h${level}>`
      );

      continue;
    }


    /* Numbered list */

    const ordered = line.match(
      /^\s*(\d+)[.)]\s+(.+)$/
    );

    if (ordered) {
      if (!inOl) {
        closeLists();

        output.push("<ol>");

        inOl = true;
      }

      output.push(
        `<li>${formatInlineMarkdown(
          ordered[2]
        )}</li>`
      );

      continue;
    }


    /* Bullet list */

    const bullet = line.match(
      /^\s*[-*•]\s+(.+)$/
    );

    if (bullet) {
      if (!inUl) {
        closeLists();

        output.push("<ul>");

        inUl = true;
      }

      output.push(
        `<li>${formatInlineMarkdown(
          bullet[1]
        )}</li>`
      );

      continue;
    }


    /* Normal paragraph */

    closeLists();

    output.push(
      `<p>${formatInlineMarkdown(
        line.trim()
      )}</p>`
    );
  }


  closeLists();
  closeCode();

  return output.join("");
}


/* ---------------------------------------------------------
   Styling for formatted AI responses
   --------------------------------------------------------- */

function addChatEnhancementStyles() {
  if (
    document.getElementById(
      "chat-enhancement-styles"
    )
  ) {
    return;
  }


  const style =
    document.createElement("style");

  style.id =
    "chat-enhancement-styles";


  style.textContent = `

    .bubble.agent {
      line-height: 1.6;
    }


    .bubble.agent p {
      margin: 0 0 10px;
    }


    .bubble.agent p:last-child {
      margin-bottom: 0;
    }


    .bubble.agent h1,
    .bubble.agent h2,
    .bubble.agent h3,
    .bubble.agent h4 {
      margin-top: 14px;
      margin-bottom: 7px;
      line-height: 1.3;
      font-weight: 700;
    }


    .bubble.agent h1 {
      font-size: 1.35rem;
    }


    .bubble.agent h2 {
      font-size: 1.2rem;
    }


    .bubble.agent h3 {
      font-size: 1.08rem;
    }


    .bubble.agent h4 {
      font-size: 1rem;
    }


    .bubble.agent ul,
    .bubble.agent ol {
      margin: 8px 0 12px 22px;
      padding: 0;
    }


    .bubble.agent li {
      margin: 5px 0;
    }


    .bubble.agent strong {
      font-weight: 700;
    }


    .bubble.agent em {
      font-style: italic;
    }


    .bubble.agent code {
      padding: 2px 5px;
      border-radius: 5px;
      background: rgba(127, 127, 127, 0.14);
      font-family:
        ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;
    }


    .bubble.agent .ai-code {
      overflow-x: auto;
      padding: 12px;
      margin: 10px 0;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.08);
    }


    .bubble.agent .ai-code code {
      padding: 0;
      background: transparent;
      white-space: pre;
    }


    /* -----------------------------------------------------
       Interactive emoji reactions
       ----------------------------------------------------- */

    .ai-reactions {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 10px;
    }


    .ai-reaction {
      border: 1px solid rgba(127, 127, 127, 0.25);
      background: transparent;
      border-radius: 999px;
      padding: 5px 9px;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      transition:
        transform 0.15s ease,
        background 0.15s ease;
    }


    .ai-reaction:hover {
      transform: translateY(-2px) scale(1.05);
      background: rgba(127, 127, 127, 0.12);
    }


    .ai-reaction.selected {
      transform: scale(1.08);
      background: rgba(127, 127, 127, 0.20);
    }


    .ai-reaction-label {
      font-size: 11px;
      opacity: 0.65;
      margin-left: 4px;
    }


    .ai-reaction.selected
    .ai-reaction-label {
      opacity: 1;
    }


    .ai-reaction:active {
      transform: scale(0.95);
    }

  `;


  document.head.appendChild(style);
}


addChatEnhancementStyles();


/* ---------------------------------------------------------
   Interactive emoji reactions
   --------------------------------------------------------- */

function addReactions(container) {

  const reactions =
    document.createElement("div");

  reactions.className =
    "ai-reactions";

  reactions.setAttribute(
    "aria-label",
    "Rate this response"
  );


  const options = [
    {
      emoji: "👍",
      label: "Helpful"
    },
    {
      emoji: "👎",
      label: "Not helpful"
    },
    {
      emoji: "❤️",
      label: "Loved it"
    }
  ];


  options.forEach(
    ({ emoji, label }) => {

      const button =
        document.createElement(
          "button"
        );

      button.type = "button";

      button.className =
        "ai-reaction";

      button.innerHTML =
        `${emoji}<span class="ai-reaction-label">${label}</span>`;

      button.title = label;

      button.setAttribute(
        "aria-label",
        label
      );


      button.addEventListener(
        "click",
        () => {

          reactions
            .querySelectorAll(
              ".ai-reaction"
            )
            .forEach(
              (item) =>
                item.classList.remove(
                  "selected"
                )
            );


          button.classList.add(
            "selected"
          );

        }
      );


      reactions.appendChild(
        button
      );
    }
  );


  container.appendChild(
    reactions
  );
}


/* ---------------------------------------------------------
   Display a chat bubble
   --------------------------------------------------------- */

function addBubble(text, role) {

  const empty =
    chat.querySelector(
      ".empty"
    );


  if (empty) {
    empty.remove();
  }


  const el =
    document.createElement(
      "div"
    );


  el.className =
    "bubble " + role;


  /*
     AI responses:
     Render Markdown as HTML.

     User messages:
     Keep textContent for safety.
  */

  if (
    role.includes("agent") &&
    !role.includes("loading")
  ) {

    el.innerHTML =
      renderMarkdown(text);

    addReactions(el);

  } else {

    el.textContent =
      text;
  }


  chat.appendChild(
    el
  );


  chat.scrollTop =
    chat.scrollHeight;


  return el;
}


/* ---------------------------------------------------------
   Display errors
   --------------------------------------------------------- */

function showError(text) {

  errorBox.textContent =
    text || "";

  errorBox.hidden =
    !text;
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

idInput.addEventListener(
  "change",
  () => {

    const customerId =
      idInput.value.trim();


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

       Do NOT load previous
       customer conversations.

       Customer memory is available
       to the AI through Hindsight
       when a new message is sent.
    */

    startNewChat();
  }
);


/* ---------------------------------------------------------
   Send message
   --------------------------------------------------------- */

form.addEventListener(
  "submit",
  async (e) => {

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


    /* Show ONLY current session messages */

    addBubble(
      message,
      "user"
    );


    msgInput.value = "";


    sendBtn.disabled =
      true;


    const loading =
      addBubble(
        "Typing...",
        "agent loading"
      );


    try {

      const res =
        await fetch(
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

      sendBtn.disabled =
        false;

      msgInput.focus();
    }
  }
);
````
