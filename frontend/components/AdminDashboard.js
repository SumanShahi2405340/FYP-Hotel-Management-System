import { useState } from 'react';

export default function AdminDashboard() {
  const [hotels, setHotels] = useState([
    { id: 1, name: 'Hotel Everest', location: 'Kathmandu', contact: 'everest@example.com', reviews: '4.5/5', status: 'Active' },
    { id: 2, name: 'Hotel Sunshine', location: 'Pokhara', contact: 'sunshine@example.com', reviews: '4.2/5', status: 'Active' },
    { id: 3, name: 'KailashINN', location: 'NPJ', contact: '999999', reviews: '9.9', status: 'Inactive' },
  ]);

  const [view, setView] = useState('none');

  const handleRemove = (id) => {
    setHotels(hotels.filter(h => h.id !== id));
  };

  const handleToggleStatus = (id) => {
    setHotels(hotels.map(h =>
      h.id === id ? { ...h, status: h.status === 'Active' ? 'Inactive' : 'Active' } : h
    ));
  };

  const filteredHotels = view === 'active'
    ? hotels.filter(h => h.status === 'Active')
    : view === 'inactive'
    ? hotels.filter(h => h.status === 'Inactive')
    : hotels;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Top bar: Admin Dashboard title + vertical Register Hotel button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-600">Admin Dashboard</h1>

   

  {/* Plus icon box with label below */}
  <div className="flex flex-col items-center">
    <button
      onClick={() => alert('Register Hotel clicked')}
      className="bg-green-600 hover:bg-green-700 text-white w-10 h-10 rounded flex items-center justify-center text-xl font-bold"
    >
      +
    </button>
    <span className="text-sm font-semibold mt-1">Register Hotel</span>
  </div>
</div>

      

      {/* View Toggle Buttons */}
      <div className="flex justify-center gap-2 mb-4">
        <button onClick={() => setView(view === 'all' ? 'none' : 'all')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
          All Hotels
        </button>
        <button onClick={() => setView(view === 'inactive' ? 'none' : 'inactive')} className="bg-red-600 text-white px-3 py-1 rounded text-sm">
          Inactive Hotels
        </button>
        <button onClick={() => setView(view === 'active' ? 'none' : 'active')} className="bg-green-600 text-white px-3 py-1 rounded text-sm">
          Active Hotels
        </button>
      </div>

      {/* Hotel Table */}
      {view !== 'none' && (
        <div className="bg-white p-4 rounded shadow-lg overflow-x-auto">
          <p className="mb-2 font-semibold text-sm">
            {view === 'all' && `Total Hotels: ${hotels.length}`}
            {view === 'active' && `Active Hotels: ${filteredHotels.length}`}
            {view === 'inactive' && `Inactive Hotels: ${filteredHotels.length}`}
          </p>

          <table className="table-fixed w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-1 w-[120px]">Hotel Name</th>
                <th className="border p-1 w-[100px]">Location</th>
                <th className="border p-1 w-[120px]">Contact</th>
                <th className="border p-1 w-[100px]">Reviews</th>
                <th className="border p-1 w-[80px]">Status</th>
                <th className="border p-1 w-[220px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHotels.map((hotel, index) => (
                <tr key={hotel.id}>
                  <td className="border p-1">{index + 1}. {hotel.name}</td>
                  <td className="border p-1">{hotel.location}</td>
                  <td className="border p-1">{hotel.contact}</td>
                  <td className="border p-1">{hotel.reviews}</td>
                  <td className="border p-1">{hotel.status}</td>

                  {/* Actions cell */}
                  <td className="border p-1 whitespace-nowrap">
                    <div className="flex flex-row items-center gap-2">
                      <button
                        onClick={() => alert(`Visiting profile of ${hotel.name}`)}
                        className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs"
                      >
                        Profile
                      </button>

                      {hotel.status === 'Active' ? (
                        <button
                          onClick={() => handleToggleStatus(hotel.id)}
                          className="bg-yellow-500 text-white px-2 py-0.5 rounded text-xs"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(hotel.id)}
                          className="bg-green-500 text-white px-2 py-0.5 rounded text-xs"
                        >
                          Activate
                        </button>
                      )}

                      {view === 'all' && (
                        <button
                          onClick={() => handleRemove(hotel.id)}
                          className="bg-red-500 text-white px-2 py-0.5 rounded text-xs"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
