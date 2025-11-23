'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { ChevronLeft, ChevronRight, ListFilter, ChevronDown } from 'lucide-react';

// Main Dashboard Component
export default function SampleProcessDashboard() {
  const [sampleProcesses, setSampleProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [selectedProcess, setSelectedProcess] = useState(null); // Added selectedProcess state

  // Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch orders (RS1) data
        const ordersResponse = await fetch('/api/orders');
        if (!ordersResponse.ok) {
          throw new Error('Failed to fetch orders data');
        }
        const ordersData = await ordersResponse.json();
        
        // Process the data
        const processedData = await Promise.all(ordersData.map(async (order) => {
          // For each order, check if there's a related RS2 data
          let rs2Data = null;
          try {
            const rs2Response = await fetch(`/api/orders2?sample_order_no=${encodeURIComponent(order.sample_order_no)}`);
            if (rs2Response.ok) {
              const rs2Result = await rs2Response.json();
              if (rs2Result && rs2Result.length > 0) {
                const matchingRS2 = rs2Result.find(rs2 => rs2.sample_order_no === order.sample_order_no);
                if (matchingRS2) {
                  rs2Data = matchingRS2;
                }
              }
            }
          } catch (err) {
            console.error(`Error fetching RS2 data for ${order.sample_order_no}:`, err);
          }
          
          // Get samples for this order
          let samples = [];
          let samples2 = [];
          try {
            const samplesResponse = await fetch(`/api/samples?orderId=${order.id}`);
            if (samplesResponse.ok) {
              samples = await samplesResponse.json();
            }
            
            if (rs2Data) {
              const samples2Response = await fetch(`/api/samples2?orderId=${rs2Data.id}`);
              if (samples2Response.ok) {
                samples2 = await samples2Response.json();
              }
            }
          } catch (err) {
            console.error('Error fetching samples data:', err);
          }
          
          // Get payment status from pi_hantaran API
          let paymentStatus = 'Belum Terbayar';
          let piSubmitted = false;
          let paymentDetails = null;
          let clientOrderNo = null;
          
          try {
            // Fetch all PI Hantaran data
            const piResponse = await fetch('/api/pi_hantaran');
            if (piResponse.ok) {
              const piData = await piResponse.json();
              // Find PI related to this order by matching sample_order_no
              const matchingPI = piData.find(pi => pi.sample_order_no === order.sample_order_no);
              
              if (matchingPI) {
                piSubmitted = true;
                paymentDetails = matchingPI;
                
                // Check payment status from PI data
                if (matchingPI.status === 'Paid') {
                  paymentStatus = 'Terbayar';
                }
                
                // Check if client_order_no exists
                clientOrderNo = order.client_order_no;
              }
            }
          } catch (err) {
            console.error('Error fetching PI Hantaran data:', err);
          }
          
          // Logic to determine if RS2 can be completed based on payments
          const rs2CanBeCompleted = paymentStatus === 'Terbayar'; 
          
          // Determine sample processing status based on the workflow with corrected logic
          let sampleStatus;
          
          if (rs2Data && rs2CanBeCompleted) {
            sampleStatus = 'Processing'; // If RS2 exists AND payment received, sample is in processing
          } else if (paymentStatus === 'Terbayar') {
            sampleStatus = 'Paid'; // Payment received but RS2 not yet completed
          } else if (piSubmitted) {
            sampleStatus = 'Submitted - Unpaid'; // PI submitted but not paid yet
          } else {
            sampleStatus = 'Received'; // Only RS1 submitted, status is Received
          }
          
          // Determine current step based on data availability and status with proper sequence
          let currentStep = 0; // Start at RS1 Input
          
          if (rs2Data && rs2CanBeCompleted) {
            currentStep = 3; // RS2 is submitted AND payment received
          } else if (paymentStatus === 'Terbayar') {
            currentStep = 2; // Payment received but RS2 not yet
          } else if (piSubmitted) {
            currentStep = 1; // PI created but not paid
          } else {
            currentStep = 0; // Only at RS1 step
          }
          
          // Calculate total amount
          const totalAmount = paymentDetails ? 
            paymentDetails.total : 
            samples.reduce((sum, sample) => sum + (sample.price || 0), 0) || order.total_amount || 0;
          
          // Added timeline for each process
          const timeline = [
            {
              id: 'rs1',
              title: 'RS1 Input',
              status: 'Completed',
              date: new Date(order.created_at).toISOString().split('T')[0]
            },
            {
              id: 'pi',
              title: 'Proforma Invoice',
              status: piSubmitted ? 'Completed' : 'Pending',
              date: piSubmitted && paymentDetails ? 
                (paymentDetails.created_at ? new Date(paymentDetails.created_at).toISOString().split('T')[0] : '-') : '-'
            },
            {
              id: 'payment',
              title: 'Payment Received',
              status: paymentStatus === 'Terbayar' ? 'Completed' : 'Pending',
              date: paymentStatus === 'Terbayar' && paymentDetails ? 
                (paymentDetails.payment_date ? new Date(paymentDetails.payment_date).toISOString().split('T')[0] : '-') : '-'
            },
            {
              id: 'rs2',
              title: 'RS2 Input',
              status: (rs2Data && rs2CanBeCompleted) ? 'Completed' : 'Pending',
              date: (rs2Data && rs2CanBeCompleted) ? 
                (rs2Data.created_at ? new Date(rs2Data.created_at).toISOString().split('T')[0] : '-') : '-'
            },
            {
              id: 'processing',
              title: 'Sample Processing',
              status: (rs2Data && rs2CanBeCompleted) ? 'In Progress' : 'Pending',
              date: (rs2Data && rs2CanBeCompleted) ? 
                (rs2Data.received_date ? new Date(rs2Data.received_date).toISOString().split('T')[0] : '-') : '-'
            }
          ];
          
          // Create the steps for the visual flow
          const steps = [
            {
              id: 'rs1',
              title: 'RS1 Input',
              icon: 'clipboard-edit',
              status: 'Completed', // RS1 is always completed if we have the order
              color: 'blue',
              details: {
                sample_order_no: order.sample_order_no || '-',
                sender: order.sender || '-',
                date: new Date(order.created_at).toISOString().split('T')[0],
                total_qty: order.total_qty || 0,
                pic: order.pic || '-',
                pic_phone: order.pic_phone || '-',
                link: `/dashboard/adopsi/rs1/${order.id}`
              }
            },
            {
              id: 'pi',
              title: 'Proforma Invoice',
              icon: 'file-text',
              status: piSubmitted 
                ? (paymentStatus === 'Terbayar' ? 'Terbayar' : 'Submitted') 
                : 'Pending',
              color: piSubmitted ? (paymentStatus === 'Terbayar' ? 'green' : 'yellow') : 'gray',
              details: paymentDetails ? {
                invoice_no: paymentDetails.invoice_no || '-',
                amount: (paymentDetails.amount || 0).toLocaleString(),
                ppn: (paymentDetails.ppn || 0).toLocaleString(),
                total: (paymentDetails.total || 0).toLocaleString(),
                link: `/dashboard/adopsi/pi_hantaran/${paymentDetails.id}`
              } : {
                status: 'Belum ada invoice'
              }
            },
            {
              id: 'payment',
              title: 'Payment Received',
              icon: 'credit-card',
              status: paymentStatus === 'Terbayar' ? 'Completed' : 'Waiting',
              color: paymentStatus === 'Terbayar' ? 'green' : 'gray',
              details: paymentStatus === 'Terbayar' ? {
                status: 'Pembayaran Diterima',
                total: (paymentDetails?.total || 0).toLocaleString(),
                clientOrderNo: clientOrderNo
              } : {
                status: 'Menunggu Pembayaran'
              }
            },
            {
              id: 'rs2',
              title: 'RS2 Input',
              icon: 'clipboard-check',
              status: (rs2Data && rs2Data.sample_order_no === order.sample_order_no && paymentStatus === 'Terbayar') ? 'Completed' : 
                     (paymentStatus === 'Terbayar' ? 'Pending' : 'Waiting for Payment'),
              color: (rs2Data && rs2Data.sample_order_no === order.sample_order_no && paymentStatus === 'Terbayar') ? 'purple' : 
                     (paymentStatus === 'Terbayar' ? 'yellow' : 'gray'),
              details: (rs2Data && rs2Data.sample_order_no === order.sample_order_no && paymentStatus === 'Terbayar') ? {
                sample_order_no: rs2Data.sample_order_no || '-',
                pic_received: rs2Data.pic_received || rs2Data.pic || '-',
                received_date: rs2Data.received_date ? new Date(rs2Data.received_date).toISOString().split('T')[0] : 
                  (rs2Data.created_at ? new Date(rs2Data.created_at).toISOString().split('T')[0] : '-'),
                samples_count: samples2.length > 0 ? samples2.length : '0',
                link: `/dashboard/adopsi/rs2/${rs2Data.id}`
              } : {
                status: paymentStatus === 'Terbayar' ? 'Menunggu Input RS2' : 'Menunggu Pembayaran',
                warning: (rs2Data && rs2Data.sample_order_no === order.sample_order_no && paymentStatus !== 'Terbayar')
                  ? 'Data RS2 terdeteksi tetapi belum dapat diproses karena menunggu pembayaran'
                  : null
              }
            },
            {
              id: 'processing',
              title: 'Sample Proses',
              icon: 'flask-conical',
              status: (rs2Data && rs2Data.sample_order_no === order.sample_order_no && paymentStatus === 'Terbayar') ? 'In Progress' : 'Waiting for RS2',
              color: (rs2Data && rs2Data.sample_order_no === order.sample_order_no && paymentStatus === 'Terbayar') ? 'purple' : 'gray',
              details: (rs2Data && rs2Data.sample_order_no === order.sample_order_no && paymentStatus === 'Terbayar') ? {
                status: 'Preparation & Analysis',
                started_date: rs2Data.received_date ? 
                  new Date(rs2Data.received_date).toISOString().split('T')[0] : 
                  (rs2Data.created_at ? new Date(rs2Data.created_at).toISOString().split('T')[0] : '-'),
                samples_in_process: samples2.length > 0 ? samples2.length : '0',
                pic_lab: rs2Data.pic_lab || rs2Data.pic || '-',
                link: `/samples/tracking/${order.id}`
              } : {
                status: paymentStatus === 'Terbayar' ? 'Menunggu proses RS2 selesai' : 'Menunggu pembayaran'
              }
            }
          ];
          
          return {
            id: order.id,
            sample_order_no: order.sample_order_no || `Order-${order.id}`,
            status: sampleStatus,
            sender: order.sender || 'Unknown',
            date: new Date(order.created_at).toISOString().split('T')[0],
            paymentStatus,
            totalAmount,
            steps,
            currentStep,
            clientOrderNo,
            hasRs2Data: !!rs2Data,
            rs2CanBeProcessed: (rs2Data && rs2Data.sample_order_no === order.sample_order_no && paymentStatus === 'Terbayar'),
            timeline // Added timeline to the return object
          };
        }));
        
        setSampleProcesses(processedData);
        if (processedData.length > 0) {
          setSelectedProcess(processedData[0].id);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching sample process data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Get latest active processes for timeline
  const latestActiveProcesses = useMemo(() => {
    return sampleProcesses
      .filter(process => process.status === 'Processing' || process.status === 'Paid')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  }, [sampleProcesses]);

  // Calculate current page items
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return sampleProcesses.slice(indexOfFirstItem, indexOfLastItem);
  }, [sampleProcesses, currentPage, itemsPerPage]);

  // Page Navigation
  const totalPages = Math.ceil(sampleProcesses.length / itemsPerPage);
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'Processing':
        return 'bg-purple-100 text-purple-800';
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Received':
        return 'bg-blue-100 text-blue-800';
      case 'Submitted - Unpaid':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Timeline Status Indicator
  const TimelineStatus = ({ status }) => {
    switch(status) {
      case 'Completed':
        return <span className="h-2 w-2 rounded-full bg-green-500"></span>;
      case 'In Progress':
        return <span className="h-2 w-2 rounded-full bg-purple-500"></span>;
      case 'Pending':
        return <span className="h-2 w-2 rounded-full bg-yellow-500"></span>;
      default:
        return <span className="h-2 w-2 rounded-full bg-gray-300"></span>;
    }
  };

  // Timeline Item Component
  const TimelineItem = ({ item, isLast }) => (
    <li className="flex items-start">
      <div className="flex flex-col items-center mr-4">
        <div className="flex h-5 w-5 items-center justify-center rounded-full">
          <TimelineStatus status={item.status} />
        </div>
        {!isLast && <div className="h-10 w-px bg-gray-200"></div>}
      </div>
      <div className="pt-0.5">
        <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
        <p className="text-xs text-gray-500">
          {item.status === 'Completed' ? 
            <span className="text-green-600">Completed • {item.date}</span> : 
            item.status === 'In Progress' ? 
            <span className="text-purple-600">In Progress • {item.date}</span> :
            item.status === 'Pending' ?
            <span className="text-yellow-600">Pending</span> :
            <span className="text-gray-400">Waiting</span>
          }
        </p>
      </div>
    </li>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md rounded-lg bg-red-50 p-6 text-center">
          <h3 className="mb-2 text-lg font-semibold text-red-800">Error Loading Data</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Timeline Panel */}
      <div className="w-full rounded-lg border border-gray-200 bg-white shadow-sm lg:w-2/5">
        <div className="bg-blue-400 flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-medium text-gray-800">TIMELINE</h2>
          <button className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <ListFilter className="h-5 w-5" />
          </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto p-4">
          {latestActiveProcesses.length > 0 ? (
            <div className="space-y-6">
              {latestActiveProcesses.map((process) => (
                <div key={process.id} className="space-y-2">
                  <h3 className="flex items-center text-base font-medium text-gray-800">
                    <span className="mr-2 flex h-2 w-2 items-center">
                      <span className={`h-2 w-2 rounded-full ${
                        process.status === 'Processing' ? 'bg-purple-500' : 'bg-green-500'
                      }`}></span>
                    </span>
                    {process.sample_order_no}
                  </h3>
                  
                  <div className="ml-4 text-sm text-gray-600">
                    Yet another one, at <span className="text-emerald-500">15:00 PM</span>
                  </div>
                  
                  <div className="ml-4 text-sm font-medium text-gray-800">
                    Build the production release
                  </div>
                  
                  <div className="ml-4 text-sm text-emerald-500">
                    Something not important
                  </div>
                  
                  <ul className="mt-2 space-y-4">
                    {process.timeline.map((item, index) => (
                      <TimelineItem 
                        key={item.id} 
                        item={item} 
                        isLast={index === process.timeline.length - 1} 
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center">
              <p className="text-gray-500">No active processes found</p>
            </div>
          )}
        </div>
        <div className="border-t p-3 text-center"></div>
      </div>
      
      {/* Dynamic Table Panel */}
      <div className="w-full rounded-lg border border-gray-200 bg-white shadow-sm lg:w-3/5">
        <div className="bg-blue-400 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b p-4">
          <div className="flex items-center mb-3 sm:mb-0">
            <div className="mr-3 text-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-800">HANTARAN TABLE</h2>
          </div>
          
          <div className="flex space-x-2">
            <button className="rounded-md bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600">
              Refresh
            </button>
            <button className="rounded-md bg-gray-800 px-3 py-1 text-sm text-white hover:bg-gray-700">
              Remove
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SAMPLE ORDER NO
                </th>
                <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SENDER
                </th>
                <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DATE
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((process, index) => (
                <tr key={process.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`mr-2 h-2 w-2 rounded-full ${
                        process.status === 'Processing' ? 'bg-purple-500' : 
                        process.status === 'Paid' ? 'bg-green-500' : 
                        process.status === 'Received' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}></span>
                      <span className="text-sm font-medium text-gray-900">{process.sample_order_no}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                    {process.sender}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(process.status)}`}>
                      {process.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                    {process.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
                currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Previous
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
                currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Next
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sampleProcesses.length)} of {sampleProcesses.length} results
              </p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                  currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="px-2 py-1 min-w-[40px] text-center rounded-md border border-blue-500 bg-blue-50 text-sm font-medium text-blue-700">
                {currentPage}
              </div>
              
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                  currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center">
            <span className="mr-2 text-sm text-gray-700">4 items per page</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  );
}