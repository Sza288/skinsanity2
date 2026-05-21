export type SkincareCategory = 'Cleanser' | 'Toner' | 'Ampoule' | 'Serum' | 'Moisturizer' | 'Sunscreen' | 'Exfoliant' | 'Mask' | 'Eye Cream' | 'Other';

export interface SkincareProduct {
  id: string;
  brand: string;
  name: string;
  category: SkincareCategory;
  expiryDate: string; // YYYY-MM
  openDate?: string; // YYYY-MM-DD
  paoMonths?: number; // Period After Opening in months (e.g. 6, 12, 18)
  remainingPercent: number; // 0 to 100
  imageUrl?: string;
  skinConcerns: string[]; // e.g. ["Hydration", "Barrier repair", "Acne", "Aging"]
  notes?: string;
  assignedRoutine: 'AM' | 'PM' | 'Both' | 'None';
  isFavorite?: boolean;
}

export interface RoutineStep {
  productId: string;
  isCompleted: boolean;
}

export interface DailyRoutineState {
  date: string; // YYYY-MM-DD
  amCompleted: { [productId: string]: boolean };
  pmCompleted: { [productId: string]: boolean };
}

export interface SkinProfile {
  skinType: 'Dry' | 'Oily' | 'Combination' | 'Normal' | 'Sensitive';
  concerns: string[];
  climate: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
}
