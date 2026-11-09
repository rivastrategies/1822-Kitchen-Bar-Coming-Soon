(function () {
  'use strict';
  const config = window.siteConfig || { mode: 'draft' };
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const production = location.hostname === '1822kitchenandbar.com';
  const live = config.mode === 'live' && production;
  window.is1822Live = live;
  if (!live) {
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.content = 'noindex, nofollow';
    const banner = document.createElement('div');
    banner.className = 'draft-banner';
    banner.textContent = 'DRAFT FOR REVIEW · Not published · Test information only';
    document.body.prepend(banner);
  }
  if (live && /^G-[A-Z0-9]+$/.test(config.analyticsId || '')) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    // Query strings and form values are deliberately excluded from analytics.
    window.gtag('config', config.analyticsId, { page_location: location.origin + location.pathname });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + config.analyticsId;
    document.head.append(script);
  }
  document.documentElement.dataset.localPreview = String(local);
})();
