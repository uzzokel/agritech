"use client";

import { useEffect, useState } from "react";
import { getFarmerRecords } from "../actions";

export interface FarmerRecord {
  id: string;
  fullName: string;
  age: number;
  gender: string;
  highestEducation: string;
  maritalStatus: string;
  householdSize?: number | null;
  state: string;
  lga: string;
  cluster: string;
  userGroup: string;
  nameOfChosenEnterprise: string;
  typeOfEnterprise: string;
  estimatedAnnualIncome: number;
  phoneNumber: string;
  photoUrl?: string | null;
  createdAt: Date | string;
}

export default function FarmerTable() {
  const [farmers, setFarmers] = useState<FarmerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCluster, setSelectedCluster] = useState("");

  const fetchRecords = async () => {
    setIsLoading(true);
    const res = await getFarmerRecords();
    if (res.success && res.data) {
      setFarmers(res.data as FarmerRecord[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Filtered farmers based on Search & Select Dropdowns
  const filteredFarmers = farmers.filter((farmer) => {
    const matchesSearch =
      farmer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.phoneNumber.includes(searchTerm) ||
      farmer.userGroup.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesState = selectedState === "" || farmer.state === selectedState;
    const matchesCluster = selectedCluster === "" || farmer.cluster === selectedCluster;

    return matchesSearch && matchesState && matchesCluster;
  });

  // Unique dropdown lists
  const uniqueStates = Array.from(new Set(farmers.map((f) => f.state))).filter(Boolean);
  const uniqueClusters = Array.from(new Set(farmers.map((f) => f.cluster))).filter(Boolean);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      
      {/* HEADER & PRINT ACTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Registered Farmers</h2>
          <p className="text-xs text-gray-500">
            Total Records: <span className="font-semibold text-emerald-700">{filteredFarmers.length}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchRecords}
            className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Refresh
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 shadow-sm transition"
          >
            Print Summary / Export
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 print:hidden">
        <input
          type="text"
          placeholder="Search name, phone, or group..."
          className="px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
        >
          <option value="">All States</option>
          {uniqueStates.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>

        <select
          className="px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
          value={selectedCluster}
          onChange={(e) => setSelectedCluster(e.target.value)}
        >
          <option value="">All Clusters</option>
          {uniqueClusters.map((cluster) => (
            <option key={cluster} value={cluster}>
              {cluster}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE DATA */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-gray-500">Loading farmer records...</div>
      ) : filteredFarmers.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-500">No farmer records found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-emerald-50 text-emerald-900 border-b border-emerald-100">
                <th className="py-3 px-3">Photo</th>
                <th className="py-3 px-3">Full Name</th>
                <th className="py-3 px-3">Gender / Age</th>
                <th className="py-3 px-3">Location (State / LGA)</th>
                <th className="py-3 px-3">Cluster</th>
                <th className="py-3 px-3">User Group</th>
                <th className="py-3 px-3">Enterprise</th>
                <th className="py-3 px-3">Est. Income (₦)</th>
                <th className="py-3 px-3">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFarmers.map((farmer) => (
                <tr key={farmer.id} className="hover:bg-gray-50 transition">
                  <td className="py-2 px-3">
                    {farmer.photoUrl ? (
                      <img
                        src={farmer.photoUrl}
                        alt={farmer.fullName}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-[10px]">
                        {farmer.fullName.charAt(0)}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-3 font-semibold text-gray-800">{farmer.fullName}</td>
                  <td className="py-2 px-3 text-gray-600">{farmer.gender}, {farmer.age} yrs</td>
                  <td className="py-2 px-3 text-gray-600">{farmer.state}, {farmer.lga}</td>
                  <td className="py-2 px-3 text-gray-600">{farmer.cluster}</td>
                  <td className="py-2 px-3 text-gray-600">{farmer.userGroup}</td>
                  <td className="py-2 px-3 text-gray-600">
                    <span className="font-medium text-gray-800">{farmer.nameOfChosenEnterprise}</span>
                    <br />
                    <span className="text-[10px] text-gray-400">{farmer.typeOfEnterprise}</span>
                  </td>
                  <td className="py-2 px-3 font-medium text-emerald-700">
                    ₦{farmer.estimatedAnnualIncome.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-gray-600">{farmer.phoneNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}