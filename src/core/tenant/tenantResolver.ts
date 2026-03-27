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

  if (host === 'localhost' || host === '127.0.0.1') {
    // Para testes locais, não bloqueia a busca no session storage
  } else if (parts.length >= 3) {
    const subdomain = parts[0];

    if (subdomain !== 'www' && subdomain !== 'api') {
      sessionStorage.setItem('fluxeat_tenant_slug', subdomain);
      return subdomain;
    }
  }

  // 4️⃣ Fallback: Buscar da memória (SEM APAGAR A MEMÓRIA!)
  const storedSlug = sessionStorage.getItem('fluxeat_tenant_slug');

  if (storedSlug && storedSlug !== 'null' && storedSlug !== 'undefined') {
    return storedSlug;
  }

  return null;
};

export const getTenantSlug = resolveTenantFromUrl;