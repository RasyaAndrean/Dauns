import * as vscode from 'vscode';

/**
 * Interface for variable analysis configuration
 */
export interface VariableAnalysisConfig {
  variableUsageTrackingEnabled: boolean;
  scopeAnalysisEnabled: boolean;
  refactoringSuggestionsEnabled: boolean;
  minimapVisualizationEnabled: boolean;
  showVariableTypeColors: boolean;
  showUnusedVariableIndicators: boolean;
  showShadowedVariableIndicators: boolean;
  variableTreeGrouping: 'none' | 'type' | 'scope' | 'file';
  variableTreeFiltering: 'all' | 'unused' | 'shadowed' | 'global';
}

/**
 * Configuration manager for variable analysis settings
 */
export class VariableAnalysisConfigManager {
  private static instance: VariableAnalysisConfigManager;
  private config: VariableAnalysisConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.watchConfigChanges();
  }

  /**
   * Gets the singleton instance of the configuration manager
   * @returns The configuration manager instance
   */
  static getInstance(): VariableAnalysisConfigManager {
    if (!VariableAnalysisConfigManager.instance) {
      VariableAnalysisConfigManager.instance =
        new VariableAnalysisConfigManager();
    }
    return VariableAnalysisConfigManager.instance;
  }

  /**
   * Loads the current configuration from VS Code settings
   * @returns The current configuration
   */
  private loadConfig(): VariableAnalysisConfig {
    const config = vscode.workspace.getConfiguration('dauns');

    return {
      variableUsageTrackingEnabled: config.get<boolean>(
        'variableUsageTrackingEnabled',
        true
      ),
      scopeAnalysisEnabled: config.get<boolean>('scopeAnalysisEnabled', true),
      refactoringSuggestionsEnabled: config.get<boolean>(
        'refactoringSuggestionsEnabled',
        true
      ),
      minimapVisualizationEnabled: config.get<boolean>(
        'minimapVisualizationEnabled',
        true
      ),
      showVariableTypeColors: config.get<boolean>(
        'showVariableTypeColors',
        true
      ),
      showUnusedVariableIndicators: config.get<boolean>(
        'showUnusedVariableIndicators',
        true
      ),
      showShadowedVariableIndicators: config.get<boolean>(
        'showShadowedVariableIndicators',
        true
      ),
      variableTreeGrouping: config.get<'none' | 'type' | 'scope' | 'file'>(
        'variableTreeGrouping',
        'none'
      ),
      variableTreeFiltering: config.get<
        'all' | 'unused' | 'shadowed' | 'global'
      >('variableTreeFiltering', 'all'),
    };
  }

  /**
   * Watches for configuration changes and updates the config accordingly
   */
  private watchConfigChanges(): void {
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('dauns')) {
        this.config = this.loadConfig();
      }
    });
  }

  /**
   * Gets the current configuration
   * @returns The current configuration
   */
  getConfig(): VariableAnalysisConfig {
    return { ...this.config };
  }

  /**
   * Updates a specific configuration value
   * @param key The configuration key to update
   * @param value The new value
   */
  async updateConfig<K extends keyof VariableAnalysisConfig>(
    key: K,
    value: VariableAnalysisConfig[K]
  ): Promise<void> {
    await vscode.workspace
      .getConfiguration('dauns')
      .update(key, value, vscode.ConfigurationTarget.Global);

    // Update our local copy
    this.config = this.loadConfig();
  }

  /**
   * Checks if variable usage tracking is enabled
   * @returns True if enabled
   */
  isVariableUsageTrackingEnabled(): boolean {
    return this.config.variableUsageTrackingEnabled;
  }

  /**
   * Checks if scope analysis is enabled
   * @returns True if enabled
   */
  isScopeAnalysisEnabled(): boolean {
    return this.config.scopeAnalysisEnabled;
  }

  /**
   * Checks if refactoring suggestions are enabled
   * @returns True if enabled
   */
  isRefactoringSuggestionsEnabled(): boolean {
    return this.config.refactoringSuggestionsEnabled;
  }

  /**
   * Checks if minimap visualization is enabled
   * @returns True if enabled
   */
  isMinimapVisualizationEnabled(): boolean {
    return this.config.minimapVisualizationEnabled;
  }

  /**
   * Checks if variable type colors should be shown
   * @returns True if enabled
   */
  showVariableTypeColors(): boolean {
    return this.config.showVariableTypeColors;
  }

  /**
   * Checks if unused variable indicators should be shown
   * @returns True if enabled
   */
  showUnusedVariableIndicators(): boolean {
    return this.config.showUnusedVariableIndicators;
  }

  /**
   * Checks if shadowed variable indicators should be shown
   * @returns True if enabled
   */
  showShadowedVariableIndicators(): boolean {
    return this.config.showShadowedVariableIndicators;
  }

  /**
   * Gets the variable tree grouping setting
   * @returns The grouping setting
   */
  getVariableTreeGrouping(): 'none' | 'type' | 'scope' | 'file' {
    return this.config.variableTreeGrouping;
  }

  /**
   * Gets the variable tree filtering setting
   * @returns The filtering setting
   */
  getVariableTreeFiltering(): 'all' | 'unused' | 'shadowed' | 'global' {
    return this.config.variableTreeFiltering;
  }

  /**
   * Shows a configuration panel for users to customize settings
   */
  async showConfigurationPanel(): Promise<void> {
    const config = this.getConfig();

    const options = [
      {
        label: 'Variable Usage Tracking',
        description: config.variableUsageTrackingEnabled
          ? 'Enabled'
          : 'Disabled',
        value: 'variableUsageTrackingEnabled',
      },
      {
        label: 'Scope Analysis',
        description: config.scopeAnalysisEnabled ? 'Enabled' : 'Disabled',
        value: 'scopeAnalysisEnabled',
      },
      {
        label: 'Refactoring Suggestions',
        description: config.refactoringSuggestionsEnabled
          ? 'Enabled'
          : 'Disabled',
        value: 'refactoringSuggestionsEnabled',
      },
      {
        label: 'Minimap Visualization',
        description: config.minimapVisualizationEnabled
          ? 'Enabled'
          : 'Disabled',
        value: 'minimapVisualizationEnabled',
      },
      {
        label: 'Variable Type Colors',
        description: config.showVariableTypeColors ? 'Enabled' : 'Disabled',
        value: 'showVariableTypeColors',
      },
      {
        label: 'Unused Variable Indicators',
        description: config.showUnusedVariableIndicators
          ? 'Enabled'
          : 'Disabled',
        value: 'showUnusedVariableIndicators',
      },
      {
        label: 'Shadowed Variable Indicators',
        description: config.showShadowedVariableIndicators
          ? 'Enabled'
          : 'Disabled',
        value: 'showShadowedVariableIndicators',
      },
      {
        label: 'Tree View Grouping',
        description: config.variableTreeGrouping,
        value: 'variableTreeGrouping',
      },
      {
        label: 'Tree View Filtering',
        description: config.variableTreeFiltering,
        value: 'variableTreeFiltering',
      },
    ];

    const selected = await vscode.window.showQuickPick(options, {
      placeHolder: 'Select a setting to configure',
    });

    if (selected) {
      await this.configureSetting(
        selected.value as keyof VariableAnalysisConfig
      );
    }
  }

  /**
   * Configures a specific setting
   * @param key The setting key to configure
   */
  private async configureSetting(
    key: keyof VariableAnalysisConfig
  ): Promise<void> {
    switch (key) {
      case 'variableUsageTrackingEnabled':
      case 'scopeAnalysisEnabled':
      case 'refactoringSuggestionsEnabled':
      case 'minimapVisualizationEnabled':
      case 'showVariableTypeColors':
      case 'showUnusedVariableIndicators':
      case 'showShadowedVariableIndicators':
        {
          const newValue = await vscode.window.showQuickPick(
            [
              { label: 'Enable', value: true },
              { label: 'Disable', value: false },
            ],
            {
              placeHolder: `Configure ${key}`,
            }
          );

          if (newValue) {
            await this.updateConfig(key, newValue.value);
            vscode.window.showInformationMessage(
              `Updated ${key} to ${newValue.value ? 'enabled' : 'disabled'}`
            );
          }
        }
        break;

      case 'variableTreeGrouping':
        {
          const groupingValue = await vscode.window.showQuickPick(
            [
              { label: 'None', value: 'none' },
              { label: 'Type', value: 'type' },
              { label: 'Scope', value: 'scope' },
              { label: 'File', value: 'file' },
            ],
            {
              placeHolder: 'Select tree view grouping',
            }
          );

          if (groupingValue) {
            await this.updateConfig(
              key,
              groupingValue.value as 'none' | 'type' | 'scope' | 'file'
            );
            vscode.window.showInformationMessage(
              `Updated tree view grouping to ${groupingValue.value}`
            );
          }
        }
        break;

      case 'variableTreeFiltering':
        {
          const filteringValue = await vscode.window.showQuickPick(
            [
              { label: 'All Variables', value: 'all' },
              { label: 'Unused Variables', value: 'unused' },
              { label: 'Shadowed Variables', value: 'shadowed' },
              { label: 'Global Variables', value: 'global' },
            ],
            {
              placeHolder: 'Select tree view filtering',
            }
          );

          if (filteringValue) {
            await this.updateConfig(
              key,
              filteringValue.value as 'all' | 'unused' | 'shadowed' | 'global'
            );
            vscode.window.showInformationMessage(
              `Updated tree view filtering to ${filteringValue.value}`
            );
          }
        }
        break;
    }
  }
}
