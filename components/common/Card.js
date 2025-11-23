export default function Card({ title, children, footer, className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {title && (
        <div className="bg-blue-300 px-4 py-3 border-b">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>
      )}
      
      <div className="p-4">
        {children}
      </div>
      
      {footer && (
        <div className="bg-gray-50 px-4 py-3 border-t">
          {footer}
        </div>
      )}
    </div>
  );
}