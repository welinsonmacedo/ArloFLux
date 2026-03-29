// src/core/services/payrollService.ts
import { supabase } from '@/core/api/supabaseClient';
import { 
    PayrollPreview, 
    RhPayrollSetting, 
    RhInssBracket, 
    RhIrrfBracket, 
    ClosedPayroll, 
    ThirteenthPayment, 
    VacationSchedule, 
    Termination 
} from '@/types';

class PayrollService {
    private async getSettings(tenantId: string): Promise<{ settings: RhPayrollSetting, inss: RhInssBracket[], irrf: RhIrrfBracket[] }> {
        const [settingsRes, inssRes, irrfRes] = await Promise.all([
            supabase.from('rh_payroll_settings').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
            supabase.from('rh_inss_brackets').select('*').eq('tenant_id', tenantId).order('min_value', { ascending: true }),
            supabase.from('rh_irrf_brackets').select('*').eq('tenant_id', tenantId).order('min_value', { ascending: true })
        ]);

        if (!settingsRes.data) {
            throw new Error("Tabelas Legais não configuradas. Vá a Configurações > Tabelas Legais e clique em 'Restaurar Padrão 2026'.");
        }

        return {
            settings: {
                ...settingsRes.data,
                minWage: Number(settingsRes.data.min_wage || 1412),
                inssCeiling: Number(settingsRes.data.inss_ceiling || 7786.02),
                irrfDependentDeduction: Number(settingsRes.data.irrf_dependent_deduction || 189.59),
                fgtsRate: Number(settingsRes.data.fgts_rate || 8),
                vacationDaysEntitlement: Number(settingsRes.data.vacation_days_entitlement || 30),
                vacationSoldDaysLimit: Number(settingsRes.data.vacation_sold_days_limit || 10),
                thirteenthMinMonthsWorked: Number(settingsRes.data.thirteenth_min_months_worked || 1),
                noticePeriodDays: Number(settingsRes.data.notice_period_days || 30),
                noticePeriodDaysPerYear: Number(settingsRes.data.notice_period_days_per_year || 3),
                noticePeriodMaxDays: Number(settingsRes.data.notice_period_max_days || 90),
                fgtsFinePercent: Number(settingsRes.data.fgts_fine_percent || 40),
                standardMonthlyHours: Number(settingsRes.data.standard_monthly_hours || 220),
                dsrConfig: settingsRes.data.dsr_config,
                timeTrackingMethod: settingsRes.data.time_tracking_method,
                overtimePolicy: settingsRes.data.overtime_policy,
                deductDelaysFromOvertime: settingsRes.data.deduct_delays_from_overtime
            },
            inss: (inssRes.data || []).map((b: any) => ({ ...b, minValue: Number(b.min_value), maxValue: b.max_value ? Number(b.max_value) : undefined, rate: Number(b.rate) })),
            irrf: (irrfRes.data || []).map((b: any) => ({ ...b, minValue: Number(b.min_value), maxValue: b.max_value ? Number(b.max_value) : undefined, rate: Number(b.rate), deduction: Number(b.deduction) }))
        };
    }

    public calculateINSS(baseValue: number, inssBrackets: RhInssBracket[], inssCeiling: number): number {
        if (baseValue <= 0 || !inssBrackets || inssBrackets.length === 0) return 0;
        let discount = 0;
        let valueToCalculate = Math.min(baseValue, inssCeiling);

        for (const bracket of inssBrackets) {
            if (valueToCalculate > bracket.minValue) {
                const range = Math.min(valueToCalculate, bracket.maxValue || Infinity) - bracket.minValue;
                discount += range * (bracket.rate / 100);
            }
        }
        return Number(discount.toFixed(2));
    }

    public calculateIRRF(baseValue: number, inssDiscount: number, dependentsCount: number, irrfBrackets: RhIrrfBracket[], dependentDeduction: number): number {
        if (!irrfBrackets || irrfBrackets.length === 0) return 0;
        const baseCalculo = baseValue - inssDiscount - ((dependentsCount || 0) * (dependentDeduction || 0));
        if (baseCalculo <= 0) return 0;

        let irrf = 0;
        for (const bracket of irrfBrackets) {
            if (baseCalculo >= bracket.minValue && (!bracket.maxValue || baseCalculo <= bracket.maxValue)) {
                irrf = (baseCalculo * (bracket.rate / 100)) - bracket.deduction;
                break;
            }
        }
        return Number(Math.max(0, irrf).toFixed(2));
    }

