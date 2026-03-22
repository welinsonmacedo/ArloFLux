export const resolveTenantFromUrl = (): string | null => {
  const path = window.location.pathname;

  // 1️⃣ Path based tenant
  const pathParts = path.split('/');

  if (pathParts[1] === 'r' && pathParts[2]) {
    return pathParts[2];
  }

  if (pathParts[1] === 'admin' && pathParts[2]) {
    return pathParts[2];
  }

  // 2️⃣ URL param
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('restaurant');

  if (tenantParam && tenantParam !== 'null' && tenantParam !== 'undefined') {
    sessionStorage.setItem('fluxeat_tenant_slug', tenantParam);
    return tenantParam;
  }

  // 3️⃣ Subdomain
  let host = window.location.hostname;

  if (host.startsWith('www.')) {
    host = host.replace('www.', '');
  }

  const parts = host.split('.');

  /**
   * Casos possíveis:
   * 
   * localhost
   * restaurant.localhost
   * restaurant-udi.vercel.app
   * restaurant.app.com
   */

  if (host === 'localhost' || host === '127.0.0.1') {
    return null;
  }

  // Ex: restaurant-udi.vercel.app
  if (parts.length >= 3) {
    const subdomain = parts[0];

    if (subdomain !== 'www' && subdomain !== 'api') {
      sessionStorage.setItem('fluxeat_tenant_slug', subdomain);
      return subdomain;
    }
  }

  // 4️⃣ fallback
  const saasRoutes = ['/sys-admin', '/dashboard', '/register'];

  if (path === '/' || saasRoutes.some(route => path.startsWith(route))) {
    sessionStorage.removeItem('fluxeat_tenant_slug');
    return null;
  }

  const storedSlug = sessionStorage.getItem('fluxeat_tenant_slug');

  if (storedSlug && storedSlug !== 'null' && storedSlug !== 'undefined') {
    return storedSlug;
  }

  return null;
};

export const getTenantSlug = resolveTenantFromUrl;