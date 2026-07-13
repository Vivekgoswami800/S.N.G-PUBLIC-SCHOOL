// ============================================================
// PUBLIC WEBSITE SCRIPT
// This talks to the backend server (server.js) using fetch().
// All data (notices, results, gallery) now comes from the
// real database, not from the browser's local storage.
// ============================================================

// ---------- Load hero photo & QR code (set by admin) ----------
async function loadSiteImage(key, slotId) {
  const res = await fetch('/api/settings/' + key);
  const data = await res.json();
  if (data.value) {
    document.getElementById(slotId).innerHTML = '<img src="/uploads/' + data.value + '" alt="' + key + '">';
  }
}
loadSiteImage('hero_photo', 'heroPhotoSlot');
loadSiteImage('qr_photo', 'qrSlot');


async function loadLogo() {
  const res = await fetch('/api/settings/logo');
  const data = await res.json();
  if (data.value) {
    document.getElementById('logoSlot').innerHTML =
      '<img src="/uploads/' + data.value + '" alt="School Logo" style="width:40px; height:40px; border-radius:50%; object-fit:cover;"> S.N.G Public School';
  }
}
loadLogo();

// ---------- Notices ----------
async function loadNotices() {
  const res = await fetch('/api/notices');
  const notices = await res.json();
  const list = document.getElementById('noticeList');
  if (notices.length === 0) {
    list.innerHTML = '<p style="padding:16px;">No notices yet.</p>';
    return;
  }
  list.innerHTML = notices.map(n =>
    '<div class="notice-item"><div class="notice-date">' + n.date + '</div><div><h4>' + n.title + '</h4><p>' + (n.description || '') + '</p></div></div>'
  ).join('');
}
loadNotices();

// ---------- Gallery ----------
async function loadGallery() {
  const res = await fetch('/api/gallery');
  const items = await res.json();
  const grid = document.getElementById('galleryGrid');
  if (items.length === 0) {
    grid.innerHTML = '<p style="padding:16px;">No photos added yet. Admin can add photos from the Admin Panel.</p>';
    return;
  }
  grid.innerHTML = items.map(item =>
    '<div class="g-slot"><img src="/uploads/' + item.filename + '" alt="' + (item.caption || 'School photo') + '"></div>'
  ).join('');
}
loadGallery();

// ---------- Result / Attendance lookup ----------
async function lookupRoll() {
  const roll = document.getElementById('rollInput').value.trim();
  const box = document.getElementById('lookupResult');
  if (!roll) return;
  box.classList.add('show');
  box.innerHTML = '<p>Checking...</p>';
  try {
    const res = await fetch('/api/students/' + encodeURIComponent(roll));
    if (!res.ok) {
      box.innerHTML = '<p>No record found for this roll number.</p>';
      return;
    }
    const student = await res.json();
    const attColor = student.attendance >= 85 ? 'background:#3f7a4e; color:#fff;' : (student.attendance >= 75 ? 'background:#E8B94A; color:#1F2A24;' : 'background:#C1502E; color:#fff;');
    let rowsHtml = '';
    student.subjects.forEach(function (s) { rowsHtml += '<tr><td>' + s[0] + '</td><td>' + s[1] + ' / 100</td></tr>'; });
    box.innerHTML =
      '<strong>' + student.name + '</strong> — Class ' + student.class + '<br>' +
      '<div style="margin-top:8px;">Attendance: <span class="attend-badge" style="' + attColor + '">' + student.attendance + '%</span></div>' +
      '<table>' + rowsHtml + '</table>';
  } catch (err) {
    box.innerHTML = '<p>Something went wrong. Please try again.</p>';
  }
}

// ---------- Contact form ----------
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const status = document.getElementById('contactStatus');
    const name = document.getElementById('cName').value.trim();
    const email = document.getElementById('cEmail').value.trim();
    const phone = document.getElementById('cPhone').value.trim();
    const message = document.getElementById('cMessage').value.trim();
    if (!name || !message) return;
    status.textContent = 'Sending...';

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message })
      });
    } catch (err) { /* ignore, still try email */ }

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '53584968-c944-4289-8b10-590f929d2f25',
          subject: 'New message from school website — ' + name,
          name: name,
          email: email || 'not given',
          phone: phone || 'not given',
          message: message
        })
      });
      if (res.ok) {
        status.textContent = 'Message sent! We will get back to you soon.';
        contactForm.reset();
      } else {
        status.textContent = 'Could not send message. Please try again.';
      }
    } catch (err) {
      status.textContent = 'Could not send message. Please try again.';
    }
  });
}
