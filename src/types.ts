export type Language = 'en' | 'ko' | 'ja' | 'zh' | 'es' | 'fr' | 'de';

export interface TravelProfile {
  age: number | '';
  gender: 'male' | 'female' | 'other' | '';
  mbti: string;
  preferredRegion: string;
  crowdPreference: 'crowded' | 'quiet' | 'neutral' | 'historical' | 'modern' | 'nature' | 'artistic';
  budgetPreference: 'expensive' | 'cheap' | 'balanced' | 'flex' | 'shopping' | 'foodie';
  totalBudget: number | '';
  transportation: 'bus' | 'walking' | 'subway' | 'train' | '';
  language: Language;
}

export interface Review {
  id?: string;
  destination: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: number;
}
