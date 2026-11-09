// JOBBIESAREA Frontend
const BASE_URL = window.JOBBIES_API_URL || "/api";
const AUTH_STORAGE_KEY = "jobbiesarea_user";


// ========== MODAL FUNCTIONS ==========

function openRegister() { closeNav(); openModal("regOverlay"); }
function openLogin()    { closeNav(); openModal("logOverlay"); }
function openModal(id)  { document.getElementById(id).classList.add("show"); }
function closeModal(id) {
  document.getElementById(id).classList.remove("show");
  if (id==="regOverlay") { document.getElementById("regForm").reset(); document.getElementById("regMsg").className="m-msg"; }
  if (id==="logOverlay") { document.getElementById("logForm").reset(); document.getElementById("logMsg").className="m-msg"; }
}
function overlayClick(e, id) { if (e.target===e.currentTarget) closeModal(id); }
function switchTo(t) {
  if (t==="login")    { closeModal("regOverlay"); openModal("logOverlay"); }
  if (t==="register") { closeModal("logOverlay"); openModal("regOverlay"); }
}

// ========== PASSWORD TOGGLE ==========

function togglePw(fieldId, btn) {
  const field = document.getElementById(fieldId);
  const isPassword = field.type === "password";
  field.type = isPassword ? "text" : "password";
  btn.innerHTML = isPassword ? `<svg class="eye-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 3l18 18M10.6 6.2A10.2 10.2 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.2 3.8M6.2 6.8C3.9 8.2 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.3-.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>` : `<svg class="eye-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
}

// ========== HAMBURGER MENU & NAVIGATION ==========

/* ── Hamburger ── */
const hamburger = document.getElementById("hamburger");
const navLinks  = document.getElementById("navLinks");
hamburger.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  hamburger.classList.toggle("open", open);
});
function closeNav() { navLinks.classList.remove("open"); hamburger.classList.remove("open"); }

document.addEventListener("click", e => {
  if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) closeNav();
  // Close logout dropdown when clicking outside
  const profileWrap = document.getElementById("profileWrap");
  if (!profileWrap.contains(e.target)) document.getElementById("logoutDrop").classList.remove("show");
});

document.addEventListener("keydown", e => {
  if (e.key==="Escape") { closeModal("regOverlay"); closeModal("logOverlay"); }
});

// ========== PROFILE DROPDOWN ==========

function toggleDropdown() {
  document.getElementById("logoutDrop").classList.toggle("show");
}

// ========== AUTHENTICATION ==========

function setLoggedIn(user) {
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  // Hide auth links and hamburger
  document.getElementById("navLinks").style.display = "none";
  document.getElementById("hamburger").style.display = "none";
  document.getElementById("profileBtn").style.display = "flex";

  // Show profile pill
  const wrap = document.getElementById("profileWrap");
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";

  // Initials avatar
  const initials = user.firstName[0].toUpperCase() + user.lastName[0].toUpperCase();
  document.getElementById("profileAvatar").textContent = initials;
  document.getElementById("profileName").textContent = user.firstName;
}

function logout() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  document.getElementById("profileWrap").style.display = "none";
  document.getElementById("profileBtn").style.display = "none";
  document.getElementById("logoutDrop").classList.remove("show");
  // Restore auth links
  document.getElementById("navLinks").style.display = "";
  document.getElementById("hamburger").style.display = "";
}

function restoreLoggedInUser() {
  try {
    const savedUser = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (savedUser) setLoggedIn(JSON.parse(savedUser));
  } catch (error) {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    console.warn("Unable to restore login state:", error);
  }
}

// ========== FORM SUBMISSION ==========

/* ── Validation ── */
const phoneRx = /^\+?\d{7,15}$/;
function normPhone(v) { return v.replace(/\s+/g, ""); }
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── Register ── */
document.getElementById("regForm").addEventListener("submit", async e => {
  e.preventDefault();
  
  const firstName = document.getElementById("rFirst").value.trim();
  const lastName  = document.getElementById("rLast").value.trim();
  const phone     = normPhone(document.getElementById("rPhone").value);
  const email     = document.getElementById("remail").value.trim();
  const gender    = document.getElementById("rGender").value;
  const pass      = document.getElementById("rPass").value;
  const pass2     = document.getElementById("rPass2").value;

  // Validation
  if (!firstName||!lastName||!phone||!gender||!pass) { showMsg("regMsg","Please fill all fields.","error"); return; }
  if (!phoneRx.test(phone))   { showMsg("regMsg","Invalid phone number format.","error"); return; }
  if (!emailRx.test(email))   { showMsg("regMsg","Invalid email format.","error"); return; }
  if (pass.length < 6)        { showMsg("regMsg","Password must be at least 6 characters.","error"); return; }
  if (pass !== pass2)         { showMsg("regMsg","Passwords do not match.","error"); return; }

  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName, lastName, email, phone, gender,
        password: pass
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showMsg("regMsg", data.error || "Registration failed", "error");
      return;
    }

    document.getElementById("regForm").reset();
    showMsg("regMsg","Account created! Text file generated.","success");
    
    setTimeout(() => {
      closeModal("regOverlay");
      setLoggedIn(data.user);
    }, 1400);
  } catch (error) {
    console.error("Registration error:", error);
    showMsg("regMsg", error.message || "Registration failed", "error");
  }
});

/* ── Login ── */
document.getElementById("logForm").addEventListener("submit", async e => {
  e.preventDefault();
  
  const email = document.getElementById("lUser").value.trim();
  const pass  = document.getElementById("lPass").value;

  if (!email||!pass) { showMsg("logMsg","Please enter your email and password.","error"); return; }

  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass })
    });

    const data = await response.json();

    if (!response.ok) {
      showMsg("logMsg", data.error || "Login failed", "error");
      return;
    }

    showMsg("logMsg","Welcome back, "+data.user.firstName+"!","success");
    document.getElementById("logForm").reset();
    
    setTimeout(() => {
      closeModal("logOverlay");
      setLoggedIn(data.user);
    }, 1400);
  } catch (error) {
    console.error("Login error:", error);
    showMsg("logMsg", error.message || "Login failed", "error");
  }
});

// ========== UTILITIES ==========

function showMsg(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = "m-msg " + type;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.className = "m-msg"; }, 2000);
}

restoreLoggedInUser();
