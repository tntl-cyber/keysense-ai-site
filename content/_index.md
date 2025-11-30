---
title: "KeySense AI"
date: 2025-11-30
draft: false
layout: "index"
---

<style>
    /* GLOBAL RESET ZA TA DEL */
    .keysense-wrapper {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        color: #111827;
        line-height: 1.5;
        width: 100%;
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
    }

    /* HERO */
    .hero-section { text-align: center; margin-bottom: 40px; }
    .hero-h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; color: #111827; letter-spacing: -0.03em; line-height: 1.2; }
    .hero-sub { font-size: 1.1rem; color: #6B7280; max-width: 600px; margin: 0 auto; }

    /* APP CONTAINER */
    .app-container {
        background: #FFFFFF;
        border-radius: 16px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        margin-bottom: 60px;
        border: 1px solid #E5E7EB;
    }

    /* LAUNCHER AREA */
    .launcher-area {
        background: linear-gradient(135deg, #4F46E5 0%, #4338ca 100%);
        padding: 50px 20px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .launcher-title { color: white; font-size: 1.35rem; font-weight: 700; margin: 0 0 20px 0; }
    
    .fake-input-group {
        background: white;
        padding: 6px;
        border-radius: 10px;
        display: flex;
        width: 100%;
        max-width: 480px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        transition: transform 0.2s;
        cursor: pointer;
        text-decoration: none; /* Fix for link underline */
    }
    .fake-input-group:hover { transform: scale(1.02); }
    
    .fake-input-text { 
        flex-grow: 1; 
        text-align: left; 
        padding: 12px 15px; 
        color: #9CA3AF; 
        font-family: monospace; 
        font-size: 0.95rem;
        display: flex;
        align-items: center;
    }
    
    .launch-btn {
        background: #111827; 
        color: white; 
        padding: 10px 20px;
        border-radius: 6px; 
        font-weight: 700; 
        font-size: 0.9rem;
        white-space: nowrap;
    }

    /* LOCKED DATA AREA */
    .locked-data-area { padding: 20px 30px 40px; position: relative; background: #fff; }
    .data-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #F3F4F6; padding-bottom: 10px; }
    .data-header h3 { margin: 0; font-size: 1rem; font-weight: 700; }
    .badge-lock { background: #FEF2F2; color: #DC2626; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 99px; }
    
    .fake-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #F9FAFB; font-family: monospace; font-size: 0.9rem; color: #374151; }
    .blur-zone { filter: blur(5px); opacity: 0.6; user-select: none; }
    
    .cta-overlay {
        position: absolute; top: 70px; left: 0; right: 0; bottom: 0;
        background: linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,1) 50%);
        display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10;
        text-align: center;
    }
    .lock-msg { font-weight: 800; font-size: 1.4rem; margin-bottom: 8px; color: #111827; }
    
    .affiliate-btn {
        background-color: #FF642D; color: white !important; text-decoration: none;
        padding: 15px 30px; border-radius: 8px; font-weight: 700; font-size: 1.1rem;
        box-shadow: 0 4px 14px rgba(255, 100, 45, 0.4); margin-top: 10px; display: inline-block;
        border: none;
    }
    .affiliate-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 100, 45, 0.6); }

    /* HOW IT WORKS */
    .how-it-works { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; margin-top: 40px; text-align: left; }
    .step h4 { color: #4F46E5; margin-bottom: 0.5rem; font-weight: 800; }
    .step p { color: #6B7280; font-size: 0.95rem; line-height: 1.5; }

    @media (max-width: 640px) {
        .how-it-works { grid-template-columns: 1fr; text-align: center; }
        .hero-h1 { font-size: 2rem; }
        .keysense-wrapper { padding: 10px; }
    }
</style>

<div class="keysense-wrapper">

    <!-- HERO -->
    <div class="hero-section">
        <h1 class="hero-h1">Steal Your Competitor's <span style="color: #4F46E5;">Best Keywords</span></h1>
        <p class="hero-sub">The only free AI tool that analyzes content gaps instantly. Stop guessing.</p>
    </div>

    <!-- APP UI -->
    <div class="app-container">
        
        <!-- LAUNCHER (Opal Link) -->
        <div class="launcher-area">
            <h2 class="launcher-title">Enter Competitor URL to Start Analysis</h2>
            
            <!-- LINK TO OPAL APP -->
            <a href="https://opal.google/_app/?flow=drive:/1YrniwQUme5qe_Mf6aQhg-fNCCfF98Jp-&shared&mode=app" target="_blank" style="text-decoration: none;" class="fake-input-group">
                <div class="fake-input-text">https://competitor.com...</div>
                <div class="launch-btn">RUN AUDIT ⚡</div>
            </a>
            
            <div style="margin-top: 15px; font-size: 0.85rem; opacity: 0.8; color: white; display: flex; align-items: center; gap: 5px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                Powered by Google Opal (Secure Environment)
            </div>
        </div>

        <!-- LOCKED DATA -->
        <div class="locked-data-area">
            <div class="data-header">
                <h3>Hidden Opportunity Analysis</h3>
                <span class="badge-lock">PRO DATA LOCKED</span>
            </div>

            <div class="blur-zone">
                <div class="fake-row"><span>best crm for startups</span><span>Vol: 12k | KD: 84%</span></div>
                <div class="fake-row"><span>hubspot alternative</span><span>Vol: 5.1k | KD: 42%</span></div>
                <div class="fake-row"><span>email marketing tools</span><span>Vol: 22k | KD: 91%</span></div>
                <div class="fake-row"><span>sales funnel builder</span><span>Vol: 14k | KD: 78%</span></div>
                <div class="fake-row"><span>seo audit checklist</span><span>Vol: 8.9k | KD: 65%</span></div>
            </div>

            <div class="cta-overlay">
                <div class="lock-msg">🔒 997+ Keywords Hidden</div>
                <div style="color: #6B7280; margin-bottom: 20px; font-size: 0.95rem;">
                    Unlock Search Volume and Difficulty with the full database.
                </div>
                
                <!-- AFFILIATE LINK -->
                <a href="https://www.semrush.com/" class="affiliate-btn" target="_blank">
                    Unlock Full Report (Free Trial)
                </a>
                
                <div style="margin-top: 12px; font-size: 0.8rem; color: #6B7280;">14-Day Free Trial • Cancel Anytime</div>
            </div>
        </div>
    </div>

    <!-- STEPS -->
    <div class="how-it-works">
        <div class="step">
            <h4>1. Input URL</h4>
            <p>Click "Run Audit" to open the secure AI terminal. Paste any URL.</p>
        </div>
        <div class="step">
            <h4>2. AI Gap Analysis</h4>
            <p>KeySense identifies the "Money Keywords" they are targeting and missed.</p>
        </div>
        <div class="step">
            <h4>3. Unlock Profit</h4>
            <p>Come back here to unlock the full volume data with the Pro tool.</p>
        </div>
    </div>

</div>