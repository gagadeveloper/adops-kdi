'use client';

import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { Page, Text, View, Document, StyleSheet, PDFViewer, Image, Link } from '@react-pdf/renderer';
import axios from "axios";

const styles = StyleSheet.create({
  // All styles remain the same as before
  page: { 
    padding: 20, 
    fontSize: 10,
    fontFamily: 'Helvetica'
  },
  headerContainer: { 
    flexDirection: "row", 
    marginBottom: 5
  },
  logo: { 
    width: 56, 
    height: 46
  },
  formTitleContainer: {
    marginTop: 20,
    marginBottom: 5,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  formTitleLeft: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "left",
    width: "50%"
  },

  SampleTitleCenter: {
    marginTop: 5,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    width: "100%"
  },

  companyHeader: {
    marginTop: -20,
    marginBottom: 5,
    fontSize: 9,
    textAlign: "left",
    width: "40%"
  },
  companyAddress: {
    fontSize: 8,
    textAlign: "left"
  },
  tableContainer: {
    marginTop: 10,
    marginBottom: 10
  },
  table: {
    width: "100%",
    border: "1pt solid black",
    borderWidth: 1
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "black",
  },
  tableCell: {
    padding: 5,
    borderRightWidth: 10,
    borderRightColor: "black"
  },
  tableCellNoBorder: {
    padding: 5
  },
  labelCell: {
    width: "60%",
    borderRightWidth: 1,
    borderRightColor: "black",
    padding: 5
  },
  valueCell: {
    width: "75%",
    padding: 5
  },
  senderOrderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "black"
  },
  senderCell: {
    width: "44.6%",
    borderRightWidth: 1,
    borderRightColor: "black",
    padding: 5
  },
  orderCell: {
    width: "50%",
    padding: 5
  },
  sampleTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    borderBottomWidth: 1,
    borderBottomColor: "black"
  },
  sampleTableHeaderCell: {
    padding: 5,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: "black"
  },
  sampleTableHeaderCellLast: {
    padding: 5,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 8
  },
  sampleNumberCell: {
    width: "12%",
    borderRightWidth: 1,
    borderRightColor: "black",
    textAlign: "center",
    padding: 5,
    fontSize: 8
  },
  qtyCell: {
    width: "5%",
    borderRightWidth: 1,
    borderRightColor: "black",
    textAlign: "center",
    padding: 5,
    fontSize: 8
  },
  commodityCell: {
    width: "15%",
    borderRightWidth: 1,
    borderRightColor: "black",
    textAlign: "center",
    padding: 5,
    fontSize: 8
  },
  typeSizeCell: {
    width: "10%",
    borderRightWidth: 1,
    borderRightColor: "black",
    textAlign: "center",
    padding: 5,
    fontSize: 8
  },
  parameterCell: {
    width: "18%",
    borderRightWidth: 1,
    borderRightColor: "black",
    textAlign: "center",
    padding: 5,
    fontSize: 8
  },
  regulationCell: {
    width: "15%",
    borderRightWidth: 1,
    borderRightColor: "black",
    textAlign: "center",
    padding: 5,
    fontSize: 8
  },
  methodCell: {
    width: "25%",
    textAlign: "center",
    padding: 5,
    fontSize: 8
  },
  attachmentRow: {
    padding: 5,
    fontSize: 10
  },
  notesRow: {
    padding: 5,
    fontSize: 10,
    minHeight: 50
  },
  retentionTable: {
    width: "100%",
    border: "1pt solid black",
    borderWidth: 1,
    marginTop: 10
  },
  retentionRow: {
    flexDirection: "row"
  },
  qrCodeCell: {
    width: "60%",
    borderRightWidth: 1,
    borderRightColor: "black",
    padding: 5,
    alignItems: "center"
  },
  qrCode: {
    width: 80,
    height: 80
  },
  retentionInfoCell: {
    width: "75%",
    padding: 5
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5
  },
  signatureCell: {
    width: "30%",
    paddingTop: 5,
    paddingBottom: 5
  },
  dateCell: {
    width: "30%",
    textAlign: "right",
    paddingTop: 5,
    paddingBottom: 5
  },
  linkText: {
    color: "blue",
    textDecoration: "underline"
  },

  // Tambahkan style untuk halaman lampiran
  attachmentPage: {
    padding: 20,
    fontSize: 10,
    fontFamily: 'Helvetica'
  },
  attachmentTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center"
  },
  attachmentImage: {
    marginTop: 20,
    marginBottom: 20,
    alignSelf: "center", // Untuk memusatkan gambar
    maxWidth: "90%",     // Batasi lebar maksimal
    maxHeight: 700      // Batasi tinggi maksimal
  }
});

