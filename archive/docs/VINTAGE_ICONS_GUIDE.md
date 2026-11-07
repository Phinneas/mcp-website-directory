# Vintage Icons & Typography Guide

This guide shows how to use the vintage icons from react-old-icons and the Cabin/Inter font combination on your MCP directory site.

## 🎨 Typography

### Fonts Used
- **Cabin**: Headings (h1-h6) - Clean, geometric sans-serif
- **Inter**: Body text - Modern, highly readable

### Font Weights Available
- 400 (Regular)
- 500 (Medium)
- 600 (Semi-Bold)
- 700 (Bold)

## 🖼️ Vintage Icons

Icons from Windows 95/98/XP era for a distinctive retro-tech aesthetic.

### Available Icon Components

```tsx
import {
  FolderIcon,
  ComputerIcon,
  GlobeIcon,
  ToolboxIcon,
  DatabaseIcon,
  CloudIcon,
  SecurityIcon,
  SearchIcon,
  VintageIcon
} from '../components/VintageIcon';
```

### Basic Usage in Astro Files

```astro
---
import { FolderIcon } from '../components/VintageIcon';
---

<div>
  <FolderIcon client:load size={32} />
  <h2>My Heading</h2>
</div>
```

**Important**: Always add `client:load` directive when using React components in Astro!

### Available Icons

- `FolderIcon` - Win95Folder
- `ComputerIcon` - Win95Computer
- `GlobeIcon` - Win95Globe
- `ToolboxIcon` - Win95Wrench
- `DatabaseIcon` - Win95Database
- `CloudIcon` - Win95Cloud
- `SecurityIcon` - Win95Lock
- `SearchIcon` - Win95Search

### Using Custom Icons

```astro
---
import { VintageIcon } from '../components/VintageIcon';
---

<VintageIcon client:load name="Win95Notepad" size={24} />
```

### Popular Icon Names

From the react-old-icons library:

**Applications:**
- `Win95Notepad`
- `Win95Paint`
- `Win95Calculator`
- `Win95Explorer`
- `Win95MsDos`

**Files & Folders:**
- `Win95Folder`
- `Win95FolderOpen`
- `Win95File`
- `Win95TextFile`

**Network & Internet:**
- `Win95Globe`
- `Win95Network`
- `Win95Modem`

**System:**
- `Win95Computer`
- `Win95Settings`
- `Win95Control`
- `Win95Recycle`

**Tools:**
- `Win95Wrench`
- `Win95Hammer`
- `Win95Tools`

**Media:**
- `Win95Cd`
- `Win95Sound`
- `Win95Media`

**Security:**
- `Win95Lock`
- `Win95Key`
- `Win95Shield`

## 🎯 Where to Use Vintage Icons

### 1. Category Icons
Replace emoji icons in category tags with vintage icons:

```astro
---
import { DatabaseIcon, CloudIcon, ToolboxIcon } from '../components/VintageIcon';
---

<div class="category-tag">
  <DatabaseIcon client:load size={16} />
  <span>Databases</span>
</div>
```

### 2. Server Card Icons
Add icon to server cards:

```astro
<div class="server-icon">
  <ComputerIcon client:load size={32} />
</div>
```

### 3. Newsletter Icon
Replace the mailbox emoji:

```astro
---
import { VintageIcon } from '../components/VintageIcon';
---

<VintageIcon client:load name="Win95Mail" size={32} />
```

### 4. Navigation Icons
Add to navigation links:

```astro
<a href="/">
  <FolderIcon client:load size={18} />
  Shelf
</a>
```

### 5. Search Bar Icon
Replace search emoji:

```astro
<SearchIcon client:load size={20} className="search-icon" />
```

## 🎨 Styling Icons

### With Inline Styles

```astro
<FolderIcon
  client:load
  size={24}
  style={{ color: '#667eea', marginRight: '8px' }}
/>
```

### With CSS Classes

```astro
<FolderIcon client:load size={24} className="category-icon" />

<style>
  .category-icon {
    color: #667eea;
    margin-right: 0.5rem;
    vertical-align: middle;
  }
</style>
```

## 🔍 Finding More Icons

Browse all 2,300+ icons:
1. Visit: https://github.com/gsnoopy/react-old-icons
2. Check the demo site for icon previews
3. Icon names follow pattern: `Win95[Name]`, `Win98[Name]`, `WinXP[Name]`

## 💡 Usage Examples

### Example 1: Category Tag with Icon

```astro
---
import { DatabaseIcon } from '../components/VintageIcon';
---

<span class="category-tag">
  <DatabaseIcon client:load size={14} />
  <span>Databases</span>
</span>

<style>
  .category-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    font-size: 0.8rem;
    font-weight: 500;
  }
</style>
```

### Example 2: Server Card Header

```astro
---
import { ComputerIcon } from '../components/VintageIcon';
---

<div class="server-header">
  <div class="server-icon">
    <ComputerIcon client:load size={40} />
  </div>
  <div class="server-title">
    <h3>MCP Server Name</h3>
  </div>
</div>

<style>
  .server-header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .server-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
```

### Example 3: Navigation with Icons

```astro
---
import { FolderIcon, CloudIcon, ToolboxIcon } from '../components/VintageIcon';
---

<div class="nav-links">
  <a href="/" class="nav-link">
    <FolderIcon client:load size={18} />
    <span>Shelf</span>
  </a>
  <a href="/mcp-clients" class="nav-link">
    <ComputerIcon client:load size={18} />
    <span>Clients</span>
  </a>
  <a href="/claude-skills" class="nav-link">
    <ToolboxIcon client:load size={18} />
    <span>Skills</span>
  </a>
</div>

<style>
  .nav-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: white;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    transition: all 0.3s ease;
  }

  .nav-link:hover {
    background: rgba(255,255,255,0.2);
  }
</style>
```

## 🚀 Next Steps

1. Replace emoji icons with vintage icons in:
   - Category tags
   - Server cards
   - Navigation links
   - Newsletter signup
   - Search bar

2. Test the new look:
   ```bash
   npm run dev
   ```

3. Browse available icons and choose your favorites

4. Customize colors to match your purple gradient theme

## 📝 Notes

- **Performance**: Icons are small and render quickly
- **Compatibility**: Works in all modern browsers
- **Licensing**: For non-commercial/educational use (per react-old-icons)
- **Customization**: Icons inherit color from parent elements

---

**Fonts + Vintage Icons = Distinctive Retro-Modern Aesthetic** ✨
