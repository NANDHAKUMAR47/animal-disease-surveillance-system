
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import StatsSection from './components/StatsSection';
import ChatBot from './components/ChatBot';
import AdminLogin from './components/AdminLogin';
import CaseReportsDatabase from './components/CaseReportsDatabase';
import VaccineInventoryComponent from './components/VaccineInventory';
import VaccinationCampModule from './components/VaccinationCampModule';
import PublicQueriesManager from './components/PublicQueriesManager';
import AnimatedCounter from './components/AnimatedCounter';
import { db, ARTICLES, TN_AUTHORITIES, RISK_PREDICTIONS } from './store';
import { Outbreak, Owner, Severity, AnimalType, PublicReport, SmsLog, VaccineInventory, LabResult, CaseReport } from './types';

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [adminSidebarTab, setAdminSidebarTab] = useState('reports');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [outbreaks, setOutbreaks] = useState<Outbreak[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [reports, setReports] = useState<CaseReport[]>([]);
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [inventory, setInventory] = useState<VaccineInventory[]>([]);
  const [labs, setLabs] = useState<LabResult[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [articleFilter, setArticleFilter] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Track outbreaks that have already triggered automated notifications to prevent duplicates
  const notifiedOutbreakIds = useRef<Set<string>>(new Set());

  // Case Entry Form State
  const [newCaseData, setNewCaseData] = useState({
    ownerName: '',
    ownerPhone: '',
    district: '',
    animalType: '',
    disease: '',
    vacStatus: 'Not Vaccinated' as 'Vaccinated' | 'Not Vaccinated',
    severity: Severity.NORMAL
  });

  // Contact Form States
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactCategory, setContactCategory] = useState('General Intelligence');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // AI Rapid Scan State
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isAnalyzingSymptom, setIsAnalyzingSymptom] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const [camps, setCamps] = useState<any[]>([]);

  // Centralized data fetcher
  const refreshAllData = async () => {
    try {
      const [dbOutbreaks, dbOwners, dbReports, dbSmsLogs, dbInventory, dbLabs, dbCamps] = await Promise.all([
        db.getOutbreaks(),
        db.getOwners(),
        db.getCaseReports(),
        db.getSmsLogs(),
        db.getInventory(),
        db.getLabResults(),
        fetch('http://localhost:5000/api/vaccination-camps').then(r => r.json())
      ]);

      setOutbreaks(dbOutbreaks);
      setOwners(dbOwners);
      setReports(dbReports);
      setSmsLogs(dbSmsLogs);
      setInventory(dbInventory);
      setLabs(dbLabs);
      setCamps(dbCamps);

      return { outbreaks: dbOutbreaks, owners: dbOwners };
    } catch (err) {
      console.error("Failed to refresh data:", err);
      return null;
    }
  };

  // Initial fetch and fetch on tab change
  useEffect(() => {
    refreshAllData();
  }, [activeTab, adminSidebarTab]);

  // Lively Updates: Poll for database changes every 10 seconds
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const freshData = await refreshAllData();

      if (freshData) {
        const { outbreaks: currentOutbreaks, owners: currentOwners } = freshData;

        // Automated Alert Logic
        currentOutbreaks.forEach(o => {
          if (o.severity === Severity.CRITICAL && o.status === 'Active' && !notifiedOutbreakIds.current.has(o.id)) {
            const alertMsg = `CRITICAL ALERT: ${o.diseaseName} in ${o.area}. Dispatching SMS to all registered owners.`;

            const affectedOwners = currentOwners.filter(own => own.area === o.area);
            const outbreakSpecificLogs: SmsLog[] = affectedOwners.map(own => ({
              id: Math.random().toString(36).substr(2, 9),
              recipient: own.name,
              phone: own.phone,
              message: `URGENT: ${o.diseaseName} detected in your area. Secure your livestock. Vaccination team on route. Protocol Level 3 Enabled.`,
              timestamp: new Date().toLocaleTimeString(),
              status: 'Delivered'
            }));

            if (outbreakSpecificLogs.length > 0) {
              notifiedOutbreakIds.current.add(o.id);
              setNotifications(prev => prev.includes(alertMsg) ? prev : [alertMsg, ...prev].slice(0, 3));

              // Save these automated logs to the DB for persistence
              outbreakSpecificLogs.forEach(log => {
                db.saveSmsLogs([log]);
              });
            }
          }
        });
      }
    }, 10000); // 10 second polling

    return () => clearInterval(pollInterval);
  }, []);

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
      setActiveTab('home');
    } else {
      setShowLogin(true);
    }
  };

  const onLoginSuccess = (success: boolean) => {
    if (success) {
      setIsAdmin(true);
      setShowLogin(false);
      setActiveTab('dashboard');
    }
  };

  const handleCaseEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const reports = await db.getCaseReports();
    const newReport: CaseReport = {
      id: `#${reports.length + 101}`,
      date: new Date().toISOString().split('T')[0],
      district: newCaseData.district,
      animal: newCaseData.animalType,
      disease: newCaseData.disease,
      status: newCaseData.severity,
      actionRequired: newCaseData.severity === Severity.CRITICAL,
      ownerName: newCaseData.ownerName,
      ownerPhone: newCaseData.ownerPhone,
      vaccinationStatus: newCaseData.vacStatus
    };
    await db.saveCaseReports([newReport, ...reports]); // Stores just newReport really
    setAdminSidebarTab('reports');
    alert('Authorized Clinical Entry Logged in Database.');
    setNewCaseData({
      ownerName: '',
      ownerPhone: '',
      district: '',
      animalType: '',
      disease: '',
      vacStatus: 'Not Vaccinated',
      severity: Severity.NORMAL
    });
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone || !contactMessage || !contactEmail) return;

    setIsSubmitting(true);
    try {
      await fetch('http://localhost:5000/api/public-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          category: contactCategory,
          message: contactMessage
        })
      });
      setIsSubmitted(true);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactMessage('');
    } catch (err) {
      console.error("Submission failed:", err);
      alert("System Offline. Query transmission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnalyzeSymptom = () => {
    if (selectedSymptoms.length === 0) return;
    setIsAnalyzingSymptom(true);
    setAnalysisResult(null);

    // Simulate AI Processing
    setTimeout(() => {
      setIsAnalyzingSymptom(false);
      // Mock logic for display
      if (selectedSymptoms.includes('Skin Lesions') && selectedSymptoms.includes('High Fever')) {
        setAnalysisResult('High correlation with Lumpy Skin Disease (LSD). Recommendation: Immediate isolation and vector control.');
      } else if (selectedSymptoms.includes('Excessive Drooling')) {
        setAnalysisResult('Potential early indicator of FMD. High monitoring level recommended.');
      } else {
        setAnalysisResult('Inconclusive Matrix. Detailed laboratory uplink suggested.');
      }
    }, 2000);
  };

  const renderAdminContent = () => {
    switch (adminSidebarTab) {
      case 'reports':
        return <CaseReportsDatabase />;
      case 'analytics':
        return <StatsSection />;
      case 'inventory':
        return <VaccineInventoryComponent />;
      case 'queries':
        return <PublicQueriesManager />;
      case 'owners':
        return (
          <div className="space-y-12">
            <h2 className="text-4xl font-black text-slate-800 dark:text-white">Livestock Registry</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {owners.map(own => (
                <div key={own.id} onClick={() => setSelectedOwner(own)} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-400 transition-all cursor-pointer shadow-sm group">
                  <div className="flex justify-between items-start mb-10">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-blue-800 dark:group-hover:bg-blue-600 group-hover:text-white transition-all">🐄</div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{own.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{own.area}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'add-report':
        return (
          <div className="max-w-4xl bg-white dark:bg-slate-900 p-16 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm animate-scaleIn">
            <h2 className="text-3xl font-black mb-4 dark:text-white">Authorize New Case Report</h2>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-sm leading-relaxed mb-12">Authorized entry portal for newly detected clinical cases. Protocol requires verification of identity before logging.</p>
            <form onSubmit={handleCaseEntrySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Owner Identity</label>
                <input required value={newCaseData.ownerName} onChange={e => setNewCaseData({ ...newCaseData, ownerName: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 outline-none font-bold text-sm text-black dark:text-white placeholder:dark:text-slate-600 transition-all" placeholder="Full Name" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Contact Line</label>
                <input required value={newCaseData.ownerPhone} onChange={e => setNewCaseData({ ...newCaseData, ownerPhone: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 outline-none font-bold text-sm text-black dark:text-white placeholder:dark:text-slate-600 transition-all" placeholder="+91 00000 00000" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">District Focus</label>
                <input required value={newCaseData.district} onChange={e => setNewCaseData({ ...newCaseData, district: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 outline-none font-bold text-sm text-black dark:text-white placeholder:dark:text-slate-600 transition-all" placeholder="e.g. Madurai" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Species Type</label>
                <input required value={newCaseData.animalType} onChange={e => setNewCaseData({ ...newCaseData, animalType: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 outline-none font-bold text-sm text-black dark:text-white placeholder:dark:text-slate-600 transition-all" placeholder="e.g. Cattle / Poultry" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Clinical Disease</label>
                <input required value={newCaseData.disease} onChange={e => setNewCaseData({ ...newCaseData, disease: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 outline-none font-bold text-sm text-black dark:text-white placeholder:dark:text-slate-600 transition-all" placeholder="e.g. Lumpy Skin Disease" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Protocol Level</label>
                <select value={newCaseData.severity} onChange={e => setNewCaseData({ ...newCaseData, severity: e.target.value as Severity })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 font-black uppercase text-[10px] tracking-widest text-black dark:text-white outline-none transition-all">
                  <option value={Severity.NORMAL} className="dark:bg-slate-900">Level 1: Normal</option>
                  <option value={Severity.MONITORING} className="dark:bg-slate-900">Level 2: Monitoring</option>
                  <option value={Severity.STABLE} className="dark:bg-slate-900">Level 3: Stable/Isolation</option>
                  <option value={Severity.CRITICAL} className="dark:bg-slate-900">Level 4: Critical/Alert</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-4 pt-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Prior Immunization Status</label>
                <div className="flex gap-4">
                  {['Vaccinated', 'Not Vaccinated'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setNewCaseData({ ...newCaseData, vacStatus: status as any })}
                      className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] border transition-all ${newCaseData.vacStatus === status ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-xl' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 shadow-sm'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              <button className="md:col-span-2 py-8 bg-blue-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-blue-950 transition-all shadow-2xl shadow-blue-900/10 active:scale-95 mt-6">Authorize Case Entry</button>
            </form>
          </div>
        );
      case 'alerts':
        return (
          <div className="space-y-12">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black text-slate-800 tracking-tight">Alert Command Center</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Satellite Link Active • Live Transmission Logs</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-50 dark:border-slate-800">
                <p className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-widest">Broadcast History</p>
                <button onClick={async () => setSmsLogs(await db.getSmsLogs())} className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline">Refresh Logs</button>
              </div>
              <div className="space-y-6">
                {smsLogs.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-slate-300 dark:text-slate-700 font-black text-xs uppercase tracking-widest">No transmissions recorded</p>
                  </div>
                ) : smsLogs.map(log => (
                  <div key={log.id} className="p-8 border border-slate-100/50 dark:border-slate-800/50 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all gap-8">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-slate-200/50 dark:shadow-black/50 shrink-0">📡</div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white text-lg">{log.recipient}</p>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">{log.phone} • {log.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex-1 px-0 md:px-6">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">"{log.message}"</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[9px] font-black px-6 py-2.5 rounded-full uppercase tracking-widest border ${log.status === 'Delivered' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30' :
                        log.status === 'Sent' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/30' :
                          'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800/30'
                        }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return <CaseReportsDatabase />;
    }
  }

  const renderContent = () => {
    if (showLogin) return <AdminLogin onLogin={onLoginSuccess} onCancel={() => setShowLogin(false)} />;

    if (isAdmin && activeTab === 'dashboard') {
      return (
        <div className="flex flex-col w-full min-h-screen bg-[#f8fafc] dark:bg-slate-950 animate-fadeIn transition-colors">
          {/* Admin Header - Replaces Navbar for Admin Only */}
          <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-10 py-6 sticky top-0 z-[150] flex items-center justify-between">
            <div className="flex items-center gap-4 group cursor-default">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-blue-500/20">Z</div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                  ZoonoGuard
                </span>
                <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">
                  Admin Portal
                </span>
              </div>
            </div>

            <button
              onClick={handleAdminToggle}
              className="px-8 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-red-100 dark:border-red-800 hover:bg-red-600 dark:hover:bg-red-900 hover:text-white transition-all active:scale-95"
            >
              Exit Admin Portal
            </button>
          </header>

          {/* Red Alert Bar - If there's an active notification */}
          {notifications.length > 0 && (
            <div className="bg-red-600 text-white px-10 py-4 flex items-center gap-6 shadow-xl relative z-[140]">
              <div className="bg-white/20 px-6 py-2 rounded-full flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                <span className="text-[11px] font-black uppercase tracking-widest">Command Alert</span>
              </div>
              <p className="text-sm font-black flex-1 truncate">{notifications[0]}</p>
            </div>
          )}

          <div className="flex flex-1 relative overflow-hidden">
            {/* Blue Side Navigation */}
            <aside className={`${isSidebarCollapsed ? 'w-24' : 'w-[300px]'} bg-blue-900 dark:bg-slate-950 flex flex-col shrink-0 transition-all duration-500 relative group z-[100]`}>
              {/* Collapse Toggle Button */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="absolute -right-4 top-12 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl border-4 border-[#f8fafc] dark:border-slate-950 z-[110] transition-all hover:bg-blue-500 active:scale-90"
              >
                <span className={`text-lg font-black transition-transform duration-500 ${isSidebarCollapsed ? 'rotate-180' : ''}`}>‹</span>
              </button>

              <nav className="flex-1 px-4 py-10 space-y-2 overflow-x-hidden">
                {[
                  { id: 'reports', label: 'All Reports', icon: '📁' },
                  { id: 'add-report', label: 'Add New Report', icon: '➕' },
                  { id: 'analytics', label: 'Analytics', icon: '📊' },
                  { id: 'inventory', label: 'Vaccine Inventory', icon: '💉' },
                  { id: 'queries', label: 'Public Queries', icon: '💬' },
                  { id: 'alerts', label: 'Alert Center', icon: '🚨' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setAdminSidebarTab(item.id)}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap ${adminSidebarTab === item.id
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/10'
                      : 'text-blue-200/50 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <span className="text-xl opacity-80 shrink-0">{item.icon}</span>
                    <span className={`transition-all duration-500 ${isSidebarCollapsed ? 'opacity-0 translate-x-10 pointer-events-none' : 'opacity-100'}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </nav>

              <div className={`p-8 border-t border-white/5 transition-all duration-500 ${isSidebarCollapsed ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100'}`}>
                <div className="bg-blue-950/40 p-6 rounded-3xl">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Session ID</p>
                  <p className="text-[11px] font-bold text-white/50 truncate">auth_0x7a2...41b</p>
                </div>
              </div>
            </aside>

            {/* Admin Content Area */}
            <main className="flex-1 overflow-y-auto p-12 lg:p-20">
              {renderAdminContent()}
            </main>
          </div>
        </div >
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-20 animate-fadeIn max-w-[95rem] mx-auto px-8 lg:px-16 py-20 md:py-32">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-[#0a0f1e] rounded-[4rem] px-12 py-16 md:px-20 md:py-20 text-white shadow-4xl border border-white/5 mx-4">
              <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -z-0 -translate-y-1/2"></div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-8 text-blue-400">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    BSL Command Node V2.5
                  </div>

                  <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-none">
                    Protecting <span className="text-blue-500">Livestock</span> <br />
                    Ensuring Global Health
                  </h1>

                  <p className="text-slate-400 text-base md:text-lg mb-10 max-w-xl font-medium leading-relaxed">
                    Real-time monitoring of animal diseases across Tamil Nadu. Stay informed about outbreaks and vaccination drives with our automated surveillance network.
                  </p>

                  <div className="flex flex-wrap gap-6">
                    <button
                      onClick={() => { setShowLogin(true) }}
                      className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                    >
                      Admin Login
                    </button>
                    <button
                      onClick={() => setActiveTab('contact')}
                      className="bg-white/5 text-white border border-white/10 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-95"
                    >
                      Intelligence Portal
                    </button>
                  </div>
                </div>

                <div className="hidden lg:block w-72 h-72 bg-gradient-to-br from-blue-600 to-blue-900 rounded-[3rem] shadow-3xl rotate-12 flex items-center justify-center p-1">
                  <div className="w-full h-full bg-[#0a0f1e] rounded-[2.8rem] flex flex-col items-center justify-center p-8">
                    <div className="text-5xl mb-4 animate-bounce">🛡️</div>
                    <p className="text-[10px] font-black text-center text-blue-400 uppercase tracking-widest">System Status: Optimal</p>
                    <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                      <div className="bg-blue-500 h-full w-2/3"></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* BSL Indicators */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
              <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-12 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
                <div className="flex justify-between items-start mb-16 relative z-10">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Biosecurity Levels (BSL)</h2>
                    <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">{reports.length}+ Records Analyzed Across Districts</p>
                  </div>
                  <span className="text-[10px] font-black bg-blue-600 text-white px-5 py-2 rounded-full uppercase tracking-widest">Live Updates</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 relative z-10">
                  {/* Calculate dynamic district risk for BSL bubbles */}
                  {Array.from(new Set(reports.map(r => r.district))).slice(0, 12).map(dist => {
                    const distReports = reports.filter(r => r.district === dist);
                    const criticalCount = distReports.filter(r => r.status === Severity.CRITICAL).length;
                    const monitoringCount = distReports.filter(r => r.status === Severity.MONITORING).length;

                    const score = (criticalCount * 20) + (monitoringCount * 10);
                    const bsl = score > 60 ? 'L4' : score > 30 ? 'L3' : 'L1';

                    return (
                      <div key={dist} className="flex flex-col items-center group cursor-help text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black mb-4 transition-all shadow-md ${bsl === 'L4' ? 'bg-red-600 text-white' :
                          bsl === 'L3' ? 'bg-orange-500 text-white' :
                            'bg-blue-500 text-white'
                          }`}>
                          {bsl}
                        </div>
                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-[10px] uppercase tracking-widest whitespace-nowrap">{dist}</h4>
                      </div>
                    );
                  })}
                  {reports.length === 0 && RISK_PREDICTIONS.map(risk => (
                    <div key={risk.district} className="flex flex-col items-center group cursor-help text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black mb-4 transition-all shadow-md ${risk.riskScore > 80 ? 'bg-red-600 text-white' :
                        risk.riskScore > 50 ? 'bg-orange-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                        {risk.riskScore > 80 ? 'L4' : risk.riskScore > 50 ? 'L3' : 'L1'}
                      </div>
                      <h4 className="font-black text-slate-900 dark:text-slate-100 text-[10px] uppercase tracking-widest whitespace-nowrap">{risk.district}</h4>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#0b1120] rounded-[4rem] p-12 text-white flex flex-col justify-between shadow-3xl">
                <div className="text-5xl">💉</div>
                <div>
                  <h3 className="text-2xl font-black mb-4">SVR System</h3>
                  <p className="text-slate-400 text-[11px] font-bold leading-relaxed mb-10">
                    Statewide immunity currently at {reports.length > 0 ? Math.round((reports.filter(r => r.vaccinationStatus === 'Vaccinated').length / reports.length) * 100) : 78}%.
                  </p>
                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-blue-400">Inventory Status</span>
                      <span className="text-white">Active Analysis</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-1000"
                        style={{ width: `${reports.length > 0 ? (reports.filter(r => r.vaccinationStatus === 'Vaccinated').length / reports.length) * 100 : 78}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statewide Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'Total Database Cases', value: reports.length, icon: '📈', color: 'from-blue-600 to-blue-400' },
                { label: 'Critical Districts', value: Array.from(new Set(reports.filter(r => r.status === Severity.CRITICAL).map(r => r.district))).length, icon: '🚨', color: 'from-red-600 to-red-400' },
                { label: 'Ongoing Camps', value: camps.length, icon: '⛺', color: 'from-emerald-600 to-emerald-400' },
                { label: 'Vaccinations Done', value: reports.filter(r => r.vaccinationStatus === 'Vaccinated').length, icon: '💉', color: 'from-purple-600 to-purple-400' }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group"
                >
                  <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${stat.color}`}></div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{stat.icon}</span>
                    <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest leading-none">Global Link</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
                  <div className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">
                    <AnimatedCounter value={stat.value} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Vaccination Camp Feed - NEW SECTION */}
            <VaccinationCampModule />

            {/* AI Rapid Scan (Symptom Analyzer) */}
            <div className="bg-white dark:bg-slate-900 rounded-[4rem] p-16 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none"></div>

              <div className="flex flex-col lg:flex-row gap-16 items-center relative z-10">
                <div className="lg:w-1/3 space-y-8">
                  <div className="inline-flex items-center gap-3 bg-blue-600 text-white px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
                    BSL-Level Tool
                  </div>
                  <h2 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">AI Rapid <br /><span className="text-blue-600">Scan</span></h2>
                  <p className="text-slate-400 dark:text-slate-500 text-lg font-medium leading-relaxed">Autonomous symptom analysis engine. Select observed anomalies for a preliminary biosecurity risk assessment.</p>
                </div>

                <div className="lg:w-2/3 w-full space-y-10">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['High Fever', 'Skin Lesions', 'Excessive Drooling', 'Difficulty Breathing', 'Sudden Lameness', 'Loss of Appetite', 'Decreased Milk Yield', 'Congestion'].map((sym) => (
                      <button
                        key={sym}
                        onClick={() => {
                          if (selectedSymptoms.includes(sym)) {
                            setSelectedSymptoms(prev => prev.filter(s => s !== sym));
                          } else {
                            setSelectedSymptoms(prev => [...prev, sym]);
                          }
                          setAnalysisResult(null);
                        }}
                        className={`py-6 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedSymptoms.includes(sym)
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20'
                          : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-800 hover:border-blue-200'
                          }`}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-6 pt-6">
                    <button
                      onClick={handleAnalyzeSymptom}
                      disabled={selectedSymptoms.length === 0 || isAnalyzingSymptom}
                      className="px-10 py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 active:scale-95 flex items-center gap-4"
                    >
                      {isAnalyzingSymptom ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          Analyzing Matrix...
                        </>
                      ) : 'Analyze Matrix'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSymptoms([]);
                        setAnalysisResult(null);
                      }}
                      className="px-10 py-6 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95"
                    >
                      Reset Selectors
                    </button>
                  </div>

                  {analysisResult && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-[3rem] border border-blue-100 dark:border-blue-800 animate-fadeIn">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black">AI</div>
                        <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Diagnostic Hypothesis</h4>
                      </div>
                      <p className="text-slate-900 dark:text-white font-black text-lg leading-snug">{analysisResult}</p>
                      <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold mt-4 uppercase tracking-widest italic">⚠️ This is a preliminary automated analysis. Always consult a certified veterinarian.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Authorities Directory */}
            <div className="space-y-12">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">Contact</h2>
                  <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Emergency Communication Directory</p>
                </div>
                <button
                  onClick={() => setShowAllContacts(!showAllContacts)}
                  className="px-8 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all active:scale-95"
                >
                  {showAllContacts ? 'Show Less' : 'Show More'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {(showAllContacts ? TN_AUTHORITIES : TN_AUTHORITIES.slice(0, 3)).map(auth => (
                  <div key={auth.id} className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 transition-all shadow-sm group">
                    <div className="flex justify-between items-start mb-10">
                      <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{auth.organization}</p>
                      <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-xl">🏢</div>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-none">{auth.name}</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold leading-relaxed mb-10">{auth.designation} • {auth.location}</p>
                    <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Phone </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{auth.contact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'articles':
        return (
          <div className="space-y-16 animate-fadeIn max-w-[95rem] mx-auto px-8 lg:px-16 py-20 md:py-32">
            <div className="flex flex-col gap-6">
              <h2 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">Biosecurity Intelligence</h2>
              <p className="text-slate-400 dark:text-slate-500 text-xl max-w-2xl font-medium leading-relaxed">The ZoonoGuard knowledge base features technical briefs, peer-reviewed local research, and biosecurity protocols specifically tailored for Tamil Nadu's agro-climatic zones.</p>
              <div className="flex flex-wrap gap-4 mt-8">
                {['All', 'Prevention', 'Announcement', 'Research', 'Emergency'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setArticleFilter(cat)}
                    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${articleFilter === cat ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-xl shadow-blue-500/20' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-500'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {ARTICLES.filter(a => articleFilter === 'All' || a.category === articleFilter).map(art => (
                <div key={art.id} className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl dark:hover:shadow-slate-500/10 transition-all overflow-hidden flex flex-col group cursor-pointer" onClick={() => setSelectedArticle(art)}>
                  <div className="h-64 relative overflow-hidden">
                    <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-6 left-6">
                      <span className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white text-[9px] font-black rounded-lg uppercase tracking-[0.2em] shadow-lg">{art.category}</span>
                    </div>
                  </div>
                  <div className="p-10 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{art.author[0]}</div>
                      <div>
                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">{art.author}</p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{art.date}</p>
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{art.title}</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-sm leading-relaxed mb-10 line-clamp-3">{art.summary}</p>
                    <div className="mt-auto">
                      <button className="w-full py-5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white dark:hover:text-white transition-all">Read Intelligence</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="space-y-16 animate-fadeIn max-w-[95rem] mx-auto px-8 lg:px-16 py-20 md:py-32">
            <h2 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">Surveillance Analytics</h2>
            <StatsSection />
          </div>
        );

      case 'contact':
        return (
          <div className="max-w-[95rem] mx-auto px-8 lg:px-16 py-20 md:py-32 flex flex-col lg:flex-row gap-16 animate-fadeIn items-start">
            <div className="lg:w-1/2 space-y-12 sticky top-40">
              <h2 className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9]">Transmit Public <br /><span className="text-blue-600">Intelligence.</span></h2>
              <p className="text-slate-400 text-2xl font-medium leading-relaxed max-w-lg">Your reports help our AI systems detect early signs of zoonotic spillover. Submissions are routed directly to the State Surveillance Unit.</p>

              <div className="space-y-12">
                <div>
                  <h2 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">Get in Touch</h2>
                  <p className="text-slate-400 dark:text-slate-500 text-xl max-w-lg font-medium leading-relaxed mt-6">Our command node is active 24/7. Use the encrypted line below to report symptom clusters or request emergency biosecurity support.</p>
                </div>

                <div className="space-y-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-6 group">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-xl group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-all">📍</div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Main Command</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">Veterinary HQ, Chennai, TN</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 group">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-xl group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-all">⚡</div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Digital Response</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">surveillance.tn.gov.in</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 w-full bg-white dark:bg-slate-900 p-12 md:p-20 rounded-[4rem] shadow-4xl border border-slate-100 dark:border-slate-800 transition-colors">
              <form onSubmit={handleContactSubmit} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Full Identity</label>
                    <input
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 outline-none font-bold text-black dark:text-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                      placeholder="e.g. Dr. Ramesh Kumar"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email Protocol</label>
                    <input
                      required
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 outline-none font-bold text-black dark:text-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                      placeholder="e.g. name@domain.com"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Encrypted Contact Line</label>
                  <input
                    required
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 outline-none font-bold text-black dark:text-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                    placeholder="+91 00000 00000"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Intelligence Category</label>
                  <select
                    value={contactCategory}
                    onChange={(e) => setContactCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 outline-none font-black text-[11px] uppercase tracking-widest text-black dark:text-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                  >
                    <option className="dark:bg-slate-900">General Intelligence</option>
                    <option className="dark:bg-slate-900">Symptom Cluster Report</option>
                    <option className="dark:bg-slate-900">Livestock Mortality Alert</option>
                    <option className="dark:bg-slate-900">Biosecurity Breach</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Intelligence Brief</label>
                  <textarea
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2.5rem] p-6 outline-none font-bold text-black dark:text-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                    placeholder="Detail symptoms, location, and animal types affected..."
                  ></textarea>
                </div>
                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full py-8 bg-blue-600 text-white rounded-[3rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Transmitting...
                    </>
                  ) : 'Submit Intelligence'}
                </button>
              </form>
            </div>

            {/* Success Popup */}
            {isSubmitted && (
              <div className="fixed inset-0 z-[300] bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-2xl flex items-center justify-center p-8 animate-fadeIn">
                <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[4rem] p-16 text-center shadow-4xl animate-scaleIn border border-white/5">
                  <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-10 shadow-lg shadow-emerald-500/10 dark:shadow-black/50">✓</div>
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Intelligence Received</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed mb-12">Transmission successful. The ZoonoGuard command node has logged your data. District authorities in the relevant area have been notified via automated uplink.</p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setActiveTab('home');
                    }}
                    className="w-full py-7 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-2xl shadow-slate-900/20 active:scale-95"
                  >
                    Return to Home Portal
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <div className="p-32 text-center font-black text-slate-200 text-9xl uppercase tracking-tighter">System Error</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc] dark:bg-slate-950 selection:bg-blue-100 selection:text-blue-600 overflow-x-hidden transition-colors duration-300">
      {/* Conditionally show Header/Navbar only if not in Admin Dashboard */}
      {(!isAdmin || activeTab !== 'dashboard') && (
        <Navbar
          isAdmin={isAdmin}
          onToggleAdmin={handleAdminToggle}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
      )}

      {(!isAdmin || activeTab !== 'dashboard') && notifications.length > 0 && (
        <div className="bg-red-600 text-white px-8 py-5 flex items-center justify-between gap-12 animate-pulse sticky top-24 z-[90] shadow-3xl">
          <div className="flex items-center gap-5">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              Surveillance Alert
            </span>
            <p className="text-sm font-black truncate max-w-4xl">{notifications[0]}</p>
          </div>
        </div>
      )}

      {/* For Admin, main takes full screen height minus footer. For Public, it is a centered container. */}
      <main className={`flex-grow ${isAdmin && activeTab === 'dashboard' ? 'w-full' : ''}`}>
        {renderContent()}
      </main>

      <ChatBot />

      {/* Footer - Now shown for both Public and Admin as requested */}
      <footer className="bg-[#030712] py-40 text-slate-500 relative overflow-hidden">
        <div className="max-w-[95rem] mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-32">
            <div className="md:col-span-2 space-y-12">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-4xl shadow-3xl shadow-blue-500/30">Z</div>
                <span className="text-6xl font-black text-white tracking-tighter">ZoonoGuard</span>
              </div>
              <p className="text-3xl font-medium leading-[1.4] max-w-2xl text-slate-400">
                Real-time monitoring of animal diseases across Tamil Nadu. Stay informed about outbreaks and vaccination drives.
              </p>
            </div>

            <div className="space-y-12">
              <h4 className="text-white font-black uppercase tracking-[0.4em] text-[10px]">Operations</h4>
              <ul className="space-y-6 text-sm font-bold">
                <li><button className="hover:text-blue-400 transition-colors">Surveillance Matrix</button></li>
                <li><button className="hover:text-blue-400 transition-colors">Strategic Logs</button></li>
                <li><button className="hover:text-blue-400 transition-colors">Asset Monitoring</button></li>
                <li><button className="hover:text-blue-400 transition-colors">Intelligence Bank</button></li>
              </ul>
            </div>
            <div className="space-y-12">
              <h4 className="text-white font-black uppercase tracking-[0.4em] text-[10px]">Government</h4>
              <ul className="space-y-6 text-sm font-bold">
                <li><a href="#" className="hover:text-blue-400 transition-colors">TN Veterinary Dept</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">District Health Dept</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Pathogen Data Policy</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">State Compliance</a></li>
              </ul>
            </div>
            <div className="space-y-12">
              <h4 className="text-white font-black uppercase tracking-[0.4em] text-[10px]">Command</h4>
              <div className="space-y-4">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">© 2026 ZoonoGuard</p>
                <p className="text-[9px] font-black lowercase tracking-[0.3em] text-slate-700">zoonoguard.tn@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {selectedOwner && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-8 transition-colors">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[4rem] p-20 relative border border-white/5 shadow-5xl animate-scaleIn">
            <button onClick={() => setSelectedOwner(null)} className="absolute top-10 right-10 text-4xl text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors">×</button>
            <h2 className="text-4xl font-black mb-4 dark:text-white">{selectedOwner.name}</h2>
            <p className="text-slate-400 dark:text-slate-500 font-bold mb-10 uppercase tracking-widest text-xs">{selectedOwner.area}</p>
            <div className="space-y-6">
              {selectedOwner.animals.map(ani => (
                <div key={ani.id} className="p-8 border border-slate-100 dark:border-slate-800 rounded-3xl flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                  <div>
                    <p className="font-black text-xl dark:text-white">{ani.name} ({ani.breed})</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">Last Immune: {ani.lastVaccinationDate}</p>
                  </div>
                  <div className="text-right font-black">
                    <p className="text-3xl text-blue-600 dark:text-blue-400">{ani.currentMetrics?.temperature}°C</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-300 dark:text-slate-600">Live Metric</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedArticle && (
        <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full z-[9999] flex items-center justify-center p-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-[100px] animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[85vh] rounded-[3rem] shadow-5xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800 m-6">
            {/* Blurred Sticky Top Header */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-50 dark:border-slate-800 px-10 py-8 flex justify-between items-center text-slate-900 dark:text-white">
              <div className="flex items-center gap-4">
                <span className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white text-[9px] font-black rounded-lg uppercase tracking-[0.2em] shadow-lg">{selectedArticle.category}</span>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Intelligence Brief • {selectedArticle.date}</p>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="w-10 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm hover:bg-red-600 dark:hover:bg-red-500 hover:text-white dark:hover:text-white hover:border-red-600 transition-all font-bold shadow-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-12 lg:p-20 overflow-y-auto">
              <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center text-2xl shadow-inner">🔬</div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white leading-none">{selectedArticle.author}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Verified Professional Contributor</p>
                </div>
              </div>
              <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-10 tracking-tighter leading-tight">{selectedArticle.title}</h2>
              <div className="space-y-8">
                {selectedArticle.content.split('\n\n').map((para: string, idx: number) => (
                  <p key={idx} className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed font-medium">
                    {para}
                  </p>
                ))}
              </div>
              <div className="mt-16 pt-12 border-t border-slate-100 flex justify-center">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-12 py-5 bg-[#0f172a] dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                >
                  Close Intelligence Brief
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
