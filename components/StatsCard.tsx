interface StatsCardProps {
  title: string;
  value: string;
  icon?: string;
  trend?: string;
  color?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  color = "blue",
}: StatsCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    purple: "bg-purple-50 border-purple-200",
    orange: "bg-orange-50 border-orange-200",
  };

  return (
    <div
      className={`rounded-lg border-2 p-6 ${
        colorClasses[color as keyof typeof colorClasses] || colorClasses.blue
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          {trend && <p className="text-xs text-gray-500 mt-2">{trend}</p>}
        </div>
        {icon && <span className="text-3xl">{icon}</span>}
      </div>
    </div>
  );
}


