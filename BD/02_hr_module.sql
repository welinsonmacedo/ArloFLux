-- 02_hr_module.sql

-- Shifts
CREATE TABLE IF NOT EXISTS rh_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INTEGER DEFAULT 60,
    tolerance_minutes INTEGER DEFAULT 10,
    night_shift BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time Entries
CREATE TABLE IF NOT EXISTS rh_time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    clock_in TIMESTAMPTZ,
    break_start TIMESTAMPTZ,
    break_end TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    justification TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    entry_type VARCHAR(50) DEFAULT 'SYSTEM',
    original_entry_id UUID,
    correction_reason TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Roles
CREATE TABLE IF NOT EXISTS rh_job_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    cbo_code VARCHAR(20),
    description TEXT,
    base_salary DECIMAL(10, 2),
    custom_role_id UUID REFERENCES custom_roles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Settings
CREATE TABLE IF NOT EXISTS rh_payroll_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    min_wage DECIMAL(10, 2),
    inss_ceiling DECIMAL(10, 2),
    irrf_dependent_deduction DECIMAL(10, 2),
    fgts_rate DECIMAL(5, 2),
    valid_from DATE,
    valid_until DATE,
    vacation_days_entitlement INTEGER DEFAULT 30,
    vacation_sold_days_limit INTEGER DEFAULT 10,
    thirteenth_min_months_worked INTEGER DEFAULT 1,
    notice_period_days INTEGER DEFAULT 30,
    notice_period_days_per_year INTEGER DEFAULT 3,
    notice_period_max_days INTEGER DEFAULT 90,
    fgts_fine_percent DECIMAL(5, 2) DEFAULT 40,
    standard_monthly_hours INTEGER DEFAULT 220,
    time_tracking_method VARCHAR(50) DEFAULT 'PHYSICAL',
    overtime_policy VARCHAR(50) DEFAULT 'PAID_OVERTIME',
    deduct_delays_from_overtime BOOLEAN DEFAULT false,
    point_closing_day INTEGER DEFAULT 30,
    absence_logic JSONB DEFAULT '{"justified": {"deduction": false, "disciplinaryAction": false}, "unjustified": {"deduction": true, "disciplinaryAction": true}}'::jsonb,
    dsr_config JSONB DEFAULT '{"calculateOnOvertime": true, "rateType": "CALCULATED", "includeInThirteenth": true, "includeInVacation": true}'::jsonb,
    integrate_finance BOOLEAN DEFAULT true,
    time_clock JSONB DEFAULT '{"validationType": "NONE", "maxDailyPunches": 4}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Taxes
CREATE TABLE IF NOT EXISTS rh_taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    payer_type VARCHAR(50) DEFAULT 'EMPLOYEE',
    calculation_basis VARCHAR(50) DEFAULT 'GROSS_TOTAL',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Benefits
CREATE TABLE IF NOT EXISTS rh_benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INSS Brackets
CREATE TABLE IF NOT EXISTS rh_inss_brackets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    min_value DECIMAL(10, 2) NOT NULL,
    max_value DECIMAL(10, 2),
    rate DECIMAL(5, 2) NOT NULL,
    valid_from DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- IRRF Brackets
CREATE TABLE IF NOT EXISTS rh_irrf_brackets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    min_value DECIMAL(10, 2) NOT NULL,
    max_value DECIMAL(10, 2),
    rate DECIMAL(5, 2) NOT NULL,
    deduction DECIMAL(10, 2) NOT NULL,
    valid_from DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Types
CREATE TABLE IF NOT EXISTS rh_event_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    calculation_type VARCHAR(50) DEFAULT 'FIXED',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Events
CREATE TABLE IF NOT EXISTS rh_payroll_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    type UUID REFERENCES rh_event_types(id) ON DELETE SET NULL,
    description TEXT,
    value DECIMAL(10, 2) NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring Events
CREATE TABLE IF NOT EXISTS rh_recurring_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    type UUID REFERENCES rh_event_types(id) ON DELETE SET NULL,
    description TEXT,
    value DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract Templates
CREATE TABLE IF NOT EXISTS rh_contract_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'CONTRACT',
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thirteenth Payments
CREATE TABLE IF NOT EXISTS rh_thirteenth_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    installment INTEGER NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    reference_salary DECIMAL(10, 2),
    months_worked INTEGER,
    inss_value DECIMAL(10, 2),
    irrf_value DECIMAL(10, 2),
    fgts_value DECIMAL(10, 2),
    net_value DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'PENDING',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vacations
CREATE TABLE IF NOT EXISTS rh_vacations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    acquisition_start DATE NOT NULL,
    acquisition_end DATE NOT NULL,
    concessive_limit DATE NOT NULL,
    days_vested INTEGER DEFAULT 0,
    days_taken INTEGER DEFAULT 0,
    days_sold INTEGER DEFAULT 0,
    days_balance INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vacation Schedules
CREATE TABLE IF NOT EXISTS rh_vacation_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vacation_id UUID REFERENCES rh_vacations(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER NOT NULL,
    sold_days INTEGER DEFAULT 0,
    base_value DECIMAL(10, 2),
    one_third_value DECIMAL(10, 2),
    sold_value DECIMAL(10, 2),
    sold_one_third_value DECIMAL(10, 2),
    inss_value DECIMAL(10, 2),
    irrf_value DECIMAL(10, 2),
    total_gross DECIMAL(10, 2),
    total_net DECIMAL(10, 2),
    payment_date DATE,
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Terminations
CREATE TABLE IF NOT EXISTS rh_terminations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    termination_date DATE NOT NULL,
    reason VARCHAR(100) NOT NULL,
    notice_period_type VARCHAR(50),
    notice_days INTEGER,
    balance_salary DECIMAL(10, 2),
    notice_value DECIMAL(10, 2),
    vacation_proportional_value DECIMAL(10, 2),
    vacation_expired_value DECIMAL(10, 2),
    thirteenth_proportional_value DECIMAL(10, 2),
    fgts_fine_value DECIMAL(10, 2),
    discounts_value DECIMAL(10, 2),
    total_value DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Warnings
CREATE TABLE IF NOT EXISTS rh_staff_warnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Entries
CREATE TABLE IF NOT EXISTS rh_payroll_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    month VARCHAR(10) NOT NULL,
    overtime_hours DECIMAL(10, 2) DEFAULT 0,
    missing_hours DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Closed Payrolls
CREATE TABLE IF NOT EXISTS rh_closed_payrolls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    total_net DECIMAL(10, 2) NOT NULL,
    employee_count INTEGER NOT NULL,
    closed_at TIMESTAMPTZ DEFAULT NOW(),
    closed_by VARCHAR(255),
    expense_id UUID,
    is_paid BOOLEAN DEFAULT false,
    esocial_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
