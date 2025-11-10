import { cn } from '@/lib/utils'

interface RoleBadgeProps {
  role: string
  className?: string
}

const roleConfig = {
  TOUR: {
    label: 'Tour',
    color: 'bg-gray-100 text-gray-800',
    icon: '👁️'
  },
  MEMBER: {
    label: 'Member', 
    color: 'bg-blue-100 text-blue-800',
    icon: '🛡️'
  },
  VALIDATOR: {
    label: 'Validator',
    color: 'bg-purple-100 text-purple-800', 
    icon: '⚖️'
  },
  ADMIN: {
    label: 'Admin',
    color: 'bg-red-100 text-red-800',
    icon: '👑'
  }
}

export default function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.TOUR
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.color,
        className
      )}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}