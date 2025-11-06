# Mobile Detection - Quick Reference

## 🚀 Quick Start

### 1. Import the Hook

```jsx
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
```

### 2. Use in Component

```jsx
export default function MyComponent() {
  const deviceInfo = useDeviceDetection();
  
  return (
    <div className={deviceInfo.isMobile ? 'mobile-style' : 'desktop-style'}>
      {/* Your content */}
    </div>
  );
}
```

## 📱 Device Info Properties

| Property | Type | Description |
|----------|------|-------------|
| `isMobile` | boolean | Phone or small tablet (< 768px) |
| `isTablet` | boolean | Medium screens (768px - 1023px) |
| `isDesktop` | boolean | Large screens (>= 1024px) |
| `isTouchDevice` | boolean | Has touch capability |
| `isPortrait` | boolean | Height > Width |
| `isLandscape` | boolean | Width >= Height |
| `screenWidth` | number | Current screen width in pixels |
| `screenHeight` | number | Current screen height in pixels |
| `isVercelDeployment` | boolean | Running on Vercel platform |
| `userAgent` | string | Browser User-Agent string |

## 🎨 Common Patterns

### Conditional Classes

```jsx
<div className={deviceInfo.isMobile ? 'p-2 text-sm' : 'p-6 text-lg'}>
```

### Conditional Rendering

```jsx
{deviceInfo.isMobile ? <MobileMenu /> : <DesktopMenu />}
```

### Hide on Mobile

```jsx
{!deviceInfo.isMobile && <ComplexFeature />}
```

### Mobile-Only Features

```jsx
{deviceInfo.isMobile && <SwipeGesture />}
```

### Orientation Handling

```jsx
{deviceInfo.isPortrait && <RotateDevicePrompt />}
```

### Vercel Badge

```jsx
{deviceInfo.isVercelDeployment && <VercelBadge />}
```

## 📐 Breakpoint Values

Use the `useBreakpointValue` hook for cleaner code:

```jsx
import { useBreakpointValue } from "@/hooks/useDeviceDetection";

const padding = useBreakpointValue({
  mobile: 2,
  tablet: 4,
  desktop: 6
});

<div className={`p-${padding}`}>
```

## 🎯 Component Examples

### Responsive Button

```jsx
<button
  className={`
    ${deviceInfo.isMobile ? 'px-3 py-2 text-sm' : 'px-6 py-3 text-base'}
    bg-blue-600 text-white rounded-lg
  `}
>
  {deviceInfo.isMobile ? 'Save' : 'Save Changes'}
</button>
```

### Responsive Header

```jsx
<header className={deviceInfo.isMobile ? 'p-2' : 'p-4'}>
  <h1 className={deviceInfo.isMobile ? 'text-xl' : 'text-3xl'}>
    My App
  </h1>
  {!deviceInfo.isMobile && <Navigation />}
</header>
```

### Responsive Grid

```jsx
const columns = deviceInfo.isMobile ? 1 : deviceInfo.isTablet ? 2 : 3;

<div className={`grid grid-cols-${columns} gap-4`}>
  {/* Items */}
</div>
```

### Touch-Optimized Target

```jsx
<button
  className={deviceInfo.isTouchDevice ? 'min-h-[44px] min-w-[44px]' : 'min-h-[32px]'}
>
  Tap Me
</button>
```

## 🔧 Tailwind Integration

### Combine with Tailwind Breakpoints

```jsx
<div className={`
  ${deviceInfo.isMobile ? 'flex-col' : 'flex-row'}
  md:gap-4
  lg:gap-6
`}>
```

### When to Use Hook vs Tailwind

**Use Hook when:**
- Need JS logic based on device
- Conditional rendering
- Complex calculations
- Need exact pixel values

**Use Tailwind when:**
- Simple responsive styling
- Standard breakpoints
- Better performance needed
- Server-side rendering important

## ⚡ Performance Tips

### ✅ DO

```jsx
// Call once at page level
function Page() {
  const deviceInfo = useDeviceDetection();
  return <Layout deviceInfo={deviceInfo} />;
}
```

### ❌ DON'T

```jsx
// Don't call in every component
function Button() {
  const deviceInfo = useDeviceDetection(); // ❌ Wasteful
}
```

## 🧪 Testing

### Local Development

```bash
# Run dev server
npm run dev

# Open in browser
# Press F12 -> Toggle device toolbar
# Test different devices
```

### Vercel Deployment

```bash
# Deploy to Vercel
vercel --prod

# Access from mobile device
# Verify "Running on Vercel" badge appears
```

## 🐛 Common Issues

### Issue: Not updating on resize

**Fix:** Make sure component is re-rendering
```jsx
// Check if you're using the value in JSX
<div>{deviceInfo.screenWidth}</div> // Forces re-render
```

### Issue: Vercel badge not showing

**Fix:** Check environment
```jsx
console.log(window.location.hostname); // Should include 'vercel.app'
console.log(process.env.NEXT_PUBLIC_VERCEL_ENV); // Should be defined
```

### Issue: Wrong device detected

**Fix:** Check User-Agent
```jsx
console.log(deviceInfo.userAgent);
console.log(deviceInfo.screenWidth);
```

## 📦 Files Reference

| File | Purpose |
|------|---------|
| `src/hooks/useDeviceDetection.js` | Main hook implementation |
| `middleware.js` | Server-side detection |
| `docs/MOBILE_DETECTION_IMPLEMENTATION.md` | Full documentation |

## 🌟 Real-World Examples

### Video Call Layout

```jsx
// Local video positioning
<div className={`
  absolute
  ${deviceInfo.isMobile ? 'bottom-20 right-2 w-24 h-32' : 'bottom-6 right-6 w-64 h-48'}
  bg-gray-700 rounded-lg
`}>
  <video ref={localVideoRef} />
</div>
```

### Form Layout

```jsx
<div className={`flex ${deviceInfo.isMobile ? 'flex-col gap-2' : 'flex-row gap-4'}`}>
  <input type="text" />
  <button>Submit</button>
</div>
```

### Navigation Menu

```jsx
{deviceInfo.isMobile ? (
  <MobileHamburgerMenu />
) : (
  <DesktopNavigationBar />
)}
```

## 💡 Pro Tips

1. **Mobile-First:** Design for mobile, enhance for desktop
2. **Touch Targets:** Minimum 44x44px for touch devices
3. **Orientation:** Consider landscape mode on mobile
4. **Performance:** Use CSS media queries when possible
5. **Testing:** Test on real devices, not just emulators

## 🔗 Quick Links

- [Full Documentation](./MOBILE_DETECTION_IMPLEMENTATION.md)
- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

**Need Help?** Check the full implementation guide in `MOBILE_DETECTION_IMPLEMENTATION.md`

