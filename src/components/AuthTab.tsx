import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, Mail, Lock, UserPlus, LogIn, LogOut, Loader2, 
  MapPin, Clipboard, Heart, Globe, AlertCircle, Sparkles, BookOpen
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Language } from '../types';
import { translations } from '../i18n';

interface AuthTabProps {
  lang: Language;
}

export default function AuthTab({ lang }: AuthTabProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Status states
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // User Stats
  const [reviewCount, setReviewCount] = useState(0);

  const t = translations[lang];
  const isKo = lang === 'ko';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        // Fetch real-time count of reviews written by this user
        try {
          const q = query(
            collection(db, 'reviews'),
            where('userId', '==', currentUser.uid)
          );
          const snap = await getDocs(q);
          setReviewCount(snap.size);
        } catch (err) {
          console.error("Error fetching user stats:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setActionLoading(true);

    if (!email.trim() || !password.trim()) {
      setErrorMsg(isKo ? '이메일과 비밀번호를 입력해주세요.' : 'Please fill all required fields.');
      setActionLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg(t.passwordMinLength);
      setActionLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setErrorMsg(isKo ? '이름을 입력해주세요.' : 'Please enter your name.');
          setActionLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name.trim()
        });
        setUser({ ...userCredential.user });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      // Clear forms
      setEmail('');
      setPassword('');
      setName('');
    } catch (err: any) {
      console.error(err);
      let msg = err.message;
      if (err.code === 'auth/email-already-in-use') {
        msg = isKo ? '이미 사용 중인 이메일 주소입니다.' : 'This email is already in use.';
      } else if (err.code === 'auth/weak-password') {
        msg = t.passwordMinLength;
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = isKo ? '이메일 또는 비밀번호가 일치하지 않습니다.' : 'Invalid email or password.';
      } else {
        msg = isKo ? '오류가 발생했습니다. 다시 시도해 주세요.' : 'An error occurred. Please try again.';
      }
      setErrorMsg(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50 h-full">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        <span className="text-xs text-neutral-400 mt-2">Loading Profile...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50 overflow-y-auto">
      {user ? (
        /* Logged In Traveler Profile Dashboard */
        <div className="flex-1 flex flex-col">
          {/* Cover Header */}
          <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-orange-500 h-32 relative shrink-0">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute -bottom-10 left-6 flex items-end gap-3.5">
              <div className="w-20 h-20 bg-white rounded-2xl p-1.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full rounded-xl bg-gradient-to-tr from-rose-100 to-amber-100 flex items-center justify-center text-rose-600 border border-rose-50 font-black text-2xl uppercase shadow-inner">
                  {user.displayName ? user.displayName.charAt(0) : 'U'}
                </div>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="px-6 pt-12 pb-6 bg-white border-b border-neutral-100">
            <h2 className="text-xl font-black text-neutral-900 flex items-center gap-1.5">
              <span>{user.displayName || 'Traveler'}</span>
              {user.email === 'mrbinor8@gmail.com' ? (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-wider">ADMIN</span>
              ) : (
                <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full uppercase tracking-wider">MEMBER</span>
              )}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5 font-medium flex items-center gap-1">
              <Mail className="w-3 h-3" />
              <span>{user.email}</span>
            </p>
          </div>

          {/* User Stats Grid */}
          <div className="p-4 grid grid-cols-2 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">
                  {isKo ? '작성 피드' : 'My Stories'}
                </span>
                <span className="text-base font-black text-neutral-800">{reviewCount}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">
                  {isKo ? '현재 언어' : 'Language'}
                </span>
                <span className="text-xs font-black text-neutral-800 uppercase">{lang}</span>
              </div>
            </div>
          </div>

          {/* Profile Menu Actions */}
          <div className="p-4 flex-1">
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-neutral-50 flex items-center justify-between">
                <span className="text-xs font-extrabold text-neutral-800">{isKo ? '앱 운영 모드' : 'App Operation Mode'}</span>
                {user.email === 'mrbinor8@gmail.com' ? (
                  <span className="text-[10px] text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded-full">{isKo ? '관리자 모드 (Admin)' : 'Admin Mode'}</span>
                ) : (
                  <span className="text-[10px] text-neutral-600 font-bold bg-neutral-100 px-2 py-0.5 rounded-full">{isKo ? '일반 사용자 모드' : 'User Mode'}</span>
                )}
              </div>
              <div className="p-4 border-b border-neutral-50 flex items-center justify-between">
                <span className="text-xs font-extrabold text-neutral-800">{isKo ? '여행 뱃지' : 'Travel Badges'}</span>
                <span className="text-[10px] text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-full">{isKo ? '새내기 탐험가' : 'Novice Explorer'}</span>
              </div>
              <div className="p-4 border-b border-neutral-50 flex items-center justify-between">
                <span className="text-xs font-extrabold text-neutral-800">{isKo ? '보안 설정' : 'Security Status'}</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">{isKo ? '로그인 활성화' : 'Authorized'}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full mt-6 py-3 px-4 bg-rose-50 hover:bg-rose-100 active:scale-98 text-rose-600 border border-rose-100 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.signOut}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Logged Out Login/Registration Card Form */
        <div className="p-6 flex flex-col justify-center flex-1">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-neutral-900 mt-3 font-display">
              {isKo ? 'Wanderlust AI 멤버십' : 'Wanderlust AI Membership'}
            </h2>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              {isKo ? '로그인하고 직접 다녀온 여행 후기와 미식 리뷰를 남겨보세요.' : 'Sign in to share your global travel reviews and food experiences.'}
            </p>
          </div>

          {/* Form container */}
          <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm">
            {/* Sliding Tab Header */}
            <div className="flex bg-neutral-100 rounded-xl p-1 mb-5">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all ${!isSignUp ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}
              >
                {t.signIn}
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all ${isSignUp ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}
              >
                {t.signUp}
              </button>
            </div>

            {/* Forms body */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{t.name}</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3" />
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 outline-none text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:bg-white text-neutral-900 transition-all font-medium"
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{t.email}</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3" />
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 outline-none text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:bg-white text-neutral-900 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{t.password}</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3" />
                  <input
                    type="password"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 outline-none text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:bg-white text-neutral-900 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              {/* Alert Message */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-600 font-bold flex gap-1.5 items-start">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 disabled:opacity-50 mt-4"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSignUp ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{t.signUp}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{t.signIn}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Toggle Hint */}
          <p className="text-center text-[11px] text-neutral-400 mt-4 font-bold">
            {isSignUp ? (
              <span className="cursor-pointer text-rose-500 hover:underline" onClick={() => { setIsSignUp(false); setErrorMsg(null); }}>
                {t.alreadyHaveAccount}
              </span>
            ) : (
              <span className="cursor-pointer text-rose-500 hover:underline" onClick={() => { setIsSignUp(true); setErrorMsg(null); }}>
                {t.dontHaveAccount}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
