export const resolveTenantFromUrl = (): string | null => {
  const path = window.location.pathname;
  
  // 1. Path based tenant (e.g., /r/meu-restaurante or /admin/meu-restaurante)
  const pathParts = path.split('/');
  if (pathParts[1] === 'r' && pathParts[2]) {
    return pathParts[2];
  }
  if (pathParts[1] === 'admin' && pathParts[2]) {
    return pathParts[2];
  }

  // 2. URL param based tenant (e.g., ?restaurant=meu-restaurante)
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('restaurant');
  
  if (tenantParam && tenantParam !== 'null' && tenantParam !== 'undefined') {
      sessionStorage.setItem('fluxeat_tenant_slug', tenantParam);
      return tenantParam;
  }

  // 3. Subdomain based tenant (e.g., restaurant1.app.com)
  let host = window.location.hostname;
  if (host.startsWith('www.')) {
      host = host.substring(4);
  }

  // Define system domains that shouldn't be treated as subdomains
  const systemDomains = [
    'localhost', 
    '127.0.0.1', 
    'vercel.app', 
    'run.app', 
    'web.app', 
    'firebaseapp.com',
    'netlify.app',
    'github.io',
    'app.com',
    'vercel.app'
    
    // Added app.com as a base domain for subdomains
  ];

  // Check if it's a known system domain without a subdomain
  if (systemDomains.includes(host)) {
      // It's just the base domain, no subdomain
  } else {
    // Try to extract subdomain
    const parts = host.split('.');
    // If it's something like restaurant1.app.com, parts[0] is restaurant1
    // We need to ensure it's not just a base domain (e.g. app.com)
    if (parts.length >= 3 || (parts.length === 2 && !systemDomains.includes(host))) {
      // It's a subdomain
      const subdomain = parts[0];
      // Avoid treating 'www' or 'api' as tenant subdomains if they slipped through
      if (subdomain !== 'www' && subdomain !== 'api') {
        return subdomain;
      }
    }
  }

  // 4. Fallback to session storage
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


