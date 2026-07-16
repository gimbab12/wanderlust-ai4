import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Smartphone, Download, Chrome, Compass, 
  Sparkles
} from 'lucide-react';

// @ts-ignore
import appIcon from '../assets/images/app_icon_1783212531908.jpg';

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isKo: boolean;
}

export default function AppInstallModal({ isOpen, onClose, isKo }: AppInstallModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-neutral-100 flex flex-col relative z-10 max-h-[85vh]"
        >
          {/* Header */}
          <div className="relative p-5 pb-3 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-rose-500 to-orange-500 text-white">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              <span className="font-black text-sm tracking-tight font-display">
                {isKo ? '스마트폰 앱으로 사용하기' : 'Install as Mobile App'}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
            <div className="space-y-4">
              <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100/50 text-center">
                <div className="relative inline-block mb-3">
                  <img 
                    src={appIcon} 
                    alt="Wanderlust App Icon" 
                    className="w-16 h-16 rounded-2xl shadow-xl border border-white/80 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-full p-1 shadow-md border border-white animate-bounce" style={{ animationDuration: '3s' }}>
                    <Sparkles className="w-3 h-3" />
                  </div>
                </div>
                <h3 className="text-xs font-extrabold text-neutral-800">
                  {isKo ? '다운로드 없이 1초만에 홈 화면에 추가!' : 'Add to home screen in 1 second!'}
                </h3>
                <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
                  {isKo 
                    ? '기기 용량을 차지하지 않고 홈 화면에서 바로 네이티브 모바일 앱처럼 쾌적하게 구동됩니다.' 
                    : 'Launches full-screen like a native app without taking up your device space.'}
                </p>
              </div>

              {/* Android / Chrome Guide */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-black text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Chrome className="w-4 h-4 text-emerald-500" />
                  {isKo ? '안드로이드 & 크롬 브라우저' : 'Android & Chrome'}
                </h4>
                <div className="bg-neutral-50 rounded-xl p-3 text-[11px] text-neutral-600 font-bold space-y-1.5 border border-neutral-150">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center text-[10px] shrink-0 font-bold">1</span>
                    <span>{isKo ? '우측 상단의 더보기 아이콘(점 3개)을 클릭합니다.' : 'Tap the menu icon (3 dots) on top-right.'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center text-[10px] shrink-0 font-bold">2</span>
                    <span>{isKo ? '“홈 화면에 추가” 또는 “앱 설치”를 클릭합니다.' : 'Select "Add to Home screen" or "Install App".'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
                    <span>{isKo ? '바탕화면에 아이콘이 생성되어 앱으로 구동됩니다!' : 'Launch it anytime directly from your home screen!'}</span>
                  </div>
                </div>
              </div>

              {/* iOS / Safari Guide */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-black text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-500" />
                  {isKo ? '아이폰 & 사파리 브라우저' : 'iOS & Safari'}
                </h4>
                <div className="bg-neutral-50 rounded-xl p-3 text-[11px] text-neutral-600 font-bold space-y-1.5 border border-neutral-150">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center text-[10px] shrink-0 font-bold">1</span>
                    <span>{isKo ? 'Safari 브라우저에서 하단 중앙의 “공유” 아이콘을 누릅니다.' : 'Tap the "Share" button at the bottom navigation.'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center text-[10px] shrink-0 font-bold">2</span>
                    <span>{isKo ? '목록을 내려 “홈 화면에 추가”를 터치합니다.' : 'Scroll down and select "Add to Home Screen".'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
                    <span>{isKo ? '바탕화면의 Wanderlust 아이콘으로 앱을 켭니다!' : 'The app icon is added with seamless launch animations.'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Close Button */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end shrink-0">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-extrabold hover:bg-neutral-800 transition-all shadow-sm"
            >
              {isKo ? '닫기' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
