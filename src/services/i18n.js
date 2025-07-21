import config from '../config/index.js';

// Translations for different languages
const translations = {
  en: {
    // Common phrases
    welcome: "Welcome to Bitsacco! 🚀 Your gateway to Bitcoin and Lightning payments in Africa.",
    help: "Here are the available commands:",
    balance: "Balance",
    send: "Send",
    receive: "Receive",
    history: "Transaction History",
    settings: "Settings",
    support: "Support",
    
    // Commands
    commands: {
      start: "Start using Bitsacco",
      help: "Get help and see available commands",
      balance: "Check your Bitcoin balance",
      send: "Send Bitcoin/Lightning payments",
      receive: "Generate payment request",
      history: "View transaction history",
      settings: "Configure your preferences",
      language: "Change language",
      support: "Contact support team"
    },
    
    // Payments
    payments: {
      invoice_created: "⚡ Lightning invoice created!",
      payment_sent: "✅ Payment sent successfully!",
      payment_received: "💰 Payment received!",
      insufficient_balance: "❌ Insufficient balance",
      invalid_amount: "❌ Invalid amount",
      payment_failed: "❌ Payment failed",
      generating_qr: "Generating QR code...",
      scan_qr: "Scan this QR code to pay:",
      amount_required: "Please specify an amount"
    },
    
    // Educational content
    education: {
      bitcoin_basics: "Bitcoin is a decentralized digital currency that enables peer-to-peer payments without intermediaries.",
      lightning_benefits: "Lightning Network enables instant, low-cost Bitcoin transactions perfect for daily use.",
      security_tips: "🔒 Security Tips:\n• Never share your private keys\n• Use strong passwords\n• Enable 2FA when available",
      africa_adoption: "Bitcoin is growing rapidly across Africa, providing financial inclusion for the unbanked."
    },
    
    // Error messages
    errors: {
      general: "Something went wrong. Please try again.",
      network: "Network error. Please check your connection.",
      invalid_command: "Invalid command. Type /help for available commands.",
      maintenance: "System under maintenance. Please try again later."
    }
  },
  
  sw: { // Swahili
    welcome: "Karibu Bitsacco! 🚀 Mlango wako wa malipo ya Bitcoin na Lightning barani Afrika.",
    help: "Hizi ni amri zinazopatikana:",
    balance: "Salio",
    send: "Tuma",
    receive: "Pokea",
    history: "Historia ya Miamala",
    settings: "Mipangilio",
    support: "Msaada",
    
    commands: {
      start: "Anza kutumia Bitsacco",
      help: "Pata msaada na uone amri zinazopatikana",
      balance: "Angalia salio lako la Bitcoin",
      send: "Tuma malipo ya Bitcoin/Lightning",
      receive: "Tengeneza ombi la malipo",
      history: "Ona historia ya miamala",
      settings: "Sanidi mapendeleo yako",
      language: "Badilisha lugha",
      support: "Wasiliana na timu ya msaada"
    },
    
    payments: {
      invoice_created: "⚡ Bili ya Lightning imeundwa!",
      payment_sent: "✅ Malipo yametumwa kwa mafanikio!",
      payment_received: "💰 Malipo yamepokelewa!",
      insufficient_balance: "❌ Salio haitoshi",
      invalid_amount: "❌ Kiasi si sahihi",
      payment_failed: "❌ Malipo yameshindwa",
      generating_qr: "Kuzalisha msimbo wa QR...",
      scan_qr: "Changanua msimbo huu wa QR kulipa:",
      amount_required: "Tafadhali bainisha kiasi"
    },
    
    education: {
      bitcoin_basics: "Bitcoin ni sarafu ya kidijitali isiyodhibitiwa na idara moja inayowezesha malipo ya mtu kwa mtu bila mtu wa kati.",
      lightning_benefits: "Mtandao wa Lightning unawezesha miamala ya Bitcoin ya papo hapo na gharama ndogo inayofaa matumizi ya kila siku.",
      security_tips: "🔒 Vidokezo vya Usalama:\n• Usishiriki funguo zako za kibinafsi\n• Tumia manenosiri imara\n• Wezesha 2FA inapokuwa inapatikana",
      africa_adoption: "Bitcoin inakua haraka kote Afrika, ikitoa ujumuishaji wa kifedha kwa wasiofungua akaunti za benki."
    },
    
    errors: {
      general: "Kuna kitu hakijaenda sawa. Tafadhali jaribu tena.",
      network: "Kosa la mtandao. Tafadhali angalia muunganisho wako.",
      invalid_command: "Amri si sahihi. Andika /help kuona amri zinazopatikana.",
      maintenance: "Mfumo unakarabatiwa. Tafadhali jaribu tena baadaye."
    }
  },
  
  fr: { // French
    welcome: "Bienvenue sur Bitsacco ! 🚀 Votre passerelle vers les paiements Bitcoin et Lightning en Afrique.",
    help: "Voici les commandes disponibles :",
    balance: "Solde",
    send: "Envoyer",
    receive: "Recevoir",
    history: "Historique des Transactions",
    settings: "Paramètres",
    support: "Support",
    
    commands: {
      start: "Commencer à utiliser Bitsacco",
      help: "Obtenir de l'aide et voir les commandes disponibles",
      balance: "Vérifier votre solde Bitcoin",
      send: "Envoyer des paiements Bitcoin/Lightning",
      receive: "Générer une demande de paiement",
      history: "Voir l'historique des transactions",
      settings: "Configurer vos préférences",
      language: "Changer de langue",
      support: "Contacter l'équipe de support"
    },
    
    payments: {
      invoice_created: "⚡ Facture Lightning créée !",
      payment_sent: "✅ Paiement envoyé avec succès !",
      payment_received: "💰 Paiement reçu !",
      insufficient_balance: "❌ Solde insuffisant",
      invalid_amount: "❌ Montant invalide",
      payment_failed: "❌ Échec du paiement",
      generating_qr: "Génération du code QR...",
      scan_qr: "Scannez ce code QR pour payer :",
      amount_required: "Veuillez spécifier un montant"
    },
    
    education: {
      bitcoin_basics: "Bitcoin est une monnaie numérique décentralisée qui permet les paiements de pair à pair sans intermédiaires.",
      lightning_benefits: "Le réseau Lightning permet des transactions Bitcoin instantanées et à faible coût, parfaites pour un usage quotidien.",
      security_tips: "🔒 Conseils de Sécurité :\n• Ne partagez jamais vos clés privées\n• Utilisez des mots de passe forts\n• Activez la 2FA quand disponible",
      africa_adoption: "Bitcoin croît rapidement en Afrique, offrant l'inclusion financière aux non-bancarisés."
    },
    
    errors: {
      general: "Quelque chose s'est mal passé. Veuillez réessayer.",
      network: "Erreur réseau. Veuillez vérifier votre connexion.",
      invalid_command: "Commande invalide. Tapez /help pour les commandes disponibles.",
      maintenance: "Système en maintenance. Veuillez réessayer plus tard."
    }
  }
};

