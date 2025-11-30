---
title: "KeySense AI - Free Competitor Keyword Gap Analyzer"
description: "Steal your competitor's best keywords instantly. The only free AI tool that analyzes content gaps without signup."
date: 2025-11-30
draft: false
layout: "index"
---

<!-- START OF KEYSENSE AI LANDING PAGE -->
<style>
    /* --- INLINE CSS FOR LANDING PAGE --- */
    :root {
        --ks-primary: #4F46E5; /* Indigo */
        --ks-accent: #FF642D; /* Semrush Orange */
        --ks-bg: #F9FAFB;
        --ks-card: #FFFFFF;
        --ks-text: #111827;
        --ks-text-muted: #6B7280;
    }

    /* Override Hugo Theme Wrapper */
    .keysense-wrapper {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        color: var(--ks-text);
        line-height: 1.5;
        max-width: 800px;
        margin: 0 auto;
        padding: 40px 20px;
    }

    /* HERO SECTION */
    .hero-section {
        text-align: center;
        margin-bottom: 40px;
    }
    
    .hero-h1 {
        font-size: 2.5rem;
        font-weight: 800;
        letter-spacing: -0.025em;
        margin-bottom: 1rem;
        color: var(--ks-text);
        line-height: 1.2;
    }
    
    .hero-sub {
        font-size: 1.125rem;
        color: var(--ks-text-muted);
        max-width: 600px;
        margin: 0 auto;
    }

    /* APP CONTAINER */
    .app-container {
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        overflow: hidden;
        background: var(--ks-card);
        margin-bottom: 60px;
        border: 1px solid #E5E7EB;
    }

    /* TOP HALF: OPAL EMBED AREA */
    .opal-embed-area {
        background: #fff;
        min-height: 500px; /* Dovolj prostora za Opal */
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0;
        width: 100%;
    }

    /* To zagotovi, da je iframe čez celo širino */
    .opal-embed-area iframe {
        width: 100%;
        height: 500px; /* Prilagodi, če je tvoj Opal višji/nižji */
        border: none;
    }

    /* Placeholder, dokler ne vstaviš kode */
    .placeholder-box {
        border: 2px dashed #E5E7EB;
        padding: 40px;
        text-align: center;
        color: var(--ks-text-muted);
        border-radius: 8px;
        width: 80%;
        margin: 20px;
    }

    /* BOTTOM HALF: THE "LOCKED" SECTION */
    .locked-data-area {
        position: relative;
        padding: 20px 30px 40px;
        background: #fff;
        border-top: 1px solid #F3F4F6;
    }

    .data-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid #F3F4F6;
    }

    .data-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .badge-lock {
        background: #FEF2F2;
        color: #DC2626;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 99px;
    }

    /* FAKE DATA ROWS */
    .fake-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #F9FAFB;
        font-family: monospace;
        font-size: 0.9rem;
        color: var(--ks-text);
    }

    /* THE BLUR FILTER */
    .blur-zone {
        filter: blur(6px);
        opacity: 0.5;
        pointer-events: none;
        user-select: none;
    }

    /* THE CTA OVERLAY */
    .cta-overlay {
        position: absolute;
        top: 60px;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,1) 50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10;
        text-align: center;
        padding: 20px;
    }

    .lock-msg {
        font-weight: 800;
        font-size: 1.5rem;
        margin-bottom: 8px;
        color: var(--ks-text);
    }
    
    .lock-sub {
        font-size: 1rem;
        color: var(--ks-text-muted);
        margin-bottom: 24px;
        max-width: 380px;
        line-height: 1.4;
    }

    .affiliate-btn {
        background-color: var(--ks-accent);
        color: white !important;
        text-decoration: none;
        padding: 16px 32px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 1.1rem;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 14px rgba(255, 100, 45, 0.4);
        display: inline-block;
        border: none;
        cursor: pointer;
    }

    .affiliate-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 100, 45, 0.6);
        background-color: #ff551a;
    }
    
    .guarantee {
        margin-top: 12px;
        font-size: 0.8rem;
        color: var(--ks-text-muted);
    }

    /* HOW IT WORKS / SEO CONTENT */
    .how-it-works {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 30px;
        margin-top: 40px;
        text-align: left;
    }
    
    .step h4 {
        font-weight: 800;
        margin-bottom: 0.5rem;
        color: var(--ks-primary);
        font-size: 1.1rem;
    }
    
    .step p {
        font-size: 0.95rem;
        color: var(--ks-text-muted);
    }

    @media (max-width: 640px) {
        .how-it-works {
            grid-template-columns: 1fr;
            text-align: center;
        }
        .hero-h1 { font-size: 2rem; }
        .app-container { margin-left: -10px; margin-right: -10px; }
    }
