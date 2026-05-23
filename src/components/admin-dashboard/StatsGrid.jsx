import React from 'react';
import StatCard from './StatCard';
import './AdminNeonGlow.css';

const StatsGrid = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={`stats-skeleton-${index}`}
            className="admin-dashboard-skeleton h-[110px] w-full animate-pulse rounded-[1rem] sm:h-[148px]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
};

export default StatsGrid;