class I18nService {
  constructor() {
    this.defaultLanguage = config.i18n.defaultLanguage;
    this.supportedLanguages = config.i18n.supportedLanguages;
  }

  // Get translation for a key in specified language
  t(key, language = this.defaultLanguage, interpolations = {}) {
    const lang = this.supportedLanguages.includes(language) ? language : this.defaultLanguage;
    
    // Navigate nested keys (e.g., "payments.invoice_created")
    const keys = key.split('.');
    let translation = translations[lang];
    
    for (const k of keys) {
      if (translation && typeof translation === 'object' && translation[k]) {
        translation = translation[k];
      } else {
        // Fallback to English if translation not found
        translation = this.getNestedValue(translations[this.defaultLanguage], key);
        break;
      }
    }
    
    // If still no translation found, return the key
    if (typeof translation !== 'string') {
      return key;
    }
    
    // Replace interpolations
    return this.interpolate(translation, interpolations);
  }

  // Get nested value from object using dot notation
  getNestedValue(obj, key) {
    const keys = key.split('.');
    let result = obj;
    
    for (const k of keys) {
      if (result && typeof result === 'object' && result[k]) {
        result = result[k];
      } else {
        return key; // Return key if not found
      }
    }
    
    return result;
  }

  // Replace placeholders in translation strings
  interpolate(text, interpolations) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return interpolations[key] || match;
    });
  }

  // Get available languages
  getAvailableLanguages() {
    return this.supportedLanguages.map(lang => ({
      code: lang,
      name: this.getLanguageName(lang)
    }));
  }

  // Get language display name
  getLanguageName(code) {
    const names = {
      en: 'English',
      sw: 'Kiswahili',
      fr: 'Français'
    };
    return names[code] || code;
  }

  // Validate language code
  isValidLanguage(language) {
    return this.supportedLanguages.includes(language);
  }
}

export default new I18nService();