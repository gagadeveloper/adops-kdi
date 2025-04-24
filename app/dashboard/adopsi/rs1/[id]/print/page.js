"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

const RS1Page = () => {
  const { id: rs1Id } = useParams(); // Ambil ID dari URL
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rs1Id) return;
    
    // Fetch data RS1 berdasarkan ID
    const fetchRS1 = async () => {
      try {
        const response = await fetch(`/api/rs1/${rs1Id}`);
        if (!response.ok) throw new Error("Data tidak ditemukan");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching RS1 data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRS1();
  }, [rs1Id]);

  const handlePrint = async () => {
    if (!rs1Id) {
      alert("ID RS1 tidak ditemukan!");
      return;
    }

    try {
      console.log("Mencoba fetch PDF untuk ID:", rs1Id);
      const response = await fetch(`/api/print-rs1/${rs1Id}`);
      
      if (!response.ok) {
        throw new Error(`Gagal mengunduh PDF: ${response.status} - ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url);
    } catch (error) {
      console.error("Error saat mencetak:", error);
      alert("Gagal mencetak RS1. Cek console untuk detail.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>Data RS1 tidak ditemukan.</p>;

  return (
    <div>
      <h1>Detail RS1 - {data.sample_order_no}</h1>
      <button onClick={handlePrint}>Print RS1</button>
    </div>
  );
};

export default RS1Page;
