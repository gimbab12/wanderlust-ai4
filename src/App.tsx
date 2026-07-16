import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plane, Compass, Sparkles, Loader2, MapPin, MessageSquare, 
  Star, Globe, Utensils, User, Heart, Plus, Send, X, 
  Calendar, DollarSign, Activity, ChevronRight, Share2, Smartphone,
  Settings, Wifi, WifiOff, Database, Check, AlertCircle
} from 'lucide-react';
import { db, auth } from './lib/firebase';
import { collection, addDoc, query, onSnapshot, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import ReactMarkdown from 'react-markdown';
import { TravelProfile, Review, Language } from './types';
import { translations } from './i18n';
// @ts-ignore
import sunsetHero from './assets/images/sunset_hero_1782980176047.jpg';
// @ts-ignore
import appIcon from './assets/images/app_icon_1783212531908.jpg';

// Import our new mobile-optimized modular components
import PhoneContainer from './components/PhoneContainer';
import FoodTab from './components/FoodTab';
import AuthTab from './components/AuthTab';
import AdSenseAd from './components/AdSenseAd';
import AppInstallModal from './components/AppInstallModal';
import { KakaoAdFit } from './components/KakaoAdFit';

// AdSense Banner Component inside the App (Styled as a native-look mobile card ad)
const AdBanner = () => {
  const isKo = true; // Default or determined by App language context
  return (
    <div className="w-full bg-neutral-100 rounded-2xl p-3 border border-neutral-200/60 my-4 shrink-0 overflow-hidden">
      <div className="flex justify-between items-center mb-1 px-1">
        <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest">Sponsored / 광고</span>
        <span className="text-[9px] font-bold text-neutral-400 bg-neutral-200/80 px-1 rounded">Ad</span>
      </div>
      <AdSenseAd />
    </div>
  );
};

const atmosphereOptions = [
  { key: 'neutral', icon: '🌏' },
  { key: 'quiet', icon: '🌿' },
  { key: 'crowded', icon: '⚡' },
  { key: 'historical', icon: '🏯' },
  { key: 'modern', icon: '🌃' },
  { key: 'nature', icon: '⛰️' },
  { key: 'artistic', icon: '🎨' }
] as const;

const spendingOptions = [
  { key: 'balanced', icon: '⚖️' },
  { key: 'cheap', icon: '🍿' },
  { key: 'expensive', icon: '💎' },
  { key: 'flex', icon: '🔥' },
  { key: 'shopping', icon: '🛍️' },
  { key: 'foodie', icon: '🍣' }
] as const;

const getApiUrl = (path: string): string => {
  try {
    const savedMode = localStorage.getItem('api_mode');
    if (savedMode === 'shared') {
      return `https://ais-pre-mdbxylovblelb4ewfjgsjr-578835611426.asia-east1.run.app${path}`;
    } else if (savedMode === 'dev') {
      return `https://ais-dev-mdbxylovblelb4ewfjgsjr-578835611426.asia-east1.run.app${path}`;
    } else if (savedMode === 'custom') {
      const customUrl = localStorage.getItem('api_custom_url');
      if (customUrl) {
        const baseUrl = customUrl.endsWith('/') ? customUrl.slice(0, -1) : customUrl;
        return `${baseUrl}${path}`;
      }
    }
  } catch (e) {
    console.error('Error reading API configuration:', e);
  }

  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv.VITE_API_URL) {
    return `${metaEnv.VITE_API_URL}${path}`;
  }
  
  const isNative = 
    window.location.origin.startsWith('capacitor://') || 
    (window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '5173') ||
    window.location.origin.startsWith('https://localhost'); // Capacitor with androidScheme: 'https'
    
  if (isNative) {
    // Default to public pre-release backend for native devices to avoid AI Studio login wall
    return `https://ais-pre-mdbxylovblelb4ewfjgsjr-578835611426.asia-east1.run.app${path}`;
  }
  return path;
};

