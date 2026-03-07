const form = document.querySelector("#rsvp-form");
const hint = document.querySelector("#rsvp-hint");
const attendanceField = form?.querySelector('[name="attendance"]');
const additionalInfo = document.querySelectorAll(".additional_info");

function toggleAdditionalInfo() {
  const shouldShow = attendanceField?.value === "yes";

  if (additionalInfo) {
    for(const info of additionalInfo)
      info.hidden = !shouldShow;
  }
}

attendanceField?.addEventListener("change", toggleAdditionalInfo);
toggleAdditionalInfo();

// --- Form submit handler ---
form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const fd = new FormData(form);

  // Google mapping: replace these with real entry IDs from your prefilled link
  const googleUrl = form.dataset.googleFormUrl;
  console.log('Google Form URL from data attribute:', googleUrl);
  fetch(googleUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded", },
    body: new URLSearchParams({
      'entry.1562269776': fd.get('name'),
      'entry.1118800612': fd.get('attendance'),
      'entry.923967384': fd.get('number'),
      'entry.2120441450': fd.get('note'),
      'entry.1159858936': fd.get('transfer') ? fd.get('transfer') : "",
      'entry.768318083': fd.get('partner') ? fd.get('partner') : "",
      'entry.772500442': fd.get('children_seats')
    })
  });


  try {
    const shouldShow = (attendanceField?.value === "yes");
    form.reset();
    form.remove()
    let thankYouSection = shouldShow ? document.getElementById('thank-you-section') : document.getElementById('thank-you-section-no');
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
