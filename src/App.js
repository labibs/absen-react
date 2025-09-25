import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';
import axios from 'axios'; // Pastikan axios sudah di-install: npm install axios

const App = () => {
  const [nik, setNik] = useState('');
  const [status, setStatus] = useState('');
  const [jarak, setJarak] = useState(null);
  const [kantorTerdekat, setKantorTerdekat] = useState('');

  const kantorLocations = [
    { name: "JNE Cilacap", latitude: -7.703791784344155, longitude: 109.02706575208764 },
    { name: "KP Tritih", latitude: -7.6436984059273625, longitude: 109.03945539274153 },
    { name: "KP Jeruklegi", latitude: -7.622739973947992, longitude: 109.02027662866101 },
    { name: "KP Jeruklegi", latitude: -7.623527514340614, longitude: 109.01967888209312 },
    { name: "Pickup Jambusari", latitude: -7.570450003947906, longitude: 109.0257079820926 },
    { name: "KP Bantarsari", latitude: -7.553852092912492, longitude: 108.88562791441512 },
    { name: "KP Bantarsari", latitude: -7.556101357393882, longitude: 108.88581543810471 },
    { name: "Kawunganten", latitude: -7.597121637889708, longitude: 108.92088169558562 },
    { name: "Kawunganten", latitude: -7.596978029880988, longitude: 108.92066665149882 },
    { name: "KP Sidareja", latitude: -7.485411168876285, longitude: 108.8010667954 },
    { name: "KP Cimanggu", latitude: -7.356556746125122, longitude: 108.84221591667256 },
    { name: "KP Majenang", latitude: -7.298644648842441, longitude: 108.76225156021464 },
    { name: "KP Majenang", latitude: -7.299063, longitude: 108.761253 },
    { name: "KP Kesugihan", latitude: -7.6200721020375255, longitude: 109.11965779985853 }
  ];

  const radiusDiterima = 100;

  const hitungJarakMeter = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const toRad = (x) => (x * Math.PI) / 180;
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  };

  const handleValidasiNIKdanLokasi = async () => {
    if (!nik) {
      setStatus('❌ Harap isi NIK terlebih dahulu.');
      return;
    }

    setStatus('🔄 Memvalidasi NIK ke server...');

    try {
      // 🔁 Kirim NIK ke backend Laravel
      const response = await axios.post('https://jne-cilacap.com/slip/public/api/cek-nik', {
        nik: nik
      });

      const data = response.data;

      if (data.valid && data.message) {
        // ✅ NIK valid, lanjut proses lokasi
        const namaKaryawan = data.message; // bisa juga data.data.nama_depan kalau backend kamu ubah
        setStatus(`✅ NIK valid (${namaKaryawan}). Sedang cek lokasi...`);

        if (!navigator.geolocation) {
          setStatus('❌ Browser tidak mendukung geolocation.');
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            let ditemukan = false;
            let kantorTerdekat = null;
            let jarakTerdekat = Infinity;

            kantorLocations.forEach((kantor) => {
              const distance = hitungJarakMeter(
                userLat,
                userLng,
                kantor.latitude,
                kantor.longitude
              );

              if (distance <= radiusDiterima && distance < jarakTerdekat) {
                ditemukan = true;
                jarakTerdekat = distance;
                kantorTerdekat = kantor.name;
              }
            });

            if (ditemukan) {
              setStatus(`✅ ${namaKaryawan} berhasil absen di lokasi: ${kantorTerdekat}`);
              setKantorTerdekat(kantorTerdekat);
              setJarak(jarakTerdekat.toFixed(2));
            } else {
              setStatus(`❌ ${namaKaryawan} di luar semua area kantor.`);
              setKantorTerdekat('');
              setJarak(null);
            }
          },
          (error) => {
            console.error(error);
            setStatus('❌ Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.');
          }
        );
      } else {
        // ❌ NIK tidak valid (data.valid false)
        setStatus('❌ NIK tidak ditemukan.');
      }

    } catch (error) {
      console.error('Error saat request:', error);

      // Coba tampilkan error dari server jika ada response
      if (error.response && error.response.data) {
        setStatus(`❌ Error: ${error.response.data.message || 'Server error'}`);
      } else {
        setStatus('❌ Gagal menghubungi server.');
      }
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h2>Validasi NIK dan Lokasi Kantor</h2>

      <input
        type="text"
        placeholder="Masukkan NIK"
        value={nik}
        onChange={(e) => setNik(e.target.value)}
        style={{ marginBottom: 10, padding: 8, width: '100%', maxWidth: 300 }}
      />

      <br />
      <button onClick={handleValidasiNIKdanLokasi}>Cek NIK & Lokasi</button>

      <p>{status}</p>
      {jarak && <small>Jarak ke kantor: {jarak} meter</small>}
    </div>
  );
};

export default App;



