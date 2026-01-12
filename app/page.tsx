import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-8 p-8">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">Sistem Antrian</h1>
          <h2 className="text-3xl font-semibold text-indigo-600">Rumah Sakit</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link 
            href="/ambil-nomor"
            className="group px-8 py-12 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Ambil Nomor</h3>
            <p className="text-gray-600">Untuk Pasien</p>
          </Link>
          <Link 
            href="/mesin-tiket"
            className="group px-8 py-12 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            <div className="text-6xl mb-4">🖨️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Mesin Tiket</h3>
            <p className="text-gray-600">Ambil & Cetak Nomor</p>
          </Link>
          <Link 
            href="/admin"
            className="group px-8 py-12 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            <div className="text-6xl mb-4">👨‍⚕️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h3>
            <p className="text-gray-600">Kelola Antrian</p>
          </Link>
          <Link 
            href="/display"
            className="group px-8 py-12 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Display TV</h3>
            <p className="text-gray-600">Tampilan Antrian</p>
          </Link>
        </div>
      </div>
    </div>
  );
}