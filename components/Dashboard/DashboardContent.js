import { useState, useEffect } from 'react';
import DashboardCard from './DashboardCard';
import TrackingSamplesCard from './TrackingSamplesCard';

export default function DashboardContent({ userRole }) {
  console.log('Role yang diterima oleh DashboardContent:', userRole, typeof userRole);
  const [dashboardData, setDashboardData] = useState({
    rs1: { today: 0, monthly: 0 },
    rs2: { today: 0, monthly: 0 },
    piHantaran: { today: 0, monthly: 0, revenue: 0 },
    piShipment: { today: 0, monthly: 0, revenue: 0 },
    tracking: {
      today: 0,
      weekly: 0,
      monthly: 0,
      preparation: 0,
      analysis: 0,
      roa: 0,
      coa: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('Memulai fetch data dashboard...');
        setApiStatus({});
        
        // Helper function to handle API responses
        const handleApiResponse = async (promise, apiName) => {
          try {
            const res = await promise;
            if (!res.ok) {
              console.warn(`API ${apiName} merespons dengan status ${res.status}`);
              setApiStatus(prev => ({ ...prev, [apiName]: { status: res.status, ok: false } }));
              return [];
            }
            
            const data = await res.json();
            setApiStatus(prev => ({ ...prev, [apiName]: { status: res.status, ok: true } }));
            return Array.isArray(data) ? data : [];
          } catch (err) {
            console.error(`Error dengan API ${apiName}:`, err);
            setApiStatus(prev => ({ ...prev, [apiName]: { status: 'error', ok: false, message: err.message } }));
            return [];
          }
        };
        
        // Fetch data untuk semua card secara paralel
        const [ordersData, samplesData, piHantaranData, piShipmentData, trackingData] = await Promise.all([
          handleApiResponse(fetch('/api/orders'), 'orders'),
          handleApiResponse(fetch('/api/samples'), 'samples'),
          handleApiResponse(fetch('/api/pi_hantaran'), 'pi_hantaran'),
          handleApiResponse(fetch('/api/pi_shipment'), 'pi_shipment'),
          handleApiResponse(fetch('/api/tracking-samples'), 'tracking_samples')
        ]);
        
        console.log('Status API:', apiStatus);
        console.log('Data berhasil di-fetch. Memproses data...');

        // Process data for dashboard
        const processedData = processDataForDashboard(
          ordersData, 
          samplesData, 
          piHantaranData, 
          piShipmentData, 
          trackingData
        );
        
        console.log('Data berhasil diproses. Mengupdate state...');
        setDashboardData(processedData);
        setLoading(false);
      } catch (error) {
        console.error('Error dalam fetchDashboardData:', error);
        setError('Terjadi kesalahan saat memuat data dashboard. Silakan refresh halaman.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Function untuk memproses data mentah menjadi format dashboard
  const processDataForDashboard = (orders, samples, piHantaran, piShipment, tracking) => {
    try {
      console.log('Memproses data dashboard...');
      console.log('Data yang diterima:', {
        orders: Array.isArray(orders) ? orders.length : 'Invalid data',
        samples: Array.isArray(samples) ? samples.length : 'Invalid data',
        piHantaran: Array.isArray(piHantaran) ? piHantaran.length : 'Invalid data',
        piShipment: Array.isArray(piShipment) ? piShipment.length : 'Invalid data',
        tracking: Array.isArray(tracking) ? tracking.length : 'Invalid data'
      });
      
      // Pastikan data berbentuk array
      const safeOrders = Array.isArray(orders) ? orders : [];
      const safeSamples = Array.isArray(samples) ? samples : [];
      const safePiHantaran = Array.isArray(piHantaran) ? piHantaran : [];
      const safePiShipment = Array.isArray(piShipment) ? piShipment : [];
      const safeTracking = Array.isArray(tracking) ? tracking : [];
      
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      
      // Format tanggal untuk perbandingan
      today.setHours(0, 0, 0, 0);
      
      // Process orders (RS1)
      const rs1Today = safeOrders.filter(order => 
        new Date(order.created_at).toDateString() === today.toDateString()
      ).length;
      
      const rs1Monthly = safeOrders.filter(order => 
        new Date(order.created_at) >= firstDayOfMonth
      ).length;
      
      // Process samples (RS2)
      const rs2Today = safeSamples.filter(sample => 
        new Date(sample.created_at).toDateString() === today.toDateString()
      ).length;
      
      const rs2Monthly = safeSamples.filter(sample => 
        new Date(sample.created_at) >= firstDayOfMonth
      ).length;
      
      // Process PI Hantaran
      const piHantaranToday = safePiHantaran.filter(pi => 
        new Date(pi.created_at || pi.date).toDateString() === today.toDateString()
      ).length;
      
      const piHantaranMonthly = safePiHantaran.filter(pi => 
        new Date(pi.created_at || pi.date) >= firstDayOfMonth
      ).length;
      
      const piHantaranRevenue = safePiHantaran
        .filter(pi => new Date(pi.created_at || pi.date) >= firstDayOfMonth)
        .reduce((total, pi) => total + Number(pi.total || 0), 0);
      
      // Process PI Shipment
      const piShipmentToday = safePiShipment.filter(pi => 
        new Date(pi.created_at || pi.date).toDateString() === today.toDateString()
      ).length;
      
      const piShipmentMonthly = safePiShipment.filter(pi => 
        new Date(pi.created_at || pi.date) >= firstDayOfMonth
      ).length;
      
      const piShipmentRevenue = safePiShipment
        .filter(pi => new Date(pi.created_at || pi.date) >= firstDayOfMonth)
        .reduce((total, pi) => total + Number(pi.total || 0), 0);
      
      // Process Tracking Samples
      const trackingToday = safeTracking.filter(track => 
        new Date(track.created_at).toDateString() === today.toDateString()
      ).length;
      
      const trackingWeekly = safeTracking.filter(track => 
        new Date(track.created_at) >= lastWeek
      ).length;
      
      const trackingMonthly = safeTracking.filter(track => 
        new Date(track.created_at) >= firstDayOfMonth
      ).length;
      
      const preparationCount = safeTracking.filter(track => 
        track.preparation_status === 'ongoing' || track.preparation_status === 'completed'
      ).length;
      
      const analysisCount = safeTracking.filter(track => 
        track.analysis_status === 'ongoing' || track.analysis_status === 'completed'
      ).length;
      
      const roaCount = safeTracking.filter(track => 
        track.roa_status === 'created' || track.roa_status === 'issued'
      ).length;
      
      const coaCount = safeTracking.filter(track => 
        track.coa_review_status === 'approved' || track.coa_document_url !== null
      ).length;
      
      console.log('Data berhasil diproses');
      
      return {
        rs1: { today: rs1Today, monthly: rs1Monthly },
        rs2: { today: rs2Today, monthly: rs2Monthly },
        piHantaran: { 
          today: piHantaranToday, 
          monthly: piHantaranMonthly, 
          revenue: piHantaranRevenue 
        },
        piShipment: { 
          today: piShipmentToday, 
          monthly: piShipmentMonthly, 
          revenue: piShipmentRevenue 
        },
        tracking: {
          today: trackingToday,
          weekly: trackingWeekly,
          monthly: trackingMonthly,
          preparation: preparationCount,
          analysis: analysisCount,
          roa: roaCount,
          coa: coaCount
        }
      };
    } catch (error) {
      console.error('Error dalam processDataForDashboard:', error);
      // Return default data jika terjadi error
      return {
        rs1: { today: 0, monthly: 0 },
        rs2: { today: 0, monthly: 0 },
        piHantaran: { today: 0, monthly: 0, revenue: 0 },
        piShipment: { today: 0, monthly: 0, revenue: 0 },
        tracking: {
          today: 0, weekly: 0, monthly: 0,
          preparation: 0, analysis: 0, roa: 0, coa: 0
        }
      };
    }
  };

  // Menentukan card mana yang ditampilkan berdasarkan role
  const getCardsForRole = (roleId) => {
    // Pastikan roleId adalah string untuk digunakan dalam perbandingan switch case
    const roleIdStr = typeof roleId === 'string' ? roleId : String(roleId);
    
    console.log('Menampilkan dashboard untuk role:', roleIdStr);
    
    switch (roleIdStr) {
      case '17':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DashboardCard 
              title="RS1 Form" 
              stats={[
                { label: "Submit Today", value: dashboardData.rs1.today },
                { label: "Submit Monthly", value: dashboardData.rs1.monthly }
              ]}
              color="bg-blue-100"
              icon="clipboard-list"
            />
            <DashboardCard 
              title="RS2 Form" 
              stats={[
                { label: "Submit Today", value: dashboardData.rs2.today },
                { label: "Submit Monthly", value: dashboardData.rs2.monthly }
              ]}
              color="bg-green-100"
              icon="clipboard-check"
            />
            <DashboardCard 
              title="PI Shipment" 
              stats={[
                { label: "Submit PI Today", value: dashboardData.piHantaran.today },
                { label: "Submit PI Monthly", value: dashboardData.piHantaran.monthly },
                { label: "Revenue Monthly", value: `Rp ${dashboardData.piHantaran.revenue.toLocaleString('id-ID')}` }
              ]}
              color="bg-gray-100"
              icon="clipboard-check"
            />
            <DashboardCard 
              title="PI Shipment" 
              stats={[
                { label: "Submit PI Today", value: dashboardData.piShipment.today },
                { label: "Submit PI Monthly", value: dashboardData.piShipment.monthly },
                { label: "Revenue Monthly", value: `Rp ${dashboardData.piShipment.revenue.toLocaleString('id-ID')}` }
              ]}
              color="bg-purple-100"
              icon="clipboard-check"
            />
            <div className="md:col-span-2 lg:col-span-3">
              <TrackingSamplesCard data={dashboardData.tracking} />
            </div>
          </div>
        );
        
      case '1':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DashboardCard 
              title="RS1 Form" 
              stats={[
                { label: "Submit Today", value: dashboardData.rs1.today },
                { label: "Submit Monthly", value: dashboardData.rs1.monthly }
              ]}
              color="bg-blue-100"
              icon="clipboard-list"
            />
            <DashboardCard 
              title="RS2 Form" 
              stats={[
                { label: "Submit Today", value: dashboardData.rs2.today },
                { label: "Submit Monthly", value: dashboardData.rs2.monthly }
              ]}
              color="bg-green-100"
              icon="clipboard-check"
            />
            <div className="md:col-span-2 lg:col-span-3">
              <TrackingSamplesCard data={dashboardData.tracking} />
            </div>
          </div>
        );
        
      case '5':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DashboardCard 
              title="RS1 Form" 
              stats={[
                { label: "Submit Today", value: dashboardData.rs1.today },
                { label: "Submit Monthly", value: dashboardData.rs1.monthly }
              ]}
              color="bg-blue-100"
              icon="clipboard-list"
            />
            <DashboardCard 
              title="RS2 Form" 
              stats={[
                { label: "Submit Today", value: dashboardData.rs2.today },
                { label: "Submit Monthly", value: dashboardData.rs2.monthly }
              ]}
              color="bg-green-100"
              icon="clipboard-check"
            />
            <DashboardCard 
              title="PI Hantaran" 
              stats={[
                { label: "Submit PI Today", value: dashboardData.piHantaran.today },
                { label: "Submit PI Monthly", value: dashboardData.piHantaran.monthly },
                { label: "Revenue Monthly", value: `Rp ${dashboardData.piHantaran.revenue.toLocaleString('id-ID')}` }
              ]}
              color="bg-orange-100"
              icon="file-invoice"
            />
            <DashboardCard 
              title="PI Shipment" 
              stats={[
                { label: "Submit PI Today", value: dashboardData.piShipment.today },
                { label: "Submit PI Monthly", value: dashboardData.piShipment.monthly },
                { label: "Revenue Monthly", value: `Rp ${dashboardData.piShipment.revenue.toLocaleString('id-ID')}` }
              ]}
              color="bg-purple-100"
              icon="ship"
            />
            <div className="md:col-span-2 lg:col-span-3">
              <TrackingSamplesCard data={dashboardData.tracking} />
            </div>
          </div>
        );
        
      case '4':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DashboardCard 
              title="RS1 Form" 
              stats={[
                { label: "Submit Today", value: dashboardData.rs1.today },
                { label: "Submit Monthly", value: dashboardData.rs1.monthly }
              ]}
              color="bg-blue-100"
              icon="clipboard-list"
            />
            <DashboardCard 
              title="RS2 Form" 
              stats={[
                { label: "Submit Today", value: dashboardData.rs2.today },
                { label: "Submit Monthly", value: dashboardData.rs2.monthly }
              ]}
              color="bg-green-100"
              icon="clipboard-check"
            />
            <DashboardCard 
              title="PI Hantaran" 
              stats={[
                { label: "Submit PI Today", value: dashboardData.piHantaran.today },
                { label: "Submit PI Monthly", value: dashboardData.piHantaran.monthly },
                { label: "Revenue Monthly", value: `Rp ${dashboardData.piHantaran.revenue.toLocaleString('id-ID')}` }
              ]}
              color="bg-orange-100"
              icon="file-invoice"
            />
            <DashboardCard 
              title="PI Shipment" 
              stats={[
                { label: "Submit PI Today", value: dashboardData.piShipment.today },
                { label: "Submit PI Monthly", value: dashboardData.piShipment.monthly },
                { label: "Revenue Monthly", value: `Rp ${dashboardData.piShipment.revenue.toLocaleString('id-ID')}` }
              ]}
              color="bg-purple-100"
              icon="ship"
            />
            <div className="md:col-span-2 lg:col-span-3">
              <TrackingSamplesCard data={dashboardData.tracking} />
            </div>
          </div>
        );
        
      default:
        console.log('Role tidak dikenali:', roleIdStr);
        return (
          <div className="p-4 bg-yellow-100 rounded-lg">
            <p>Tidak ada data dashboard yang tersedia untuk role Anda.</p>
            <p>Silakan hubungi administrator untuk mendapatkan akses.</p>
            <p className="text-gray-500 mt-2">Role ID: {roleIdStr}</p>
            {Object.keys(apiStatus).length > 0 && (
              <div className="mt-4 p-3 bg-white rounded shadow">
                <p className="font-semibold">Status API:</p>
                <ul className="mt-2 text-sm">
                  {Object.entries(apiStatus).map(([api, status]) => (
                    <li key={api} className={status.ok ? "text-green-600" : "text-red-600"}>
                      {api}: {status.status} {status.message ? `(${status.message})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return <div className="text-center p-10">Memuat data dashboard...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        <p>{error}</p>
        {Object.keys(apiStatus).length > 0 && (
          <div className="mt-4 p-3 bg-white rounded shadow">
            <p className="font-semibold">Status API:</p>
            <ul className="mt-2 text-sm">
              {Object.entries(apiStatus).map(([api, status]) => (
                <li key={api} className={status.ok ? "text-green-600" : "text-red-600"}>
                  {api}: {status.status} {status.message ? `(${status.message})` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {getCardsForRole(userRole)}
    </div>
  );
}