</style>

<div class="keysense-wrapper">

    <!-- HERO SECTION -->
    <div class="hero-section">
        <h1 class="hero-h1">Steal Your Competitor's <span style="color: #4F46E5;">Best Keywords</span></h1>
        <p class="hero-sub">
            The only free AI tool that analyzes content gaps instantly. 
            Stop guessing. Start ranking.
        </p>
    </div>

    <!-- THE TOOL + LOCKED DATA -->
    <div class="app-container">
        
        <!-- 1. OPAL EMBED SECTION -->
<iframe 
    src="https://opal.google/_app/?flow=drive:/1YrniwQUme5qe_Mf6aQhg-fNCCfF98Jp-&shared&mode=app" 
    width="100%" 
    height="600" 
    style="border:none; border-radius: 8px; background-color: #f9fafb;"
    title="KeySense AI Tool"
    allow="clipboard-write">
</iframe>

        <!-- 2. THE PSYCHOLOGICAL LOCK (Spodnji del) -->
        <div class="locked-data-area">
            <div class="data-header">
                <h3>Hidden Opportunity Analysis</h3>
                <span class="badge-lock">PRO DATA LOCKED</span>
            </div>

            <div class="blur-zone">
                <!-- Ti podatki so zamegljeni, samo za izgled -->
                <div class="fake-row"><span>best crm for startups</span><span>Vol: 12k | KD: 84%</span></div>
                <div class="fake-row"><span>hubspot alternative</span><span>Vol: 5.1k | KD: 42%</span></div>
                <div class="fake-row"><span>email marketing tools</span><span>Vol: 22k | KD: 91%</span></div>
                <div class="fake-row"><span>sales funnel builder</span><span>Vol: 14k | KD: 78%</span></div>
                <div class="fake-row"><span>seo audit checklist</span><span>Vol: 8.9k | KD: 65%</span></div>
            </div>

            <div class="cta-overlay">
                <div class="lock-msg">🔒 997+ Keywords Hidden</div>
                <div class="lock-sub">
                    To see Search Volume, Keyword Difficulty (KD%), and backlink data, you need the live database.
                </div>
                
                <!-- !!! POZOR: TUKAJ ZAMENJAJ LINK !!! -->
                <a href="https://www.semrush.com/" class="affiliate-btn" target="_blank">
                    Unlock Full Report (Free Trial)
                </a>
                <!-- !!! KONEC ZAMENJAVE LINKA !!! -->

                <div class="guarantee">14-Day Free Trial • Cancel Anytime</div>
            </div>
        </div>
    </div>

    <!-- HOW IT WORKS -->
    <div class="how-it-works">
        <div class="step">
            <h4>1. Input URL</h4>
            <p>Paste any competitor's website. Our AI scans their visible content structure for weaknesses.</p>
        </div>
        <div class="step">
            <h4>2. AI Gap Analysis</h4>
            <p>KeySense identifies the "Money Keywords" they are targeting and the ones they missed.</p>
        </div>
        <div class="step">
            <h4>3. Unlock Profit</h4>
            <p>Get instant ideas, then use the pro tools to track volume and difficulty.</p>
        </div>
    </div>

</div>
<!-- END OF KEYSENSE AI LANDING PAGE -->


