(function () {
  'use strict';

  if (window.rrAnalytics) return;

  function trackEvent(name, params) {
    var clean = {
      brand: '1822_kitchen_bar',
      location_id: '1822_memorial'
    };
    if (params && typeof params.provider === 'string') clean.provider = params.provider.slice(0, 80);

    if (typeof window.gtag === 'function') {
      window.gtag('event', name, clean);
    } else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: name }, clean));
    }
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href') || '';
    if (href.indexOf('tel:') === 0) {
      trackEvent('click_phone', { provider: 'phone' });
      return;
    }
    try {
      var url = new URL(href, window.location.href);
      var host = url.hostname.toLowerCase();
      if (host === 'maps.app.goo.gl' || host === 'goo.gl' ||
          (host.indexOf('google.') !== -1 && (url.pathname.toLowerCase().indexOf('/maps') !== -1 || url.searchParams.has('q') || url.searchParams.has('destination')))) {
        trackEvent('click_directions', { provider: 'google' });
      }
    } catch (error) {}
  });

  window.rrAnalytics = { trackEvent: trackEvent };
})();
