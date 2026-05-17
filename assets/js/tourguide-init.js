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
                    displayMode: 'focus',
                },
                {
                    title: 'Navigation',
                    content: 'Utilisez ces onglets pour passer du tableau de bord aux interviews, matrices, risques, contrôles, plans d’action, légendes et paramètres.',
                    target: '.nav-tabs',
                    order: 2,
                    displayMode: 'focus',
                },
                {
                    title: 'Tableau de bord',
                    content: 'Le tableau de bord synthétise les indicateurs clés, les risques prioritaires et les alertes récentes.',
                    target: '#dashboard-tab .toolbar',
                    order: 3,
                    displayMode: 'focus',
                },
                {
                    title: 'Exporter les données',
                    content: 'Ce bouton permet d’enregistrer et d’exporter les données opérationnelles de la cartographie.',
                    target: '.header-buttons .btn-primary',
                    order: 4,
                    displayMode: 'focus',
                },
                {
                    title: 'Relancer l’explication',
                    content: 'Vous pourrez relancer ce tour guidé à tout moment depuis le bouton “Lancer l’explication”.',
                    target: '#tourGuideLaunchButton',
                    order: 5,
                    displayMode: 'focus',
                    nextAction: 'next',
                    launchTourIds: [],
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
                    displayMode: 'focus',
                },
                {
                    title: 'Créer un tour',
                    content: 'Dans “Tours guidés”, créez un parcours, lancez une capture, puis parcourez l’application : chaque clic devient une étape modifiable.',
                    target: '#tourGuideLaunchButton',
                    order: 2,
                    displayMode: 'focus',
                },
            ],
        },
    ];

    const TOUR_FOCUS_BACKDROP_COLOR = 'rgba(20,20,21,0.84)';

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
        backdropColor: TOUR_FOCUS_BACKDROP_COLOR,
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
        insertAfterIndex: null,
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
            autoStartOnFirstVisit: tour.autoStartOnFirstVisit === true,
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
        const legacyZoom = Math.min(160, Math.max(60, parseInt(step.zoom, 10) || 100));
        const displayMode = step.displayMode === 'wide' || legacyZoom >= 120 ? 'wide' : 'focus';
        return {
            title: String(step.title || `${CAPTURE_DEFAULTS.titlePrefix} ${index + 1}`).trim(),
            content: String(step.content || step.description || CAPTURE_DEFAULTS.defaultDescription).trim(),
            target,
            order: parseInt(step.order, 10) || index + 1,
            displayMode,
            tab: typeof step.tab === 'string' ? step.tab.trim() : '',
            modal: typeof step.modal === 'string' ? step.modal.trim() : '',
            configSection: typeof step.configSection === 'string' ? step.configSection.trim() : '',
            nextAction: step.nextAction === 'launchTour' ? 'launchTour' : 'next',
            launchTourIds: normalizeLaunchTourIds(step.launchTourIds || step.launchTours || step.launchTourId),
        };
    }

    function normalizeLaunchTourIds(value) {
        const values = Array.isArray(value) ? value : (value ? [value] : []);
        return values
            .map(item => String(item || '').trim())
            .filter((item, index, list) => item && list.indexOf(item) === index);
    }

    function findTourById(tourId) {
        return getConfiguredTours().find(tour => tour.id === tourId) || null;
    }

    function getTourById(tourId) {
        const tours = getConfiguredTours();
        return findTourById(tourId) || tours.find(tour => tour.status !== 'draft') || tours[0] || null;
    }

    function getLaunchableTours() {
        return getConfiguredTours().filter(tour => Array.isArray(tour.steps) && tour.steps.length && tour.status !== 'draft');
    }

    function getStepPadding(step) {
        return step?.displayMode === 'wide' ? 6 : TOUR_BASE_OPTIONS.targetPadding;
    }

    function buildTourOptions(tour) {
        const steps = (tour?.steps || [])
            .map(normalizeStep)
            .filter(Boolean)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(step => ({
                title: step.title,
                content: buildStepContent(step, tour),
                target: step.target,
                order: step.order,
                targetPadding: getStepPadding(step),
                beforeEnter: () => prepareStepContext(step),
                sourceStep: step,
                afterEnter: () => nextFrame()
                    .then(() => applyStepDisplayMode(step))
                    .then(() => applyStepButtonBehavior(step))
                    .then(() => applyTourDialogErgonomics())
                    .then(() => refreshTourGuidePosition()),
            }));

        const hasWideSteps = steps.some(step => step.sourceStep?.displayMode === 'wide');

        return {
            ...TOUR_BASE_OPTIONS,
            steps,
            dialogWidth: hasWideSteps ? 460 : TOUR_BASE_OPTIONS.dialogWidth,
            targetPadding: hasWideSteps ? 6 : TOUR_BASE_OPTIONS.targetPadding,
        };
    }


    function nextFrame() {
        return new Promise(resolve => window.requestAnimationFrame(() => resolve(true)));
    }

    function refreshTourGuidePosition() {
        if (!tourGuideClient) {
            return Promise.resolve(true);
        }
        if (typeof tourGuideClient.updatePositions === 'function') {
            return tourGuideClient.updatePositions().catch(() => true);
        }
        if (typeof tourGuideClient.refreshDialog === 'function') {
            return tourGuideClient.refreshDialog().catch(() => true);
        }
        return Promise.resolve(true);
    }

    function findStepTargetElement(step) {
        const target = typeof step?.target === 'string' ? step.target.trim() : '';
        if (!target) {
            return null;
        }
        try {
            return document.querySelector(target);
        } catch (error) {
            return null;
        }
    }

    function inferTabName(step) {
        if (typeof step?.tab === 'string' && step.tab.trim()) {
            return step.tab.trim();
        }
        const element = findStepTargetElement(step);
        const tabContent = element?.closest?.('.tab-content[id$="-tab"]');
        if (tabContent?.id) {
            return tabContent.id.replace(/-tab$/, '');
        }
        const target = typeof step?.target === 'string' ? step.target.trim() : '';
        const match = target.match(/#([a-z0-9_-]+)-tab\b/i);
        return match ? match[1] : '';
    }

    function getActiveTabName() {
        const activeTab = document.querySelector('.tab-content.active[id$="-tab"]');
        return activeTab?.id ? activeTab.id.replace(/-tab$/, '') : '';
    }

    function getActiveConfigSection() {
        return window.rms?.currentConfigSection || '';
    }

    function inferConfigSection(step) {
        if (typeof step?.configSection === 'string' && step.configSection.trim()) {
            return step.configSection.trim();
        }
        const element = findStepTargetElement(step);
        if (!element || !element.closest('#configurationContainer')) {
            return '';
        }
        return getActiveConfigSection();
    }

    function inferModalId(step) {
        if (typeof step?.modal === 'string' && step.modal.trim()) {
            return step.modal.trim();
        }
        const element = findStepTargetElement(step);
        const modal = element?.closest?.('.modal');
        if (modal?.id) {
            return modal.id;
        }
        const target = typeof step?.target === 'string' ? step.target.trim() : '';
        const match = target.match(/#([a-z0-9_-]*modal[a-z0-9_-]*)\b/i);
        return match ? match[1] : '';
    }

    function getActiveModalId(element) {
        const scopedModal = element?.closest?.('.modal.show');
        if (scopedModal?.id) {
            return scopedModal.id;
        }
        const topModal = Array.from(document.querySelectorAll('.modal.show')).pop();
        return topModal?.id || '';
    }

    function closeGuidedTourModals(exceptModalId = '') {
        document.querySelectorAll('.modal.show[data-tour-opened-by-guide="true"]').forEach((modal) => {
            if (modal.id && modal.id === exceptModalId) {
                return;
            }
            if (modal.id && typeof window.closeModal === 'function') {
                window.closeModal(modal.id);
            } else {
                modal.classList.remove('show');
            }
            delete modal.dataset.tourOpenedByGuide;
        });
    }

    function openModalForStep(modalId) {
        if (!modalId) {
            closeGuidedTourModals();
            return;
        }
        const modal = document.getElementById(modalId);
        if (!modal) {
            return;
        }
        const alreadyOpen = modal.classList.contains('show');
        const openers = {
            interviewModal: () => window.rms?.openInterviewModal?.(),
            interviewTemplateModal: () => window.rms?.openInterviewTemplateModal?.(),
            mentionsModal: () => window.rms?.openMentionsModal?.(),
            referentDirectoryModal: () => window.rms?.openReferentDirectoryModal?.(),
            mindmapModal: () => window.rms?.openMindMapModal?.(),
            riskModal: () => window.addNewRisk?.(),
            controlModal: () => window.addNewControl?.(),
            actionPlanModal: () => window.addNewActionPlan?.(),
            controlSelectorModal: () => window.openControlSelector?.(),
            actionPlanSelectorModal: () => window.openActionPlanSelector?.(),
            riskSelectorPlanModal: () => window.openRiskSelectorForPlan?.(),
            riskSelectorModal: () => window.openRiskSelector?.(),
        };
        if (!alreadyOpen && typeof openers[modalId] === 'function') {
            openers[modalId]();
        }
        if (!modal.classList.contains('show')) {
            if (typeof window.bringModalToFront === 'function') {
                window.bringModalToFront(modal);
            } else {
                modal.classList.add('show');
            }
        }
        modal.dataset.tourOpenedByGuide = 'true';
        closeGuidedTourModals(modalId);
    }

    function prepareStepContext(step) {
        if (!step) {
            return Promise.resolve(true);
        }
        const tabName = inferTabName(step);
        if (tabName && typeof window.switchTab === 'function' && getActiveTabName() !== tabName) {
            window.switchTab(tabName);
        }
        if (tabName === 'config') {
            const configSection = inferConfigSection(step);
            if (configSection && window.rms && window.rms.currentConfigSection !== configSection && typeof window.rms.renderConfiguration === 'function') {
                window.rms.currentConfigSection = configSection;
                window.rms.renderConfiguration();
            }
        }
        openModalForStep(inferModalId(step));
        return nextFrame().then(() => refreshTourGuidePosition());
    }

    function getLaunchTourIds(step) {
        return step?.nextAction === 'launchTour' ? normalizeLaunchTourIds(step.launchTourIds) : [];
    }

    function getTourName(tourId) {
        return getConfiguredTours().find(tour => tour.id === tourId)?.name || tourId;
    }

    function buildStepContent(step, currentTour) {
        const baseContent = String(step?.content || '');
        const launchIds = getLaunchTourIds(step);
        if (!launchIds.length) {
            return baseContent;
        }
        const actions = launchIds
            .filter(tourId => tourId && tourId !== currentTour?.id)
            .map(tourId => `
                <button type="button" class="tour-step-branch-button" data-tour-launch-id="${escapeHtml(tourId)}">
                    ${escapeHtml(getTourName(tourId))}
                </button>
            `)
            .join('');
        if (!actions) {
            return baseContent;
        }
        return `
            ${baseContent}
            <div class="tour-step-branch-actions" data-tour-step-branch-actions>
                <span class="tour-step-branch-label">Choisir le tour à lancer ensuite</span>
                <div class="tour-step-branch-buttons">${actions}</div>
            </div>
        `;
    }

    function getCurrentRuntimeStep() {
        const stepIndex = Number.isInteger(tourGuideClient?.activeStep) ? tourGuideClient.activeStep : -1;
        const step = tourGuideClient?.tourSteps?.[stepIndex];
        return step?.sourceStep || null;
    }

    function applyStepDisplayMode(step) {
        const mode = step?.displayMode === 'wide' ? 'wide' : 'focus';
        document.body.dataset.tourDisplayMode = mode;
        const backdrop = tourGuideClient?.backdrop;
        if (backdrop instanceof HTMLElement) {
            backdrop.classList.toggle('tour-backdrop-wide', mode === 'wide');
            backdrop.classList.toggle('tour-backdrop-focus', mode !== 'wide');
            backdrop.style.backgroundColor = mode === 'wide' ? 'rgba(20,20,21,0)' : TOUR_FOCUS_BACKDROP_COLOR;
        }
        return Promise.resolve(true);
    }

    function clearStepDisplayMode() {
        delete document.body.dataset.tourDisplayMode;
        const backdrop = tourGuideClient?.backdrop;
        if (backdrop instanceof HTMLElement) {
            backdrop.classList.remove('tour-backdrop-wide', 'tour-backdrop-focus');
            backdrop.style.backgroundColor = TOUR_FOCUS_BACKDROP_COLOR;
        }
    }


    function applyTourDialogErgonomics() {
        const dialog = document.getElementById('tg-dialog') || document.querySelector('.tg-dialog');
        if (dialog instanceof HTMLElement) {
            dialog.style.width = 'fit-content';
            dialog.style.maxWidth = 'min(560px, calc(100vw - 32px))';
            dialog.style.minWidth = 'min(320px, calc(100vw - 32px))';
        }
        const closeButton = document.getElementById('tg-dialog-close-btn') || dialog?.querySelector?.('[data-tg-close], .tg-dialog-close, .tg-close');
        if (closeButton instanceof HTMLElement) {
            closeButton.setAttribute('aria-label', 'Passer le tour');
            closeButton.setAttribute('title', 'Passer le tour');
        }
        return Promise.resolve(true);
    }

    function applyStepButtonBehavior(step) {
        const nextButton = document.getElementById('tg-dialog-next-btn');
        if (!nextButton) {
            return Promise.resolve(true);
        }
        const launchIds = getLaunchTourIds(step);
        nextButton.dataset.tourNextAction = launchIds.length ? 'launchTour' : 'next';
        nextButton.dataset.tourLaunchIds = launchIds.join(',');
        if (launchIds.length === 1) {
            nextButton.textContent = `Lancer “${getTourName(launchIds[0])}”`;
        } else if (launchIds.length > 1) {
            nextButton.textContent = 'Choisir un tour';
        }
        return Promise.resolve(true);
    }

    function focusStepBranchActions() {
        const actions = document.querySelector('[data-tour-step-branch-actions]');
        if (actions instanceof HTMLElement) {
            actions.setAttribute('tabindex', '-1');
            actions.focus({ preventScroll: true });
            actions.classList.add('is-highlighted');
            window.setTimeout(() => actions.classList.remove('is-highlighted'), 800);
        }
    }

    function launchLinkedTour(tourId) {
        const targetTour = findTourById(tourId);
        if (!targetTour || targetTour.status === 'draft' || !targetTour.steps?.length) {
            notify('warning', 'Le tour sélectionné est indisponible ou encore en brouillon.');
            return;
        }
        const currentClient = tourGuideClient;
        const startTargetTour = () => window.setTimeout(() => startTourGuide(tourId), 0);
        if (currentClient && typeof currentClient.exit === 'function' && currentClient.isVisible) {
            Promise.resolve(currentClient.exit()).finally(startTargetTour);
        } else {
            startTargetTour();
        }
    }

    function handleTourBranchClick(event) {
        const branchButton = event.target?.closest?.('[data-tour-launch-id]');
        if (branchButton) {
            event.preventDefault();
            event.stopPropagation();
            launchLinkedTour(branchButton.dataset.tourLaunchId);
        }
    }

    function handlePrimaryNextAction(event) {
        const nextButton = event.target?.closest?.('#tg-dialog-next-btn');
        if (!nextButton || nextButton.dataset.tourNextAction !== 'launchTour') {
            return;
        }
        const launchIds = normalizeLaunchTourIds(nextButton.dataset.tourLaunchIds?.split(','));
        if (!launchIds.length) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        if (launchIds.length === 1) {
            launchLinkedTour(launchIds[0]);
            return;
        }
        focusStepBranchActions();
    }

    function notifyTourGuideUnavailable() {
        notify('warning', 'Le module TourGuide JS est indisponible. Vérifiez la connexion au CDN puis réessayez.');
    }

    function createTourGuideClient(tour) {
        if (!window.tourguide || typeof window.tourguide.TourGuideClient !== 'function') {
            return null;
        }

        tourGuideClient = new window.tourguide.TourGuideClient(buildTourOptions(tour));
        if (typeof tourGuideClient.onAfterStepChange === 'function') {
            tourGuideClient.onAfterStepChange(() => {
                applyStepDisplayMode(getCurrentRuntimeStep());
                applyStepButtonBehavior(getCurrentRuntimeStep());
                applyTourDialogErgonomics();
                return refreshTourGuidePosition();
            });
        }
        if (typeof tourGuideClient.onAfterExit === 'function') {
            tourGuideClient.onAfterExit(() => {
                clearStepDisplayMode();
                closeGuidedTourModals();
            });
        }
        if (typeof tourGuideClient.onFinish === 'function') {
            tourGuideClient.onFinish(() => {
                clearStepDisplayMode();
                closeGuidedTourModals();
            });
        }
        return tourGuideClient;
    }

    async function startTourGuide(tourId = activeTourId) {
        const launchableTours = getLaunchableTours();
        if (!launchableTours.length) {
            notify('warning', 'Aucun tour actif avec étapes n’est disponible. Créez ou activez un tour dans Administration > Tours guidés.');
            return;
        }

        const tour = getTourById(tourId) || launchableTours[0];
        activeTourId = tour.id;

        const firstStep = normalizeStep(tour.steps?.[0]) || tour.steps?.[0] || null;
        await prepareStepContext(firstStep);

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

    function getStepPreviewUrl(tourId, stepIndex) {
        const url = new URL(window.location.href);
        url.searchParams.set('tourStepPreview', `${tourId}:${stepIndex}`);
        url.hash = '';
        return url.toString();
    }

    function openStepPreview(tourId, stepIndex) {
        window.open(getStepPreviewUrl(tourId, stepIndex), '_blank', 'noopener');
    }

    function buildStepPreviewMarkup(step, tourId, stepIndex) {
        return `
            <div class="tour-step-preview tour-step-preview-fallback">
                <strong>${escapeHtml(step?.title || 'Étape enregistrée')}</strong>
                <span>Cible : ${escapeHtml(step?.target || 'non définie')}</span>
                <small>Ouvrez cette étape dans un nouvel onglet pour vérifier le contexte enregistré.</small>
                <code>${escapeHtml(getStepPreviewUrl(tourId, stepIndex))}</code>
            </div>
        `;
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
        const stepIndex = Number.isInteger(captureState.insertAfterIndex)
            ? Math.min(Math.max(captureState.insertAfterIndex + 1, 0), tour.steps.length)
            : tour.steps.length;
        tour.steps.splice(stepIndex, 0, {
            title: `${CAPTURE_DEFAULTS.titlePrefix} ${stepIndex + 1}${label ? ` — ${label}` : ''}`,
            content: CAPTURE_DEFAULTS.defaultDescription,
            target: selector,
            order: stepIndex + 1,
            displayMode: 'focus',
            tab: getActiveTabName(),
            modal: getActiveModalId(event.target),
            configSection: getActiveConfigSection(),
            nextAction: 'next',
            launchTourIds: [],
        });
        tour.steps = tour.steps.map((step, index) => ({ ...step, order: index + 1 }));
        if (Number.isInteger(captureState.insertAfterIndex)) {
            captureState.insertAfterIndex = stepIndex;
        }
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
                : Number.isInteger(captureState.insertAfterIndex)
                    ? `Chaque clic ajoute une étape après la position ${captureState.insertAfterIndex + 1} pour “${tour?.name || ''}”.`
                    : `Chaque clic devient une étape à la fin de “${tour?.name || ''}”.`;
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
        const insertAfterIndex = Number.isInteger(arguments[1]) ? arguments[1] : null;
        captureState = { active: true, paused: false, tourId: tour.id, insertAfterIndex };
        ensureCaptureBar();
        updateCaptureBar();
        document.removeEventListener('click', addCapturedStep, true);
        document.addEventListener('click', addCapturedStep, true);
        notify('success', `Capture démarrée pour “${tour.name}”.`);
    }

    function stopCapture() {
        if (!captureState.active) {
            return;
        }
        document.removeEventListener('click', addCapturedStep, true);
        const tour = getCaptureTour();
        captureState = { active: false, paused: false, tourId: '', insertAfterIndex: null };
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
            autoStartOnFirstVisit: false,
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
        if (field === 'autoStartOnFirstVisit') {
            const isEnabled = value === true || value === 'true' || value === 'on';
            ensureGuidedToursConfig().forEach(candidate => {
                candidate.autoStartOnFirstVisit = candidate.id === tourId ? isEnabled : false;
                if (candidate.id === tourId) {
                    touchTour(candidate);
                }
            });
            persistTourChanges(null, true);
            return;
        }
        tour[field] = field === 'status' && value !== 'draft' ? 'active' : value;
        touchTour(tour);
        persistTourChanges();
    }

    function updateStepField(tourId, stepIndex, field, value) {
        const tour = getTourById(tourId);
        if (!tour || !tour.steps[stepIndex]) return;
        if (field === 'displayMode') {
            tour.steps[stepIndex][field] = value === 'wide' ? 'wide' : 'focus';
        } else if (field === 'launchTourIds') {
            tour.steps[stepIndex][field] = normalizeLaunchTourIds(value);
        } else if (field === 'nextAction') {
            tour.steps[stepIndex][field] = value === 'launchTour' ? 'launchTour' : 'next';
            if (tour.steps[stepIndex][field] === 'next') {
                tour.steps[stepIndex].launchTourIds = [];
            }
        } else {
            tour.steps[stepIndex][field] = value;
        }
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
        intro.innerHTML = '<strong>Studio de tours guidés.</strong> Créez plusieurs parcours, lancez une capture façon Tango, mettez-la en pause ou arrêtez-la, puis retouchez chaque étape. Chaque étape peut être ouverte dans un nouvel onglet pour vérifier son contexte, et une capture peut être relancée entre deux étapes pour compléter le parcours.';
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
            const card = document.createElement('details');
            card.className = 'tour-admin-card tour-admin-accordion';
            card.innerHTML = `
                <summary class="tour-admin-accordion-summary">
                    <span class="tour-admin-accordion-title">${escapeHtml(tour.name)}</span>
                    <span class="tour-admin-accordion-meta">${tour.status === 'draft' ? 'Brouillon' : 'Actif'} · ${tour.steps.length} étape(s)</span>
                    <span class="tour-admin-accordion-auto${tour.autoStartOnFirstVisit ? ' is-enabled' : ''}">${tour.autoStartOnFirstVisit ? 'Démarrage auto' : 'Manuel'}</span>
                    <span class="tour-admin-accordion-chevron" aria-hidden="true">⌄</span>
                </summary>
                <div class="tour-admin-card-body">
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
                <label class="tour-admin-auto-start">
                    <input type="checkbox" data-tour-field="autoStartOnFirstVisit"${tour.autoStartOnFirstVisit ? ' checked' : ''}>
                    <span>
                        <strong>Lancer automatiquement ce tour à la première visite</strong>
                        <small>Le visiteur peut passer le tour avec la fermeture du guide. Un seul tour peut être défini comme automatique.</small>
                    </span>
                </label>
                <div class="tour-step-summary">${tour.steps.length} étape(s) · Dernière modification ${formatDateTime(tour.updatedAt)}</div>
            `;

            card.querySelectorAll('[data-tour-field]').forEach((field) => {
                const getFieldValue = (event) => event.target.type === 'checkbox' ? event.target.checked : event.target.value;
                field.addEventListener('change', (event) => updateTourField(tour.id, field.dataset.tourField, getFieldValue(event)));
                field.addEventListener('blur', (event) => updateTourField(tour.id, field.dataset.tourField, getFieldValue(event)));
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
                        <div class="tour-step-preview-column">
                            ${buildStepPreviewMarkup(step, tour.id, stepIndex)}
                            <button class="btn btn-outline btn-small" type="button" data-step-open>↗️ Ouvrir l’étape</button>
                            <button class="btn btn-secondary btn-small" type="button" data-step-capture-after>🎯 Capturer après</button>
                        </div>
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
                                    <span class="form-label">Affichage</span>
                                    <select class="form-select" data-step-field="displayMode">
                                        <option value="focus"${step.displayMode !== 'wide' ? ' selected' : ''}>Mode focus — zones non ciblées assombries</option>
                                        <option value="wide"${step.displayMode === 'wide' ? ' selected' : ''}>Mode large — aucune zone assombrie</option>
                                    </select>
                                </label>
                            </div>
                            <div class="form-grid">
                                <label class="form-group">
                                    <span class="form-label">Onglet à ouvrir</span>
                                    <input class="form-input" value="${escapeHtml(step.tab || '')}" placeholder="ex. risks" data-step-field="tab">
                                </label>
                                <label class="form-group">
                                    <span class="form-label">Modale à ouvrir</span>
                                    <input class="form-input" value="${escapeHtml(step.modal || '')}" placeholder="ex. riskModal" data-step-field="modal">
                                </label>
                                <label class="form-group">
                                    <span class="form-label">Section admin</span>
                                    <input class="form-input" value="${escapeHtml(step.configSection || '')}" placeholder="ex. guidedTours" data-step-field="configSection">
                                </label>
                            </div>
                            <div class="form-grid">
                                <label class="form-group">
                                    <span class="form-label">Action du bouton</span>
                                    <select class="form-select" data-step-field="nextAction">
                                        <option value="next"${step.nextAction !== 'launchTour' ? ' selected' : ''}>Aller à l’étape suivante</option>
                                        <option value="launchTour"${step.nextAction === 'launchTour' ? ' selected' : ''}>Lancer un ou plusieurs tours</option>
                                    </select>
                                </label>
                                <label class="form-group">
                                    <span class="form-label">Tours proposés</span>
                                    <select class="form-select" multiple size="${Math.min(Math.max(tours.length - 1, 2), 5)}" data-step-field="launchTourIds">
                                        ${tours.filter(candidate => candidate.id !== tour.id).map(candidate => `<option value="${escapeHtml(candidate.id)}"${normalizeLaunchTourIds(step.launchTourIds).includes(candidate.id) ? ' selected' : ''}>${escapeHtml(candidate.name)}</option>`).join('')}
                                    </select>
                                    <span class="config-helper">Maintenez Ctrl/Cmd pour choisir plusieurs tours.</span>
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
                        const handler = (event) => updateStepField(
                            tour.id,
                            stepIndex,
                            field.dataset.stepField,
                            field.multiple ? Array.from(field.selectedOptions).map(option => option.value) : event.target.value
                        );
                        field.addEventListener(field.type === 'range' ? 'input' : 'change', handler);
                        field.addEventListener('blur', handler);
                    });
                    row.querySelector('[data-step-open]')?.addEventListener('click', () => openStepPreview(tour.id, stepIndex));
                    row.querySelector('[data-step-capture-after]')?.addEventListener('click', () => startCapture(tour.id, stepIndex));
                    row.querySelector('[data-step-delete]')?.addEventListener('click', () => removeStep(tour.id, stepIndex));
                    steps.appendChild(row);
                });
            }
            card.querySelector('.tour-admin-card-body')?.appendChild(steps);
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
    document.addEventListener('click', handleTourBranchClick);
    document.addEventListener('click', handlePrimaryNextAction, true);

    const FIRST_VISIT_TOUR_STORAGE_KEY = 'rms_guided_tour_first_visit_seen';

    function canUseLocalStorage() {
        try {
            if (typeof window.localStorage === 'undefined') {
                return false;
            }
            const probeKey = `${FIRST_VISIT_TOUR_STORAGE_KEY}_probe`;
            window.localStorage.setItem(probeKey, '1');
            window.localStorage.removeItem(probeKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    function getAutoStartTour() {
        return getLaunchableTours().find(tour => tour.autoStartOnFirstVisit === true) || null;
    }

    function initFirstVisitAutoTour() {
        const params = new URLSearchParams(window.location.search);
        if (params.has('tourStepPreview')) {
            return;
        }
        const autoTour = getAutoStartTour();
        if (!autoTour) {
            return;
        }
        if (canUseLocalStorage()) {
            if (window.localStorage.getItem(FIRST_VISIT_TOUR_STORAGE_KEY)) {
                return;
            }
            window.localStorage.setItem(FIRST_VISIT_TOUR_STORAGE_KEY, new Date().toISOString());
        }
        window.setTimeout(() => startTourGuide(autoTour.id), 700);
    }

    function initStepPreviewFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const preview = params.get('tourStepPreview');
        if (!preview) {
            return;
        }
        const [tourId, rawIndex] = preview.split(':');
        const stepIndex = parseInt(rawIndex, 10);
        const tour = getTourById(tourId);
        if (!tour || !Number.isInteger(stepIndex) || !tour.steps[stepIndex]) {
            notify('warning', 'Étape de tour guidé introuvable pour l’aperçu.');
            return;
        }
        window.setTimeout(async () => {
            await startTourGuide(tour.id);
            if (tourGuideClient && typeof tourGuideClient.visitStep === 'function') {
                tourGuideClient.visitStep(stepIndex).then(() => applyStepDisplayMode(tour.steps[stepIndex]));
            }
        }, 300);
    }

    document.addEventListener('DOMContentLoaded', () => {
        initTourGuideButton();
        initStepPreviewFromUrl();
        initFirstVisitAutoTour();
    });
    window.startTourGuide = startTourGuide;
    window.renderGuidedToursAdmin = renderGuidedToursAdmin;
    window.exportGuidedTours = exportGuidedTours;
    window.ensureGuidedToursConfig = ensureGuidedToursConfig;
}());
