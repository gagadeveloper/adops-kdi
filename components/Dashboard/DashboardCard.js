import { 
  ClipboardList, 
  ClipboardCheck, 
  FileText, 
  Ship, 
  Activity 
} from 'lucide-react';

export default function DashboardCard({ title, stats, color = "bg-gray-100", icon }) {
  // Function to render the appropriate icon
  const renderIcon = () => {
    switch (icon) {
      case 'clipboard-list':
        return <ClipboardList size={20} />;
      case 'clipboard-check':
        return <ClipboardCheck size={20} />;
      case 'file-invoice':
        return <FileText size={20} />;
      case 'ship':
        return <Ship size={20} />;
      case 'activity':
        return <Activity size={20} />;
      default:
        return <Activity size={20} />;
    }
  };

  return (
    <div className={`${color} p-4 rounded-lg shadow`}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold flex items-center">
          <span className="mr-2">{renderIcon()}</span>
          {title}
        </h2>
      </div>
      
      <div className="space-y-2">
        {stats.map((stat, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-gray-600">{stat.label}</span>
            <span className="font-medium">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}