    public async getPayrollPreview(tenantId: string, month: number, year: number): Promise<{ payroll: PayrollPreview[], isClosed: boolean, closedInfo?: ClosedPayroll }> {
        const { settings, inss, irrf } = await this.getSettings(tenantId);
        
        const { data: closedData } = await supabase.from('rh_closed_payrolls').select('*').eq('tenant_id', tenantId).eq('month', month).eq('year', year).maybeSingle();
        if (closedData) {
            return {
                isClosed: true,
                closedInfo: {
                    id: closedData.id, month: closedData.month, year: closedData.year,
                    totalCost: Number(closedData.total_cost), totalNet: Number(closedData.total_net),
                    employeeCount: closedData.employee_count, closedAt: new Date(closedData.closed_at), closedBy: closedData.closed_by,
                    isPaid: closedData.is_paid, esocialSent: closedData.esocial_sent
                },
                payroll: [] 
            };
        }

        const [usersRes, hrRolesRes, eventsRes, payrollEntriesRes, typesRes] = await Promise.all([
            supabase.from('staff').select('*').eq('tenant_id', tenantId).neq('status', 'TERMINATED'),
            supabase.from('rh_job_roles').select('*').eq('tenant_id', tenantId),
            supabase.from('rh_payroll_events').select('*').eq('tenant_id', tenantId).eq('month', month).eq('year', year),
            supabase.from('rh_payroll_entries').select('*').eq('tenant_id', tenantId).eq('month', `${year}-${String(month + 1).padStart(2, '0')}`),
            supabase.from('rh_event_types').select('*').eq('tenant_id', tenantId)
        ]);

        const users = usersRes.data || [];
        const hrRoles = hrRolesRes.data || [];
        const events = eventsRes.data || [];
        const entries = payrollEntriesRes.data || [];
        const eventTypes = typesRes.data || [];

        const payroll: PayrollPreview[] = users.map(user => {
            const hrRole = hrRoles.find(r => r.id === user.hr_job_role_id);
            const baseSalary = hrRole ? Number(hrRole.base_salary) : (Number(user.base_salary) || settings.minWage);
            const dependents = user.dependents_count || 0;
            const entry = entries.find(e => e.staff_id === user.id);
            const userEvents = events.filter(e => e.staff_id === user.id);
            
            const standardHours = settings.standardMonthlyHours || 220;
            const hourValue = baseSalary / standardHours;
            
           let overtime50 = 0;
            let overtime100 = 0;
            let missingValue = 0;
            
            if (entry) {
                const finalOvertimeHours = Number(entry.overtime_hours || 0);
                const finalMissingHours = Number(entry.missing_hours || 0);
                
                overtime50 = finalOvertimeHours * (hourValue * 1.5); // Multiplica por 1.5 (50%)
                missingValue = finalMissingHours * hourValue;
            }

            let dsrValue = 0;
            if (settings.dsrConfig?.calculateOnOvertime && overtime50 > 0) {
                if (settings.dsrConfig.rateType === 'FIXED') {
                    dsrValue = overtime50 * 0.1666;
                } else {
                    dsrValue = overtime50 * (4 / 26);
                }
            }

            let variableAdditions = 0;
            let variableDeductions = 0;
            const eventBreakdown: { name: string; value: number; type: 'CREDIT' | 'DEBIT' }[] = [];

            if (dsrValue > 0) {
                variableAdditions += dsrValue;
                eventBreakdown.push({ name: 'DSR S/ Horas Extras', value: dsrValue, type: 'CREDIT' });
            }

            userEvents.forEach(ev => {
                const type = eventTypes.find(t => t.id === ev.type);
                const isDeduction = type ? type.operation === '-' : false;
                const value = Number(ev.value || 0);
                const desc = ev.description || type?.name || 'Evento';
                
                if (isDeduction) {
                    variableDeductions += value;
                    eventBreakdown.push({ name: desc, value, type: 'DEBIT' });
                } else {
                    variableAdditions += value;
                    eventBreakdown.push({ name: desc, value, type: 'CREDIT' });
                }
            });

            const grossTotal = baseSalary + overtime50 + overtime100 + variableAdditions;
            const calcBase = Math.max(0, grossTotal - missingValue);
            
            const inssValue = this.calculateINSS(calcBase, inss, settings.inssCeiling);
            const irrfValue = this.calculateIRRF(calcBase, inssValue, dependents, irrf, settings.irrfDependentDeduction);
            const fgtsValue = calcBase * (settings.fgtsRate / 100);

            const totalDiscounts = inssValue + irrfValue + missingValue + variableDeductions;
            const netTotal = Math.max(0, grossTotal - totalDiscounts);

            return {
                staffId: user.id, staffName: user.name, baseSalary, overtime50, overtime100, nightShiftAdd: 0,
                bankOfHoursBalance: Number(user.bank_hours_balance || 0), absencesTotal: missingValue, addictionals: 0,
                eventsValue: variableAdditions - dsrValue, benefits: Number(user.benefits_total || 0),
                grossTotal, discounts: totalDiscounts, advances: 0, netTotal,
                hoursWorked: standardHours - (Number(entry?.missing_hours || 0)), employerCharges: fgtsValue,
                totalCompanyCost: grossTotal + fgtsValue, inssValue, irrfValue, fgtsValue,
                taxBreakdown: [
                    { name: 'INSS', value: inssValue, type: 'EMPLOYEE' },
                    { name: 'IRRF', value: irrfValue, type: 'EMPLOYEE' },
                    { name: 'FGTS (Empresa)', value: fgtsValue, type: 'EMPLOYER' }
                ],
                benefitBreakdown: [], eventBreakdown
            };
        });

        return { payroll, isClosed: false };
    }

