import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, ChevronRight, X, Heart, Utensils } from 'lucide-react';
import FoodReviews from './FoodReviews';
import { Language } from '../types';

interface FoodItem {
  id: string;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  image: string;
  tagKo: string;
  tagEn: string;
  rating: number;
}

const FOOD_ITEMS: FoodItem[] = [
  {
    id: 'sushi',
    nameKo: '스시 & 초밥',
    nameEn: 'Sushi & Sashimi',
    descKo: '신선한 해산물과 정갈하게 간을 한 밥의 완벽한 조화',
    descEn: 'A masterfully balanced combination of fresh raw seafood and vinegared rice.',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=60',
    tagKo: '일식 / 도쿄',
    tagEn: 'Japanese / Tokyo',
    rating: 4.8
  },
  {
    id: 'ramen',
    nameKo: '돈코츠 라멘',
    nameEn: 'Tonkotsu Ramen',
    descKo: '오랜 시간 우려내어 깊고 진한 돼지 사골 육수와 쫄깃한 생면',
    descEn: 'Rich, creamy pork bone broth served with chewy noodles and tender chashu pork.',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=60',
    tagKo: '일식 / 후쿠오카',
    tagEn: 'Japanese / Fukuoka',
    rating: 4.7
  },
  {
    id: 'pizza',
    nameKo: '화덕 나폴리 피자',
    nameEn: 'Neapolitan Pizza',
    descKo: '참나무 화덕에서 고온으로 구워 쫄깃한 도우와 듬뿍 늘어나는 고소한 치즈',
    descEn: 'Authentic high-heat wood-fired pizza with puffy crust, fresh basil, and creamy mozzarella.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=60',
    tagKo: '양식 / 나폴리',
    tagEn: 'Italian / Naples',
    rating: 4.9
  },
  {
    id: 'tacos',
    nameKo: '오리지널 타코',
    nameEn: 'Mexican Tacos',
    descKo: '부드러운 또띠아에 그릴드 미트, 신선한 고수와 매콤상큼한 라임 소스',
    descEn: 'Warm corn tortillas filled with perfectly spiced meat, fresh cilantro, onions, and zesty lime.',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=60',
    tagKo: '남미식 / 멕시코시티',
    tagEn: 'Mexican / Mexico City',
    rating: 4.6
  },
  {
    id: 'croissant',
    nameKo: '버터 크루아상',
    nameEn: 'Butter Croissant',
    descKo: '최고급 프랑스산 버터를 넣어 한 겹 한 겹 바삭하고 속은 촉촉한 페이스트리',
    descEn: 'Crispy, flaky golden-brown layers with a rich buttery fragrance and soft, airy interior.',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=60',
    tagKo: '디저트 / 파리',
    tagEn: 'French Bakery / Paris',
    rating: 4.9
  },
  {
    id: 'padthai',
    nameKo: '태국식 팟타이',
    nameEn: 'Pad Thai Noodles',
    descKo: '달콤, 짭조름, 새콤한 소스에 아삭한 숙주와 새우를 센 불에 볶아낸 쌀국수',
    descEn: 'Stir-fried rice noodles with tofu, shrimp, peanuts, and bean sprouts in a sweet-savory tamarind sauce.',
    image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&auto=format&fit=crop&q=60',
    tagKo: '아시안 / 방콕',
    tagEn: 'Thai / Bangkok',
    rating: 4.5
  }
];

interface FoodTabProps {
  lang: Language;
}

export default function FoodTab({ lang }: FoodTabProps) {
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [likedFoods, setLikedFoods] = useState<Record<string, boolean>>({});

  const toggleLike = (foodId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedFoods(prev => ({ ...prev, [foodId]: !prev[foodId] }));
  };

  const isKo = lang === 'ko';

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50 overflow-y-auto">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-rose-500 text-white p-5 rounded-b-3xl shadow-md">
        <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
          {isKo ? '맛집 탐방' : 'Gourmet Finder'}
        </span>
        <h2 className="text-xl font-black mt-2 font-display leading-tight">
          {isKo ? '글로벌 인기 맛집 탐방 🍕' : 'Trending Global Food & Drinks'}
        </h2>
        <p className="text-xs text-white/80 mt-1">
          {isKo ? '여행객들이 극찬한 현지 최고의 요리들을 확인해보세요.' : 'Explore local culinary gems loved by travelers around the world.'}
        </p>
      </div>

      {/* Grid of Food Cuisines */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 pb-24">
        {FOOD_ITEMS.map((item) => (
          <motion.div
            key={item.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedFood(item)}
            className="flex bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-sm cursor-pointer hover:shadow-md hover:border-neutral-200 transition-all duration-200"
          >
            {/* Food Image */}
            <div className="w-28 h-28 relative shrink-0">
              <img
                src={item.image}
                alt={isKo ? item.nameKo : item.nameEn}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Like Floating Icon */}
              <button
                onClick={(e) => toggleLike(item.id, e)}
                className="absolute top-1.5 left-1.5 p-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-neutral-100 hover:scale-110 active:scale-95 transition-transform"
              >
                <Heart
                  className={`w-3.5 h-3.5 transition-colors ${
                    likedFoods[item.id] ? 'fill-rose-500 text-rose-500' : 'text-neutral-400'
                  }`}
                />
              </button>
            </div>

            {/* Food Info */}
            <div className="flex-1 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                    {isKo ? item.tagKo : item.tagEn}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-500 text-xs font-bold">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{item.rating}</span>
                  </div>
                </div>
                
                <h3 className="font-extrabold text-sm text-neutral-900 mt-1.5">
                  {isKo ? item.nameKo : item.nameEn}
                </h3>
                
                <p className="text-[11px] text-neutral-500 line-clamp-2 mt-1 leading-relaxed">
                  {isKo ? item.descKo : item.descEn}
                </p>
              </div>

              <div className="flex items-center justify-end text-[10px] text-neutral-400 font-bold mt-1.5 gap-0.5">
                <span>{isKo ? '리뷰 보기' : 'Read reviews'}</span>
                <ChevronRight className="w-3 h-3 text-neutral-400" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Food Reviews Detail Overlay Panel */}
      <AnimatePresence>
        {selectedFood && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end"
          >
            {/* Modal Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => setSelectedFood(null)} />

            {/* Details Sheet Content */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white rounded-t-[32px] max-h-[85%] overflow-y-auto relative z-10 flex flex-col shadow-2xl border-t border-neutral-100"
            >
              {/* Header Image inside Sheet */}
              <div className="h-44 relative shrink-0">
                <img
                  src={selectedFood.image}
                  alt={isKo ? selectedFood.nameKo : selectedFood.nameEn}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Close Button */}
                <button
                  onClick={() => setSelectedFood(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 hover:bg-black/60 active:scale-95 transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Text overlay on image */}
                <div className="absolute bottom-4 left-5 right-5 text-white">
                  <span className="text-[10px] font-bold bg-rose-600 px-2 py-0.5 rounded-full uppercase">
                    {isKo ? selectedFood.tagKo : selectedFood.tagEn}
                  </span>
                  <h3 className="text-lg font-black mt-1 font-display leading-tight">
                    {isKo ? selectedFood.nameKo : selectedFood.nameEn}
                  </h3>
                  <p className="text-xs text-white/90 font-medium mt-1 leading-snug line-clamp-2">
                    {isKo ? selectedFood.descKo : selectedFood.descEn}
                  </p>
                </div>
              </div>

              {/* Mounted reviews component */}
              <div className="p-4 pb-12 flex-1">
                <FoodReviews foodId={selectedFood.id} lang={lang as any} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
