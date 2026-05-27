import React, { useState } from 'react';
import { Service, ServicePackage } from '../types';
import { CheckCircle2, Clock, RotateCcw, Zap } from 'lucide-react';
import { formatCurrency } from '../utils/feeCalculator';

interface Props {
  service: Service;
  onSelectPackage: (pkg: ServicePackage) => void;
}

export const PackageSelector: React.FC<Props> = ({ service, onSelectPackage }) => {
  const [activeTier, setActiveTier] = useState<'basic' | 'standard' | 'premium'>('standard');

  // Generate default 3-tier packages from base service
  const packages: ServicePackage[] = service.packages || [
    {
      tier: 'basic',
      priceCents: service.priceCents,
      deliveryDays: service.deliveryDays + 2,
      revisions: 1,
      features: service.features.slice(0, 2)
    },
    {
      tier: 'standard',
      priceCents: Math.round(service.priceCents * 1.8),
      deliveryDays: service.deliveryDays,
      revisions: 3,
      features: service.features
    },
    {
      tier: 'premium',
      priceCents: Math.round(service.priceCents * 3),
      deliveryDays: Math.max(1, service.deliveryDays - 1),
      revisions: 999,
      features: [...service.features, 'Priority Support', 'Commercial License', 'Source Files']
    }
  ];

  const activePkg = packages.find(p => p.tier === activeTier) || packages[1];

  return (
    <div className="space-y-4">
      {/* Tier Tabs */}
      <div className="grid grid-cols-3 bg-slate-950 rounded-2xl p-1 border border-slate-800">
        {packages.map(pkg => (
          <button
            key={pkg.tier}
            onClick={() => setActiveTier(pkg.tier)}
            className={`py-2.5 rounded-xl text-xs font-extrabold uppercase transition-all ${
              activeTier === pkg.tier
                ? pkg.tier === 'premium'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : pkg.tier === 'standard'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {pkg.tier === 'premium' && '👑 '}
            {pkg.tier}
          </button>
        ))}
      </div>

      {/* Active Package Details */}
      <div className={`p-5 rounded-2xl border-2 ${
        activeTier === 'premium' 
          ? 'bg-gradient-to-br from-amber-900/20 via-slate-900 to-orange-900/20 border-amber-500/40' 
          : activeTier === 'standard'
          ? 'bg-gradient-to-br from-cyan-900/20 via-slate-900 to-slate-900 border-cyan-500/40'
          : 'bg-slate-900 border-slate-700'
      }`}>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-extrabold text-base text-white capitalize">{activePkg.tier} Package</h3>
          <span className={`text-2xl font-black ${activeTier === 'premium' ? 'text-amber-400' : activeTier === 'standard' ? 'text-cyan-400' : 'text-white'}`}>
            {formatCurrency(activePkg.priceCents)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span><strong>{activePkg.deliveryDays}</strong> day delivery</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span><strong>{activePkg.revisions >= 999 ? 'Unlimited' : activePkg.revisions}</strong> revisions</span>
          </div>
        </div>

        <ul className="space-y-2 mb-4">
          {activePkg.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => onSelectPackage(activePkg)}
          className={`w-full py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 ${
            activeTier === 'premium' 
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-xl shadow-amber-500/20' 
              : activeTier === 'standard'
              ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-xl shadow-cyan-500/20'
              : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Continue with {activePkg.tier.toUpperCase()} — {formatCurrency(activePkg.priceCents)}</span>
        </button>
      </div>
    </div>
  );
};
