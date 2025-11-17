import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { useAppStore } from '../store/useAppStore';
import { getDefaultSvgoSettings } from '../svgo-config';

interface SvgoSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SvgoSettingsDialog: React.FC<SvgoSettingsDialogProps> = ({ isOpen, onClose }) => {
  const svgoSettings = useAppStore(state => state.svgoSettings);
  const setSvgoSettings = useAppStore(state => state.setSvgoSettings);
  const toggleSvgoPlugin = useAppStore(state => state.toggleSvgoPlugin);
  const updateSvgoPrecision = useAppStore(state => state.updateSvgoPrecision);
  const enablePugSizeVars = useAppStore(state => state.enablePugSizeVars);
  const setEnablePugSizeVars = useAppStore(state => state.setEnablePugSizeVars);

  const handlePluginToggle = (pluginName: string, enabled: boolean) => {
    toggleSvgoPlugin(pluginName, enabled);
  };

  const handleFloatPrecisionChange = (value: number[]) => {
    updateSvgoPrecision('floatPrecision', value[0]);
  };

  const handleTransformPrecisionChange = (value: number[]) => {
    updateSvgoPrecision('transformPrecision', value[0]);
  };

  const handleResetSettings = () => {
    setSvgoSettings(getDefaultSvgoSettings());
  };

  const isPluginEnabled = (pluginName: string): boolean => {
    return svgoSettings.plugins[pluginName] !== false;
  };

  const svgoPluginLabels: { [key: string]: string } = {
    cleanupAttrs: 'Cleanup attributes',
    mergeStyles: 'Merge styles',
    inlineStyles: 'Inline styles',
    removeDoctype: 'Remove doctype',
    removeXMLProcInst: 'Remove XML processing instructions',
    removeComments: 'Remove comments',
    removeMetadata: 'Remove metadata',
    removeTitle: 'Remove title',
    removeDesc: 'Remove description',
    removeUselessDefs: 'Remove useless defs',
    removeXMLNS: 'Remove xmlns attribute (for inline SVG)',
    removeEditorsNSData: 'Remove editor data',
    removeEmptyAttrs: 'Remove empty attributes',
    removeHiddenElems: 'Remove hidden elements',
    removeEmptyText: 'Remove empty text',
    removeEmptyContainers: 'Remove empty containers',
    removeScriptElement: 'Remove <script> elements',
    cleanupEnableBackground: 'Cleanup enable-background',
    minifyStyles: 'Minify styles',
    convertStyleToAttrs: 'Convert style to attributes',
    convertColors: 'Convert colors',
    convertPathData: 'Convert path data',
    convertTransform: 'Convert transform',
    removeUnknownsAndDefaults: 'Remove unknowns & defaults',
    removeNonInheritableGroupAttrs: 'Remove non-inheritable group attributes',
    removeUselessStrokeAndFill: 'Remove useless stroke & fill',
    removeViewBox: 'Remove viewBox',
    cleanupIds: 'Cleanup IDs',
    cleanupNumericValues: 'Cleanup numeric values',
    convertShapeToPath: 'Convert shapes to paths',
    moveElemsAttrsToGroup: 'Move element attributes to group',
    moveGroupAttrsToElems: 'Move group attributes to elements',
    collapseGroups: 'Collapse groups',
    removeRasterImages: 'Remove raster images',
    mergePaths: 'Merge paths',
    convertEllipseToCircle: 'Convert ellipse to circle',
    sortAttrs: 'Sort attributes',
    sortDefsChildren: 'Sort defs children',
    removeOffCanvasPaths: 'Remove off-canvas paths',
    reusePaths: 'Reuse paths',
  };

