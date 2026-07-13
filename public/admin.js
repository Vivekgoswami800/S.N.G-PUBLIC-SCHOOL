// ============================================================
// ADMIN PANEL SCRIPT
// Handles login, and add/view/delete for notices, students,
// gallery, site photos, and contact messages.
// ============================================================

// ---------- Check if already logged in ----------
async function checkSession() {
  const res = await fetch('/api/session');
  const data = await res.json();
  if (data.loggedIn) {
    document.getElementById('loginBox').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadAllTabs();
  }
}
checkSession();

// ---------- Login / Logout ----------
async function doLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorBox = document.getElementById('loginError');
  errorBox.classList.remove('show');
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (res.ok) {
    document.getElementById('loginBox').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadAllTabs();
  } else {
    errorBox.textContent = 'Invalid username or password.';
    errorBox.classList.add('show');
  }
}

async function doLogout() {
  await fetch('/api/logout', { method: 'POST' });
  location.reload();
}

function loadAllTabs() {
  loadNoticesAdmin();
  loadStudentsAdmin();
  loadGalleryAdmin();
  loadMessagesAdmin();
}

// ---------- Tab switching ----------
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// ---------- Notices ----------
async function loadNoticesAdmin() {
  const res = await fetch('/api/notices');
  const notices = await res.json();
  document.getElementById('noticeTableBody').innerHTML = notices.map(n =>
    '<tr><td>' + n.date + '</td><td>' + n.title + '</td><td>' + (n.description || '') + '</td><td><button class="del-btn" onclick="deleteNotice(' + n.id + ')">Delete</button></td></tr>'
  ).join('');
}
async function addNotice() {
  const date = document.getElementById('noticeDate').value.trim();
  const title = document.getElementById('noticeTitle').value.trim();
  const description = document.getElementById('noticeDesc').value.trim();
  if (!date || !title) { alert('Date and title are required'); return; }
  await fetch('/api/notices', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, title, description })
  });
  document.getElementById('noticeDate').value = '';
  document.getElementById('noticeTitle').value = '';
  document.getElementById('noticeDesc').value = '';
  loadNoticesAdmin();
}
async function deleteNotice(id) {
  if (!confirm('Delete this notice?')) return;
  await fetch('/api/notices/' + id, { method: 'DELETE' });
  loadNoticesAdmin();
}

// ---------- Students ----------
async function loadStudentsAdmin() {
  const res = await fetch('/api/students');
  const students = await res.json();
  document.getElementById('studentTableBody').innerHTML = students.map(s =>
    '<tr><td>' + s.roll_no + '</td><td>' + s.name + '</td><td>' + s.class + '</td><td>' + s.attendance + '%</td><td><button class="del-btn" onclick="deleteStudent(\'' + s.roll_no + '\')">Delete</button></td></tr>'
  ).join('');
}
async function addStudent() {
  const roll_no = document.getElementById('sRoll').value.trim();
  const name = document.getElementById('sName').value.trim();
  const className = document.getElementById('sClass').value.trim();
  const attendance = parseInt(document.getElementById('sAttendance').value) || 0;
  const subjectsRaw = document.getElementById('sSubjects').value.trim();
  if (!roll_no || !name || !className) { alert('Roll number, name and class are required'); return; }
  // Parse "Hindi:85, Maths:90" into [["Hindi",85],["Maths",90]]
  const subjects = subjectsRaw ? subjectsRaw.split(',').map(pair => {
    const [subj, marks] = pair.split(':').map(x => x.trim());
    return [subj, parseInt(marks) || 0];
  }) : [];
  await fetch('/api/students', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roll_no, name, class: className, attendance, subjects })
  });
  ['sRoll', 'sName', 'sClass', 'sAttendance', 'sSubjects'].forEach(id => document.getElementById(id).value = '');
  loadStudentsAdmin();
}
async function deleteStudent(rollNo) {
  if (!confirm('Delete this student record?')) return;
  await fetch('/api/students/' + rollNo, { method: 'DELETE' });
  loadStudentsAdmin();
}

// ---------- Gallery ----------
async function loadGalleryAdmin() {
  const res = await fetch('/api/gallery');
  const items = await res.json();
  document.getElementById('adminGalleryGrid').innerHTML = items.map(item =>
    '<div class="g-slot"><img src="/uploads/' + item.filename + '" alt=""><button class="del-btn" style="position:absolute; top:6px; right:6px;" onclick="deleteGalleryPhoto(' + item.id + ')">✕</button></div>'
  ).join('');
}
async function addGalleryPhoto() {
  const fileInput = document.getElementById('galleryFile');
  const caption = document.getElementById('galleryCaption').value.trim();
  if (!fileInput.files[0]) { alert('Please choose a photo'); return; }
  const formData = new FormData();
  formData.append('photo', fileInput.files[0]);
  formData.append('caption', caption);
  await fetch('/api/gallery', { method: 'POST', body: formData });
  fileInput.value = '';
  document.getElementById('galleryCaption').value = '';
  loadGalleryAdmin();
}
async function deleteGalleryPhoto(id) {
  if (!confirm('Delete this photo?')) return;
  await fetch('/api/gallery/' + id, { method: 'DELETE' });
  loadGalleryAdmin();
}

// ---------- Site photos (hero + QR) ----------
async function uploadSitePhoto(key, inputId) {
  const fileInput = document.getElementById(inputId);
  if (!fileInput.files[0]) { alert('Please choose a photo'); return; }
  const formData = new FormData();
  formData.append('photo', fileInput.files[0]);
  const res = await fetch('/api/settings/' + key, { method: 'POST', body: formData });
  const status = document.getElementById('photoStatus');
  status.textContent = res.ok ? 'Photo updated! Refresh the main website to see it.' : 'Upload failed.';
}

// ---------- Messages ----------
async function loadMessagesAdmin() {
  const res = await fetch('/api/messages');
  const messages = await res.json();
  document.getElementById('messageTableBody').innerHTML = messages.map(m =>
    '<tr><td>' + m.name + '</td><td>' + (m.email || '-') + '</td><td>' + (m.phone || '-') + '</td><td>' + m.message + '</td><td>' + m.created_at + '</td><td><button class="del-btn" onclick="deleteMessage(' + m.id + ')">Delete</button></td></tr>'
  ).join('');
}
async function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  await fetch('/api/messages/' + id, { method: 'DELETE' });
  loadMessagesAdmin();
}

// ---------- Account ----------
async function changePassword() {
  const newPassword = document.getElementById('newPassword').value;
  if (!newPassword || newPassword.length < 4) { alert('Password must be at least 4 characters'); return; }
  const res = await fetch('/api/change-password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword })
  });
  document.getElementById('accountStatus').textContent = res.ok ? 'Password updated successfully!' : 'Could not update password.';
  document.getElementById('newPassword').value = '';
}
