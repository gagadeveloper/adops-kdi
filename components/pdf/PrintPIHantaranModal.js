'use client';

import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { Page, Text, View, Document, StyleSheet, PDFViewer, Image } from '@react-pdf/renderer';
import axios from "axios";

const styles = StyleSheet.create({
  page: { 
    padding: 20, 
    fontSize: 10,
    fontFamily: 'Helvetica'
  },
  headerContainer: { 
    flexDirection: "row", 
    marginBottom: 20
  },
  logo: { 
    width: 56, 
    height: 46
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 7
  },
  title: {
    fontSize: 16,
    fontWeight: "bold"
  },
  clientInfoContainer: {
    flexDirection: "row",
    marginBottom: 15
  },
  infoBox: {
    width: "50%",
    borderWidth: 1,
    borderColor: "black",
    padding: 10,
    height: 80
  },
  boxTitle: {
    fontWeight: "bold",
    marginBottom: 10
  },
  boxContent: {
    fontSize: 9
  },
  rowContainer: {
    flexDirection: "row",
    marginBottom: 10
  },
  label: {
    width: 40,
    fontSize: 10
  },
  value: {
    fontSize: 10
  },
  rowContainerclient: {
    flexDirection: "row",
    marginBottom: 2
  },
  labelclient: {
    width: 40,
    fontSize: 10
  },
  valueclient: {
    fontSize: 9
  },
  serviceNote: {
    marginTop: -10,
    marginBottom: 5
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "black",
    marginBottom: 15
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "black",
    backgroundColor: "#f2f2f2"
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "black"
  },
  tableHeaderCell: {
    width: "50%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "black"
  },
  labelheader: {
    width: "100%",
    padding: 1,
    textAlign: "center"
  },
  descriptionCell: {
    width: "50%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "black"
  },
  labeldeskripsi: {
    width: 100,
    fontSize: 10,
    marginBottom: 10
  },
  valuedeskripsi: {
    fontSize: 10,
    marginBottom: 40
  },
  amountCell: {
    width: "50%",
    padding: 8,
    textAlign: "right",
    marginTop: 20,
    marginBottom: 40
  },
  totalsContainer: {
    width: "50%",
    marginLeft: "auto",
    marginBottom: 15
  },
  totalsRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "black",
    marginBottom: 5
  },
  totalsLabel: {
    width: "40%",
    padding: 5,
    fontWeight: "bold"
  },
  totalsValue: {
    width: "60%",
    padding: 5,
    textAlign: "right"
  },
  bankInfoContainer: {
    borderWidth: 1,
    borderColor: "black",
    padding: 10,
    marginBottom: 20
  },
  bankTitle: {
    fontWeight: "bold",
    marginBottom: 5
  },
  bankDetail: {
    marginLeft: 80,
    marginBottom: 4
  },
  bankDetailBold: {
    marginLeft: 80,
    marginBottom: 4,
    fontWeight: "bold"
  },
  signatureContainer: {
    flexDirection: "row",
    marginBottom: 10,
    marginTop: 10
  },
  signatureLeft: {
    width: "50%"
  },
  signatureRight: {
    width: "50%",
    alignItems: "flex-start" // Memastikan konten alignment
  },
  signatureRow: {
    flexDirection: "row",
    marginBottom: 5
  },
  signatureLabel: {
    width: 60
  },
  signatureEmptyLabel: {
    width: 60
  },
  qrCodeAboveSignature: {
    width: 80,
    height: 80,
    marginLeft: 90, // Sejajar dengan ": " setelah "Signature"
    marginBottom: 15
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#0000B3"
  },
  footerTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
    color: "#0000B3"
  },
  footerText: {
    fontSize: 9,
    textAlign: "center",
    marginBottom: 3,
    color: "#0000B3"
  }
});