    public async calculateThirteenth(tenantId: string, staffId: string, year: number, installment: 1 | 2): Promise<ThirteenthPayment> {
        const { settings, inss, irrf } = await this.getSettings(tenantId);
        
        const { data: user } = await supabase.from('staff').select('*, rh_job_roles(base_salary)').eq('id', staffId).single();
        if (!user) throw new Error("Colaborador não encontrado.");

        const hireDate = new Date(user.hire_date);
        const baseSalary = Number(user.rh_job_roles?.base_salary) || Number(user.base_salary) || settings.minWage;

        let monthsWorked = 12;
        if (hireDate.getFullYear() === year) {
            monthsWorked = 12 - hireDate.getMonth();
            if (hireDate.getDate() > 15) monthsWorked--;
        }
        
        if (monthsWorked < (settings.thirteenthMinMonthsWorked || 1)) {
            throw new Error(`Colaborador não possui os ${settings.thirteenthMinMonthsWorked} meses mínimos trabalhados exigidos pela política da empresa.`);
        }

        const proportionalSalary = (baseSalary / 12) * monthsWorked;

        let inssValue = 0;
        let irrfValue = 0;
        let value = 0;

        if (installment === 1) {
            value = proportionalSalary / 2;
        } else {
            value = proportionalSalary;
            inssValue = this.calculateINSS(value, inss, settings.inssCeiling);
            irrfValue = this.calculateIRRF(value, inssValue, user.dependents_count || 0, irrf, settings.irrfDependentDeduction);
            value = value - (proportionalSalary / 2);
        }

        const fgtsValue = proportionalSalary * (settings.fgtsRate / 100);
        const netValue = value - inssValue - irrfValue;

        return {
            id: '', staffId, year, installment, referenceSalary: baseSalary,
            monthsWorked, value, inssValue, irrfValue, fgtsValue, netValue,
            status: 'PENDING', createdAt: new Date()
        };
    }

