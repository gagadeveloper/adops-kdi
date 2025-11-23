'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import Link from 'next/link';

// Memoized Step component for process flow
const Step = memo(({ step, index, totalSteps, currentStep, onClick }) => {
  const getStepStatus = () => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'current';
    return 'pending';
  };

  const status = getStepStatus();

  return (
    <div className="flex flex-col items-center relative" style={{ width: `${100 / totalSteps}%` }}>
      {/* Line connector */}
      {index < totalSteps - 1 && (
        <div 
          className={`absolute w-full h-1 top-5 left-1/2 transition-colors duration-300 ${
            index < currentStep ? 'bg-green-500' : 'bg-gray-200'
          }`}
          style={{ zIndex: 1 }}
        ></div>
      )}
      
      {/* Icon circle with animation on click */}
      <button
        onClick={() => onClick(step.title)}
        className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full 
          transition-all duration-300 transform hover:scale-110 ${
          status === 'completed' ? 'bg-green-500 text-white shadow-md' : 
          status === 'current' ? 'bg-blue-500 text-white shadow-md animate-pulse' : 
          'bg-gray-200 text-gray-500'
        }`}
        aria-label={`View details for ${step.title} step`}
      >
        <span className="text-lg">{step.icon}</span>
      </button>
      
      {/* Step title */}
      <div className="mt-2 text-center">
        <div className="font-medium text-sm">{step.title}</div>
        <div className={`text-xs transition-colors duration-300 ${
          step.status === 'Completed' ? 'text-green-600' : 
          step.status === 'Progress' ? 'text-blue-600' : 
          'text-gray-500'
        }`}>
          {step.status}
        </div>
      </div>
    </div>
  );
});

Step.displayName = 'Step';

// Memoized details card
const StepDetails = memo(({ step }) => {
  if (!step?.details) return null;
  
  return (
    <div className="mt-8 p-4 bg-white border border-gray-200 rounded-lg shadow-sm animate-fadeIn">
      <h3 className="font-medium text-lg mb-2 flex items-center">
        <span className="mr-2">{step.icon}</span>
        {step.title} Details
      </h3>
      <div className="text-sm text-gray-800">
        {step.details}
      </div>
    </div>
  );
});

StepDetails.displayName = 'StepDetails';

// Memoized sample button
const SampleButton = memo(({ sample, isSelected, onClick }) => (
  <button
    onClick={() => onClick(sample.id)}
    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
      isSelected
        ? 'bg-green-100 text-green-700 border border-green-300 shadow-sm'
        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
    }`}
  >
    {sample.lokasi_site}
  </button>
));

SampleButton.displayName = 'SampleButton';

// Memoized info card
const InfoCard = memo(({ label, value }) => (
  <div className="bg-gray-50 p-3 rounded-lg hover:shadow-md transition-shadow duration-300">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="font-semibold">{value}</div>
  </div>
));

InfoCard.displayName = 'InfoCard';

