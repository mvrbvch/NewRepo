import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";

// Function to hide the initial HTML splash screen
function hideInitialLoader() {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
    }, 500);
  }
}

// Register the service worker for push notifications and PWA
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  
  try {
    // Check if there are existing service worker registrations
    const existingRegistrations = await navigator.serviceWorker.getRegistrations();
    
    // If there are old registrations, try to update or remove them
    if (existingRegistrations.length > 0) {
      console.log(`Found ${existingRegistrations.length} registered service workers.`);
      
      for (const registration of existingRegistrations) {
        console.log(`Service worker at: ${registration.scope}`);
        
        // Force update
        try {
          await registration.update();
          console.log(`Service worker updated at: ${registration.scope}`);
        } catch (updateError) {
          console.error(`Error updating service worker:`, updateError);
          
          // If update fails, try to remove it
          try {
            const unregistered = await registration.unregister();
            if (unregistered) {
              console.log(`Service worker successfully unregistered at: ${registration.scope}`);
            }
          } catch (unregisterError) {
            console.error(`Error unregistering service worker:`, unregisterError);
          }
        }
      }
    }
    
    // Register the service worker with robust options
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/', 
      updateViaCache: 'none' // Always fetch from server, not from cache
    });
    
    console.log('Service Worker successfully registered:', registration.scope);
    
    // Check if a new version is available
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (installingWorker) {
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('New Service Worker version installed, will be activated on next visit');
            } else {
              console.log('Service Worker installed for the first time');
            }
          }
        };
      }
    };
    
    return registration;
  } catch (error) {
    console.error('Failed to register Service Worker:', error);
    
    // Check if the service worker file is accessible
    try {
      const response = await fetch('/service-worker.js');
      if (response.ok) {
        console.log('Service worker exists and is accessible. Status:', response.status);
      } else {
        console.error('Service worker is not accessible. Status:', response.status);
      }
    } catch (fetchError) {
      console.error('Error checking service-worker.js file:', fetchError);
    }
  }
}

// Initialize the application
async function initializeApp() {
  // Start service worker registration
  const serviceWorkerPromise = registerServiceWorker();
  
  // Render the React app
  createRoot(document.getElementById("root")!).render(
    <ThemeProvider attribute="class" defaultTheme="light">
      <App />
    </ThemeProvider>
  );
  
  // Keep the HTML splash screen visible longer (handled by the inline script in index.html)
  // The React splash screen will take over smoothly
  
  // Wait for service worker registration (but don't block the app)
  await serviceWorkerPromise;
}

// Start the app when the window loads
window.addEventListener('load', initializeApp);
