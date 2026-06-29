/* ============================================================
   Login Page
   Handles user sign-in and registration with role assignment.
   ============================================================ */

Router.register('login', async function (container) {
  let isRegisterView = false;

  function renderView() {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; justify-content: center; min-height: 70vh; padding: var(--space-md) 0;">
        <div class="glass-card" style="width: 100%; max-width: 400px; margin: 0 auto;">
          
          <!-- Logo/Branding -->
          <div style="text-align: center; margin-bottom: var(--space-xl);">
            <div style="font-size: 3rem; margin-bottom: var(--space-sm); filter: drop-shadow(0 4px 12px rgba(16,185,129,0.35));">📖</div>
            <h2 style="font-size: 1.5rem; font-weight: 800; background: linear-gradient(135deg, var(--green-400), var(--green-300)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;" data-i18n="header.title">${I18n.t('header.title')}</h2>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;" id="auth-subtitle">Welcome back! Please login to your account.</p>
          </div>

          <!-- Auth Form -->
          <form id="auth-form" onsubmit="return false;">
            
            <!-- Register Top Fields -->
            <div id="register-fields-top" style="display: none;">
              <!-- Name -->
              <div class="form-group">
                <label class="form-label" data-i18n="yearly.name">${I18n.t('yearly.name')}</label>
                <input type="text" id="auth-name" class="form-input" placeholder="Your Full Name">
              </div>

              <!-- Mobile -->
              <div class="form-group">
                <label class="form-label">Mobile Number</label>
                <input type="tel" id="auth-mobile" class="form-input" placeholder="017xxxxxxxx">
              </div>

              <!-- University -->
              <div class="form-group">
                <label class="form-label">University</label>
                <input type="text" id="auth-university" class="form-input" placeholder="University Name">
              </div>

              <!-- Blood Group Select -->
              <div class="form-group">
                <label class="form-label">Blood Group</label>
                <select id="auth-blood" class="form-input" style="color: var(--text-primary); cursor: pointer; border: 1px solid var(--border-color); background: rgba(0,0,0,0.15);">
                  <option value="A+" style="background-color: #1f2937; color: var(--text-primary);">A+</option>
                  <option value="A-" style="background-color: #1f2937; color: var(--text-primary);">A-</option>
                  <option value="B+" style="background-color: #1f2937; color: var(--text-primary);">B+</option>
                  <option value="B-" style="background-color: #1f2937; color: var(--text-primary);">B-</option>
                  <option value="O+" style="background-color: #1f2937; color: var(--text-primary);">O+</option>
                  <option value="O-" style="background-color: #1f2937; color: var(--text-primary);">O-</option>
                  <option value="AB+" style="background-color: #1f2937; color: var(--text-primary);">AB+</option>
                  <option value="AB-" style="background-color: #1f2937; color: var(--text-primary);">AB-</option>
                </select>
              </div>
            </div>

            <!-- Email -->
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" id="auth-email" class="form-input" placeholder="name@domain.com" required>
            </div>

            <!-- Password -->
            <div class="form-group" id="auth-password-group" style="margin-bottom: var(--space-lg);">
              <label class="form-label">Password</label>
              <div style="position: relative;">
                <input type="password" id="auth-password" class="form-input" placeholder="••••••••" style="padding-right: 40px;" required>
                <button type="button" class="password-toggle-btn" data-target="auth-password" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 1.1rem; display: flex; align-items: center; justify-content: center; padding: 0;">👁️</button>
              </div>
            </div>

            <!-- Register Bottom Fields -->
            <div id="register-fields-bottom" style="display: none;">
              <!-- Confirm Password -->
              <div class="form-group">
                <label class="form-label">Confirm Password</label>
                <div style="position: relative;">
                  <input type="password" id="auth-confirm-password" class="form-input" placeholder="••••••••" style="padding-right: 40px;">
                  <button type="button" class="password-toggle-btn" data-target="auth-confirm-password" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 1.1rem; display: flex; align-items: center; justify-content: center; padding: 0;">👁️</button>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <button type="submit" id="auth-submit-btn" class="btn btn-primary btn-block" style="margin-top: var(--space-lg); font-weight: 600;">
              Login
            </button>

            <!-- Google Sign-In Container -->
            <div id="google-signin-container" style="margin-top: var(--space-md);">
              <div style="display: flex; align-items: center; text-align: center; margin: var(--space-md) 0; color: var(--text-muted); font-size: 0.75rem;">
                <hr style="flex: 1; border: none; border-top: 1px solid var(--border-color); margin-right: 8px;">
                <span>OR</span>
                <hr style="flex: 1; border: none; border-top: 1px solid var(--border-color); margin-left: 8px;">
              </div>
              <button type="button" id="auth-google-btn" class="btn" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.03); color: var(--text-primary); font-weight: 600; padding: 10px; cursor: pointer; border-radius: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
                Continue with Google
              </button>
            </div>
            
            <!-- Resend verification link container -->
            <div id="resend-verification-container" style="display: none; text-align: center; margin-top: var(--space-md); font-size: 0.75rem;">
              <span style="color: var(--text-muted);">Didn't get the email?</span>
              <button type="button" id="auth-resend-btn" style="color: var(--color-primary); font-weight: 600; margin-left: 4px; background: none; border: none; cursor: pointer; text-decoration: underline; font-size: 0.75rem;">Resend Verification Link</button>
            </div>
          </form>

          <!-- Toggle Link -->
          <div style="text-align: center; margin-top: var(--space-xl); font-size: 0.8125rem; color: var(--text-secondary);">
            <span id="toggle-text">Don't have an account?</span>
            <button id="toggle-auth-view" style="color: var(--color-primary); font-weight: 600; margin-left: 4px;">Sign Up</button>
          </div>

        </div>
      </div>
    `;

    wireEvents();
    I18n.applyLanguage();
  }

  function wireEvents() {
    const form = container.querySelector('#auth-form');
    const registerFieldsTop = container.querySelector('#register-fields-top');
    const registerFieldsBottom = container.querySelector('#register-fields-bottom');
    const subtitle = container.querySelector('#auth-subtitle');
    const submitBtn = container.querySelector('#auth-submit-btn');
    const toggleText = container.querySelector('#toggle-text');
    const toggleBtn = container.querySelector('#toggle-auth-view');
    const googleBtn = container.querySelector('#auth-google-btn');

    // Toggle Sign-in / Sign-up view
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        isRegisterView = !isRegisterView;
        
        if (isRegisterView) {
          registerFieldsTop.style.display = 'block';
          registerFieldsBottom.style.display = 'block';
          subtitle.textContent = 'Create your account to start tracking.';
          submitBtn.textContent = 'Sign Up';
          toggleText.textContent = 'Already have an account?';
          toggleBtn.textContent = 'Login';
          container.querySelector('#auth-password-group').style.marginBottom = 'var(--space-md)';
        } else {
          registerFieldsTop.style.display = 'none';
          registerFieldsBottom.style.display = 'none';
          subtitle.textContent = 'Welcome back! Please login to your account.';
          submitBtn.textContent = 'Login';
          toggleText.textContent = "Don't have an account?";
          toggleBtn.textContent = 'Sign Up';
          container.querySelector('#auth-password-group').style.marginBottom = 'var(--space-lg)';
        }
      });
    }

    // Google Sign-In click
    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        googleBtn.disabled = true;
        const originalText = googleBtn.innerHTML;
        googleBtn.innerHTML = 'Connecting...';
        try {
          await Auth.loginWithGoogle();
          App.showToast('Logged in successfully!', 'success');
          Router.navigate('home');
        } catch (error) {
          console.error(error);
          App.showToast(error.message || 'Google Sign-In failed', 'error');
          googleBtn.disabled = false;
          googleBtn.innerHTML = originalText;
        }
      });
    }

    // Resend verification link click
    const resendBtn = container.querySelector('#auth-resend-btn');
    const resendContainer = container.querySelector('#resend-verification-container');
    if (resendBtn) {
      resendBtn.addEventListener('click', async () => {
        const email = container.querySelector('#auth-email').value;
        const password = container.querySelector('#auth-password').value;
        if (!email || !password) {
          App.showToast('Please enter your email and password first to resend the verification link.', 'error');
          return;
        }
        resendBtn.disabled = true;
        resendBtn.textContent = 'Sending...';
        try {
          await Auth.resendVerification(email, password);
          App.showToast('Verification email resent successfully! Please check your Inbox and Spam/Junk folder.', 'success');
          if (resendContainer) {
            resendContainer.style.display = 'none';
          }
        } catch (err) {
          console.error(err);
          App.showToast(err.message || 'Failed to resend verification email', 'error');
        } finally {
          resendBtn.disabled = false;
          resendBtn.textContent = 'Resend Verification Link';
        }
      });
    }

    // Form submission
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = container.querySelector('#auth-email').value;
        const password = container.querySelector('#auth-password').value;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';

        try {
          if (isRegisterView) {
            const name = container.querySelector('#auth-name').value;
            const mobile = container.querySelector('#auth-mobile').value;
            const university = container.querySelector('#auth-university').value;
            const bloodGroup = container.querySelector('#auth-blood').value;
            const confirmPassword = container.querySelector('#auth-confirm-password').value;

            if (!name) {
              App.showToast('Please enter your name', 'error');
              submitBtn.disabled = false;
              submitBtn.textContent = 'Sign Up';
              return;
            }
            if (password !== confirmPassword) {
              App.showToast('Passwords do not match', 'error');
              submitBtn.disabled = false;
              submitBtn.textContent = 'Sign Up';
              return;
            }
            const additionalData = { mobile, university, bloodGroup };
            await Auth.register(email, password, name, additionalData);
             if (typeof FirebaseAvailable !== 'undefined' && FirebaseAvailable) {
              App.showToast('Registration successful! A verification email has been sent. Please check your Inbox and Spam/Junk folder!', 'success');
            } else {
              App.showToast('Registration successful! (Offline Mock Mode: No email sent)', 'success');
            }
            
            // Switch back to Login view
            isRegisterView = false;
            registerFieldsTop.style.display = 'none';
            registerFieldsBottom.style.display = 'none';
            subtitle.textContent = 'Welcome back! Please login to your account.';
            submitBtn.textContent = 'Login';
            toggleText.textContent = "Don't have an account?";
            toggleBtn.textContent = 'Sign Up';
            container.querySelector('#auth-password-group').style.marginBottom = 'var(--space-lg)';
            
            container.querySelector('#auth-name').value = '';
            container.querySelector('#auth-mobile').value = '';
            container.querySelector('#auth-university').value = '';
            container.querySelector('#auth-password').value = '';
            container.querySelector('#auth-confirm-password').value = '';
          } else {
            await Auth.login(email, password);
            App.showToast('Welcome back!', 'success');
            Router.navigate('home');
          }
        } catch (error) {
          console.error(error);
          App.showToast(error.message || 'Authentication failed', 'error');
          if (!isRegisterView && error.message && error.message.includes("not verified")) {
            const resendContainer = container.querySelector('#resend-verification-container');
            if (resendContainer) {
              resendContainer.style.display = 'block';
            }
          }
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = isRegisterView ? 'Sign Up' : 'Login';
        }
      });
    }

    // Toggle password visibility listener
    container.querySelectorAll('.password-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = container.querySelector(`#${targetId}`);
        if (input) {
          if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = '🙈';
          } else {
            input.type = 'password';
            btn.textContent = '👁️';
          }
        }
      });
    });
  }

  renderView();
});
