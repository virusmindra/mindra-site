'use client';

import {useState} from 'react';

type Props = {
  defaultPercent?: number; // 0 | 35 | 40
  onChange: (percent: number) => void;
  label: string;      // t('donate.founders.toggle')
  badge35: string;    // t('donate.founders.badge35')
  badge40: string;    // t('donate.founders.badge40')
};

export default function FoundersToggle({defaultPercent = 0, onChange, label, badge35, badge40}: Props) {
  const [enabled, setEnabled] = useState(defaultPercent > 0);
  const [percent, setPercent] = useState(defaultPercent);

  const badge = percent === 40 ? badge40 : percent === 35 ? badge35 : '';

  return (
    <div className="mt-6 flex items-center gap-3">
      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={enabled}
          onChange={(e) => {
            const v = e.target.checked;
            setEnabled(v);
            const p = v ? (percent || 35) : 0;
            onChange(p);
          }}
        />
        <span className="h-6 w-11 rounded-full bg-white/20 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white transition-all peer-checked:after:translate-x-5 peer-checked:bg-white/40" />
        <span className="opacity-90">{label}</span>
      </label>

      {enabled && badge && (
        <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs opacity-90">
          {badge}
        </span>
      )}

      {/* быстрые кнопки выбора 35/40, если надо переключить */}
      {enabled && (
        <div className="flex items-center gap-1">
          <button
            className={`text-xs rounded-md px-2 py-1 border ${percent===35 ? 'border-white/60' : 'border-white/20'} opacity-90`}
            onClick={() => { setPercent(35); onChange(35); }}
            type="button"
          >-35%</button>
          <button
            className={`text-xs rounded-md px-2 py-1 border ${percent===40 ? 'border-white/60' : 'border-white/20'} opacity-90`}
            onClick={() => { setPercent(40); onChange(40); }}
            type="button"
          >-40%</button>
        </div>
      )}
    </div>
  );
}
