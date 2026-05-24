(function () {
    const TOUR_STORAGE_KEY = 'rms.onboarding.tourConfig.v1';

    const defaultSteps = [
        { id: 'intro', tab: 'dashboard', element: '#startOnboardingTourBtn', title: 'Introduction', description: 'Bienvenue sur notre cartographie des risques du groupe Al Hiyad. Nous vous proposons une rapide explication sur le fonctionnement de notre outil.' },
        { id: 'dashboard', tab: 'dashboard', element: '#tour-tab-dashboard', title: 'Tableau de bord', description: 'Grâce au tableau de bord, vous aurez une vision globale de l’exposition du groupe aux risques éthiques.' },
        { id: 'interviews', tab: 'interviews', element: '#tour-tab-interviews', title: 'Entretiens', description: 'Cette section contient l’ensemble des comptes-rendus réalisés avec les collaborateurs du groupe. Ils démontrent la couverture de l’ensemble de nos processus.' },
        { id: 'matrixTab', tab: 'matrix', element: '#tour-tab-matrix', title: 'Matrice des risques', description: 'Retrouvez ici les risques éthiques du groupe présentés via 3 matrices. Vous avez la possibilité d’afficher l’ensemble des risques, ou de filtrer en fonction des thématiques, des entités concernées, pour une lecture adaptée à vos besoins.' },
        { id: 'matrixBrut', tab: 'matrix', element: '#matrixGridBrut', title: 'Matrice du risque brut', description: 'La matrice des risques bruts présente le positionnement des risques inhérents à notre groupe, en fonction de leur probabilité et de leur impact théorique, c-à-d en l’absence de mesure de maîtrise.' },
        { id: 'matrixNet', tab: 'matrix', element: '#matrixGridNet', title: 'Matrice du risque net', description: 'La matrice des risques nets présente les risques résiduels, c-à-d en tenant compte de l’efficacité de nos mesures de maîtrise.' },
        { id: 'matrixPost', tab: 'matrix', element: '#matrixGridPost', title: 'Matrice après plan d’action', description: 'Enfin, nous projetons ici les risques tels qu’ils seraient post mise en place des plans d’action déterminés et validés.' },
        { id: 'risksTab', tab: 'risks', element: '#tour-tab-risks', title: 'Registre des risques', description: 'Le registre des risques permet de revoir les informations risque par risque, avec des logiques de filtres plus précises.', side: 'bottom' },
        { id: 'riskViewBtn', tab: 'risks', element: '#risksTableBody tr:first-child .action-btn[title="Voir"]', title: 'Voir un risque', description: 'Cliquez sur Voir pour ouvrir la fiche complète.', action: 'openRiskView' },
        { id: 'riskViewEvolution', tab: 'risks', element: '#riskViewModal .risk-view-evolution-section', title: 'Lecture détaillée du risque', description: 'Retrouvez l’évolution des scores du brut au post plan d’action.' },
        { id: 'riskViewInfo', tab: 'risks', element: '#riskViewModal .risk-view-section', title: 'Informations', description: 'Retrouvez l’ensemble des informations indiquées pour ce risque.' },
        { id: 'riskEditBtn', tab: 'risks', element: '#riskViewModal .btn.btn-primary', title: 'Modifier ce risque', description: 'Le bouton permet de modifier le risque et de voir toutes les possibilités de la configuration.', action: 'openRiskEdit' },
        { id: 'riskTheme', tab: 'risks', element: '#riskModal #riskTheme', title: 'Configuration – Thématique', description: 'Choisissez la thématique et les champs métiers associés.' },
        { id: 'riskBrutEdit', tab: 'risks', element: '#riskModal #riskMatrixEditBrut', title: 'Configuration – Matrice brute', description: 'Ajustez probabilité/impact directement dans la matrice brute.' },
        { id: 'riskMitigation', tab: 'risks', element: '#riskModal #mitigationSlider', title: 'Configuration – Niveau de maîtrise', description: 'Indiquez le niveau de maîtrise pour passer du risque brut au risque net.' },
        { id: 'controlsTab', tab: 'controls', element: '#tour-tab-controls', title: 'Contrôles & atténuation', description: 'Vous avez à ce niveau la possibilité de rattacher des contrôles / mesures de prévention pour justifier votre positionnement.', action: 'closeRiskModal' },
        { id: 'controlCreateBtn', tab: 'controls', element: '#tour-open-control-modal-btn', title: 'Créer un contrôle', description: 'Depuis cet onglet, ouvrez la modal pour ajouter un nouveau contrôle.', action: 'openControlModal' },
        { id: 'controlModal', tab: 'controls', element: '#controlModal.show .modal-content', title: 'Modal de contrôle', description: 'La modal vous permet de saisir toutes les informations de contrôle sans quitter la SPA.', side: 'right' },
        { id: 'plansTab', tab: 'plans', element: '#tour-tab-plans', title: 'Plans d’action', description: 'Ajoutez des plans d’action.' , action: 'closeControlModal'},
        { id: 'planCreateBtn', tab: 'plans', element: '#tour-open-plan-modal-btn', title: 'Créer un plan d’action', description: 'Cet onglet centralise la création et le suivi des plans d’action.', action: 'openActionPlanModal' },
        { id: 'actionPlanModal', tab: 'plans', element: '#actionPlanModal.show .modal-content', title: 'Modal de plan d’action', description: 'Cette modal permet de décrire le plan, son responsable et son échéance, puis de revenir à la vue courante.', side: 'right' },
        { id: 'legendsTab', tab: 'legends', element: '#tour-tab-legends', title: 'Légendes', description: 'Retrouvez ici les échelles utilisées. Notez que les facteurs aggravants sont propres à chaque thématique de risque.' }
    ];

    function switchAndWait(tabName) { if (typeof window.switchTab === 'function') { window.switchTab(tabName); } return new Promise((r) => window.setTimeout(r, 220)); }
    function isElementVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    function waitForElement(selector, timeout = 3000, { visible = false } = {}) {
        return new Promise((resolve) => {
            const start = Date.now();
            const check = () => {
                const el = document.querySelector(selector);
                if (el && (!visible || isElementVisible(el))) return resolve(el);
                if (Date.now() - start >= timeout) return resolve(null);
                window.setTimeout(check, 120);
            };
            check();
        });
    }

    function normalizeSteps(steps) {
        if (!Array.isArray(steps) || !steps.length) return defaultSteps;
        return steps.map((step, index) => {
            const defaultStep = defaultSteps.find((item) => item.id === step.id) || defaultSteps[index] || {};
            return {
                ...defaultStep,
                ...step,
                tab: step.tab || defaultStep.tab || null
            };
        });
    }

    function loadTourConfig() {
        try {
            const raw = localStorage.getItem(TOUR_STORAGE_KEY);
            if (!raw) return defaultSteps;
            const parsed = JSON.parse(raw);
            return normalizeSteps(parsed.steps);
        } catch (error) {
            return defaultSteps;
        }
    }

    function saveTourConfig(steps) { localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify({ updatedAt: new Date().toISOString(), steps })); }

    async function runAction(action) {
        if (action === 'openRiskView') {
            const btn = await waitForElement('#risksTableBody tr:first-child .action-btn[title="Voir"]', 3000, { visible: true }); if (btn) btn.click(); await waitForElement('#riskViewModal.show', 2500, { visible: true });
        } else if (action === 'openRiskEdit') {
            const editBtn = await waitForElement('#riskViewModal .btn.btn-primary', 2500, { visible: true }); if (editBtn) editBtn.click(); await waitForElement('#riskModal.show', 2500, { visible: true });
        } else if (action === 'closeRiskModal') {
            if (typeof window.closeModal === 'function') window.closeModal('riskModal');
        } else if (action === 'openControlModal') {
            const btn = await waitForElement('#tour-open-control-modal-btn', 2500, { visible: true }); if (btn) btn.click(); await waitForElement('#controlModal.show', 2500, { visible: true });
        } else if (action === 'closeControlModal') {
            if (typeof window.closeModal === 'function') window.closeModal('controlModal');
        } else if (action === 'openActionPlanModal') {
            const btn = await waitForElement('#tour-open-plan-modal-btn', 2500, { visible: true }); if (btn) btn.click(); await waitForElement('#actionPlanModal.show', 2500, { visible: true });
        }
    }

    function clickTabElement(step) {
        if (!step?.element || !String(step.element).startsWith('#tour-tab-')) return;
        const target = document.querySelector(step.element);
        if (!isButtonLikeElement(target)) return;
        if (target.disabled || target.getAttribute('aria-disabled') === 'true') return;
        target.click();
    }

    async function prepareStepTransition(step) {
        if (step.tab) await switchAndWait(step.tab);
        clickTabElement(step);
        if (step.action) await runAction(step.action);
        if (step.element) {
            await waitForElement(step.element, 3200, { visible: true });
            const target = document.querySelector(step.element);
            if (target && typeof target.scrollIntoView === 'function') {
                target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                await new Promise((resolve) => window.setTimeout(resolve, 250));
            }
        }
    }

    function isButtonLikeElement(element) {
        if (!element || !element.tagName) return false;
        const tag = element.tagName.toLowerCase();
        return tag === 'button' || tag === 'summary' || element.getAttribute('role') === 'button';
    }

    function clickStepElementIfButton(step) {
        if (!step?.element) return;
        const target = document.querySelector(step.element);
        if (!isButtonLikeElement(target)) return;
        if (target.disabled || target.getAttribute('aria-disabled') === 'true') return;
        target.click();
    }

    function createTourGuideSteps(steps) {
        return steps.map((step, index) => ({
            title: step.title,
            content: step.description,
            target: step.element,
            order: index + 1
        }));
    }

    async function startOnboardingTour() {
        if (!window.tourguide || typeof window.tourguide.TourGuideClient !== 'function') { alert('TourGuideJS n\'est pas chargé. Vérifiez la connexion internet.'); return; }
        const steps = loadTourConfig();
        if (!steps.length) return;

        const tour = new window.tourguide.TourGuideClient({
            steps: createTourGuideSteps(steps),
            showStepProgress: true,
            showStepDots: true,
            nextLabel: 'Suivant',
            prevLabel: 'Précédent',
            finishLabel: 'Terminer',
            dialogAnimate: true,
            targetPadding: 8
        });

        let lastStep = -1;
        tour.onAfterStepChange(async () => {
            const activeIndex = Number(tour.activeStep);
            if (Number.isNaN(activeIndex) || activeIndex < 0 || activeIndex >= steps.length) return;
            if (activeIndex === lastStep) return;
            const currentStep = steps[activeIndex];
            await prepareStepTransition(currentStep);
            lastStep = activeIndex;
        });

        await prepareStepTransition(steps[0]);
        await tour.start();
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
