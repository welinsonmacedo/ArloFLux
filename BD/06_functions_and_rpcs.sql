-- 06_functions_and_rpcs.sql

-- process_pos_sale
CREATE OR REPLACE FUNCTION process_pos_sale(
    p_tenant_id UUID,
    p_customer_name VARCHAR,
    p_method VARCHAR,
    p_items JSONB,
    p_cashier_name VARCHAR DEFAULT 'Sistema'
) RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_total_amount DECIMAL(10, 2) := 0;
    v_item JSONB;
    v_product_price DECIMAL(10, 2);
    v_product_cost DECIMAL(10, 2);
    v_product_name VARCHAR;
BEGIN
    -- Create order
    INSERT INTO orders (tenant_id, customer_name, status, is_paid, order_type)
    VALUES (p_tenant_id, p_customer_name, 'COMPLETED', true, 'PDV')
    RETURNING id INTO v_order_id;

    -- Process items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Get product details
        IF (v_item->>'type') = 'SIMPLE' THEN
            SELECT price, cost_price, name INTO v_product_price, v_product_cost, v_product_name
            FROM products WHERE id = (v_item->>'productId')::UUID;
        ELSE
            SELECT cost_price, name INTO v_product_cost, v_product_name
            FROM inventory_items WHERE id = (v_item->>'inventoryItemId')::UUID;
            v_product_price := v_product_cost; -- Or some logic for raw material price
        END IF;

        v_total_amount := v_total_amount + (v_product_price * (v_item->>'quantity')::DECIMAL);

        -- Insert order item
        INSERT INTO order_items (
            tenant_id, order_id, product_id, inventory_item_id,
            product_name, product_type, product_price, product_cost_price,
            quantity, notes, status
        ) VALUES (
            p_tenant_id, v_order_id, (v_item->>'productId')::UUID, (v_item->>'inventoryItemId')::UUID,
            v_product_name, v_item->>'type', v_product_price, v_product_cost,
            (v_item->>'quantity')::DECIMAL, v_item->>'notes', 'COMPLETED'
        );

        -- Update inventory (simplified)
        IF (v_item->>'inventoryItemId') IS NOT NULL THEN
            UPDATE inventory_items
            SET current_stock = current_stock - (v_item->>'quantity')::DECIMAL
            WHERE id = (v_item->>'inventoryItemId')::UUID;
        END IF;
    END LOOP;

    -- Update order total
    UPDATE orders SET total_amount = v_total_amount WHERE id = v_order_id;

    -- Process payment
    INSERT INTO pos_transactions (tenant_id, order_id, type, amount, method, cashier_name)
    VALUES (p_tenant_id, v_order_id, 'SALE', v_total_amount, p_method, p_cashier_name);

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- place_order
CREATE OR REPLACE FUNCTION place_order(
    p_tenant_id UUID,
    p_table_id UUID,
    p_order_type VARCHAR,
    p_delivery_info JSONB,
    p_items JSONB
) RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_total_amount DECIMAL(10, 2) := 0;
    v_item JSONB;
    v_product_price DECIMAL(10, 2);
    v_product_cost DECIMAL(10, 2);
    v_product_name VARCHAR;
