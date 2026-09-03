import React, { useLayoutEffect, useState } from 'react';

interface FixedPopoverProps {
  anchorRef: React.RefObject<HTMLElement>;
  align?: 'left' | 'right' | 'center';
  className?: string;
  children: React.ReactNode;
}

/**
 * Renders its children in a `position: fixed` layer anchored to `anchorRef`'s
 * screen position, computed via getBoundingClientRect. Used instead of a plain
 * `absolute` dropdown so the popover isn't clipped by a scrollable ancestor
 * (e.g. <main className="overflow-y-auto">), which would otherwise cut it off
 * at the ancestor's visible edge regardless of z-index.
 */
export const FixedPopover: React.FC<FixedPopoverProps> = ({ anchorRef, align = 'right', className = '', children }) => {
  const [coords, setCoords] = useState<{ top: number; left?: number; right?: number; transform?: string } | null>(null);

  useLayoutEffect(() => {
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (align === 'right') {
        setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
      } else if (align === 'center') {
        setCoords({ top: rect.bottom + 4, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' });
      } else {
        setCoords({ top: rect.bottom + 4, left: rect.left });
      }
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorRef, align]);

  if (!coords) return null;

  return (
    <div
      style={{ position: 'fixed', top: coords.top, left: coords.left, right: coords.right, transform: coords.transform }}
      className={`z-50 animate-popIn ${className}`}
    >
      {children}
    </div>
  );
};
