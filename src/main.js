const form = document.querySelector("#rsvp-form");
const hint = document.querySelector("#rsvp-hint");

function buildRsvpText(data) {
  const lines = [
    `RSVP — ${data.name || ''}`,
    `Attendance: ${data.attendance || ''}`,
    `Guests: ${data.guests || ''}`,
  ];

  if (data.email) lines.push(`Email: ${data.email}`);
  if (data.note) lines.push(`Note: ${data.note}`);

  return lines.join("\n");
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    console.warn('Clipboard write failed', e);
  }
}

// Robust submit to Google Forms: open a popup window and POST a real form to /formResponse
async function postToGoogleForm(googleUrl, mapping, formData) {

  if (!googleUrl) {
    console.warn('No googleUrl provided');
    return false;
  }

  // Validate mapping values look like entry.########
  const invalid = Object.values(mapping).some(v => typeof v !== 'string' || !/^entry\.\d+$/.test(v));
  if (invalid) {
    console.warn('Google mapping contains invalid entry IDs. Mapping:', mapping);
    // still allow attempt, but warn
  }

  const postUrl = googleUrl.replace(/\/viewform.*$/, '/formResponse');

  // open a named popup window
  const winName = 'gf_submit_win_' + Date.now();
  // const popup = window.open('', winName, 'width=600,height=600');
  // if (!popup) {
  //   console.warn('Popup blocked by browser. Cannot submit to Google Form.');
  //   return false;
  // }

  // Build a real form element and append hidden inputs. For fields that have multiple values (checkboxes), append multiple inputs.
  const hiddenForm = document.createElement('form');
  hiddenForm.style.display = 'none';
  hiddenForm.method = 'POST';
  hiddenForm.action = postUrl;
  hiddenForm.target = winName;

  // For debugging: collect a textual copy of payload
  const debugPairs = [];

  for (const [localName, entryName] of Object.entries(mapping)) {
    // formData may be a FormData instance; if so, use getAll to preserve multiple values
    let values = [];
    if (typeof formData.getAll === 'function') {
      values = formData.getAll(localName);
    } else if (formData[localName] !== undefined) {
      // object fallback
      values = Array.isArray(formData[localName]) ? formData[localName] : [formData[localName]];
    }

    if (values.length === 0) {
      // create an empty input so Google receives the key (optional)
      const inp = document.createElement('input');
      inp.type = 'hidden';
      inp.name = entryName;
      inp.value = '';
      hiddenForm.appendChild(inp);
      debugPairs.push(`${entryName}=`);
    } else {
      for (const v of values) {
        const inp = document.createElement('input');
        inp.type = 'hidden';
        inp.name = entryName;
        inp.value = String(v);
        hiddenForm.appendChild(inp);
        debugPairs.push(`${entryName}=${encodeURIComponent(String(v))}`);
      }
    }
  }

  // Append the form and submit
  document.body.appendChild(hiddenForm);

  // Log the POST URL and body for debugging (so you can compare with your working prefilled link)
  console.log('Submitting to Google Forms POST URL:', postUrl);
  console.log('POST body (approx):', debugPairs.join('&'));

  try {
    hiddenForm.submit();
  } catch (e) {
    console.warn('Form submit threw', e);
    try { document.body.removeChild(hiddenForm); } catch (e) {}
    try { popup.close(); } catch (e) {}
    return false;
  }
  return true;
}

// --- Form submit handler ---
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hint.textContent = '';

  const fd = new FormData(form);
  // Build a small object for clipboard text
  const dataObj = {
    name: fd.get('name') ?? '',
    attendance: fd.get('attendance') ?? '',
    number: fd.get('number') ?? '',
    transfer: fd.get('transfer') ?? '',
    guests: fd.get('guests') ?? '',
    note: fd.get('note') ?? ''
  };

  const text = buildRsvpText(dataObj);

  // Google mapping: replace these with real entry IDs from your prefilled link
  const googleUrl = form.dataset.googleFormUrl;
  console.log('Google Form URL from data attribute:', googleUrl);
  const googleMapping = {
    name: 'entry.1562269776',
    attendance: 'entry.1118800612',
    number: 'entry.923967384',
    note: 'entry.2120441450',
    transfer: 'entry.1159858936',
    partner: 'entry.768318083',
    children_seats: 'entry.772500442'
  };

  try {
    if (googleUrl) {
      const ok = await postToGoogleForm(googleUrl, googleMapping, fd);
      if (ok) hint.textContent = 'Responses submitted to Google Form.';
      else hint.textContent = 'Google Form not submitted (check popup or mapping).';
    }

    await copyToClipboard(text);
    hint.textContent = (hint.textContent ? hint.textContent + ' ' : '') + 'Copied RSVP text to clipboard — paste it into a message.';
    form.reset();
    form.remove()
    let thankYouSection = document.getElementById('thank-you-section');
    if (thankYouSection) thankYouSection.style.display = 'flex';
    document.querySelector('#rsvp .section__lead').remove()

  } catch (err) {
    console.error(err);
    hint.textContent = 'Could not access clipboard or submit to Google Form. You can manually copy your responses.';
  }
});