const PrintRS2Modal = ({ isOpen, onClose, sampleOrderNo }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attachmentData, setAttachmentData] = useState(null);

  useEffect(() => {
    if (isOpen && sampleOrderNo) {
      setLoading(true);
      axios.get(`/api/print-rs1?sampleOrderNo=${sampleOrderNo}`)
        .then(response => {
          console.log("Data received:", response.data);
          console.log("Storage options:", {
            "7 days": Boolean(response.data.hold_7_days_storage),
            "1 month": Boolean(response.data.hold_1_month_storage),
            "custom months": response.data.hold_custom_months_storage
          });
          setData(response.data);
          setLoading(false);
          // Jika ada attachment path, ambil data attachment
          if (response.data.attachment_path) {
            fetchAttachment(response.data.attachment_path);
          } else {
            setLoading(false);
          }
        })
        .catch(error => {
          console.error("Error fetching data:", error);
          setError(error);
          setLoading(false);
        });
    }
  }, [isOpen, sampleOrderNo]);

  // Fungsi untuk mengambil data lampiran
  const fetchAttachment = async (attachmentPath) => {
    try {
      const path = attachmentPath.startsWith('/') 
        ? attachmentPath 
        : `/uploads/${attachmentPath}`;
        
      // Ambil data lampiran (opsional, tergantung format lampiran)
      // Misalnya jika lampiran adalah gambar:
      // const attachmentResponse = await axios.get(path, { responseType: 'blob' });
      // setAttachmentData(URL.createObjectURL(attachmentResponse.data));
      
      // Untuk sederhananya, kita hanya menyimpan path attachment
      setAttachmentData(path);
      setLoading(false);
    } catch (attachmentError) {
      console.error("Error fetching attachment:", attachmentError);
      setAttachmentData(null);
      setLoading(false);
    }
  };

  // Sample static data structure for testing/preview
  const sampleData = {
    project: "Retail - Survey Produk Tambang Mineral & Batuan",
    sample_order_no: "",
    client_order_no: "",
    sender: "",
    client_name: "",
    address: "",
    phone: "",
    fax: "-",
    email: "",
    samples: [
      {
        sample_code: "",
        quantity: "",
        commodity: "",
        type_size: "",
        parameter: "",
        regulation: "-",
        method_of_analysis: ""
      }
    ],
    attachment_name: "",
    attachment_path: "",
    hold_7_days_storage: "", 
    hold_1_month_storage: "", 
    hold_custom_months_storage: ""
  };

  // Use sample data for preview or actual data when available
  const displayData = data || sampleData;
  
  // Format date for display
  const formattedDate = displayData.created_at 
    ? new Date(displayData.created_at).toLocaleDateString('id-ID')
    : new Date().toLocaleDateString('id-ID');

  if (loading) return <div>Loading data...</div>;
  if (error) return <div>Error loading data: {error.message}</div>;

  return (
    <Modal 
      isOpen={isOpen} 
      onRequestClose={onClose} 
      style={customStyles} 
      contentLabel="Print RS1"
    >
      <button onClick={onClose} style={closeButtonStyle}>X</button>
      <PDFViewer width="98%" height="1000px">
        <Document>
          <Page size="A4" style={styles.page}>
            {/* Header dengan Logo */}
            <View style={styles.headerContainer}>
              <Image src="/logo.png" style={styles.logo} />
            </View>
            
            {/* Header dengan Judul dan Info Perusahaan */}
            <View style={styles.formTitleContainer}>
              <View style={styles.formTitleLeft}>
                <Text>RECEIPT SAMPLE FORM 2</Text>
              </View>
              <View style={styles.companyHeader}>
                <Text>LABORATORIUM PT SURVEYOR INDONESIA</Text>
                <Text style={styles.companyAddress}>Jl. Jend. Gatot Subroto Kav 56 Jakarta Selatan</Text>
                
                <View style={{ flexDirection: 'row' }}>
                  <Text style={[styles.companyAddress, { width: 50 }]}>Phone</Text>
                  <Text style={styles.companyAddress}>: (021) 526 5526</Text>
                </View>
                
                <View style={{ flexDirection: 'row' }}>
                  <Text style={[styles.companyAddress, { width: 50 }]}>Fax</Text>
                  <Text style={styles.companyAddress}>: (021) 526 5525</Text>
                </View>
                
                <View style={{ flexDirection: 'row' }}>
                  <Text style={[styles.companyAddress, { width: 50 }]}>Email</Text>
                  <Text style={styles.companyAddress}>: surveyorindonesia@ptsi.co.id</Text>
                </View>
                
                <View style={{ flexDirection: 'row' }}>
                  <Text style={[styles.companyAddress, { width: 50 }]}>Web</Text>
                  <Text style={styles.companyAddress}>: www.ptsi.co.id</Text>
                </View>
              </View>
            </View>

            {/* Project Info Table */}
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={styles.labelCell}><Text>PROJECT</Text></View>
                <View style={styles.valueCell}><Text>: Retail - Survey Produk Tambang Mineral & Batuan</Text></View>
              </View>
              <View style={styles.tableRow}>
                <View style={styles.labelCell}><Text>SAMPLE ORDER NO.</Text></View>
                <View style={styles.valueCell}><Text>: {displayData.sample_order_no}</Text></View>
              </View>
              <View style={styles.tableRow}>
                <View style={styles.labelCell}><Text>CLIENT ORDER NO.</Text></View>
                <View style={styles.valueCell}><Text>: {displayData.client_order_no || '-'}</Text></View>
              </View>
            </View>

            {/* Sender and Order Table */}
            <View style={[styles.table, { marginTop: 5 }]}>
              <View style={styles.senderOrderRow}>
                <View style={styles.senderCell}>
                  <Text style={{ marginTop: 10 }}>SENDER:</Text>
                  {/* Use client_name or sender field for the sender name */}
                  <Text style={{ marginTop: 5 }}>{displayData.client_name || displayData.sender || '-'}</Text>
                  
                  <View style={{ flexDirection: 'row', marginTop: 20 }}>
                    <Text style={{ width: 60 }}>Phone</Text>
                    <Text>: {displayData.phone || '-'}</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', marginTop: 5 }}>
                    <Text style={{ width: 60 }}>Fax</Text>
                    <Text>: {displayData.fax || '-'}</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', marginTop: 5 }}>
                    <Text style={{ width: 60 }}>Email</Text>
                    <Text>: {displayData.email || '-'}</Text>
                  </View>
                  
                  <Text style={{ marginTop: 20 }}>{displayData.address || '-'}</Text>
                </View>
                
                <View style={styles.orderCell}>
                  <Text style={{ marginTop: 5 }}>SUB ORDER/AFFILIATION TO</Text>
                  
                  <View style={{ flexDirection: 'row', marginTop: 5 }}>
                    <Text style={{ width: 140 }}>LAB. PT Surveyor Indonesia</Text>
                    <Text>: AKBAR SANJAYA</Text>
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 20 }}>
                    <Text style={{ width: 140 }}>Phone</Text>
                    <Text>: 0843-9448-9255</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', marginTop: 5 }}>
                    <Text style={{ width: 140 }}>Fax</Text>
                    <Text>: -</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', marginTop: 5 }}>
                    <Text style={{ width: 175 }}>Email</Text>
                    <Text>: adopsptsikendari2023@gmail.com</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', marginTop: 5 }}>
                    <Text style={{ width: 140 }}>Deadline Order</Text>
                    <Text>: Day(s)</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', marginTop: 5 }}>
                    <Text style={{ width: 140 }}>Result Report By</Text>
                    <Text>: -</Text>
                  </View>
                  
                  <Text style={{ marginTop: 10 }}></Text>
                </View>
              </View>
            </View>

            <View style={styles.SampleTitleCenter}>
              <Text>SAMPLE ORDER</Text>
            </View>

            {/* Sample Table */}
            <View style={[styles.table, { marginTop: 5 }]}>
              <View style={styles.sampleTableHeader}>
                <View style={[styles.sampleTableHeaderCell, { width: "12%" }]}><Text>Sample Code</Text></View>
                <View style={[styles.sampleTableHeaderCell, { width: "5%" }]}><Text>QTY</Text></View>
                <View style={[styles.sampleTableHeaderCell, { width: "15%" }]}><Text>Commodity</Text></View>
                <View style={[styles.sampleTableHeaderCell, { width: "10%" }]}><Text>Type / Size</Text></View>
                <View style={[styles.sampleTableHeaderCell, { width: "18%" }]}><Text>Parameter/ Element</Text></View>
                <View style={[styles.sampleTableHeaderCell, { width: "15%" }]}><Text>Regulation</Text></View>
                <View style={[styles.sampleTableHeaderCellLast, { width: "25%" }]}><Text>Method Of Analysis</Text></View>
              </View>

              {/* Make sure samples exist and is an array before mapping */}
              {(displayData.samples && Array.isArray(displayData.samples) ? displayData.samples : []).map((sample, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={styles.sampleNumberCell}><Text>{sample.sample_code || '-'}</Text></View>
                  <View style={styles.qtyCell}><Text>{sample.quantity || '-'}</Text></View>
                  <View style={styles.commodityCell}><Text>{sample.commodity || '-'}</Text></View>
                  <View style={styles.typeSizeCell}><Text>{sample.type_size || '-'}</Text></View>
                  <View style={styles.parameterCell}><Text>{sample.parameter || '-'}</Text></View>
                  <View style={styles.regulationCell}><Text>{sample.regulation || '-'}</Text></View>
                  <View style={styles.methodCell}><Text>{sample.method_of_analysis || '-'}</Text></View>
                </View>
              ))}
            </View>

            {/* Attachment - Ubah menjadi informasi bahwa lampiran ada di halaman berikutnya */}
            <View style={[styles.table, { marginTop: 5 }]}>
              <View style={styles.attachmentRow}>
                <Text>
                  Lampiran: {displayData.attachment_path 
                    ? "Lihat di halaman berikutnya" 
                    : "-"}
                </Text>
              </View>
            </View>

            {/* Notes */}
            <View style={[styles.table, { marginTop: 5 }]}>
              <View style={styles.notesRow}>
                <Text>Notes: {displayData.notes || ''}</Text>
              </View>
            </View>

            {/* Sample Retention */}
            <View style={styles.retentionTable}>
              <View style={styles.retentionRow}>
                <View style={styles.qrCodeCell}>
                  <Text style={{ textAlign: "center", marginTop: 5, marginBottom: 5 }}>Sample Retention</Text>
                  <Image src="/akbar.png" style={styles.qrCode} />
                  <Text style={{ textAlign: "center", marginTop: 5 }}>AKBAR SANJAYA</Text>
                  <Text style={{ textAlign: "center" }}>0843-9448-9255</Text>
                </View>
                <View style={styles.retentionInfoCell}>
                  <Text style={{ marginTop: 10, flexDirection: 'row' }}>
                    Hold 7 Days Storage in Lab PT. SI: {displayData.hold_7_days_storage === true || displayData.hold_7_days_storage === "true" || displayData.hold_7_days_storage === 1 ? '✓' : '□'}
                  </Text>
                  <Text style={{ marginTop: 10, flexDirection: 'row' }}>
                    Hold 1 Month Storage in Lab PT. SI: {displayData.hold_1_month_storage === true || displayData.hold_1_month_storage === "true" || displayData.hold_1_month_storage === 1 ? '✓' : '□'}
                  </Text>
                  <Text style={{ marginTop: 10, flexDirection: 'row' }}>
                    Hold {displayData.hold_custom_months_storage > 0 ? displayData.hold_custom_months_storage : '_____'} Months Storage To Client: {displayData.hold_custom_months_storage > 0 ? '✓' : '□'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footerRow}>
              <View style={styles.signatureCell}>
                <Text>Signed</Text>
              </View>
              <View style={styles.dateCell}>
                <Text>Date : {formattedDate}</Text>
              </View>
            </View>
          </Page>
          
          {/* Halaman lampiran - hanya ditampilkan jika ada attachment */}
          {displayData.attachment_path && (
              <Page size="A4" style={styles.attachmentPage}>

                {/* Jika bukan gambar, tampilkan informasi bahwa lampiran tersedia */}
                {displayData.attachment_path && !attachmentData && (
                  <View style={{ marginTop: 50, alignItems: "center" }}>
                    <Text>
                      Lampiran tersedia di: {displayData.attachment_path}
                    </Text>
                    <Text style={{ marginTop: 10 }}>
                      Silakan akses manual melalui sistem untuk melihat lampiran
                    </Text>
                  </View>
                )}


                {/* Tampilkan lampiran sebagai gambar jika format mendukung */}
                {attachmentData && (
                  <Image
                    src={attachmentData} 
                    style={styles.attachmentImage}
                  />
                )}
                
                {/* Footer */}
                <View style={[styles.footerRow, { marginTop: 'auto' }]}>
                  <View style={styles.signatureCell}>
                    <Text></Text>
                  </View>
                  <View style={{ marginTop: 20 }}>
                  <Text style={{ fontSize: 10, textAlign: "left", marginBottom: 10 }}>
                    {displayData.sample_order_no}
                    <Text>,</Text>
                    <Text>{formattedDate}</Text>
                  </Text>
                </View>
                </View>
              </Page>
            )}
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

export default PrintRS2Modal;