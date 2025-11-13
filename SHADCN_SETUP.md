# shadcn/ui + Amethyst Haze Theme Setup Guide

Complete integration of shadcn/ui with Amethyst Haze theme, Cabin/Inter fonts, and vintage icons.

## ✨ What's Included

- **shadcn/ui**: Beautiful, accessible React components
- **Amethyst Haze Theme**: Purple/amethyst color scheme (light & dark modes)
- **Cabin Font**: Headings (preserved from earlier setup)
- **Inter Font**: Body text (preserved from earlier setup)
- **Vintage Icons**: Windows 95/98/XP icons (works alongside shadcn)
- **Tailwind CSS v4**: Latest styling framework

## 🎨 Amethyst Haze Theme Colors

### Light Mode
- **Primary**: #8B7DD8 (Amethyst purple)
- **Background**: White
- **Cards**: Light purple tint
- **Accents**: Soft purple shades

### Dark Mode
- **Primary**: #8B7DD8 (Same amethyst)
- **Background**: Deep purple-black
- **Cards**: Dark purple-gray
- **Accents**: Darker purple tones

## 📦 Installed Packages

```json
{
  "tailwindcss": "^4.1.17",
  "@tailwindcss/vite": "^4.1.17",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.4.0",
  "lucide-react": "^0.553.0"
}
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── ui/
│   │   └── button.tsx          # Example shadcn component
│   ├── VintageIcon.tsx          # Vintage icons (preserved)
│   ├── EmailSignup.astro        # Newsletter (preserved)
│   └── HeaderNewsletter.astro   # Header newsletter (preserved)
├── lib/
│   └── utils.ts                 # cn() utility for class merging
├── styles/
│   └── global.css               # Amethyst Haze theme + Tailwind
└── pages/
    └── index.astro              # Homepage

components.json                   # shadcn configuration
tsconfig.json                     # TypeScript config with @ aliases
```

## 🚀 Using shadcn Components

### 1. Import Global Styles

Add to your layout or page:

```astro
---
import '../styles/global.css';
---
```

### 2. Use the Button Component

```astro
---
import { Button } from '../components/ui/button';
import '../styles/global.css';
---

<Button client:load variant="default" size="lg">
  Subscribe Now
</Button>

<Button client:load variant="outline">
  Learn More
</Button>

<Button client:load variant="ghost">
  Cancel
</Button>
```

**Important**: Always add `client:load` for React components in Astro!

### 3. Button Variants

- `default` - Amethyst purple background
- `destructive` - Red for dangerous actions
- `outline` - Border with transparent background
- `secondary` - Light purple background
- `ghost` - Transparent, hover effect
- `link` - Text link style

### 4. Button Sizes

- `default` - Standard height
- `sm` - Small
- `lg` - Large
- `icon` - Square for icon-only buttons

## 🔧 Adding More shadcn Components

### Install a Component

```bash
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
```

### Available Components

Browse all at: https://ui.shadcn.com/docs/components

Popular ones:
- **Card** - Content containers
- **Input** - Form inputs
- **Dialog** - Modals/popups
- **Dropdown Menu** - Context menus
- **Tabs** - Tabbed interfaces
- **Badge** - Status indicators
- **Alert** - Notifications
- **Select** - Dropdowns
- **Checkbox** - Checkboxes
- **Radio Group** - Radio buttons

## 🎨 Combining with Vintage Icons

You can use both shadcn and vintage icons together:

```astro
---
import { Button } from '../components/ui/button';
import { FolderIcon } from '../components/VintageIcon';
import '../styles/global.css';
---

<Button client:load variant="default" size="lg">
  <FolderIcon client:load size={20} />
  <span>Open Folder</span>
</Button>
```

## 📝 Custom Component Example

### Newsletter Button with shadcn

```astro
---
import { Button } from '../components/ui/button';
import { VintageIcon } from '../components/VintageIcon';
import '../styles/global.css';
---

<div class="flex gap-4 items-center">
  <VintageIcon client:load name="Win95Mail" size={32} />
  <div class="flex flex-col gap-2">
    <h3 class="text-xl font-semibold">Stay Updated</h3>
    <p class="text-muted-foreground">Get weekly MCP updates</p>
  </div>
  <Button client:load variant="default">
    Subscribe
  </Button>
</div>
```

