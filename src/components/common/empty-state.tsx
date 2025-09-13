import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="border-4 border-black p-6 mb-6">
        <Icon className="w-12 h-12" />
      </div>
      <h3 className="text-2xl font-bold uppercase mb-2">{title}</h3>
      <p className="text-sm font-mono text-gray-600 mb-6 max-w-md">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  );
}