BEGIN
    -- Create order
    INSERT INTO orders (tenant_id, table_id, order_type, delivery_info, status)
    VALUES (p_tenant_id, p_table_id, p_order_type, p_delivery_info, 'PENDING')
    RETURNING id INTO v_order_id;

    -- Process items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        IF (v_item->>'type') = 'SIMPLE' THEN
            SELECT price, cost_price, name INTO v_product_price, v_product_cost, v_product_name
            FROM products WHERE id = (v_item->>'productId')::UUID;
        ELSE
            SELECT cost_price, name INTO v_product_cost, v_product_name
            FROM inventory_items WHERE id = (v_item->>'inventoryItemId')::UUID;
            v_product_price := v_product_cost;
        END IF;

        v_total_amount := v_total_amount + (v_product_price * (v_item->>'quantity')::DECIMAL);

        INSERT INTO order_items (
            tenant_id, order_id, product_id, inventory_item_id,
            product_name, product_type, product_price, product_cost_price,
            quantity, notes, status
        ) VALUES (
            p_tenant_id, v_order_id, (v_item->>'productId')::UUID, (v_item->>'inventoryItemId')::UUID,
            v_product_name, v_item->>'type', v_product_price, v_product_cost,
            (v_item->>'quantity')::DECIMAL, v_item->>'notes', 'PENDING'
        );
    END LOOP;

    -- Update order total
    UPDATE orders SET total_amount = v_total_amount WHERE id = v_order_id;

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- process_payment
CREATE OR REPLACE FUNCTION process_payment(
    p_tenant_id UUID,
    p_table_id UUID,
    p_amount DECIMAL,
    p_method VARCHAR,
    p_cashier_name VARCHAR,
    p_order_id UUID DEFAULT NULL,
    p_specific_order_ids UUID[] DEFAULT NULL,
    p_courier_info JSONB DEFAULT NULL
) RETURNS JSONB AS $$
BEGIN
    -- Insert transaction
    INSERT INTO pos_transactions (tenant_id, order_id, type, amount, method, cashier_name)
    VALUES (p_tenant_id, p_order_id, 'PAYMENT', p_amount, p_method, p_cashier_name);

    -- Update order status
    IF p_order_id IS NOT NULL THEN
        UPDATE orders SET is_paid = true, status = 'COMPLETED' WHERE id = p_order_id;
    ELSIF p_table_id IS NOT NULL THEN
        UPDATE orders SET is_paid = true, status = 'COMPLETED' WHERE table_id = p_table_id AND is_paid = false;
        UPDATE restaurant_tables SET status = 'AVAILABLE', customer_name = NULL, access_code = NULL WHERE id = p_table_id;
    END IF;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- open_table
