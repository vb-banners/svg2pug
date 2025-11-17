import React from 'react';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import {
  Settings,
  HelpCircle,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useFloatingControls } from '../hooks/useFloatingControls';

export const FloatingControls: React.FC = () => {
  const tabSize = useAppStore(state => state.tabSize);
  const useSoftTabs = useAppStore(state => state.useSoftTabs);
  const enableSvgIdToClass = useAppStore(state => state.enableSvgIdToClass);
  const enableQuickCopy = useAppStore(state => state.enableQuickCopy);
  const isSvgoEnabled = useAppStore(state => state.isSvgoEnabled);
  
  const setTabSize = useAppStore(state => state.setTabSize);
  const setUseSoftTabs = useAppStore(state => state.setUseSoftTabs);
  const setEnableSvgIdToClass = useAppStore(state => state.setEnableSvgIdToClass);
  const setEnableQuickCopy = useAppStore(state => state.setEnableQuickCopy);
  const setIsSvgoEnabled = useAppStore(state => state.setIsSvgoEnabled);
  const setIsSvgoMenuOpen = useAppStore(state => state.setIsSvgoMenuOpen);
  const setIsHelpMenuOpen = useAppStore(state => state.setIsHelpMenuOpen);
  
  useFloatingControls(); // Initialize hook

  const handleSvgoSettingsClick = () => {
    setIsSvgoMenuOpen(true);
  };

  const handleHelpClick = () => {
    setIsHelpMenuOpen(true);
  };

  return (
    <div className="w-full border-b border-border flex items-center gap-4 px-6 py-3" style={{ backgroundColor: '#1E2431' }}>
      {/* Logo */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold leading-none" style={{ color: '#C5C5C5' }}>HTML to PUG</h1>
        <span className="text-[10px] px-1.5 py-0.5 bg-[#FFD173]/20 text-[#FFD173] rounded-full font-medium uppercase">Beta</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-4">

          <RadioGroup
            value={useSoftTabs ? 'spaces' : 'tabs'}
            onValueChange={(value) => setUseSoftTabs(value === 'spaces')}
            className="flex items-center gap-3"
          >
            <div className="flex items-center space-x-2" title="Use spaces for indentation">
              <RadioGroupItem value="spaces" id="spaces" />
              <Label htmlFor="spaces" className="text-sm font-normal cursor-pointer leading-one mt-[7px]" style={{ color: '#C5C5C5' }}>
                Spaces
              </Label>
            </div>
            <div className="flex items-center space-x-2" title="Use tabs for indentation">
              <RadioGroupItem value="tabs" id="tabs" />
              <Label htmlFor="tabs" className="text-sm font-normal cursor-pointer leading-one mt-[7px]" style={{ color: '#C5C5C5' }}>
                Tabs
              </Label>
            </div>
          </RadioGroup>

          <Select
            value={tabSize.toString()}
            onValueChange={(value) => setTabSize(parseInt(value, 10))}
          >
            <SelectTrigger id="tabSize" className="w-16 h-9" title="Number of spaces or tab width">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[4rem]">
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="4">4</SelectItem>
            </SelectContent>
          </Select>

          <div className="w-24" />

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2" title="Convert SVG id attributes to class attributes">
              <Switch
                id="idToClass"
                checked={enableSvgIdToClass}
                onCheckedChange={setEnableSvgIdToClass}
                aria-label="Toggle Id to Class conversion"
              />
              <Label 
                htmlFor="idToClass" 
                className="text-sm cursor-pointer leading-one mt-[7px]"
                style={{ color: '#C5C5C5' }}
              >
                Id to Class
              </Label>
            </div>

            <div className="flex items-center space-x-2" title="Automatically copy converted Pug code to clipboard">
              <Switch
                id="quickCopy"
                checked={enableQuickCopy}
                onCheckedChange={setEnableQuickCopy}
                aria-label="Toggle Quick Copy feature"
              />
              <Label 
                htmlFor="quickCopy" 
                className="text-sm cursor-pointer leading-one mt-[7px]"
                style={{ color: '#C5C5C5' }}
              >
                Quick Copy
              </Label>
            </div>
          </div>

          <div className="w-24" />

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2" title="Enable SVG optimization using SVGO">
              <Switch
                id="svgoEnabled"
                checked={isSvgoEnabled}
                onCheckedChange={setIsSvgoEnabled}
                aria-label="Toggle SVGO optimization"
              />
              <Label htmlFor="svgoEnabled" className="text-sm cursor-pointer leading-one mt-[7px]" style={{ color: '#C5C5C5' }}>
                SVGO
              </Label>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-9 whitespace-nowrap"
              style={{ color: '#C5C5C5' }}
              onClick={handleSvgoSettingsClick}
              disabled={!isSvgoEnabled}
              aria-label="Open SVGO settings"
              title="Configure SVGO optimization plugins and settings"
            >
              <Settings className="w-4 h-4 mr-2" />
              SVGO Settings
            </Button>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={handleHelpClick}
            aria-label="Show help"
            title="View keyboard shortcuts and features"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
      </div>
    </div>
  );
};
