export interface SvgoPlugin {
  [key: string]: boolean;
}

export interface SvgoSettings {
  multipass: boolean;
  floatPrecision: number;
  transformPrecision: number;
  plugins: SvgoPlugin;
}

export interface PrecisionLimits {
  min: number;
  max: number;
}

export interface SvgoPluginOption {
  id: string;
  name: string;
  enabledByDefault: boolean;
  category: 'cleanup' | 'attributes' | 'ids' | 'paths' | 'numbers' | 'structure';
  description: string;
}