  const svgoPluginTooltips: { [key: string]: string } = {
    cleanupAttrs: 'Remove unnecessary whitespace and newlines from attributes',
    mergeStyles: 'Merge multiple style elements into one',
    inlineStyles: 'Move styles from style elements to style attributes',
    removeDoctype: 'Remove DOCTYPE declaration',
    removeXMLProcInst: 'Remove XML processing instructions like <?xml?>',
    removeComments: 'Remove comments from SVG',
    removeMetadata: 'Remove metadata tags',
    removeTitle: 'Remove title tags (used for tooltips)',
    removeDesc: 'Remove description tags',
    removeUselessDefs: 'Remove defs that are never referenced',
    removeXMLNS: 'Remove xmlns attribute (useful for inline SVG in HTML)',
    removeEditorsNSData: 'Remove editor-specific namespaces and data',
    removeEmptyAttrs: 'Remove attributes with empty values',
    removeHiddenElems: 'Remove hidden elements (display:none or visibility:hidden)',
    removeEmptyText: 'Remove empty text elements',
    removeEmptyContainers: 'Remove empty container elements',
    removeScriptElement: 'Remove script elements',
    cleanupEnableBackground: 'Remove or cleanup enable-background attribute',
    minifyStyles: 'Minify style elements and attributes',
    convertStyleToAttrs: 'Convert style attributes to SVG attributes',
    convertColors: 'Convert color values to shorter formats',
    convertPathData: 'Optimize and shorten path data',
    convertTransform: 'Optimize transform attributes',
    removeUnknownsAndDefaults: 'Remove unknown elements and attributes with default values',
    removeNonInheritableGroupAttrs: 'Remove non-inheritable group attributes',
    removeUselessStrokeAndFill: 'Remove stroke and fill when they have no effect',
    removeViewBox: 'Remove viewBox attribute when possible',
    cleanupIds: 'Remove unused IDs and minify used IDs',
    cleanupNumericValues: 'Round numeric values to reduce precision',
    convertShapeToPath: 'Convert basic shapes to paths',
    moveElemsAttrsToGroup: 'Move common attributes from elements to parent group',
    moveGroupAttrsToElems: 'Move group attributes to child elements',
    collapseGroups: 'Collapse useless groups',
    removeRasterImages: 'Remove raster images',
    mergePaths: 'Merge multiple paths into one',
    convertEllipseToCircle: 'Convert ellipse to circle when possible',
    sortAttrs: 'Sort attributes for better compression',
    sortDefsChildren: 'Sort children of defs element',
    removeOffCanvasPaths: 'Remove paths that are outside the canvas',
    reusePaths: 'Find and reuse duplicate paths',
  };

  // Plugin categories
  const cleanupPlugins = [
    'cleanupAttrs', 'mergeStyles', 'inlineStyles', 'removeDoctype', 'removeXMLProcInst',
    'removeComments', 'removeMetadata', 'removeTitle', 'removeDesc', 'removeUselessDefs',
    'removeXMLNS', 'removeEditorsNSData', 'removeEmptyAttrs', 'removeHiddenElems',
    'removeEmptyText', 'removeEmptyContainers', 'removeScriptElement'
  ];

  const attributePlugins = [
    'cleanupEnableBackground', 'minifyStyles', 'convertStyleToAttrs', 'convertColors',
    'convertPathData', 'convertTransform', 'removeUnknownsAndDefaults', 'removeNonInheritableGroupAttrs',
    'removeUselessStrokeAndFill', 'removeViewBox', 'cleanupIds', 'cleanupNumericValues',
    'convertShapeToPath', 'moveElemsAttrsToGroup', 'moveGroupAttrsToElems', 'collapseGroups',
    'removeRasterImages', 'mergePaths', 'convertEllipseToCircle', 'sortAttrs', 'sortDefsChildren'
  ];

