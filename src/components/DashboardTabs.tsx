import { useState } from 'react'
import { SupplierDashboard } from './SupplierDashboard'
import { InvestorDashboard } from './InvestorDashboard'
import { BuyerDashboard } from './BuyerDashboard'

type TabType = 'supplier' | 'investor' | 'buyer'

export function DashboardTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('supplier')

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'supplier', label: 'Supplier', icon: '🏭' },
    { id: 'investor', label: 'Investor', icon: '💰' },
    { id: 'buyer', label: 'Buyer', icon: '🛒' },
  ]

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'supplier' && <SupplierDashboard />}
        {activeTab === 'investor' && <InvestorDashboard />}
        {activeTab === 'buyer' && <BuyerDashboard />}
      </div>
    </div>
  )
}
