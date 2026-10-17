import React from 'react';
import { Order, Product } from '../../types';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Users,
  Wallet,
  Calendar,
  Clock,
  ArrowUpRight,
  Flame,
} from 'lucide-react';

interface FinanceDashboardProps {
  orders: Order[];
  products: Product[];
  selectedLocationId: string;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  orders,
  products,
  selectedLocationId,
}) => {
  // Filter orders by location
  const locationOrders = orders.filter((o) => o.locationId === selectedLocationId);

  // Delivered and paid orders
  const deliveredOrders = locationOrders.filter((o) => o.status === 'entregado');
  const validOrders = locationOrders.filter((o) => o.status !== 'cancelado');

  const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const avgTicket = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

  // Payment Breakdown
  const campusPayRevenue = validOrders
    .filter((o) => o.paymentMethod === 'campus_wallet')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const counterCashRevenue = validOrders
    .filter((o) => o.paymentMethod === 'mostrador_efectivo')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const campusPayPercentage =
    totalRevenue > 0 ? Math.round((campusPayRevenue / totalRevenue) * 100) : 0;

  // Top products sales
  const productSalesCount: Record<string, { name: string; quantity: number; revenue: number }> = {};
  validOrders.forEach((o) => {
    o.items.forEach((item) => {
      if (!productSalesCount[item.name]) {
        productSalesCount[item.name] = { name: item.name, quantity: 0, revenue: 0 };
      }
      productSalesCount[item.name].quantity += item.quantity;
      productSalesCount[item.name].revenue += item.price * item.quantity;
    });
  });

  const sortedTopProducts = Object.values(productSalesCount)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Ingresos Totales</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ${totalRevenue.toLocaleString('es-CO')}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs semana anterior
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pedidos Procesados</span>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{validOrders.length}</div>
          <p className="text-[11px] text-slate-500">
            {deliveredOrders.length} entregados exitosamente
          </p>
        </div>

        {/* Avg Ticket */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Ticket Promedio</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ${avgTicket.toLocaleString('es-CO')}
          </div>
          <p className="text-[11px] text-slate-500">Por comanda estudiantil</p>
        </div>

        {/* CampusPay Adoption */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Adopción CampusPay</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{campusPayPercentage}%</div>
          <p className="text-[11px] text-purple-700 font-medium">Pagos 1-click sin filas en caja</p>
        </div>
      </div>

      {/* Payment Split & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Distribución de Métodos de Pago
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-orange-600" /> Billetera Digital CampusPay
                </span>
                <span>
                  ${campusPayRevenue.toLocaleString('es-CO')} ({campusPayPercentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-orange-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${campusPayPercentage}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                <span>💵 Efectivo en Mostrador</span>
                <span>
                  ${counterCashRevenue.toLocaleString('es-CO')} ({100 - campusPayPercentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-slate-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${100 - campusPayPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-orange-50 rounded-xl border border-orange-200/60 text-xs text-orange-900">
            💡 <strong>Insight operativo:</strong> Los pedidos pagados con CampusPay se despachan 2.4
            veces más rápido en el mostrador al no requerir cambio ni datáfono.
          </div>
        </div>

        {/* Top 5 Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-600" /> Platos Más Populares en el Campus
          </h3>

          <div className="space-y-2.5 divide-y divide-slate-100">
            {sortedTopProducts.map((prod, idx) => (
              <div key={idx} className="pt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-100 font-bold text-slate-600 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-800">{prod.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900">{prod.quantity} unidades</span>
                  <span className="text-[10px] text-slate-400 block">
                    ${prod.revenue.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
