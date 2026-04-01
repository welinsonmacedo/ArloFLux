import React from 'react';
import { formatCurrency } from '@/core/utils/currency';

export const DREReportPrint: React.FC<any> = ({ data, dateStart, dateEnd, businessInfo, theme, config }) => {
    const Row = ({ label, value, isTotal = false, isNegative = false }: any) => (
        <div className={`flex justify-between py-1 text-xs ${isTotal ? 'font-bold border-t border-black mt-1' : 'border-b border-gray-100'}`}>
            <span>{label}</span>
            <span>{isNegative && value > 0 ? '-' : ''} {formatCurrency(Math.abs(value))}</span>
        </div>
    );

    return (
        <div className="p-10 text-black bg-white min-h-screen font-sans">
            <div className="flex justify-between border-b-2 border-black pb-4 mb-6">
                <div>
                    <h1 className="text-xl font-black uppercase">{theme.restaurantName}</h1>
                    <p className="text-[10px]">{businessInfo.cnpj || 'CNPJ não informado'}</p>
                </div>
                <div className="text-right">
                    <h2 className="font-bold">DRE GERENCIAL</h2>
                    <p className="text-[10px]">Período: {dateStart} a {dateEnd}</p>
                    <p className="text-[10px] font-bold uppercase">{config.accountingMethod === 'CASH' ? 'Regime de Caixa' : 'Regime de Competência'}</p>
                </div>
            </div>

            <div className="space-y-4">
                <section>
                    <h3 className="text-[10px] font-bold bg-gray-100 p-1 mb-2">1. RECEITAS</h3>
                    <Row label="(+) Receita Bruta Total" value={data.grossRevenue} />
                    <Row label="(-) Impostos Fiscais" value={data.taxes} isNegative />
                    <Row label="(-) Taxas de Operadoras de Cartão" value={data.cardFees} isNegative />
                    <Row label="(=) RECEITA LÍQUIDA" value={data.netRevenue} isTotal />
                </section>

                <section>
                    <h3 className="text-[10px] font-bold bg-gray-100 p-1 mb-2">2. CUSTOS DE MERCADORIA (CMV)</h3>
                    <Row label="(-) Consumo de Insumos e Produtos" value={data.cmv} isNegative />
                    <Row label="(=) LUCRO BRUTO" value={data.grossProfit} isTotal />
                </section>

                <section>
                    <h3 className="text-[10px] font-bold bg-gray-100 p-1 mb-2">3. DESPESAS OPERACIONAIS</h3>
                    <Row label="(-) Pessoal e Encargos" value={data.expenses.personnel} isNegative />
                    <Row label="(-) Despesas Fixas (Aluguel/Utilidades)" value={data.expenses.fixed} isNegative />
                    <Row label="(-) Despesas Variáveis e Gerais" value={data.expenses.variable} isNegative />
                    <Row label="(=) EBITDA" value={data.ebitda} isTotal />
                </section>

                <section>
                    <h3 className="text-[10px] font-bold bg-gray-100 p-1 mb-2">4. RESULTADO LÍQUIDO</h3>
                    <Row label="(-) Despesas Financeiras e Bancárias" value={data.expenses.financial} isNegative />
                    <Row label="(=) LUCRO / PREJUÍZO LÍQUIDO DO PERÍODO" value={data.netIncome} isTotal />
                </section>
            </div>

            <div className="mt-20 flex justify-between gap-10">
                <div className="flex-1 border-t border-black text-center pt-2">
                    <p className="text-[10px] font-bold">RESPONSÁVEL FINANCEIRO</p>
                </div>
                <div className="flex-1 border-t border-black text-center pt-2">
                    <p className="text-[10px] font-bold">CONTABILIDADE / DIRETORIA</p>
                </div>
            </div>
        </div>
    );
};