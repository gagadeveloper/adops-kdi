export default function StatusBadge({ status, className = '' }) {
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case 'masuk':
      case 'terbayar':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'belum terbayar':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'progress':
      case 'proses':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
      case 'gagal':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles()} ${className}`}>
      {status}
    </span>
  );
}