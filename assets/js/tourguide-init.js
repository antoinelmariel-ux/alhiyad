(function () {
    const DEFAULT_TOURS = [
        {
            id: 'tour-general',
            name: 'Vue d’ensemble',
            description: 'Présentation rapide des zones principales de la cartographie des risques et compliance Al Hiyad.',
            status: 'active',
            steps: [
                {
                    title: 'Bienvenue',
                    content: 'Ce guide présente les zones principales de la cartographie des risques et compliance Al Hiyad.',
                    target: '.header-title',
                    order: 1,
                    zoom: 100,
                },
                {
                    title: 'Navigation',
                    content: 'Utilisez ces onglets pour passer du tableau de bord aux interviews, matrices, risques, contrôles, plans d’action, légendes et paramètres.',
                    target: '.nav-tabs',
                    order: 2,
                    zoom: 100,
                },
                {
                    title: 'Tableau de bord',
                    content: 'Le tableau de bord synthétise les indicateurs clés, les risques prioritaires et les alertes récentes.',
                    target: '#dashboard-tab .toolbar',
                    order: 3,
                    zoom: 100,
                },
                {
                    title: 'Exporter les données',
                    content: 'Ce bouton permet d’enregistrer et d’exporter les données opérationnelles de la cartographie.',
                    target: '.header-buttons .btn-primary',
                    order: 4,
                    zoom: 110,
                },
                {
                    title: 'Relancer l’explication',
                    content: 'Vous pourrez relancer ce tour guidé à tout moment depuis le bouton “Lancer l’explication”.',
                    target: '#tourGuideLaunchButton',
                    order: 5,
                    zoom: 110,
                },
            ],
        },
        {
            id: 'tour-administration',
            name: 'Administration des tours',
            description: 'Explique comment créer, capturer, modifier puis exporter plusieurs tours guidés.',
            status: 'active',
            steps: [
                {
                    title: 'Ouvrir l’administration',
                    content: 'L’onglet Administration centralise les paramètres et le nouveau studio de tours guidés.',
                    target: '.tab[onclick="switchTab(\'config\')"]',
                    order: 1,
                    zoom: 105,
                },
                {
                    title: 'Créer un tour',
                    content: 'Dans “Tours guidés”, créez un parcours, lancez une capture, puis parcourez l’application : chaque clic devient une étape modifiable.',
                    target: '#tourGuideLaunchButton',
                    order: 2,
                    zoom: 100,
                },
            ],
        },
    ];

    const TOUR_BASE_OPTIONS = {
        nextLabel: 'Suivant',
        prevLabel: 'Précédent',
        finishLabel: 'Terminer',
        closeButton: true,
        keyboardControl: true,
        showStepDots: true,
        showStepProgress: true,
        progressBar: true,
        rememberStep: false,
        dialogWidth: 420,
        targetPadding: 10,
    };

    const CAPTURE_DEFAULTS = {
        titlePrefix: 'Étape',
        defaultDescription: 'Décrivez ici l’action capturée, le résultat attendu et les points d’attention.',
    };

    let tourGuideClient = null;
    let activeTourId = '';
    let captureState = {
        active: false,
        paused: false,
        tourId: '',
    };

    function clone(value) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (error) {
            return value;
        }
    }

    function slugify(value) {
        return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || `tour-${Date.now()}`;
    }

    function notify(type, message) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(type, message);
            return;
        }
        if (type === 'error' || type === 'warning') {
            window.alert(message);
        } else {
            console.info(message);
        }
    }

    function getConfiguredTours() {
        const configured = window.rms?.config?.guidedTours;
        if (Array.isArray(configured) && configured.length) {
            return configured;
        }
        return DEFAULT_TOURS;
    }

    function ensureGuidedToursConfig(instance = window.rms) {
        if (!instance || !instance.config) {
            return clone(DEFAULT_TOURS);
        }
        if (!Array.isArray(instance.config.guidedTours) || !instance.config.guidedTours.length) {
            instance.config.guidedTours = clone(DEFAULT_TOURS);
        }
        instance.config.guidedTours = instance.config.guidedTours.map(normalizeTour).filter(Boolean);
        if (!instance.config.guidedTours.length) {
            instance.config.guidedTours = clone(DEFAULT_TOURS);
        }
        return instance.config.guidedTours;
    }

    function normalizeTour(tour, index = 0) {
        if (!tour || typeof tour !== 'object') {
            return null;
        }
        const name = String(tour.name || tour.title || `Tour ${index + 1}`).trim();
        const id = String(tour.id || slugify(name)).trim();
        const steps = Array.isArray(tour.steps) ? tour.steps : [];
        return {
            id,
            name,
            description: String(tour.description || '').trim(),
            status: tour.status === 'draft' ? 'draft' : 'active',
            createdAt: tour.createdAt || new Date().toISOString(),
            updatedAt: tour.updatedAt || new Date().toISOString(),
            steps: steps.map(normalizeStep).filter(Boolean).map((step, stepIndex) => ({
                ...step,
                order: stepIndex + 1,
            })),
        };
    }

    function normalizeStep(step, index = 0) {
        if (!step || typeof step !== 'object') {
            return null;
        }
        const target = String(step.target || '').trim();
        if (!target) {
            return null;
        }
        const zoom = Math.min(160, Math.max(60, parseInt(step.zoom, 10) || 100));
        return {
            title: String(step.title || `${CAPTURE_DEFAULTS.titlePrefix} ${index + 1}`).trim(),
            content: String(step.content || step.description || CAPTURE_DEFAULTS.defaultDescription).trim(),
            target,
            order: parseInt(step.order, 10) || index + 1,
            zoom,
        };
    }

    function getTourById(tourId) {
        const tours = getConfiguredTours();
        return tours.find(tour => tour.id === tourId) || tours.find(tour => tour.status !== 'draft') || tours[0] || null;
    }

    function getLaunchableTours() {
        return getConfiguredTours().filter(tour => Array.isArray(tour.steps) && tour.steps.length && tour.status !== 'draft');
    }

    function getStepPadding(step) {
        const zoom = parseInt(step?.zoom, 10) || 100;
        return Math.max(4, Math.round(18 - ((zoom - 60) / 100) * 12));
    }

    function buildTourOptions(tour) {
        const steps = (tour?.steps || [])
            .map(normalizeStep)
            .filter(Boolean)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(step => ({
                title: step.title,
                content: step.content,
                target: step.target,
                order: step.order,
                targetPadding: getStepPadding(step),
            }));

        const averageZoom = steps.length
            ? (tour.steps.reduce((sum, step) => sum + (parseInt(step.zoom, 10) || 100), 0) / tour.steps.length)
            : 100;

        return {
            ...TOUR_BASE_OPTIONS,
            steps,
            dialogWidth: averageZoom > 120 ? 460 : TOUR_BASE_OPTIONS.dialogWidth,
            targetPadding: averageZoom > 115 ? 6 : TOUR_BASE_OPTIONS.targetPadding,
        };
    }

    function notifyTourGuideUnavailable() {
        notify('warning', 'Le module TourGuide JS est indisponible. Vérifiez la connexion au CDN puis réessayez.');
    }

    function createTourGuideClient(tour) {
        if (!window.tourguide || typeof window.tourguide.TourGuideClient !== 'function') {
            return null;
        }

        tourGuideClient = new window.tourguide.TourGuideClient(buildTourOptions(tour));
        return tourGuideClient;
    }

    function startTourGuide(tourId = activeTourId) {
        const launchableTours = getLaunchableTours();
        if (!launchableTours.length) {
            notify('warning', 'Aucun tour actif avec étapes n’est disponible. Créez ou activez un tour dans Administration > Tours guidés.');
            return;
        }

        const tour = getTourById(tourId) || launchableTours[0];
        activeTourId = tour.id;

        const firstTarget = tour.steps?.[0]?.target || '';
        if (firstTarget.includes('config') && typeof window.switchTab === 'function') {
            window.switchTab('config');
        } else if (typeof window.switchTab === 'function') {
            window.switchTab('dashboard');
        }

        const client = createTourGuideClient(tour);
        if (!client || typeof client.start !== 'function') {
            notifyTourGuideUnavailable();
            return;
        }

        client.start();
    }

    function renderTourLauncherMenu() {
        const launchButton = document.getElementById('tourGuideLaunchButton');
        if (!launchButton || document.getElementById('tourGuideLauncherSelect')) {
            return;
        }
        const select = document.createElement('select');
        select.id = 'tourGuideLauncherSelect';
        select.className = 'tour-guide-launcher-select';
        select.title = 'Choisir le tour guidé à lancer';
        select.addEventListener('change', () => {
            activeTourId = select.value;
        });
        launchButton.insertAdjacentElement('beforebegin', select);
        refreshTourLauncherMenu();
    }

    function refreshTourLauncherMenu() {
        const select = document.getElementById('tourGuideLauncherSelect');
        if (!select) {
            return;
        }
        const tours = getLaunchableTours();
        select.innerHTML = '';
        tours.forEach((tour) => {
            const option = document.createElement('option');
            option.value = tour.id;
            option.textContent = tour.name;
            select.appendChild(option);
        });
        if (!activeTourId || !tours.some(tour => tour.id === activeTourId)) {
            activeTourId = tours[0]?.id || '';
        }
        select.value = activeTourId;
        select.disabled = tours.length <= 1;
    }

    function initTourGuideButton() {
        ensureGuidedToursConfig();
        renderTourLauncherMenu();
        const launchButton = document.getElementById('tourGuideLaunchButton');
        if (!launchButton) {
            return;
        }

        launchButton.addEventListener('click', () => startTourGuide(activeTourId));
        window.setTimeout(() => {
            ensureGuidedToursConfig();
            refreshTourLauncherMenu();
        }, 0);
    }


    function escapeCssIdentifier(value) {
        if (window.CSS && typeof window.CSS.escape === 'function') {
            return window.CSS.escape(String(value));
        }
        return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
    }

    function escapeCssString(value) {
        return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    function getElementSelector(element) {
        if (!(element instanceof Element)) {
            return '';
        }
        if (element.id) {
            return `#${escapeCssIdentifier(element.id)}`;
        }

        const dataTour = element.getAttribute('data-tour-target') || element.getAttribute('aria-label');
        if (dataTour) {
            const attr = element.getAttribute('data-tour-target') ? 'data-tour-target' : 'aria-label';
            return `${element.tagName.toLowerCase()}[${attr}="${escapeCssString(dataTour)}"]`;
        }

        const parts = [];
        let current = element;
        while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body && parts.length < 4) {
            let selector = current.tagName.toLowerCase();
            const usefulClasses = Array.from(current.classList || [])
                .filter(className => !/^(active|show|dragging|selected|open)$/.test(className))
                .slice(0, 2);
            if (usefulClasses.length) {
                selector += `.${usefulClasses.map(className => escapeCssIdentifier(className)).join('.')}`;
            }
            const parent = current.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children).filter(child => child.tagName === current.tagName);
                if (siblings.length > 1) {
                    selector += `:nth-of-type(${siblings.indexOf(current) + 1})`;
                }
            }
            parts.unshift(selector);
            current = parent;
        }
        return parts.join(' > ');
    }

    function getReadableLabel(element) {
        if (!(element instanceof Element)) {
            return '';
        }
        const label = element.getAttribute('aria-label')
            || element.getAttribute('title')
            || element.textContent
            || element.getAttribute('placeholder')
            || element.id
            || element.className;
        return String(label || '').replace(/\s+/g, ' ').trim().slice(0, 90);
    }

    function isCaptureControl(element) {
        return Boolean(element?.closest?.('.tour-capture-bar, .tour-admin-card, .tour-step-editor, .config-section-tabs, #tourGuideLauncherSelect, #tourGuideLaunchButton'));
    }

    function getCaptureTour() {
        const tours = ensureGuidedToursConfig();
        return tours.find(tour => tour.id === captureState.tourId) || null;
    }

    function addCapturedStep(event) {
        if (!captureState.active || captureState.paused || isCaptureControl(event.target)) {
            return;
        }
        const tour = getCaptureTour();
        if (!tour) {
            return;
        }
        const selector = getElementSelector(event.target);
        if (!selector) {
            return;
        }
        const label = getReadableLabel(event.target);
        tour.steps.push({
            title: `${CAPTURE_DEFAULTS.titlePrefix} ${tour.steps.length + 1}${label ? ` — ${label}` : ''}`,
            content: CAPTURE_DEFAULTS.defaultDescription,
            target: selector,
            order: tour.steps.length + 1,
            zoom: 100,
        });
        touchTour(tour);
        persistTourChanges('Étape capturée. Vous pouvez la modifier dans le studio de tours.', false);
    }

    function touchTour(tour) {
        if (tour) {
            tour.updatedAt = new Date().toISOString();
        }
    }

    function persistTourChanges(message, shouldRender = false) {
        if (window.rms && typeof window.rms.saveConfig === 'function') {
            window.rms.saveConfig();
        }
        refreshTourLauncherMenu();
        if (shouldRender && window.rms?.currentConfigSection === 'guidedTours' && typeof window.rms.renderConfiguration === 'function') {
            window.rms.renderConfiguration();
        }
        if (message) {
            notify('success', message);
        }
    }

    function ensureCaptureBar() {
        let bar = document.getElementById('tourCaptureBar');
        if (bar) {
            return bar;
        }
        bar = document.createElement('div');
        bar.id = 'tourCaptureBar';
        bar.className = 'tour-capture-bar';
        bar.innerHTML = `
            <div>
                <strong>Capture du tour en cours</strong>
                <span id="tourCaptureStatus">Chaque clic devient une étape.</span>
            </div>
            <div class="tour-capture-actions">
                <button class="btn btn-secondary btn-small" type="button" id="tourCapturePauseButton">Pause</button>
                <button class="btn btn-danger btn-small" type="button" id="tourCaptureStopButton">Arrêter</button>
            </div>
        `;
        document.body.appendChild(bar);
        document.getElementById('tourCapturePauseButton')?.addEventListener('click', () => {
            captureState.paused = !captureState.paused;
            updateCaptureBar();
        });
        document.getElementById('tourCaptureStopButton')?.addEventListener('click', stopCapture);
        return bar;
    }

    function updateCaptureBar() {
        const bar = ensureCaptureBar();
        bar.classList.toggle('paused', captureState.paused);
        const status = document.getElementById('tourCaptureStatus');
        const button = document.getElementById('tourCapturePauseButton');
        if (status) {
            const tour = getCaptureTour();
            status.textContent = captureState.paused
                ? `Capture en pause pour “${tour?.name || ''}”.`
                : `Chaque clic devient une étape pour “${tour?.name || ''}”.`;
        }
        if (button) {
            button.textContent = captureState.paused ? 'Reprendre' : 'Pause';
        }
    }

    function startCapture(tourId) {
        const tour = getTourById(tourId);
        if (!tour) {
            notify('warning', 'Créez d’abord un tour à capturer.');
            return;
        }
        captureState = { active: true, paused: false, tourId: tour.id };
        ensureCaptureBar();
        updateCaptureBar();
        document.addEventListener('click', addCapturedStep, true);
        notify('success', `Capture démarrée pour “${tour.name}”.`);
    }

    function stopCapture() {
        if (!captureState.active) {
            return;
        }
        document.removeEventListener('click', addCapturedStep, true);
        const tour = getCaptureTour();
        captureState = { active: false, paused: false, tourId: '' };
        document.getElementById('tourCaptureBar')?.remove();
        persistTourChanges(tour ? `Capture arrêtée : ${tour.steps.length} étape(s) dans “${tour.name}”.` : 'Capture arrêtée.', true);
    }

    function createTour() {
        const tours = ensureGuidedToursConfig();
        const name = window.prompt('Nom du nouveau tour guidé', `Nouveau tour ${tours.length + 1}`);
        if (!name || !name.trim()) {
            return;
        }
        let id = slugify(name);
        let suffix = 2;
        while (tours.some(tour => tour.id === id)) {
            id = `${slugify(name)}-${suffix}`;
            suffix += 1;
        }
        const now = new Date().toISOString();
        tours.push({
            id,
            name: name.trim(),
            description: 'Tour créé depuis le studio de capture.',
            status: 'draft',
            createdAt: now,
            updatedAt: now,
            steps: [],
        });
        persistTourChanges('Tour créé. Lancez la capture pour enregistrer le trajet.', true);
    }

    function deleteTour(tourId) {
        const tours = ensureGuidedToursConfig();
        const tour = tours.find(item => item.id === tourId);
        if (!tour || !window.confirm(`Supprimer le tour “${tour.name}” ?`)) {
            return;
        }
        const index = tours.findIndex(item => item.id === tourId);
        if (index >= 0) {
            tours.splice(index, 1);
            persistTourChanges('Tour supprimé.', true);
        }
    }

    function removeStep(tourId, stepIndex) {
        const tour = getTourById(tourId);
        if (!tour) return;
        tour.steps.splice(stepIndex, 1);
        tour.steps = tour.steps.map((step, index) => ({ ...step, order: index + 1 }));
        touchTour(tour);
        persistTourChanges('Étape supprimée.', true);
    }

    function updateTourField(tourId, field, value) {
        const tour = getTourById(tourId);
        if (!tour) return;
        tour[field] = field === 'status' && value !== 'draft' ? 'active' : value;
        touchTour(tour);
        persistTourChanges();
    }

    function updateStepField(tourId, stepIndex, field, value) {
        const tour = getTourById(tourId);
        if (!tour || !tour.steps[stepIndex]) return;
        tour.steps[stepIndex][field] = field === 'zoom' ? Math.min(160, Math.max(60, parseInt(value, 10) || 100)) : value;
        touchTour(tour);
        persistTourChanges();
    }

    function exportGuidedTours() {
        const tours = ensureGuidedToursConfig();
        const payload = {
            guidedTours: tours,
            exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
        const filename = `tours-guides-${new Date().toISOString().slice(0, 10)}.json`;
        if (typeof window.triggerBlobDownload === 'function') {
            window.triggerBlobDownload(blob, filename);
        } else {
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            setTimeout(() => { anchor.remove(); URL.revokeObjectURL(url); }, 0);
        }
        notify('success', 'Export JSON des tours guidés généré.');
    }

    function renderGuidedToursAdmin(container) {
        if (!(container instanceof HTMLElement)) {
            return;
        }
        const tours = ensureGuidedToursConfig();
        container.innerHTML = '';

        const intro = document.createElement('div');
        intro.className = 'config-section-description';
        intro.innerHTML = '<strong>Studio de tours guidés.</strong> Créez plusieurs parcours, lancez une capture façon Tango, mettez-la en pause ou arrêtez-la, puis retouchez chaque étape (description, cible, zoom ou suppression) avant export.';
        container.appendChild(intro);

        const toolbar = document.createElement('div');
        toolbar.className = 'tour-admin-toolbar';
        toolbar.innerHTML = `
            <button class="btn btn-primary" type="button" id="tourCreateButton">➕ Créer un tour</button>
            <button class="btn btn-outline" type="button" id="tourExportJsonButton">⬇️ Exporter la configuration des tours</button>
        `;
        container.appendChild(toolbar);
        toolbar.querySelector('#tourCreateButton')?.addEventListener('click', createTour);
        toolbar.querySelector('#tourExportJsonButton')?.addEventListener('click', exportGuidedTours);

        if (!tours.length) {
            const empty = document.createElement('div');
            empty.className = 'config-helper';
            empty.textContent = 'Aucun tour configuré. Créez un tour puis lancez une capture.';
            container.appendChild(empty);
            return;
        }

        const list = document.createElement('div');
        list.className = 'tour-admin-list';
        tours.forEach((tour) => {
            const card = document.createElement('article');
            card.className = 'tour-admin-card';
            card.innerHTML = `
                <div class="tour-admin-card-header">
                    <div class="form-group tour-admin-name">
                        <label class="form-label">Nom du tour</label>
                        <input class="form-input" value="${escapeHtml(tour.name)}" data-tour-field="name">
                    </div>
                    <div class="form-group tour-admin-status">
                        <label class="form-label">Statut</label>
                        <select class="form-select" data-tour-field="status">
                            <option value="active"${tour.status !== 'draft' ? ' selected' : ''}>Actif</option>
                            <option value="draft"${tour.status === 'draft' ? ' selected' : ''}>Brouillon</option>
                        </select>
                    </div>
                    <div class="tour-admin-actions">
                        <button class="btn btn-secondary btn-small" type="button" data-action="start">▶️ Tester</button>
                        <button class="btn btn-primary btn-small" type="button" data-action="capture">🎯 Capturer</button>
                        <button class="btn btn-danger btn-small" type="button" data-action="delete">Supprimer</button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-textarea" rows="2" data-tour-field="description">${escapeHtml(tour.description || '')}</textarea>
                </div>
                <div class="tour-step-summary">${tour.steps.length} étape(s) · Dernière modification ${formatDateTime(tour.updatedAt)}</div>
            `;

            card.querySelectorAll('[data-tour-field]').forEach((field) => {
                field.addEventListener('change', (event) => updateTourField(tour.id, field.dataset.tourField, event.target.value));
                field.addEventListener('blur', (event) => updateTourField(tour.id, field.dataset.tourField, event.target.value));
            });
            card.querySelector('[data-action="start"]')?.addEventListener('click', () => startTourGuide(tour.id));
            card.querySelector('[data-action="capture"]')?.addEventListener('click', () => startCapture(tour.id));
            card.querySelector('[data-action="delete"]')?.addEventListener('click', () => deleteTour(tour.id));

            const steps = document.createElement('div');
            steps.className = 'tour-step-editor';
            if (!tour.steps.length) {
                steps.innerHTML = '<div class="config-helper">Aucune étape. Cliquez sur “Capturer” puis naviguez dans l’application.</div>';
            } else {
                tour.steps.forEach((step, stepIndex) => {
                    const row = document.createElement('div');
                    row.className = 'tour-step-row';
                    row.innerHTML = `
                        <div class="tour-step-order">${stepIndex + 1}</div>
                        <div class="tour-step-fields">
                            <div class="form-grid">
                                <label class="form-group">
                                    <span class="form-label">Titre</span>
                                    <input class="form-input" value="${escapeHtml(step.title)}" data-step-field="title">
                                </label>
                                <label class="form-group">
                                    <span class="form-label">Cible CSS</span>
                                    <input class="form-input" value="${escapeHtml(step.target)}" data-step-field="target">
                                </label>
                                <label class="form-group">
                                    <span class="form-label">Zoom (${step.zoom || 100}%)</span>
                                    <input class="form-input" type="range" min="60" max="160" step="5" value="${step.zoom || 100}" data-step-field="zoom">
                                </label>
                            </div>
                            <label class="form-group">
                                <span class="form-label">Description</span>
                                <textarea class="form-textarea" rows="2" data-step-field="content">${escapeHtml(step.content)}</textarea>
                            </label>
                        </div>
                        <button class="btn btn-danger btn-small" type="button" data-step-delete>Supprimer</button>
                    `;
                    row.querySelectorAll('[data-step-field]').forEach((field) => {
                        const handler = (event) => updateStepField(tour.id, stepIndex, field.dataset.stepField, event.target.value);
                        field.addEventListener(field.type === 'range' ? 'input' : 'change', handler);
                        field.addEventListener('blur', handler);
                    });
                    row.querySelector('[data-step-delete]')?.addEventListener('click', () => removeStep(tour.id, stepIndex));
                    steps.appendChild(row);
                });
            }
            card.appendChild(steps);
            list.appendChild(card);
        });
        container.appendChild(list);
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatDateTime(value) {
        if (!value) return '—';
        try {
            return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
        } catch (error) {
            return value;
        }
    }

    function patchRiskManagementSystem() {
        const Klass = window.RiskManagementSystem;
        if (!Klass || Klass.prototype.__guidedToursPatched) {
            return;
        }

        const originalGetDefaultConfig = Klass.prototype.getDefaultConfig;
        Klass.prototype.getDefaultConfig = function patchedGetDefaultConfig(...args) {
            const config = originalGetDefaultConfig.apply(this, args);
            const parameterTours = window.RMS_DEFAULT_PARAMETER_CONFIG?.guidedTours;
            config.guidedTours = Array.isArray(parameterTours) && parameterTours.length
                ? clone(parameterTours).map(normalizeTour).filter(Boolean)
                : clone(DEFAULT_TOURS);
            return config;
        };

        const originalEnsureConfigStructure = Klass.prototype.ensureConfigStructure;
        Klass.prototype.ensureConfigStructure = function patchedEnsureConfigStructure(defaultConfig, ...args) {
            let updated = originalEnsureConfigStructure.call(this, defaultConfig, ...args);
            const fallbackTours = Array.isArray(defaultConfig?.guidedTours) && defaultConfig.guidedTours.length
                ? defaultConfig.guidedTours
                : DEFAULT_TOURS;
            if (!Array.isArray(this.config.guidedTours) || !this.config.guidedTours.length) {
                this.config.guidedTours = clone(fallbackTours);
                updated = true;
            }
            this.config.guidedTours = this.config.guidedTours.map(normalizeTour).filter(Boolean);
            return updated;
        };

        Klass.prototype.__guidedToursPatched = true;
    }

    patchRiskManagementSystem();
    document.addEventListener('DOMContentLoaded', initTourGuideButton);
    window.startTourGuide = startTourGuide;
    window.renderGuidedToursAdmin = renderGuidedToursAdmin;
    window.exportGuidedTours = exportGuidedTours;
    window.ensureGuidedToursConfig = ensureGuidedToursConfig;
}());
