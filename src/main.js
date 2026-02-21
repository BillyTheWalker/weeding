const form = document.querySelector("#rsvp-form");
const hint = document.querySelector("#rsvp-hint");

function buildRsvpText(data) {
  const lines = [
    `RSVP — ${data.name}`,
    `Attendance: ${data.attendance}`,
    `Guests: ${data.guests}`,
  ];

  if (data.email) lines.push(`Email: ${data.email}`);
  if (data.note) lines.push(`Note: ${data.note}`);

  return lines.join("\n");
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  hint.textContent = "";

  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());

  const text = buildRsvpText({
    name: String(data.name || "").trim(),
    email: String(data.email || "").trim(),
    attendance: String(data.attendance || "").trim(),
    guests: String(data.guests || "").trim(),
    note: String(data.note || "").trim(),
  });

  try {
    await copyToClipboard(text);
    hint.textContent = "Copied RSVP text to clipboard — paste it into a message.";
    form.reset();
  } catch {
    hint.textContent =
      "Could not access clipboard. You can manually copy your responses.";
  }
});