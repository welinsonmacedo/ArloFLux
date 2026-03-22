-- 01_core_and_auth.sql
-- Extension for UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SaaS Config
CREATE TABLE IF NOT EXISTS saas_config (
    id SERIAL PRIMARY KEY,
    global_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    period VARCHAR(20) DEFAULT 'MONTHLY',
    features JSONB DEFAULT '[]'::jsonb,
    limits JSONB DEFAULT '{}'::jsonb,
    is_popular BOOLEAN DEFAULT false,
    button_text VARCHAR(50) DEFAULT 'Assinar',
    allowed_modules JSONB DEFAULT '[]'::jsonb,
    allowed_features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants (Restaurants)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    owner_name VARCHAR(255),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    plan VARCHAR(50),
    business_info JSONB DEFAULT '{}'::jsonb,
    theme_config JSONB DEFAULT '{}'::jsonb,
    allowed_modules JSONB DEFAULT '["RESTAURANT"]'::jsonb,
    allowed_features JSONB DEFAULT '[]'::jsonb,
    custom_limits JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom Roles
CREATE TABLE IF NOT EXISTS custom_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    auth_user_id UUID,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    custom_role_id UUID REFERENCES custom_roles(id) ON DELETE SET NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    document_cpf VARCHAR(20),
    department VARCHAR(100),
    hr_job_role_id UUID,
    hire_date DATE,
    contract_type VARCHAR(50),
    work_model VARCHAR(50),
    base_salary DECIMAL(10, 2),
    benefits_total DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    shift_id UUID,
    allowed_routes JSONB DEFAULT '[]'::jsonb,
    dependents_count INTEGER DEFAULT 0,
    bank_hours_balance DECIMAL(10, 2) DEFAULT 0,
    registration_number VARCHAR(50),
    birth_date DATE,
    rg_number VARCHAR(50),
    rg_issuer VARCHAR(50),
    rg_state VARCHAR(2),
    address_zip VARCHAR(20),
    address_street VARCHAR(255),
    address_number VARCHAR(50),
    address_complement VARCHAR(255),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    pis_pasep VARCHAR(50),
    ctps_number VARCHAR(50),
    ctps_series VARCHAR(50),
    ctps_state VARCHAR(2),
    marital_status VARCHAR(50),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    fathers_name VARCHAR(255),
    mothers_name VARCHAR(255),
    education_level VARCHAR(100),
    voter_registration VARCHAR(50),
    bank_name VARCHAR(100),
    bank_agency VARCHAR(50),
    bank_account VARCHAR(50),
    bank_account_type VARCHAR(50),
    pix_key VARCHAR(255),
    health_plan_info JSONB,
    pension_info JSONB,
    transport_voucher_info JSONB,
    meal_voucher_info JSONB,
    sst_info JSONB,
    signed_contract_url TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID,
    user_name VARCHAR(255),
    module VARCHAR(100),
    action VARCHAR(255),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security Incidents
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID,
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    details TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