## 🎯 Tailwind Classes with Amethyst Theme

### Background Colors
```tsx
<div className="bg-background">      // White (light) / Dark purple (dark)
<div className="bg-card">            // Light purple tint
<div className="bg-primary">         // Amethyst purple
<div className="bg-secondary">       // Light purple accent
```

### Text Colors
```tsx
<p className="text-foreground">      // Main text color
<p className="text-muted-foreground"> // Muted text
<p className="text-primary">          // Amethyst purple
```

### Borders
```tsx
<div className="border border-border">  // Theme border color
<div className="ring-2 ring-ring">      // Focus ring (amethyst)
```

## 🌓 Dark Mode Toggle

Your existing dark mode toggle works! Just add the `dark` class to `<html>`:

```javascript
// Existing dark mode code in your pages
themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  // Save preference
  localStorage.setItem('theme',
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
});
```

## 🎨 Customizing Colors

Edit `src/styles/global.css`:

```css
:root {
  --primary: 269 58% 66%; /* Change this for different primary color */
  --secondary: 280 35% 88%;
  /* etc... */
}
```

Use HSL format: `hue saturation% lightness%`

## 🔍 Example: Server Card with shadcn

```astro
---
import { Button } from '../components/ui/button';
import { ComputerIcon } from '../components/VintageIcon';
import '../styles/global.css';
---

<div class="bg-card rounded-lg p-6 border border-border hover:shadow-lg transition-shadow">
  <div class="flex items-start gap-4">
    <ComputerIcon client:load size={48} />
    <div class="flex-1">
      <h3 class="text-xl font-semibold mb-2">MCP Server Name</h3>
      <p class="text-muted-foreground mb-4">
        Description of the MCP server goes here...
      </p>
      <div class="flex gap-2">
        <Button client:load variant="default" size="sm">
          View Details
        </Button>
        <Button client:load variant="outline" size="sm">
          GitHub
        </Button>
      </div>
    </div>
  </div>
</div>
```

## 🎨 Newsletter Signup with shadcn

Replace your current newsletter with shadcn components:

```astro
---
import { Button } from '../components/ui/button';
import '../styles/global.css';
---

<div class="bg-card rounded-xl p-8 border border-border">
  <h3 class="text-2xl font-bold mb-2">📬 Stay Updated on MCP</h3>
  <p class="text-muted-foreground mb-4">
    Get weekly updates on new MCP servers and guides.
  </p>
  <form class="flex gap-2">
    <input
      type="email"
      placeholder="your@email.com"
      class="flex-1 px-4 py-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-ring focus:outline-none"
    />
    <Button client:load type="submit" variant="default">
      Subscribe
    </Button>
  </form>
</div>
```

## 📚 Resources

- **shadcn/ui Docs**: https://ui.shadcn.com
- **Tailwind CSS v4**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev
- **Amethyst Haze**: Purple-focused theme for elegant UIs

## ✅ Checklist

- [x] Tailwind CSS v4 installed
- [x] shadcn/ui dependencies installed
- [x] Amethyst Haze theme configured
- [x] Cabin & Inter fonts preserved
- [x] Vintage icons working
- [x] Path aliases configured (@/*)
- [x] Button component example created
- [ ] Import global.css in pages
- [ ] Add more shadcn components as needed
- [ ] Replace existing UI with shadcn components

## 🎉 Next Steps

1. **Import global.css** in your pages:
   ```astro
   ---
   import '../styles/global.css';
   ---
   ```

2. **Install more components**:
   ```bash
   npx shadcn@latest add card input dialog
   ```

3. **Replace UI elements** with shadcn components progressively

4. **Test dark mode** to see the Amethyst Haze theme in action

---

**You now have**: shadcn/ui + Amethyst Haze + Cabin/Inter Fonts + Vintage Icons! 🚀
