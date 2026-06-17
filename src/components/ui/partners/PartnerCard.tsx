import type { Partner } from '@/lib/types/partner'

interface PartnerCardProps {
  partner: Partner
}

export function PartnerCard({ partner }: PartnerCardProps) {
  return (
    <div className='group border-separator bg-panel hover:border-gray-4 flex h-full min-h-[96px] flex-col items-center justify-center rounded-xl border p-3.5 transition-colors'>
      <p className='text-inverse group-hover:text-inverse text-center font-sans text-sm leading-tight transition-colors'>
        {partner.name}
      </p>
      {partner.projectCount > 0 && (
        <p className='text-gray-3 mt-1.5 font-mono text-[9px] tracking-[0.06em] uppercase'>
          {partner.projectCount}{' '}
          {partner.projectCount === 1 ? 'project' : 'projects'}
        </p>
      )}
    </div>
  )
}
