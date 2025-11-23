import { ReactNode } from 'react';

export interface TimelineItem {
  title: string;
  description?: string;
  timestamp?: string;
  icon?: ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
}

export const Timeline = ({ items }: TimelineProps) => {
  return (
    <div className="relative pl-6">
      <div className="absolute top-0 left-2 bottom-0 w-px bg-gray-200" />
      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="relative flex gap-4">
            <div className="w-8 flex justify-center">
              <div className={`w-4 h-4 rounded-full border-2 bg-white ${index === 0 ? 'border-blue-600' : 'border-gray-300'}`} />
            </div>
            <div>
              <div className="font-semibold text-gray-900">{item.title}</div>
              {item.description && <div className="text-sm text-gray-600 mb-1">{item.description}</div>}
              {item.timestamp && <div className="text-xs text-gray-400">{item.timestamp}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