    public async calculateVacation(tenantId: string, staffId: string, startDate: Date, days: number, soldDays: number): Promise<VacationSchedule> {
        const { settings, inss, irrf } = await this.getSettings(tenantId);
        
        if (soldDays > (settings.vacationSoldDaysLimit || 10)) {
            throw new Error(`A política permite vender no máximo ${settings.vacationSoldDaysLimit} dias de férias.`);
        }
        if (days + soldDays > (settings.vacationDaysEntitlement || 30)) {
            throw new Error(`O colaborador tem direito a no máximo ${settings.vacationDaysEntitlement} dias no total.`);
        }

        const { data: user } = await supabase.from('staff').select('*, rh_job_roles(base_salary)').eq('id', staffId).single();
        if (!user) throw new Error("Colaborador não encontrado.");

        const baseSalary = Number(user.rh_job_roles?.base_salary) || Number(user.base_salary) || settings.minWage;
        const dailyRate = baseSalary / 30;

        const baseValue = dailyRate * days;
        const oneThirdValue = baseValue / 3;
        const totalVacationGross = baseValue + oneThirdValue;

        const soldValue = dailyRate * soldDays;
        const soldOneThirdValue = soldValue / 3;
        const totalSoldGross = soldValue + soldOneThirdValue;

        const inssValue = this.calculateINSS(totalVacationGross, inss, settings.inssCeiling);
        const irrfValue = this.calculateIRRF(totalVacationGross, inssValue, user.dependents_count || 0, irrf, settings.irrfDependentDeduction);

        const totalGross = totalVacationGross + totalSoldGross;
        const totalNet = totalGross - inssValue - irrfValue;

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (days - 1));

        return {
            id: '', vacationId: '', staffId,
            startDate, endDate, daysCount: days, soldDays,
            baseValue, oneThirdValue, soldValue, soldOneThirdValue,
            inssValue, irrfValue, totalGross, totalNet,
            status: 'SCHEDULED'
        };
    }

    public async calculateTermination(tenantId: string, staffId: string, date: Date, reason: string, noticeType: string): Promise<Termination> {
        const { settings } = await this.getSettings(tenantId);
        
        const { data: user } = await supabase.from('staff').select('*, rh_job_roles(base_salary)').eq('id', staffId).single();
        if (!user) throw new Error("Colaborador não encontrado.");

        const baseSalary = Number(user.rh_job_roles?.base_salary) || Number(user.base_salary) || settings.minWage;
        const hireDate = new Date(user.hire_date);
        
        const terminationDate = new Date(date);
        const daysInMonth = new Date(terminationDate.getFullYear(), terminationDate.getMonth() + 1, 0).getDate();
        const daysWorked = terminationDate.getDate();
        const balanceSalary = (baseSalary / daysInMonth) * daysWorked;

        let noticeValue = 0;
        let noticeDays = 0;
        if (noticeType === 'INDEMNIFIED' && (reason === 'DISMISSAL_NO_CAUSE' || reason === 'AGREEMENT')) {
            const yearsWorked = Math.floor((terminationDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
            noticeDays = (settings.noticePeriodDays || 30) + (yearsWorked * (settings.noticePeriodDaysPerYear || 3));
            if (noticeDays > (settings.noticePeriodMaxDays || 90)) noticeDays = settings.noticePeriodMaxDays || 90;
            
            noticeValue = (baseSalary / 30) * noticeDays;
        }

        let fgtsFineValue = 0;
        if (reason === 'DISMISSAL_NO_CAUSE') {
            const monthsWorkedTotal = Math.floor((terminationDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
            const estimatedTotalFgts = (baseSalary * (settings.fgtsRate / 100)) * monthsWorkedTotal;
            fgtsFineValue = estimatedTotalFgts * ((settings.fgtsFinePercent || 40) / 100);
        } else if (reason === 'AGREEMENT') {
            const monthsWorkedTotal = Math.floor((terminationDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
            const estimatedTotalFgts = (baseSalary * (settings.fgtsRate / 100)) * monthsWorkedTotal;
            fgtsFineValue = estimatedTotalFgts * 0.20;
        }

        const thirteenthProportionalValue = (baseSalary / 12) * (terminationDate.getMonth() + 1);
        const vacationProportionalValue = (baseSalary / 12) * (terminationDate.getMonth() + 1) * 1.3333; 

        const totalValue = balanceSalary + noticeValue + thirteenthProportionalValue + vacationProportionalValue + fgtsFineValue;

        return {
            id: '', staffId, terminationDate, reason: reason as any, noticePeriodType: noticeType as any, noticeDays,
            balanceSalary, noticeValue, vacationProportionalValue, vacationExpiredValue: 0,
            thirteenthProportionalValue, fgtsFineValue, discountsValue: 0, totalValue, status: 'DRAFT'
        };
    }
}

export const payrollService = new PayrollService();