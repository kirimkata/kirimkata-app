'use client';

/**
 * Guest Search Component - Placeholder for FASE R3
 * 
 * This will be implemented in FASE R3 with real-time search
 * For now, this is just a placeholder component
 */

import { Input } from '../ui';

interface GuestSearchProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function GuestSearch({ onSearch, isLoading }: GuestSearchProps) {
  return (
    <div className="w-full">
      <Input
        type="search"
        placeholder="Search guests by name, phone, or email..."
        onChange={(e) => onSearch(e.target.value)}
        disabled={isLoading}
        className="w-full"
      />
      <p className="text-xs text-gray-500 mt-2">
        Full implementation in FASE R3
      </p>
    </div>
  );
}