CREATE OR REPLACE FUNCTION open_table(
    p_tenant_id UUID,
    p_table_id UUID,
    p_customer_name VARCHAR,
    p_access_code VARCHAR,
    p_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
BEGIN
    UPDATE restaurant_tables
    SET status = 'OCCUPIED', customer_name = p_customer_name, access_code = p_access_code
    WHERE id = p_table_id AND tenant_id = p_tenant_id;
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- close_table
CREATE OR REPLACE FUNCTION close_table(
    p_tenant_id UUID,
    p_table_id UUID
) RETURNS JSONB AS $$
BEGIN
    UPDATE restaurant_tables
    SET status = 'AVAILABLE', customer_name = NULL, access_code = NULL
    WHERE id = p_table_id AND tenant_id = p_tenant_id;
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- add_table
CREATE OR REPLACE FUNCTION add_table(
    p_tenant_id UUID,
    p_max_tables INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_current_count INTEGER;
    v_next_number INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_current_count FROM restaurant_tables WHERE tenant_id = p_tenant_id;
    IF v_current_count >= p_max_tables THEN
        RETURN jsonb_build_object('success', false, 'message', 'Limite de mesas atingido.');
    END IF;

    SELECT COALESCE(MAX(number), 0) + 1 INTO v_next_number FROM restaurant_tables WHERE tenant_id = p_tenant_id;

    INSERT INTO restaurant_tables (tenant_id, number) VALUES (p_tenant_id, v_next_number);
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- assign_table
CREATE OR REPLACE FUNCTION assign_table(
    p_tenant_id UUID,
    p_table_id UUID,
    p_waiter_id UUID
) RETURNS JSONB AS $$
BEGIN
    -- Logic to assign table to waiter (e.g., updating staff allowed_routes or a specific table_assignments table)
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- dispatch_order
CREATE OR REPLACE FUNCTION dispatch_order(
    p_tenant_id UUID,
    p_order_id UUID,
    p_courier_info JSONB
) RETURNS JSONB AS $$
BEGIN
    UPDATE orders
    SET status = 'DISPATCHED', delivery_info = jsonb_set(COALESCE(delivery_info, '{}'::jsonb), '{courier}', p_courier_info)
    WHERE id = p_order_id AND tenant_id = p_tenant_id;
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- cancel_order
CREATE OR REPLACE FUNCTION cancel_order(
    p_order_id UUID
) RETURNS JSONB AS $$
BEGIN
    UPDATE orders SET status = 'CANCELLED' WHERE id = p_order_id;
    UPDATE order_items SET status = 'CANCELLED' WHERE order_id = p_order_id;
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- add_staff
CREATE OR REPLACE FUNCTION add_staff(
    p_tenant_id UUID,
    p_max_staff INTEGER,
    p_staff JSONB
) RETURNS JSONB AS $$
DECLARE
    v_current_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_current_count FROM staff WHERE tenant_id = p_tenant_id;
    IF v_current_count >= p_max_staff THEN
        RETURN jsonb_build_object('success', false, 'message', 'Limite de funcionários atingido.');
    END IF;

    INSERT INTO staff (
        tenant_id, name, role, custom_role_id, email, phone, document_cpf,
        department, hr_job_role_id, hire_date, contract_type, work_model,
        base_salary, benefits_total, status, shift_id, allowed_routes,
        dependents_count, registration_number, birth_date, rg_number,
        rg_issuer, rg_state, address_zip, address_street, address_number,
        address_complement, address_neighborhood, address_city, address_state,
        pis_pasep, ctps_number, ctps_series, ctps_state, marital_status,
        emergency_contact_name, emergency_contact_phone, fathers_name,
        mothers_name, education_level, voter_registration, bank_name,
        bank_agency, bank_account, bank_account_type, pix_key,
        health_plan_info, pension_info, transport_voucher_info,
        meal_voucher_info, sst_info, created_by
    ) VALUES (
        p_tenant_id, p_staff->>'name', p_staff->>'role', (p_staff->>'custom_role_id')::UUID,
        p_staff->>'email', p_staff->>'phone', p_staff->>'document_cpf',
        p_staff->>'department', (p_staff->>'hr_job_role_id')::UUID, (p_staff->>'hire_date')::DATE,
        p_staff->>'contract_type', p_staff->>'work_model', (p_staff->>'base_salary')::DECIMAL,
        (p_staff->>'benefits_total')::DECIMAL, p_staff->>'status', (p_staff->>'shift_id')::UUID,
        p_staff->'allowed_routes', (p_staff->>'dependents_count')::INTEGER,
        p_staff->>'registration_number', (p_staff->>'birth_date')::DATE, p_staff->>'rg_number',
        p_staff->>'rg_issuer', p_staff->>'rg_state', p_staff->>'address_zip',
        p_staff->>'address_street', p_staff->>'address_number', p_staff->>'address_complement',
        p_staff->>'address_neighborhood', p_staff->>'address_city', p_staff->>'address_state',
        p_staff->>'pis_pasep', p_staff->>'ctps_number', p_staff->>'ctps_series',
        p_staff->>'ctps_state', p_staff->>'marital_status', p_staff->>'emergency_contact_name',
        p_staff->>'emergency_contact_phone', p_staff->>'fathers_name', p_staff->>'mothers_name',
        p_staff->>'education_level', p_staff->>'voter_registration', p_staff->>'bank_name',
        p_staff->>'bank_agency', p_staff->>'bank_account', p_staff->>'bank_account_type',
        p_staff->>'pix_key', p_staff->'health_plan_info', p_staff->'pension_info',
        p_staff->'transport_voucher_info', p_staff->'meal_voucher_info', p_staff->'sst_info',
        (p_staff->>'created_by')::UUID
    );

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Other HR RPCs (stubs for brevity, can be expanded based on exact logic)
CREATE OR REPLACE FUNCTION calculate_thirteenth(p_staff_id UUID, p_year INTEGER, p_installment INTEGER) RETURNS JSONB AS $$ BEGIN RETURN '{}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION calculate_vacation(p_staff_id UUID, p_start_date DATE, p_days INTEGER, p_sold_days INTEGER) RETURNS JSONB AS $$ BEGIN RETURN '{}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION calculate_termination(p_staff_id UUID, p_date DATE, p_reason VARCHAR, p_notice_type VARCHAR) RETURNS JSONB AS $$ BEGIN RETURN '{}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION get_payroll_preview(p_month INTEGER, p_year INTEGER) RETURNS JSONB AS $$ BEGIN RETURN '{"payroll": [], "is_closed": false}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION close_payroll(p_tenant_id UUID, p_month INTEGER, p_year INTEGER, p_closed_by VARCHAR, p_items JSONB, p_integrate_salaries BOOLEAN, p_integrate_taxes BOOLEAN) RETURNS JSONB AS $$ BEGIN RETURN '{"success": true}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION reopen_payroll(p_tenant_id UUID, p_month INTEGER, p_year INTEGER) RETURNS JSONB AS $$ BEGIN RETURN '{"success": true}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION register_time_entry(p_staff_id UUID, p_type VARCHAR, p_justification TEXT, p_lat DECIMAL, p_lng DECIMAL) RETURNS JSONB AS $$ BEGIN RETURN '{"success": true}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION save_payroll_settings(p_tenant_id UUID, p_settings JSONB) RETURNS JSONB AS $$ BEGIN RETURN '{"success": true}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION save_inss_brackets(p_tenant_id UUID, p_brackets JSONB) RETURNS JSONB AS $$ BEGIN RETURN '{"success": true}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION save_irrf_brackets(p_tenant_id UUID, p_brackets JSONB) RETURNS JSONB AS $$ BEGIN RETURN '{"success": true}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION add_staff_warning(p_tenant_id UUID, p_staff_id UUID, p_type VARCHAR, p_content TEXT, p_created_by UUID) RETURNS JSONB AS $$ BEGIN RETURN '{"success": true}'::jsonb; END; $$ LANGUAGE plpgsql;

-- SaaS Admin RPCs (stubs)
CREATE OR REPLACE FUNCTION create_tenant_by_saas_admin(p_name VARCHAR, p_slug VARCHAR, p_owner_name VARCHAR, p_email VARCHAR, p_plan VARCHAR, p_theme_config JSONB, p_allowed_modules JSONB) RETURNS JSONB AS $$ BEGIN RETURN '{"success": true, "tenant_id": "00000000-0000-0000-0000-000000000000"}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION update_tenant_by_saas_admin(p_admin_id UUID, p_tenant_id UUID, p_name VARCHAR, p_slug VARCHAR, p_owner_name VARCHAR, p_email VARCHAR, p_plan VARCHAR, p_allowed_modules JSONB, p_allowed_features JSONB, p_theme_config JSONB) RETURNS JSONB AS $$ BEGIN RETURN '{"success": true}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION update_tenant_modules_by_saas_admin(p_tenant_id UUID, p_modules JSONB, p_features JSONB) RETURNS JSONB AS $$ BEGIN RETURN '{"success": true}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION update_tenant_limits_by_saas_admin(p_tenant_id UUID, p_limits JSONB) RETURNS JSONB AS $$ BEGIN RETURN '{"success": true}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION create_tenant_admin_by_saas_admin(p_tenant_id UUID, p_name VARCHAR, p_email VARCHAR, p_pin VARCHAR, p_auth_user_id UUID) RETURNS JSONB AS $$ BEGIN RETURN '{"success": true}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION update_admin_profile_by_saas_admin(p_admin_id UUID, p_name VARCHAR, p_email VARCHAR) RETURNS JSONB AS $$ BEGIN RETURN '{"success": true}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION update_global_settings_by_saas_admin(p_settings JSONB) RETURNS JSONB AS $$ BEGIN RETURN '{"success": true}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION update_plan_details_by_saas_admin(p_plan_id UUID, p_key VARCHAR, p_name VARCHAR, p_price DECIMAL, p_features JSONB, p_limits JSONB, p_button_text VARCHAR) RETURNS JSONB AS $$ BEGIN RETURN '{"success": true}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION create_plan_by_saas_admin(p_key VARCHAR, p_name VARCHAR, p_price DECIMAL, p_period VARCHAR, p_features JSONB, p_limits JSONB, p_button_text VARCHAR, p_is_popular BOOLEAN) RETURNS JSONB AS $$ BEGIN RETURN '{"success": true}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION delete_plan_by_saas_admin(p_plan_id UUID) RETURNS JSONB AS $$ BEGIN RETURN '{"success": true}'::jsonb; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION toggle_tenant_status_by_saas_admin(p_tenant_id UUID) RETURNS JSONB AS $$ BEGIN RETURN '{"success": true}'::jsonb; END; $$ LANGUAGE plpgsql;
