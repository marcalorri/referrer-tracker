/**
 * Referrer Tracker - Standalone Script
 * Version: 1.0.0
 * 
 * Universal referrer tracking script for web applications (Laravel, Next.js, React, etc.)
 * Tracks UTM parameters, referrer information, and traffic sources.
 * 
 * Usage:
 * 1. Include this script in your HTML: <script src="referrer-tracker.js"></script>
 * 2. Configure your API key: ReferrerTracker.configure({ apiKey: 'your-api-key' });
 * 3. Access tracking values via: ReferrerTracker.getSource(), ReferrerTracker.getMedium(), etc.
 * 4. Use in forms: <input type="hidden" name="source" value="" id="rt-source">
 * 
 * @license Commercial - Requires valid license
 * @website https://referrertracker.com
 */

(function(window) {
    'use strict';

    /**
     * Configuration
     */
    const CONFIG = {
        // License configuration
        apiKey: '', // REQUIRED: Your API key from https://referrertracker.com
        licenseServer: 'https://api.referrertracker.com/v1/validate',
        validateOnInit: true, // Validate license on initialization
        cacheValidation: true, // Cache validation result
        validationCacheDuration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        
        // Tracking configuration
        cookiePrefix: 'rt_',
        cookieExpireDays: 30,
        cookiePath: '/',
        debug: false, // Set to true to enable console logging
        autoFillFields: true, // Automatically fill form fields with class names
        updateInterval: 500, // Interval to update fields (ms)
        updateDuration: 10000 // Duration to keep updating fields (ms)
    };

    /**
     * License validation state
     */
    let licenseValid = false;
    let licenseChecked = false;

    /**
     * Utility Functions
     */
    const Utils = {
        /**
         * Get URL parameter by name
         */
        getUrlParameter: function(name) {
            name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
            const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
            const results = regex.exec(window.location.search);
            return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
        },

        /**
         * Get cookie by name
         */
        getCookie: function(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) {
                    return decodeURIComponent(c.substring(nameEQ.length, c.length));
                }
            }
            return '';
        },

        /**
         * Set cookie
         */
        setCookie: function(name, value, days, path) {
            const expires = new Date();
            expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
            const cookie = name + '=' + encodeURIComponent(value) + 
                          ';expires=' + expires.toUTCString() + 
                          ';path=' + path +
                          ';SameSite=Lax';
            document.cookie = cookie;
        },

        /**
         * Delete cookie
         */
        deleteCookie: function(name, path) {
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=' + path;
        },

        /**
         * Debug log
         */
        log: function(message, data) {
            if (CONFIG.debug) {
                console.log('[ReferrerTracker] ' + message, data || '');
            }
        }
    };

    /**
     * License Validator
     * Validates API key with license server
     */
    const LicenseValidator = {
        /**
         * Get cached validation result
         */
        getCachedValidation: function() {
            if (!CONFIG.cacheValidation) return null;
            
            try {
                const cached = localStorage.getItem('rt_license_cache');
                if (!cached) return null;
                
                const data = JSON.parse(cached);
                const now = Date.now();
                
                // Check if cache is still valid
                if (data.expiresAt && data.expiresAt > now) {
                    Utils.log('Using cached license validation');
                    return data;
                }
                
                // Cache expired
                localStorage.removeItem('rt_license_cache');
                return null;
            } catch (e) {
                Utils.log('Error reading license cache', e);
                return null;
            }
        },

        /**
         * Cache validation result
         */
        cacheValidation: function(data) {
            if (!CONFIG.cacheValidation) return;
            
            try {
                const cacheData = {
                    ...data,
                    expiresAt: Date.now() + CONFIG.validationCacheDuration
                };
                localStorage.setItem('rt_license_cache', JSON.stringify(cacheData));
                Utils.log('License validation cached');
            } catch (e) {
                Utils.log('Error caching license validation', e);
            }
        },

        /**
         * Validate license with server
         */
        validate: async function() {
            // Check if API key is provided
            if (!CONFIG.apiKey || CONFIG.apiKey === '') {
                console.error('[ReferrerTracker] ERROR: API key is required. Get your key at https://referrertracker.com');
                return { valid: false, error: 'API key required' };
            }

            // Check cached validation first
            const cached = this.getCachedValidation();
            if (cached) {
                return cached;
            }

            Utils.log('Validating license with server...');

            try {
                const response = await fetch(CONFIG.licenseServer, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RT-Version': '1.0.0'
                    },
                    body: JSON.stringify({
                        apiKey: CONFIG.apiKey,
                        domain: window.location.hostname,
                        url: window.location.href,
                        userAgent: navigator.userAgent
                    })
                });

                if (!response.ok) {
                    throw new Error('License validation failed: ' + response.status);
                }

                const data = await response.json();
                
                if (data.valid) {
                    Utils.log('License validated successfully', data);
                    this.cacheValidation(data);
                } else {
                    console.error('[ReferrerTracker] ERROR: Invalid license - ' + (data.message || 'Unknown error'));
                }

                return data;
            } catch (error) {
                console.error('[ReferrerTracker] ERROR: License validation failed', error);
                
                // In case of network error, allow tracking to continue if we have a recent cache
                const recentCache = this.getCachedValidation();
                if (recentCache) {
                    Utils.log('Using cached license due to validation error');
                    return recentCache;
                }
                
                return { valid: false, error: error.message };
            }
        },

        /**
         * Check if license is valid (synchronous check of cached state)
         */
        isValid: function() {
            return licenseValid;
        }
    };

    /**
     * Referrer Parser
     * Analyzes referrer URL to determine traffic source and medium
     */
    const ReferrerParser = {
        /**
         * Search engines configuration
         */
        searchEngines: {
            'google': { domains: ['google'], medium: 'organic' },
            'bing': { domains: ['bing', 'msn'], medium: 'organic' },
            'yahoo': { domains: ['yahoo'], medium: 'organic' },
            'duckduckgo': { domains: ['duckduckgo'], medium: 'organic' },
            'yandex': { domains: ['yandex'], medium: 'organic' },
            'baidu': { domains: ['baidu'], medium: 'organic' }
        },

        /**
         * Social networks configuration
         */
        socialNetworks: {
            'facebook': { domains: ['facebook', 'fb.com'], medium: 'social' },
            'twitter': { domains: ['twitter', 'x.com', 't.co'], medium: 'social' },
            'instagram': { domains: ['instagram'], medium: 'social' },
            'linkedin': { domains: ['linkedin'], medium: 'social' },
            'pinterest': { domains: ['pinterest'], medium: 'social' },
            'youtube': { domains: ['youtube', 'youtu.be'], medium: 'social' },
            'reddit': { domains: ['reddit'], medium: 'social' },
            'tiktok': { domains: ['tiktok'], medium: 'social' }
        },

        /**
         * Parse referrer URL
         */
        parse: function(referrerUrl) {
            const result = {
                source: 'direct',
                medium: 'none',
                campaign: ''
            };

            if (!referrerUrl) {
                Utils.log('Empty referrer, using default values');
                return result;
            }

            try {
                const url = new URL(referrerUrl);
                const host = url.hostname;
                const currentHost = window.location.hostname;

                Utils.log('Parsing referrer', { referrer: referrerUrl, host: host, currentHost: currentHost });

                // Check if referrer is from the same site
                if (host === currentHost) {
                    Utils.log('Referrer is from the same site, setting source to "direct" and medium to "none"');
                    
                    // Even if it's internal, check if there are UTM parameters in the referrer URL
                    if (url.search) {
                        const referrerParams = new URLSearchParams(url.search);
                        
                        // Extract UTM campaign from referrer if it exists
                        if (referrerParams.has('utm_campaign')) {
                            result.campaign = referrerParams.get('utm_campaign');
                            Utils.log('Found utm_campaign in referrer URL', result.campaign);
                        }
                    }
                    
                    return result;
                }

                // Check for paid campaign parameters in current URL
                const urlParams = new URLSearchParams(window.location.search);

                // Google Ads (gclid)
                if (urlParams.has('gclid')) {
                    result.source = 'google';
                    result.medium = 'cpc';
                    if (urlParams.has('utm_campaign')) {
                        result.campaign = urlParams.get('utm_campaign');
                    }
                    Utils.log('Detected Google Ads traffic', result);
                    return result;
                }

                // Facebook Ads (fbclid)
                if (urlParams.has('fbclid')) {
                    result.source = 'facebook';
                    result.medium = 'cpc';
                    if (urlParams.has('utm_campaign')) {
                        result.campaign = urlParams.get('utm_campaign');
                    }
                    Utils.log('Detected Facebook Ads traffic', result);
                    return result;
                }

                // Microsoft Ads (msclkid)
                if (urlParams.has('msclkid')) {
                    result.source = 'bing';
                    result.medium = 'cpc';
                    if (urlParams.has('utm_campaign')) {
                        result.campaign = urlParams.get('utm_campaign');
                    }
                    Utils.log('Detected Microsoft Ads traffic', result);
                    return result;
                }

                // TikTok Ads (ttclid, ttclid_ss, clickid)
                if (urlParams.has('ttclid') || urlParams.has('ttclid_ss') || urlParams.has('clickid')) {
                    result.source = 'tiktok';
                    result.medium = 'cpc';
                    if (urlParams.has('utm_campaign')) {
                        result.campaign = urlParams.get('utm_campaign');
                    }
                    Utils.log('Detected TikTok Ads traffic', result);
                    return result;
                }

                // Check if referrer is a search engine
                for (const [engine, config] of Object.entries(this.searchEngines)) {
                    for (const domain of config.domains) {
                        if (host.includes(domain)) {
                            result.source = engine;
                            result.medium = config.medium;
                            Utils.log('Detected search engine', result);
                            return result;
                        }
                    }
                }

                // Check if referrer is a social network
                for (const [network, config] of Object.entries(this.socialNetworks)) {
                    for (const domain of config.domains) {
                        if (host.includes(domain)) {
                            result.source = network;
                            result.medium = config.medium;
                            Utils.log('Detected social network', result);
                            return result;
                        }
                    }
                }

                // Generic referral
                result.source = host;
                result.medium = 'referral';
                Utils.log('Generic referral traffic', result);

            } catch (e) {
                Utils.log('Error parsing referrer URL', e);
            }

            return result;
        }
    };

    /**
     * Main Tracker Object
     */
    const Tracker = {
        /**
         * Initialize tracking (with license validation)
         */
        init: async function() {
            Utils.log('Initializing Referrer Tracker');

            // Validate license if required
            if (CONFIG.validateOnInit && !licenseChecked) {
                const validation = await LicenseValidator.validate();
                licenseValid = validation.valid === true;
                licenseChecked = true;

                if (!licenseValid) {
                    console.error('[ReferrerTracker] Tracking disabled: Invalid or missing license');
                    console.error('[ReferrerTracker] Get your API key at: https://referrertracker.com');
                    return;
                }

                Utils.log('License validated - Tracking enabled');
            }

            this.setCookies();
            
            if (CONFIG.autoFillFields) {
                this.autoFillFields();
            }
        },

        /**
         * Set tracking cookies
         */
        setCookies: function() {
            const referrer = document.referrer || '';
            let source = Utils.getUrlParameter('utm_source');
            let medium = Utils.getUrlParameter('utm_medium') || Utils.getUrlParameter('urm_medium'); // Typo correction
            let campaign = Utils.getUrlParameter('utm_campaign');

            // Capture click tracking parameters (with all known variations)
            // Google Ads: gclid (standard), wbraid (iOS web-to-app), gbraid (iOS app-to-web), dclid (Display & Video 360)
            let gclid = Utils.getUrlParameter('gclid');
            if (!gclid) gclid = Utils.getUrlParameter('wbraid');
            if (!gclid) gclid = Utils.getUrlParameter('gbraid');
            if (!gclid) gclid = Utils.getUrlParameter('dclid');
            
            // Facebook/Meta: fbclid (standard), fb_click_id (alternative), fbadid (older)
            let fbclid = Utils.getUrlParameter('fbclid');
            if (!fbclid) fbclid = Utils.getUrlParameter('fb_click_id');
            if (!fbclid) fbclid = Utils.getUrlParameter('fbadid');
            
            // Microsoft Ads: msclkid (standard), msclid (alternative)
            let msclkid = Utils.getUrlParameter('msclkid');
            if (!msclkid) msclkid = Utils.getUrlParameter('msclid');
            
            // TikTok: ttclid (standard), ttclid_ss (server-side), clickid (generic)
            let ttclid = Utils.getUrlParameter('ttclid');
            if (!ttclid) ttclid = Utils.getUrlParameter('ttclid_ss');
            if (!ttclid) ttclid = Utils.getUrlParameter('clickid');

            Utils.log('URL Parameters', { source, medium, campaign, referrer, gclid, fbclid, msclkid, ttclid });

            // If no UTM parameters, parse referrer
            if ((!source || !medium) && referrer) {
                const parsed = ReferrerParser.parse(referrer);
                
                if (!source) source = parsed.source;
                if (!medium) medium = parsed.medium;
                if (!campaign && parsed.campaign) campaign = parsed.campaign;
            }

            // Set defaults
            if (!source) source = 'direct';
            if (!medium) medium = 'none';
            if (!campaign) campaign = 'none';

            Utils.log('Final tracking values', { source, medium, campaign, referrer, gclid, fbclid, msclkid, ttclid });

            // Only set cookies if we have new UTM parameters or if cookies don't exist
            const existingSource = Utils.getCookie(CONFIG.cookiePrefix + 'source');
            const hasUtmParams = Utils.getUrlParameter('utm_source') || 
                                Utils.getUrlParameter('utm_medium') || 
                                Utils.getUrlParameter('utm_campaign');

            // Update cookies if we have UTM parameters or if cookies don't exist
            if (hasUtmParams || !existingSource) {
                // Delete existing cookies
                Utils.deleteCookie(CONFIG.cookiePrefix + 'source', CONFIG.cookiePath);
                Utils.deleteCookie(CONFIG.cookiePrefix + 'medium', CONFIG.cookiePath);
                Utils.deleteCookie(CONFIG.cookiePrefix + 'campaign', CONFIG.cookiePath);

                // Set new cookies
                Utils.setCookie(CONFIG.cookiePrefix + 'source', source, CONFIG.cookieExpireDays, CONFIG.cookiePath);
                Utils.setCookie(CONFIG.cookiePrefix + 'medium', medium, CONFIG.cookieExpireDays, CONFIG.cookiePath);
                Utils.setCookie(CONFIG.cookiePrefix + 'campaign', campaign, CONFIG.cookieExpireDays, CONFIG.cookiePath);

                Utils.log('Cookies updated');
            }

            // Set referrer cookie only if it doesn't exist (keep original referrer)
            const existingReferrer = Utils.getCookie(CONFIG.cookiePrefix + 'referrer');
            if (!existingReferrer && referrer) {
                Utils.setCookie(CONFIG.cookiePrefix + 'referrer', referrer, CONFIG.cookieExpireDays, CONFIG.cookiePath);
                Utils.log('Referrer cookie set', referrer);
            }

            // Set click tracking cookies only if values exist (always update if present in URL)
            if (gclid) {
                Utils.setCookie(CONFIG.cookiePrefix + 'gclid', gclid, CONFIG.cookieExpireDays, CONFIG.cookiePath);
                Utils.log('GCLID cookie set', gclid);
            }
            if (fbclid) {
                Utils.setCookie(CONFIG.cookiePrefix + 'fbclid', fbclid, CONFIG.cookieExpireDays, CONFIG.cookiePath);
                Utils.log('FBCLID cookie set', fbclid);
            }
            if (msclkid) {
                Utils.setCookie(CONFIG.cookiePrefix + 'msclkid', msclkid, CONFIG.cookieExpireDays, CONFIG.cookiePath);
                Utils.log('MSCLKID cookie set', msclkid);
            }
            if (ttclid) {
                Utils.setCookie(CONFIG.cookiePrefix + 'ttclid', ttclid, CONFIG.cookieExpireDays, CONFIG.cookiePath);
                Utils.log('TTCLID cookie set', ttclid);
            }
        },

        /**
         * Get tracking value (prioritize URL params > cookies)
         */
        getTrackingValue: function(type) {
            // Priority 1: URL parameter (for UTM parameters)
            if (type === 'campaign' || type === 'source' || type === 'medium') {
                const paramValue = Utils.getUrlParameter('utm_' + type);
                if (paramValue) {
                    return paramValue;
                }
                
                // Check for typo in medium
                if (type === 'medium') {
                    const typoValue = Utils.getUrlParameter('urm_' + type);
                    if (typoValue) return typoValue;
                }
            }

            // Priority 1: URL parameter for click IDs (check all variations)
            if (type === 'gclid') {
                let paramValue = Utils.getUrlParameter('gclid');
                if (!paramValue) paramValue = Utils.getUrlParameter('wbraid');
                if (!paramValue) paramValue = Utils.getUrlParameter('gbraid');
                if (!paramValue) paramValue = Utils.getUrlParameter('dclid');
                if (paramValue) return paramValue;
            }
            if (type === 'fbclid') {
                let paramValue = Utils.getUrlParameter('fbclid');
                if (!paramValue) paramValue = Utils.getUrlParameter('fb_click_id');
                if (!paramValue) paramValue = Utils.getUrlParameter('fbadid');
                if (paramValue) return paramValue;
            }
            if (type === 'msclkid') {
                let paramValue = Utils.getUrlParameter('msclkid');
                if (!paramValue) paramValue = Utils.getUrlParameter('msclid');
                if (paramValue) return paramValue;
            }
            if (type === 'ttclid') {
                let paramValue = Utils.getUrlParameter('ttclid');
                if (!paramValue) paramValue = Utils.getUrlParameter('ttclid_ss');
                if (!paramValue) paramValue = Utils.getUrlParameter('clickid');
                if (paramValue) return paramValue;
            }

            // Priority 2: Cookie
            const cookieValue = Utils.getCookie(CONFIG.cookiePrefix + type);
            if (cookieValue) {
                return cookieValue;
            }

            // Default values
            if (type === 'source') return 'direct';
            if (type === 'medium') return 'none';
            if (type === 'campaign') return 'none';
            
            return '';
        },

        /**
         * Auto-fill form fields
         */
        autoFillFields: function() {
            const self = this;
            
            // Update immediately
            this.updateFields();

            // Update after short delay (for dynamically loaded forms)
            setTimeout(function() {
                self.updateFields();
            }, 500);

            // Update periodically
            let updateCount = 0;
            const maxUpdates = CONFIG.updateDuration / CONFIG.updateInterval;
            
            const interval = setInterval(function() {
                self.updateFields();
                updateCount++;
                
                if (updateCount >= maxUpdates) {
                    clearInterval(interval);
                    Utils.log('Stopped periodic field updates');
                }
            }, CONFIG.updateInterval);
        },

        /**
         * Update form fields
         */
        updateFields: function() {
            const source = this.getTrackingValue('source');
            const medium = this.getTrackingValue('medium');
            const campaign = this.getTrackingValue('campaign');
            const referrer = this.getTrackingValue('referrer');
            const gclid = this.getTrackingValue('gclid');
            const fbclid = this.getTrackingValue('fbclid');
            const msclkid = this.getTrackingValue('msclkid');
            const ttclid = this.getTrackingValue('ttclid');

            Utils.log('Updating fields', { source, medium, campaign, referrer, gclid, fbclid, msclkid, ttclid });

            // Update by class name
            this.updateFieldsByClass('js-rt-source', source);
            this.updateFieldsByClass('js-rt-medium', medium);
            this.updateFieldsByClass('js-rt-campaign', campaign);
            this.updateFieldsByClass('js-rt-referrer', referrer);
            this.updateFieldsByClass('js-rt-gclid', gclid);
            this.updateFieldsByClass('js-rt-fbclid', fbclid);
            this.updateFieldsByClass('js-rt-msclkid', msclkid);
            this.updateFieldsByClass('js-rt-ttclid', ttclid);

            // Update by ID
            this.updateFieldById('rt-source', source);
            this.updateFieldById('rt-medium', medium);
            this.updateFieldById('rt-campaign', campaign);
            this.updateFieldById('rt-referrer', referrer);
            this.updateFieldById('rt-gclid', gclid);
            this.updateFieldById('rt-fbclid', fbclid);
            this.updateFieldById('rt-msclkid', msclkid);
            this.updateFieldById('rt-ttclid', ttclid);

            // Update by name attribute
            this.updateFieldsByName('rt_source', source);
            this.updateFieldsByName('rt_medium', medium);
            this.updateFieldsByName('rt_campaign', campaign);
            this.updateFieldsByName('rt_referrer', referrer);
            this.updateFieldsByName('rt_gclid', gclid);
            this.updateFieldsByName('rt_fbclid', fbclid);
            this.updateFieldsByName('rt_msclkid', msclkid);
            this.updateFieldsByName('rt_ttclid', ttclid);
        },

        /**
         * Update fields by class name
         */
        updateFieldsByClass: function(className, value) {
            const fields = document.getElementsByClassName(className);
            for (let i = 0; i < fields.length; i++) {
                if (fields[i].value !== value) {
                    fields[i].value = value;
                    Utils.log('Updated field by class: ' + className, value);
                }
            }
        },

        /**
         * Update field by ID
         */
        updateFieldById: function(id, value) {
            const field = document.getElementById(id);
            if (field && field.value !== value) {
                field.value = value;
                Utils.log('Updated field by ID: ' + id, value);
            }
        },

        /**
         * Update fields by name attribute
         */
        updateFieldsByName: function(name, value) {
            const fields = document.getElementsByName(name);
            for (let i = 0; i < fields.length; i++) {
                if (fields[i].value !== value) {
                    fields[i].value = value;
                    Utils.log('Updated field by name: ' + name, value);
                }
            }
        }
    };

    /**
     * Public API
     */
    const ReferrerTracker = {
        /**
         * Get source value
         */
        getSource: function() {
            if (!LicenseValidator.isValid() && CONFIG.validateOnInit) {
                console.warn('[ReferrerTracker] License not validated');
                return '';
            }
            return Tracker.getTrackingValue('source');
        },

        /**
         * Get medium value
         */
        getMedium: function() {
            return Tracker.getTrackingValue('medium');
        },

        /**
         * Get campaign value
         */
        getCampaign: function() {
            return Tracker.getTrackingValue('campaign');
        },

        /**
         * Get referrer value
         */
        getReferrer: function() {
            return Tracker.getTrackingValue('referrer');
        },

        /**
         * Get Google Click ID (gclid)
         */
        getGclid: function() {
            return Tracker.getTrackingValue('gclid');
        },

        /**
         * Get Facebook Click ID (fbclid)
         */
        getFbclid: function() {
            return Tracker.getTrackingValue('fbclid');
        },

        /**
         * Get Microsoft Click ID (msclkid)
         */
        getMsclkid: function() {
            return Tracker.getTrackingValue('msclkid');
        },

        /**
         * Get TikTok Click ID (ttclid)
         */
        getTtclid: function() {
            return Tracker.getTrackingValue('ttclid');
        },

        /**
         * Get all tracking values
         */
        getAll: function() {
            return {
                source: this.getSource(),
                medium: this.getMedium(),
                campaign: this.getCampaign(),
                referrer: this.getReferrer(),
                gclid: this.getGclid(),
                fbclid: this.getFbclid(),
                msclkid: this.getMsclkid(),
                ttclid: this.getTtclid()
            };
        },

        /**
         * Configure the tracker
         */
        configure: function(options) {
            // License configuration
            if (options.apiKey !== undefined) CONFIG.apiKey = options.apiKey;
            if (options.licenseServer !== undefined) CONFIG.licenseServer = options.licenseServer;
            if (options.validateOnInit !== undefined) CONFIG.validateOnInit = options.validateOnInit;
            if (options.cacheValidation !== undefined) CONFIG.cacheValidation = options.cacheValidation;
            if (options.validationCacheDuration !== undefined) CONFIG.validationCacheDuration = options.validationCacheDuration;
            
            // Tracking configuration
            if (options.cookiePrefix !== undefined) CONFIG.cookiePrefix = options.cookiePrefix;
            if (options.cookieExpireDays !== undefined) CONFIG.cookieExpireDays = options.cookieExpireDays;
            if (options.cookiePath !== undefined) CONFIG.cookiePath = options.cookiePath;
            if (options.debug !== undefined) CONFIG.debug = options.debug;
            if (options.autoFillFields !== undefined) CONFIG.autoFillFields = options.autoFillFields;
            if (options.updateInterval !== undefined) CONFIG.updateInterval = options.updateInterval;
            if (options.updateDuration !== undefined) CONFIG.updateDuration = options.updateDuration;
        },

        /**
         * Manually update form fields
         */
        updateFields: function() {
            Tracker.updateFields();
        },

        /**
         * Initialize tracker
         */
        init: function() {
            Tracker.init();
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            Tracker.init();
        });
    } else {
        // DOM is already ready
        Tracker.init();
    }

    // Expose to global scope
    window.ReferrerTracker = ReferrerTracker;

})(window);
