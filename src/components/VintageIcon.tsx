import React from 'react';
import * as OldIcons from 'react-old-icons';

interface VintageIconProps {
  name: keyof typeof OldIcons;
  size?: number;
  className?: string;
}

export const VintageIcon: React.FC<VintageIconProps> = ({ name, size = 24, className = '' }) => {
  const IconComponent = OldIcons[name] as React.ComponentType<{ size?: number; className?: string }>;

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in react-old-icons`);
    return null;
  }

  return <IconComponent size={size} className={className} />;
};

// Export some commonly used icons for easy access
export const FolderIcon = (props: Omit<VintageIconProps, 'name'>) =>
  <VintageIcon name="WindowsFolder" {...props} />;

export const ComputerIcon = (props: Omit<VintageIconProps, 'name'>) =>
  <VintageIcon name="Windows95MyComputer" {...props} />;

export const GlobeIcon = (props: Omit<VintageIconProps, 'name'>) =>
  <VintageIcon name="NetscapeGlobe" {...props} />;

export const ToolboxIcon = (props: Omit<VintageIconProps, 'name'>) =>
  <VintageIcon name="VisualStudioWRENCH" {...props} />;

export const DatabaseIcon = (props: Omit<VintageIconProps, 'name'>) =>
  <VintageIcon name="VisualStudioGraph" {...props} />;

export const CloudIcon = (props: Omit<VintageIconProps, 'name'>) =>
  <VintageIcon name="VisualStudioCloud" {...props} />;

export const SecurityIcon = (props: Omit<VintageIconProps, 'name'>) =>
  <VintageIcon name="SecurityEssentials" {...props} />;

export const SearchIcon = (props: Omit<VintageIconProps, 'name'>) =>
  <VintageIcon name="Windows95SavedSearch" {...props} />;

export const HelpIcon = (props: Omit<VintageIconProps, 'name'>) =>
  <VintageIcon name="Windows95Help" {...props} />;
