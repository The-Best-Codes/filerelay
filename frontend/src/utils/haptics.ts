export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
    let pattern: number | number[];
    
    switch (type) {
      case 'light':
        pattern = 10;
        break;
      case 'medium':
        pattern = 20;
        break;
      case 'heavy':
        pattern = [30, 10, 30];
        break;
      default:
        pattern = 10;
    }
    
    navigator.vibrate(pattern);
  }
  
  // iOS haptic feedback (if available)
  const windowWithTaptic = window as Window & { Taptic?: { impact: (intensity: number) => void } };
  if ('Taptic' in window && typeof windowWithTaptic.Taptic?.impact === 'function') {
    const intensity = type === 'heavy' ? 2 : type === 'medium' ? 1 : 0;
    windowWithTaptic.Taptic.impact(intensity);
  }
};