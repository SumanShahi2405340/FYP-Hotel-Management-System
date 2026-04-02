"use client";
import React from "react";

export default function AboutUs() {
  return (
    <div
      className="relative min-h-screen flex flex-col"
      style={{
        backgroundImage: "url('/5.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Dark overlay for readability and dramatic effect */}
      <div className="absolute inset-0 bg-black/70 z-0"></div>

      {/* Content container with higher z-index */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section - inspired by the main branding */}
        <div className="text-center py-20 px-4 pt-24">
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
            About <span className="text-green-400">CloudInn</span>
          </h1>
          <p className="text-white/70 text-xl mt-4 max-w-2xl mx-auto">
            Manage Every Moment of a Perfect Stay
          </p>
          <div className="w-24 h-1 bg-green-400 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Main Content */}
        <div className="flex-grow max-w-7xl mx-auto px-6 md:px-8 w-full">
          {/* Our Foundation Section: Story, Mission, Why Choose Us */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Our <span className="text-green-400">Foundation</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Story Card */}
              <div className="group bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 shadow-xl">
                <div className="text-5xl mb-4">📖</div>
                <h3 className="text-2xl font-semibold text-white mb-3">Our Story</h3>
                <p className="text-white/70 leading-relaxed">
                  CloudInn was founded with a vision to simplify hotel management and
                  enhance guest experiences. We blend classic hospitality values with
                  modern digital solutions, ensuring every stay feels effortless.
                </p>
              </div>

              {/* Mission Card */}
              <div className="group bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 shadow-xl">
                <div className="text-5xl mb-4">🚀</div>
                <h3 className="text-2xl font-semibold text-white mb-3">Our Mission</h3>
                <p className="text-white/70 leading-relaxed">
                  To empower hotels with seamless booking, payment, and guest management
                  systems while keeping the human touch at the heart of hospitality.
                </p>
              </div>

              {/* Why Choose Us Card */}
              <div className="group bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 shadow-xl">
                <div className="text-5xl mb-4">💎</div>
                <h3 className="text-2xl font-semibold text-white mb-3">Why Choose Us?</h3>
                <ul className="text-white/70 space-y-2 list-disc list-inside">
                  <li>Reliable and secure payment integrations</li>
                  <li>Intuitive dashboards for staff and guests</li>
                  <li>24/7 support and continuous innovation</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Core Capabilities Section - matching the Admin/Owner/Receptionist cards from theme */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white">
                Integrated Hotel Management – <span className="text-green-400">Our Pillars</span>
              </h2>
              <p className="text-white/60 mt-2 text-lg">SELECT YOUR ROLE · EMPOWER YOUR TEAM</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Full System Access - Admin */}
              <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-center hover:border-green-400/60 transition-all duration-300 hover:-translate-y-1">
                <div className="text-4xl mb-3">🔒</div>
                <h3 className="text-2xl font-bold text-white mb-2">Full System Access</h3>
                <p className="text-green-400 text-sm uppercase tracking-wider mb-3">Admin · Complete Control</p>
                <p className="text-white/60 text-sm">
                  Granular permissions, analytics, and full configuration across properties.
                </p>
              </div>

              {/* Business Oversight - Owner */}
              <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-center hover:border-green-400/60 transition-all duration-300 hover:-translate-y-1">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-2xl font-bold text-white mb-2">Business Oversight</h3>
                <p className="text-green-400 text-sm uppercase tracking-wider mb-3">Owner · Strategic Insights</p>
                <p className="text-white/60 text-sm">
                  Real-time revenue reports, occupancy trends, and performance forecasting.
                </p>
              </div>

              {/* Front Desk Operations - Receptionist */}
              <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-center hover:border-green-400/60 transition-all duration-300 hover:-translate-y-1">
                <div className="text-4xl mb-3">🖥️</div>
                <h3 className="text-2xl font-bold text-white mb-2">Front Desk Operations</h3>
                <p className="text-green-400 text-sm uppercase tracking-wider mb-3">Receptionist · Daily Flow</p>
                <p className="text-white/60 text-sm">
                  Streamlined check-in/out, guest messaging, and room assignment made simple.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Elegant Quote */}
          <div className="text-center my-16 py-8 border-t border-white/10 border-b border-white/10">
            <p className="text-white/80 italic text-xl max-w-3xl mx-auto">
              “Where technology meets genuine hospitality — every stay, every moment,
              perfectly managed.”
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center p-6 bg-black/60 backdrop-blur-sm text-white/70 text-sm mt-auto border-t border-white/10">
          © 2026 CloudInn. All rights reserved. — Designed for seamless hotel experiences.
        </footer>
      </div>
    </div>
  );
}