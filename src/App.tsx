import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plane, Compass, Sparkles, LogIn, LogOut, Loader2, MapPin, MessageSquare, Star, Globe } from 'lucide-react';
import { auth, db } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot, orderBy } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import { TravelProfile, Review, Language } from './types';
import { translations } from './i18n';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>('ko');
  const t = translations[lang];

  const [profile, setProfile] = useState<TravelProfile>({
    age: 25,
    gender: '',
    mbti: '',
    preferredRegion: '',
    crowdPreference: 'neutral',
    budgetPreference: 'balanced',
    totalBudget: 1500,
    transportation: '',
    language: 'ko'
  });
  const [recommendation, setRecommendation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ destination: '', comment: '', rating: 5 });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribeReviews = onSnapshot(q, (snapshot) => {
      const revs: Review[] = [];
      snapshot.forEach((doc) => {
        revs.push({ id: doc.id, ...doc.data() } as Review);
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

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setIsAuthModalOpen(false);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    if (password.length < 6) {
      setAuthError(t.passwordMinLength);
      setAuthLoading(false);
      return;
    }

    try {
      if (authMode === 'signUp') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(userCredential.user, {
            displayName: name.trim()
          });
        }
        setUser({ ...userCredential.user, displayName: name.trim() || userCredential.user.displayName });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setEmail('');
      setPassword('');
      setName('');
      setIsAuthModalOpen(false);
    } catch (error: any) {
      console.error("Auth error:", error);
      let errMsg = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errMsg = lang === 'ko' ? '이미 사용 중인 이메일입니다.' : 'This email is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        errMsg = lang === 'ko' ? '올바르지 않은 이메일 형식입니다.' : 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errMsg = lang === 'ko' ? '비밀번호가 너무 취약합니다.' : 'The password is too weak.';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errMsg = lang === 'ko' ? '이메일 또는 비밀번호가 올바르지 않습니다.' : 'Invalid email or password.';
      }
      setAuthError(errMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  const submitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRecommendation('');
    try {
      const response = await fetch('/api/recommend', {
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
    if (!user) return alert("Please sign in to leave a review.");
    if (!newReview.destination || !newReview.comment) return alert("Please fill all fields.");

    try {
      await addDoc(collection(db, 'reviews'), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        destination: newReview.destination,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: Date.now()
      });
      setNewReview({ destination: '', comment: '', rating: 5 });
    } catch (error) {
      console.error("Error adding review:", error);
      alert("Failed to add review. Make sure you are signed in.");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-rose-200">
      <header className="absolute top-0 w-full z-20 bg-white/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white drop-shadow-md">
            <Plane className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-black/20 rounded-full px-3 py-1 text-white border border-white/20">
              <Globe className="w-4 h-4 mr-2" />
              <select 
                value={lang} 
                onChange={handleLanguageChange}
                className="bg-transparent outline-none text-sm font-medium appearance-none cursor-pointer"
              >
                <option value="ko" className="text-black">한국어</option>
                <option value="en" className="text-black">English</option>
                <option value="ja" className="text-black">日本語</option>
                <option value="zh" className="text-black">中文</option>
                <option value="es" className="text-black">Español</option>
                <option value="fr" className="text-black">Français</option>
                <option value="de" className="text-black">Deutsch</option>
              </select>
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-white hidden sm:inline-block drop-shadow-md">
                  {user.displayName}
                </span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm border border-white/20"
                >
                  <LogOut className="w-4 h-4" />
                  {t.signOut}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('signIn');
                  setAuthError('');
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-full transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                {t.signIn}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative min-h-[90vh] flex flex-col justify-end pt-24 pb-8 md:pb-16 px-4 md:px-8">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop" 
            alt="Travel Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-rose-900/20 to-neutral-50/0"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-8 mt-auto">
          <div className="text-left mb-4 md:mb-0 max-w-xl">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg tracking-tight font-display">
              {t.title}
            </h2>
            <p className="text-lg md:text-xl text-white/90 font-medium drop-shadow-md">
              {t.subtitle}
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-5 w-full max-w-md shrink-0"
          >
            <form onSubmit={submitProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-800">{t.age}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 25"
                    value={profile.age === '' ? '' : profile.age}
                    onChange={e => setProfile({ ...profile, age: e.target.value === '' ? '' : parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-white/70 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-shadow text-neutral-900"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-800">{t.budget}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1500"
                    value={profile.totalBudget === '' ? '' : profile.totalBudget}
                    onChange={e => setProfile({ ...profile, totalBudget: e.target.value === '' ? '' : parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-white/70 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-shadow text-neutral-900"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-800">{t.gender}</label>
                  <select
                    value={profile.gender}
                    onChange={e => setProfile({ ...profile, gender: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-white/70 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-shadow text-neutral-900 cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="male">{t.male}</option>
                    <option value="female">{t.female}</option>
                    <option value="other">{t.other}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-800">{t.mbti}</label>
                  <input
                    type="text"
                    placeholder={t.mbtiPlaceholder}
                    value={profile.mbti}
                    onChange={e => setProfile({ ...profile, mbti: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white/70 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-shadow text-neutral-900 uppercase"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-neutral-800">{t.region}</label>
                  <input
                    type="text"
                    placeholder={t.regionPlaceholder}
                    value={profile.preferredRegion}
                    onChange={e => setProfile({ ...profile, preferredRegion: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white/70 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-shadow text-neutral-900"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-800">{t.atmosphere}</label>
                  <select
                    value={profile.crowdPreference}
                    onChange={e => setProfile({ ...profile, crowdPreference: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-white/70 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-shadow text-neutral-900 cursor-pointer"
                  >
                    <option value="quiet">{t.quiet}</option>
                    <option value="neutral">{t.neutral}</option>
                    <option value="crowded">{t.crowded}</option>
                    <option value="historical">{t.historical}</option>
                    <option value="modern">{t.modern}</option>
                    <option value="nature">{t.nature}</option>
                    <option value="artistic">{t.artistic}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-800">{t.spending}</label>
                  <select
                    value={profile.budgetPreference}
                    onChange={e => setProfile({ ...profile, budgetPreference: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-white/70 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-shadow text-neutral-900 cursor-pointer"
                  >
                    <option value="cheap">{t.cheap}</option>
                    <option value="balanced">{t.balanced}</option>
                    <option value="expensive">{t.expensive}</option>
                    <option value="flex">{t.flex}</option>
                    <option value="shopping">{t.shopping}</option>
                    <option value="foodie">{t.foodie}</option>
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-neutral-800">{t.transportation}</label>
                  <select
                    value={profile.transportation}
                    onChange={e => setProfile({ ...profile, transportation: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-white/70 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-shadow text-neutral-900 cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select Transportation</option>
                    <option value="bus">{t.bus}</option>
                    <option value="walking">{t.walking}</option>
                    <option value="subway">{t.subway}</option>
                    <option value="train">{t.train}</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    {t.analyzing}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    {t.analyze}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pb-24 space-y-16 -mt-8 relative z-10">
        <AnimatePresence>
          {recommendation && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-neutral-100"
            >
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-neutral-100">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                  <MapPin className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight font-display text-neutral-900">{t.customItinerary}</h2>
              </div>
              <div className="markdown-body prose prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-h2:text-2xl prose-a:text-rose-600 hover:prose-a:text-rose-500 prose-img:rounded-2xl prose-img:shadow-lg prose-img:w-full prose-img:max-h-[400px] prose-img:object-cover prose-img:my-8">
                <ReactMarkdown>{recommendation}</ReactMarkdown>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <section className="bg-white rounded-3xl shadow-lg border border-neutral-100 p-8 md:p-12">
          <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white-100">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight font-display text-neutral-900">{t.reviews}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1">
              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 sticky top-24">
                <h3 className="font-bold text-lg text-neutral-900 mb-6">{t.shareExperience}</h3>
                {user ? (
                  <form onSubmit={submitReview} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-neutral-700">{t.destination}</label>
                      <input
                        type="text"
                        placeholder={t.destinationPlaceholder}
                        value={newReview.destination}
                        onChange={e => setNewReview({ ...newReview, destination: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-rose-500 outline-none bg-white transition-shadow"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-neutral-700">{t.rating}</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(num => (
                          <button
                            type="button"
                            key={num}
                            onClick={() => setNewReview({ ...newReview, rating: num })}
                            className={`p-1.5 rounded-lg transition-colors ${newReview.rating >= num ? 'text-yellow-400 bg-yellow-50' : 'text-neutral-300 hover:bg-neutral-100'}`}
                          >
                            <Star className="w-6 h-6 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-neutral-700">{t.yourReview}</label>
                      <textarea
                        rows={4}
                        placeholder={t.reviewPlaceholder}
                        value={newReview.comment}
                        onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-rose-500 outline-none resize-none bg-white transition-shadow"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                      {t.postReview}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LogIn className="w-8 h-8 text-rose-500" />
                    </div>
                    <p className="text-sm text-neutral-500 mb-6">{t.signInToReview}</p>
                    <button
                      onClick={() => {
                        setAuthMode('signIn');
                        setAuthError('');
                        setIsAuthModalOpen(true);
                      }}
                      className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-full transition-colors shadow-md"
                    >
                      {t.signIn}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {reviews.length === 0 ? (
                <div className="text-center py-16 text-neutral-400 border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                  <Compass className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                  <p className="font-medium">{t.noReviews}</p>
                </div>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="p-6 rounded-2xl border border-neutral-100 hover:border-neutral-200 hover:shadow-md transition-all bg-white">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-neutral-900">{review.destination}</h4>
                        <p className="text-sm text-neutral-500">by <span className="font-medium text-neutral-700">{review.userName}</span> • {new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex text-yellow-400 bg-yellow-50 px-2 py-1 rounded-full">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-yellow-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-neutral-100 z-10 overflow-hidden"
            >
              {/* Close button */}
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-rose-500">
                  <Plane className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold font-display text-neutral-900">
                  {authMode === 'signIn' ? t.signIn : t.signUp}
                </h3>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-neutral-100 mb-6">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signIn'); setAuthError(''); }}
                  className={`flex-1 pb-3 text-sm font-semibold transition-colors relative ${authMode === 'signIn' ? 'text-rose-600' : 'text-neutral-400 hover:text-neutral-600'}`}
                >
                  {t.signIn}
                  {authMode === 'signIn' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signUp'); setAuthError(''); }}
                  className={`flex-1 pb-3 text-sm font-semibold transition-colors relative ${authMode === 'signUp' ? 'text-rose-600' : 'text-neutral-400 hover:text-neutral-600'}`}
                >
                  {t.signUp}
                  {authMode === 'signUp' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600" />
                  )}
                </button>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold leading-relaxed">
                  {authError}
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {authMode === 'signUp' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700">{t.name}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-neutral-50 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all text-neutral-900"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">{t.email}</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-neutral-50 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all text-neutral-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">{t.password}</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-neutral-50 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all text-neutral-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 mt-6"
                >
                  {authLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    authMode === 'signIn' ? t.signIn : t.signUp
                  )}
                </button>
              </form>

              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-neutral-100"></div>
                <span className="flex-shrink mx-4 text-neutral-400 text-xs font-medium uppercase tracking-wider">or</span>
                <div className="flex-grow border-t border-neutral-100"></div>
              </div>

              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                type="button"
                className="w-full py-3 border border-neutral-200 hover:bg-neutral-50 rounded-xl font-semibold text-sm text-neutral-700 flex items-center justify-center gap-2.5 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {lang === 'ko' ? 'Google로 계속하기' : 'Continue with Google'}
              </button>

              <div className="text-center mt-6 text-xs text-neutral-500">
                <button
                  onClick={() => {
                    setAuthMode(authMode === 'signIn' ? 'signUp' : 'signIn');
                    setAuthError('');
                  }}
                  className="hover:underline font-semibold text-rose-600 transition-all"
                >
                  {authMode === 'signIn' ? t.dontHaveAccount : t.alreadyHaveAccount}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
