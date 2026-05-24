(function () {
    const TOUR_STORAGE_KEY = 'rms.onboarding.tourConfig.v1';

    const defaultSteps = [
        { id: 'dashboard', tab: 'dashboard', element: '#tour-tab-dashboard', title: 'Tableau de bord', description: 'Vision globale des KPIs de risque.' },
        { id: 'interviews', tab: 'interviews', element: '#tour-tab-interviews', title: 'Entretiens', description: 'Collectez et exploitez les verbatims d’interviews.' },
        { id: 'matrixTab', tab: 'matrix', element: '#tour-tab-matrix', title: 'Matrice des risques', description: 'On va maintenant détailler cet onglet clé.' },
        { id: 'matrixBrut', tab: 'matrix', element: '#matrixGridBrut', title: 'Matrice du risque brut', description: 'Position initiale des risques avant prise en compte de la maîtrise.' },
        { id: 'matrixNet', tab: 'matrix', element: '#matrixGridNet', title: 'Matrice du risque net', description: 'Vue du risque après niveau de maîtrise actuel.' },
        { id: 'matrixPost', tab: 'matrix', element: '#matrixGridPost', title: 'Matrice après plan d’action', description: 'Projection de risque résiduel attendu après actions.' },
        { id: 'risksTab', tab: 'risks', element: '#tour-tab-risks', title: 'Registre des risques', description: 'Passons au détail d’un risque individuel.', side: 'bottom' },
        { id: 'riskViewBtn', tab: 'risks', element: '#risksTableBody tr:first-child .action-btn[title="Voir"]', title: 'Voir un risque', description: 'Cliquez sur Voir pour ouvrir la fiche complète.', action: 'openRiskView' },
        { id: 'riskViewEvolution', tab: 'risks', element: '#riskViewModal .risk-view-evolution-section', title: 'Lecture détaillée du risque', description: 'Retrouvez la matrice d’évolution et les informations générales / scoring.' },
        { id: 'riskEditBtn', tab: 'risks', element: '#riskViewModal .btn.btn-primary', title: 'Modifier ce risque', description: 'Le bouton Modifier ouvre la configuration complète du risque.', action: 'openRiskEdit' },
        { id: 'riskTheme', tab: 'risks', element: '#riskModal #riskTheme', title: 'Configuration – Thématique', description: 'Choisissez la thématique et les champs métiers associés.' },
        { id: 'riskBrutEdit', tab: 'risks', element: '#riskModal #riskMatrixEditBrut', title: 'Configuration – Matrice brute', description: 'Ajustez probabilité/impact directement dans la matrice brute.' },
        { id: 'riskMitigation', tab: 'risks', element: '#riskModal #mitigationSlider', title: 'Configuration – Niveau de maîtrise', description: 'Simulez l’effet des contrôles sur le risque net.' },
        { id: 'controlsTab', tab: 'controls', element: '#tour-tab-controls', title: 'Contrôles & atténuation', description: 'Catalogue et pilotage des contrôles.', action: 'closeRiskModal' },
        { id: 'plansTab', tab: 'plans', element: '#tour-tab-plans', title: 'Plans d’action', description: 'Suivi opérationnel des remédiations.' },
        { id: 'legendsTab', tab: 'legends', element: '#tour-tab-legends', title: 'Légendes', description: 'Référentiel de lecture des scores et niveaux.' }
    ];

    function switchAndWait(tabName) { if (typeof window.switchTab === 'function') { window.switchTab(tabName); } return new Promise((r) => window.setTimeout(r, 220)); }
    function waitForElement(selector, timeout = 3000) {
        return new Promise((resolve) => {
            const start = Date.now();
            const check = () => {
                const el = document.querySelector(selector);
                if (el) return resolve(el);
                if (Date.now() - start >= timeout) return resolve(null);
                window.setTimeout(check, 120);
            };
            check();
        });
    }

    function loadTourConfig() {
        try {
            const raw = localStorage.getItem(TOUR_STORAGE_KEY);
            if (!raw) return defaultSteps;
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed.steps) && parsed.steps.length ? parsed.steps : defaultSteps;
        } catch (error) {
            return defaultSteps;
        }
    }

    function saveTourConfig(steps) { localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify({ updatedAt: new Date().toISOString(), steps })); }

    async function runAction(action) {
        if (action === 'openRiskView') {
            const btn = await waitForElement('#risksTableBody tr:first-child .action-btn[title="Voir"]'); if (btn) btn.click(); await waitForElement('#riskViewModal.show', 2500);
        } else if (action === 'openRiskEdit') {
            const editBtn = document.querySelector('#riskViewModal .btn.btn-primary'); if (editBtn) editBtn.click(); await waitForElement('#riskModal.show', 2500);
        } else if (action === 'closeRiskModal') {
            if (typeof window.closeModal === 'function') window.closeModal('riskModal');
        }
    }

    function buildDriverSteps(tour, steps) {
        return steps.map((step) => ({
            element: step.element,
            popover: { title: step.title, description: step.description, side: step.side || 'bottom' },
            onNextClick: async () => { if (step.tab) await switchAndWait(step.tab); if (step.action) await runAction(step.action); tour.moveNext(); }
        }));
    }

    function startOnboardingTour() {
        if (!window.driver || typeof window.driver.js?.driver !== 'function') { alert('Driver.js n\'est pas chargé. Vérifiez la connexion internet.'); return; }
        const steps = loadTourConfig();
        const tour = window.driver.js.driver({ showProgress: true, animate: true, stagePadding: 8, nextBtnText: 'Suivant', prevBtnText: 'Précédent', doneBtnText: 'Terminer', steps: [] });
        tour.setConfig({ steps: buildDriverSteps(tour, steps) });
        tour.drive();
    }

    function renderTourAdmin() {
        const target = document.getElementById('configurationContainer');
        if (!target) return;
        const wrapper = document.createElement('section');
        wrapper.className = 'admin-section';
        wrapper.innerHTML = `
            <h3 class="admin-section-title">Administration du tour de démonstration</h3>
            <p class="config-helper">Gérez le tour complet (ordre, contenu, écrans ciblés). Format JSON.</p>
            <textarea id="tourConfigEditor" class="form-textarea" rows="14"></textarea>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" id="tourConfigResetBtn">Réinitialiser</button>
                <button type="button" class="btn btn-outline" id="tourConfigPreviewBtn">Prévisualiser le tour</button>
                <button type="button" class="btn btn-primary" id="tourConfigSaveBtn">Enregistrer la configuration</button>
            </div>
            <div id="tourConfigStatus" class="form-helper" role="status" aria-live="polite"></div>
        `;
        target.prepend(wrapper);

        const editor = wrapper.querySelector('#tourConfigEditor');
        const status = wrapper.querySelector('#tourConfigStatus');
        const syncEditor = () => { editor.value = JSON.stringify({ steps: loadTourConfig() }, null, 2); };
        const setStatus = (message, error = false) => { status.textContent = message; status.style.color = error ? '#b91c1c' : ''; };
        syncEditor();
        wrapper.querySelector('#tourConfigResetBtn').addEventListener('click', () => { saveTourConfig(defaultSteps); syncEditor(); setStatus('Configuration réinitialisée.'); });
        wrapper.querySelector('#tourConfigPreviewBtn').addEventListener('click', startOnboardingTour);
        wrapper.querySelector('#tourConfigSaveBtn').addEventListener('click', () => {
            try {
                const parsed = JSON.parse(editor.value);
                if (!Array.isArray(parsed.steps) || !parsed.steps.length) throw new Error('Le champ steps doit contenir au moins une étape.');
                parsed.steps.forEach((s, i) => { if (!s.element || !s.title || !s.description) throw new Error(`Étape ${i + 1} incomplète.`); });
                saveTourConfig(parsed.steps);
                setStatus('Configuration du tour enregistrée.');
            } catch (error) {
                setStatus(`Erreur: ${error.message}`, true);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const button = document.getElementById('startOnboardingTourBtn');
        if (button) button.addEventListener('click', startOnboardingTour);
        renderTourAdmin();
        window.startOnboardingTour = startOnboardingTour;
    });
})();
