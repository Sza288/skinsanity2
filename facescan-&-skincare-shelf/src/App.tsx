import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Plus, Image as ImageIcon, Trash2, Edit3, Heart, 
  AlertTriangle, Check, ShieldAlert, BadgeInfo, Info, Flame, Code, 
  Copy, Download, MessageSquare, Send, CheckCircle2, RotateCcw,
  Zap, Compass, Calendar, Droplets, Camera, HelpCircle, User,
  Volume2, ExternalLink, Search, SlidersHorizontal, Bell, HelpCircle as HelpIcon,
  Check as CheckIcon, Filter, RefreshCw
} from 'lucide-react';
import { SkincareProduct, ChatMessage, SkincareCategory } from './types';
import { DEFAULT_PRODUCTS, SKIN_CONCERNS_LIST, CATEGORIES_LIST } from './constants';
import ProductEditModal from './components/ProductEditModal';

interface AppNotification {
  id: string;
  title: string;
  text: string;
  productId?: string;
  date: string;
  read: boolean;
}

interface ProductReview {
  id: string;
  author: string;
  rating: number;
  content: string;
  date: string;
  durationOfUse?: string;
  replies: { author: string; content: string; date: string }[];
}

export default function App() {
  // Login/Session states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<{ username?: string; password?: string }>({});
  const [userProfile, setUserProfile] = useState({
    name: 'Hailey',
    email: 'Hailey 88@gmail.com',
    phone: '+62 812-3456-7890',
    location: 'Tembalang, Indonesia',
    birthday: '12 April 1998',
    skinType: 'Dry-Sensitive',
    mainConcern: 'Acne & Hyperpigmentation',
    memberSince: '2020',
  });

  // Skincare Manual Input states for typing form (Figma Screen 5)
  const [inputBrand, setInputBrand] = useState('');
  const [inputCategory, setInputCategory] = useState('');
  const [inputProductName, setInputProductName] = useState('');
  const [inputExpiredDate, setInputExpiredDate] = useState('');

  // Navigation states
  // 'shelf' (Home) | 'shelf-list' (Cabinet) | 'input-skincare' (Input form) | 'search' | 'cooling-off' | 'profile' | 'facescan' | 'facescan-result' | 'review-aggregator' | 'product-detail'
  const [currentScreen, setCurrentScreen] = useState<'shelf' | 'shelf-list' | 'input-skincare' | 'search' | 'cooling-off' | 'profile' | 'facescan' | 'facescan-result' | 'review-aggregator' | 'product-detail'>('shelf');
  
  // Previous screen history helper, defaults to shelf
  const [lastScreen, setLastScreen] = useState<'shelf' | 'shelf-list' | 'input-skincare' | 'search' | 'cooling-off' | 'profile' | 'review-aggregator' | 'product-detail'>('shelf');

  // Products database & inventory
  const [products, setProducts] = useState<SkincareProduct[]>(() => {
    const saved = localStorage.getItem('skincare_products');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });

  // Ingredients search engine states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'alphabetical' | 'location' | 'expiry'>('alphabetical');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  // Interactive reviews with replies state
  const [productReviews, setProductReviews] = useState<ProductReview[]>([
    {
      id: 'r1',
      author: 'khanza qaila',
      rating: 5,
      content: 'Using Ceramide Calm Essence really rescued my damaged skin cells after over-exfoliation. It is extremely soothing and moisturizes beautifully!',
      date: '10 May 2026',
      durationOfUse: '2 Weeks of Use',
      replies: [
        { author: 'GlowAdvisor AI', content: 'Centella and Ceramides are marvelous together to fortify compromised stratums.', date: '10 May 2026' }
      ]
    },
    {
      id: 'r2',
      author: 'Aulia S.',
      rating: 4,
      content: 'Smells mild, helps decrease redness around my jaw. Very fluid, absorbs under 20 seconds.',
      date: '12 May 2026',
      durationOfUse: '1 Day of Use',
      replies: []
    }
  ]);
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(2);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewDuration, setNewReviewDuration] = useState('2 Weeks of Use');
  const [replyInputs, setReplyInputs] = useState<{ [reviewId: string]: string }>({});

  // Active Shopping Safeguard / Cooling off states
  const [coolingOffActive, setCoolingOffActive] = useState<boolean>(() => {
    return localStorage.getItem('cooling_off_active') === 'true';
  });
  const [coolingOffDuration, setCoolingOffDuration] = useState<number>(14); // default 14-days jeda
  const [coolingOffDay, setCoolingOffDay] = useState<number>(3);
  const [barrierIntegrity, setBarrierIntegrity] = useState<number>(45); // % skin health
  const [impulsivePreventionOption, setImpulsivePreventionOption] = useState(true);

  // Countdown timer for specifically audited unsafe products (Image 1 & 2)
  const [coolingOffTimer, setCoolingOffTimer] = useState<number>(600); // default remaining seconds (10 minutes)
  const [coolingOffMaxDuration, setCoolingOffMaxDuration] = useState<number>(600); // chosen max seconds
  const [coolingOffProductName, setCoolingOffProductName] = useState<string>('Serum Pencerah Viral X');
  const [coolingOffTimerActive, setCoolingOffTimerActive] = useState<boolean>(true);

  useEffect(() => {
    let interval: any = null;
    if (coolingOffTimerActive && coolingOffTimer > 0) {
      interval = setInterval(() => {
        setCoolingOffTimer((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [coolingOffTimerActive, coolingOffTimer]);

  // Scanned profile updates
  const [showProfileToast, setShowProfileToast] = useState(false);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<SkincareProduct | null>(null);

  // Interactive Notifications states
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { 
      id: 'n1', 
      title: 'Expired Product', 
      text: 'AVOSKIN Miraculous Refining Toner expired in May 2025. Avoid using to prevent skin inflammation!', 
      productId: '2', 
      date: '9 May 2026', 
      read: false 
    },
    { 
      id: 'n2', 
      title: 'Achievement Unlocked', 
      text: 'Review Master: You achieved 40 points for your feedback!', 
      date: '10 May 2026', 
      read: false 
    },
    { 
      id: 'n3', 
      title: 'Expired Product', 
      text: 'SKIN ANGEL Centella Ampoule is running low on volume (remaining: 25%).', 
      productId: '1', 
      date: '21 May 2026', 
      read: false 
    }
  ]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [selectedNotificationProduct, setSelectedNotificationProduct] = useState<SkincareProduct | null>(null);

  // Camera settings & simulation
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressPercent, setScanProgressPercent] = useState(0);
  const [scanStepText, setScanStepText] = useState('Face alignment frame ready.');
  const [hasScanned, setHasScanned] = useState(false);
  
  // Real or Simulated Scan Results
  const [scanResultReport, setScanResultReport] = useState({
    redness: 'SEVERE (Intense capillary dilation over cheeks)',
    moisture: 'CRITICAL LOW (Dehydrated stratum, 22% hydration level)',
    acne: 'MILD COMEDONES (Active clusters on forehead zone)',
    cloggedPores: 'MODERATE (Excessive sebum around the T-zone)',
    advice: 'GlowAdvisor Recommendation: Heavy lipid erosion detected. Pause active acids like AHA/BHA immediately. Lock your routine into an active 14-days Cooling Off barrier healing sequence to avoid stinging.'
  });

  // AI assistant chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'c1',
      sender: 'assistant',
      text: "Hi there! I am GlowAdvisor 🧴✨. Ask me any skincare questions, or start a Face Scan above. If your skin is currently burning, red, or stinging, click the icon in the navigation bar to configure a barrier recovery 'Cooling Off' phase!",
      timestamp: '09:46 AM'
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Edit/Add modal configuration
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SkincareProduct | null>(null);

  // Persistent storage routines
  useEffect(() => {
    localStorage.setItem('skincare_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('cooling_off_active', String(coolingOffActive));
    if (coolingOffActive) {
      setBarrierIntegrity(45 + (coolingOffDay * 3.5)); // daily replication
    } else {
      setBarrierIntegrity(85);
    }
  }, [coolingOffActive, coolingOffDay]);

  // Webcam activation logic
  useEffect(() => {
    if (currentScreen === 'facescan' && isWebcamActive) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacingMode } })
        .then((stream) => {
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn("Webcam stream is unavailable in this container or frame. Falling back to silhouette scanner simulator.", err);
          setIsWebcamActive(false);
        });
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [currentScreen, isWebcamActive, cameraFacingMode]);

  const stopCamera = () => {
    if (webcamVideoRef.current && webcamVideoRef.current.srcObject) {
      const stream = webcamVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      webcamVideoRef.current.srcObject = null;
    }
  };

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { username?: string; password?: string } = {};
    if (!loginUsername.trim()) {
      errors.username = 'Username is required / Wajib diisi!';
    }
    if (!loginPassword.trim()) {
      errors.password = 'Password is required / Wajib diisi!';
    }

    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }

    // Success login
    setUserProfile(prev => ({
      ...prev,
      name: loginUsername.trim(),
    }));
    setIsLoggedIn(true);
    setLoginErrors({});
    setCurrentScreen('shelf');
  };

  // Flip camera trigger
  const handleFlipCamera = () => {
    setCameraFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setScanStepText(`Flipping screen capture lens direction to ${cameraFacingMode === 'user' ? 'rear back' : 'user front'} lens...`);
  };

  // Active Scan Routine containing real steps, progress counter, and feedback
  const handleTriggerFaceScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgressPercent(0);
    setScanStepText('Analyzing ambient exposure... [Good Light Checked ☀️]');

    const steps = [
      { text: 'Checking cosmetic presence... [No Makeup Checked 🫧]', progress: 20, delay: 1000 },
      { text: 'Checking accessory layers... [No Glasses Checked 👓]', progress: 40, delay: 2000 },
      { text: 'Scanning stratum corneum moisture value... [Dehydration detected 💧]', progress: 60, delay: 3200 },
      { text: 'Mapping redness erythema around cheeks and jaw...', progress: 80, delay: 4500 },
      { text: 'Generating dermatological consensus report...', progress: 100, delay: 5800 }
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setScanStepText(step.text);
        setScanProgressPercent(step.progress);
      }, step.delay);
    });

    setTimeout(() => {
      setIsScanning(false);
      setHasScanned(true);
      setCurrentScreen('facescan-result'); // Move immediately to results as requested!
    }, 6500);
  };

  // Saving diagnostic outcomes as requested by the user Profile update
  const handleSaveSkinProfile = () => {
    setUserProfile(prev => ({
      ...prev,
      skinType: 'Oily & Sensitive (AI Scanned)',
      mainConcern: 'Erythema over cheeks & Dehydration',
    }));
    setShowProfileToast(true);
    setTimeout(() => {
      setShowProfileToast(false);
      setCurrentScreen('profile');
    }, 2000);
  };

  // Inventory modifications & operations
  const handleAddProductClickFromWorkflow = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProductClickFromWorkflow = (product: SkincareProduct) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProductToInventory = (updatedProduct: SkincareProduct) => {
    // Skenario 2: Impulsive prevention warning triggers
    if (coolingOffActive && impulsivePreventionOption && updatedProduct.category === 'Exfoliant') {
      alert("⚠️ COOLING OFF WARN: Actives locked. You have an active barrier healing sabbatical. Adding this to backlog database, but do not use until day 14 is complete!");
    }

    const exists = products.some(p => p.id === updatedProduct.id);
    if (exists) {
      setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    } else {
      setProducts([...products, updatedProduct]);
      // Push system notification for add
      const newNotif: AppNotification = {
        id: crypto.randomUUID(),
        title: 'New Product Backlog',
        text: `Successfully added ${updatedProduct.brand} ${updatedProduct.name} to skincare cabinet range!`,
        productId: updatedProduct.id,
        date: 'Today',
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const handleDeleteProductFromInventory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to dismiss this skin helper from your collection?")) {
      setProducts(products.filter(p => p.id !== id));
      setNotifications(prev => prev.filter(n => n.productId !== id));
    }
  };

  const handleVolumePercentChange = (id: string, value: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setProducts(products.map(p => {
      if (p.id === id) {
        const nextVal = Math.max(0, Math.min(100, p.remainingPercent + value));
        return { ...p, remainingPercent: nextVal };
      }
      return p;
    }));
  };

  const handleProductFavoriteToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProducts(products.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
  };

  // Dynamic review operations
  const handleAddReviewSubmit = () => {
    if (!newReviewText.trim()) return;
    const item: ProductReview = {
      id: crypto.randomUUID(),
      author: userProfile.name,
      rating: 5,
      content: newReviewText,
      date: 'Today',
      durationOfUse: newReviewDuration,
      replies: []
    };
    setProductReviews([item, ...productReviews]);
    setNewReviewText('');
    
    // Auto respond from GlowAdvisor AI with active communication
    setTimeout(() => {
      const responseText = `GlowAdvisor AI automated assessment: Thanks for sharing your feedback after ${newReviewDuration}! An outstanding choice; keep tracking hydration level for deep repair.`;
      const updated = productReviews.map(r => {
        if (r.id === item.id) {
          return {
            ...r,
            replies: [...r.replies, { author: 'GlowAdvisor AI', content: responseText, date: 'Today' }]
          };
        }
        return r;
      });
      // If we directly update previous, update both. Better to map over current.
      setProductReviews(prev => prev.map(p => p.id === item.id ? { ...p, replies: [{ author: 'GlowAdvisor AI', content: responseText, date: 'Today' }] } : p));
    }, 1500);
  };

  const handleAddReviewReply = (reviewId: string) => {
    const text = replyInputs[reviewId];
    if (!text || !text.trim()) return;

    setProductReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          replies: [...r.replies, { author: userProfile.name, content: text, date: 'Today' }]
        };
      }
      return r;
    }));

    setReplyInputs(prev => ({ ...prev, [reviewId]: '' }));
  };

  // Live Chat API Agent
  const handleSendChatConsultation = async (customText?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!customText) setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/skincare-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          products: products,
          history: chatMessages.slice(-6).map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Server error');

      const companionResponse: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, companionResponse]);
    } catch (err: any) {
      console.warn("API direct response failed. Generating custom advisor analysis offline mode.", err);
      setTimeout(() => {
        const fallbackResponse: ChatMessage = {
          id: crypto.randomUUID(),
          sender: 'assistant',
          text: `🧴 **GLOWADVISOR DERMATOLOGY DESK FEEDBACK**\n\nFor optimized dry skin restoration, avoid AHA/BHA chemical exfoliation. Rely heavily on **Hyaluronic Acid** and **Centella Asiatica**. Ensure you apply physical UV block SPF 50+ inside your daily routine!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, fallbackResponse]);
      }, 1000);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Skenario 3 notification triggers
  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (notif.productId) {
      const target = products.find(p => p.id === notif.productId);
      if (target) {
        setSelectedNotificationProduct(target);
      }
    }
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  // Sorting and Filtering logic
  const checkIsExpired = (expiryDate: string) => {
    const [year, month] = expiryDate.split('-').map(Number);
    const limitDate = new Date(2026, 4); // May 2026 threshold
    const prodDate = new Date(year, month - 1);
    return prodDate < limitDate;
  };

  // Ingredients safe listings matching search/contents lists
  const defaultIngredientsCheckList = [
    { name: 'Niacinamide (5%)', text: 'Brightening & Skin barrier repair', safe: true, info: 'Highly compatible. Safe with Vitamin C.' },
    { name: 'Hyaluronic Acid', text: 'Stratum Corneum Hydration Plumping', safe: true, info: 'Retains 1000x its weight in water.' },
    { name: 'Centella Asiatica (90%)', text: 'Wound resolution & redness barrier', safe: true, info: 'Natural anti-inflammatory agent.' },
    { name: 'Glycolic Acid (AHA 8%)', text: 'Chemical chemical epidermal friction', safe: false, alert: true, info: 'Warning: Dangerous during active burning/redness sessions! Lock during cooling off.' },
    { name: 'Salicylic Acid (BHA 2%)', text: 'Sebum dissolve & pore blackhead treatment', safe: false, alert: true, info: 'Warning: Can trigger severe dehydration spikes on damaged lips.' }
  ];

  // Distances to Tembalang boutiques for sorting locations
  const boutiqueDistances: { [brand: string]: { name: string; distance: number; details: string } } = {
    'SKIN ANGEL': { name: 'Skinsanity Boutique - Tembalang Uptown', distance: 0.4, details: '0.4 km away • Open until 8 PM' },
    'AVOSKIN': { name: 'Skinsanity Boutique - Setiabudi Center', distance: 1.2, details: '1.2 km away • Open until 9 PM' },
    'LA ROCHE POSAY': { name: 'Skinsanity Boutique - Downtown Plaza', distance: 3.5, details: '3.5 km away • Open until 10 PM' },
    'HADALABO': { name: 'Skinsanity Boutique - Tembalang Southern Outlet', distance: 0.8, details: '0.8 km away • Open until 8:30 PM' },
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategoryFilter === 'All') return matchesSearch;
    return matchesSearch && product.category === selectedCategoryFilter;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === 'alphabetical') {
      return a.name.localeCompare(b.name);
    } else if (sortOption === 'location') {
      const distA = boutiqueDistances[a.brand]?.distance || 5.0;
      const distB = boutiqueDistances[b.brand]?.distance || 5.0;
      return distA - distB;
    } else {
      const expA = a.expiryDate;
      const expB = b.expiryDate;
      return expA.localeCompare(expB);
    }
  });

  // Flutter source code mockup string
  const flutterSourceCode = `// ----------------------------------------------------
// DART & FLUTTER CONVERTED SOURCE CODE - SKINSANITY
// Includes Skin Barrier Cooling Off Recovery Architecture
// ----------------------------------------------------

import 'package:flutter/material.dart';
import 'dart:async';

void main() {
  runApp(const GlowAdvisorApp());
}

class GlowAdvisorApp extends StatelessWidget {
  const GlowAdvisorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'skinsanity',
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFFF1F1F1),
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF908AD4)),
        useMaterial3: true,
      ),
      home: const MainTabNavigator(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class MainTabNavigator extends StatefulWidget {
  const MainTabNavigator({super.key});

  @override
  State<MainTabNavigator> createState() => _MainTabNavigatorState();
}

class _MainTabNavigatorState extends State<MainTabNavigator> {
  int _currentIndex = 0;
  bool coolingOffActive = true;
  double barrierHealthPercent = 0.45;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('skinsanity', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.8)),
        backgroundColor: const Color(0xFF908AD4),
      ),
      body: const Center(
        child: Text('Integrated Skincare System Active!'),
      ),
    );
  }
}`;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 md:p-6 text-slate-800 antialiased font-sans">
      
      {/* Root frame mimicking high-fidelity mobile workspace */}
      <div className="w-full max-w-[420px] rounded-0 md:rounded-[36px] bg-[#F1F1F1] min-h-[100vh] md:min-h-[850px] md:max-h-[860px] shadow-2xl relative flex flex-col overflow-hidden border-0 md:border-8 border-slate-950">
        
        {/* Dynamic status phone header */}
        <div className="bg-[#908AD4] pt-2 px-6 flex justify-between items-center text-white/80 text-xs font-medium shrink-0 select-none z-30">
          <span>09:46 AM</span>
          <div className="flex items-center space-x-1.5 bg-black/10 px-2.5 py-0.5 rounded-full text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            <span className="font-semibold text-white tracking-wide lowercase">skinsanity</span>
          </div>
          <div className="flex space-x-2.5 items-center">
            {/* Quick bell for Skenario 3 notification desk */}
            <button 
              onClick={() => setShowNotificationCenter(!showNotificationCenter)}
              className="relative p-1 hover:bg-white/10 rounded-full transition text-white"
              title="Skincare Notification Bell"
              id="bell-notification-trigger"
            >
              <Bell className="w-4 h-4 fill-current text-white" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
              )}
            </button>
            <span>🔋 98%</span>
          </div>
        </div>

        {/* Dynamic Screen Area */}
        <div className="flex-1 overflow-y-auto flex flex-col relative pb-4">

          {/* Skenario 1 Login screen (WELCOME TO SKINSANITY) */}
          {!isLoggedIn ? (
            <div className="flex flex-col flex-1 bg-[#908AD4] text-white p-6 justify-center items-center select-none animate-fade-in z-20">
              <div className="w-24 h-24 mb-6 relative">
                <img 
                  src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/38b81930-2bed-4a4b-9425-203006111595"
                  alt="Stock level logo"
                  className="w-full h-full object-contain animate-bounce"
                  referrerPolicy="no-referrer"
                />
              </div>

              <h2 className="text-2xl font-black tracking-widest text-center mt-2 leading-tight uppercase">
                WELCOME TO<br />SKINSANITY!
              </h2>
              <p className="text-white/70 text-xs mt-1 font-mono uppercase tracking-wide">clinical barrier intelligence</p>

              <form onSubmit={handleLoginSubmit} className="w-full space-y-4 mt-8">
                {/* Username */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 px-1 text-white/90">
                    Username / Nama Pengguna <span className="text-rose-300 font-bold">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="Wajib diisi / e.g. Hailey"
                    value={loginUsername}
                    onChange={(e) => {
                      setLoginUsername(e.target.value);
                      if (e.target.value) setLoginErrors(prev => ({ ...prev, username: undefined }));
                    }}
                    className={`w-full bg-white/10 border text-white placeholder-white/50 px-4 py-3 rounded-xl focus:outline-none focus:bg-white/20 transition text-sm ${
                      loginErrors.username ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-white/30'
                    }`}
                  />
                  {loginErrors.username && (
                    <span className="text-[11px] text-rose-300 font-bold mt-1 block px-1">
                      ⚠️ {loginErrors.username}
                    </span>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 px-1 text-white/90">
                    Password / Kata Sandi <span className="text-rose-300 font-bold">*</span>
                  </label>
                  <input 
                    type="password"
                    placeholder="Wajib diisi"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (e.target.value) setLoginErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    className={`w-full bg-white/10 border text-white placeholder-white/50 px-4 py-3 rounded-xl focus:outline-none focus:bg-white/20 transition text-sm ${
                      loginErrors.password ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-white/30'
                    }`}
                  />
                  {loginErrors.password && (
                    <span className="text-[11px] text-rose-300 font-bold mt-1 block px-1">
                      ⚠️ {loginErrors.password}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs text-white/80 px-1 pt-1">
                  <span className="hover:underline cursor-pointer">Forgot Password?</span>
                  <span className="hover:underline cursor-pointer font-bold">Sign Up</span>
                </div>

                <button 
                  type="submit"
                  className="w-full mt-6 py-3.5 bg-white text-[#908AD4] font-bold rounded-xl shadow-lg hover:bg-slate-50 active:scale-95 transition tracking-widest text-sm uppercase"
                >
                  Login ➔
                </button>
              </form>

              <div className="mt-12 text-center select-none text-[11px] text-white/55">
                skinsanity mobile workspace platform • v1.4
              </div>
            </div>
          ) : (
            <>
              {/* SCREEN 1: THE SKINCARE STOCK SHELF (FIGMA SCREEN 4: HOMEPAGE) */}
              {currentScreen === 'shelf' && (
                <div className="flex flex-col flex-1 bg-[#F1F1F1] animate-fade-in overflow-y-auto pb-6">
                  
                  {/* APP TOP BAR MATCHING FIGMA SPECIFICATIONS */}
                  <div className="bg-[#908AD4] px-5 py-4 flex items-center justify-between select-none shrink-0 z-30">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <span className="text-white text-base font-extrabold tracking-widest uppercase">
                          SKINSANITY
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                      className="text-white p-1 hover:bg-white/10 rounded transition focus:outline-none flex items-center justify-center relative"
                      title="Toggle system alerts drawer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      {notifications.length > 0 && (
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-400 rounded-full animate-ping"></span>
                      )}
                    </button>
                  </div>

                  {/* Greeting area */}
                  <div className="px-6 pt-6 pb-2">
                    <h1 className="text-2xl font-black text-[#5C55AB] tracking-tight">
                      Hello, Sanities
                    </h1>
                    <p className="text-xs text-[#7F79B1] font-medium mt-1">
                      Your skin is looking hydrated today. Keep it up!
                    </p>
                  </div>

                  {/* Main Grid: Skin Care Management Card */}
                  <div 
                    onClick={() => setCurrentScreen('shelf-list')}
                    className="mx-5 my-3.5 bg-white p-5 rounded-[28px] border border-[#DDDDF2] flex items-center justify-between cursor-pointer transition transform hover:-translate-y-0.5 active:scale-[0.99] shadow-[0px_4px_16px_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex-1 pr-4">
                      <h3 className="text-base font-extrabold text-[#5C55AB]">Skin Care Management</h3>
                      <p className="text-xs text-[#7F79B1] mt-1 font-medium">Input and Check Your Skincare</p>
                    </div>
                    <div className="w-[48px] h-[48px] rounded-2xl bg-[#F0EEFF] flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-[#908AD4]" />
                    </div>
                  </div>

                  {/* Row layout: Cooling-off & Ingredients Check */}
                  <div className="grid grid-cols-2 gap-4 mx-5 my-2">
                    <div 
                      onClick={() => setCurrentScreen('cooling-off')}
                      className="bg-white p-5 rounded-[28px] border border-[#DDDDF2] flex flex-col justify-between cursor-pointer transition transform hover:-translate-y-0.5 active:scale-[0.99] shadow-[0px_4px_16px_rgba(0,0,0,0.04)] h-36"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#F0EEFF] flex items-center justify-center text-[#908AD4] mb-3">
                        <Flame className="w-5 h-5 text-[#908AD4]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-[#5C55AB] leading-tight">Cooling-off Period</h4>
                        <p className="text-[10px] text-[#7F79B1] mt-1 font-medium leading-tight">Enable to Reduce Impulsivity</p>
                      </div>
                    </div>

                    <div 
                      onClick={() => setCurrentScreen('search')}
                      className="bg-white p-5 rounded-[28px] border border-[#DDDDF2] flex flex-col justify-between cursor-pointer transition transform hover:-translate-y-0.5 active:scale-[0.99] shadow-[0px_4px_16px_rgba(0,0,0,0.04)] h-36"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#F0EEFF] flex items-center justify-center text-[#908AD4] mb-3">
                        <Droplets className="w-5 h-5 text-[#908AD4]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-[#5C55AB] leading-tight">Ingredients Check</h4>
                        <p className="text-[10px] text-[#7F79B1] mt-1 font-medium leading-tight">Validate the Products</p>
                      </div>
                    </div>
                  </div>

                  {/* Review Aggregator Card */}
                  <div 
                    onClick={() => setCurrentScreen('review-aggregator')}
                    className="mx-5 my-3.5 bg-white p-5 rounded-[28px] border border-[#DDDDF2] flex items-center justify-between cursor-pointer transition transform hover:-translate-y-0.5 active:scale-[0.99] shadow-[0px_4px_16px_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex-1 pr-4 flex items-center">
                      <div className="w-11 h-11 rounded-2xl bg-[#F0EEFF] flex items-center justify-center text-[#908AD4] shrink-0 mr-4">
                        <MessageSquare className="w-5 h-5 text-[#908AD4]" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-[#5C55AB]">Review Aggregator</h3>
                        <p className="text-xs text-[#7F79B1] mt-1 font-medium">AI Summary & Skin Insights</p>
                      </div>
                    </div>
                    <div className="text-[#908AD4] font-bold text-sm shrink-0">
                      ➔
                    </div>
                  </div>

                  {/* Editor's Pick banner */}
                  <div className="mx-5 my-3.5 rounded-[28px] overflow-hidden relative min-h-[150px] flex flex-col justify-end p-5 text-white bg-gradient-to-br from-[#908AD4] via-[#7B74C9] to-[#5C55AB] shadow-md select-none group border border-white/10">
                    <div className="absolute top-0 right-0 p-4 opacity-15 transform group-hover:scale-105 transition duration-500">
                      <Sparkles className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative z-10 space-y-1">
                      <span className="bg-white/20 backdrop-blur-md text-white font-extrabold text-[8px] px-2.5 py-1 rounded-full uppercase tracking-widest inline-block mb-1.5 border border-white/10">
                        Editor&apos;s Pick
                      </span>
                      <h3 className="text-base font-black leading-snug">Understanding Niacinamide: The Skin&apos;s Quiet Hero</h3>
                      <p className="text-[11px] text-white/80 font-medium leading-relaxed">Read our latest guide to skin sanity.</p>
                    </div>
                  </div>

                  {/* Outer QUICK SCAN STATUS banner */}
                  <div className="mx-5 my-2 p-4 bg-white border border-[#DDDDF2] rounded-2xl flex items-center justify-between text-xs shadow-3xs select-none">
                    <div className="flex items-center space-x-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="font-bold text-[#181934] uppercase tracking-wider text-[10px]">QUICK SCAN STATUS:</span>
                      <span className="text-[#5D579A] font-medium font-mono lowercase">{userProfile.skinType}</span>
                    </div>
                    <button 
                      onClick={() => setCurrentScreen('facescan')}
                      className="text-[#908AD4] font-extrabold hover:underline text-[11px]"
                    >
                      Scan Again ➔
                    </button>
                  </div>

                </div>
              )}

              {/* SCREEN 1B: CABINET LIST (CHECK SKINCARE) */}
              {currentScreen === 'shelf-list' && (
                <div className="flex flex-col flex-1 bg-[#F1F1F1] animate-fade-in overflow-hidden">
                  
                  {/* Top bar header */}
                  <div className="bg-[#908AD4] px-5 py-4 flex items-center justify-between text-white select-none shrink-0 z-30">
                    <div className="flex items-center">
                      <button 
                        onClick={() => setCurrentScreen('shelf')}
                        className="text-white hover:bg-white/10 p-1 rounded-full transition active:scale-90 font-black text-lg mr-2 font-mono flex items-center justify-center w-8 h-8"
                      >
                        &lt;
                      </button>
                      <span className="text-base font-extrabold tracking-wide uppercase">Skincare Cabinet</span>
                    </div>
                    
                    {/* Trigger manual Add form */}
                    <button 
                      onClick={() => {
                        // Clear manual input variables and open Screen 5
                        setInputBrand('');
                        setInputCategory('');
                        setInputProductName('');
                        setInputExpiredDate('');
                        setCurrentScreen('input-skincare');
                      }}
                      className="flex items-center space-x-1.5 text-xs font-bold bg-white text-[#908AD4] px-3.5 py-1.5 rounded-full shadow-xs hover:scale-105 active:scale-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Input New</span>
                    </button>
                  </div>

                  {/* Active Recovery Warning messages under list */}
                  {coolingOffActive && (
                    <div className="mx-4 mt-3 bg-blue-50 border border-blue-200 p-3.5 rounded-2xl flex items-start space-x-2.5 shadow-xs animate-pulse select-none">
                      <div className="p-1 px-1.5 bg-blue-600 rounded-lg text-white font-bold text-[9px] select-none tracking-wider font-mono">
                        ❄️ ACTIVE
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-blue-900">Barrier Cooling Off Period on Day {coolingOffDay}</p>
                        <p className="text-[10px] text-blue-700 leading-tight">AHAs, BHAs, and exfoliating products are soft-locked on your routine shelf. Focusing purely on hydration.</p>
                      </div>
                      <button onClick={() => setCoolingOffActive(false)} className="text-blue-900/40 hover:text-blue-900 text-xs">
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Stats count strip */}
                  <div className="px-4 py-2.5 mx-4 mt-3 flex items-center justify-between bg-white border border-[#DDDDF2] rounded-xl text-xs text-slate-600 select-none shadow-3xs">
                    <span className="font-bold text-slate-700">{products.length} Products Documented</span>
                    <span className="text-[9px] font-black text-[#5C55AB] uppercase tracking-wider bg-[#F0EEFF] px-2 py-0.5 rounded-md">
                      ACTIVE RAK
                    </span>
                  </div>

                  {/* Scrollable list content */}
                  <div className="flex-1 px-4 mt-3 space-y-3.5 overflow-y-auto pb-6">
                    {products.map((product) => {
                      const isExfoliant = product.category.toLowerCase().includes('exfoli') || product.category.toLowerCase().includes('acid') || product.category.toLowerCase().includes('peel');
                      const locked = coolingOffActive && isExfoliant;
                      const expired = checkIsExpired(product.expiryDate);

                      return (
                        <div 
                          key={product.id}
                          className={`p-3 relative rounded-2xl bg-white flex transition overflow-hidden shadow-3xs hover:-translate-y-0.5 border ${
                            locked 
                              ? 'border-blue-200 ring-2 ring-blue-500/10' 
                              : expired 
                              ? 'border-rose-200 ring-2 ring-rose-500/10' 
                              : 'border-slate-100'
                          }`}
                        >
                          {/* Inside locked warning filter */}
                          {locked && (
                            <div className="absolute inset-0 bg-blue-950/10 backdrop-blur-3xs flex items-center justify-center z-10 select-none">
                              <span className="bg-blue-600 text-white font-bold text-[9px] px-2.5 py-1 rounded-full shadow-md tracking-wider flex items-center space-x-1 uppercase">
                                <ShieldAlert className="w-3 h-3 animate-bounce" />
                                <span>COOLING LOCKED</span>
                              </span>
                            </div>
                          )}

                          {/* Image container */}
                          <div className="w-16 h-16 bg-[#F6F5FD] rounded-xl flex items-center justify-center shrink-0 border border-slate-100 relative">
                            <img 
                              src={product.imageUrl || 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/KRB2eAlLOy/91akkbvi_expires_30_days.png'} 
                              alt={product.name}
                              className="w-12 h-12 object-contain"
                              referrerPolicy="no-referrer"
                            />
                            {product.isFavorite && (
                              <span className="absolute top-1 left-1 bg-rose-500 text-white p-0.5 rounded-full">
                                <Heart className="w-2.5 h-2.5 fill-current" />
                              </span>
                            )}
                          </div>

                          {/* Product copy specifications */}
                          <div className="flex-1 pl-3 flex flex-col justify-between">
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-extrabold text-[#908AD4] tracking-wider uppercase">
                                  {product.brand}
                                </span>
                                {expired && (
                                  <span className="text-[8px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-black uppercase animate-pulse">
                                    EXPIRED
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs font-black text-slate-800 leading-tight line-clamp-1">
                                {product.name}
                              </h4>
                              <div className="flex items-center space-x-2 text-[9px] text-slate-400 font-medium">
                                <span>{product.category}</span>
                                <span>•</span>
                                <span className="font-mono">{product.expiryDate}</span>
                              </div>
                            </div>

                            {/* Volumetrics slide controllers */}
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase">
                                <span>re-stock volume remaining</span>
                                <span className="font-mono text-[#908AD4] font-extrabold">{product.remainingPercent}%</span>
                              </div>
                              <div className="w-full bg-[#FCF8FF] h-1.5 rounded-full overflow-hidden border border-slate-100">
                                <div 
                                  className="h-full bg-[#908AD4]"
                                  style={{ width: `${product.remainingPercent}%` }}
                                ></div>
                              </div>

                              {/* Trigger adjustments directly */}
                              <div className="flex justify-between items-center pt-1.5 select-none">
                                <div className="flex space-x-1">
                                  <button
                                    onClick={(e) => handleVolumePercentChange(product.id, -10, e)}
                                    className="text-[9px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg transition"
                                  >
                                    Use -10%
                                  </button>
                                  <button
                                    onClick={(e) => handleVolumePercentChange(product.id, 10, e)}
                                    className="text-[9px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg transition"
                                  >
                                    +10%
                                  </button>
                                </div>
                                <button
                                  onClick={(e) => handleDeleteProductFromInventory(product.id, e)}
                                  className="text-slate-300 hover:text-rose-500 p-1 rounded-full hover:bg-rose-50 transition"
                                  title="Remove product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}

                    {products.length === 0 && (
                      <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 p-6 flex flex-col items-center">
                        <Droplets className="w-10 h-10 text-slate-300 mb-2 animate-bounce" />
                        <p className="text-xs font-bold">No skincare products available in Cabinet.</p>
                        <p className="text-[10px] text-slate-400 mt-1">Tap &quot;Input New&quot; to define brand, name and expiry dates.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SCREEN 1C: MANUAL INPUT SKINCARE DATA (FIGMA Mockup SCREEN 5) */}
              {currentScreen === 'input-skincare' && (
                <div className="flex flex-col flex-1 bg-[#F1F1F1] animate-fade-in overflow-hidden">
                  
                  {/* Lavender custom header top-bar exactly as requested */}
                  <div className="bg-[#908AD4] px-5 py-[27px] flex items-center text-white select-none shrink-0 z-30">
                    <button 
                      onClick={() => setCurrentScreen('shelf-list')}
                      className="text-white hover:bg-white/10 p-1 rounded-full transition active:scale-90 font-black text-xl mr-3 font-mono flex items-center justify-center w-8 h-8"
                    >
                      &lt;
                    </button>
                    <span className="text-sm font-extrabold uppercase tracking-wide">Input Skincare Data</span>
                  </div>

                  {/* Centered card structure fully scrollable */}
                  <div className="flex-1 px-6 py-6 overflow-y-auto">
                    <div className="bg-white px-5 py-[27px] rounded-xl flex flex-col shadow-[0px_4px_4px_#00000040] border border-[#DDDDF2] space-y-4">
                      
                      {/* Section descriptive labels */}
                      <div>
                        <h2 className="text-lg font-extrabold text-[#5C55AB] leading-tight">Input Your</h2>
                        <h2 className="text-lg font-extrabold text-[#8E89D7] leading-tight">Skin Care Data</h2>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Tell us what you&apos;re using.</p>
                      </div>

                      {/* Manual text inputs fully editable & typing-enabled (User mandate!) */}
                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-[10px] font-bold text-[#5C55AB] mb-1">
                            SkinCare Brand*
                          </label>
                          <input 
                            type="text"
                            placeholder="e.g. Avoskin"
                            value={inputBrand}
                            onChange={(e) => setInputBrand(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-[#F6F5FD] border border-[#DDDDF2] text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5C55AB] focus:bg-white transition"
                            id="sk-brand"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#5C55AB] mb-1">
                            Category*
                          </label>
                          <input 
                            type="text"
                            placeholder="e.g. Moisturizer"
                            value={inputCategory}
                            onChange={(e) => setInputCategory(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-[#F6F5FD] border border-[#DDDDF2] text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5C55AB] focus:bg-white transition"
                            id="sk-category"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#5C55AB] mb-1">
                            Product Name*
                          </label>
                          <input 
                            type="text"
                            placeholder="e.g. Mugward Cleanser"
                            value={inputProductName}
                            onChange={(e) => setInputProductName(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-[#F6F5FD] border border-[#DDDDF2] text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5C55AB] focus:bg-white transition"
                            id="sk-name"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#5C55AB] mb-1">
                            Expired Date*
                          </label>
                          <input 
                            type="text"
                            placeholder="YYYY/MM/DD"
                            value={inputExpiredDate}
                            onChange={(e) => setInputExpiredDate(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-[#F6F5FD] border border-[#DDDDF2] font-mono text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5C55AB] focus:bg-white transition"
                            id="sk-expiry"
                          />
                        </div>
                      </div>

                      {/* AI integration link separator */}
                      <div className="flex items-center justify-center py-2">
                        <div className="flex-1 h-[1px] bg-[#E8E7F5]"></div>
                        <span className="text-[8px] font-extrabold text-slate-400 tracking-widest px-2.5 uppercase">
                          or use AI import
                        </span>
                        <div className="flex-1 h-[1px] bg-[#E8E7F5]"></div>
                      </div>

                      {/* Scan Your Product with pink camera */}
                      <button 
                        onClick={() => setCurrentScreen('facescan')}
                        className="w-full py-2 px-3 bg-[#AD46FF]/5 hover:bg-[#AD46FF]/10 active:scale-[0.98] border border-dashed border-[#AD46FF]/20 rounded-xl transition flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2.5 text-left">
                          <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500 shrink-0 select-none">
                            📷
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#5C55AB]">Scan Your Product</p>
                            <p className="text-[9px] text-slate-400 italic font-medium">Extract ingredients list</p>
                          </div>
                        </div>
                        <span className="text-slate-400 font-bold text-xs">➔</span>
                      </button>

                      {/* Secure message banner with lock */}
                      <div className="flex items-start space-x-2 p-2 rounded-lg bg-slate-50 text-[9px] text-slate-500 leading-normal border border-slate-100 select-none">
                        <span className="text-[#908AD4] text-xs">🛡️</span>
                        <p>
                          Your data is encrypted and used only to track your skincare products and minimize waste.
                        </p>
                      </div>

                      {/* Save product Button */}
                      <button 
                        onClick={() => {
                          if (!inputBrand.trim() || !inputProductName.trim()) {
                            alert("Please fill in the brand name and product name to register skincare stock.");
                            return;
                          }
                          const cleanExpStr = inputExpiredDate.includes('/') 
                            ? inputExpiredDate.replace(/\//g, '-') 
                            : inputExpiredDate || '2026-12';

                          const customProduct: SkincareProduct = {
                            id: crypto.randomUUID(),
                            brand: inputBrand.trim().toUpperCase(),
                            name: inputProductName.trim(),
                            category: (inputCategory.trim() as any) || 'Moisturizer',
                            expiryDate: cleanExpStr.substring(0, 7),
                            remainingPercent: 100,
                            skinConcerns: ['Hydration', 'Barrier Support'],
                            notes: 'Manual register text inputs',
                            assignedRoutine: 'None',
                            imageUrl: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/KRB2eAlLOy/9ve39vrm_expires_30_days.png',
                            isFavorite: false
                          };

                          setProducts(prev => [customProduct, ...prev]);

                          // Push status alerts notification
                          const autoAlert: AppNotification = {
                            id: crypto.randomUUID(),
                            title: 'New Skincare Logged',
                            text: `Successfully logged ${customProduct.brand} ${customProduct.name} to active rak storage list.`,
                            productId: customProduct.id,
                            date: 'Just Now',
                            read: false
                          };
                          setNotifications(prev => [autoAlert, ...prev]);

                          // reset fields
                          setInputBrand('');
                          setInputCategory('');
                          setInputProductName('');
                          setInputExpiredDate('');

                          alert("Skincare item saved successfully in cabinet lists!");
                          setCurrentScreen('shelf-list');
                        }}
                        disabled={!inputBrand.trim() || !inputProductName.trim()}
                        className="w-full py-3 bg-[#AD46FF] hover:bg-[#9934E8] disabled:opacity-40 disabled:hover:bg-[#AD46FF] text-white font-extrabold text-xs text-center rounded-lg uppercase tracking-wider shadow-sm transition transform active:scale-95 cursor-pointer"
                      >
                        SAVE
                      </button>

                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 2: INGREDIENTS SEARCH CHECK & LOCATION SORTING */}
              {currentScreen === 'search' && (
                <div className="flex flex-col flex-1 bg-[#F1F1F1] animate-fade-in overflow-hidden">
                  
                  {/* APP TITLE BAR MATCHING FIGMA SPECIFICATIONS */}
                  <div className="bg-[#908AD4] px-5 py-4 flex items-center justify-between text-white select-none shrink-0 z-30">
                    <div className="flex items-center">
                      <button 
                        onClick={() => setCurrentScreen('shelf')}
                        className="text-white hover:bg-white/10 p-1 rounded-full transition active:scale-90 font-black text-lg mr-2 font-mono flex items-center justify-center w-8 h-8"
                      >
                        &lt;
                      </button>
                      <span className="text-base font-extrabold tracking-wide uppercase">Ingredients Check</span>
                    </div>
                    <span className="text-[10px] bg-white/20 text-white px-2.5 py-1 rounded-full font-black uppercase tracking-widest">
                      INCI LAB
                    </span>
                  </div>

                  {/* Scrollable Content Container */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

                    {/* INTERACTIVE HAZARD LAB EXPLICIT DEMO CALLOUT */}
                    <div 
                      onClick={() => setCurrentScreen('peringatan')}
                      className="bg-rose-50 border-2 border-dashed border-rose-300 p-4 rounded-[24px] flex items-center justify-between cursor-pointer transition transform hover:-translate-y-0.5 active:scale-99 shadow-xs"
                      title="Klik untuk langsung melihat hasil cek ingredient bahaya"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 select-none font-bold text-lg">
                          🚨
                        </div>
                        <div className="pr-2">
                          <h4 className="text-xs font-black text-rose-700 uppercase tracking-wider">Cek Ingredient Bahaya</h4>
                          <h4 className="text-sm font-black text-slate-800 leading-tight">Serum Pencerah Viral X</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-normal">
                            Analisis zat comedogenic <b className="text-rose-600">Isopropyl Myristate</b>
                          </p>
                        </div>
                      </div>
                      <span className="text-rose-600 font-extrabold text-sm ml-2 shrink-0 animate-bounce">
                        Check ➔
                      </span>
                    </div>

                    {/* Full search query inputs */}
                    <div className="bg-white p-4 rounded-3xl border border-[#DDDDF2] shadow-3xs space-y-3">
                      <p className="text-[10px] uppercase font-black tracking-widest text-[#5C55AB]">Check Skin Compatibility</p>
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="Ketik produk (e.g. Serum Pencerah Viral)..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#908AD4] focus:bg-white text-xs text-slate-800"
                        />
                        <Search className="w-4 h-4 text-[#908AD4] absolute left-3 top-3.5" />
                      </div>

                      {/* Filter Categories list scrollable bar */}
                      <div className="flex space-x-1.5 overflow-x-auto py-1 scrollbar-none">
                        {['All', 'Cleanser', 'Toner', 'Ampoule', 'Serum', 'Sunscreen', 'Exfoliant'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategoryFilter(cat)}
                            className={`px-3.5 py-1 text-[10px] font-black rounded-full whitespace-nowrap transition ${
                              selectedCategoryFilter === cat 
                                ? 'bg-[#908AD4] text-white' 
                                : 'bg-[#F0EEFF] text-[#7F79B1] hover:bg-[#E3E0FE]'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Sorting dropdown options based on letters or boutique distance */}
                      <div className="flex justify-between items-center text-[11px] pt-2.5 border-t border-slate-100">
                        <span className="text-slate-400 font-bold flex items-center space-x-1">
                          <SlidersHorizontal className="w-3 h-3 text-[#908AD4]" />
                          <span>Sort Criteria:</span>
                        </span>
                        <select 
                          value={sortOption}
                          onChange={(e: any) => setSortOption(e.target.value)}
                          className="bg-transparent text-[#908AD4] font-bold focus:outline-none cursor-pointer text-xs"
                        >
                          <option value="alphabetical">Alphabetical (A-Z)</option>
                          <option value="location">Boutique Location (Nearest)</option>
                          <option value="expiry">Expiry (Soonest first)</option>
                        </select>
                      </div>
                    </div>

                    {/* Search query listings items */}
                    <div className="space-y-3">
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                        Products Database Listings
                      </p>

                      {/* Injected Serum Pencerah Viral X if searchable */}
                      {(searchQuery === '' || 'serum pencerah viral x'.includes(searchQuery.toLowerCase()) || 'isopropyl'.includes(searchQuery.toLowerCase())) && (
                        <div 
                          onClick={() => setCurrentScreen('peringatan')}
                          className="bg-white p-3.5 rounded-2xl border-2 border-red-100 hover:border-red-200 flex justify-between items-center hover:bg-[#FFF8F8] transition cursor-pointer shadow-3xs"
                        >
                          <div className="space-y-1 pr-2">
                            <span className="text-[8px] font-black tracking-widest text-[#EB3F33] bg-red-100 px-2 py-0.5 rounded uppercase">COMEDOGENIC DETECTED</span>
                            <h4 className="text-xs font-extrabold text-slate-800 leading-tight mt-1">Serum Pencerah Viral X</h4>
                            <p className="text-[9px] text-[#EB3F33] font-medium">*Mengandung Isopropyl Myristate (KLIK UNTUK ANALISIS) ➔</p>
                          </div>
                          <span className="text-[9px] bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-black uppercase shrink-0">
                            Warning
                          </span>
                        </div>
                      )}

                      {sortedProducts.map((p) => {
                        const distObj = boutiqueDistances[p.brand] || { name: 'Skinsanity Setiabudi Mall', distance: 1.8, details: '1.8 km away • Open' };
                        return (
                          <div 
                            key={p.id}
                            onClick={() => {
                              setSelectedDetailProduct(p);
                              setCurrentScreen('product-detail');
                            }}
                            className="bg-white p-3.5 rounded-xl border border-slate-100 flex justify-between items-center hover:bg-[#F6F5FD] hover:border-[#908AD4] cursor-pointer transition shadow-3xs"
                          >
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-black tracking-widest text-[#908AD4] uppercase">{p.brand}</span>
                              <h4 className="text-xs font-bold text-slate-800 leading-tight">{p.name}</h4>
                              <p className="text-[10px] text-slate-400 font-medium">{distObj.name} • <span className="font-mono text-indigo-500 font-bold">{distObj.distance} KM</span></p>
                            </div>
                            <span className="text-[9px] bg-slate-50 text-[#7F79B1] px-2.5 py-1 rounded font-black uppercase tracking-wide">
                              {p.category}
                            </span>
                          </div>
                        );
                      })}

                      {sortedProducts.length === 0 && searchQuery !== '' && (
                        <div className="bg-white rounded-xl p-6 text-center text-slate-400 text-xs border border-dashed border-slate-300">
                          No matching local database stock. Try search string empty.
                        </div>
                      )}
                    </div>

                    {/* Skenario 2: Active chemical ingredients breakdown analysis */}
                    <div className="bg-white p-4 rounded-[24px] border border-[#DDDDF2] space-y-3 shadow-3xs">
                      <h3 className="text-xs font-black text-[#5C55AB] uppercase tracking-wider flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#908AD4]" />
                        <span>INCI Contents Quick Reference</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium">Verified chemical safety metrics in our laboratory database</p>
                      
                      <div className="space-y-2.5">
                        {defaultIngredientsCheckList.map((ic) => (
                          <div key={ic.name} className="flex items-start justify-between p-2.5 bg-[#F6F5FD] rounded-xl border border-slate-100 text-xs gap-3">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-800 text-xs">{ic.name}</p>
                              <p className="text-[10px] text-slate-500 leading-tight block font-medium">{ic.text}</p>
                              {ic.info && <p className="text-[9px] text-[#908AD4] leading-relaxed block italic font-medium">{ic.info}</p>}
                            </div>
                            
                            <span className={`px-2.5 py-0.5 rounded font-black text-[9px] shadow-3xs uppercase tracking-wide shrink-0 ${
                              ic.safe 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                            }`}>
                              {ic.safe ? 'SAFE ☑' : 'ALERT ⚠'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* NEW SCREEN: WARNING SCREEN (FIGMA SCREEN 5 MOCKUP PERINGATAN!) */}
              {currentScreen === 'peringatan' && (
                <div className="flex flex-col flex-1 bg-[#F1F1F1] animate-fade-in overflow-hidden">
                  
                  {/* Title bar exactly matching image with back arrow */}
                  <div className="bg-[#F3554A] px-5 py-4 flex items-center text-white select-none shrink-0 z-30">
                    <button 
                      onClick={() => setCurrentScreen('search')}
                      className="text-white hover:bg-white/10 p-1 rounded-full transition active:scale-90 font-black text-xl mr-3 font-mono flex items-center justify-center w-8 h-8"
                    >
                      &lt;
                    </button>
                    <span className="text-sm font-extrabold uppercase tracking-widest text-[#FFF]">PERINGATAN!</span>
                  </div>

                  {/* Pink body canvas styled as depicted in Image 2 */}
                  <div className="flex-1 bg-[#FCEAE7] px-6 py-6 overflow-y-auto flex flex-col justify-between">
                    
                    {/* Centered card structure */}
                    <div className="bg-white p-6 rounded-[28px] flex flex-col items-center shadow-[0px_4px_16px_rgba(0,0,0,0.05)] border border-[#FAD7D4] space-y-4">
                      
                      {/* Red triangle exclamation icon inside circles */}
                      <div className="w-[52px] h-[52px] rounded-full bg-[#FFF0EF] border border-[#FAD7D4] flex items-center justify-center text-[#EB3F33] text-xl shrink-0 select-none shadow-3xs">
                        ⚠️
                      </div>

                      {/* NOT SUITABLE HEADER */}
                      <div className="text-center">
                        <h2 className="text-lg font-black text-[#EB3F33] tracking-tight uppercase">TIDAK COCOK UNTUKMU</h2>
                        <p className="text-[11px] text-[#7F79B1] font-extrabold mt-1 uppercase tracking-wide">
                          Berdasarkan profil kulitmu (Oily, Acne-Prone)
                        </p>
                      </div>

                      {/* Divider label */}
                      <div className="w-full text-left pt-2">
                        <span className="text-[9px] font-black text-[#7F79B1] tracking-widest uppercase">
                          ANALISIS BAHAN:
                        </span>
                      </div>

                      {/* Red risk parameter block detailing ingredient danger */}
                      <div className="w-full bg-[#FDF1F0] p-4 rounded-2xl border border-[#FAD7D4] flex items-start space-x-2.5 shadow-3xs">
                        <div className="text-rose-600 font-bold text-sm select-none py-0.5">⚠️</div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-[#C9291E] uppercase tracking-wide">Isopropyl Myristate</h4>
                          <p className="text-[10px] text-[#D84B42] font-semibold leading-relaxed">
                            Tingkat <b className="text-[#C9291E]">comedogenic sangat tinggi</b>. Berisiko menyumbat pori dan memicu jerawat.
                          </p>
                        </div>
                      </div>

                      <div className="text-[10px] text-[#7F79B1] text-justify leading-normal px-1">
                        Skinsanity mendeteksi bahwa bahan aktif di atas melanggar status toleransi minyak kulit optimal Anda. Kami sangat merekomendasikan penundaan aksi belanja impulsif Anda demi kesehatan lipid pembatas kulit.
                      </div>

                    </div>

                    {/* Massive Delayed Basket / Cooling-off Period Trigger */}
                    <div className="mt-6 space-y-3">
                      
                      {/* Interactive Configuration Strip */}
                      <div className="p-3 bg-white/95 rounded-2xl border border-[#FAD7D4] flex flex-col space-y-2 text-xs select-none shadow-sm">
                        <span className="text-slate-700 font-extrabold flex items-center space-x-1">
                          <span>⏱️</span>
                          <span>Atur Durasi Jeda Merenung:</span>
                        </span>
                        <div className="grid grid-cols-4 gap-1">
                          <button 
                            type="button"
                            onClick={() => {
                              setCoolingOffTimer(600);
                              setCoolingOffMaxDuration(600);
                              alert("Masa jeda simulasi diatur ke 10 Menit. Anda dapat melihat timer berjalan turun secara real-time!");
                            }}
                            className={`px-1 py-1.5 text-[9px] font-black rounded-lg transition text-center ${coolingOffTimer === 600 ? 'bg-[#908AD4] text-white' : 'bg-[#F0EEFF] text-[#908AD4] border border-[#DDDDF2] hover:bg-[#E3E0FE]'}`}
                          >
                            10 Menit
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              setCoolingOffTimer(1200);
                              setCoolingOffMaxDuration(1200);
                              alert("Masa jeda simulasi diatur ke 20 Menit. Anda dapat melihat timer berjalan turun secara real-time!");
                            }}
                            className={`px-1 py-1.5 text-[9px] font-black rounded-lg transition text-center ${coolingOffTimer === 1200 ? 'bg-[#908AD4] text-white' : 'bg-[#F0EEFF] text-[#908AD4] border border-[#DDDDF2] hover:bg-[#E3E0FE]'}`}
                          >
                            20 Menit
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              setCoolingOffTimer(1800);
                              setCoolingOffMaxDuration(1800);
                              alert("Masa jeda simulasi diatur ke 30 Menit. Anda dapat melihat timer berjalan turun secara real-time!");
                            }}
                            className={`px-1 py-1.5 text-[9px] font-black rounded-lg transition text-center ${coolingOffTimer === 1800 ? 'bg-[#908AD4] text-white' : 'bg-[#F0EEFF] text-[#908AD4] border border-[#DDDDF2] hover:bg-[#E3E0FE]'}`}
                          >
                            30 Menit
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              setCoolingOffTimer(0);
                              setCoolingOffMaxDuration(1);
                              alert("Masa jeda saat ini diposisikan selesai instan untuk uji coba fungsionalitas tombol beli!");
                            }}
                            className={`px-1 py-1.5 text-[9px] font-black rounded-lg transition text-center ${coolingOffTimer === 0 ? 'bg-[#E11D48] text-white' : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'}`}
                          >
                            Selesai (0s)
                          </button>
                        </div>
                      </div>

                      {/* Lavender Call to action EXACT AS FIGMA */}
                      <button 
                        onClick={() => {
                          setCoolingOffProductName("Serum Pencerah Viral X");
                          setCoolingOffActive(true);
                          
                          // If timer has not been configured by user yet, let it default to 10 mins (600s)
                          if (coolingOffTimer === 0 && !window.confirm("Buka keranjang tunda dengan countdown instan 00:00:00? Klik 'Batal' untuk memberi timer 10 Menit.")) {
                            setCoolingOffTimer(600);
                            setCoolingOffMaxDuration(600);
                          }

                          // Notifications alert
                          const newAlert: AppNotification = {
                            id: crypto.randomUUID(),
                            title: '🚨 Delayed Basket Active',
                            text: `Serum Pencerah Viral X dipindahkan ke Keranjang Tunda karena kandungan berbahaya Isopropyl Myristate.`,
                            date: 'Just Now',
                            read: false
                          };
                          setNotifications(prev => [newAlert, ...prev]);

                          alert("Membuka 'Delayed Basket' (Cooling-off Period). Pikirkan kembali sebelum membeli produk comedogenic bahaya!");
                          setCurrentScreen('cooling-off');
                        }}
                        className="w-full py-3.5 bg-[#908AD4] hover:bg-[#7F79B1] active:bg-[#5C55AB] text-white font-extrabold text-xs text-center rounded-2xl uppercase tracking-widest shadow-md transition transform active:scale-95 flex items-center justify-center space-x-2.5 cursor-pointer"
                      >
                        <span>⏱️</span>
                        <span>Masukkan Keranjang Tunda</span>
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* SCREEN 3: COOLING OFF SANCTUARY & DELAYED CART (FIGMA SCREEN: COOLING-OFF BIN) */}
              {currentScreen === 'cooling-off' && (
                <div className="flex flex-col flex-1 bg-[#F1F1F1] animate-fade-in overflow-hidden">
                  
                  {/* APP TITLE BAR IN LAVENDER COLOR */}
                  <div className="bg-[#908AD4] px-5 py-4 flex items-center justify-between text-white select-none shrink-0 z-30">
                    <div className="flex items-center">
                      <button 
                        onClick={() => setCurrentScreen('search')}
                        className="text-white hover:bg-white/10 p-1 rounded-full transition active:scale-90 font-black text-lg mr-2 font-mono flex items-center justify-center w-8 h-8"
                      >
                        &lt;
                      </button>
                      <span className="text-base font-extrabold tracking-wide uppercase">COOLING-OFF BIN</span>
                    </div>
                    <span className="text-[10px] bg-white/20 text-white px-2.5 py-1 rounded-full font-black uppercase tracking-widest">
                      BARRIER SHIELD
                    </span>
                  </div>

                  {/* Main screen content */}
                  <div className="flex-1 bg-[#F9F9FC] px-6 py-6 overflow-y-auto flex flex-col justify-between">
                    
                    {/* Header text greeting in dark indigo */}
                    <div className="text-center select-none pt-2">
                      <h2 className="text-2xl font-black text-[#403B7D] tracking-tight">Tarik Napas Dulu</h2>
                      <p className="text-xs text-[#8E8BAD] font-semibold mt-1">
                        Keinginan impulsifmu aman terkunci di sini.
                      </p>
                    </div>

                    {/* Centered White Locking Card exactly as depicted in FIGMA screen */}
                    <div className="bg-white p-6 rounded-[32px] border border-[#DDDDF2] shadow-[0px_4px_16px_rgba(0,0,0,0.03)] flex flex-col items-center space-y-4 w-full">
                      
                      {/* Product identity */}
                      <div className="text-center">
                        <h3 className="text-lg font-black text-[#403B7D] leading-tight select-text">
                          {coolingOffProductName}
                        </h3>
                        <p className="text-[11px] text-[#8E8BAD] font-bold uppercase tracking-wider mt-0.5 animate-pulse">
                          Terkunci sementara waktu
                        </p>
                      </div>

                      {/* Lightweight Responsive Circular Progress Countdown ring */}
                      <div className="relative w-40 h-40 flex items-center justify-center my-3 select-none">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          {/* Inner gray background circle path */}
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="41" 
                            stroke="#F0EEFF" 
                            strokeWidth="5" 
                            fill="transparent" 
                          />
                          {/* Ticking purple progress outline */}
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="41" 
                            stroke="#908AD4" 
                            strokeWidth="5" 
                            fill="transparent" 
                            strokeDasharray="257.6"
                            strokeDashoffset={257.6 - (257.6 * (coolingOffTimer > 0 ? (coolingOffTimer / (coolingOffMaxDuration || 1)) : 1))}
                            className="transition-all duration-1000 ease-linear"
                          />
                        </svg>
                        
                        {/* Center core clock value & padlock icon */}
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-slate-400 text-xl font-bold select-none mb-1">
                            {coolingOffTimer > 0 ? '🔒' : '🔓'}
                          </span>
                          <span className="text-2xl font-extrabold text-[#403B7D] font-mono tracking-wider">
                            {(() => {
                              const h = Math.floor(coolingOffTimer / 3600).toString().padStart(2, '0');
                              const m = Math.floor((coolingOffTimer % 3600) / 60).toString().padStart(2, '0');
                              const s = Math.floor(coolingOffTimer % 60).toString().padStart(2, '0');
                              return `${h}:${m}:${s}`;
                            })()}
                          </span>
                        </div>
                      </div>

                      {/* Dual states conditional layout */}
                      {coolingOffTimer === 0 ? (
                        <div className="w-full flex flex-col items-center text-center space-y-4 animate-fade-in">
                          
                          {/* Explicit Red status query as depicted in Image 1 */}
                          <p className="text-xs font-bold text-[#F3554A] leading-relaxed px-1">
                            Waktu jeda telah habis. Apakah kamu sudah berpikir rasional dan masih ingin membelinya?
                          </p>

                          {/* YA, BELI SEKARANG BLACK BUTTON */}
                          <button 
                            onClick={() => {
                              // Register the product into Cabinet database
                              const finalCustom: SkincareProduct = {
                                id: crypto.randomUUID(),
                                brand: 'VIRAL LAB',
                                name: coolingOffProductName,
                                category: 'Serum',
                                expiryDate: '2028-12',
                                remainingPercent: 100,
                                skinConcerns: ['Brightening', 'Impulsive Validation'],
                                notes: 'Lolos masa jeda berpikir rasional (dari Cooling-off bin)',
                                assignedRoutine: 'None',
                                imageUrl: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/KRB2eAlLOy/9ve39vrm_expires_30_days.png',
                                isFavorite: true
                              };
                              setProducts(prev => [finalCustom, ...prev]);

                              // Push system notifications alert
                              const finalNotif: AppNotification = {
                                id: crypto.randomUUID(),
                                title: 'Rational Purchase Logged',
                                text: `Anda membeli ${coolingOffProductName} pasca masa jeda rational thinking 15 detik.`,
                                date: 'Just Now',
                                read: false
                              };
                              setNotifications(prev => [finalNotif, ...prev]);

                              alert(`Sukses! ${coolingOffProductName} berhasil dibeli dengan penuh pertimbangan rasional & tersimpan ke Rak Kabinet.`);
                              setCurrentScreen('shelf-list');
                            }}
                            className="w-full py-3.5 bg-black hover:bg-slate-900 active:bg-slate-850 text-white font-extrabold text-xs text-center rounded-3xl uppercase tracking-widest shadow-md transition transform active:scale-95 cursor-pointer"
                          >
                            Ya, Beli Sekarang
                          </button>
                        </div>
                      ) : (
                        <div className="w-full text-center space-y-2 select-none animate-pulse">
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Masa Jeda Merenung Aktif...</p>
                          <p className="text-[10px] text-slate-500 italic leading-relaxed px-2">
                            Pikirkan kembali: Apakah Anda sangat membutuhkan serum comedogenic ini atau hanya tergoda diskon? Tombol beli terkunci sementara.
                          </p>
                          
                          {/* Locked Buy button visualization */}
                          <div className="w-full py-3.5 bg-slate-100 text-slate-400 font-extrabold text-xs rounded-3xl uppercase tracking-widest text-center cursor-not-allowed">
                            Ya, Beli Sekarang (LOCKED)
                          </div>
                        </div>
                      )}

                      {/* HAPUS DARI KERANJANG (BATAL) ALWAYS ACCESSIBLE */}
                      <button 
                        onClick={() => {
                          setCoolingOffTimer(0);
                          alert('Hebat! Keputusan yang sangat bijaksana. Impulsivitas berhasil diredam & produk berbahaya dihapus dari keranjang.');
                          setCurrentScreen('shelf');
                        }}
                        className="text-[#8E8BAD] hover:text-[#F3554A] font-extrabold text-[11px] uppercase tracking-widest cursor-pointer select-none py-1.5 transition underline decoration-dotted"
                      >
                        Hapus dari Keranjang (Batal)
                      </button>

                    </div>

                    {/* Simulation Controller utilities panel */}
                    <div className="mt-4 p-4 bg-white/75 rounded-2xl border border-[#DDDDF2] flex flex-col space-y-2 shadow-3xs select-none">
                      <p className="text-[9px] uppercase font-black text-[#5C55AB] tracking-widest text-center">⚙️ SIMULATOR PERIODE JEDA</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        <button 
                          onClick={() => {
                            setCoolingOffTimer(600);
                            setCoolingOffMaxDuration(600);
                            alert("Masa jeda direset ke 10 Menit.");
                          }}
                          className="bg-purple-50 text-[#908AD4] border border-[#DDDDF2] hover:bg-purple-100 py-1.5 px-1 rounded-xl text-[9px] font-bold uppercase focus:outline-none text-center"
                        >
                          10 Mins
                        </button>
                        <button 
                          onClick={() => {
                            setCoolingOffTimer(1200);
                            setCoolingOffMaxDuration(1200);
                            alert("Masa jeda direset ke 20 Menit.");
                          }}
                          className="bg-purple-50 text-[#908AD4] border border-[#DDDDF2] hover:bg-purple-100 py-1.5 px-1 rounded-xl text-[9px] font-bold uppercase focus:outline-none text-center"
                        >
                          20 Mins
                        </button>
                        <button 
                          onClick={() => {
                            setCoolingOffTimer(1800);
                            setCoolingOffMaxDuration(1800);
                            alert("Masa jeda direset ke 30 Menit.");
                          }}
                          className="bg-purple-50 text-[#908AD4] border border-[#DDDDF2] hover:bg-purple-100 py-1.5 px-1 rounded-xl text-[9px] font-bold uppercase focus:outline-none text-center"
                        >
                          30 Mins
                        </button>
                        <button 
                          onClick={() => {
                            setCoolingOffTimer(0);
                            setCoolingOffMaxDuration(1);
                            alert("Instant: masa jeda selesai!");
                          }}
                          className="bg-purple-600 text-white hover:bg-purple-700 py-1.5 px-1 rounded-xl text-[9px] font-bold uppercase focus:outline-none text-center"
                        >
                          Habis (0)
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* SCREEN 4: PROFILE DESK, EDIT FIELDS & NOTIFICATIONS VIEW */}
              {currentScreen === 'profile' && (
                <div className="flex flex-col flex-1 bg-[#F1F1F1] animate-fade-in p-4 mt-6">
                  
                  {/* APP TITLE BAR */}
                  <div className="flex items-center justify-between mb-3 text-slate-800">
                    <button 
                      onClick={() => setCurrentScreen('shelf')}
                      className="p-1 px-2.5 bg-slate-200/50 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700"
                    >
                      ➔ Back
                    </button>
                    <span className="font-mono text-xs text-slate-400 font-bold uppercase tracking-wider">TSKINSANITY BIODATA</span>
                  </div>

                  {/* Member Card representing user details matching screen Edit Profile */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#908AD4]/20 border-2 border-[#908AD4] flex items-center justify-center text-[#908AD4] font-black uppercase text-xl relative shrink-0">
                        {userProfile.name.substring(0, 2)}
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white"></span>
                      </div>
                      
                      <div className="flex-1 space-y-0.5">
                        <p className="text-base font-black text-[#1D1B20] flex items-center gap-1.5">
                          <span>{userProfile.name}</span>
                          <span className="text-[10px] bg-slate-100 text-[#908AD4] px-1.5 py-0.5 rounded font-black font-mono">PRO</span>
                        </p>
                        <p className="text-[10px] text-slate-500">MEMBER SINCE {userProfile.memberSince}</p>
                        <p className="text-[10px] text-[#5D579A] font-medium leading-tight">Climate: Humid Tropics</p>
                      </div>
                    </div>

                    {/* Skenario 3 Achievements parameters */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 bg-[#908AD4]/5 p-2 rounded-xl">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">skincare authority</p>
                        <p className="text-xs font-extrabold text-[#5D579A]">Review Master</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">achievements points</p>
                        <p className="text-xs font-extrabold text-[#5D579A]">40 Points Unlocked</p>
                      </div>
                    </div>
                  </div>

                  {/* Editable text inputs for Hailey profile as requested */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 mt-4 space-y-3.5 shadow-xs">
                    <p className="text-[10px] uppercase font-black tracking-widest text-[#47464F]">Personal Biography Fields</p>
                    
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email address</label>
                        <input 
                          type="email"
                          value={userProfile.email}
                          onChange={(e) => {
                            const val = e.target.value;
                            setUserProfile(prev => ({ ...prev, email: val }));
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone contacts</label>
                        <input 
                          type="text"
                          value={userProfile.phone}
                          onChange={(e) => {
                            const val = e.target.value;
                            setUserProfile(prev => ({ ...prev, phone: val }));
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Domicile Location</label>
                        <input 
                          type="text"
                          value={userProfile.location}
                          onChange={(e) => {
                            const val = e.target.value;
                            setUserProfile(prev => ({ ...prev, location: val }));
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Skin Type Status</label>
                          <input 
                            type="text"
                            value={userProfile.skinType}
                            onChange={(e) => {
                              const val = e.target.value;
                              setUserProfile(prev => ({ ...prev, skinType: val }));
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Concerns Target</label>
                          <input 
                            type="text"
                            value={userProfile.mainConcern}
                            onChange={(e) => {
                              const val = e.target.value;
                              setUserProfile(prev => ({ ...prev, mainConcern: val }));
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => alert("Profil berhasil diperbarui di memori sandboxed! Great job.")}
                      className="w-full mt-2 py-2.5 bg-[#908AD4] hover:bg-[#908AD4]/90 text-white rounded-xl shadow-xs text-xs font-bold font-mono tracking-wider"
                    >
                      SAVE PROFILE BIODATA
                    </button>
                  </div>

                  {/* Skenario 3 & 4 reviews list with Reply and dynamic updates */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 mt-4 space-y-3.5 shadow-xs flex-1 overflow-y-auto">
                    <p className="text-[10px] uppercase font-black tracking-widest text-[#908AD4] font-mono">Derm Reviews & Upkeep log</p>
                    
                    {/* Add reply and comment thread box */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                      <p className="text-[10px] font-extrabold text-slate-500">POST NEW WEEKLY PROFILE UPDATE</p>
                      
                      <input 
                        type="text"
                        placeholder="e.g., Update after 3 Weeks: Acne resolved..."
                        value={newReviewText}
                        onChange={(e) => setNewReviewText(e.target.value)}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-[#908AD4]"
                      />
                      
                      <div className="flex justify-between items-center bg-white p-1 rounded-lg border border-slate-100">
                        <select 
                          value={newReviewDuration}
                          onChange={(e) => setNewReviewDuration(e.target.value)}
                          className="bg-transparent text-[10px] text-slate-500 focus:outline-none p-1 font-bold"
                        >
                          <option value="1 Day of Use">1 Day of Use</option>
                          <option value="2 Weeks of Use">2 Weeks of Use</option>
                          <option value="1 Month of Use">1 Month of use</option>
                          <option value="3 Months of Use">3 Months of use</option>
                        </select>
                        <button
                          onClick={handleAddReviewSubmit}
                          className="px-3 py-1 bg-[#908AD4] text-white rounded-md text-[10px] font-black uppercase shadow-3xs hover:bg-[#807AC4]"
                        >
                          Send Log
                        </button>
                      </div>
                    </div>

                    {/* Review Comments Feed with automated replies */}
                    <div className="space-y-3 pt-2">
                      {productReviews.slice(0, visibleReviewsCount).map((rev) => (
                        <div key={rev.id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-200/60 text-xs text-slate-700">
                          <div className="flex justify-between items-start mb-1 font-mono text-[9px] text-slate-400">
                            <strong>{rev.author}</strong>
                            <span>{rev.date}</span>
                          </div>
                          <span className="inline-block text-[9px] text-[#908AD4] font-extrabold bg-purple-50 px-2 rounded-full border border-purple-100 select-none mb-1.5">
                            {rev.durationOfUse || 'Skin progression update'}
                          </span>
                          <p className="text-slate-700 leading-normal mb-2.5 block whitespace-pre-wrap">{rev.content}</p>

                          {/* Replies desk summary */}
                          {rev.replies.length > 0 && (
                            <div className="mt-2.5 pl-3 border-l-2 border-[#908AD4] space-y-2 bg-white/70 p-1.5 rounded-lg">
                              {rev.replies.map((rep, rIdx) => (
                                <div key={rIdx} className="text-[10px] text-slate-600">
                                  <span className="font-bold text-indigo-950 font-mono italic">{rep.author}: </span>
                                  <span>{rep.content}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Quick reply typing bar */}
                          <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex space-x-1.5">
                            <input 
                              type="text"
                              placeholder="Reply to this testimonial..."
                              value={replyInputs[rev.id] || ''}
                              onChange={(e) => {
                                const text = e.target.value;
                                setReplyInputs(prev => ({ ...prev, [rev.id]: text }));
                              }}
                              className="flex-1 px-2.5 py-1 text-[10px] border border-slate-200 rounded text-slate-700 bg-white focus:outline-none focus:border-[#908AD4]"
                            />
                            <button
                              onClick={() => handleAddReviewReply(rev.id)}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[9px] font-bold text-slate-600"
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Scenario 4: Load More Reviews button */}
                      {visibleReviewsCount < productReviews.length ? (
                        <button
                          onClick={() => {
                            setVisibleReviewsCount(prev => prev + 2);
                            alert("More reviews loaded successfully!");
                          }}
                          className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold border border-slate-200 rounded-lg text-[10px]"
                        >
                          ➔ Load More Testimonials
                        </button>
                      ) : (
                        <p className="text-center font-mono text-[9px] text-slate-400 block pt-1 select-none">
                          All authority reviews loaded (Consensus: 100% genuine)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Simple Logout button inside Settings */}
                  <button 
                    onClick={() => {
                      setIsLoggedIn(false);
                      setCurrentScreen('shelf');
                    }}
                    className="w-full mt-4 py-3 bg-rose-50 hover:bg-rose-100 font-black tracking-widest text-[#D32F2F] text-xs rounded-2xl transition border border-rose-200"
                  >
                    ➔ Sign Out Account
                  </button>

                </div>
              )}

              {/* SCREEN 5 & 8: FACESCAN CAMERA VIEW PORT (REAL TIME CAPTURED SIMULATED ON PREVIEW) */}
              {currentScreen === 'facescan' && (
                <div className="flex flex-col flex-1 bg-[#F1F1F1] animate-fade-in mt-6">
                  
                  {/* APP TITLE BAR */}
                  <div className="flex items-center justify-between mb-3 text-slate-800 px-4">
                    <button 
                      onClick={() => setCurrentScreen('shelf')}
                      className="p-1 px-2.5 bg-slate-200/50 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700"
                    >
                      ➔ Back
                    </button>
                    <span className="font-mono text-xs text-slate-400 font-bold uppercase tracking-wider">TSKINSANITY CAMERA SCAN</span>
                  </div>

                  {/* Main Silhouette area with active scanner laser line */}
                  <div className="self-stretch mx-7 relative select-none">
                    <div 
                      className="flex flex-col items-center self-stretch bg-[#D9D9D9] pt-6 mx-[5px] rounded-[24px] relative overflow-hidden aspect-[4/5]" 
                      style={{ boxShadow: "0px 4px 4px #00000040" }}
                    >
                      {/* Active green laser line representation during scanning */}
                      {isScanning && (
                        <div className="absolute left-0 right-0 h-1 bg-purple-500 shadow-xl z-20 top-1/2 animate-bounce"></div>
                      )}

                      {/* Header AI verification stamp */}
                      <div className="flex items-center py-1 px-3 mb-3 gap-1.5 rounded-[29826200px] bg-gradient-to-r from-[#AD46FF] to-[#908AD4] z-10 text-white shadow-sm">
                        <Camera className="w-3 h-3 animate-spin" />
                        <span className="text-[9px] font-bold tracking-widest uppercase">
                          {isScanning ? 'CALIBRATING MULTI-PHASE' : 'AI BARRIER DIAL'}
                        </span>
                      </div>

                      {/* Display active stream inside canvas alignment bounding brackets */}
                      <div className="absolute inset-0 z-0 flex items-center justify-center">
                        {isWebcamActive ? (
                          <div className="w-full h-full relative">
                            <video 
                              ref={webcamVideoRef}
                              autoPlay 
                              playsInline
                              muted
                              className="w-full h-full object-cover transform scale-x-[-1]"
                            />
                            {/* calibration overlay target box */}
                            <div className="absolute inset-8 border-2 border-white/60 border-dashed rounded-3xl pointer-events-none flex items-center justify-center text-white/50 text-[10px] font-mono leading-none select-none uppercase">
                              Center your face
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center p-6 text-slate-400 text-center select-none">
                            <User className="w-16 h-16 text-[#908AD4]/80 mb-2 animate-pulse" />
                            <p className="text-[11px] font-semibold text-slate-500 max-w-[200px] leading-snug">
                              Place face within alignment guides in a well-lit room
                            </p>
                            <button 
                              onClick={() => setIsWebcamActive(true)}
                              className="mt-3.5 text-xs text-[#908AD4] font-bold bg-white/90 px-3 py-1.5 rounded-full shadow-xs active:scale-95 transition cursor-pointer"
                            >
                              💻 Use Computer Webcam
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Diagnostics values overlay */}
                      <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 backdrop-blur-md p-3 text-white text-xs select-text space-y-1 z-20 border-t border-white/10">
                        <div className="flex justify-between items-center">
                          <p className="font-mono text-cyan-400 text-[10px] uppercase font-bold flex items-center space-x-1.5 tracking-wider">
                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
                            <span>Calibration Matrix</span>
                          </p>
                          {isScanning && <span className="font-mono text-cyan-300 font-extrabold">{scanProgressPercent}%</span>}
                        </div>
                        <p className="text-[11px] font-mono select-none leading-relaxed block text-slate-200">
                          {scanStepText}
                        </p>
                        {isScanning && (
                          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1 max-w-[280px]">
                            <div className="bg-[#908AD4] h-full transition-all duration-300" style={{ width: `${scanProgressPercent}%` }}></div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Skenario 1 Three main visual pillars of Face Scan */}
                  <div className="mx-7 mt-4 bg-[#D9D9D9] py-3.5 px-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-black/5 pb-2 text-[10px] text-[#181934] select-none font-bold">
                      <p>DIAGNOSTIC CRITERIA</p>
                      <button onClick={handleFlipCamera} className="text-[#908AD4] hover:underline font-extrabold flex items-center space-x-1 uppercase">
                        <RefreshCw className="w-3 h-3" />
                        <span>Flip Cam Lens</span>
                      </button>
                    </div>

                    <div className="flex justify-between items-center text-center gap-2 select-none">
                      <div className="flex flex-1 flex-col items-center">
                        <span className="text-[10px] font-bold text-[#181934] whitespace-nowrap">✓ Good Lights</span>
                        <span className="text-[8px] text-[#5D579A]">☀️ Checked</span>
                      </div>
                      <div className="flex flex-1 flex-col items-center border-x border-black/10">
                        <span className="text-[10px] font-bold text-[#181934] whitespace-nowrap">✓ No Makeup</span>
                        <span className="text-[8px] text-[#5D579A]">🫧 Checked</span>
                      </div>
                      <div className="flex flex-1 flex-col items-center">
                        <span className="text-[10px] font-bold text-[#181934] whitespace-nowrap">✓ No Glasses</span>
                        <span className="text-[8px] text-[#5D579A]">👓 Checked</span>
                      </div>
                    </div>
                  </div>

                  {/* Active scan triggers */}
                  <div className="flex flex-col items-center self-stretch pb-[31px] mt-6 select-none">
                    <button 
                      onClick={handleTriggerFaceScan}
                      disabled={isScanning}
                      className="rounded-full shadow-lg hover:scale-105 active:scale-95 transition disabled:opacity-40"
                    >
                      <img
                        src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/c2388a49-08fd-49ed-ac53-d805a39e62b9" 
                        alt="Face start scan button circle icon highlight"
                        className="w-[88px] h-[85px] object-fill"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                    <span className="text-slate-500 font-bold ml-1 text-xs select-none mt-1.5 animate-pulse">
                      {isScanning ? 'DIAGNOSING...' : 'TAP CAMERA BUTTON TO ANALYZE'}
                    </span>
                  </div>

                </div>
              )}

              {/* SCREEN: DETECTED FACESCAN RESUILT DIAL (FaceScanHasil WITH SAVE PROFILE BTN) */}
              {currentScreen === 'facescan-result' && (
                <div className="flex flex-col flex-1 bg-[#F1F1F1] animate-fade-in mt-6">
                  
                  {/* APP TITLE BAR */}
                  <div className="flex items-center justify-between mb-3 text-slate-800 px-4">
                    <button 
                      onClick={() => setCurrentScreen('facescan')}
                      className="p-1 px-2.5 bg-slate-200/50 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700"
                    >
                      ➔ Retake
                    </button>
                    <span className="font-mono text-xs text-slate-400 font-bold uppercase tracking-wider">TSKINSANITY HARVEST REPORT</span>
                  </div>

                  {/* Captured face snapshot mockup representation */}
                  <div className="self-stretch mx-7 relative flex flex-col pt-4">
                    
                    {/* Bounding image area overlay */}
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/5] shadow-lg bg-slate-900 flex justify-center items-center">
                      <img
                        src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/1778e777-8960-4d33-b97b-c21488c6dfb6"
                        alt="High fidelity scanned face simulation representation"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Interactive glow nodes overlay stamp */}
                      <span className="absolute top-1/4 left-1/3 bg-purple-500 hover:scale-110 cursor-help text-white text-[9px] px-2.5 py-0.5 rounded-full select-none shadow">
                        Redness erythema zone
                      </span>
                      
                      <span className="absolute top-1/2 right-1/4 bg-blue-500 hover:scale-110 cursor-help text-white text-[9px] px-2.5 py-0.5 rounded-full select-none shadow">
                        Dehydration Zone
                      </span>

                      <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 backdrop-blur-xs p-4 text-center">
                        <p className="text-cyan-400 text-xs font-bold font-mono tracking-widest uppercase">Skin Type Detected</p>
                        <h3 className="text-white text-xl font-black mt-0.5 leading-none">OILY & SENSITIVE SKIN!</h3>
                      </div>
                    </div>

                  </div>

                  {/* Skenario 1 Details analysis cards */}
                  <div className="mx-7 mt-4 bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
                    <p className="font-bold text-[#181934] uppercase tracking-wider text-[10px] text-purple-700">Skin Wellness Index</p>
                    <ul className="space-y-1.5 select-text leading-relaxed">
                      <li>🔴 <strong>Surface Redness:</strong> {scanResultReport.redness}</li>
                      <li>🟡 <strong>Moisture Value:</strong> <span className="text-amber-600 font-semibold">{scanResultReport.moisture}</span></li>
                      <li>🟢 <strong>Forehead zone:</strong> {scanResultReport.acne}</li>
                    </ul>
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-rose-800 bg-rose-50/50 p-2 rounded-lg leading-relaxed">
                      <strong>Advisor warning:</strong> Exfoliating toner elements should be put on pause block immediately to safe-guard barriers.
                    </div>
                  </div>

                  {/* Simpan profil kulitku button and cooling triggers */}
                  <div className="px-7 mt-5.5 space-y-2">
                    <button
                      onClick={handleSaveSkinProfile}
                      className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-[#908AD4] hover:scale-[1.01] text-white font-extrabold text-sm rounded-xl shadow-md uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <CheckIcon className="w-4 h-4 text-white" />
                      <span>Save Result / Simpan Profil Kulitku ➔</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setCoolingOffActive(true);
                        setCoolingOffDay(1);
                        alert("Safeguard rehydration activated on profile!");
                        setCurrentScreen('cooling-off');
                      }}
                      className="w-full py-2.5 bg-[#F1F1F1] hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition border border-slate-300"
                    >
                      ❄️ Engage 14-Days Cooling Off Cooldown Shield
                    </button>
                  </div>

                </div>
              )}

              {/* SCREEN: INGREDIENTS CHECK DETAIL SCREEN MATCHING DESIGN (SCREENSHOT 1) */}
              {currentScreen === 'product-detail' && (
                <div className="flex flex-col flex-1 bg-[#F1F1F1] animate-fade-in overflow-hidden">
                  
                  {/* Lavender App Header */}
                  <div className="bg-[#908AD4] px-5 py-4 flex items-center justify-between text-white select-none shrink-0 z-30 shadow-xs">
                    <div className="flex items-center font-bold">
                      <button 
                        onClick={() => setCurrentScreen('search')}
                        className="text-white hover:bg-white/10 p-1 rounded-full transition active:scale-95 font-black text-lg mr-2 font-mono flex items-center justify-center w-8 h-8 font-extrabold cursor-pointer"
                      >
                        &lt;
                      </button>
                      <span className="text-base font-extrabold tracking-wide uppercase">Ingredient Analysis</span>
                    </div>
                    <span className="text-[10px] bg-white/20 text-white px-2.5 py-1 rounded-full font-black uppercase tracking-widest font-bold">
                      Detail Check
                    </span>
                  </div>

                  {/* Main Scrollable Canvas */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    
                    {/* Main High Fidelity Card */}
                    <div className="bg-white p-5 rounded-[28px] border border-[#DDDDF2] shadow-sm space-y-4">
                      
                      {/* Product Image and heart toggle */}
                      <div className="relative w-full h-44 bg-[#F8F7FF] rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden">
                        <img 
                          src={selectedDetailProduct?.imageUrl || "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/KRB2eAlLOy/91akkbvi_expires_30_days.png"}
                          alt="Skincare detail view representation" 
                          className="h-36 object-contain mix-blend-multiply"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Heart Favorite toggle button */}
                        <button 
                          onClick={() => {
                            if (selectedDetailProduct) {
                              const updated = products.map(p => p.id === selectedDetailProduct.id ? { ...p, isFavorite: !p.isFavorite } : p);
                              setProducts(updated);
                              setSelectedDetailProduct({ ...selectedDetailProduct, isFavorite: !selectedDetailProduct.isFavorite });
                              alert(selectedDetailProduct.isFavorite ? "Removed from skin favorites." : "Added to skin favorites! 💖");
                            } else {
                              alert("Added to skin favorites! 💖");
                            }
                          }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:scale-105 active:scale-90 transition cursor-pointer text-rose-500 text-sm font-bold"
                        >
                          {selectedDetailProduct?.isFavorite ? "❤️" : "🤍"}
                        </button>
                      </div>

                      {/* Title and metadata */}
                      <div className="space-y-1">
                        <span className="text-[10px] bg-[#F0EEFF] text-[#908AD4] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wide inline-block font-bold">
                          {selectedDetailProduct?.brand || "SKIN ANGEL"}
                        </span>
                        <h2 className="text-lg font-black text-slate-800 leading-tight">
                          {selectedDetailProduct?.name || "Centella Ampoule"}
                        </h2>
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          <span className="text-[9px] font-bold text-[#554CAF] bg-[#EBE9FF] px-2 py-0.5 rounded-md">#BarrierRepair</span>
                          <span className="text-[9px] font-bold text-[#554CAF] bg-[#EBE9FF] px-2 py-0.5 rounded-md">#DrySkin</span>
                          <span className="text-[9px] font-bold text-[#554CAF] bg-[#EBE9FF] px-2 py-0.5 rounded-md">#Soothing</span>
                        </div>
                      </div>

                      {/* Excerpt */}
                      <p className="text-xs text-slate-500 leading-relaxed text-justify">
                        {selectedDetailProduct?.notes || "Cairan murni terbuat dari 100% ragi herbisida asiatica murni untuk hidrasi maksimal, meredakan jerawat aktif, dan meremajakan sel keratinosit epidermis."}
                      </p>

                    </div>

                    {/* Chemical Ingredient compatibility list */}
                    <div className="bg-white p-5 rounded-[28px] border border-[#DDDDF2] shadow-sm space-y-3">
                      <h3 className="text-xs font-black text-[#5C55AB] uppercase tracking-widest">
                        🧪 INCI Ingredients Profiler
                      </h3>
                      
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs gap-3">
                          <div className="space-y-0.5">
                            <p className="font-extrabold text-slate-800 text-xs">Niacinamide (5%)</p>
                            <p className="text-[10px] text-slate-500 leading-tight">Brightening & Pore Refinement</p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded font-black text-[9px] bg-emerald-100 text-emerald-800 uppercase tracking-wide shrink-0 font-bold">
                            Safe ☑
                          </span>
                        </div>

                        <div className="flex items-start justify-between p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs gap-3">
                          <div className="space-y-0.5">
                            <p className="font-extrabold text-slate-800 text-xs">Hyaluronic Acid</p>
                            <p className="text-[10px] text-slate-500 leading-tight">Deep Hydration & Barrier Fill</p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded font-black text-[9px] bg-emerald-100 text-emerald-800 uppercase tracking-wide shrink-0 font-bold">
                            Safe ☑
                          </span>
                        </div>

                        <div className="flex items-start justify-between p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-xs gap-3">
                          <div className="space-y-0.5">
                            <p className="font-extrabold text-slate-800 text-xs text-rose-700">Fragrance (Limonene)</p>
                            <p className="text-[10px] text-rose-500 leading-tight">Potential allergen for sensitive stratum</p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded font-black text-[9px] bg-rose-100 text-rose-800 uppercase tracking-wide shrink-0 animate-pulse font-bold">
                            Warning ⚠
                          </span>
                        </div>
                      </div>

                      <button 
                        onClick={() => alert("Menampilkan semua 28 zat aktif pembentuk: Aqua, Centella Extract, Butylene Glycol, Glycerin, 1,2-Hexanediol, Limonene, Niacinamide...")}
                        className="w-full text-center text-[#554CAF] hover:text-[#3B3494] font-black text-[10px] uppercase tracking-widest pt-2 focus:outline-none font-bold"
                      >
                        ⚡ VIEW FULL INCI LIST ➔
                      </button>
                    </div>

                    {/* Skin Compatibility Gauges */}
                    <div className="bg-white p-5 rounded-[28px] border border-[#DDDDF2] shadow-sm space-y-4">
                      <h3 className="text-xs font-black text-[#5C55AB] uppercase tracking-widest font-bold">
                        📊 Skin Compatibility Indices
                      </h3>

                      <div className="space-y-3">
                        {/* Gauge 1 Hydration match */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                            <span>💧 Hydration Match Level</span>
                            <span className="text-[#908AD4] font-extrabold">92% Match</span>
                          </div>
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-400 to-[#908AD4] h-full rounded-full transition-all duration-1000" style={{ width: '92%' }}></div>
                          </div>
                        </div>

                        {/* Gauge 2 Sensitivity match */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                            <span>🚨 Sensitivity Allergy Risk</span>
                            <span className="text-rose-500 font-extrabold">15% Low Risk</span>
                          </div>
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-rose-400 to-rose-500 h-full rounded-full transition-all duration-1000" style={{ width: '15%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Location Sorting Boutiques and Directions map simulation */}
                    <div className="bg-white p-5 rounded-[28px] border border-[#DDDDF2] shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[8px] font-black tracking-widest text-[#908AD4] uppercase font-mono font-bold">boutique locator ready</span>
                          <h3 className="text-xs font-black text-slate-800 leading-tight">Available on Skinsanity Boutique - Tembalang</h3>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                            0.4 km away • Open until 8 PM
                          </p>
                        </div>
                        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wide shrink-0 font-bold">
                          In Stock
                        </span>
                      </div>

                      {/* Map simulation widget */}
                      <div className="bg-slate-100 border border-slate-200 h-32 rounded-2xl relative overflow-hidden flex flex-col justify-between p-3">
                        <div className="absolute inset-0 opacity-40 select-none pointer-events-none">
                          {/* Map abstract graphics */}
                          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0,40 Q100,20 200,80 T400,60" fill="none" stroke="#908AD4" strokeWidth="4" />
                            <path d="M40,0 Q120,120 180,200 T400,320" fill="none" stroke="#777" strokeWidth="1" />
                            <path d="M100,0 Q150,150 350,300" fill="none" stroke="#22D3EE" strokeWidth="2" strokeDasharray="4" />
                            <circle cx="160" cy="80" r="8" fill="#EF4444" />
                            <circle cx="160" cy="80" r="14" fill="#EF4444" fillOpacity="0.3" />
                          </svg>
                        </div>
                        <div className="relative z-10 bg-white/90 backdrop-blur-xs p-1.5 rounded-xl border border-slate-200 w-28 text-center text-[8px] font-black tracking-wider shadow-2xs text-[#403B7D] select-none font-bold">
                          📍 TEMBALANG HQ
                        </div>
                        <div className="relative z-10 self-end text-[9px] font-black text-slate-500 bg-white/95 px-2 py-0.5 rounded-lg border border-slate-200 select-none">
                          Skinsanity Uptown outlet
                        </div>
                      </div>

                      {/* Directions and call actions */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button 
                          onClick={() => alert("📍 Petunjuk Arah: Berjalan ke Jalan Tembalang Uptown No. 44, berjarak 400 meter (sekitar 5 menit jalan kaki dari kos Hailey).")}
                          className="w-full py-2.5 rounded-xl bg-[#908AD4] hover:bg-[#7F79B1] text-white font-black text-[10px] uppercase tracking-wider flex items-center justify-center space-x-1 shadow-3xs cursor-pointer active:scale-97 transition font-bold"
                        >
                          <span>DIRECTIONS 🗺️</span>
                        </button>
                        <button 
                          onClick={() => alert("📞 Menghubungi Skinsanity Boutique Tembalang Uptown: +62 811-9922-8833... Produk saat ini dikonfirmasi Tersedia di rak stock toko.")}
                          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider flex items-center justify-center space-x-1 shadow-3xs cursor-pointer active:scale-97 transition font-bold"
                        >
                          <span>CALL BOUTIQUE 📞</span>
                        </button>
                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* SCREEN: REVIEW AGGREGATOR MATCHING DESIGN (SCREENSHOT 2) */}
              {currentScreen === 'review-aggregator' && (
                <div className="flex flex-col flex-1 bg-[#F1F1F1] animate-fade-in overflow-hidden font-sans">
                  
                  {/* Purple header with back button */}
                  <div className="bg-[#908AD4] px-5 py-4 flex items-center justify-between text-white select-none shrink-0 z-30 shadow-xs">
                    <div className="flex items-center">
                      <button 
                        onClick={() => setCurrentScreen('shelf')}
                        className="text-white hover:bg-white/10 p-1 rounded-full transition active:scale-95 text-lg mr-2 font-mono flex items-center justify-center w-8 h-8 font-extrabold cursor-pointer"
                      >
                        &lt;
                      </button>
                      <span className="text-base font-extrabold tracking-wide uppercase">Review Aggregator</span>
                    </div>
                    <span className="text-[10px] bg-white/20 text-white px-2.5 py-1 rounded-full font-black uppercase tracking-widest font-bold">
                      AI INSIGHTS
                    </span>
                  </div>

                  {/* Main contents scroll wrapper */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-[#F8F7FF]">
                    
                    {/* Top product card with image */}
                    <div className="bg-white p-5 rounded-[28px] border border-[#DDDDF2] shadow-sm flex items-center gap-4">
                      <div className="w-20 h-20 bg-[#F6F5FD] rounded-2xl border border-slate-100 flex items-center justify-center shrink-0">
                        <img 
                          src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/KRB2eAlLOy/0lagtbm6_expires_30_days.png" 
                          alt="Ceramide calm essence item" 
                          className="h-16 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h2 className="text-base font-black text-slate-800 leading-tight">Ceramide Calm Essence</h2>
                        <p className="text-xs text-amber-500 font-extrabold flex items-center">
                          <span>4.7 ⭐</span>
                          <span className="text-[#8E8BAD] font-bold text-[10px] ml-1.5 uppercase font-mono font-bold">(1.2k Social Mentions)</span>
                        </p>
                        <span className="text-[9px] font-black tracking-widest text-[#908AD4] bg-[#F0EEFF] px-2 py-0.5 rounded-full uppercase inline-block font-mono font-bold">
                          Skinsanity Labs
                        </span>
                      </div>
                    </div>

                    {/* Strengths & Critique lists exactly as Design */}
                    <div className="grid grid-cols-2 gap-3">
                      
                      {/* Left: Top Strength */}
                      <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
                        <span className="text-[9px] font-black uppercase text-emerald-800 tracking-wider flex items-center space-x-1">
                          <span>💪</span>
                          <span>Top Strength:</span>
                        </span>
                        <p className="text-xs font-extrabold text-emerald-950 leading-tight">
                          Barrier Repair & Redness Reduction
                        </p>
                        <p className="text-[9px] text-[#2D6A4F] leading-snug">
                          Clinically verified lipid synthesis acceleration.
                        </p>
                      </div>

                      {/* Right: Common Critique */}
                      <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 shadow-2xs space-y-1">
                        <span className="text-[9px] font-black uppercase text-amber-800 tracking-wider flex items-center space-x-1">
                          <span>📣</span>
                          <span>Common Critique:</span>
                        </span>
                        <p className="text-xs font-extrabold text-amber-950 leading-tight">
                          Pipette can be tricky near end
                        </p>
                        <p className="text-[9px] text-amber-800 leading-snug font-medium">
                          Viscous formula requires careful syringe suction.
                        </p>
                      </div>

                    </div>

                    {/* Unbiased AI sentiment gauge with circle indicator */}
                    <div className="bg-white p-5 rounded-[28px] border border-[#DDDDF2] shadow-sm flex flex-col items-center text-center space-y-3">
                      
                      <div className="relative w-28 h-28 flex items-center justify-center select-none">
                        {/* Circular ring indicator */}
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="41" stroke="#F1EFFE" strokeWidth="5" fill="none" />
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="41" 
                            stroke="#908AD4" 
                            strokeWidth="5" 
                            strokeDasharray="257.6"
                            strokeDashoffset={257.6 - (257.6 * 0.88)}
                            fill="none" 
                            className="transition-all duration-1000"
                          />
                        </svg>
                        
                        {/* 88% value */}
                        <div className="absolute text-center">
                          <span className="text-2xl font-black text-[#5C55AB] block font-mono font-bold">88%</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-mono font-bold">INSIGHT</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800">Unbiased AI Sentiment Aggregate</h4>
                        <p className="text-[10px] text-slate-500 max-w-sm">
                          Summative analysis extracted from beauty forums, reviews, and clinical logs.
                        </p>
                      </div>

                      <div className="w-full bg-[#F6F5FD] p-2.5 rounded-xl border border-[#DDDDF2] text-[10px] text-[#554CAF] font-black uppercase tracking-wider font-bold">
                        💡 Best used in PM routines after water-based toners
                      </div>

                    </div>

                    {/* User review submit and reviews listing */}
                    <div className="bg-white p-5 rounded-[28px] border border-[#DDDDF2] shadow-sm space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <h3 className="text-xs font-black text-[#5C55AB] uppercase tracking-widest font-bold">
                          💬 Public Reviews & Feedback
                        </h3>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {productReviews.length} total comments
                        </span>
                      </div>

                      {/* Simple review submit form in Aggregator */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                        <p className="text-[9px] uppercase font-black text-slate-400 font-bold">Share your experience / Post review</p>
                        <div className="space-y-2">
                          <textarea 
                            value={newReviewText}
                            onChange={(e) => setNewReviewText(e.target.value)}
                            placeholder="Write your review experience..."
                            className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-[#908AD4] resize-none h-16 text-slate-800"
                          />
                          <div className="flex justify-between items-center">
                            <select 
                              value={newReviewDuration}
                              onChange={(e) => setNewReviewDuration(e.target.value)}
                              className="bg-transparent text-[#908AD4] font-bold text-[10px] focus:outline-none border border-slate-200 rounded px-1.5 py-0.5 font-bold"
                            >
                              <option value="1 Day of Use font-bold">1 Day of Use</option>
                              <option value="1 Week of Use font-bold">1 Week of Use</option>
                              <option value="2 Weeks of Use font-bold font-bold">2 Weeks of Use</option>
                              <option value="1 Month of Use font-bold">1 Month of Use</option>
                            </select>
                            
                            <button 
                              onClick={handleAddReviewSubmit}
                              className="px-4 py-1.5 bg-[#908AD4] text-white hover:bg-[#7F79B1] text-[10px] font-black rounded-lg uppercase tracking-wider transition active:scale-95 font-bold cursor-pointer"
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Reviews Comment lists feed */}
                      <div className="space-y-4 pt-2">
                        {productReviews.slice(0, visibleReviewsCount).map((rev) => (
                          <div key={rev.id} className="p-3 bg-[#FDFDFF] rounded-2xl border border-[#DDDDF2] space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-extrabold text-slate-800 capitalize block font-bold">{rev.author}</span>
                                <span className="text-[8px] text-slate-400 font-bold block uppercase">{rev.durationOfUse} • {rev.date}</span>
                              </div>
                              <span className="text-[#908AD4] font-bold font-mono">
                                {"⭐".repeat(rev.rating)}
                              </span>
                            </div>
                            
                            <p className="text-slate-600 leading-relaxed text-justify text-[11px]">
                              {rev.content}
                            </p>

                            {/* Replies feed */}
                            {rev.replies && rev.replies.map((reply, rid) => (
                              <div key={rid} className="mt-2.5 p-2 bg-[#F5F3FF] rounded-xl border border-purple-100 text-[10px] text-slate-700 ml-4 space-y-0.5">
                                <span className="font-extrabold text-[#908AD4] block font-bold">🤖 {reply.author}</span>
                                <p className="leading-normal">{reply.content}</p>
                              </div>
                            ))}

                            {/* Inline reply action form */}
                            <div className="flex gap-1.5 mt-2 ml-4">
                              <input 
                                type="text"
                                placeholder={`Reply to ${rev.author}...`}
                                value={replyInputs[rev.id] || ''}
                                onChange={(e) => setReplyInputs({ ...replyInputs, [rev.id]: e.target.value })}
                                className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-[#908AD4] text-slate-805"
                              />
                              <button 
                                onClick={() => handleAddReviewReply(rev.id)}
                                className="bg-[#908AD4] px-3.5 rounded-lg text-white font-extrabold text-[10px] hover:bg-[#7D75CD] active:scale-95 uppercase tracking-wider font-bold cursor-pointer"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Load More component */}
                      {visibleReviewsCount < productReviews.length && (
                        <button 
                          onClick={() => setVisibleReviewsCount(prev => prev + 2)}
                          className="w-full py-2 bg-slate-100 text-[#908AD4] hover:bg-purple-50 text-[10px] font-black rounded-xl uppercase tracking-widest transition font-bold"
                        >
                          Load More Reviews
                        </button>
                      )}

                    </div>

                  </div>

                </div>
              )}

            </>
          )}

        </div>

        {/* PERSISTENT TAB BAR FOOTER SYSTEM EXACTLY MATCHING FIGMA SPECIFICATIONS */}
        <div className="self-stretch bg-[#908AD4] py-3.5 px-[24px] shrink-0 select-none z-20 border-t border-white/10 shadow-lg relative">
          <div className="flex items-center justify-between w-full relative">
            
            {/* Tab 1: Home / Stock Cabinet */}
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/38b81930-2bed-4a4b-9425-203006111595" 
              className={`w-[36px] h-[36px] object-contain cursor-pointer transition-all duration-150 active:scale-95 ${
                ['shelf', 'shelf-list', 'input-skincare'].includes(currentScreen) 
                  ? 'ring-2 ring-white/50 rounded-xl bg-white/20 p-0.5' 
                  : 'opacity-80 hover:opacity-100'
              }`}
              onClick={() => {
                if (!isLoggedIn) {
                  alert("Please login first to inspect your skincare stock!");
                  return;
                }
                setCurrentScreen('shelf');
              }}
              alt="Stock shelf tab"
              referrerPolicy="no-referrer"
            />

            {/* Tab 2: Ingredients Check / Search */}
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/b3bc03fc-6b2f-4a2d-b3af-f9eced44c8db" 
              className={`w-[32px] h-[32px] object-contain cursor-pointer transition-all duration-150 active:scale-95 ${
                currentScreen === 'search' 
                  ? 'ring-2 ring-white/50 rounded-xl bg-white/20 p-0.5' 
                  : 'opacity-80 hover:opacity-100'
              }`}
              onClick={() => {
                if (!isLoggedIn) {
                  alert("Please login first to search products!");
                  return;
                }
                setCurrentScreen('search');
              }}
              alt="Ingredients search tab"
              referrerPolicy="no-referrer"
            />

            {/* Center Circular Elevated Camera Shutter Button */}
            <div className="relative w-14 h-10 flex items-center justify-center">
              <div 
                onClick={() => {
                  if (!isLoggedIn) {
                    alert("Please login first!");
                    return;
                  }
                  setCurrentScreen('facescan');
                }}
                className="absolute -top-7 w-[52px] h-[52px] rounded-full bg-[#E3E0FE] border-4 border-[#F1F1F1] flex items-center justify-center cursor-pointer transition-all duration-150 shadow-md hover:scale-105 active:scale-90 z-30 group"
                title="Launch Face Camera Scanner"
              >
                <div className="w-9 h-9 rounded-full bg-[#908AD4] flex items-center justify-center group-hover:bg-[#7F79B1] transition">
                  <Camera className="w-[18px] h-[18px] text-white" />
                </div>
              </div>
            </div>

            {/* Tab 3: Sliding Notification Center Bell Icon */}
            <div className="relative">
              <img
                src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/a9b7faa8-0a47-453f-a830-e1fd57875da9" 
                className={`w-[32px] h-[32px] object-contain cursor-pointer transition-all duration-150 active:scale-95 ${
                  showNotificationCenter 
                    ? 'ring-2 ring-white/50 rounded-xl bg-white/20 p-0.5' 
                    : 'opacity-80 hover:opacity-100'
                }`}
                onClick={() => {
                  if (!isLoggedIn) {
                    alert("Please login first to access notifications!");
                    return;
                  }
                  setShowNotificationCenter(!showNotificationCenter);
                }}
                alt="System alerts bell tab"
                referrerPolicy="no-referrer"
              />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-400 text-white font-extrabold text-[8px] rounded-full px-1 py-0.2 min-w-[14px] text-center shadow-xs border border-white animate-pulse">
                  {notifications.length}
                </span>
              )}
            </div>

            {/* Tab 4: Profile / Biography fields */}
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/401389a3-4df0-4c07-812f-bc1f8fc0908d" 
              className={`w-[36px] h-[36px] object-contain cursor-pointer transition-all duration-150 active:scale-95 ${
                currentScreen === 'profile' 
                  ? 'ring-2 ring-white/50 rounded-xl bg-white/20 p-0.5' 
                  : 'opacity-80 hover:opacity-100'
              }`}
              onClick={() => {
                if (!isLoggedIn) {
                  alert("Please login first to edit biography!");
                  return;
                }
                setCurrentScreen('profile');
              }}
              alt="User profile tab"
              referrerPolicy="no-referrer"
            />

          </div>
        </div>

        {/* Skenario 3: Sliding active Notification Center */}
        {showNotificationCenter && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end select-none animate-fade-in">
            <div className="w-80 bg-white h-full shadow-2xl p-4 flex flex-col animate-slide-in relative">
              <div className="flex items-center justify-between border-b pb-3 mb-4 text-slate-800">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-[#908AD4]" />
                  <span className="font-bold text-sm">Notifications Panel</span>
                </div>
                <button 
                  onClick={() => setShowNotificationCenter(false)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Close ✕
                </button>
              </div>

              {/* Skenario 3 clear all triggers option */}
              {notifications.length > 0 && (
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4 select-none">
                  <span className="text-[10px] text-slate-500 font-bold">{notifications.length} Unresolved Alerts</span>
                  <button
                    onClick={handleClearAllNotifications}
                    className="text-[10px] bg-[#908AD4]/10 hover:bg-[#908AD4]/20 text-[#908AD4] px-2 py-1 rounded font-black uppercase tracking-wider"
                  >
                    Select All / Hapus Semua ✕
                  </button>
                </div>
              )}

              {/* Scrollable logs */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {notifications.map((n) => (
                  <div 
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className="p-3 bg-slate-50/70 border border-slate-200/50 hover:bg-slate-100 transition rounded-xl relative cursor-pointer text-xs"
                  >
                    {/* Delete button individual */}
                    <button
                      onClick={(e) => handleDeleteNotification(n.id, e)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 p-0.5 transition"
                      title="Delete alert"
                    >
                      ✕
                    </button>

                    <p className="font-bold text-[#181934] leading-tight pr-4">{n.title}</p>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed block">{n.text}</p>
                    <p className="text-[9px] text-[#5D579A] mt-1.5 font-mono select-none block">{n.date}</p>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <div className="text-center text-slate-400 text-xs py-16 flex flex-col items-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2 animate-bounce" />
                    <p className="font-bold">Inbox compiled clean!</p>
                    <p className="text-[10px] text-slate-400 mt-1">Check back later for expiry warnings.</p>
                  </div>
                )}
              </div>

              {/* Notification Details trigger modal drawer */}
              {selectedNotificationProduct && (
                <div className="mt-4 p-3.5 bg-[#908AD4]/5 border-t border-[#908AD4]/10 rounded-2xl animate-fade-in relative">
                  <button 
                    onClick={() => setSelectedNotificationProduct(null)}
                    className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                  >
                    ✕
                  </button>
                  <p className="text-[10px] font-black uppercase text-[#908AD4] tracking-wider mb-1.5 select-none">Quick shelf alignment</p>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 text-xs leading-none">{selectedNotificationProduct.brand} {selectedNotificationProduct.name}</p>
                    <p className="text-[11px] text-slate-500 leading-tight">Volumetric level: {selectedNotificationProduct.remainingPercent}% left</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedNotificationProduct(null);
                      setShowNotificationCenter(false);
                      handleEditProductClickFromWorkflow(selectedNotificationProduct);
                    }}
                    className="w-full mt-2.5 py-1.5 bg-[#908AD4] text-white rounded-lg text-[10px] font-black uppercase shadow-3xs hover:bg-[#807AC4]"
                  >
                    Edit Product level
                  </button>
                </div>
              )}

              <p className="text-center text-[9px] text-slate-400 pt-2 block border-t select-none uppercase font-bold tracking-wider mt-4">
                automated skinsanity system
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Floating side advisory board showing for desktop layout clarity */}
      <div className="hidden lg:flex w-80 ml-6 flex-col space-y-6 select-none shrink-0 self-start mt-8">
        
        {/* Core application guide desk */}
        <div className="bg-slate-800/90 backdrop-blur-md p-6 rounded-3xl border border-slate-700 text-slate-100 flex flex-col space-y-4 shadow-xl">
          <div className="flex items-center space-x-2.5 text-purple-400 font-bold uppercase text-xs tracking-wider">
            <Volume2 className="w-5 h-5 animate-bounce" />
            <span>Skinsanity Guide</span>
          </div>
          <h3 className="text-base font-black text-white">Clinical Skincare System</h3>
          <p className="text-xs text-slate-400 leading-relaxed block">
            Welcome, Hailey! You are running skinsanity full-stack sandboxed mockup client. Try tapping the dynamic tabs.
          </p>
          <ul className="space-y-2.5 text-[11px] text-slate-300">
            <li className="flex items-center space-x-1.5">
              <span className="text-[#908AD4]">☀️</span>
              <span><strong>Login (Scenario 1):</strong> Logout and fill credentials matching validation bounds.</span>
            </li>
            <li className="flex items-center space-x-1.5">
              <span className="text-[#908AD4]">🔋</span>
              <span><strong>AI Scanner (Scenario 1 & 4):</strong> Flip cameras, snap lipid readings, and save profile results!</span>
            </li>
            <li className="flex items-center space-x-1.5">
              <span className="text-[#908AD4]">❄️</span>
              <span><strong>Search & Cooldown (Scenario 2):</strong> Sort matching distance, configure precise sabbatical weeks.</span>
            </li>
            <li className="flex items-center space-x-1.5">
              <span className="text-[#908AD4]">📱</span>
              <span><strong>Reviews & Inbox (Scenario 3):</strong> Delete expired warnings, replies comments feed instantly.</span>
            </li>
          </ul>
        </div>

        {/* Flutter exporter */}
        <div className="bg-slate-800/90 backdrop-blur-md p-5 rounded-2xl text-white border border-slate-700 shadow-sm space-y-3.5">
          <h4 className="text-xs font-black text-cyan-400 font-mono tracking-wider flex items-center space-x-1">
            <Code className="w-4 h-4 text-cyan-400" />
            <span>FLUTTER SOURCE DESK</span>
          </h4>
          <p className="text-[11px] text-slate-400 leading-normal block">
            Export skinsanity responsive SDK source directly into your iOS and Android mobile framework compiles.
          </p>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(flutterSourceCode);
              alert("Responsive Flutter source copied cleanly! 📱✨");
            }}
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg text-xs transition uppercase flex items-center justify-center space-x-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Flutter material code</span>
          </button>
        </div>

      </div>

      {/* Comprehensive Product Edit & Add Modal */}
      <ProductEditModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onSave={handleSaveProductToInventory}
        product={selectedProduct}
      />

      {/* Profile Saved Success Toast matching Skenario 1 */}
      {showProfileToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#908AD4] border-2 border-white text-white font-bold text-xs p-4 rounded-xl shadow-2xl flex items-center space-x-2 select-none animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Profil kulit berasimilasi berhasil! Update saved to Hailey database.</span>
        </div>
      )}

    </div>
  );
}