// countdown

function initCountdown(){
  // Find all elements that may carry a data-wedding-date and pick the first valid one
  const candidates = Array.from(document.querySelectorAll('[data-wedding-date]'));
  let target = null;

  for (const el of candidates) {
    const v = el.dataset && el.dataset.weddingDate ? el.dataset.weddingDate : el.getAttribute('data-wedding-date');
    if (!v) continue;
    const parsed = parseFlexibleDate(v);
    if (parsed) { target = parsed; break; }
  }

  // fallback: look for #countdown or .countdown or .hero existing elements without data attribute
  if (!target) {
    const container = document.getElementById('countdown') || document.querySelector('.countdown') || document.querySelector('.count');
    if (!container) return;
    const v = container.dataset && container.dataset.weddingDate ? container.dataset.weddingDate : container.getAttribute('data-wedding-date');
    if (!v) return;
    const parsed = parseFlexibleDate(v);
    if (!parsed) return;
    target = parsed;
  }

  const targetDate = target.getTime();

  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  function update(){
    const now = Date.now();
    const diff = targetDate - now;
    if(diff<=0){
      if(daysEl) daysEl.textContent='0';
      if(hoursEl) hoursEl.textContent='0';
      if(minutesEl) minutesEl.textContent='0';
      if(secondsEl) secondsEl.textContent='0';
      clearInterval(timer);
      return;
    }
    const sec = Math.floor(diff/1000)%60;
    const min = Math.floor(diff/1000/60)%60;
    const hrs = Math.floor(diff/1000/60/60)%24;
    const days = Math.floor(diff/1000/60/60/24);
    if(daysEl) daysEl.textContent = days;
    if(hoursEl) hoursEl.textContent = hrs;
    if(minutesEl) minutesEl.textContent = min;
    if(secondsEl) secondsEl.textContent = sec;
  }
  update();
  const timer = setInterval(update,1000);
}

// Try to parse common date formats; handle mistaken YYYY-DD-MM by swapping if needed
function parseFlexibleDate(str){
  if(!str || typeof str !== 'string') return null;
  // Try native parse first (ISO like YYYY-MM-DDTHH:MM:SS)
  let d = new Date(str);
  if(!isNaN(d.getTime())) return d;

  // Try YYYY-MM-DD or YYYY-DD-MM separated by -
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](.*))?$/);
  if(m){
    const y = m[1], p1 = m[2], p2 = m[3], rest = m[4] ? 'T'+m[4] : '';
    // if middle part looks like a day (>12) and last part <=12, it's likely YYYY-DD-MM -> swap
    if(Number(p1) > 12 && Number(p2) <= 12){
      const swapped = `${y}-${String(p2).padStart(2,'0')}-${String(p1).padStart(2,'0')}${rest}`;
      d = new Date(swapped);
      if(!isNaN(d.getTime())) return d;
    }
    // try treating as YYYY-MM-DD explicitly
    const normal = `${y}-${String(p1).padStart(2,'0')}-${String(p2).padStart(2,'0')}${rest}`;
    d = new Date(normal);
    if(!isNaN(d.getTime())) return d;
  }

  // Try common DD-MM-YYYY or DD/MM/YYYY
  const m2 = str.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})(?:[ T](.*))?$/);
  if(m2){
    const day = m2[1], mon = m2[2], year = m2[3], rest = m2[4] ? 'T'+m2[4] : '';
    const formatted = `${year}-${mon}-${day}${rest}`;
    d = new Date(formatted);
    if(!isNaN(d.getTime())) return d;
  }

  console.warn('Countdown target date is invalid or unsupported format:', str);
  return null;
}

initCountdown()

