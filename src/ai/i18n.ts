import * as vscode from 'vscode';

/**
 * Internationalization (i18n) module for providing multilingual support in the extension
 */
export class I18nManager {
  private static instance: I18nManager;
  private currentLocale: string = 'en';
  private translations: Record<string, Record<string, string>> = {};
  private fallbackLocale: string = 'en';

  // Supported locales with their display names
  private supportedLocales: Record<string, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    'zh-cn': '简体中文',
    ja: '日本語',
    ko: '한국어',
    ru: 'Русский',
    'pt-br': 'Português (Brasil)',
    id: 'Bahasa Indonesia',
  };

  private constructor() {
    this.loadTranslations();
    this.detectLocale();
  }

  /**
   * Gets the singleton instance of the I18nManager
   * @returns The I18nManager instance
   */
  public static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager();
    }
    return I18nManager.instance;
  }

  /**
   * Gets a translated string for the given key
   * @param key The translation key
   * @param params Optional parameters to replace placeholders in the translation
   * @returns The translated string
   */
  public t(key: string, params?: Record<string, string | number>): string {
    // Get the translation for the current locale
    let translation = this.getTranslation(this.currentLocale, key) || '';

    // Fallback to the default locale if not found
    if (!translation) {
      translation = this.getTranslation(this.fallbackLocale, key) || '';
    }

    // Fallback to the key itself if still not found
    if (!translation) {
      translation = key;
    }

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(
          new RegExp(`{{${param}}}`, 'g'),
          String(value)
        );
      });
    }

    return translation;
  }

  /**
   * Sets the current locale
   * @param locale The locale code to set
   * @returns Whether the locale was successfully set
   */
  public setLocale(locale: string): boolean {
    if (this.isLocaleSupported(locale)) {
      this.currentLocale = locale;
      // Save the locale preference
      vscode.workspace.getConfiguration('dauns').update('locale', locale, true);
      return true;
    }
    return false;
  }

  /**
   * Gets the current locale
   * @returns The current locale code
   */
  public getLocale(): string {
    return this.currentLocale;
  }

  /**
   * Gets the display name for the current locale
   * @returns The display name for the current locale
   */
  public getLocaleDisplayName(): string {
    return this.supportedLocales[this.currentLocale] || this.currentLocale;
  }

  /**
   * Gets all supported locales
   * @returns Map of locale codes to display names
   */
  public getSupportedLocales(): Record<string, string> {
    return { ...this.supportedLocales };
  }

  /**
   * Checks if a locale is supported
   * @param locale The locale code to check
   * @returns Whether the locale is supported
   */
  public isLocaleSupported(locale: string): boolean {
    return locale in this.supportedLocales;
  }

  /**
   * Detects the current locale based on VS Code settings or system locale
   */
  private detectLocale(): void {
    // Try to get the locale from VS Code settings
    const daunsConfig = vscode.workspace.getConfiguration('dauns');
    const configLocale = daunsConfig.get<string>('locale');

    if (configLocale && this.isLocaleSupported(configLocale)) {
      this.currentLocale = configLocale;
      return;
    }

    // Try to get the locale from VS Code
    const vscodeLocale = vscode.env.language;

    if (vscodeLocale && this.isLocaleSupported(vscodeLocale)) {
      this.currentLocale = vscodeLocale;
      return;
    }

    // Fallback to default locale
    this.currentLocale = this.fallbackLocale;
  }

  /**
   * Gets a translation for a specific locale and key
   * @param locale The locale code
   * @param key The translation key
   * @returns The translated string or undefined if not found
   */
  private getTranslation(locale: string, key: string): string | undefined {
    return this.translations[locale]?.[key];
  }

  /**
   * Loads all translations from the locales folder
   */
  private loadTranslations(): void {
    try {
      // In a real extension, this would load from actual JSON files
      // For this implementation, we'll define some translations inline
      this.translations = {
        en: {
          // General
          'extension.name': 'DAUNS - Variable Detective',
          'extension.description':
            'Detect and display all variables in your code with detailed information',

          // Commands
          'command.scanVariables': 'Scan Variables in Current File',
          'command.detectUnusedVariables': 'Detect Unused Variables',
          'command.analyzeDependencies': 'Analyze Variable Dependencies',
          'command.trackLifecycle': 'Track Variable Lifecycle',
          'command.scanWorkspace': 'Scan Variables in Workspace',
          'command.scanFolder': 'Scan Variables in Folder',
          'command.showReport': 'Show Performance Report',

          // Refactoring
          'refactoring.rename': 'Rename Variable Across Workspace',
          'refactoring.extract': 'Extract Variable',
          'refactoring.extractSmart': 'Extract Variable with Smart Naming',
          'refactoring.convert': 'Convert Variable Declaration',
          'refactoring.convertSmart': 'Convert Variable with Smart Suggestions',
          'refactoring.inline': 'Inline Variable',

          // AI Features
          'ai.analyzingCode': 'Analyzing code quality...',
          'ai.generateReport': 'Generate AI Code Quality Report',
          'ai.suggestions': 'AI Suggestions',
          'ai.qualityScore': 'Code Quality Score: {{score}}/100',

          // Team Collaboration
          'team.shareAnalysis': 'Share Analysis with Team',
          'team.exportAnalysis': 'Export Analysis',
          'team.importAnalysis': 'Import Analysis',
          'team.addComment': 'Add Comment',
          'team.resolveComment': 'Resolve Comment',
          'team.reopenComment': 'Reopen Comment',

          // UI Components
          'ui.variablesFound': '{{count}} variables found',
          'ui.loading': 'Loading...',
          'ui.noVariablesFound': 'No variables found',
          'ui.scanning': 'Scanning {{file}}...',
          'ui.refreshing': 'Refreshing...',

          // Settings
          'settings.locale': 'Language',
          'settings.fileExtensions': 'File Extensions to Scan',
          'settings.includeNodeModules': 'Include node_modules Directory',
          'settings.maxFileSize': 'Maximum File Size (KB)',

          // Messages
          'message.scanComplete': 'Scan complete: {{count}} variables found',
          'message.scanFailed': 'Scan failed: {{error}}',
          'message.exportSuccess': 'Analysis exported successfully',
          'message.exportFailed': 'Failed to export analysis: {{error}}',
          'message.importSuccess': 'Analysis imported successfully',
          'message.importFailed': 'Failed to import analysis: {{error}}',

          // Variable Types
          'type.string': 'String',
          'type.number': 'Number',
          'type.boolean': 'Boolean',
          'type.object': 'Object',
          'type.array': 'Array',
          'type.function': 'Function',
          'type.undefined': 'Undefined',
          'type.null': 'Null',
          'type.any': 'Any',

          // Errors
          'error.fileNotFound': 'File not found: {{file}}',
          'error.parsingFailed': 'Failed to parse file: {{file}}',
          'error.unsupportedFileType': 'Unsupported file type: {{file}}',
          'error.timeout': 'Operation timed out',
          'error.invalidVariable': 'Invalid variable: {{name}}',
        },

        es: {
          // General
          'extension.name': 'DAUNS - Detective de Variables',
          'extension.description':
            'Detecta y muestra todas las variables en tu código con información detallada',

          // Commands
          'command.scanVariables': 'Escanear Variables en Archivo Actual',
          'command.detectUnusedVariables': 'Detectar Variables No Utilizadas',
          'command.analyzeDependencies': 'Analizar Dependencias de Variables',
          'command.trackLifecycle': 'Seguir Ciclo de Vida de Variables',
          'command.scanWorkspace': 'Escanear Variables en Espacio de Trabajo',
          'command.scanFolder': 'Escanear Variables en Carpeta',
          'command.showReport': 'Mostrar Informe de Rendimiento',

          // Refactoring
          'refactoring.rename':
            'Renombrar Variable en Todo el Espacio de Trabajo',
          'refactoring.extract': 'Extraer Variable',
          'refactoring.extractSmart':
            'Extraer Variable con Nombres Inteligentes',
          'refactoring.convert': 'Convertir Declaración de Variable',
          'refactoring.convertSmart':
            'Convertir Variable con Sugerencias Inteligentes',
          'refactoring.inline': 'Integrar Variable',

          // AI Features
          'ai.analyzingCode': 'Analizando calidad del código...',
          'ai.generateReport': 'Generar Informe de Calidad de Código con IA',
          'ai.suggestions': 'Sugerencias de IA',
          'ai.qualityScore': 'Puntuación de Calidad del Código: {{score}}/100',

          // Team Collaboration
          'team.shareAnalysis': 'Compartir Análisis con el Equipo',
          'team.exportAnalysis': 'Exportar Análisis',
          'team.importAnalysis': 'Importar Análisis',
          'team.addComment': 'Añadir Comentario',
          'team.resolveComment': 'Resolver Comentario',
          'team.reopenComment': 'Reabrir Comentario',

          // UI Components
          'ui.variablesFound': '{{count}} variables encontradas',
          'ui.loading': 'Cargando...',
          'ui.noVariablesFound': 'No se encontraron variables',
          'ui.scanning': 'Escaneando {{file}}...',
          'ui.refreshing': 'Actualizando...',

          // Settings
          'settings.locale': 'Idioma',
          'settings.fileExtensions': 'Extensiones de Archivo para Escanear',
          'settings.includeNodeModules': 'Incluir Directorio node_modules',
          'settings.maxFileSize': 'Tamaño Máximo de Archivo (KB)',

          // Messages
          'message.scanComplete':
            'Escaneo completado: {{count}} variables encontradas',
          'message.scanFailed': 'Error de escaneo: {{error}}',
          'message.exportSuccess': 'Análisis exportado con éxito',
          'message.exportFailed': 'Error al exportar análisis: {{error}}',
          'message.importSuccess': 'Análisis importado con éxito',
          'message.importFailed': 'Error al importar análisis: {{error}}',

          // Variable Types
          'type.string': 'Cadena',
          'type.number': 'Número',
          'type.boolean': 'Booleano',
          'type.object': 'Objeto',
          'type.array': 'Arreglo',
          'type.function': 'Función',
          'type.undefined': 'Indefinido',
          'type.null': 'Nulo',
          'type.any': 'Cualquiera',

          // Errors
          'error.fileNotFound': 'Archivo no encontrado: {{file}}',
          'error.parsingFailed': 'Error al analizar archivo: {{file}}',
          'error.unsupportedFileType': 'Tipo de archivo no soportado: {{file}}',
          'error.timeout': 'Operación agotada',
          'error.invalidVariable': 'Variable inválida: {{name}}',
        },

        id: {
          // General
          'extension.name': 'DAUNS - Detektif Variabel',
          'extension.description':
            'Deteksi dan tampilkan semua variabel dalam kode Anda dengan informasi detail',

          // Commands
          'command.scanVariables': 'Pindai Variabel di File Saat Ini',
          'command.detectUnusedVariables': 'Deteksi Variabel Tidak Digunakan',
          'command.analyzeDependencies': 'Analisis Dependensi Variabel',
          'command.trackLifecycle': 'Lacak Siklus Hidup Variabel',
          'command.scanWorkspace': 'Pindai Variabel di Workspace',
          'command.scanFolder': 'Pindai Variabel di Folder',
          'command.showReport': 'Tampilkan Laporan Performa',

          // Refactoring
          'refactoring.rename': 'Ganti Nama Variabel di Seluruh Workspace',
          'refactoring.extract': 'Ekstrak Variabel',
          'refactoring.extractSmart': 'Ekstrak Variabel dengan Penamaan Cerdas',
          'refactoring.convert': 'Konversi Deklarasi Variabel',
          'refactoring.convertSmart': 'Konversi Variabel dengan Saran Cerdas',
          'refactoring.inline': 'Inline Variabel',

          // AI Features
          'ai.analyzingCode': 'Menganalisis kualitas kode...',
          'ai.generateReport': 'Hasilkan Laporan Kualitas Kode AI',
          'ai.suggestions': 'Saran AI',
          'ai.qualityScore': 'Skor Kualitas Kode: {{score}}/100',

          // Team Collaboration
          'team.shareAnalysis': 'Bagikan Analisis dengan Tim',
          'team.exportAnalysis': 'Ekspor Analisis',
          'team.importAnalysis': 'Impor Analisis',
          'team.addComment': 'Tambahkan Komentar',
          'team.resolveComment': 'Selesaikan Komentar',
          'team.reopenComment': 'Buka Kembali Komentar',

          // UI Components
          'ui.variablesFound': '{{count}} variabel ditemukan',
          'ui.loading': 'Memuat...',
          'ui.noVariablesFound': 'Tidak ada variabel ditemukan',
          'ui.scanning': 'Memindai {{file}}...',
          'ui.refreshing': 'Menyegarkan...',

          // Settings
          'settings.locale': 'Bahasa',
          'settings.fileExtensions': 'Ekstensi File untuk Dipindai',
          'settings.includeNodeModules': 'Sertakan Direktori node_modules',
          'settings.maxFileSize': 'Ukuran File Maksimum (KB)',

          // Messages
          'message.scanComplete':
            'Pemindaian selesai: {{count}} variabel ditemukan',
          'message.scanFailed': 'Pemindaian gagal: {{error}}',
          'message.exportSuccess': 'Analisis berhasil diekspor',
          'message.exportFailed': 'Gagal mengekspor analisis: {{error}}',
          'message.importSuccess': 'Analisis berhasil diimpor',
          'message.importFailed': 'Gagal mengimpor analisis: {{error}}',

          // Variable Types
          'type.string': 'String',
          'type.number': 'Angka',
          'type.boolean': 'Boolean',
          'type.object': 'Objek',
          'type.array': 'Array',
          'type.function': 'Fungsi',
          'type.undefined': 'Undefined',
          'type.null': 'Null',
          'type.any': 'Any',

          // Errors
          'error.fileNotFound': 'File tidak ditemukan: {{file}}',
          'error.parsingFailed': 'Gagal mengurai file: {{file}}',
          'error.unsupportedFileType': 'Tipe file tidak didukung: {{file}}',
          'error.timeout': 'Operasi kehabisan waktu',
          'error.invalidVariable': 'Variabel tidak valid: {{name}}',
        },
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading translations:', error);
      // Fallback to empty translations
      this.translations = {
        en: {},
      };
    }
  }
}

/**
 * Helper function to get a translated string (shorthand for getInstance().t())
 * @param key The translation key
 * @param params Optional parameters to replace placeholders in the translation
 * @returns The translated string
 */
export function t(
  key: string,
  params?: Record<string, string | number>
): string {
  return I18nManager.getInstance().t(key, params);
}
