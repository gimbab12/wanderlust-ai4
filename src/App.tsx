import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plane, Compass, Sparkles, Loader2, MapPin, MessageSquare, Star, Globe } from 'lucide-react';
import { db } from './lib/firebase';
import { collection, addDoc, query, onSnapshot, orderBy } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import { TravelProfile, Review, Language } from './types';
import { translations } from './i18n';

export default function App() {
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
  const [newReview, setNewReview] = useState({ userName: '', destination: '', comment: '', rating: 5 });

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribeReviews = onSnapshot(q, (snapshot) => {
      const revs: Review[] = [];
      snapshot.forEach((doc) => {
        revs.push({ id: doc.id, ...doc.data() } as Review);
      });
      setReviews(revs);
    });

    return () => {
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
    if (!newReview.destination || !newReview.comment) return alert("Please fill all fields.");

    try {
      await addDoc(collection(db, 'reviews'), {
        userId: 'anonymous',
        userName: newReview.userName.trim() || 'Anonymous',
        destination: newReview.destination,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: Date.now()
      });
      setNewReview({ userName: '', destination: '', comment: '', rating: 5 });
    } catch (error) {
      console.error("Error adding review:", error);
      alert("Failed to add review.");
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
                <form onSubmit={submitReview} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700">이름 / Name</label>
                    <input
                      type="text"
                      placeholder="익명 / Anonymous"
                      value={newReview.userName}
                      onChange={e => setNewReview({ ...newReview, userName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-rose-500 outline-none bg-white transition-shadow"
                    />
                  </div>
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
    </div>
  );
}
