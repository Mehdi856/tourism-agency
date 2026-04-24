/* ================================================
   LOGIN PAGE — JavaScript
   ================================================ */

(function () {
  'use strict';

  const form        = document.getElementById('loginForm');
  const usernameEl  = document.getElementById('username');
  const passwordEl  = document.getElementById('password');
  const usernameErr = document.getElementById('usernameError');
  const passwordErr = document.getElementById('passwordError');
  const loginError  = document.getElementById('loginError');
  const loginErrTxt = document.getElementById('loginErrorText');
  const submitBtn   = document.getElementById('submitBtn');
  const btnText     = document.getElementById('btnText');
  const btnIcon     = document.getElementById('btnIcon');
  const spinner     = document.getElementById('loginSpinner');
  const togglePw    = document.getElementById('togglePw');
  const pwIcon      = document.getElementById('pwIcon');

  /* ---- Password visibility toggle ---- */
  togglePw.addEventListener('click', () => {
    const isPassword = passwordEl.type === 'password';
    passwordEl.type  = isPassword ? 'text' : 'password';
    pwIcon.textContent = isPassword ? 'visibility' : 'visibility_off';
  });

  /* ---- Inline validation ---- */
  function validateField(input, errorEl, message) {
    if (!input.value.trim()) {
      errorEl.textContent = message;
      input.style.boxShadow = '0 0 0 2px rgba(186,26,26,0.2)';
      return false;
    }
    errorEl.textContent = '';
    input.style.boxShadow = '';
    return true;
  }

  usernameEl.addEventListener('blur', () =>
    validateField(usernameEl, usernameErr, 'Username is required.')
  );

  passwordEl.addEventListener('blur', () => {
    if (!passwordEl.value.trim()) {
      passwordErr.textContent = 'Password is required.';
      passwordEl.style.boxShadow = '0 0 0 2px rgba(186,26,26,0.2)';
    } else {
      passwordErr.textContent = '';
      passwordEl.style.boxShadow = '';
    }
  });

  /* ---- Set loading state ---- */
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    btnText.style.display  = isLoading ? 'none' : '';
    btnIcon.style.display  = isLoading ? 'none' : '';
    spinner.style.display  = isLoading ? '' : 'none';
  }

  /* ---- Show server-side error ---- */
  function showError(message) {
    loginErrTxt.textContent = message;
    loginError.style.display = 'flex';
  }

  /* ---- Form submit ---- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';

    const validUser = validateField(usernameEl, usernameErr, 'Username is required.');
    const validPass = passwordEl.value.trim()
      ? (passwordErr.textContent = '', true)
      : (passwordErr.textContent = 'Password is required.', false);

    if (!validUser || !validPass) return;

    setLoading(true);

    try {
      // api.js: POST /admin/authenticate → stores token in localStorage
      await login(usernameEl.value.trim(), passwordEl.value);
      window.location.href = 'adminDash.html';
    } catch (err) {
      showError(err.message || 'Unable to connect. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  });

})();
