// ============================================================
// KMCA OWNER — NAVIGATION SYSTEM
// Version: 4.0
// Sidebar + Bottom Nav + Notifications + Menu Button + CSS
// ============================================================

(function() {
    'use strict';

    // ============================================
    // CSS INJECTION (Option A — CSS ndani ya JS)
    // ============================================
    const OWNER_NAV_CSS = `
        /* ============================================================
           OWNER NAV — CSS VARIABLES
           ============================================================ */
        :root {
            --owner-primary: #d4af37;
            --owner-primary-dark: #b8962e;
            --owner-primary-light: #f0d060;
            --owner-primary-soft: rgba(212, 175, 55, 0.12);
            
            --owner-bg-dark: #020617;
            --owner-bg-card: #0f172a;
            --owner-bg-input: #1e293b;
            --owner-bg-hover: #1e293b;
            
            --owner-text-light: #f8fafc;
            --owner-text-muted: #94a3b8;
            
            --owner-border: #334155;
            --owner-border-strong: #475569;
            
            --owner-error: #ef4444;
            --owner-success: #10b981;
            --owner-warning: #f59e0b;
            --owner-info: #3b82f6;
            
            --owner-radius-sm: 8px;
            --owner-radius-md: 12px;
            --owner-radius-lg: 16px;
            --owner-radius-full: 9999px;
            
            --owner-shadow: 0 4px 20px rgba(0,0,0,0.25);
            --owner-shadow-lg: 0 10px 40px rgba(0,0,0,0.4);
            
            --owner-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            
            --owner-sidebar-width: 280px;
            --owner-bottom-nav-height: 64px;
        }

        /* ============================================================
           MENU BUTTON (Hamburger)
           ============================================================ */
        .owner-menu-toggle {
            position: fixed;
            top: 14px;
            left: 14px;
            width: 44px;
            height: 44px;
            background: var(--owner-bg-card);
            border: 1px solid var(--owner-border);
            border-radius: var(--owner-radius-md);
            color: var(--owner-text-light);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            z-index: 990;
            transition: var(--owner-transition);
            box-shadow: var(--owner-shadow);
        }

        .owner-menu-toggle:hover {
            background: var(--owner-primary);
            color: var(--owner-bg-dark);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(212, 175, 55, 0.4);
        }

        .owner-menu-toggle:active {
            transform: scale(0.92);
        }

        /* Animated bars */
        .owner-menu-toggle::before,
        .owner-menu-toggle::after {
            content: '';
            position: absolute;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(212, 175, 55, 0.3);
            transition: all 0.4s;
        }

        .owner-menu-toggle:hover::before {
            width: 60px;
            height: 60px;
            top: -8px;
            left: -8px;
        }

        /* ============================================================
           SIDEBAR
           ============================================================ */
        .owner-sidebar {
            position: fixed;
            top: 0;
            left: -320px;
            width: var(--owner-sidebar-width);
            max-width: 85vw;
            height: 100vh;
            height: 100dvh;
            background: var(--owner-bg-card);
            border-right: 1px solid var(--owner-border);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: left 0.35s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: none;
        }

        .owner-sidebar.open {
            left: 0;
            box-shadow: 8px 0 40px rgba(0,0,0,0.5);
        }

        /* Sidebar Header */
        .owner-sidebar-header {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 20px;
            border-bottom: 1px solid var(--owner-border);
            background: linear-gradient(135deg, 
                rgba(212, 175, 55, 0.08), 
                transparent 70%
            );
            position: relative;
            flex-shrink: 0;
        }

        .owner-sidebar-avatar {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--owner-primary), var(--owner-primary-light));
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 800;
            color: var(--owner-bg-dark);
            overflow: hidden;
            flex-shrink: 0;
            border: 2px solid var(--owner-bg-card);
            box-shadow: 0 4px 16px rgba(212, 175, 55, 0.3);
            letter-spacing: 1px;
        }

        .owner-sidebar-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .owner-sidebar-info {
            flex: 1;
            min-width: 0;
        }

        .owner-sidebar-info h3 {
            font-size: 15px;
            font-weight: 800;
            color: var(--owner-text-light);
            margin-bottom: 3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .owner-sidebar-info p {
            font-size: 12px;
            color: var(--owner-text-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .owner-sidebar-close {
            width: 34px;
            height: 34px;
            background: var(--owner-bg-input);
            border: 1px solid var(--owner-border);
            border-radius: 50%;
            color: var(--owner-text-muted);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            transition: var(--owner-transition);
            flex-shrink: 0;
        }

        .owner-sidebar-close:hover {
            background: var(--owner-error);
            color: white;
            transform: rotate(90deg);
        }

        /* Sidebar Nav */
        .owner-sidebar-nav {
            flex: 1;
            overflow-y: auto;
            padding: 12px 8px;
            -webkit-overflow-scrolling: touch;
        }

        .owner-sidebar-nav::-webkit-scrollbar {
            width: 4px;
        }

        .owner-sidebar-nav::-webkit-scrollbar-thumb {
            background: var(--owner-border);
            border-radius: 4px;
        }

        /* Category */
        .owner-nav-category {
            margin-bottom: 4px;
            animation: ownerNavFadeIn 0.4s ease-out backwards;
        }

        .owner-nav-category[data-category="0"] { animation-delay: 0.05s; }
        .owner-nav-category[data-category="1"] { animation-delay: 0.10s; }
        .owner-nav-category[data-category="2"] { animation-delay: 0.15s; }
        .owner-nav-category[data-category="3"] { animation-delay: 0.20s; }

        @keyframes ownerNavFadeIn {
            from { 
                opacity: 0; 
                transform: translateX(-20px); 
            }
            to { 
                opacity: 1; 
                transform: translateX(0); 
            }
        }

        .owner-nav-category-header {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            margin-bottom: 4px;
            border-radius: var(--owner-radius-sm);
            cursor: pointer;
            transition: var(--owner-transition);
            color: var(--owner-primary);
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }

        .owner-nav-category-header:hover {
            background: var(--owner-primary-soft);
        }

        .owner-nav-category-header i:first-child {
            font-size: 13px;
            width: 16px;
            text-align: center;
        }

        .owner-nav-category-arrow {
            margin-left: auto;
            font-size: 10px;
            transition: transform 0.3s;
        }

        .owner-nav-category.collapsed .owner-nav-category-arrow {
            transform: rotate(-90deg);
        }

        .owner-nav-category.collapsed .owner-nav-category-items {
            max-height: 0;
            opacity: 0;
            overflow: hidden;
        }

        .owner-nav-category-items {
            max-height: 800px;
            transition: max-height 0.35s ease-out, opacity 0.3s;
            overflow: hidden;
        }

        /* Nav Item */
        .owner-nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 11px 14px;
            border-radius: var(--owner-radius-md);
            cursor: pointer;
            transition: var(--owner-transition);
            color: var(--owner-text-muted);
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 2px;
            position: relative;
        }

        .owner-nav-item:hover {
            background: var(--owner-bg-hover);
            color: var(--owner-text-light);
            transform: translateX(4px);
        }

        .owner-nav-item:active {
            transform: translateX(4px) scale(0.98);
        }

        .owner-nav-item i {
            font-size: 16px;
            width: 20px;
            text-align: center;
            flex-shrink: 0;
        }

        .owner-nav-item.active {
            background: var(--owner-primary-soft);
            color: var(--owner-primary-light);
            font-weight: 700;
        }

        .owner-nav-item.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 70%;
            background: var(--owner-primary);
            border-radius: 0 4px 4px 0;
            animation: ownerNavActivePulse 2s ease-in-out infinite;
        }

        @keyframes ownerNavActivePulse {
            0%, 100% { 
                box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.5); 
            }
            50% { 
                box-shadow: 0 0 0 8px rgba(212, 175, 55, 0); 
            }
        }

        /* Sidebar Footer */
        .owner-sidebar-footer {
            padding: 12px 8px 20px;
            border-top: 1px solid var(--owner-border);
            flex-shrink: 0;
        }

        .owner-nav-item.logout {
            color: var(--owner-error);
        }

        .owner-nav-item.logout:hover {
            background: rgba(239, 68, 68, 0.1);
            color: var(--owner-error);
        }

        .owner-nav-item.logout i {
            color: var(--owner-error);
        }

        .owner-sidebar-version {
            text-align: center;
            font-size: 11px;
            color: var(--owner-text-muted);
            opacity: 0.6;
            margin-top: 12px;
            letter-spacing: 0.5px;
        }

        /* Sidebar Overlay */
        .owner-sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.6);
            z-index: 999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
            backdrop-filter: blur(2px);
        }

        .owner-sidebar-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        /* ============================================================
           BOTTOM NAV
           ============================================================ */
        .owner-bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: var(--owner-bottom-nav-height);
            background: var(--owner-bg-card);
            border-top: 1px solid var(--owner-border);
            display: flex;
            align-items: center;
            justify-content: space-around;
            z-index: 950;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            padding-bottom: env(safe-area-inset-bottom, 0);
            box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
        }

        .owner-bottom-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 8px 18px;
            cursor: pointer;
            transition: var(--owner-transition);
            color: var(--owner-text-muted);
            font-size: 11px;
            font-weight: 600;
            position: relative;
            border-radius: var(--owner-radius-md);
            min-width: 64px;
        }

        .owner-bottom-nav-item:hover {
            color: var(--owner-text-light);
            background: var(--owner-bg-hover);
        }

        .owner-bottom-nav-item:active {
            transform: scale(0.92);
        }

        .owner-bottom-nav-item i {
            font-size: 20px;
            transition: var(--owner-transition);
        }

        .owner-bottom-nav-item.active {
            color: var(--owner-primary);
        }

        .owner-bottom-nav-item.active i {
            transform: scale(1.1);
            filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.6));
        }

        .owner-bottom-nav-item.active::before {
            content: '';
            position: absolute;
            top: -1px;
            left: 50%;
            transform: translateX(-50%);
            width: 32px;
            height: 3px;
            background: var(--owner-primary);
            border-radius: 0 0 4px 4px;
            animation: ownerBottomNavGlow 2s ease-in-out infinite;
        }

        @keyframes ownerBottomNavGlow {
            0%, 100% { 
                box-shadow: 0 0 8px rgba(212, 175, 55, 0.5);
                opacity: 0.8;
            }
            50% { 
                box-shadow: 0 0 20px rgba(212, 175, 55, 0.9);
                opacity: 1;
            }
        }

        /* Badge on bottom nav */
        .owner-bottom-nav-item .owner-nav-badge {
            position: absolute;
            top: 4px;
            right: 8px;
            background: var(--owner-error);
            color: white;
            font-size: 10px;
            font-weight: 800;
            min-width: 18px;
            height: 18px;
            padding: 0 5px;
            border-radius: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid var(--owner-bg-card);
        }

        /* ============================================================
           NOTIFICATIONS MODAL
           ============================================================ */
        .owner-notifications-modal {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
            backdrop-filter: blur(4px);
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 16px;
            padding-top: 70px;
        }

        .owner-notifications-modal.active {
            opacity: 1;
            pointer-events: auto;
        }

        .owner-notifications-content {
            background: var(--owner-bg-card);
            border: 1px solid var(--owner-border);
            border-radius: var(--owner-radius-lg);
            width: 100%;
            max-width: 480px;
            max-height: 75vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: translateY(-20px) scale(0.95);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: var(--owner-shadow-lg);
        }

        .owner-notifications-modal.active .owner-notifications-content {
            transform: translateY(0) scale(1);
        }

        .owner-notifications-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid var(--owner-border);
            background: linear-gradient(135deg, 
                rgba(212, 175, 55, 0.05), 
                transparent
            );
            flex-shrink: 0;
        }

        .owner-notifications-header h3 {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
            font-weight: 800;
            color: var(--owner-text-light);
        }

        .owner-notifications-header h3 i {
            color: var(--owner-primary);
        }

        .owner-notifications-actions {
            display: flex;
            gap: 6px;
        }

        .owner-notifications-mark-read,
        .owner-notifications-close {
            width: 34px;
            height: 34px;
            background: var(--owner-bg-input);
            border: 1px solid var(--owner-border);
            border-radius: 50%;
            color: var(--owner-text-muted);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transition: var(--owner-transition);
        }

        .owner-notifications-mark-read:hover {
            background: var(--owner-success);
            color: white;
            transform: scale(1.05);
        }

        .owner-notifications-close:hover {
            background: var(--owner-error);
            color: white;
            transform: rotate(90deg);
        }

        .owner-notifications-list {
            flex: 1;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }

        /* Notification Item */
        .owner-notification-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 14px 20px;
            border-bottom: 1px solid var(--owner-border);
            cursor: pointer;
            transition: var(--owner-transition);
            position: relative;
            animation: ownerNavFadeIn 0.3s ease-out backwards;
        }

        .owner-notification-item:hover {
            background: var(--owner-bg-hover);
        }

        .owner-notification-item:last-child {
            border-bottom: none;
        }

        .owner-notification-item.unread {
            background: rgba(212, 175, 55, 0.05);
        }

        .owner-notification-item.unread::before {
            content: '';
            position: absolute;
            left: 8px;
            top: 50%;
            transform: translateY(-50%);
            width: 6px;
            height: 6px;
            background: var(--owner-primary);
            border-radius: 50%;
            animation: ownerNavActivePulse 2s ease-in-out infinite;
        }

        .owner-notification-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--owner-primary-soft);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: var(--owner-primary);
            flex-shrink: 0;
        }

        .owner-notification-body {
            flex: 1;
            min-width: 0;
        }

        .owner-notification-body strong {
            display: block;
            font-size: 14px;
            font-weight: 700;
            color: var(--owner-text-light);
            margin-bottom: 3px;
            line-height: 1.4;
        }

        .owner-notification-body p {
            font-size: 13px;
            color: var(--owner-text-muted);
            margin-bottom: 4px;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .owner-notification-body span {
            font-size: 11px;
            color: var(--owner-text-muted);
            opacity: 0.7;
        }

        .owner-notifications-empty {
            padding: 60px 20px;
            text-align: center;
            color: var(--owner-text-muted);
        }

        .owner-notifications-empty i {
            font-size: 48px;
            margin-bottom: 12px;
            display: block;
            color: var(--owner-border-strong);
            opacity: 0.5;
        }

        .owner-notifications-empty p {
            font-size: 14px;
        }

        /* ============================================================
           BODY PADDING (kwa bottom nav + menu button)
           ============================================================ */
        body.owner-nav-active {
            padding-bottom: calc(var(--owner-bottom-nav-height) + 20px) !important;
            padding-top: 72px !important;
        }

        /* Kama HTML ina header yake, tuna-weka padding */
        body.owner-nav-active.with-header {
            padding-top: 72px !important;
        }

        /* ============================================================
           RESPONSIVE
           ============================================================ */
        @media (max-width: 480px) {
            .owner-sidebar {
                width: 85vw;
            }
            
            .owner-menu-toggle {
                width: 40px;
                height: 40px;
                top: 12px;
                left: 12px;
                font-size: 16px;
            }
            
            .owner-bottom-nav-item {
                padding: 8px 12px;
                min-width: 56px;
            }
            
            .owner-bottom-nav-item i {
                font-size: 18px;
            }
            
            .owner-bottom-nav-item span {
                font-size: 10px;
            }
            
            .owner-notifications-modal {
                padding-top: 64px;
                padding: 12px;
            }
            
            .owner-notifications-content {
                max-height: 80vh;
            }
        }

        /* ============================================================
           REDUCED MOTION (Accessibility)
           ============================================================ */
        @media (prefers-reduced-motion: reduce) {
            .owner-menu-toggle,
            .owner-sidebar,
            .owner-nav-item,
            .owner-bottom-nav-item,
            .owner-notification-item,
            .owner-nav-category {
                animation: none !important;
                transition: none !important;
            }
        }
    `;

    // ============================================
    // INJECT CSS
    // ============================================
    function injectCSS() {
        if (document.getElementById('owner-nav-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'owner-nav-styles';
        style.textContent = OWNER_NAV_CSS;
        document.head.appendChild(style);
        
        console.log('✅ Owner Nav CSS injected');
    }

    // ============================================
    // STATE
    // ============================================
    const state = {
        owner: null,
        currentPage: '',
        notifications: [],
        notificationSub: null,
        isSidebarOpen: false
    };

    // ============================================
    // SIDEBAR MENU (Categories)
    // ============================================
    const SIDEBAR_MENU = [
        {
            category: 'Dashboard',
            icon: 'fa-home',
            items: [
                { page: 'dashboard', icon: 'fa-home', label: 'Dashboard', always: true }
            ]
        },
        {
            category: 'Content',
            icon: 'fa-newspaper',
            items: [
                { page: 'posts', icon: 'fa-newspaper', label: 'Posts' },
                { page: 'polls', icon: 'fa-vote-yea', label: 'Polls' },
                { page: 'events', icon: 'fa-calendar-alt', label: 'Matukio' },
                { page: 'watakatifu', icon: 'fa-cross', label: 'Watakatifu' },
                { page: 'bible-verses', icon: 'fa-bible', label: 'Bible Verses' },
                { page: 'nyimbo', icon: 'fa-music', label: 'Nyimbo za Siku' },
                { page: 'masomo', icon: 'fa-book-open', label: 'Masomo' }
            ]
        },
        {
            category: 'Management',
            icon: 'fa-users',
            items: [
                { page: 'users', icon: 'fa-users', label: 'Users' },
                { page: 'announcements', icon: 'fa-bullhorn', label: 'Matangazo' },
                { page: 'owners', icon: 'fa-user-shield', label: 'Owners' },
                { page: 'media', icon: 'fa-photo-video', label: 'Media Library' }
            ]
        },
        {
            category: 'System',
            icon: 'fa-cog',
            items: [
                { page: 'backup-clean', icon: 'fa-database', label: 'Backup & Clean' },
                { page: 'urls', icon: 'fa-link', label: 'URL Management' },
                { page: 'pwa', icon: 'fa-mobile-alt', label: 'PWA Management' },
                { page: 'settings', icon: 'fa-cog', label: 'Settings' }
            ]
        }
    ];

    // ============================================
    // INIT
    // ============================================
    async function init() {
        console.log('🎯 Initializing Owner Nav...');
        
        // Inject CSS kwanza
        injectCSS();
        
        // Get owner
        state.owner = getOwnerSession();
        if (!state.owner) {
            console.warn('⚠️ No owner session');
            return;
        }
        
        // Detect page
        state.currentPage = detectCurrentPage();
        console.log('📍 Current page:', state.currentPage);
        
        // Add body class
        document.body.classList.add('owner-nav-active');
        
        // Build UI
        buildMenuButton();
        buildSidebar();
        buildBottomNav();
        buildNotificationsModal();
        
        // Load notifications
        await loadNotifications();
        
        // Subscribe realtime
        subscribeToNotifications();
        
        // Setup activity tracker
        setupActivityTracker();
        
        // Setup global events
        setupGlobalEvents();
        
        console.log('✅ Owner Nav ready');
    }

    // ============================================
    // GET OWNER SESSION
    // ============================================
    function getOwnerSession() {
        try {
            const data = sessionStorage.getItem('kmca_owner');
            if (!data) {
                const backup = localStorage.getItem('kmca_owner_backup');
                return backup ? JSON.parse(backup) : null;
            }
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    }

    // ============================================
    // DETECT CURRENT PAGE
    // ============================================
    function detectCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        return filename.replace('.html', '');
    }

    // ============================================
    // MENU BUTTON
    // ============================================
    function buildMenuButton() {
        // Kama tayari ipo kwenye HTML, usitengeneze
        if (document.getElementById('menuToggle')) {
            const existing = document.getElementById('menuToggle');
            existing.classList.add('owner-menu-toggle');
            existing.addEventListener('click', toggleSidebar);
            return;
        }
        
        // Tengeneza mpya
        const btn = document.createElement('button');
        btn.id = 'menuToggle';
        btn.className = 'owner-menu-toggle';
        btn.setAttribute('aria-label', 'Menu');
        btn.innerHTML = '<i class="fas fa-bars"></i>';
        btn.addEventListener('click', toggleSidebar);
        document.body.appendChild(btn);
    }

    // ============================================
    // BUILD SIDEBAR
    // ============================================
    function buildSidebar() {
        if (document.getElementById('ownerSidebar')) return;
        
        const owner = state.owner;
        const initials = getInitials(owner.jina);
        const hasPicture = owner.profile_picture && 
                           owner.profile_picture !== 'null' &&
                           owner.profile_picture.trim() !== '';
        
        const avatarHtml = hasPicture
            ? `<img src="${owner.profile_picture}" alt="${owner.jina}" onerror="this.parentElement.innerHTML='${initials}'">`
            : initials;
        
        // Build menu
        let menuHtml = '';
        SIDEBAR_MENU.forEach((category, idx) => {
            if (category.items.length === 0) return;
            
            menuHtml += `
                <div class="owner-nav-category" data-category="${idx}">
                    <div class="owner-nav-category-header">
                        <i class="fas ${category.icon}"></i>
                        <span>${category.category}</span>
                        <i class="fas fa-chevron-down owner-nav-category-arrow"></i>
                    </div>
                    <div class="owner-nav-category-items">
                        ${category.items.map(item => `
                            <div class="owner-nav-item ${item.page === state.currentPage ? 'active' : ''}" 
                                 data-page="${item.page}">
                                <i class="fas ${item.icon}"></i>
                                <span>${item.label}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        // Create sidebar
        const sidebar = document.createElement('aside');
        sidebar.id = 'ownerSidebar';
        sidebar.className = 'owner-sidebar';
        sidebar.innerHTML = `
            <div class="owner-sidebar-header">
                <div class="owner-sidebar-avatar">${avatarHtml}</div>
                <div class="owner-sidebar-info">
                    <h3>${escapeHtml(owner.jina || 'Owner')}</h3>
                    <p>${owner.is_super_admin ? '👑 Super Admin' : escapeHtml(owner.phone || 'Owner')}</p>
                </div>
                <button class="owner-sidebar-close" id="ownerSidebarClose" aria-label="Funga">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <nav class="owner-sidebar-nav">
                ${menuHtml}
            </nav>
            
            <div class="owner-sidebar-footer">
                <div class="owner-nav-item logout" data-page="logout">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Toka</span>
                </div>
                <div class="owner-sidebar-version">
                    v${(window.HOSTING_CONFIG?.app?.version) || '2.0.0'}
                </div>
            </div>
        `;
        
        document.body.appendChild(sidebar);
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'ownerSidebarOverlay';
        overlay.className = 'owner-sidebar-overlay';
        document.body.appendChild(overlay);
        
        // Setup events
        setupSidebarEvents();
    }

    // ============================================
    // SIDEBAR EVENTS
    // ============================================
    function setupSidebarEvents() {
        const sidebar = document.getElementById('ownerSidebar');
        const overlay = document.getElementById('ownerSidebarOverlay');
        const closeBtn = document.getElementById('ownerSidebarClose');
        
        if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
        if (overlay) overlay.addEventListener('click', closeSidebar);
        
        // Category toggle
        sidebar.querySelectorAll('.owner-nav-category-header').forEach(header => {
            header.addEventListener('click', function() {
                this.parentElement.classList.toggle('collapsed');
            });
        });
        
        // Nav items
        sidebar.querySelectorAll('.owner-nav-item').forEach(item => {
            item.addEventListener('click', function() {
                const page = this.getAttribute('data-page');
                handleNavClick(page);
            });
        });
        
        // Scroll to active
        const activeItem = sidebar.querySelector('.owner-nav-item.active');
        if (activeItem) {
            setTimeout(() => {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
        }
    }

    // ============================================
    // SIDEBAR OPEN/CLOSE
    // ============================================
    function toggleSidebar() {
        if (state.isSidebarOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    function openSidebar() {
        const sidebar = document.getElementById('ownerSidebar');
        const overlay = document.getElementById('ownerSidebarOverlay');
        
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.classList.add('active');
        
        state.isSidebarOpen = true;
        document.body.style.overflow = 'hidden';
        
        // Haptic feedback (kama inaruhusu)
        if (navigator.vibrate) navigator.vibrate(10);
    }

    function closeSidebar() {
        const sidebar = document.getElementById('ownerSidebar');
        const overlay = document.getElementById('ownerSidebarOverlay');
        
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        
        state.isSidebarOpen = false;
        document.body.style.overflow = '';
    }

    // ============================================
    // BUILD BOTTOM NAV
    // ============================================
    function buildBottomNav() {
        if (document.querySelector('.owner-bottom-nav')) return;
        
        const items = [
            { page: 'dashboard', icon: 'fa-home', label: 'Home' },
            { page: 'posts', icon: 'fa-newspaper', label: 'Posts' },
            { page: 'users', icon: 'fa-users', label: 'Users' },
            { page: 'settings', icon: 'fa-cog', label: 'Settings' }
        ];
        
        const nav = document.createElement('nav');
        nav.className = 'owner-bottom-nav';
        nav.innerHTML = items.map(item => `
            <div class="owner-bottom-nav-item ${item.page === state.currentPage ? 'active' : ''}" 
                 data-page="${item.page}">
                <i class="fas ${item.icon}"></i>
                <span>${item.label}</span>
            </div>
        `).join('');
        
        document.body.appendChild(nav);
        
        nav.querySelectorAll('.owner-bottom-nav-item').forEach(item => {
            item.addEventListener('click', function() {
                const page = this.getAttribute('data-page');
                handleNavClick(page);
            });
        });
    }

    // ============================================
    // HANDLE NAV CLICK
    // ============================================
    function handleNavClick(page) {
        if (state.isSidebarOpen) closeSidebar();
        
        if (page === 'logout') {
            confirmLogout();
            return;
        }
        
        if (page === state.currentPage) return;
        
        window.location.href = page + '.html';
    }

    // ============================================
    // CONFIRM LOGOUT
    // ============================================
    function confirmLogout() {
        // Tumia global confirm kama ipo
        if (typeof showConfirm === 'function') {
            showConfirm(
                'Toka kwenye Panel?',
                'Una uhakika unataka kutoka?',
                'warning',
                performLogout
            );
            return;
        }
        
        // Fallback
        if (confirm('Una uhakika unataka kutoka?')) {
            performLogout();
        }
    }

    function performLogout() {
        sessionStorage.clear();
        localStorage.removeItem('kmca_owner');
        localStorage.removeItem('kmca_owner_backup');
        localStorage.removeItem('kmca_owner_backup_time');
        localStorage.removeItem('kmca_owner_locked');
        localStorage.removeItem('kmca_owner_last_activity');
        window.location.href = 'index.html';
    }

    // ============================================
    // BUILD NOTIFICATIONS MODAL
    // ============================================
    function buildNotificationsModal() {
        if (document.getElementById('ownerNotificationsModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'ownerNotificationsModal';
        modal.className = 'owner-notifications-modal';
        modal.innerHTML = `
            <div class="owner-notifications-content">
                <div class="owner-notifications-header">
                    <h3>
                        <i class="fas fa-bell"></i>
                        Notifications
                    </h3>
                    <div class="owner-notifications-actions">
                        <button class="owner-notifications-mark-read" id="ownerNotifMarkRead" title="Mark all as read">
                            <i class="fas fa-check-double"></i>
                        </button>
                        <button class="owner-notifications-close" id="ownerNotifClose" aria-label="Funga">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="owner-notifications-list" id="ownerNotifList">
                    <div class="owner-notifications-empty">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Inapakia...</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('ownerNotifClose').addEventListener('click', closeNotifications);
        document.getElementById('ownerNotifMarkRead').addEventListener('click', markAllRead);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeNotifications();
        });
    }

    // ============================================
    // LOAD NOTIFICATIONS
    // ============================================
    async function loadNotifications() {
        if (!state.owner) return;
        if (typeof supabaseClient === 'undefined') {
            console.warn('⚠️ supabaseClient not available');
            return;
        }
        
        try {
            const { data, error } = await supabaseClient
                .from('notifications')
                .select('*')
                .eq('user_id', state.owner.id)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (error) throw error;
            
            state.notifications = data || [];
            renderNotifications();
            updateNotificationBadge();
        } catch (e) {
            console.error('Load notifications error:', e);
        }
    }

    // ============================================
    // RENDER NOTIFICATIONS
    // ============================================
    function renderNotifications() {
        const list = document.getElementById('ownerNotifList');
        if (!list) return;
        
        if (state.notifications.length === 0) {
            list.innerHTML = `
                <div class="owner-notifications-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>Hakuna notifications</p>
                </div>
            `;
            return;
        }
        
        const icons = {
            'post': 'fa-newspaper',
            'post_created': 'fa-newspaper',
            'poll': 'fa-vote-yea',
            'event': 'fa-calendar',
            'bible_verse': 'fa-bible',
            'daily_verse': 'fa-bible',
            'song': 'fa-music',
            'daily_wimbo': 'fa-music',
            'masomo': 'fa-book-open',
            'saint': 'fa-cross',
            'daily_saint': 'fa-cross',
            'announcement': 'fa-bullhorn',
            'tangazo': 'fa-bullhorn',
            'system': 'fa-info-circle',
            'pwa_update': 'fa-sync',
            'like': 'fa-heart',
            'comment': 'fa-comment',
            'share': 'fa-share',
            'message': 'fa-comment-dots'
        };
        
        list.innerHTML = state.notifications.map((notif, idx) => {
            const icon = icons[notif.type] || 'fa-bell';
            const timeAgo = getTimeAgo(notif.created_at);
            const link = getNotificationLink(notif);
            
            return `
                <div class="owner-notification-item ${!notif.is_read ? 'unread' : ''}" 
                     data-id="${notif.id}" 
                     data-link="${link || ''}"
                     style="animation-delay: ${Math.min(idx * 0.03, 0.5)}s">
                    <div class="owner-notification-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="owner-notification-body">
                        <strong>${escapeHtml(notif.title || 'Notification')}</strong>
                        <p>${escapeHtml(notif.message || notif.content || '')}</p>
                        <span>${timeAgo}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        list.querySelectorAll('.owner-notification-item').forEach(item => {
            item.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const link = this.getAttribute('data-link');
                
                markRead(id);
                
                if (link) {
                    closeNotifications();
                    setTimeout(() => window.location.href = link, 200);
                }
            });
        });
    }

    // ============================================
    // GET NOTIFICATION LINK
    // ============================================
    function getNotificationLink(notif) {
        const type = notif.type || '';
        const id = notif.post_id || notif.poll_id || notif.event_id || 
                   notif.verse_id || notif.wimbo_id || notif.somo_id || 
                   notif.saint_id || notif.announcement_id;
        
        const links = {
            'post': 'home.html',
            'post_created': 'home.html',
            'poll': 'home.html',
            'event': id ? `matukio.html?id=${id}` : null,
            'bible_verse': id ? `bible.html?id=${id}` : null,
            'daily_verse': id ? `bible.html?id=${id}` : null,
            'song': id ? `wimbo.html?id=${id}` : null,
            'daily_wimbo': id ? `wimbo.html?id=${id}` : null,
            'masomo': id ? `masomo.html?id=${id}` : null,
            'saint': id ? `watakatifu.html?id=${id}` : null,
            'daily_saint': id ? `watakatifu.html?id=${id}` : null,
            'announcement': id ? `announcements.html?id=${id}` : null
        };
        
        return links[type] || null;
    }

    // ============================================
    // MARK READ
    // ============================================
    async function markRead(id) {
        if (typeof supabaseClient === 'undefined') return;
        
        try {
            await supabaseClient
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);
            
            const notif = state.notifications.find(n => n.id === id);
            if (notif) notif.is_read = true;
            
            renderNotifications();
            updateNotificationBadge();
        } catch (e) {
            console.error('Mark read error:', e);
        }
    }

    async function markAllRead() {
        if (!state.owner) return;
        if (typeof supabaseClient === 'undefined') return;
        
        try {
            await supabaseClient
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', state.owner.id)
                .eq('is_read', false);
            
            state.notifications.forEach(n => n.is_read = true);
            renderNotifications();
            updateNotificationBadge();
            
            if (typeof showToast === 'function') {
                showToast('Zote zimesomwa', 'success');
            }
        } catch (e) {
            console.error('Mark all error:', e);
        }
    }

    // ============================================
    // UPDATE BADGE
    // ============================================
    function updateNotificationBadge() {
        const unreadCount = state.notifications.filter(n => !n.is_read).length;
        
        // Badge kwenye header (kama ipo)
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
        
        // Badge kwenye bottom nav (kama ina notifications)
        const bottomNavNotif = document.querySelector('.owner-bottom-nav-item[data-page="settings"]');
        // Unaweza kuongeza badge hapa kama unataka
    }

    // ============================================
    // OPEN/CLOSE NOTIFICATIONS
    // ============================================
    function openNotifications() {
        const modal = document.getElementById('ownerNotificationsModal');
        if (modal) modal.classList.add('active');
        loadNotifications();
    }

    function closeNotifications() {
        const modal = document.getElementById('ownerNotificationsModal');
        if (modal) modal.classList.remove('active');
    }

    // ============================================
    // SUBSCRIBE TO NOTIFICATIONS (Realtime)
    // ============================================
    function subscribeToNotifications() {
        if (!state.owner) return;
        if (typeof supabaseClient === 'undefined') return;
        
        if (state.notificationSub) {
            state.notificationSub.unsubscribe();
        }
        
        state.notificationSub = supabaseClient
            .channel('owner-nav-notifs')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${state.owner.id}`
            }, payload => {
                state.notifications.unshift(payload.new);
                renderNotifications();
                updateNotificationBadge();
                
                if (typeof showToast === 'function' && payload.new.title) {
                    showToast('🔔 ' + payload.new.title, 'info');
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${state.owner.id}`
            }, () => {
                loadNotifications();
            })
            .subscribe();
    }

    // ============================================
    // SETUP GLOBAL EVENTS
    // ============================================
    function setupGlobalEvents() {
        // Notification button kama ipo kwenye HTML
        const notifBtn = document.getElementById('notificationBtn');
        if (notifBtn) {
            notifBtn.addEventListener('click', openNotifications);
        }
        
        // Escape key
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                if (state.isSidebarOpen) closeSidebar();
                closeNotifications();
            }
        });
        
        // Swipe to close sidebar
        setupSidebarSwipe();
    }

    // ============================================
    // SIDEBAR SWIPE
    // ============================================
    function setupSidebarSwipe() {
        const sidebar = document.getElementById('ownerSidebar');
        if (!sidebar) return;
        
        let touchStartX = 0;
        let touchEndX = 0;
        
        sidebar.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        sidebar.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            
            if (diff > 80) {
                closeSidebar();
            }
        }, { passive: true });
    }

    // ============================================
    // ACTIVITY TRACKER (Session timeout)
    // ============================================
    function setupActivityTracker() {
        const timeout = (window.HOSTING_CONFIG?.session?.timeoutMs) || 5 * 60 * 1000;
        let lastActivity = Date.now();
        
        function updateActivity() {
            lastActivity = Date.now();
            localStorage.setItem('kmca_owner_last_activity', String(lastActivity));
        }
        
        ['click', 'touchstart', 'keydown', 'scroll'].forEach(event => {
            document.addEventListener(event, updateActivity, { passive: true });
        });
        
        setInterval(() => {
            const elapsed = Date.now() - lastActivity;
            if (elapsed >= timeout) {
                console.log('⏰ Session expired');
                performLogout();
            }
        }, 30 * 1000);
        
        updateActivity();
    }

    // ============================================
    // HELPERS
    // ============================================
    function getInitials(jina) {
        if (!jina) return '??';
        const cleaned = jina.trim().replace(/\s+/g, ' ');
        const names = cleaned.split(' ');
        
        if (names.length >= 2) {
            return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
        }
        if (names.length === 1 && names[0].length >= 2) {
            return names[0].substring(0, 2).toUpperCase();
        }
        return '??';
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getTimeAgo(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'Sasa hivi';
        if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
        if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
        if (seconds < 604800) return Math.floor(seconds / 86400) + 'd';
        
        return date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short' });
    }

    // ============================================
    // AUTO-INIT
    // ============================================
    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    ready(() => {
        // Subiri supabaseClient ikiwa lazy-loaded
        setTimeout(init, 50);
    });

    // ============================================
    // EXPORT GLOBAL
    // ============================================
    window.ownerNav = {
        init,
        openSidebar,
        closeSidebar,
        openNotifications,
        closeNotifications,
        performLogout,
        refreshNotifications: loadNotifications
    };

    window.openOwnerSidebar = openSidebar;
    window.closeOwnerSidebar = closeSidebar;
    window.openOwnerNotifications = openNotifications;
    window.closeOwnerNotifications = closeNotifications;
    window.performOwnerLogout = performLogout;

    console.log('✅ OWNER_NAV v4.0 loaded (with CSS)');

})();