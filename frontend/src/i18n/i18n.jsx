/**
 * Internationalization — English, Telugu, Hindi
 * Complete translation dictionaries + React context provider
 */

import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Header
    appTitle: 'Quantum Soil Analyzer',
    appSubtitle: 'AI-Powered Crop Recommendation & Soil Analysis',
    apiConnected: 'API Connected',
    apiOffline: 'API Offline',
    modelsReady: 'Models Ready',

    // Tabs
    analyzeSoil: 'Analyze Soil',
    results: 'Results',
    modelComparison: 'Model Comparison',
    modelDashboards: 'Model Dashboards',
    history: 'History',

    // Auth
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    username: 'Username',
    password: 'Password',
    email: 'Email',
    firstName: 'First Name',
    lastName: 'Last Name',
    phone: 'Phone Number',
    location: 'Location',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    welcomeBack: 'Welcome Back, Farmer!',
    createAccount: 'Create Your Account',
    loginSubtitle: 'Sign in to access your soil analysis dashboard',
    signupSubtitle: 'Join thousands of farmers using AI for better crops',

    // Form
    soilParams: 'Soil & Climate Parameters',
    soilParamsSubtitle: 'Enter your soil test results and local climate data',
    nitrogen: 'Nitrogen (N)',
    phosphorus: 'Phosphorus (P)',
    potassium: 'Potassium (K)',
    soilPH: 'Soil pH',
    temperature: 'Temperature',
    humidity: 'Humidity',
    rainfall: 'Rainfall',
    analyzePredict: 'Analyze & Predict',
    analyzing: 'Analyzing...',
    reset: 'Reset',

    // Results
    recommendedCrop: 'Recommended Crop',
    confidence: 'Confidence',
    top3Crops: 'Top 3 Crop Recommendations',
    nutrientAnalysis: 'Nutrient Analysis',
    soilHealthScore: 'Soil Health Score',
    shapExplain: 'SHAP Explainability - Why this crop?',
    quantumVsClassical: 'Quantum vs Classical ML Comparison',
    deficiencyPattern: 'Nutrient Deficiency Pattern',
    classicalEnsemble: 'Classical Ensemble',
    quantumML: 'Quantum ML',

    // Nutrients
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    optimal: 'Optimal',

    // Weather
    liveWeather: 'Live Weather Data',
    fetchingWeather: 'Fetching weather...',
    live: 'Live',
    fallback: 'Fallback',

    // Models
    modelPerformance: 'Model Performance Comparison',
    accuracy: 'Accuracy',
    precision: 'Precision',
    recall: 'Recall',
    f1Score: 'F1-Score',
    best: 'Best',
    quantumDetails: 'Quantum ML Details',
    qubits: 'Qubits',
    layers: 'Layers',
    trainSamples: 'Train Samples',
    testSamples: 'Test Samples',
    refresh: 'Refresh',
    noModelData: 'No Model Data Available',
    modelsNotTrained: 'Models have not been trained yet.',

    // Model Names
    randomForest: 'Random Forest',
    xgboost: 'XGBoost',
    lightgbm: 'LightGBM',
    knn: 'K-Nearest Neighbors',
    stackedEnsemble: 'Stacked Ensemble',
    quantumMl: 'Quantum ML',

    // Dashboard
    predictWith: 'Predict with',
    modelDetails: 'Model Details',
    selectModel: 'Select a model to see its individual dashboard',

    // Footer
    footerText: 'Quantum-Enhanced Soil Nutrient Analysis & Multi-Crop Recommendation System',
    footerSub: 'Powered by ML, Quantum Computing & SHAP Explainability',

    // Language
    language: 'Language',
  },

  te: {
    // Header
    appTitle: 'క్వాంటం మట్టి విశ్లేషకం',
    appSubtitle: 'AI-ఆధారిత పంట సిఫార్సు & మట్టి విశ్లేషణ',
    apiConnected: 'API కనెక్ట్',
    apiOffline: 'API ఆఫ్‌లైన్',
    modelsReady: 'మోడల్స్ సిద్ధం',

    // Tabs
    analyzeSoil: 'మట్టి విశ్లేషణ',
    results: 'ఫలితాలు',
    modelComparison: 'మోడల్ పోలిక',
    modelDashboards: 'మోడల్ డ్యాష్‌బోర్డ్‌లు',
    history: 'చరిత్ర',

    // Auth
    login: 'లాగిన్',
    signup: 'సైన్ అప్',
    logout: 'లాగ్ అవుట్',
    username: 'వినియోగదారు పేరు',
    password: 'పాస్‌వర్డ్',
    email: 'ఇమెయిల్',
    firstName: 'మొదటి పేరు',
    lastName: 'ఇంటిపేరు',
    phone: 'ఫోన్ నంబర్',
    location: 'ప్రదేశం',
    dontHaveAccount: 'ఖాతా లేదా?',
    alreadyHaveAccount: 'ఖాతా ఉందా?',
    welcomeBack: 'తిరిగి స్వాగతం, రైతు!',
    createAccount: 'మీ ఖాతాను సృష్టించండి',
    loginSubtitle: 'మీ మట్టి విశ్లేషణ డ్యాష్‌బోర్డ్‌ను యాక్సెస్ చేయడానికి సైన్ ఇన్ చేయండి',
    signupSubtitle: 'మెరుగైన పంటల కోసం AI ఉపయోగించే వేలాది రైతులతో చేరండి',

    // Form
    soilParams: 'మట్టి & వాతావరణ పరామితులు',
    soilParamsSubtitle: 'మీ మట్టి పరీక్ష ఫలితాలు మరియు స్థానిక వాతావరణ డేటాను నమోదు చేయండి',
    nitrogen: 'నత్రజని (N)',
    phosphorus: 'భాస్వరం (P)',
    potassium: 'పొటాషియం (K)',
    soilPH: 'మట్టి pH',
    temperature: 'ఉష్ణోగ్రత',
    humidity: 'తేమ',
    rainfall: 'వర్షపాతం',
    analyzePredict: 'విశ్లేషించు & అంచనా',
    analyzing: 'విశ్లేషిస్తోంది...',
    reset: 'రీసెట్',

    // Results
    recommendedCrop: 'సిఫార్సు చేసిన పంట',
    confidence: 'విశ్వాసం',
    top3Crops: 'అగ్ర 3 పంట సిఫార్సులు',
    nutrientAnalysis: 'పోషక విశ్లేషణ',
    soilHealthScore: 'మట్టి ఆరోగ్య స్కోర్',
    shapExplain: 'SHAP వివరణ - ఈ పంట ఎందుకు?',
    quantumVsClassical: 'క్వాంటం vs క్లాసికల్ ML పోలిక',
    deficiencyPattern: 'పోషక లోప నమూనా',
    classicalEnsemble: 'క్లాసికల్ ఎన్‌సెంబుల్',
    quantumML: 'క్వాంటం ML',

    // Nutrients
    low: 'తక్కువ',
    normal: 'సాధారణం',
    high: 'ఎక్కువ',
    optimal: 'సరైన',

    // Weather
    liveWeather: 'ప్రత్యక్ష వాతావరణ డేటా',
    fetchingWeather: 'వాతావరణం పొందుతోంది...',
    live: 'ప్రత్యక్షం',
    fallback: 'ఫాల్‌బ్యాక్',

    // Models
    modelPerformance: 'మోడల్ పనితీరు పోలిక',
    accuracy: 'ఖచ్చితత్వం',
    precision: 'ప్రెసిషన్',
    recall: 'రీకాల్',
    f1Score: 'F1-స్కోర్',
    best: 'ఉత్తమం',
    quantumDetails: 'క్వాంటం ML వివరాలు',
    qubits: 'క్యూబిట్లు',
    layers: 'లేయర్లు',
    trainSamples: 'శిక్షణ నమూనాలు',
    testSamples: 'పరీక్ష నమూనాలు',
    refresh: 'రిఫ్రెష్',
    noModelData: 'మోడల్ డేటా అందుబాటులో లేదు',
    modelsNotTrained: 'మోడల్స్ ఇంకా శిక్షణ పొందలేదు.',

    // Model Names
    randomForest: 'రాండమ్ ఫారెస్ట్',
    xgboost: 'XGBoost',
    lightgbm: 'LightGBM',
    knn: 'K-సమీపం పొరుగువారు',
    stackedEnsemble: 'స్టాక్డ్ ఎన్‌సెంబుల్',
    quantumMl: 'క్వాంటం ML',

    // Dashboard
    predictWith: 'దీనితో అంచనా',
    modelDetails: 'మోడల్ వివరాలు',
    selectModel: 'దాని వ్యక్తిగత డ్యాష్‌బోర్డ్ చూడడానికి మోడల్‌ను ఎంచుకోండి',

    // Footer
    footerText: 'క్వాంటం-మెరుగైన మట్టి పోషక విశ్లేషణ & బహుళ-పంట సిఫార్సు వ్యవస్థ',
    footerSub: 'ML, క్వాంటం కంప్యూటింగ్ & SHAP ద్వారా',

    // Language
    language: 'భాష',
  },

  hi: {
    // Header
    appTitle: 'क्वांटम मिट्टी विश्लेषक',
    appSubtitle: 'AI-संचालित फसल अनुशंसा & मिट्टी विश्लेषण',
    apiConnected: 'API कनेक्ट',
    apiOffline: 'API ऑफ़लाइन',
    modelsReady: 'मॉडल तैयार',

    // Tabs
    analyzeSoil: 'मिट्टी विश्लेषण',
    results: 'परिणाम',
    modelComparison: 'मॉडल तुलना',
    modelDashboards: 'मॉडल डैशबोर्ड',
    history: 'इतिहास',

    // Auth
    login: 'लॉगिन',
    signup: 'साइन अप',
    logout: 'लॉग आउट',
    username: 'उपयोगकर्ता नाम',
    password: 'पासवर्ड',
    email: 'ईमेल',
    firstName: 'पहला नाम',
    lastName: 'अंतिम नाम',
    phone: 'फ़ोन नंबर',
    location: 'स्थान',
    dontHaveAccount: 'खाता नहीं है?',
    alreadyHaveAccount: 'पहले से खाता है?',
    welcomeBack: 'वापसी पर स्वागत, किसान!',
    createAccount: 'अपना खाता बनाएं',
    loginSubtitle: 'अपने मिट्टी विश्लेषण डैशबोर्ड तक पहुंचने के लिए साइन इन करें',
    signupSubtitle: 'बेहतर फसलों के लिए AI का उपयोग करने वाले हजारों किसानों से जुड़ें',

    // Form
    soilParams: 'मिट्टी & जलवायु पैरामीटर',
    soilParamsSubtitle: 'अपने मिट्टी परीक्षण के परिणाम और स्थानीय जलवायु डेटा दर्ज करें',
    nitrogen: 'नाइट्रोजन (N)',
    phosphorus: 'फॉस्फोरस (P)',
    potassium: 'पोटैशियम (K)',
    soilPH: 'मिट्टी pH',
    temperature: 'तापमान',
    humidity: 'आर्द्रता',
    rainfall: 'वर्षा',
    analyzePredict: 'विश्लेषण & भविष्यवाणी',
    analyzing: 'विश्लेषण हो रहा है...',
    reset: 'रीसेट',

    // Results
    recommendedCrop: 'अनुशंसित फसल',
    confidence: 'विश्वास',
    top3Crops: 'शीर्ष 3 फसल अनुशंसाएं',
    nutrientAnalysis: 'पोषक तत्व विश्लेषण',
    soilHealthScore: 'मिट्टी स्वास्थ्य स्कोर',
    shapExplain: 'SHAP व्याख्या - यह फसल क्यों?',
    quantumVsClassical: 'क्वांटम vs क्लासिकल ML तुलना',
    deficiencyPattern: 'पोषक तत्व कमी पैटर्न',
    classicalEnsemble: 'क्लासिकल एन्सेम्बल',
    quantumML: 'क्वांटम ML',

    // Nutrients
    low: 'कम',
    normal: 'सामान्य',
    high: 'अधिक',
    optimal: 'इष्टतम',

    // Weather
    liveWeather: 'लाइव मौसम डेटा',
    fetchingWeather: 'मौसम प्राप्त हो रहा है...',
    live: 'लाइव',
    fallback: 'फ़ॉलबैक',

    // Models
    modelPerformance: 'मॉडल प्रदर्शन तुलना',
    accuracy: 'सटीकता',
    precision: 'प्रिसिजन',
    recall: 'रिकॉल',
    f1Score: 'F1-स्कोर',
    best: 'सर्वश्रेष्ठ',
    quantumDetails: 'क्वांटम ML विवरण',
    qubits: 'क्यूबिट्स',
    layers: 'लेयर्स',
    trainSamples: 'प्रशिक्षण नमूने',
    testSamples: 'परीक्षण नमूने',
    refresh: 'रिफ्रेश',
    noModelData: 'कोई मॉडल डेटा उपलब्ध नहीं',
    modelsNotTrained: 'मॉडल अभी तक प्रशिक्षित नहीं हैं।',

    // Model Names
    randomForest: 'रैंडम फ़ॉरेस्ट',
    xgboost: 'XGBoost',
    lightgbm: 'LightGBM',
    knn: 'K-निकटतम पड़ोसी',
    stackedEnsemble: 'स्टैक्ड एन्सेम्बल',
    quantumMl: 'क्वांटम ML',

    // Dashboard
    predictWith: 'इसके साथ भविष्यवाणी',
    modelDetails: 'मॉडल विवरण',
    selectModel: 'उसका व्यक्तिगत डैशबोर्ड देखने के लिए एक मॉडल चुनें',

    // Footer
    footerText: 'क्वांटम-संवर्धित मिट्टी पोषक विश्लेषण & बहु-फसल अनुशंसा प्रणाली',
    footerSub: 'ML, क्वांटम कंप्यूटिंग & SHAP द्वारा संचालित',

    // Language
    language: 'भाषा',
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('quantum_soil_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('quantum_soil_lang', lang);
  }, [lang]);

  function t(key) {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default translations;
