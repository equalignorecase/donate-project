import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  width = '100%',
  height = '16px',
  radius,
  className = '',
  style = {}
}: SkeletonProps) {
  const customStyle: React.CSSProperties = {
    width,
    height,
    borderRadius: radius !== undefined ? radius : undefined,
    ...style
  };

  return <span className={`admin-skeleton ${className}`} style={customStyle} aria-hidden="true" />;
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card" aria-hidden="true">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <Skeleton width="90px" height="14px" />
        <Skeleton width="36px" height="36px" radius="10px" />
      </div>
      <div style={{ marginBottom: '8px' }}>
        <Skeleton width="130px" height="28px" radius="6px" />
      </div>
      <Skeleton width="110px" height="12px" />
    </div>
  );
}

export function TableRowSkeleton({
  cols = [100, 130, 80, 200, 70, 60]
}: {
  cols?: (string | number)[];
}) {
  return (
    <tr aria-hidden="true">
      {cols.map((w, idx) => (
        <td key={idx}>
          <Skeleton width={typeof w === 'number' ? `${w}px` : w} height="16px" />
        </td>
      ))}
    </tr>
  );
}

export default Skeleton;