export default function App() {
  const isDevOrAdmin = 
    (import.meta as any).env?.DEV || 
    window.location.hostname === 'localhost' || 
    window.location.hostname.includes('-dev-') ||
    new URLSearchParams(window.location.search).get('debug') === 'true' ||
    new URLSearchParams(window.location.search).get('admin') === 'true';

  const [lang, setLang] = useState<Language>('ko');
  const [isAtmosphereOpen, setIsAtmosphereOpen] = useState<boolean>(false);
  const [isSpendingOpen, setIsSpendingOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const t = translations[lang];
  const isKo = lang === 'ko';

  // Navigation tab state: 'ai' (AI 추천), 'food' (맛집 탐방), 'feed' (여행 피드)
  const [activeTab, setActiveTab] = useState<'ai' | 'food' | 'feed'>('ai');

  // Firebase auth user reference
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // Travel profile state
  const [profile, setProfile] = useState<TravelProfile>({
    age: 25,
    gender: 'male',
    mbti: '',
    preferredRegion: '',
    crowdPreference: 'neutral',
    budgetPreference: 'balanced',
    totalBudget: 1500,
    transportation: 'subway',
    language: 'ko'
  });

  // States
  const [recommendation, setRecommendation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // API connection settings states
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [apiMode, setApiMode] = useState<string>(() => localStorage.getItem('api_mode') || 'auto');
  const [apiCustomUrl, setApiCustomUrl] = useState<string>(() => localStorage.getItem('api_custom_url') || 'http://192.168.0.5:3000');
  const [adsenseClient, setAdsenseClient] = useState<string>(() => localStorage.getItem('adsense_client') || 'ca-pub-8139972389007359');
  const [adsenseSlot, setAdsenseSlot] = useState<string>(() => localStorage.getItem('adsense_slot') || '2141105845');
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    
    let targetUrl = '';
    if (apiMode === 'shared') {
      targetUrl = 'https://ais-pre-mdbxylovblelb4ewfjgsjr-578835611426.asia-east1.run.app/api/health';
    } else if (apiMode === 'dev') {
      targetUrl = 'https://ais-dev-mdbxylovblelb4ewfjgsjr-578835611426.asia-east1.run.app/api/health';
    } else if (apiMode === 'custom') {
      const baseUrl = apiCustomUrl.endsWith('/') ? apiCustomUrl.slice(0, -1) : apiCustomUrl;
      targetUrl = `${baseUrl}/api/health`;
    } else {
      // Auto detection
      const isNative = 
        window.location.origin.startsWith('capacitor://') || 
        (window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '5173') ||
        window.location.origin.startsWith('https://localhost');
      if (isNative) {
        targetUrl = 'https://ais-pre-mdbxylovblelb4ewfjgsjr-578835611426.asia-east1.run.app/api/health';
      } else {
        targetUrl = '/api/health';
      }
    }

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 6000); // 6s timeout
      
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(id);
      
      if (response.ok) {
        setTestResult({
          success: true,
          message: isKo ? '연결 성공! (상태: OK)' : 'Connection Successful! (Status: OK)'
        });
      } else {
        setTestResult({
          success: false,
          message: isKo 
            ? `연결 오류 (상태 코드: ${response.status})` 
            : `Connection failed (Status code: ${response.status})`
        });
      }
    } catch (err: any) {
      console.error('Test Connection Error:', err);
      let errorMsg = err.message || '';
      if (err.name === 'AbortError') {
        errorMsg = isKo ? '시간 초과 (서버가 응답하지 않습니다)' : 'Timeout (Server is not responding)';
      }
      setTestResult({
        success: false,
        message: isKo 
          ? `서버에 연결할 수 없습니다. (${errorMsg})` 
          : `Could not connect to server. (${errorMsg})`
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('api_mode', apiMode);
    localStorage.setItem('api_custom_url', apiCustomUrl);
    localStorage.setItem('adsense_client', adsenseClient);
    localStorage.setItem('adsense_slot', adsenseSlot);
    setIsSettingsOpen(false);
    setTestResult(null);
  };
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [newReview, setNewReview] = useState({ userName: '', destination: '', comment: '', rating: 5 });

  // Load reviews and monitor auth state
  useEffect(() => {
    // 1. Monitor Auth State
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    // 2. Load Reviews Feed
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribeReviews = onSnapshot(q, (snapshot) => {
      const revs: Review[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Skip food-specific reviews in the main community feed
        if (!data.foodId) {
          revs.push({ id: doc.id, ...data } as Review);
        }
      });
      setReviews(revs);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeReviews();
    };
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as Language;
    setLang(newLang);
    setProfile(prev => ({ ...prev, language: newLang }));
  };

  const submitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRecommendation('');
    try {
      const response = await fetch(getApiUrl('/api/recommend'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      const data = await response.json();
      if (response.ok) {
        setRecommendation(data.recommendation);
      } else {
        alert("Failed to get recommendations: " + data.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while fetching recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.destination.trim() || !newReview.comment.trim()) {
      alert(isKo ? "모든 필드를 입력해 주세요." : "Please fill all fields.");
      return;
    }

    try {
      await addDoc(collection(db, 'reviews'), {
        userId: currentUser ? currentUser.uid : 'anonymous',
        userName: currentUser ? (currentUser.displayName || 'Traveler') : (newReview.userName.trim() || 'Anonymous'),
        destination: newReview.destination.trim(),
        rating: newReview.rating,
        comment: newReview.comment.trim(),
        createdAt: Date.now()
      });
      setNewReview({ userName: '', destination: '', comment: '', rating: 5 });
      setIsReviewModalOpen(false);
    } catch (error) {
      console.error("Error adding review:", error);
      alert(isKo ? "후기 등록에 실패했습니다." : "Failed to add review.");
    }
  };

  return (
    <PhoneContainer>
      {/* Dynamic Header */}
      <header className="h-14 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 flex items-center justify-between sticky top-0 z-40 select-none shrink-0">
        <div className="flex items-center gap-2">
          <img 
            src={appIcon} 
            alt="Wanderlust Logo" 
            className="w-6 h-6 rounded-lg shadow-sm border border-neutral-100 object-cover"
            referrerPolicy="no-referrer"
          />
          <span className="text-sm font-black tracking-tight font-display bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
            {t.title}
          </span>
        </div>

        {/* Header Right Action Area */}
        <div className="flex items-center gap-2">
          {/* App Install Trigger Button */}
          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 px-2.5 py-1 rounded-full border border-rose-100 text-[10px] font-extrabold transition-all active:scale-95 shadow-sm"
          >
            <Smartphone className="w-3.5 h-3.5 animate-bounce" style={{ animationDuration: '3s' }} />
            <span>{isKo ? '앱 설치' : 'Install App'}</span>
          </button>

          {/* Global Language Dropdown wrapper */}
          <div className="flex items-center bg-neutral-100 rounded-full px-2.5 py-1 text-neutral-700 border border-neutral-200">
            <Globe className="w-3.5 h-3.5 mr-1 text-neutral-500" />
            <select 
              value={lang} 
              onChange={handleLanguageChange}
              className="bg-transparent outline-none text-[10px] font-bold appearance-none cursor-pointer text-neutral-800"
            >
              <option value="ko">KO</option>
              <option value="en">EN</option>
              <option value="ja">JA</option>
              <option value="zh">ZH</option>
              <option value="es">ES</option>
              <option value="fr">FR</option>
              <option value="de">DE</option>
            </select>
          </div>

          {/* Connection Settings Gear Icon (Hidden in production for normal users, accessible via debug/admin query param or during development) */}
          {isDevOrAdmin && (
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-all active:scale-95"
              title={isKo ? "서버 연동 설정" : "Server Connection Settings"}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Tabbed Viewport Scrollable Area */}
      <div className="flex-1 overflow-y-auto relative bg-neutral-50 flex flex-col h-full scrollbar-thin">
        
        <AnimatePresence mode="wait">
          {activeTab === 'ai' && (
            /* =========================================================================
               TAB 1: AI TRAVEL PLANNER & RESULTS
               ========================================================================= */
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col pb-8"
            >
              {/* Beautiful Sunset Hero Banner */}
              <div className="relative w-full h-44 md:h-64 overflow-hidden shadow-sm shrink-0">
                <img 
                  src={sunsetHero}
                  alt="Beautiful Sunset Travel" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-900/40 to-black/20 flex flex-col justify-end p-5 md:p-8">
                  <span className="text-[10px] md:text-xs font-bold text-rose-300 tracking-wider uppercase mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
                    {isKo ? '특별한 여행을 꿈꾸다' : 'Dream of your special journey'}
                  </span>
                  <h1 className="text-white text-xl md:text-3xl font-black tracking-tight drop-shadow-sm font-display leading-tight">
                    {isKo ? '나만의 맞춤형 여행 코스 추천' : 'Personalized AI Travel Curator'}
                  </h1>
                  <p className="text-white/80 text-[10px] md:text-xs mt-1 font-medium max-w-[280px] md:max-w-md leading-snug">
                    {isKo ? '나의 분위기 취향과 소비 성향을 분석하여 꼭 맞는 여행지를 찾아드려요.' : 'We analyze your vibe and spending profile to find the perfect getaway.'}
                  </p>
                </div>
              </div>

              {/* Form & Welcome Banner */}
              <div className="p-4 bg-gradient-to-b from-neutral-50 to-neutral-100">
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-neutral-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {isKo ? '인공지능 추천' : 'AI Recommendation'}
                  </span>
                  
                  <h2 className="text-lg font-black mt-2 font-display text-neutral-900 leading-snug">
                    {t.subtitle}
                  </h2>

                  {/* Form fields */}
                  <form onSubmit={submitProfile} className="space-y-4 mt-5">
                    
                    {/* Age & Budget side by side */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{t.age}</label>
                        <div className="relative flex items-center">
                          <Activity className="w-4 h-4 text-neutral-400 absolute left-3" />
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 25"
                            value={profile.age === '' ? '' : profile.age}
                            onChange={e => setProfile({ ...profile, age: e.target.value === '' ? '' : parseInt(e.target.value) })}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-neutral-900 font-semibold"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{isKo ? '예산 ($USD)' : t.budget}</label>
                        <div className="relative flex items-center">
                          <DollarSign className="w-4 h-4 text-neutral-400 absolute left-3" />
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 1500"
                            value={profile.totalBudget === '' ? '' : profile.totalBudget}
                            onChange={e => setProfile({ ...profile, totalBudget: e.target.value === '' ? '' : parseInt(e.target.value) })}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-neutral-900 font-semibold"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Gender Custom Touch Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">{t.gender}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['male', 'female', 'other'] as const).map((gen) => (
                          <button
                            type="button"
                            key={gen}
                            onClick={() => setProfile({ ...profile, gender: gen })}
                            className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                              profile.gender === gen
                                ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                                : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            {gen === 'male' ? t.male : gen === 'female' ? t.female : t.other}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preferred Region & MBTI side by side */}
                    <div className="grid grid-cols-5 gap-3">
                      <div className="space-y-1 col-span-3">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{t.region}</label>
                        <div className="relative flex items-center">
                          <MapPin className="w-4 h-4 text-neutral-400 absolute left-3" />
                          <input
                            type="text"
                            placeholder={t.regionPlaceholder}
                            value={profile.preferredRegion}
                            onChange={e => setProfile({ ...profile, preferredRegion: e.target.value })}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-neutral-900 font-semibold"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{t.mbti}</label>
                        <input
                          type="text"
                          placeholder="INFP..."
                          maxLength={4}
                          value={profile.mbti}
                          onChange={e => setProfile({ ...profile, mbti: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 text-xs bg-neutral-50 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-neutral-900 font-extrabold uppercase text-center tracking-wider"
                        />
                      </div>
                    </div>

                    {/* Atmosphere Selector */}
                    <div className="space-y-1 relative">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">{t.atmosphere}</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAtmosphereOpen(!isAtmosphereOpen);
                          setIsSpendingOpen(false);
                        }}
                        className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-neutral-900 font-semibold flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span>
                            {atmosphereOptions.find(o => o.key === profile.crowdPreference)?.icon || '🌏'}
                          </span>
                          <span>
                            {t[profile.crowdPreference] || profile.crowdPreference}
                          </span>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-neutral-400 transition-transform ${isAtmosphereOpen ? 'rotate-90' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isAtmosphereOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute z-30 left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto"
                          >
                            <div className="p-1.5 space-y-0.5">
                              {atmosphereOptions.map((item) => (
                                <button
                                  type="button"
                                  key={item.key}
                                  onClick={() => {
                                    setProfile({ ...profile, crowdPreference: item.key });
                                    setIsAtmosphereOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 rounded-lg text-left text-xs font-bold transition-all flex items-center gap-2.5 ${
                                    profile.crowdPreference === item.key
                                      ? 'bg-rose-50 text-rose-600'
                                      : 'text-neutral-700 hover:bg-neutral-50'
                                  }`}
                                >
                                  <span className="text-sm">{item.icon}</span>
                                  <span>{t[item.key]}</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Spending Selector */}
                    <div className="space-y-1 relative">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">{t.spending}</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSpendingOpen(!isSpendingOpen);
                          setIsAtmosphereOpen(false);
                        }}
                        className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-neutral-900 font-semibold flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span>
                            {spendingOptions.find(o => o.key === profile.budgetPreference)?.icon || '⚖️'}
                          </span>
                          <span>
                            {t[profile.budgetPreference] || profile.budgetPreference}
                          </span>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-neutral-400 transition-transform ${isSpendingOpen ? 'rotate-90' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isSpendingOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute z-30 left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto"
                          >
                            <div className="p-1.5 space-y-0.5">
                              {spendingOptions.map((item) => (
                                <button
                                  type="button"
                                  key={item.key}
                                  onClick={() => {
                                    setProfile({ ...profile, budgetPreference: item.key });
                                    setIsSpendingOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 rounded-lg text-left text-xs font-bold transition-all flex items-center gap-2.5 ${
                                    profile.budgetPreference === item.key
                                      ? 'bg-rose-50 text-rose-600'
                                      : 'text-neutral-700 hover:bg-neutral-50'
                                  }`}
                                >
                                  <span className="text-sm">{item.icon}</span>
                                  <span>{t[item.key]}</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Preferred Transportation */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">{t.transportation}</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['subway', 'walking', 'bus', 'train'] as const).map((trans) => (
                          <button
                            type="button"
                            key={trans}
                            onClick={() => setProfile({ ...profile, transportation: trans })}
                            className={`py-1.5 rounded-xl text-[10px] font-extrabold border transition-all ${
                              profile.transportation === trans
                                ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                                : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            {t[trans]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-4 py-3.5 bg-gradient-to-r from-rose-600 via-pink-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 active:scale-98 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{t.analyzing}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>{t.analyze}</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Loader Animated Screen Cover */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                      className="w-20 h-20 text-rose-500 mb-6 bg-rose-50 rounded-full flex items-center justify-center shadow-inner border border-rose-100"
                    >
                      <Compass className="w-10 h-10 stroke-[1.5]" />
                    </motion.div>
                    
                    <h3 className="text-base font-black text-neutral-900 tracking-tight">
                      {isKo ? '맞춤형 AI 가이드 제작 중' : 'Generating Custom AI Guide'}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-2 max-w-[250px] leading-relaxed">
                      {isKo ? '성향, 예산, MBTI를 분석하여 여행객만을 위한 완벽한 여행 스케줄을 구상하고 있습니다.' : 'Analyzing your style, budget, and MBTI to compose the perfect itinerary.'}
                    </p>
                    
                    <div className="flex gap-1.5 mt-8 items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI Recommendation Result Viewer */}
              <AnimatePresence>
                {recommendation && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 pt-0"
                  >
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-neutral-100 flex flex-col relative">
                      {/* Badge and action row */}
                      <div className="flex justify-between items-center pb-4 border-b border-neutral-50 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-neutral-900 leading-none">{t.customItinerary}</h3>
                            <span className="text-[9px] text-neutral-400 font-semibold uppercase">Powered by Gemini AI</span>
                          </div>
                        </div>

                        {/* Copy/Share floating button */}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(recommendation);
                            alert(isKo ? "일정이 클립보드에 복사되었습니다." : "Copied itinerary to clipboard.");
                          }}
                          className="p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-500 active:scale-95 transition-all border border-neutral-200/50"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Styled Markdown content */}
                      <div className="markdown-body text-xs text-neutral-800 leading-relaxed font-normal prose prose-neutral max-w-none prose-p:my-2 prose-h1:text-sm prose-h1:font-black prose-h2:text-xs prose-h2:font-black prose-h3:text-xs prose-li:my-0.5">
                        <ReactMarkdown>{recommendation}</ReactMarkdown>
                      </div>

                      <AdBanner />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'food' && (
            /* =========================================================================
               TAB 2: GOURMET / WORLD CUISINES (FOOD FINDER)
               ========================================================================= */
            <motion.div
              key="food"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col h-full"
            >
              <FoodTab lang={lang} />
            </motion.div>
          )}

          {activeTab === 'feed' && (
            /* =========================================================================
               TAB 3: COMMUNITY STORIES FEED & MODALS
               ========================================================================= */
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col p-4 pb-24 relative h-full"
            >
              {/* Cover intro */}
              <div className="mb-4">
                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {isKo ? '여행자 소통' : 'Traveler Stories'}
                </span>
                <h2 className="text-xl font-black text-neutral-900 mt-1 font-display">
                  {isKo ? '실시간 여행 후기 🌏' : 'Community Trip Feed'}
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5 leading-snug">
                  {isKo ? '세계 방방곡곡을 누빈 모험가들의 솔직하고 생생한 한줄평을 확인해보세요.' : 'Read honest travel stories and ratings shared by global nomads.'}
                </p>
              </div>

              {/* List reviews */}
              {reviews.length === 0 ? (
                <div className="text-center py-16 text-neutral-400 border-2 border-dashed border-neutral-200 rounded-3xl bg-white p-6">
                  <Compass className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
                  <p className="text-xs font-bold">{t.noReviews}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map(review => (
                    <motion.div 
                      key={review.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4.5 rounded-2xl border border-neutral-100 shadow-sm bg-white"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-extrabold text-sm text-neutral-900">{review.destination}</h4>
                          <p className="text-[10px] text-neutral-400 mt-0.5 font-semibold">
                            by <span className="font-bold text-neutral-600">{review.userName}</span> • {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-0.5 text-yellow-400 bg-yellow-50/50 px-2 py-0.5 rounded-full border border-yellow-100">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-neutral-200'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap font-medium">{review.comment}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              <AdBanner />

              {/* Floating Action Button (FAB) to write review */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsReviewModalOpen(true)}
                className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all border border-rose-500/10 z-30"
              >
                <Plus className="w-6 h-6" />
              </motion.button>
            </motion.div>
          )}


        </AnimatePresence>

      </div>

      {/* Slide-Up Bottom Sheet Overlay for composing a Review */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end"
          >
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => setIsReviewModalOpen(false)} />

            {/* Form Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white rounded-t-[32px] p-5 shadow-2xl border-t border-neutral-100 relative z-10 flex flex-col max-h-[85%] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-neutral-100 mb-5 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-extrabold text-sm text-neutral-900">{t.shareExperience}</h3>
                </div>
                <button
                  onClick={() => setIsReviewModalOpen(false)}
                  className="p-1.5 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={submitReview} className="space-y-4">
                
                {/* User Name (only visible if logged out) */}
                {!currentUser && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">이름 / Name</label>
                    <input
                      type="text"
                      placeholder="익명 / Anonymous"
                      value={newReview.userName}
                      onChange={e => setNewReview({ ...newReview, userName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none bg-neutral-50/50 text-xs text-neutral-900 transition-all font-semibold"
                    />
                  </div>
                )}

                {/* Destination Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{t.destination}</label>
                  <input
                    type="text"
                    placeholder={t.destinationPlaceholder}
                    value={newReview.destination}
                    onChange={e => setNewReview({ ...newReview, destination: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none bg-neutral-50/50 text-xs text-neutral-900 transition-all font-semibold"
                    required
                  />
                </div>

                {/* Stars Interactive Rating Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">{t.rating}</label>
                  <div className="flex gap-2 bg-neutral-50/50 p-2.5 rounded-xl border border-neutral-200 w-fit">
                    {[1, 2, 3, 4, 5].map(num => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setNewReview({ ...newReview, rating: num })}
                        className={`p-1 rounded-lg transition-transform hover:scale-110 active:scale-95 ${newReview.rating >= num ? 'text-yellow-400' : 'text-neutral-200'}`}
                      >
                        <Star className="w-6 h-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Comment Textarea */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{t.yourReview}</label>
                  <textarea
                    rows={4}
                    placeholder={t.reviewPlaceholder}
                    value={newReview.comment}
                    onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                    className="w-full px-3.5 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none resize-none bg-neutral-50/50 text-xs text-neutral-900 transition-all font-semibold"
                    required
                  />
                </div>

                {/* Post Review Submit */}
                <button
                  type="submit"
                  className="w-full py-3.5 mt-2 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t.postReview}</span>
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kakao AdFit Bottom Banner */}
      <div className="w-full shrink-0 bg-neutral-50 border-t border-neutral-100 flex justify-center py-1 z-40">
        <KakaoAdFit />
      </div>

      {/* Sticky Bottom Navigation Tab Bar (iOS style) */}
      <nav className="h-[62px] bg-white border-t border-neutral-100 flex justify-around items-center px-1 shrink-0 z-40 select-none">
        
        {/* Tab 1: AI Explorer */}
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center justify-center w-16 h-full relative focus:outline-none ${
            activeTab === 'ai' ? 'text-rose-600' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <Sparkles className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-black mt-1 leading-none">
            {isKo ? 'AI 추천' : 'AI Guide'}
          </span>
          {activeTab === 'ai' && (
            <motion.div layoutId="tab-dot" className="absolute bottom-1 w-1 h-1 bg-rose-600 rounded-full" />
          )}
        </button>

        {/* Tab 2: Gourmet Finder */}
        <button
          onClick={() => setActiveTab('food')}
          className={`flex flex-col items-center justify-center w-16 h-full relative focus:outline-none ${
            activeTab === 'food' ? 'text-rose-600' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <Utensils className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-black mt-1 leading-none">
            {isKo ? '맛집 정보' : 'Gourmet'}
          </span>
          {activeTab === 'food' && (
            <motion.div layoutId="tab-dot" className="absolute bottom-1 w-1 h-1 bg-rose-600 rounded-full" />
          )}
        </button>

        {/* Tab 3: Community Stories Feed */}
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center justify-center w-16 h-full relative focus:outline-none ${
            activeTab === 'feed' ? 'text-rose-600' : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <MessageSquare className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-black mt-1 leading-none">
            {isKo ? '여행 피드' : 'Stories'}
          </span>
          {activeTab === 'feed' && (
            <motion.div layoutId="tab-dot" className="absolute bottom-1 w-1 h-1 bg-rose-600 rounded-full" />
          )}
        </button>



      </nav>

      {/* API Connection Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop close click */}
            <div className="absolute inset-0" onClick={() => setIsSettingsOpen(false)} />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-neutral-100 relative z-10 flex flex-col max-h-[90%] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                    <Settings className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-extrabold text-sm text-neutral-900">
                    {isKo ? '서버 연결 설정' : 'Server Connection'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Instructions */}
              <div className="text-[11px] text-neutral-500 leading-relaxed mb-4 bg-rose-50/50 p-3 rounded-2xl border border-rose-100/50 font-medium">
                {isKo ? (
                  <p>
                    📱 <strong>모바일(앱)에서 API 에러가 나나요?</strong><br />
                    AI 스튜디오 개발 서버는 로그인 보호 장벽이 있어 기기에서 직접 접근할 수 없습니다. 
                    앱에서 실시간 추천을 테스트하려면 아래에서 <strong>Public Cloud (퍼블릭 클라우드)</strong>를 선택하시거나, PC의 로컬 IP 주소를 직접 입력해 보세요!
                  </p>
                ) : (
                  <p>
                    📱 <strong>Getting an API Error on Mobile?</strong><br />
                    AI Studio development servers have a secure login proxy and can\'t be reached directly. 
                    To test recommendation features on your physical phone, select <strong>Public Cloud</strong> or input your computer\'s local IP address below!
                  </p>
                )}
              </div>

              {/* Settings Form */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    {isKo ? 'API 서버 모드' : 'API Server Mode'}
                  </label>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {/* Auto */}
                    <button
                      type="button"
                      onClick={() => setApiMode('auto')}
                      className={`px-3 py-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        apiMode === 'auto' 
                          ? 'border-rose-500 bg-rose-50/30 text-rose-700 font-extrabold' 
                          : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-rose-500" />
                        <span className="text-xs">{isKo ? '자동 감지 (기본)' : 'Auto Detect (Default)'}</span>
                      </div>
                      {apiMode === 'auto' && <Check className="w-4 h-4 text-rose-500" />}
                    </button>

                    {/* Shared */}
                    <button
                      type="button"
                      onClick={() => setApiMode('shared')}
                      className={`px-3 py-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        apiMode === 'shared' 
                          ? 'border-rose-500 bg-rose-50/30 text-rose-700 font-extrabold' 
                          : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs">
                          {isKo ? '퍼블릭 클라우드 (추천)' : 'Public Cloud (Recommended)'}
                        </span>
                      </div>
                      {apiMode === 'shared' && <Check className="w-4 h-4 text-rose-500" />}
                    </button>

                    {/* Dev */}
                    <button
                      type="button"
                      onClick={() => setApiMode('dev')}
                      className={`px-3 py-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        apiMode === 'dev' 
                          ? 'border-rose-500 bg-rose-50/30 text-rose-700 font-extrabold' 
                          : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <WifiOff className="w-4 h-4 text-amber-500" />
                        <span className="text-xs">
                          {isKo ? '개발 클라우드 (보안됨)' : 'Dev Cloud (Protected)'}
                        </span>
                      </div>
                      {apiMode === 'dev' && <Check className="w-4 h-4 text-rose-500" />}
                    </button>

                    {/* Custom */}
                    <button
                      type="button"
                      onClick={() => setApiMode('custom')}
                      className={`px-3 py-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        apiMode === 'custom' 
                          ? 'border-rose-500 bg-rose-50/30 text-rose-700 font-extrabold' 
                          : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-blue-500" />
                        <span className="text-xs">
                          {isKo ? '로컬 PC 서버 (커스텀)' : 'Local PC Server (Custom)'}
                        </span>
                      </div>
                      {apiMode === 'custom' && <Check className="w-4 h-4 text-rose-500" />}
                    </button>
                  </div>
                </div>

                {/* Custom URL Input Field */}
                {apiMode === 'custom' && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      {isKo ? '로컬 PC API 서버 주소' : 'Local PC API URL'}
                    </label>
                    <input
                      type="text"
                      placeholder="http://192.168.x.x:3000"
                      value={apiCustomUrl}
                      onChange={e => setApiCustomUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none bg-neutral-50/50 text-xs text-neutral-950 transition-all font-semibold font-mono"
                    />
                    <span className="text-[10px] text-neutral-400 leading-tight block">
                      {isKo 
                        ? 'PC의 Wi-Fi 네트워크 IP 주소와 포트(3000)를 입력하세요.' 
                        : 'Enter your computer\'s Wi-Fi network IP and port (e.g. 192.168.0.5:3000).'}
                    </span>
                  </div>
                )}

                {/* Connection Test Section */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {testingConnection ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wifi className="w-3.5 h-3.5" />
                    )}
                    <span>{isKo ? '연결 테스트 하기' : 'Test Connection'}</span>
                  </button>

                  {/* Test Result Indicator */}
                  {testResult && (
                    <div className={`mt-2.5 p-3 rounded-2xl text-[11px] leading-relaxed font-semibold flex gap-2 border ${
                      testResult.success 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                        : 'bg-rose-50 text-rose-800 border-rose-100'
                    }`}>
                      {testResult.success ? (
                        <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      )}
                      <div>{testResult.message}</div>
                    </div>
                  )}
                </div>

                {/* AdSense Configuration Section */}
                <div className="pt-3 border-t border-neutral-100 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">
                      {isKo ? '구글 애드센스 수익 연동 설정' : 'Google AdSense Settings'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-400 block uppercase">
                      {isKo ? '애드센스 게시자 ID (Publisher ID)' : 'AdSense Publisher ID'}
                    </label>
                    <input
                      type="text"
                      placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                      value={adsenseClient}
                      onChange={e => setAdsenseClient(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none bg-neutral-50/50 text-[10px] text-neutral-950 transition-all font-semibold font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-400 block uppercase">
                      {isKo ? '광고 단위 ID (Ad Slot ID)' : 'Ad Unit Slot ID'}
                    </label>
                    <input
                      type="text"
                      placeholder="2141105845"
                      value={adsenseSlot}
                      onChange={e => setAdsenseSlot(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none bg-neutral-50/50 text-[10px] text-neutral-950 transition-all font-semibold font-mono"
                    />
                  </div>
                  
                  <span className="text-[9px] text-neutral-400 leading-tight block">
                    {isKo 
                      ? '※ 구글 애드센스에서 발급받은 본인의 게시자 ID와 광고 단위 ID를 입력하면, 웹 사이트에 실제 배너 광고가 연동되어 광고 수익 창출이 가능합니다.' 
                      : '※ Enter your real Google AdSense Publisher ID and Ad Slot ID to display live ads and begin generating revenue on your website.'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-extrabold rounded-xl text-xs transition-all active:scale-95"
                  >
                    {isKo ? '취소' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white font-black rounded-xl text-xs transition-all shadow-md active:scale-95"
                  >
                    {isKo ? '설정 저장' : 'Save Config'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AppInstallModal 
        isOpen={isInstallModalOpen} 
        onClose={() => setIsInstallModalOpen(false)} 
        isKo={isKo} 
      />
    </PhoneContainer>
  );
}
