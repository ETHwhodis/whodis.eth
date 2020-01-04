import { useRef, useEffect} from 'react';

export default function useEventEmitterListener(eventName, handler, emitter){
    // Create a ref that stores handler
    const savedHandler = useRef();
    
    // Update ref.current value if handler changes.
    // This allows our effect below to always get latest handler ...
    // ... without us needing to pass it in effect deps array ...
    // ... and potentially cause effect to re-run every render.
    useEffect(() => {
      savedHandler.current = handler;
    }, [handler]);
  
    useEffect(
      () => {
        
         // Make sure emitter supports addEventListener
        // On 
        const isSupported = emitter && emitter.on;
        if (!isSupported) return;
        
        // Create event listener that calls handler function stored in ref
        const eventListener = event => savedHandler.current(event);
        
        // Add event listener
        emitter.on(eventName, eventListener);

        emitter.on('error', console.error)
        
        // Remove event listener on cleanup
        return () => {
          emitter && emitter.removeEventListener &&
          emitter.removeEventListener(eventName, eventListener);
        };
      },
      [eventName, emitter] // Re-run if eventName or emitter changes
    );
  };