const PrintPIHantaranModal = ({ isOpen, onClose, sampleOrderNo }) => {
  // Define sample data inside the component
  const sampleData = {
    id: "",
    invoice_no: "",
    date: new Date().toISOString(),
    client: "",
    amount: "",
    description: "",
    samples: [
      {
        sample_code: "",
        quantity: "",
        commodity: "",
        type_size: ""
      }
    ]
  };

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && sampleOrderNo) {
      setLoading(true);
      axios.get(`/api/print-pihantaran?sampleOrderNo=${sampleOrderNo}`)
        .then(response => {
          console.log("Data received:", response.data);
          setData(response.data);
          setLoading(false);
        })
        .catch(error => {
          console.error("Error fetching data:", error);
          setError(error);
          setLoading(false);
        });
    }
  }, [isOpen, sampleOrderNo]);

  // Render loading state
  if (loading && isOpen) {
    return (
      <Modal 
        isOpen={isOpen} 
        onRequestClose={onClose} 
        style={customStyles} 
        contentLabel="Print PI Hantaran"
      >
        <button onClick={onClose} style={closeButtonStyle}>X</button>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <p>Loading data...</p>
        </div>
      </Modal>
    );
  }

  // Render error state
  if (error && isOpen) {
    return (
      <Modal 
        isOpen={isOpen} 
        onRequestClose={onClose} 
        style={customStyles} 
        contentLabel="Print PI Hantaran"
      >
        <button onClick={onClose} style={closeButtonStyle}>X</button>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <p>Error loading data: {error.message || "Unknown error"}</p>
        </div>
      </Modal>
    );
  }

  // Use sample data for preview or actual data when available
  const displayData = data || sampleData;
  
  // Format date for display
  const formattedDate = displayData.date 
    ? new Date(displayData.date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

  // Calculate PPN (11%) and total
  const amount = parseFloat(displayData.amount || 0);
  const ppnAmount = amount * 0.11;
  const totalAmount = amount + ppnAmount;

  // Format currency
  const formatCurrency = (amount) => {
    return `Rp. ${parseFloat(amount || 0).toLocaleString('id-ID')}`;
  };

  // Calculate total samples with proper number conversion
  const totalSamples = (displayData.samples || []).reduce((sum, sample) => {
    const quantity = sample.quantity ? parseInt(sample.quantity, 10) : 0;
    return sum + quantity;
  }, 0);

  // Use piData.description if available and not empty, otherwise generate a description
  let description;
  if (displayData.description && displayData.description.trim() !== '') {
    description = displayData.description;
  } else {
    // Default values if samples are empty
    const commodity = displayData.samples && displayData.samples.length > 0 && displayData.samples[0].commodity 
      ? displayData.samples[0].commodity 
      : 'GROSS';
    const typeSize = displayData.samples && displayData.samples.length > 0 && displayData.samples[0].type_size 
      ? displayData.samples[0].type_size 
      : 'PRESS PELLET';
    description = `${totalSamples} SAMPEL ${commodity} (${typeSize})`;
  }

  if (loading) return <div>Loading data...</div>;
  if (error) return <div>Error loading data: {error.message}</div>;

  return (
    <Modal 
      isOpen={isOpen} 
      onRequestClose={onClose} 
      style={customStyles} 
      contentLabel="Print PI Hantaran"
    >
      <button onClick={onClose} style={closeButtonStyle}>X</button>
      <PDFViewer width="98%" height="1000px">
        <Document>
          <Page size="A4" style={styles.page}>
            {/* Header */}
            <Text style={styles.companyName}>SURVEYOR INDONESIA</Text>
            
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>PROFORMA INVOICE</Text>
            </View>
            
            {/* Client and Invoice Info */}
            <View style={styles.clientInfoContainer}>
              {/* Left side - Client Info */}
              <View style={styles.infoBox}>
                <View style={styles.rowContainerclient}>
                  <Text style={styles.labelclient}>CLIENT</Text>
                  <Text style={styles.valueclient}>: {displayData.client || displayData.client || '-'}</Text>
                </View>
                {/* <Text style={styles.boxTitle}>CLIENT :</Text>
                <Text style={styles.boxContent}>{displayData.client || '-'}</Text> */}
              </View>
              
              {/* Right side - Invoice Info */}
              <View style={styles.infoBox}>
                <View style={styles.rowContainer}>
                  <Text style={styles.label}>NO</Text>
                  <Text style={styles.value}>: {displayData.invoice_no || displayData.inovice_no || '-'}</Text>
                </View>
                
                <View style={styles.rowContainer}>
                  <Text style={styles.label}>DATE</Text>
                  <Text style={styles.value}>: {formattedDate}</Text>
                </View>
              </View>
            </View>
            
            {/* Service Note */}
            <View style={styles.serviceNote}>
              <Text>Invoice for the following services</Text>
            </View>
            
            {/* Invoice Details Table */}
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <View style={styles.tableHeaderCell}>
                  <Text style={styles.labelheader}>DESCRIPTION</Text>
                </View>
                <View style={styles.tableHeaderCell}>
                  <Text style={styles.labelheader}>AMOUNT</Text>
                </View>
              </View>
              
              {/* Table Row */}
              <View style={styles.tableRow}>
                <View style={styles.descriptionCell}>
                  <Text style={styles.labeldeskripsi}>PEMBAYARAN :</Text>
                  <Text style={styles.valuedeskripsi}>{description}</Text>
                  {/* <Text>PEMBAYARAN :</Text>
                  <Text>{description}</Text> */}
                </View>
                <View style={styles.amountCell}>
                  <Text>{formatCurrency(amount)}</Text>
                </View>
              </View>
            </View>
            
            {/* Totals Section */}
            <View style={styles.totalsContainer}>
              {/* JUMLAH */}
              <View style={styles.totalsRow}>
                <View style={styles.totalsLabel}>
                  <Text>JUMLAH</Text>
                </View>
                <View style={styles.totalsValue}>
                  <Text>{formatCurrency(amount)}</Text>
                </View>
              </View>
              
              {/* PPN */}
              <View style={styles.totalsRow}>
                <View style={styles.totalsLabel}>
                  <Text>PPN 11%</Text>
                </View>
                <View style={styles.totalsValue}>
                  <Text>{formatCurrency(ppnAmount)}</Text>
                </View>
              </View>
              
              {/* TOTAL */}
              <View style={styles.totalsRow}>
                <View style={styles.totalsLabel}>
                  <Text>TOTAL</Text>
                </View>
                <View style={styles.totalsValue}>
                  <Text>{formatCurrency(totalAmount)}</Text>
                </View>
              </View>
            </View>
            
            {/* Bank Info */}
            <View style={styles.bankInfoContainer}>
              <Text style={styles.bankTitle}>Transfer to :</Text>
              <Text style={styles.bankDetailBold}>Bank MANDIRI</Text>
              <Text style={styles.bankDetail}>KCP Makassar Veteran Utara</Text>
              <Text style={styles.bankDetail}>A/C 1520 0778 60001</Text>
              <Text style={styles.bankDetail}>A/N PT Surveyor Indonesia</Text>
            </View>
            
            {/* Signature and QR Code Section - Modified */}
            <View style={styles.signatureContainer}>
            {/* Left side - Empty */}
            <View style={styles.signatureLeft}>
              {/* Left side is now empty */}
            </View>
            
            {/* Right side - QR Code above signature line */}
            <View style={styles.signatureRight}>
              {/* QR Code positioned directly above the signature line */}
              <Image src="/QR_latief.png" style={styles.qrCodeAboveSignature} />
              {/* Signature information */}
              <View style={styles.signatureRow}>
                <Text style={styles.signatureLabel}>Signature</Text>
                <Text>: ..................................................</Text>
              </View>

              <View style={styles.signatureRow}>
                <Text style={styles.signatureLabel}>Name</Text>
                <Text>: Abd Latief</Text>
              </View>
              
              <View style={styles.signatureRow}>
                <Text style={styles.signatureLabel}>Position</Text>
                <Text>: Koordinator Operasi RO Kendari</Text>
              </View>
            </View>
          </View>
            
            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerTitle}>DIVISI BISNIS STRATEGIS MINERAL DAN BATUBARA WILAYAH SULAWESI SELATAN</Text>
              <Text style={styles.footerText}>Kantor Cabang Jl. Kumala No 128, Jongaya, Kec. Tamalate, Makassar, Sulawesi Selatan</Text>
              <Text style={styles.footerText}>Telephone : +62 411-8981550</Text>
              <Text style={styles.footerText}>Website : www.ptsi.co.id</Text>
            </View>
          </Page>
        </Document>
      </PDFViewer>
    </Modal>
  );
};

const customStyles = {
  overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
  content: { 
    width: "80%", 
    height: "90%", 
    margin: "auto", 
    padding: "20px", 
    borderRadius: "10px" 
  },
};

const closeButtonStyle = { 
  position: "absolute", 
  top: "10px", 
  right: "15px", 
  fontSize: "20px", 
  cursor: "pointer" 
};

export default PrintPIHantaranModal;