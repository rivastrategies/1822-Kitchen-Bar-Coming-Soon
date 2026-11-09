(function () {
  'use strict';
  const form = document.getElementById('application-form');
  const button = document.getElementById('submit-application');
  const feedback = document.getElementById('form-feedback');
  const config = window.siteConfig || {};
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const live = window.is1822Live === true;
  const draft = config.mode === 'draft';
  const endpoint = config.careersEndpoint || '';
  // Draft submission is allowed on loopback only, never an accidental public copy.
  const enabled = /^https:\/\/formspree\.io\/f\/[a-z]+$/.test(endpoint) && ((draft && local) || live);
  let busy = false;
  let sent = false;
  let started = false;
  let reference = null;
  const label = draft ? 'Send test application ↗' : 'Send application ↗';

  function track(event) {
    if (live && window.rrAnalytics) window.rrAnalytics.trackEvent(event, { provider: 'formspree' });
  }
  function show(title, message, error) {
    feedback.replaceChildren();
    const heading = document.createElement('h3');
    const paragraph = document.createElement('p');
    heading.textContent = title;
    paragraph.textContent = message;
    feedback.append(heading, paragraph);
    feedback.classList.toggle('error', !!error);
    feedback.hidden = false;
    feedback.focus();
  }
  function validate() {
    for (const input of form.querySelectorAll('input,select,textarea')) {
      input.removeAttribute('aria-invalid');
      if (input.type !== 'checkbox' && typeof input.value === 'string') input.value = input.value.trim();
      input.setCustomValidity('');
    }
    const resume = form.elements.resume_url;
    if (resume.value) {
      try { const url = new URL(resume.value); if (url.protocol !== 'https:' || url.username || url.password) throw new Error(); }
      catch (_) { resume.setCustomValidity('Use a valid HTTPS link without a username or password.'); }
    }
    const phone = form.elements.phone;
    if (phone.value && phone.value.replace(/\D/g, '').length < 10) phone.setCustomValidity('Include an area code and at least 10 digits.');
    const invalid = [...form.querySelectorAll('input,select,textarea')].filter(input => !input.checkValidity());
    if (invalid.length) {
      invalid.forEach(input => input.setAttribute('aria-invalid', 'true'));
      show('Please check your application.', 'Complete the required fields and check the highlighted information. Your entries have been kept.', true);
      invalid[0].focus();
      invalid[0].reportValidity();
      return false;
    }
    return true;
  }
  form.addEventListener('input', event => {
    event.target.removeAttribute('aria-invalid');
    if (event.target.setCustomValidity) event.target.setCustomValidity('');
    if (!started && enabled) { started = true; track('career_application_start'); }
  });
  button.textContent = label;
  button.disabled = !enabled;
  if (!enabled) show('Application preview only.', 'Applications are not open through this page yet. The confirmed application process will be announced here.', false);
  if (!live) {
    const note = document.getElementById('draft-form-note');
    note.hidden = false;
    note.textContent = enabled
      ? 'Draft application preview. Use invented test details only. Test entries are saved and trigger an email notification.'
      : 'Application preview only. Use the published Careers page to apply.';
    document.querySelector('.submit-row p').textContent = 'Preview only · Not an application for employment';
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!enabled || busy || sent || !validate()) return;
    if (form.elements._gotcha.value) return;
    busy = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    feedback.hidden = true;
    reference = reference || ('1822-' + (draft ? 'TEST-' : '') + crypto.randomUUID());
    const data = new FormData(form);
    data.set('_subject', draft ? '[DRAFT TEST — NO ACTION] 1822 Careers' : '1822 Kitchen & Bar — Application');
    data.set('submission_id', reference);
    data.set('submitted_at_utc', new Date().toISOString());
    data.set('submission_type', draft ? 'TEST — exclude from hiring totals' : 'career_application');
    data.set('brand', '1822 Kitchen & Bar');
    data.set('location_id', '1822_memorial');
    data.set('submission_page', '/careers/');
    data.set('source', '1822 website careers page');
    data.set('environment', draft ? 'draft' : 'production');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' }, signal: controller.signal });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result || result.ok !== true) {
        const failure = new Error('rejected');
        failure.status = response.status;
        throw failure;
      }
      sent = true;
      track('career_application_submit');
      form.reset();
      show(draft ? 'Test application saved.' : 'Thank you. Your application was received.',
        (draft ? 'Saved to the separate draft form. ' : 'Please keep this reference for your records. ') + 'Reference: ' + reference, false);
      button.textContent = draft ? 'Test saved ✓' : 'Application received ✓';
    } catch (error) {
      const knownRejection = error.status && error.status >= 400 && error.status < 500;
      show(knownRejection ? 'Your application was not accepted.' : 'We could not confirm receipt.',
        (knownRejection ? 'Please check your details and try again. ' : 'Your entries have been kept. The connection may have stopped after delivery; check with the site team before retrying. ') + 'Reference: ' + reference, true);
      button.textContent = label;
      track('career_application_error');
    } finally {
      clearTimeout(timer);
      busy = false;
      button.disabled = sent;
      form.removeAttribute('aria-busy');
    }
  });
})();
