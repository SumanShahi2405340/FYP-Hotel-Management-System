// components/ViewEarnings.jsx
"use client";
import React, { useState } from "react";
import { Pie, Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const dummyEarnings = {
  monthly: [
    {
      month: "January",
      earnings: 120000,
      expenses: { foodAndSnacks: -30000, bathroomEssentials: -3000, roomSupplies: -8000 },
    },
    {
      month: "February",
      earnings: 150000,
      expenses: { foodAndSnacks: -30000, bathroomEssentials: -4000, roomSupplies: -8000 },
    },
    {
      month: "March",
      earnings: 180000,
      expenses: { foodAndSnacks: -45000, bathroomEssentials: -6000, roomSupplies: -12000 },
    },
  ],
  yearly: [
    {
      year: 2022,
      earnings: 1500000,
      expenses: { foodAndSnacks: -500000, bathroomEssentials: -60000, roomSupplies: -120000 },
    },
    {
      year: 2023,
      earnings: 1750000,
      expenses: { foodAndSnacks: -520000, bathroomEssentials: -65000, roomSupplies: -130000 },
    },
    {
      year: 2024,
      earnings: 1900000,
      expenses: { foodAndSnacks: -540000, bathroomEssentials: -70000, roomSupplies: -140000 },
    },
  ],
};

export default function ViewEarnings() {
  const [filter, setFilter] = useState("monthly");

  const calculateTotal = (item) => {
    const { earnings, expenses } = item;
    return earnings + expenses.foodAndSnacks + expenses.bathroomEssentials + expenses.roomSupplies;
  };

  return (
    <div style={{ marginTop: "20px" }}>
      {/* Filter buttons */}
      <div style={{ marginBottom: "10px" }}>
        <button
          onClick={() => setFilter("monthly")}
          style={{
            padding: "8px 16px",
            marginRight: "10px",
            backgroundColor: filter === "monthly" ? "#ffc107" : "#f0f0f0",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Monthly
        </button>
        <button
          onClick={() => setFilter("yearly")}
          style={{
            padding: "8px 16px",
            backgroundColor: filter === "yearly" ? "#ffc107" : "#f0f0f0",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Yearly
        </button>
      </div>

      {/* Earnings Table */}
      <table border="1" cellPadding="10" style={{ width: "100%", textAlign: "left" }}>
        <thead>
          <tr>
            {filter === "monthly" ? (
              <>
                <th>Month</th>
                <th>Estimated Earnings ($)</th>
                <th>Food & Snacks ($)</th>
                <th>Bathroom Essentials ($)</th>
                <th>Room Supplies ($)</th>
                <th>Total Earnings ($)</th>
              </>
            ) : (
              <>
                <th>Year</th>
                <th>Estimated Earnings ($)</th>
                <th>Food & Snacks ($)</th>
                <th>Bathroom Essentials ($)</th>
                <th>Room Supplies ($)</th>
                <th>Total Earnings ($)</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {dummyEarnings[filter].map((item, index) => (
            <tr key={index}>
              <td>{filter === "monthly" ? item.month : item.year}</td>
              <td>{item.earnings}</td>
              <td>{item.expenses.foodAndSnacks}</td>
              <td>{item.expenses.bathroomEssentials}</td>
              <td>{item.expenses.roomSupplies}</td>
              <td>{calculateTotal(item)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Digital Revenue Insights Section */}
      <div
        style={{
          marginTop: "40px",
          backgroundColor: "#111",
          padding: "20px",
          borderRadius: "10px",
          color: "#0ff",
          fontSize: "12px",
        }}
      >
        <h3 style={{ fontSize: "18px", marginBottom: "20px" }}>Digital Revenue Insights</h3>

        {/* Grid layout for charts */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
          {/* Pie Charts */}
          <div style={{ flex: "1 1 250px", height: "200px" }}>
            <h4 style={{ fontSize: "14px" }}>January Expenses</h4>
            <Pie
              data={{
                labels: ["Food & Snacks", "Bathroom Essentials", "Room Supplies"],
                datasets: [
                  { data: [30000, 3000, 8000], backgroundColor: ["#00ffff", "#00ff99", "#0099ff"] },
                ],
              }}
              options={{ maintainAspectRatio: false }}
            />
          </div>
          <div style={{ flex: "1 1 250px", height: "200px" }}>
            <h4 style={{ fontSize: "14px" }}>February Expenses</h4>
            <Pie
              data={{
                labels: ["Food & Snacks", "Bathroom Essentials", "Room Supplies"],
                datasets: [
                  { data: [30000, 4000, 8000], backgroundColor: ["#00ffff", "#00ff99", "#0099ff"] },
                ],
              }}
              options={{ maintainAspectRatio: false }}
            />
          </div>

          {/* Circular Progress Indicators */}
          {["January", "February"].map((month, i) => {
            const estimated = dummyEarnings.monthly[i].earnings;
            const total = calculateTotal(dummyEarnings.monthly[i]);
            const percent = Math.round((total / estimated) * 100);
            return (
              <div key={month} style={{ flex: "1 1 150px", height: "150px" }}>
                <h4 style={{ fontSize: "12px" }}>{month} Retained</h4>
                <Doughnut
                  data={{
                    labels: ["Retained", "Spent"],
                    datasets: [
                      { data: [percent, 100 - percent], backgroundColor: ["#00ff99", "#333"] },
                    ],
                  }}
                  options={{ maintainAspectRatio: false }}
                />
                <div
                  style={{
                    position: "relative",
                    top: "-100px",
                    textAlign: "center",
                    fontSize: "16px",
                    color: "#0ff",
                  }}
                >
                  {percent}%
                </div>
              </div>
            );
          })}

          {/* Monthly Earnings Bar Chart */}
          <div style={{ flex: "1 1 400px", height: "200px" }}>
            <h4 style={{ fontSize: "14px" }}>Monthly Earnings</h4>
            <Bar
              data={{
                labels: ["January", "February", "March"],
                datasets: [
                  {
                    label: "Total Earnings",
                    data: [
                      calculateTotal(dummyEarnings.monthly[0]),
                      calculateTotal(dummyEarnings.monthly[1]),
                      calculateTotal(dummyEarnings.monthly[2]),
                    ],
                    backgroundColor: "#00ff99",
                  },
                ],
              }}
              options={{ maintainAspectRatio: false }}
            />
          </div>

          {/* Yearly Earnings Bar Chart */}
          <div style={{ flex: "1 1 400px", height: "200px" }}>
            <h4 style={{ fontSize: "14px" }}>Yearly Earnings</h4>
            <Bar
              data={{
                labels: ["2022", "2023", "2024"],
                datasets: [
                  {
                    label: "Total Earnings",
                    data: [
                      calculateTotal(dummyEarnings.yearly[0]),
                      calculateTotal(dummyEarnings.yearly[1]),
                      calculateTotal(dummyEarnings.yearly[2]),
                    ],
                    backgroundColor: "#0099ff",
                  },
                ],
              }}
              options={{ maintainAspectRatio: false }}
            />
          </div>
                 {/* Estimated Earnings Line Chart */}
              <div style={{ flex: "1 1 400px", height: "200px" }}>
                <h4 style={{ fontSize: "14px" }}>Estimated Earnings Trend</h4>
                <Line
                  data={{
                    labels: ["January", "February", "March"],
                    datasets: [
                      {
                        label: "Estimated",
                        data: [120000, 150000, 180000],
                        borderColor: "#00ffff",
                        backgroundColor: "rgba(0,255,255,0.2)",
                        fill: true,
                        tension: 0.4,
                      },
                    ],
                  }}
                  options={{ maintainAspectRatio: false }}
                />
              </div>

              {/* Total Earnings Line Chart */}
              <div style={{ flex: "1 1 400px", height: "200px" }}>
                <h4 style={{ fontSize: "14px" }}>Total Earnings Trend</h4>
                <Line
                  data={{
                    labels: ["January", "February", "March"],
                    datasets: [
                      {
                        label: "Total Earnings",
                        data: [
                          calculateTotal(dummyEarnings.monthly[0]),
                          calculateTotal(dummyEarnings.monthly[1]),
                          calculateTotal(dummyEarnings.monthly[2]),
                        ],
                        borderColor: "#00ff99",
                        backgroundColor: "rgba(0,255,153,0.2)",
                        fill: true,
                        tension: 0.4,
                      },
                    ],
                  }}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
        </div>
      </div>
    </div>
  );
}
