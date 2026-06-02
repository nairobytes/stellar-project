import { SupplierDashboard } from './SupplierDashboard'
import { InvestorDashboard } from './InvestorDashboard'
import { BuyerDashboard } from './BuyerDashboard'

import type { TabType } from './Header'

export function DashboardTabs({ activeTab }: { activeTab: TabType }) {

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_20px_60px_rgba(11,31,58,0.08)] backdrop-blur">
        {activeTab === 'supplier' && <SupplierDashboard />}
        {activeTab === 'investor' && <InvestorDashboard />}
        {activeTab === 'buyer' && <BuyerDashboard />}
      </div>
    </div>
  )
}
