import { jest } from '@jest/globals';
import i18n from '../../src/services/i18n.js';

describe('I18n Service', () => {
  describe('Basic Translation', () => {
    test('should return English translation by default', () => {
      const result = i18n.t('welcome');
      expect(result).toContain('Welcome to Bitsacco');
      expect(result).toContain('Africa');
    });

    test('should return Swahili translation when specified', () => {
      const result = i18n.t('welcome', 'sw');
      expect(result).toContain('Karibu Bitsacco');
      expect(result).toContain('Afrika');
    });

    test('should return French translation when specified', () => {
      const result = i18n.t('welcome', 'fr');
      expect(result).toContain('Bienvenue sur Bitsacco');
      expect(result).toContain('Afrique');
    });

    test('should fallback to English for invalid language', () => {
      const result = i18n.t('welcome', 'invalid');
      expect(result).toContain('Welcome to Bitsacco');
    });
  });

  describe('Nested Keys', () => {
    test('should handle nested translation keys', () => {
      const result = i18n.t('commands.balance', 'en');
      expect(result).toContain('balance');
    });

    test('should handle nested keys in different languages', () => {
      const swResult = i18n.t('commands.balance', 'sw');
      const frResult = i18n.t('commands.balance', 'fr');
      
      expect(swResult).not.toBe(frResult);
      expect(swResult.length).toBeGreaterThan(0);
      expect(frResult.length).toBeGreaterThan(0);
    });

    test('should return key if nested path not found', () => {
      const result = i18n.t('nonexistent.deeply.nested.key');
      expect(result).toBe('nonexistent.deeply.nested.key');
    });
  });

  describe('Interpolation', () => {
    test('should handle interpolation in translations', () => {
      // This would require adding interpolation to the translations
      // For now, test that interpolation works with example text
      const testText = 'Hello {{name}}, welcome to {{platform}}!';
      const result = i18n.interpolate(testText, { name: 'John', platform: 'Bitsacco' });
      expect(result).toBe('Hello John, welcome to Bitsacco!');
    });

    test('should leave unmatched interpolations unchanged', () => {
      const testText = 'Hello {{name}}, welcome to {{platform}}!';
      const result = i18n.interpolate(testText, { name: 'John' });
      expect(result).toBe('Hello John, welcome to {{platform}}!');
    });
  });

  describe('Language Validation', () => {
    test('should validate supported languages', () => {
      expect(i18n.isValidLanguage('en')).toBe(true);
      expect(i18n.isValidLanguage('sw')).toBe(true);
      expect(i18n.isValidLanguage('fr')).toBe(true);
      expect(i18n.isValidLanguage('invalid')).toBe(false);
    });

    test('should return available languages', () => {
      const languages = i18n.getAvailableLanguages();
      expect(languages).toHaveLength(3);
      expect(languages.map(l => l.code)).toEqual(['en', 'sw', 'fr']);
    });

    test('should return language display names', () => {
      expect(i18n.getLanguageName('en')).toBe('English');
      expect(i18n.getLanguageName('sw')).toBe('Kiswahili');
      expect(i18n.getLanguageName('fr')).toBe('Français');
    });
  });

  describe('Payment Messages', () => {
    test('should have payment-related translations in all languages', () => {
      const languages = ['en', 'sw', 'fr'];
      
      languages.forEach(lang => {
        expect(i18n.t('payments.invoice_created', lang)).toBeTruthy();
        expect(i18n.t('payments.payment_sent', lang)).toBeTruthy();
        expect(i18n.t('payments.payment_received', lang)).toBeTruthy();
        expect(i18n.t('payments.insufficient_balance', lang)).toBeTruthy();
      });
    });
  });

  describe('Education Messages', () => {
    test('should have educational content in all languages', () => {
      const languages = ['en', 'sw', 'fr'];
      
      languages.forEach(lang => {
        expect(i18n.t('education.bitcoin_basics', lang)).toBeTruthy();
        expect(i18n.t('education.lightning_benefits', lang)).toBeTruthy();
        expect(i18n.t('education.security_tips', lang)).toBeTruthy();
        expect(i18n.t('education.africa_adoption', lang)).toBeTruthy();
      });
    });
  });

  describe('Error Messages', () => {
    test('should have error messages in all languages', () => {
      const languages = ['en', 'sw', 'fr'];
      
      languages.forEach(lang => {
        expect(i18n.t('errors.general', lang)).toBeTruthy();
        expect(i18n.t('errors.network', lang)).toBeTruthy();
        expect(i18n.t('errors.invalid_command', lang)).toBeTruthy();
      });
    });
  });
});