// Viewport utility for auto-detecting screen size and applying responsive classes

export interface ViewportInfo {
  width: number;
  height: number;
  type: 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'ultrawide';
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  scale: number;
}

export function detectViewport(): ViewportInfo {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Determine device type
  let type: ViewportInfo['type'] = 'desktop';
  if (width <= 480) type = 'mobile';
  else if (width <= 768) type = 'tablet';
  else if (width <= 1366) type = 'laptop';
  else if (width <= 1920) type = 'desktop';
  else type = 'ultrawide';
  
  // Determine size category
  let size: ViewportInfo['size'] = 'lg';
  if (width <= 360) size = 'xs';
  else if (width <= 480) size = 'sm';
  else if (width <= 768) size = 'md';
  else if (width <= 1024) size = 'lg';
  else if (width <= 1440) size = 'xl';
  else size = 'xxl';
  
  // Calculate optimal scale factor
  let scale = 1;
  if (type === 'laptop' && height <= 800) {
    // For small laptops, calculate scale to fit content
    const targetHeight = 900; // Ideal height for dashboard
    scale = Math.max(0.7, Math.min(1, height / targetHeight));
  }
  
  return { width, height, type, size, scale };
}

export function applyViewportClasses(viewport: ViewportInfo): void {
  const root = document.documentElement;
  
  // Remove existing viewport classes
  root.classList.remove(
    'viewport-xs', 'viewport-sm', 'viewport-md', 'viewport-lg', 'viewport-xl', 'viewport-xxl',
    'device-mobile', 'device-tablet', 'device-laptop', 'device-desktop', 'device-ultrawide'
  );
  
  // Add new classes
  root.classList.add(`viewport-${viewport.size}`);
  root.classList.add(`device-${viewport.type}`);
  
  // Apply dynamic scaling via CSS variables
  root.style.setProperty('--viewport-scale', viewport.scale.toString());
  root.style.setProperty('--viewport-width', `${viewport.width}px`);
  root.style.setProperty('--viewport-height', `${viewport.height}px`);
}

export function setupResponsiveListener(): void {
  const updateViewport = () => {
    const viewport = detectViewport();
    applyViewportClasses(viewport);
  };
  
  // Initial setup
  updateViewport();
  
  // Listen for resize events with debouncing
  let timeoutId: NodeJS.Timeout;
  window.addEventListener('resize', () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(updateViewport, 150);
  });
}