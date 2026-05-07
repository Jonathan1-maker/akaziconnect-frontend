'use client';
import { useState } from 'react';

export default function StarRating({ value, onChange, readOnly = false }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          className={`text-2xl ${star <= display ? 'text-yellow-400' : 'text-gray-300'} ${!readOnly ? 'cursor-pointer' : 'cursor-default'}`}
        >★</button>
      ))}
    </div>
  );
}
