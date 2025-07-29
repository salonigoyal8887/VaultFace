"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

// Color palette
const colors = {
  darkGreen: "#042A2B",
  mossGreen: "#918868",
  aliceBlue: "#E8F0FF",
  mediumSlateBlue: "#6874E8",
  richBlack: "#0E0F19",
  teal: "#008080",
  darkTeal: "#005353", // Added dark teal for footer
  black: "#000000"
};

// Background slide component
const BackgroundSlide = ({ active, children }: { active: boolean; children: React.ReactNode }) => (
  <div 
    className={cn(
      "absolute inset-0 transition-opacity duration-1000",
      active ? "opacity-100" : "opacity-0"
    )}
  >
    {children}
  </div>
);

// Feature slide component
const FeatureSlide = ({ active, children }: { active: boolean; children: React.ReactNode }) => (
  <div 
    className={cn(
      "transition-all duration-2000 transform", // Slowed down to 2 seconds
      active ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full absolute"
    )}
  >
    {children}
  </div>
);

export default function Home() {
  const { user } = useAuth();
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const supportRef = useRef<HTMLDivElement>(null);
  
  // Sliding background effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sliding features effect - slowed down to 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSupport = () => {
    supportRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Individual features for sliding
  const features = [
    { 

      title: "Track Income & Expenses", 
      desc: "Monitor your daily, monthly, and yearly financial transactions with ease. Get a complete overview of where your money goes.",
      image: "/file.svg"
    },
    { 
     
      title: "AI-Powered Insights", 
      desc: "Get intelligent suggestions based on your spending patterns. Our AI helps you make smarter financial decisions.",
      image: "/globe.svg"
    },
    { 
      
      title: "Visual Analytics", 
      desc: "Beautiful charts for trends, categories, and savings. Visualize your financial health with intuitive graphs.",
      image: "/window.svg"
    },
    { 
      
      title: "Receipt OCR", 
      desc: "Scan receipts and upload PDFs to auto-extract transactions. Save time on manual data entry with our smart recognition.",
      image: "/file.svg"
    },
    { 
     
      title: "Export to PDF", 
      desc: "Generate your own financial statement anytime. Create professional reports for personal use or financial planning.",
      image: "/window.svg"
    },
    { 
       
      title: "Secure Cloud Backup", 
      desc: "All your data stored securely using Firebase. Rest easy knowing your financial information is protected.",
      image: "/globe.svg"
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col bg-white text-black">
      {/* Sliding Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        // ... existing code ...
      </div>

      {/* Header / Navigation - Dark shade with centered nav */}
      <header className="relative z-10 flex items-center justify-between p-6 bg-gray-900">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-white">VaultFace</h2>
        </div>
        <nav className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center space-x-8">
          <a href="#features" className="text-white hover:text-teal-400 transition">Features</a>
          <a href="#how-it-works" className="text-white hover:text-teal-400 transition">How It Works</a>
          <a href="#" onClick={scrollToSupport} className="text-white hover:text-teal-400 transition">Support</a>
        </nav>
        <div className="invisible md:visible">{/* Spacer to maintain layout */}</div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col">
        {/* Hero Section - Juspay Style */}
        <section className="flex-1 flex items-center justify-center px-6 py-20 text-center">
          <div className="max-w-4xl w-full space-y-8">
            <div className="inline-block bg-white/10 backdrop-blur-sm px-4 py-1 rounded-full">
              <p className="text-sm text-teal-600 font-medium">Trusted by 10,000+ users worldwide</p>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight text-black">
              Your Ultimate <span className="text-teal-600">AI Finance</span> Assistant
            </h1>
            <p className="text-xl md:text-2xl text-teal-800 max-w-3xl mx-auto">
              Simplify your finances with intelligent insights, automated tracking, and secure management
            </p>
            <div className="pt-8 flex flex-wrap justify-center gap-4">
              {user ? (
                <Link href="/dashboard">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white text-lg px-8 py-3 rounded-md shadow-lg">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white text-lg px-8 py-3 rounded-md shadow-lg">
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button className="bg-transparent border border-teal-600 text-teal-600 hover:bg-teal-50 text-lg px-8 py-3 rounded-md">
                      Login
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            {/* Social Proof/Metrics - Juspay Style */}
            <div className="pt-12 flex flex-wrap justify-center gap-8">
              <div className="bg-white shadow-md px-6 py-3 rounded-lg">
                <p className="text-3xl font-bold text-teal-600">10,000+</p>
                <p className="text-sm text-teal-800">Active Users</p>
              </div>
              <div className="bg-white shadow-md px-6 py-3 rounded-lg">
                <p className="text-3xl font-bold text-teal-600">99.9%</p>
                <p className="text-sm text-teal-800">Uptime</p>
              </div>
              <div className="bg-white shadow-md px-6 py-3 rounded-lg">
                <p className="text-3xl font-bold text-teal-600">256-bit</p>
                <p className="text-sm text-teal-800">Encryption</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Feature Overview with Bigger Card-Style Slides - Juspay Style */}
        <section id="features" className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block bg-teal-50 px-4 py-1 rounded-full mb-4">
                <p className="text-sm text-teal-600 font-medium">POWERFUL FEATURES</p>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">Everything You Need</h2>
              <p className="text-teal-800 max-w-2xl mx-auto">Comprehensive tools to manage your finances with ease and intelligence</p>
            </div>
            
            {/* Larger card-style slide components with heading/description/image layout */}
            <div className="relative h-[500px] bg-white rounded-xl shadow-lg overflow-hidden">
              {features.map((feature, index) => (
                <FeatureSlide key={index} active={activeFeature === index}>
                  <div className="h-full w-full flex flex-col md:flex-row p-8">
                    <div className="md:w-1/2 flex flex-col justify-center pr-8">
                      <h3 className="text-4xl font-bold text-black mb-6">{feature.title}</h3>
                      <p className="text-teal-800 text-xl mb-8">{feature.desc}</p>
                      <div className="bg-teal-50 w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4">
                        {/* {feature.icon} */}
                      </div>
                    </div>
                    <div className="md:w-1/2 flex items-center justify-center">
                      <div className="bg-teal-50 rounded-xl p-8 w-full h-[300px] flex items-center justify-center">
                        <img 
                          src={feature.image} 
                          alt={feature.title} 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </FeatureSlide>
              ))}
              
              {/* Feature navigation dots */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-3">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveFeature(index)}
                    className={`w-4 h-4 rounded-full ${activeFeature === index ? 'bg-teal-600' : 'bg-teal-200'}`}
                    aria-label={`View feature ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* How It Works - Juspay Style */}
        <section id="how-it-works" className="py-20 px-6 bg-teal-50">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block bg-white px-4 py-1 rounded-full mb-4">
              <p className="text-sm text-teal-600 font-medium">HOW IT WORKS</p>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-12">Simple 3-Step Process</h2>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center">
              <div className="flex-1 flex flex-col items-center bg-white p-8 rounded-xl shadow-sm">
                <div className="w-16 h-16 rounded-full bg-teal-600 text-white flex items-center justify-center text-2xl font-bold mb-4">1</div>
                <h3 className="text-xl font-semibold text-black mb-2">Connect</h3>
                <p className="text-teal-800">Sign up and securely connect your financial accounts</p>
              </div>
              
              <div className="hidden md:block text-4xl text-teal-600">→</div>
              
              <div className="flex-1 flex flex-col items-center bg-white p-8 rounded-xl shadow-sm">
                <div className="w-16 h-16 rounded-full bg-teal-600 text-white flex items-center justify-center text-2xl font-bold mb-4">2</div>
                <h3 className="text-xl font-semibold text-black mb-2">Analyze</h3>
                <p className="text-teal-800">Our AI analyzes your spending patterns and habits</p>
              </div>
              
              <div className="hidden md:block text-4xl text-teal-600">→</div>
              
              <div className="flex-1 flex flex-col items-center bg-white p-8 rounded-xl shadow-sm">
                <div className="w-16 h-16 rounded-full bg-teal-600 text-white flex items-center justify-center text-2xl font-bold mb-4">3</div>
                <h3 className="text-xl font-semibold text-black mb-2">Optimize</h3>
                <p className="text-teal-800">Get personalized recommendations to improve your finances</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Product Preview section removed as requested */}
      </main>

      {/* Footer - Dark Tealish Blue Background */}
      <footer ref={supportRef} id="support" className="relative z-10 bg-teal-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">VaultFace</h3>
            <p className="text-teal-100">Your AI-powered finance assistant for smarter money management.</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Features</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-teal-100 hover:text-white transition">Track Income & Expenses</a></li>
              <li><a href="#" className="text-teal-100 hover:text-white transition">AI-Powered Insights</a></li>
              <li><a href="#" className="text-teal-100 hover:text-white transition">Visual Analytics</a></li>
              <li><a href="#" className="text-teal-100 hover:text-white transition">Receipt OCR</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-teal-100 hover:text-white transition">About Us</a></li>
              <li><a href="#" className="text-teal-100 hover:text-white transition">Careers</a></li>
              <li><a href="#" className="text-teal-100 hover:text-white transition">Blog</a></li>
              <li><a href="#" className="text-teal-100 hover:text-white transition">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:support@vaultface.com" className="text-teal-100 hover:text-white transition">Email Support</a></li>
              <li><a href="tel:+18005551234" className="text-teal-100 hover:text-white transition">Call: 1-800-555-1234</a></li>
              <li><a href="#" className="text-teal-100 hover:text-white transition">Help Center</a></li>
              <li><a href="#" className="text-teal-100 hover:text-white transition">FAQ</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-teal-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-teal-100">© 2023 VaultFace. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-teal-100 hover:text-white transition">Twitter</a>
            <a href="#" className="text-teal-100 hover:text-white transition">LinkedIn</a>
            <a href="#" className="text-teal-100 hover:text-white transition">Facebook</a>
            <a href="#" className="text-teal-100 hover:text-white transition">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
