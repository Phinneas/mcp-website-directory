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
  <VintageIcon name="Win95Folder" {...props} />;

export const ComputerIcon = (props: Omit<VintageIconProps, 'name'>) =>
  <VintageIcon name="Win95Computer" {...props} />;

export const GlobeIcon = (props: Omit<VintageIconProps, 'name'>) =>
  <VintageIcon name="Win95Globe" {...props} />;

export const ToolboxIcon = (props: Omit<VintageIconProps, 'name'>) =>
  <VintageIcon name="Win95Wrench" {...props} />;

export const DatabaseIcon = (props: Omit<VintageIconProps, 'name'>) =>
  <VintageIcon name="Win95Database" {...props} />;

export const CloudIcon = (props: Omit<VintageIconProps, 'name'>) =>
  <VintageIcon name="Win95Cloud" {...props} />;

export const SecurityIcon = (props: Omit<VintageIconProps, 'name'>) =>
  <VintageIcon name="Win95Lock" {...props} />;

export const SearchIcon = (props: Omit<VintageIconProps, 'name'>) =>
  <VintageIcon name="Win95Search" {...props} />;
