-- 07_triggers_and_edges.sql

-- Generic function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at

-- Core & Auth
CREATE TRIGGER update_saas_config_updated_at BEFORE UPDATE ON saas_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_roles_updated_at BEFORE UPDATE ON custom_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- HR
CREATE TRIGGER update_rh_shifts_updated_at BEFORE UPDATE ON rh_shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_time_entries_updated_at BEFORE UPDATE ON rh_time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_job_roles_updated_at BEFORE UPDATE ON rh_job_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_payroll_settings_updated_at BEFORE UPDATE ON rh_payroll_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_taxes_updated_at BEFORE UPDATE ON rh_taxes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_benefits_updated_at BEFORE UPDATE ON rh_benefits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_inss_brackets_updated_at BEFORE UPDATE ON rh_inss_brackets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_irrf_brackets_updated_at BEFORE UPDATE ON rh_irrf_brackets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_event_types_updated_at BEFORE UPDATE ON rh_event_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_payroll_events_updated_at BEFORE UPDATE ON rh_payroll_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_recurring_events_updated_at BEFORE UPDATE ON rh_recurring_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_contract_templates_updated_at BEFORE UPDATE ON rh_contract_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_thirteenth_payments_updated_at BEFORE UPDATE ON rh_thirteenth_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_vacations_updated_at BEFORE UPDATE ON rh_vacations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_vacation_schedules_updated_at BEFORE UPDATE ON rh_vacation_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_terminations_updated_at BEFORE UPDATE ON rh_terminations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_staff_warnings_updated_at BEFORE UPDATE ON rh_staff_warnings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_payroll_entries_updated_at BEFORE UPDATE ON rh_payroll_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_closed_payrolls_updated_at BEFORE UPDATE ON rh_closed_payrolls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inventory & Menu
CREATE TRIGGER update_inventory_categories_updated_at BEFORE UPDATE ON inventory_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_extras_updated_at BEFORE UPDATE ON product_extras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_ingredients_updated_at BEFORE UPDATE ON product_ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_items_updated_at BEFORE UPDATE ON purchase_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Orders & POS
CREATE TRIGGER update_restaurant_tables_updated_at BEFORE UPDATE ON restaurant_tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_calls_updated_at BEFORE UPDATE ON service_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_sessions_updated_at BEFORE UPDATE ON pos_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Finance
CREATE TRIGGER update_transaction_categories_updated_at BEFORE UPDATE ON transaction_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cash_registers_updated_at BEFORE UPDATE ON cash_registers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle inventory updates on purchase
CREATE OR REPLACE FUNCTION update_inventory_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
        -- Update stock for each item in the purchase
        UPDATE inventory_items ii
        SET current_stock = ii.current_stock + pi.quantity,
            cost_price = pi.unit_price -- Update cost price (could be weighted average)
        FROM purchase_items pi
        WHERE pi.purchase_id = NEW.id AND ii.id = pi.inventory_item_id;
        
        -- Create inventory transactions
        INSERT INTO inventory_transactions (tenant_id, item_id, type, quantity, unit_cost, total_cost, reason, reference_id)
        SELECT NEW.tenant_id, pi.inventory_item_id, 'IN', pi.quantity, pi.unit_price, pi.total_price, 'Compra', NEW.id
        FROM purchase_items pi
        WHERE pi.purchase_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_on_purchase
AFTER UPDATE ON purchases
FOR EACH ROW
EXECUTE FUNCTION update_inventory_on_purchase();