  const structurePlugins = [
    'removeOffCanvasPaths', 'reusePaths'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">SVGO Settings</DialogTitle>
          <DialogDescription>Configure SVG optimization plugins and precision</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Global Settings */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Global</h3>
            <div className="flex items-center space-x-[15px]" title="Extract width and height as Pug variables">
              <Switch
                id="sizeVars"
                checked={enablePugSizeVars}
                onCheckedChange={setEnablePugSizeVars}
                aria-label="Toggle Size Variables"
              />
              <Label
                htmlFor="sizeVars"
                className="text-sm font-normal cursor-pointer"
                style={{ color: '#C5C5C5', marginTop: '6px' }}
              >
                Size Vars
              </Label>
            </div>
          </section>

          {/* Precision Controls */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Precision</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="floatPrecision" className="text-sm" style={{ color: '#C5C5C5' }} title="Number of decimal places for floating point values">
                  Float Precision: {svgoSettings.floatPrecision}
                </Label>
              </div>
              <Slider
                id="floatPrecision"
                min={0}
                max={10}
                step={1}
                value={[svgoSettings.floatPrecision]}
                onValueChange={handleFloatPrecisionChange}
                className="w-full"
                aria-label="Float precision"
                title="Number of decimal places for floating point values"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="transformPrecision" className="text-sm" style={{ color: '#C5C5C5' }} title="Number of decimal places for transformation matrices">
                  Transform Precision: {svgoSettings.transformPrecision}
                </Label>
              </div>
              <Slider
                id="transformPrecision"
                min={0}
                max={10}
                step={1}
                value={[svgoSettings.transformPrecision]}
                onValueChange={handleTransformPrecisionChange}
                className="w-full"
                aria-label="Transform precision"
                title="Number of decimal places for transformation matrices"
              />
            </div>
          </section>

          {/* Cleanup Plugins */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Cleanup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cleanupPlugins.map(pluginName => (
                <div key={pluginName} className="flex items-center space-x-[15px]" title={svgoPluginTooltips[pluginName] || ''}>
                  <Switch
                    id={pluginName}
                    checked={isPluginEnabled(pluginName)}
                    onCheckedChange={(checked) => handlePluginToggle(pluginName, checked)}
                    aria-label={`Toggle ${pluginName}`}
                  />
                  <Label
                    htmlFor={pluginName}
                    className="text-sm font-normal cursor-pointer"
                    style={{ color: '#C5C5C5', marginTop: '6px' }}
                  >
                    {svgoPluginLabels[pluginName] || pluginName}
                  </Label>
                </div>
              ))}
            </div>
          </section>

          {/* Attribute Plugins */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Attributes & Transformations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {attributePlugins.map(pluginName => (
                <div key={pluginName} className="flex items-center space-x-[15px]" title={svgoPluginTooltips[pluginName] || ''}>
                  <Switch
                    id={pluginName}
                    checked={isPluginEnabled(pluginName)}
                    onCheckedChange={(checked) => handlePluginToggle(pluginName, checked)}
                    aria-label={`Toggle ${pluginName}`}
                  />
                  <Label
                    htmlFor={pluginName}
                    className="text-sm font-normal cursor-pointer"
                    style={{ color: '#C5C5C5', marginTop: '6px' }}
                  >
                    {svgoPluginLabels[pluginName] || pluginName}
                  </Label>
                </div>
              ))}
            </div>
          </section>

          {/* Structure Plugins */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Structure</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {structurePlugins.map(pluginName => (
                <div key={pluginName} className="flex items-center space-x-[15px]" title={svgoPluginTooltips[pluginName] || ''}>
                  <Switch
                    id={pluginName}
                    checked={isPluginEnabled(pluginName)}
                    onCheckedChange={(checked) => handlePluginToggle(pluginName, checked)}
                    aria-label={`Toggle ${pluginName}`}
                  />
                  <Label
                    htmlFor={pluginName}
                    className="text-sm font-normal cursor-pointer"
                    style={{ color: '#C5C5C5', marginTop: '6px' }}
                  >
                    {svgoPluginLabels[pluginName] || pluginName}
                  </Label>
                </div>
              ))}
            </div>
          </section>

          {/* Reset Button */}
          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={handleResetSettings}
              style={{ color: '#C5C5C5' }}
              aria-label="Reset SVGO settings to defaults"
              title="Reset all SVGO settings to their default values"
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
