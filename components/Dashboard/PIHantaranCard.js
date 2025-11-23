'use client';

import { useState, useEffect } from 'react';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PIHantaranCard() {
  const [piData, setPIData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDataType, setSelectedDataType] = useState('Hantaran');
  const [summaryData, setSummaryData] = useState({
    totalRevenue: 0,
    dpTotal: 0,
    pelunasanTotal: 0,
    lumpsumTotal: 0
  });
  
  const [yearlyStats, setYearlyStats] = useState({
    currentYear: 0,
    previousYear: 0,
    percentageChange: 0,
    isPositive: true
  });
  
  const [monthlyStats, setMonthlyStats] = useState({
    currentMonth: 0,
    previousMonth: 0,
    percentageChange: 0,
    isPositive: true
  });
  
  const [weeklyChartData, setWeeklyChartData] = useState([]);

  // Get month names for dropdown
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Fetch Data based on selected type
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch data based on the selected data type
        const endpoint = selectedDataType === 'Hantaran' ? '/api/pi_hantaran' : '/api/pi_shipment';
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error('Gagal mengambil data');
        }
        
        const data = await response.json();
        
        // Prepare data based on selected type
        const preparedData = prepareData(data, selectedDataType);
        
        // Process all data
        setPIData(preparedData);
        
        // Process data for selected month
        processDataForMonth(preparedData, selectedMonth, selectedYear);
        
        // Process data for yearly and monthly stats
        processStatsData(preparedData, selectedMonth, selectedYear);
        
        // Process weekly chart data
        processWeeklyChartData(preparedData, selectedMonth, selectedYear);
        
      } catch (error) {
        console.error(`Error fetching ${selectedDataType} data:`, error);
        setPIData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedMonth, selectedYear, selectedDataType]);

  // Prepare data based on data type
  const prepareData = (data, type) => {
    if (type === 'Hantaran') {
      return data.map(item => ({
        ...item,
        // Use created_at since date is NULL in your database
        date: item.date || item.created_at, 
        // Set default values for missing fields
        jenis_pembayaran: item.status === 'Paid' ? 'Pelunasan' : 'DP',
        sign: item.status === 'Paid',
        total: parseFloat(item.total) || 0,
        no_invoice: item.invoice_no || '-'
      }));
    } else {
      // Shipment data handling
      return data.map(item => ({
        ...item,
        date: item.date,
        sign: item.sign,
        total: parseFloat(item.total) || 0,
        no_invoice: item.no_invoice || '-'
      }));
    }
  };

  // Process data for the selected month
  const processDataForMonth = (data, month, year) => {
    // Filter data for selected month
    const filteredData = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.getMonth() === month && itemDate.getFullYear() === year;
    });
    
    // Sort data by most recent date
    filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate summary data
    const summary = {
      totalRevenue: 0,
      dpTotal: 0,
      pelunasanTotal: 0,
      lumpsumTotal: 0
    };
    
    filteredData.forEach(item => {
      // Ensure total is a number
      const total = parseFloat(item.total) || 0;
      summary.totalRevenue += total;
      
      // Determine payment type based on status if jenis_pembayaran is not set
      const paymentType = item.jenis_pembayaran || (item.status === 'Paid' ? 'Pelunasan' : 'DP');
      
      switch (paymentType) {
        case 'DP':
          summary.dpTotal += total;
          break;
        case 'Pelunasan':
          summary.pelunasanTotal += total;
          break;
        case 'Lumpsum':
          summary.lumpsumTotal += total;
          break;
      }
    });
    
    setSummaryData(summary);
  };
  
  // Process data for yearly and monthly statistics
  const processStatsData = (data, month, year) => {
    // Calculate yearly stats (current year vs previous year)
    const currentYearData = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.getFullYear() === year;
    });
    
    const previousYearData = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.getFullYear() === year - 1;
    });
    
    const currentYearRevenue = currentYearData.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    const previousYearRevenue = previousYearData.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    
    const yearlyPercentageChange = previousYearRevenue > 0 
      ? ((currentYearRevenue - previousYearRevenue) / previousYearRevenue) * 100 
      : 100;
    
    setYearlyStats({
      currentYear: currentYearRevenue,
      previousYear: previousYearRevenue,
      percentageChange: Math.abs(yearlyPercentageChange).toFixed(1),
      isPositive: yearlyPercentageChange >= 0
    });
    
    // Calculate monthly stats (current month vs same month last year)
    const currentMonthData = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.getMonth() === month && itemDate.getFullYear() === year;
    });
    
    const previousMonthData = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.getMonth() === month && itemDate.getFullYear() === year - 1;
    });
    
    const currentMonthRevenue = currentMonthData.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    const previousMonthRevenue = previousMonthData.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    
    const monthlyPercentageChange = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 100;
    
    setMonthlyStats({
      currentMonth: currentMonthRevenue,
      previousMonth: previousMonthRevenue,
      percentageChange: Math.abs(monthlyPercentageChange).toFixed(1),
      isPositive: monthlyPercentageChange >= 0
    });
  };
  
  // Process weekly chart data
  const processWeeklyChartData = (data, month, year) => {
    // Get first and last date of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Calculate the number of weeks in the month
    const weeksInMonth = Math.ceil((lastDay.getDate() - firstDay.getDate() + 1) / 7);
    
    // Initialize weekly data arrays
    const currentYearWeeklyData = Array(weeksInMonth).fill(0);
    const previousYearWeeklyData = Array(weeksInMonth).fill(0);
    
    // Calculate current year data by week
    data.forEach(item => {
      const itemDate = new Date(item.date);
      if (itemDate.getMonth() === month && itemDate.getFullYear() === year) {
        // Calculate which week of the month this date falls in (0-indexed)
        const dayOfMonth = itemDate.getDate();
        const weekIndex = Math.floor((dayOfMonth - 1) / 7);
        if (weekIndex < weeksInMonth) {
          currentYearWeeklyData[weekIndex] += parseFloat(item.total) || 0;
        }
      }
    });
    
    // Calculate previous year data by week
    data.forEach(item => {
      const itemDate = new Date(item.date);
      if (itemDate.getMonth() === month && itemDate.getFullYear() === year - 1) {
        // Calculate which week of the month this date falls in (0-indexed)
        const dayOfMonth = itemDate.getDate();
        const weekIndex = Math.floor((dayOfMonth - 1) / 7);
        if (weekIndex < weeksInMonth) {
          previousYearWeeklyData[weekIndex] += parseFloat(item.total) || 0;
        }
      }
    });
    
    // Create chart data structure for Recharts
    const chartData = Array.from({ length: weeksInMonth }, (_, i) => {
      const weekStart = i * 7 + 1;
      const weekEnd = Math.min((i + 1) * 7, lastDay.getDate());
      return {
        name: `Week ${i + 1}`,
        period: `${weekStart}-${weekEnd} ${months[month]}`,
        currentYear: currentYearWeeklyData[i],
        previousYear: previousYearWeeklyData[i]
      };
    });
    
    setWeeklyChartData(chartData);
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Format tanggal ke format Indonesia
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  // Handle month change
  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value));
  };

  // Handle data type change
  const handleDataTypeChange = (e) => {
    setSelectedDataType(e.target.value);
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-bold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name === 'currentYear' ? selectedYear : (selectedYear - 1)}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Chart Card */}
      <div className="lg:col-span-2">
        <Card 
          title={
            <div className="flex justify-between items-center">
              <span>OVERVIEW</span>
              <div className="inline-flex items-center space-x-2">
                {/* Data type selection */}
                <select 
                  value={selectedDataType}
                  onChange={handleDataTypeChange}
                  className="p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="Hantaran">PI Hantaran</option>
                  <option value="Shipment">PI Shipment</option>
                </select>
                
                {/* Month selection */}
                <select 
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className="p-2 border border-gray-300 rounded text-sm"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>{month} {selectedYear}</option>
                  ))}
                </select>
              </div>
            </div>
          }
          className="h-full"
        >
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={weeklyChartData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                    width={90}
                    tick={{ fontSize: 11 }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => value === 'currentYear' ? selectedYear : (selectedYear - 1)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="currentYear" 
                    name="currentYear"
                    stroke="#4F46E5" 
                    strokeWidth={2.5}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="previousYear" 
                    name="previousYear"
                    stroke="#60A5FA" 
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-col gap-6">
        {/* Yearly Revenue Card */}
        <Card title="Yearly Breakup" className="h-full">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(yearlyStats.currentYear)}</h3>
                <div className="mt-1 flex items-center">
                  {yearlyStats.isPositive ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 7-7 7 7"></path>
                      <path d="M12 19V5"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14"></path>
                      <path d="m19 12-7 7-7-7"></path>
                    </svg>
                  )}
                  <span className={`text-sm ${yearlyStats.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {yearlyStats.percentageChange}% last year
                  </span>
                </div>
              </div>
              <div className="h-16 w-16">
                <div className="relative h-full w-full rounded-full">
                  {/* Background circle */}
                  <div className="absolute inset-0 rounded-full bg-gray-100"></div>
                  
                  {/* Progress circle - only show if positive change */}
                  {yearlyStats.isPositive && yearlyStats.percentageChange > 0 && (
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(#4F46E5 ${Math.min(yearlyStats.percentageChange, 100)}%, transparent ${Math.min(yearlyStats.percentageChange, 100)}% 100%)`
                      }}
                    ></div>
                  )}
                  
                  {/* Inner white circle */}
                  <div className="absolute inset-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Monthly Revenue Card */}
        <Card title="Monthly Earnings" className="h-full">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(monthlyStats.currentMonth)}</h3>
              <div className="mt-1 flex items-center">
                {monthlyStats.isPositive ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12 7-7 7 7"></path>
                    <path d="M12 19V5"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14"></path>
                    <path d="m19 12-7 7-7-7"></path>
                  </svg>
                )}
                <span className={`text-sm ${monthlyStats.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {monthlyStats.percentageChange}% last year
                </span>
              </div>
              <div className="mt-4">
                <svg className="w-full h-12" viewBox="0 0 120 20">
                  <path
                    d="M0,10 C10,5 20,15 30,10 C40,5 50,15 60,10 C70,5 80,15 90,10 C100,5 110,10 120,10"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Data Table */}
      <div className="lg:col-span-3">
        <Card 
          title={`PI ${selectedDataType} (${months[selectedMonth]} ${selectedYear})`}
          footer={
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-600">Total Revenue</div>
                <div className="font-bold text-blue-800">{formatCurrency(summaryData.totalRevenue)}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-600">Total DP</div>
                <div className="font-bold text-green-800">{formatCurrency(summaryData.dpTotal)}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-600">Total Pelunasan</div>
                <div className="font-bold text-purple-800">{formatCurrency(summaryData.pelunasanTotal)}</div>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg">
                <div className="text-sm text-indigo-600">Total Lumpsum</div>
                <div className="font-bold text-indigo-800">{formatCurrency(summaryData.lumpsumTotal)}</div>
              </div>
            </div>
          }
          className="h-full"
        >
          {loading ? (
            <LoadingSpinner />
          ) : piData.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === selectedYear;
          }).length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Tidak ada data PI {selectedDataType} pada bulan {months[selectedMonth]} {selectedYear}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    {selectedDataType === 'Shipment' && (
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jenis Pembayaran
                      </th>
                    )}
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {selectedDataType === 'Hantaran' ? 'Jenis' : 'Jenis Pekerjaan'}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No. Invoice
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {piData
                    .filter(item => {
                      const itemDate = new Date(item.date);
                      return itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === selectedYear;
                    })
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.client}
                        </td>
                        {selectedDataType === 'Shipment' && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.jenis_pembayaran === 'DP' ? 'bg-green-100 text-green-800' : 
                              item.jenis_pembayaran === 'Pelunasan' ? 'bg-purple-100 text-purple-800' : 
                              'bg-indigo-100 text-indigo-800'
                            }`}>
                              {item.jenis_pembayaran}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {selectedDataType === 'Hantaran' ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.jenis_pembayaran === 'DP' ? 'bg-green-100 text-green-800' : 
                              item.jenis_pembayaran === 'Pelunasan' ? 'bg-purple-100 text-purple-800' : 
                              'bg-indigo-100 text-indigo-800'
                            }`}>
                              {item.jenis_pembayaran}
                            </span>
                          ) : (
                            <span className="text-gray-900">{item.jenis_pekerjaan}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {selectedDataType === 'Hantaran' ? item.invoice_no || '-' : item.no_invoice || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <StatusBadge status={item.sign ? 'Terbayar' : 'Belum Terbayar'} />
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              
              <div className="mt-4 flex justify-end">
                <Link 
                  href={`/dashboard/adopsi/pi_${selectedDataType.toLowerCase()}`} 
                  className="inline-flex items-center px-4 py-2 border border-indigo-500 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Lihat Semua
                  <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}