// Main component
export default function TrackingSamplesCard() {
  const [trackingData, setTrackingData] = useState([]);
  const [selectedSample, setSelectedSample] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);
  const [isDataFetched, setIsDataFetched] = useState(false);

  // Format date helper function with time information - memoized
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      // Format as YYYY-MM-DD HH:MM
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'Invalid Date';
    }
  }, []);

  // Map API data to component format - moved outside of useEffect
  const mapAPIDataToComponentFormat = useCallback((data) => {
    return data.map(sample => {
      // Determine current step based on sample status - optimized logic
      let currentStep = 0;
      
      if (sample.coa_issued_date) currentStep = 6;
      else if (sample.coa_review_date) currentStep = 5;
      else if (sample.coa_draft_date) currentStep = 4;
      else if (sample.roa_issued_date) currentStep = 3;
      else if (sample.analysis_completed_date) currentStep = 2;
      else if (sample.preparation_completed_date) currentStep = 1;
      else if (sample.received_date) currentStep = 0;
      
      // Create formatted steps with status and details
      const steps = [
        {
          title: 'Receive',
          status: sample.received_date ? 'Completed' : 'Pending',
          icon: '📥',
          details: sample.received_date ? (
            <div className="space-y-1">
              <p><strong>Received By:</strong> {sample.received_by || 'N/A'}</p>
              <p><strong>Date:</strong> {formatDate(sample.received_date)}</p>
              <p><strong>Quantity:</strong> {sample.received_quantity || sample.quantity}</p>
            </div>
          ) : null
        },
        {
          title: 'Preparation',
          status: sample.preparation_completed_date 
            ? 'Completed' 
            : (sample.preparation_started_date ? 'Progress' : 'Pending'),
          icon: '🧪',
          details: sample.preparation_started_date ? (
            <div className="space-y-1">
              <p><strong>Started:</strong> {formatDate(sample.preparation_started_date)}</p>
              <p><strong>Completed:</strong> {sample.preparation_completed_date ? formatDate(sample.preparation_completed_date) : 'In Progress'}</p>
              <p><strong>By:</strong> {sample.prepared_by || 'N/A'}</p>
              {sample.preparation_notes && <p><strong>Notes:</strong> {sample.preparation_notes}</p>}
            </div>
          ) : null
        },
        {
          title: 'Analysis',
          status: sample.analysis_completed_date 
            ? 'Completed' 
            : (sample.analysis_started_date ? 'Progress' : 'Pending'),
          icon: '🔬',
          details: sample.analysis_started_date ? (
            <div className="space-y-1">
              <p><strong>Started:</strong> {formatDate(sample.analysis_started_date)}</p>
              <p><strong>Completed:</strong> {sample.analysis_completed_date ? formatDate(sample.analysis_completed_date) : 'In Progress'}</p>
              <p><strong>By:</strong> {sample.analyzed_by || 'N/A'}</p>
              {sample.analysis_notes && <p><strong>Notes:</strong> {sample.analysis_notes}</p>}
            </div>
          ) : null
        },
        {
          title: 'ROA',
          status: sample.roa_issued_date 
            ? 'Completed' 
            : (sample.roa_created_date ? 'Progress' : 'Pending'),
          icon: '📄',
          details: sample.roa_created_date ? (
            <div className="space-y-1">
              <p><strong>Created:</strong> {formatDate(sample.roa_created_date)}</p>
              <p><strong>Issued:</strong> {sample.roa_issued_date ? formatDate(sample.roa_issued_date) : 'In Progress'}</p>
              <p><strong>By:</strong> {sample.roa_created_by || 'N/A'}</p>
              {sample.roa_document_url && (
                <a href={sample.roa_document_url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  View Document
                </a>
              )}
            </div>
          ) : null
        },
        {
          title: 'COA Draft',
          status: sample.coa_draft_date ? 'Completed' : 'Pending',
          icon: '📝',
          details: sample.coa_draft_date ? (
            <div className="space-y-1">
              <p><strong>Date:</strong> {formatDate(sample.coa_draft_date)}</p>
              <p><strong>By:</strong> {sample.coa_created_by || 'N/A'}</p>
              {sample.coa_draft_url && (
                <a href={sample.coa_draft_url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  View Draft
                </a>
              )}
            </div>
          ) : null
        },
        {
          title: 'COA Review',
          status: sample.coa_review_date ? 'Completed' : 'Pending',
          icon: '✅',
          details: sample.coa_review_date ? (
            <div className="space-y-1">
              <p><strong>Date:</strong> {formatDate(sample.coa_review_date)}</p>
              <p><strong>By:</strong> {sample.coa_reviewer || 'N/A'}</p>
              <p><strong>Status:</strong> {sample.coa_review_status || 'N/A'}</p>
            </div>
          ) : null
        },
        {
          title: 'COA Issue',
          status: sample.coa_issued_date ? 'Completed' : 'Pending',
          icon: '📋',
          details: sample.coa_issued_date ? (
            <div className="space-y-1">
              <p><strong>Date:</strong> {formatDate(sample.coa_issued_date)}</p>
              <p><strong>By:</strong> {sample.coa_created_by || 'N/A'}</p>
              {sample.coa_document_url && (
                <a href={sample.coa_document_url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  View Document
                </a>
              )}
            </div>
          ) : null
        }
      ];

      // Determine current status text
      let status = 'Received';
      if (sample.coa_issued_date) status = 'Completed';
      else if (sample.coa_review_date) status = 'COA Review';
      else if (sample.coa_draft_date) status = 'COA Draft';
      else if (sample.roa_issued_date) status = 'ROA';
      else if (sample.analysis_completed_date) status = 'Analysis';
      else if (sample.preparation_completed_date) status = 'Preparation';
      else if (sample.received_date) status = 'Received';

      return {
        id: sample.id,
        sample_code: sample.sample_code,
        status: status,
        sender_name: sample.sender_name,
        sent_date: formatDate(sample.sent_date),
        quantity: sample.quantity,
        received_date: formatDate(sample.received_date),
        driver_name: sample.driver_name,
        lokasi_site: sample.lokasi_site,
        steps: steps,
        currentStep: currentStep
      };
    });
  }, [formatDate]);

  // Fetch tracking data from API with debounce
  useEffect(() => {
    // Prevent duplicate fetches
    if (isDataFetched) return;

    const fetchTrackingData = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch('/api/tracking-samples', {
          signal: controller.signal,
          cache: 'no-store' // Prevent caching for fresh data
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        const mappedData = mapAPIDataToComponentFormat(data);
        
        setTrackingData(mappedData);
        if (mappedData.length > 0) {
          setSelectedSample(mappedData[0].id);
          // Auto-select first step of first sample for displaying details
          setSelectedStep(mappedData[0].steps[0].title);
        }
        
      } catch (err) {
        console.error('Error fetching tracking data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        setIsDataFetched(true);
      }
    };

    // Fetch data with a small delay to avoid potential race conditions
    const timer = setTimeout(() => {
      fetchTrackingData();
    }, 100);

    return () => clearTimeout(timer);
  }, [isDataFetched, mapAPIDataToComponentFormat]);

  // Get the selected sample data
  const selectedSampleData = trackingData.find(s => s.id === selectedSample);
  
  // Get the selected step details
  const selectedStepData = selectedSampleData?.steps.find(s => s.title === selectedStep);

  const handleSelectSample = useCallback((id) => {
    setSelectedSample(id);
    // When switching samples, reset to the current step to show relevant details
    const sample = trackingData.find(s => s.id === id);
    if (sample) {
      const currentStepIndex = Math.min(sample.currentStep, sample.steps.length - 1);
      setSelectedStep(sample.steps[currentStepIndex].title);
    }
  }, [trackingData]);

  const handleSelectStep = useCallback((stepTitle) => {
    setSelectedStep(prevStep => prevStep === stepTitle ? null : stepTitle);
  }, []);

  const renderFooter = () => (
    <div className="flex flex-wrap gap-2">
      {/* <Link href="dashboard/adopsi/tracking-samples" className="px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 text-sm transition-colors duration-300">
        Data Tracking Samples
      </Link> */}
    </div>
  );

  return (
    <Card 
      title="SAMPLE SHIPMENT"
      footer={renderFooter()}
      className="h-full transition-shadow duration-300 hover:shadow-lg"
    >
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="p-4 text-red-600 bg-red-50 rounded-md animate-fadeIn">
          <p className="font-medium">Error loading data</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => {
              setIsDataFetched(false);
              setLoading(true);
              setError(null);
            }}
            className="mt-2 px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors duration-300"
          >
            Retry
          </button>
        </div>
      ) : trackingData.length === 0 ? (
        <div className="p-4 text-gray-600 bg-gray-50 rounded-md animate-fadeIn">
          No tracking samples found.
        </div>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          {/* Sample selection buttons with virtualized scrolling for large datasets */}
          <div className="overflow-x-auto pb-2 hide-scrollbar">
            <div className="flex gap-2 mb-4">
              {trackingData.map(sample => (
                <SampleButton
                  key={sample.id}
                  sample={sample}
                  isSelected={selectedSample === sample.id}
                  onClick={handleSelectSample}
                />
              ))}
            </div>
          </div>
          
          {selectedSampleData && (
            <>
              {/* Sample information cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <InfoCard label="Sample Code" value={selectedSampleData.sample_code} />
                <InfoCard label="Sender" value={selectedSampleData.sender_name} />
                <InfoCard label="Send Date" value={selectedSampleData.sent_date} />
                <InfoCard label="Quantity" value={selectedSampleData.quantity} />
                <InfoCard label="Driver" value={selectedSampleData.driver_name} />
                <InfoCard label="Received Date" value={selectedSampleData.received_date} />
              </div>
              
              {/* Status indicator - new addition */}
              <div className="mb-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <span className="w-2 h-2 mr-2 rounded-full animate-pulse" 
                    style={{backgroundColor: 
                      selectedSampleData.status === 'Completed' ? '#10B981' : 
                      '#3B82F6'
                    }}></span>
                  Status: {selectedSampleData.status}
                </div>
              </div>
              
              {/* Process Flow Component - improved version */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  {selectedSampleData.steps.map((step, index) => (
                    <Step
                      key={step.title}
                      step={step}
                      index={index}
                      totalSteps={selectedSampleData.steps.length}
                      currentStep={selectedSampleData.currentStep}
                      onClick={handleSelectStep}
                    />
                  ))}
                </div>
                
                {/* Details panel that appears below the timeline */}
                {selectedStepData && (
                  <StepDetails step={selectedStepData} />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}