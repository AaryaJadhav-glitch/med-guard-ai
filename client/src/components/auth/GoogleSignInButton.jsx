import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '419199290607-c3c3unjgc7jgmjgluegoruca3f4e139j.apps.googleusercontent.com';

export function GoogleSignInButton({
  mode = 'signin', // 'signin' | 'signup'
  onSuccess,
  onError,
  className = ''
}) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const googleBtnContainerRef = useRef(null);

  const buttonText = mode === 'signup' ? 'signup_with' : 'signin_with';

  useEffect(() => {
    let checkInterval = null;
    let attempts = 0;

    const initializeGis = () => {
      if (window.google?.accounts?.id && googleBtnContainerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          // Clear previous child elements if any
          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
          }

          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            type: 'standard',
            shape: 'rectangular',
            theme: 'outline',
            text: buttonText,
            size: 'large',
            logo_alignment: 'left',
            width: 360
          });

          setGisLoaded(true);
          return true;
        } catch (err) {
          console.warn('GIS initialization error:', err);
        }
      }
      return false;
    };

    if (!initializeGis()) {
      checkInterval = setInterval(() => {
        attempts += 1;
        if (initializeGis() || attempts > 25) {
          clearInterval(checkInterval);
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [buttonText]);

  async function handleGoogleCredentialResponse(response) {
    if (!response?.credential) {
      onError?.('Google credential was not returned.');
      return;
    }

    try {
      setLoading(true);
      const authResult = await signInWithGoogle(response.credential);
      onSuccess?.(authResult);
    } catch (err) {
      console.error('Google sign in error:', err);
      onError?.(err.message || 'Google sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Fallback trigger if user clicks custom styled button
  const handleFallbackClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.warn('Google One Tap prompt skipped/not displayed:', notification.getNotDisplayedReason?.());
        }
      });
    } else {
      onError?.('Google Sign-In is initializing. Please try again in a few moments.');
    }
  };

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      {loading ? (
        <div className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
          <span>Authenticating with Google...</span>
        </div>
      ) : (
        <div className="w-full flex justify-center">
          {/* Native Google Identity Services Button Container */}
          <div
            ref={googleBtnContainerRef}
            className={`w-full flex justify-center ${!gisLoaded ? 'hidden' : ''}`}
            style={{ minHeight: '44px' }}
          />

          {/* Fallback button if GIS script is delayed or blocked */}
          {!gisLoaded && (
            <button
              type="button"
              onClick={handleFallbackClick}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition-all hover:shadow"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
