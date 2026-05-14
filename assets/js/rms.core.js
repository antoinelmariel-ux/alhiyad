// Enhanced Risk Management System - Core Logic

const RMS_LOCAL_STORAGE_ENABLED = false;

let emptyChartPluginRegistered = false;

function ensureEmptyChartMessagePlugin() {
    if (emptyChartPluginRegistered) {
        return;
    }

    if (typeof Chart === 'undefined') {
        return;
    }

    const emptyChartMessagePlugin = {
        id: 'emptyChartMessage',
        defaults: {
            display: false,
            message: 'Aucune donnée disponible',
            color: '#95a5a6',
            font: {
                family: 'Inter, Arial, sans-serif',
                size: 14,
                style: '600'
            }
        },
        afterDraw(chart, args, options) {
            if (!options || !options.display) {
                return;
            }

            const dataset = chart?.data?.datasets?.[0];
            const data = Array.isArray(dataset?.data) ? dataset.data : [];
            const total = data.reduce((sum, value) => sum + (Number(value) || 0), 0);
            if (total > 0) {
                return;
            }

            const { ctx, chartArea } = chart;
            if (!ctx || !chartArea) {
                return;
            }

            const { left, top, width, height } = chartArea;
            const message = typeof options.message === 'string' && options.message.trim()
                ? options.message.trim()
                : 'Aucune donnée disponible';
            const fontFamily = options.font?.family || 'Inter, Arial, sans-serif';
            const fontSize = options.font?.size || 14;
            const fontStyle = options.font?.style || '600';

            ctx.save();
            ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`;
            ctx.fillStyle = options.color || '#95a5a6';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(message, left + width / 2, top + height / 2);
            ctx.restore();
        }
    };

    let registered = false;
    if (typeof Chart.register === 'function') {
        Chart.register(emptyChartMessagePlugin);
        registered = true;
    } else if (Chart.plugins && typeof Chart.plugins.register === 'function') {
        Chart.plugins.register(emptyChartMessagePlugin);
        registered = true;
    }

    if (registered) {
        emptyChartPluginRegistered = true;
    }
}

function cloneDefaultEntry(entry) {
    if (typeof structuredClone === 'function') {
        try {
            return structuredClone(entry);
        } catch (error) {
            // Fallback to JSON cloning below
        }
    }

    try {
        return JSON.parse(JSON.stringify(entry));
    } catch (error) {
        return entry && typeof entry === 'object' ? { ...entry } : entry;
    }
}


class RiskManagementSystem {
    constructor() {
        const storedRisks = this.loadData('risks');
        const defaultRisks = this.getDefaultRisks();
        const initialRisks = Array.isArray(storedRisks) ? storedRisks : defaultRisks;
        this.risks = Array.isArray(initialRisks)
            ? initialRisks.map(risk => this.normalizeRisk(risk))
            : [];

        const storedControls = this.loadData('controls');
        const defaultControls = this.getDefaultControls();
        this.controls = Array.isArray(storedControls) ? storedControls : defaultControls;

        const storedActionPlans = this.loadData('actionPlans');
        const initialActionPlans = Array.isArray(storedActionPlans)
            ? storedActionPlans
            : this.getDefaultActionPlans();
        this.actionPlans = Array.isArray(initialActionPlans)
            ? initialActionPlans.map(plan => this.normalizeActionPlan(plan))
            : [];
        this.reconcileRiskActionPlanLinks();

        const storedHistory = this.loadData('history');
        this.history = Array.isArray(storedHistory) ? storedHistory : this.getDefaultHistory();

        const defaultInterviews = this.getDefaultInterviews();
        this.interviews = Array.isArray(defaultInterviews)
            ? defaultInterviews
                .map(entry => this.normalizeInterview(entry))
                .filter(Boolean)
            : [];
        this.interviewFolder = 'interviews';
        this.interviewFileCount = 0;
        this.interviewJsonCount = 0;
        this.interviewLoadFailed = false;
        this.interviewFolderPicker = null;
        const defaultConfig = this.getDefaultConfig();
        this.config = this.loadConfig() || defaultConfig;
        this.readOnlyConfigKeys = new Set(['riskStatuses']);
        const configStructureUpdated = this.ensureConfigStructure(defaultConfig);
        if (configStructureUpdated) {
            this.saveConfig();
        }
        this.needsConfigStructureRerender = configStructureUpdated;
        this.currentView = 'brut';
        this.processScoreMode = 'net';
        this.currentTab = 'dashboard';
        this.currentConfigSection = 'processManager';
        this.filters = {
            process: '',
            type: '',
            status: '',
            theme: '',
            search: '',
            entity: [],
            tiers: []
        };
        this.riskRegisterSort = {
            key: '',
            direction: 'desc'
        };
        this.controlFilters = {
            type: '',
            search: ''
        };
        this.actionPlanFilters = {
            status: '',
            name: '',
            owner: '',
            dueDateOrder: ''
        };
        this.processManagerFilters = {
            query: '',
            referent: ''
        };
        this.interviewFilters = {
            process: '',
            subProcess: '',
            referent: '',
            search: ''
        };
        this.mentionArchive = this.loadMentionArchive();
        this.mentionModalFilter = 'active';
        this.mentionModalInitialized = false;

        this.mindMapToolbarExpanded = false;
        this.mindMapMiniMapVisible = false;
        this.collapsedProcesses = new Set();
        this.initializeProcessCollapseState();
        this.activeInsertionForm = null;
        this.dragState = null;
        this.lastDashboardMetrics = null;
        this.charts = {};
        this.processColorMap = new Map();
        this.interviewEditorState = null;
        this.interviewTemplateManagerContainer = null;
        this.interviewTemplateListContainer = null;
        this.mindMapThemeManagerContainer = null;
        this.unsavedContexts = new Set();
        this.hasUnsavedChanges = false;
        this.mindMapColumns = this.getMindMapColumns();
        this.interviewMindMapState = this.createEmptyMindMapState();
        this.mindMapReadOnlyMode = false;
        this.interviewViewMindMapState = null;
        this.mindMapDragContext = null;
        this.mindMapThemeDragState = null;
        this.mindMapLinkListenersRegistered = false;
        this.mindMapLinkUpdateHandler = null;
        this.mindMapRenderer = null;
        this.pendingMindMapPayload = null;
        this.pendingMindMapStateRequestId = null;
        this.mindMapMessageHandler = null;
        this.init();
    }

    initializeProcessCollapseState() {
        if (!(this.collapsedProcesses instanceof Set)) {
            this.collapsedProcesses = new Set();
        }

        this.config.processes
            .map(process => process?.value)
            .filter(value => typeof value === 'string' && value)
            .forEach(value => {
                this.collapsedProcesses.add(value);
            });
    }

    init() {
        this.refreshProcessColorMap();
        this.populateSelects();
        this.renderAll();
        this.applyFeedbackButtonVisibility();
        this.renderInterviewTemplateChoices();
        this.registerMindMapMessageHandlers();
        if (this.needsConfigStructureRerender) {
            this.renderConfiguration();
            this.needsConfigStructureRerender = false;
        }
        this.saveData();
        this.updateLastSaveTime();
        this.reloadInterviewFiles();
    }

    renderAll() {
        this.initializeMatrix();
        this.updateDashboard();
        this.updateRisksList();
        this.updateControlsList();
        this.updateActionPlansList();
        this.updateHistory();
        this.updateInterviewsList();

        if (this.currentTab === 'config') {
            this.renderConfiguration();
        }
    }

    getDefaultRisks() {
        const defaults = window.RMS_DEFAULT_DATA?.risks;
        if (!Array.isArray(defaults)) {
            return [];
        }
        return defaults.map(item => cloneDefaultEntry(item));
    }

    getDefaultControls() {
        const defaults = window.RMS_DEFAULT_DATA?.controls;
        if (!Array.isArray(defaults)) {
            return [];
        }
        return defaults.map(item => cloneDefaultEntry(item));
    }

    getDefaultActionPlans() {
        const defaults = window.RMS_DEFAULT_DATA?.actionPlans;
        if (!Array.isArray(defaults)) {
            return [];
        }
        return defaults.map(item => cloneDefaultEntry(item));
    }

    getDefaultHistory() {
        const defaults = window.RMS_DEFAULT_DATA?.history;
        if (!Array.isArray(defaults)) {
            return [];
        }
        return defaults.map(item => cloneDefaultEntry(item));
    }

    getDefaultInterviews() {
        const defaults = window.RMS_DEFAULT_DATA?.interviews;
        if (!Array.isArray(defaults)) {
            return [];
        }
        return defaults.map(item => cloneDefaultEntry(item));
    }

    getDefaultConfig() {
        const processConfig = window.RMS_DEFAULT_PROCESS_CONFIG || {};
        const parameterConfig = window.RMS_DEFAULT_PARAMETER_CONFIG || {};

        const cloneList = (list) => Array.isArray(list)
            ? list.map(item => (item && typeof item === 'object') ? { ...item } : item)
            : [];

        const cloneReferentList = (list) => cloneList(list).map(entry => ({
            ...entry,
            referents: Array.isArray(entry?.referents)
                ? entry.referents.filter(ref => typeof ref === 'string' && ref.trim())
                : []
        }));

        const cloneMindMapThemes = (themes) => Array.isArray(themes)
            ? themes.map(theme => ({
                ...theme,
                columns: Array.isArray(theme?.columns)
                    ? theme.columns.map(column => ({ ...column }))
                    : []
            }))
            : [];

        const cloneSubProcessMap = (map) => {
            if (!map || typeof map !== 'object' || Array.isArray(map)) {
                return {};
            }
            return Object.entries(map).reduce((acc, [key, value]) => {
                acc[key] = cloneReferentList(value);
                return acc;
            }, {});
        };

        const cloneAggravatingFactorConfig = (map) => {
            if (!map || typeof map !== 'object' || Array.isArray(map)) {
                return {};
            }
            return JSON.parse(JSON.stringify(map));
        };

        const config = {
            processes: cloneReferentList(processConfig.processes),
            subProcesses: cloneSubProcessMap(processConfig.subProcesses)
        };

        const parameterKeys = [
            'riskTypes',
            'riskThemes',
            'countries',
            'tiers',
            'targetAudiences',
            'riskStatuses',
            'actionPlanStatuses',
            'controlTypes',
            'controlOrigins',
            'controlFrequencies',
            'controlModes',
            'controlEffectiveness',
            'controlStatuses'
        ];

        parameterKeys.forEach(key => {
            config[key] = cloneList(parameterConfig[key]);
        });

        if (!config.riskThemes.length) {
            config.riskThemes = [
                { value: 'corruption', label: 'Corruption', color: '#8b5cf6' },
                { value: 'personal-data', label: 'Données Personnelles', color: '#0ea5e9' },
                { value: 'international-sanctions', label: 'Sanctions internationales', color: '#f97316' },
                { value: 'discrimination', label: 'Discrimination', color: '#ec4899' }
            ];
        }

        config.riskThemeAggravatingFactors = cloneAggravatingFactorConfig(parameterConfig.riskThemeAggravatingFactors);

        const templateList = Array.isArray(parameterConfig.interviewTemplates)
            ? parameterConfig.interviewTemplates
                .map(template => ({
                    value: typeof template?.value === 'string' ? template.value : '',
                    label: typeof template?.label === 'string' ? template.label : '',
                    content: typeof template?.content === 'string' ? template.content : ''
                }))
                .filter(template => template.value && template.label)
            : [];
        config.interviewTemplates = templateList;

        const availableCountries = Array.isArray(config.countries)
            ? config.countries
            : [];
        config.countryColumns = this.normalizeCountryColumns(
            parameterConfig.countryColumns,
            parameterConfig.countryColumns,
            availableCountries
        );

        config.mindMapThemes = cloneMindMapThemes(parameterConfig.mindMapThemes);
        config.mindMapActiveThemeId = parameterConfig.mindMapActiveThemeId || (config.mindMapThemes[0]?.id ?? '');
        config.ui = {
            showFeedbackButton: false,
            visibleRiskLimit: 5
        };

        if (!Array.isArray(config.riskStatuses) || config.riskStatuses.length === 0) {
            config.riskStatuses = [
                { value: 'brouillon', label: 'Brouillon' },
                { value: 'a-valider', label: 'À valider' },
                { value: 'validated', label: 'Validé' },
                { value: 'archive', label: 'Archivé' },
                { value: 'not-included', label: 'Non retenu' }
            ];
        }

        config.referentDirectory = this.normalizeReferentDirectory(parameterConfig.referentDirectory);

        const subProcesses = config.subProcesses && typeof config.subProcesses === 'object'
            ? config.subProcesses
            : {};

        Object.keys(subProcesses).forEach(key => {
            const list = Array.isArray(subProcesses[key]) ? subProcesses[key] : [];
            subProcesses[key] = list.map(item => ({
                ...item,
                referents: Array.isArray(item?.referents)
                    ? item.referents.filter(ref => typeof ref === 'string' && ref.trim())
                    : []
            }));
        });

        config.processes = (config.processes || []).map(process => ({
            ...process,
            referents: Array.isArray(process?.referents)
                ? process.referents.filter(ref => typeof ref === 'string' && ref.trim())
                : []
        }));

        return config;
    }

    loadConfig() {
        if (!RMS_LOCAL_STORAGE_ENABLED || typeof localStorage === 'undefined') {
            return null;
        }

        const storageKey = 'rms_config';
        const data = localStorage.getItem(storageKey);
        if (!data) {
            return null;
        }

        try {
            return JSON.parse(data);
        } catch (error) {
            console.warn('Configuration locale invalide : réinitialisation', error);
            try {
                localStorage.removeItem(storageKey);
            } catch (cleanupError) {
                console.warn(`Impossible de supprimer la configuration corrompue (${storageKey})`, cleanupError);
            }
            return null;
        }
    }

    saveConfig() {
        if (!RMS_LOCAL_STORAGE_ENABLED || typeof localStorage === 'undefined') {
            this.clearUnsavedChanges('configuration');
            return;
        }

        localStorage.setItem('rms_config', JSON.stringify(this.config));
        this.updateLastSaveTime();
        this.clearUnsavedChanges('configuration');
    }

    ensureConfigStructure(defaultConfig = this.getDefaultConfig()) {
        const fallback = defaultConfig || this.getDefaultConfig();
        let updated = false;

        const hasValidConfig = this.config && typeof this.config === 'object' && !Array.isArray(this.config);
        const baseConfig = hasValidConfig ? this.config : {};

        if (!hasValidConfig) {
            updated = true;
        }

        this.config = { ...fallback, ...baseConfig };

        const normalizeReferents = (value) => {
            if (!Array.isArray(value)) {
                return [];
            }
            const normalized = [];
            const seen = new Set();
            value.forEach(entry => {
                const str = typeof entry === 'string' ? entry.trim() : '';
                if (!str) {
                    return;
                }
                const key = str.toLowerCase();
                if (seen.has(key)) {
                    return;
                }
                seen.add(key);
                normalized.push(str);
            });
            return normalized;
        };

        const cloneConfigItem = (item, fallbackItem = {}) => {
            const base = item && typeof item === 'object' && !Array.isArray(item)
                ? { ...item }
                : { ...fallbackItem };
            base.referents = normalizeReferents(base.referents);
            return base;
        };

        const normalizeBoolean = (value) => {
            if (typeof value === 'boolean') {
                return value;
            }
            if (typeof value === 'string') {
                const normalized = value.trim().toLowerCase();
                if (normalized === 'true') {
                    return true;
                }
                if (normalized === 'false') {
                    return false;
                }
            }
            return Boolean(value);
        };

        const fallbackRiskStatuses = (fallback && Array.isArray(fallback.riskStatuses))
            ? fallback.riskStatuses
            : [
                { value: 'brouillon', label: 'Brouillon' },
                { value: 'a-valider', label: 'À valider' },
                { value: 'validated', label: 'Validé' },
                { value: 'archive', label: 'Archivé' },
                { value: 'not-included', label: 'Non retenu' }
            ];

        const fallbackStatuses = (fallback && Array.isArray(fallback.actionPlanStatuses))
            ? fallback.actionPlanStatuses
            : [
                { value: 'brouillon', label: 'Brouillon' },
                { value: 'a-demarrer', label: 'À démarrer' },
                { value: 'en-cours', label: 'En cours' },
                { value: 'delayed', label: 'En retard' },
                { value: 'abandoned', label: 'Abandonné' },
                { value: 'termine', label: 'Terminé' }
            ];

        const replaceKnownStatusLabels = (source, fallbackList) => {
            const fallbackByValue = new Map(fallbackList.map(status => [status.value, status]));
            const entries = Array.isArray(source) ? source : fallbackList;
            return entries.map(status => {
                const fallbackStatus = fallbackByValue.get(status?.value);
                return fallbackStatus ? { ...status, label: fallbackStatus.label } : { ...status };
            });
        };

        this.config.riskStatuses = replaceKnownStatusLabels(baseConfig.riskStatuses, fallbackRiskStatuses);
        if (JSON.stringify(baseConfig.riskStatuses) !== JSON.stringify(this.config.riskStatuses)) {
            updated = true;
        }

        this.config.actionPlanStatuses = replaceKnownStatusLabels(baseConfig.actionPlanStatuses, fallbackStatuses);
        if (JSON.stringify(baseConfig.actionPlanStatuses) !== JSON.stringify(this.config.actionPlanStatuses)) {
            updated = true;
        }

        if (!baseConfig.subProcesses || typeof baseConfig.subProcesses !== 'object' || Array.isArray(baseConfig.subProcesses)) {
            this.config.subProcesses = {};
            if (baseConfig.subProcesses !== undefined) {
                updated = true;
            }
        } else {
            const normalizedSubProcesses = {};
            Object.entries(baseConfig.subProcesses).forEach(([key, value]) => {
                normalizedSubProcesses[key] = Array.isArray(value)
                    ? value.map(item => cloneConfigItem(item))
                    : [];
                if (!Array.isArray(value)) {
                    updated = true;
                }
            });
            this.config.subProcesses = normalizedSubProcesses;
        }

        if (Array.isArray(baseConfig.processes)) {
            this.config.processes = baseConfig.processes.map(process => cloneConfigItem(process));
        } else {
            this.config.processes = Array.isArray(fallback.processes)
                ? fallback.processes.map(process => cloneConfigItem(process))
                : [];
            if (baseConfig.processes !== undefined) {
                updated = true;
            }
        }

        const referentDirectory = this.normalizeReferentDirectory(baseConfig.referentDirectory);
        this.config.referentDirectory = referentDirectory.length > 0
            ? referentDirectory
            : this.normalizeReferentDirectory(fallback.referentDirectory);
        if (!Array.isArray(baseConfig.referentDirectory) && baseConfig.referentDirectory !== undefined) {
            updated = true;
        }

        this.config.processes.forEach(process => {
            if (!process || !process.value) return;
            if (!Array.isArray(this.config.subProcesses[process.value])) {
                this.config.subProcesses[process.value] = [];
                updated = true;
            } else {
                this.config.subProcesses[process.value] = this.config.subProcesses[process.value].map(item => cloneConfigItem(item));
            }
        });

        const simpleArrayKeys = [
            'riskTypes',
            'riskThemes',
            'countries',
            'tiers',
            'targetAudiences',
            'controlTypes',
            'controlOrigins',
            'controlFrequencies',
            'controlModes',
            'controlEffectiveness',
            'controlStatuses'
        ];

        simpleArrayKeys.forEach(key => {
            const baseArray = Array.isArray(baseConfig[key])
                ? baseConfig[key]
                : Array.isArray(fallback[key])
                    ? fallback[key]
                    : [];

            if (!Array.isArray(baseConfig[key]) && baseConfig[key] !== undefined) {
                updated = true;
            }

            this.config[key] = baseArray.map(item => item && typeof item === 'object' ? { ...item } : item);
        });

        const normalizedCountryColumns = this.normalizeCountryColumns(
            baseConfig.countryColumns,
            fallback.countryColumns,
            this.config.countries
        );
        if (!Array.isArray(baseConfig.countryColumns)) {
            if (baseConfig.countryColumns !== undefined) {
                updated = true;
            }
        } else if (JSON.stringify(baseConfig.countryColumns) !== JSON.stringify(normalizedCountryColumns)) {
            updated = true;
        }
        this.config.countryColumns = normalizedCountryColumns;

        const aggravatingFactorSource = baseConfig.riskThemeAggravatingFactors
            && typeof baseConfig.riskThemeAggravatingFactors === 'object'
            && !Array.isArray(baseConfig.riskThemeAggravatingFactors)
            ? baseConfig.riskThemeAggravatingFactors
            : fallback.riskThemeAggravatingFactors;
        this.config.riskThemeAggravatingFactors = aggravatingFactorSource
            && typeof aggravatingFactorSource === 'object'
            && !Array.isArray(aggravatingFactorSource)
            ? JSON.parse(JSON.stringify(aggravatingFactorSource))
            : {};
        if (!baseConfig.riskThemeAggravatingFactors) {
            updated = true;
        }

        if (this.applyEntityModelMigration()) {
            updated = true;
        }

        if (this.applyLuxuryBusinessModelMigration(fallback)) {
            updated = true;
        }

        const templateSource = Array.isArray(baseConfig.interviewTemplates)
            ? baseConfig.interviewTemplates
            : Array.isArray(fallback.interviewTemplates)
                ? fallback.interviewTemplates
                : [];

        if (!Array.isArray(baseConfig.interviewTemplates) && baseConfig.interviewTemplates !== undefined) {
            updated = true;
        }

        this.config.interviewTemplates = templateSource
            .map(template => ({
                value: typeof template?.value === 'string' ? template.value.trim() : '',
                label: typeof template?.label === 'string' ? template.label.trim() : '',
                content: typeof template?.content === 'string' ? template.content : ''
            }))
            .filter(template => template.value && template.label);

        const { themes: normalizedMindMapThemes, activeId } = this.normalizeMindMapThemes(
            baseConfig.mindMapThemes,
            fallback.mindMapThemes,
            baseConfig.mindMapActiveThemeId || fallback.mindMapActiveThemeId
        );

        if (JSON.stringify(this.config.mindMapThemes) !== JSON.stringify(normalizedMindMapThemes)) {
            updated = true;
        }
        if (this.config.mindMapActiveThemeId !== activeId) {
            updated = true;
        }

        this.config.mindMapThemes = normalizedMindMapThemes;
        this.config.mindMapActiveThemeId = activeId;

        const uiFallback = fallback.ui && typeof fallback.ui === 'object' && !Array.isArray(fallback.ui)
            ? fallback.ui
            : { showFeedbackButton: false, visibleRiskLimit: 5 };

        if (!baseConfig.ui || typeof baseConfig.ui !== 'object' || Array.isArray(baseConfig.ui)) {
            this.config.ui = { ...uiFallback };
            if (baseConfig.ui !== undefined) {
                updated = true;
            }
        } else {
            this.config.ui = { ...uiFallback, ...baseConfig.ui };
        }

        if (typeof this.config.ui.showFeedbackButton !== 'boolean') {
            this.config.ui.showFeedbackButton = normalizeBoolean(this.config.ui.showFeedbackButton);
            updated = true;
        }

        const normalizedVisibleRiskLimit = Math.max(0, Math.floor(Number(this.config.ui.visibleRiskLimit)));
        if (!Number.isFinite(normalizedVisibleRiskLimit)) {
            this.config.ui.visibleRiskLimit = 5;
            updated = true;
        } else if (this.config.ui.visibleRiskLimit !== normalizedVisibleRiskLimit) {
            this.config.ui.visibleRiskLimit = normalizedVisibleRiskLimit;
            updated = true;
        }

        return updated;
    }

    getVisibleRiskLimit() {
        const configuredLimit = Number(this.config?.ui?.visibleRiskLimit);
        if (!Number.isFinite(configuredLimit)) {
            return 5;
        }
        return Math.max(0, Math.floor(configuredLimit));
    }

    getRiskNumericId(risk) {
        const numericId = Number(risk?.id);
        return Number.isFinite(numericId) ? numericId : Number.MAX_SAFE_INTEGER;
    }

    getVisibleRiskIdSet(risks = []) {
        const limit = this.getVisibleRiskLimit();
        return new Set((Array.isArray(risks) ? risks : [])
            .filter(risk => this.getRiskNumericId(risk) <= limit)
            .map(risk => String(risk?.id)));
    }

    applyLuxuryBusinessModelMigration(fallback = {}) {
        const hasAnyValue = (list, values) => {
            const set = new Set(Array.isArray(list)
                ? list.map(entry => String(entry?.value || ''))
                : []);
            return values.some(value => set.has(value));
        };

        const hasAllValue = (list, values) => {
            const set = new Set(Array.isArray(list)
                ? list.map(entry => String(entry?.value || ''))
                : []);
            return values.every(value => set.has(value));
        };

        const cloneList = (list) => Array.isArray(list)
            ? list.map(item => (item && typeof item === 'object') ? { ...item } : item)
            : [];

        const cloneSubProcesses = (source) => {
            if (!source || typeof source !== 'object' || Array.isArray(source)) {
                return {};
            }
            return Object.entries(source).reduce((acc, [key, value]) => {
                acc[key] = cloneList(value);
                return acc;
            }, {});
        };

        let changed = false;

        const targetTierValues = [
            'autorites-locales',
            'agences-de-tourisme',
            'groupes-hoteliers',
            'vip',
            'touristes-hors-vip',
            'concierges-partenaires',
            'prestataires'
        ];
        const legacyTierValues = [
            'HealthcareProfessionals',
            'HCPAssociationsLearnedSocieties',
            'PatientAssociations',
            'blood-doner-associations',
            'PlasmaDonors',
            'HealthcareOrganizations',
            'GroupPurchasingOrganizations',
            'PublicOfficials',
            'PublicAuthorities',
            'Politicians',
            'DistributorsAndCommercialAgents',
            'Intermediaries',
            'ConsultingServicesProviders',
            'Suppliers',
            'PharmaceuticalCompanies'
        ];

        if (hasAnyValue(this.config.tiers, legacyTierValues) && !hasAllValue(this.config.tiers, targetTierValues)) {
            this.config.tiers = cloneList(fallback.tiers);
            changed = true;
        }

        const targetAudienceValues = [
            'hq-dubai-leadership',
            'dubai-luxury-operations',
            'turkey-europe-americas-middle-east',
            'indonesia-asian-premium-markets',
            'guest-privacy-confidentiality',
            'b2b-partnerships'
        ];
        const legacyAudienceValues = [
            'international-operations',
            'france-operations',
            'corporate-affairs',
            'plasma-collection-centers',
            'dcam',
            'finance-accounting-procurement',
            'industry'
        ];

        if (hasAnyValue(this.config.targetAudiences, legacyAudienceValues) && !hasAllValue(this.config.targetAudiences, targetAudienceValues)) {
            this.config.targetAudiences = cloneList(fallback.targetAudiences);
            changed = true;
        }

        const targetProcessValues = [
            'client-onboarding-kyc',
            'luxury-travel-design',
            'supplier-sourcing-due-diligence',
            'vip-guest-operations',
            'payments-deposits-refunds',
            'data-privacy-guest-confidentiality',
            'sanctions-restricted-party-screening',
            'complaints-incidents-crisis-handling',
            'partner-relationship-management'
        ];
        const legacyProcessValues = [
            'Stratégie',
            'Communication',
            "Management Qualité et Risques d'entreprise",
            'Mesure et Amélioration Qualité',
            'Gestion de la performance',
            'R&D et Réglementaire',
            'Production',
            'Commercialisation des produits',
            'Supply Chain',
            'Gestion des prestations',
            'Ressources humaines',
            'Achats',
            'Finance',
            'Systèmes transverses de connaissance et de documentation',
            'Système d’information (SI)',
            'Sites et Equipement',
            'Juridique Compliance Propriété Intellectuelle Assurances'
        ];

        if (hasAnyValue(this.config.processes, legacyProcessValues) && !hasAllValue(this.config.processes, targetProcessValues)) {
            this.config.processes = cloneList(fallback.processes);
            this.config.subProcesses = cloneSubProcesses(fallback.subProcesses);
            changed = true;
        }

        if (changed) {
            this.config.referentDirectory = this.normalizeReferentDirectory(fallback.referentDirectory);
        }

        return changed;
    }

    applyEntityModelMigration() {
        const targetEntities = [
            { value: 'HQ Dubai', label: 'Siège de Dubaï', referents: ['Amina El Mansouri — Chief Compliance Officer'] },
            { value: 'Dubai Operations', label: 'Opérations de Dubaï', referents: ['Karim Haddad — VP Luxury Operations'] },
            {
                value: 'Turkey Subsidiary',
                label: 'Filiale Turquie',
                markets: ['Europe', 'Americas', 'Middle East'],
                referents: ['Leila Demir — Turkey Market Director']
            },
            {
                value: 'Indonesia Subsidiary',
                label: 'Filiale Indonésie',
                markets: ['Marchés premium asiatiques en croissance'],
                referents: ['Raka Santoso — Indonesia Premium Markets Lead']
            }
        ];

        const targetColumns = [
            {
                key: 'dubai-platform',
                label: 'Plateforme de Dubaï',
                countries: ['HQ Dubai', 'Dubai Operations']
            },
            {
                key: 'turkey-covered-markets',
                label: 'Turquie — Europe, Amériques, Moyen-Orient',
                countries: ['Turkey Subsidiary']
            },
            {
                key: 'indonesia-premium-markets',
                label: 'Indonésie — marchés premium asiatiques en croissance',
                countries: ['Indonesia Subsidiary']
            }
        ];

        const currentEntities = Array.isArray(this.config?.countries)
            ? this.config.countries.map(entry => String(entry?.value || ''))
            : [];
        const currentSet = new Set(currentEntities);
        const legacyEntityValues = [
            'Allemagne',
            'Belgique',
            'Italie',
            'République Tchèque',
            'Turquie',
            'USA',
            'HQ',
            'France',
            'Benelux',
            'Germany',
            'Spain',
            'UK',
            'Mexico',
            'EuroPlasma',
            'LFB USA',
            'American Plasma',
            'HemaBiologics',
            'Distributors'
        ];
        const hasLegacySet = legacyEntityValues.some(value => currentSet.has(value));
        const hasTargetEntities = targetEntities.every(entity => currentSet.has(entity.value));
        const shouldMigrateEntities = !currentEntities.length || (hasLegacySet && !hasTargetEntities);

        let changed = false;
        if (shouldMigrateEntities) {
            this.config.countries = targetEntities.map(entity => ({ ...entity }));
            changed = true;
        } else {
            const targetByValue = new Map(targetEntities.map(entity => [entity.value, entity]));
            this.config.countries = (Array.isArray(this.config.countries) ? this.config.countries : []).map(entity => {
                const target = targetByValue.get(entity?.value);
                if (!target) {
                    return entity;
                }
                const normalized = { ...entity, label: target.label };
                if (Array.isArray(target.markets)) {
                    normalized.markets = [...target.markets];
                }
                if (entity?.label !== normalized.label || JSON.stringify(entity?.markets) !== JSON.stringify(normalized.markets)) {
                    changed = true;
                }
                return normalized;
            });
        }

        const normalizedTargets = this.normalizeCountryColumns(
            targetColumns,
            targetColumns,
            this.config.countries
        );
        const existing = Array.isArray(this.config?.countryColumns) ? this.config.countryColumns : [];
        const legacyColumnKeys = [
            'hq',
            'lfb-usa',
            'europasma',
            'pharma-affiliates-jv-plus-50',
            'distributors-jv-minus-50'
        ];
        const hasDeprecatedColumns = existing.some(column => legacyColumnKeys.includes(column?.key));
        const hasTargetColumns = targetColumns.every(target => existing.some(column => column?.key === target.key));
        const shouldMigrateColumns = !existing.length || hasDeprecatedColumns || (shouldMigrateEntities && !hasTargetColumns);
        if (shouldMigrateColumns) {
            this.config.countryColumns = normalizedTargets;
            changed = true;
        } else if (hasTargetColumns) {
            const targetColumnByKey = new Map(normalizedTargets.map(column => [column.key, column]));
            this.config.countryColumns = existing.map(column => {
                const target = targetColumnByKey.get(column?.key);
                if (!target) {
                    return column;
                }
                if (column.label !== target.label) {
                    changed = true;
                    return { ...column, label: target.label };
                }
                return column;
            });
        }

        return changed;
    }

    applyFeedbackButtonVisibility() {
        const shouldShow = Boolean(this.config?.ui?.showFeedbackButton);
        const toggleButton = document.getElementById('feedbackToggleButton');
        if (toggleButton) {
            toggleButton.hidden = !shouldShow;
            toggleButton.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
        }
        if (window.feedbackManager && typeof window.feedbackManager.setToggleVisibility === 'function') {
            window.feedbackManager.setToggleVisibility(shouldShow);
        }
    }

    normalizeCountryColumns(columnsSource, fallbackSource, availableList = []) {
        const availableValues = Array.isArray(availableList)
            ? availableList
                .map(item => {
                    if (item && typeof item === 'object') {
                        return typeof item.value === 'string' ? item.value.trim() : '';
                    }
                    return typeof item === 'string' ? item.trim() : '';
                })
                .filter(Boolean)
            : [];

        const availableSet = new Set(availableValues);

        const normalizeLabel = (key, label) => {
            if (key !== 'hq' || !label) {
                return label;
            }

            const normalized = label
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase();

            if (['hq', 'entites transverses', 'transversal entities'].includes(normalized)) {
                return 'Entités transverses';
            }

            return label;
        };

        const sanitize = (source) => {
            const normalized = [];
            const usedCountries = new Set();
            const seenKeys = new Set();

            (Array.isArray(source) ? source : []).forEach(entry => {
                if (!entry || typeof entry !== 'object') {
                    return;
                }

                const key = typeof entry.key === 'string' ? entry.key.trim() : '';
                const rawLabel = typeof entry.label === 'string' ? entry.label.trim() : '';
                const label = normalizeLabel(key, rawLabel);
                if (!key || !label || seenKeys.has(key)) {
                    return;
                }

                seenKeys.add(key);

                const countries = Array.isArray(entry.countries)
                    ? entry.countries
                        .map(value => typeof value === 'string' ? value.trim() : '')
                        .filter(value => value && availableSet.has(value) && !usedCountries.has(value))
                    : [];

                countries.forEach(value => usedCountries.add(value));
                normalized.push({ key, label, countries });
            });

            return { columns: normalized, usedCountries };
        };

        const distributeRemaining = (columns, usedCountries) => {
            if (!Array.isArray(columns) || !columns.length) {
                return [];
            }

            const remainder = availableValues.filter(value => !usedCountries.has(value));
            const mapped = columns.map(column => ({
                key: column.key,
                label: column.label,
                countries: Array.isArray(column.countries) ? [...column.countries] : []
            }));

            if (remainder.length && mapped.length) {
                remainder.forEach((value, index) => {
                    const target = mapped[index % mapped.length];
                    if (target && availableSet.has(value) && !target.countries.includes(value)) {
                        target.countries.push(value);
                    }
                });
            }

            mapped.forEach(column => {
                column.countries = column.countries.filter(value => availableSet.has(value));
            });

            return mapped;
        };

        let { columns, usedCountries } = sanitize(columnsSource);
        if (!(usedCountries instanceof Set)) {
            usedCountries = new Set();
        }

        if (!columns.length) {
            ({ columns, usedCountries } = sanitize(fallbackSource));
            if (!(usedCountries instanceof Set)) {
                usedCountries = new Set();
            }
        }

        if (!columns.length) {
            const defaults = [
                { key: 'collecte-distribution', label: 'Collecte & Distribution', countries: [] },
                { key: 'collecte', label: 'Collecte', countries: [] },
                { key: 'promotion', label: 'Promotion', countries: [] },
                { key: 'distribution', label: 'Distribution', countries: [] }
            ];
            ({ columns, usedCountries } = sanitize(defaults));
            if (!(usedCountries instanceof Set)) {
                usedCountries = new Set();
            }
        }

        if (!columns.length) {
            return [];
        }

        return distributeRemaining(columns, usedCountries);
    }

    getDefaultMindMapTheme() {
        return {
            id: 'impact-mapping',
            name: 'Impact mapping',
            columns: [
                { key: 'tiers', title: 'Tiers', subtitle: 'Quels tiers impactent vos activités ?', color: '#34d399' },
                { key: 'objectifs', title: 'Objectifs', subtitle: 'Quels sont vos objectifs ? Qui les portent ?', color: '#22c55e' },
                { key: 'comportements', title: 'Comportements attendus', subtitle: "Quels sont les comportements des tiers que l'on espère ?", color: '#0ea5e9' },
                { key: 'moyens', title: 'Moyens de corruption', subtitle: 'Quels moyens frauduleux pourraient faciliter ces comportements ?', color: '#1d4ed8' },
                { key: 'controle', title: 'Contrôle', subtitle: "Qu'est-ce qui permet prévenir ce comportement ?", color: '#eab308' },
                { key: 'contournement', title: 'Contournement', subtitle: 'Existe-t-il des moyens de contournement ?', color: '#f97316' },
                { key: 'probabilite', title: 'Probabilité', subtitle: 'Ce scénario est-il probable ?', color: '#ef4444' }
            ]
        };
    }

    normalizeMindMapThemeColumn(column, index, usedKeys, palette) {
        const colors = Array.isArray(palette) && palette.length
            ? palette
            : ['#34d399', '#22c55e', '#0ea5e9', '#1d4ed8', '#eab308', '#f97316', '#ef4444', '#a855f7', '#06b6d4'];
        const baseTitle = typeof column?.title === 'string' && column.title.trim()
            ? column.title.trim()
            : `Colonne ${index + 1}`;
        const rawKey = typeof column?.key === 'string' && column.key.trim()
            ? column.key.trim()
            : (typeof slugifyLabel === 'function'
                ? slugifyLabel(baseTitle)
                : baseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        let key = rawKey || `colonne-${index + 1}`;
        let suffix = 2;
        while (usedKeys.has(key)) {
            key = `${rawKey || `colonne-${index + 1}`}-${suffix}`;
            suffix += 1;
        }
        usedKeys.add(key);

        return {
            key,
            title: baseTitle,
            subtitle: typeof column?.subtitle === 'string' ? column.subtitle : '',
            color: typeof column?.color === 'string' && column.color.trim()
                ? column.color.trim()
                : colors[index % colors.length]
        };
    }

    normalizeMindMapThemes(source, fallback, activeId = '') {
        const palette = ['#34d399', '#22c55e', '#0ea5e9', '#1d4ed8', '#eab308', '#f97316', '#ef4444', '#a855f7', '#06b6d4'];
        const fallbackThemes = Array.isArray(fallback) && fallback.length
            ? fallback
            : [this.getDefaultMindMapTheme()];
        const baseThemes = Array.isArray(source) && source.length ? source : fallbackThemes;

        const themes = [];
        const usedIds = new Set();

        baseThemes.forEach((theme, themeIndex) => {
            const title = typeof theme?.name === 'string' && theme.name.trim()
                ? theme.name.trim()
                : `Theme ${themeIndex + 1}`;
            const rawId = typeof theme?.id === 'string' && theme.id.trim()
                ? theme.id.trim()
                : (typeof slugifyLabel === 'function'
                    ? slugifyLabel(title)
                    : title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

            let id = rawId || `theme-${themeIndex + 1}`;
            let suffix = 2;
            while (usedIds.has(id)) {
                id = `${rawId || `theme-${themeIndex + 1}`}-${suffix}`;
                suffix += 1;
            }
            usedIds.add(id);

            const usedKeys = new Set();
            const normalizedColumns = (Array.isArray(theme?.columns) ? theme.columns : [])
                .map((column, columnIndex) => this.normalizeMindMapThemeColumn(column, columnIndex, usedKeys, palette))
                .filter(Boolean);

            if (!normalizedColumns.length) {
                normalizedColumns.push(this.normalizeMindMapThemeColumn({}, 0, usedKeys, palette));
            }

            themes.push({ id, name: title, columns: normalizedColumns });
        });

        if (!themes.length) {
            themes.push(this.getDefaultMindMapTheme());
        }

        const resolvedActive = themes.some(theme => theme.id === activeId)
            ? activeId
            : (themes[0]?.id || '');

        return { themes, activeId: resolvedActive };
    }

    normalizeStatusKey(value) {
        if (value == null) {
            return '';
        }

        let normalized = String(value).trim().toLowerCase();
        if (!normalized) {
            return '';
        }

        if (typeof normalized.normalize === 'function') {
            normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }

        return normalized
            .replace(/[_\s]+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    getStatusAliasesByType(type) {
        const aliases = {
            risk: {
                brouillon: ['draft'],
                'a-valider': ['a-valider', 'a valider', 'to-validate', 'to validate'],
                'validated': ['valide', 'validee', 'validé', 'valida', 'validate', 'validated'],
                archive: ['archive', 'archived'],
                'not-included': ['not included', 'non included', 'non-included', 'not-included', 'na', 'n/a']
            },
            control: {
                actif: ['active'],
                'en-mise-en-place': ['en mise en place', 'being-implemented', 'being implemented'],
                'en-revision': ['en revision', 'under-review', 'under review'],
                obsolete: ['obsolete', 'obsoletee', 'obsolet']
            },
            actionPlan: {
                brouillon: ['draft'],
                'a-demarrer': ['a demarrer', 'to-start', 'to start'],
                'en-cours': ['en cours', 'in-progress', 'in progress'],
                delayed: ['retarde', 'en-retard', 'delay', 'delayed'],
                abandoned: ['abandonne', 'abandoned', 'cancelled', 'canceled'],
                termine: ['termine', 'terminee', 'completed']
            }
        };

        return aliases[type] || {};
    }

    normalizeStatusValue(type, ...candidates) {
        const aliasDefinition = this.getStatusAliasesByType(type);
        const aliasMap = {};

        Object.entries(aliasDefinition).forEach(([canonicalValue, values]) => {
            const canonicalKey = this.normalizeStatusKey(canonicalValue);
            if (canonicalKey) {
                aliasMap[canonicalKey] = canonicalValue;
            }
            (Array.isArray(values) ? values : []).forEach(alias => {
                const aliasKey = this.normalizeStatusKey(alias);
                if (aliasKey) {
                    aliasMap[aliasKey] = canonicalValue;
                }
            });
        });

        const configKeyByType = {
            risk: 'riskStatuses',
            control: 'controlStatuses',
            actionPlan: 'actionPlanStatuses'
        };
        const configKey = configKeyByType[type];
        const statusOptions = Array.isArray(this.config?.[configKey]) ? this.config[configKey] : [];

        statusOptions.forEach(option => {
            const canonicalValue = option?.value != null ? String(option.value) : '';
            const canonicalKey = this.normalizeStatusKey(canonicalValue);
            if (!canonicalKey) {
                return;
            }
            if (!aliasMap[canonicalKey]) {
                aliasMap[canonicalKey] = canonicalValue;
            }
            const labelKey = this.normalizeStatusKey(option?.label);
            if (labelKey && !aliasMap[labelKey]) {
                aliasMap[labelKey] = canonicalValue;
            }
        });

        for (const candidate of candidates) {
            const candidateKey = this.normalizeStatusKey(candidate);
            if (!candidateKey) {
                continue;
            }
            if (aliasMap[candidateKey]) {
                return aliasMap[candidateKey];
            }
        }

        const fallback = candidates.find(candidate => this.normalizeStatusKey(candidate));
        return fallback != null ? String(fallback).trim() : '';
    }

    getStatusLabel(type, ...candidates) {
        const normalizedValue = this.normalizeStatusValue(type, ...candidates);
        if (!normalizedValue) {
            return '';
        }

        const configKeyByType = {
            risk: 'riskStatuses',
            control: 'controlStatuses',
            actionPlan: 'actionPlanStatuses'
        };
        const configKey = configKeyByType[type];
        const statusOptions = Array.isArray(this.config?.[configKey]) ? this.config[configKey] : [];
        const option = statusOptions.find(item => this.normalizeStatusValue(type, item?.value) === normalizedValue);
        return option?.label || normalizedValue;
    }

    normalizeRisk(risk) {
        if (!risk || typeof risk !== 'object') {
            return {};
        }

        const normalized = { ...risk };
        const normalizeMultiValues = (values) => {
            const source = Array.isArray(values)
                ? values
                : (typeof values === 'string'
                    ? values.split(/[;,|]/).map(item => item.trim()).filter(Boolean)
                    : []);
            const seen = new Set();
            return source.reduce((acc, item) => {
                const value = typeof item === 'string' ? item.trim() : (item != null ? String(item).trim() : '');
                if (!value) return acc;
                const key = value.toLowerCase();
                if (seen.has(key)) return acc;
                seen.add(key);
                acc.push(value);
                return acc;
            }, []);
        };

        const processListSource = Array.isArray(risk?.processusAssocies)
            ? risk.processusAssocies
            : (risk?.processus ? [risk.processus] : []);
        const subProcessListSource = Array.isArray(risk?.sousProcessusAssocies)
            ? risk.sousProcessusAssocies
            : (risk?.sousProcessus ? [risk.sousProcessus] : []);
        const corruptionTypesSource = Array.isArray(risk?.typesCorruption)
            ? risk.typesCorruption
            : (risk?.typeCorruption ? [risk.typeCorruption] : []);
        const corruptionExposureSource = Array.isArray(risk?.corruptionExposureTypes)
            ? risk.corruptionExposureTypes
            : (risk?.corruptionExposure ? [risk.corruptionExposure] : []);
        const corruptionModesSource = Array.isArray(risk?.corruptionModes)
            ? risk.corruptionModes
            : (risk?.corruptionMode ? [risk.corruptionMode] : []);
        const targetAudiencesSource = Array.isArray(risk?.targetAudiences)
            ? risk.targetAudiences
            : (risk?.targetAudience ? [risk.targetAudience] : []);

        normalized.processusAssocies = normalizeMultiValues(processListSource);
        normalized.sousProcessusAssocies = normalizeMultiValues(subProcessListSource);
        normalized.typesCorruption = normalizeMultiValues(corruptionTypesSource);
        normalized.corruptionExposureTypes = normalizeMultiValues(corruptionExposureSource);
        normalized.corruptionModes = normalizeMultiValues(corruptionModesSource);
        normalized.targetAudiences = normalizeMultiValues(targetAudiencesSource);
        normalized.processus = normalized.processusAssocies[0] || '';
        normalized.sousProcessus = normalized.sousProcessusAssocies[0] || '';
        normalized.typeCorruption = normalized.typesCorruption[0] || '';
        normalized.corruptionExposure = normalized.corruptionExposureTypes[0] || '';
        normalized.corruptionMode = normalized.corruptionModes[0] || '';
        const allowedRiskThemes = new Set([
            'corruption',
            'personal-data',
            'international-sanctions',
            'discrimination'
        ]);
        const riskTheme = typeof risk?.riskTheme === 'string' ? risk.riskTheme.trim() : '';
        normalized.riskTheme = allowedRiskThemes.has(riskTheme) ? riskTheme : 'corruption';
        normalized.targetAudience = normalized.targetAudiences[0] || '';
        normalized.titre = typeof risk?.titre === 'string' ? risk.titre.trim() : '';
        normalized.example = typeof risk?.example === 'string' ? risk.example.trim() : '';
        normalized.avantagesIndus = normalizeMultiValues(risk?.avantagesIndus);
        normalized.avantagesAttendus = normalizeMultiValues(risk?.avantagesAttendus);
        normalized.tiers = normalizeMultiValues(risk?.tiers);
        normalized.actionPlans = normalizeMultiValues(risk?.actionPlans);

        const controlAssignments = Array.isArray(risk?.controlAssignments) ? risk.controlAssignments : [];
        normalized.controlAssignments = controlAssignments
            .map(entry => {
                const controlId = entry?.controlId != null ? entry.controlId : entry?.id;
                if (controlId == null) {
                    return null;
                }
                return {
                    controlId,
                    transverse: !!entry?.transverse,
                    avantagesIndus: normalizeMultiValues(entry?.avantagesIndus)
                };
            })
            .filter(Boolean);

        if (typeof normalizeAggravatingFactors === 'function') {
            normalized.aggravatingFactors = normalizeAggravatingFactors(risk.aggravatingFactors, normalized.riskTheme || 'corruption');
        } else {
            const group1 = Array.isArray(risk?.aggravatingFactors?.group1)
                ? [...risk.aggravatingFactors.group1]
                : [];
            const group2 = Array.isArray(risk?.aggravatingFactors?.group2)
                ? [...risk.aggravatingFactors.group2]
                : [];
            normalized.aggravatingFactors = { theme: normalized.riskTheme || 'corruption', group1, group2 };
        }

        const rawCoefficient = Number(risk?.aggravatingCoefficient);
        let coefficient = Number.isFinite(rawCoefficient) && rawCoefficient >= 1 ? rawCoefficient : 1;

        if (typeof computeAggravatingCoefficientFromGroups === 'function') {
            const computed = computeAggravatingCoefficientFromGroups(normalized.aggravatingFactors);
            if (computed > coefficient) {
                coefficient = computed;
            }
        }

        normalized.aggravatingCoefficient = coefficient;

        const mitigationLevel = typeof getRiskMitigationEffectiveness === 'function'
            ? getRiskMitigationEffectiveness(risk)
            : (typeof normalizeMitigationEffectiveness === 'function'
                ? normalizeMitigationEffectiveness(risk?.mitigationEffectiveness)
                : (typeof DEFAULT_MITIGATION_EFFECTIVENESS === 'string'
                    ? DEFAULT_MITIGATION_EFFECTIVENESS
                    : 'insuffisant'));
        normalized.mitigationEffectiveness = mitigationLevel;

        const postMitigationLevel = typeof getRiskPostActionMitigationEffectiveness === 'function'
            ? getRiskPostActionMitigationEffectiveness(risk)
            : (typeof normalizeMitigationEffectiveness === 'function'
                ? normalizeMitigationEffectiveness(risk?.postActionMitigationEffectiveness || mitigationLevel)
                : mitigationLevel);
        normalized.postActionMitigationEffectiveness = postMitigationLevel;

        if (typeof getMitigationColumnFromLevel === 'function') {
            normalized.probNet = getMitigationColumnFromLevel(mitigationLevel);
            normalized.probPost = Math.min(
                getMitigationColumnFromLevel(postMitigationLevel),
                normalized.probNet
            );
        }

        const countriesSource = Array.isArray(risk?.paysExposes)
            ? risk.paysExposes
            : (Array.isArray(risk?.countries)
                ? risk.countries
                : []);
        const normalizedCountries = [];
        const seenCountries = new Set();
        countriesSource.forEach(value => {
            const label = typeof value === 'string'
                ? value.trim()
                : (value != null ? String(value) : '');
            if (!label) {
                return;
            }
            const key = label.toLowerCase();
            if (seenCountries.has(key)) {
                return;
            }
            seenCountries.add(key);
            normalizedCountries.push(label);
        });
        normalized.paysExposes = normalizedCountries;

        const brutScore = typeof getRiskBrutScore === 'function'
            ? getRiskBrutScore(normalized)
            : (Number(normalized.probBrut) || 0) * (Number(normalized.impactBrut) || 0);
        const severity = typeof getRiskSeverityFromScore === 'function'
            ? getRiskSeverityFromScore(brutScore)
            : (brutScore >= 12 ? 'critique' : brutScore >= 6 ? 'fort' : brutScore >= 3 ? 'modere' : 'faible');
        if (typeof getNetImpactValueFromSeverity === 'function') {
            normalized.impactNet = getNetImpactValueFromSeverity(severity);
            normalized.impactPost = getNetImpactValueFromSeverity(severity);
        }

        normalized.statut = this.normalizeStatusValue(
            'risk',
            risk?.statut,
            risk?.status,
            risk?.statusLabel,
            risk?.state
        ) || 'brouillon';

        return normalized;
    }

    normalizeActionPlan(plan) {
        if (!plan || typeof plan !== 'object') {
            return {};
        }

        const normalized = { ...plan };
        const riskRefs = Array.isArray(plan.risks)
            ? plan.risks
            : (Array.isArray(plan.riskIds) ? plan.riskIds : []);
        const seen = new Set();
        normalized.risks = riskRefs.reduce((acc, riskId) => {
            if (riskId === undefined || riskId === null || riskId === '') {
                return acc;
            }
            const key = String(riskId);
            if (seen.has(key)) {
                return acc;
            }
            seen.add(key);
            acc.push(riskId);
            return acc;
        }, []);
        delete normalized.riskIds;
        return normalized;
    }

    reconcileRiskActionPlanLinks() {
        const risks = Array.isArray(this.risks) ? this.risks : [];
        const plans = Array.isArray(this.actionPlans) ? this.actionPlans : [];

        risks.forEach(risk => {
            risk.actionPlans = Array.isArray(risk?.actionPlans) ? risk.actionPlans : [];
        });

        plans.forEach(plan => {
            plan.risks = Array.isArray(plan?.risks) ? plan.risks : [];
            plan.risks.forEach(riskId => {
                const risk = risks.find(item => idsEqual(item?.id, riskId));
                if (!risk) return;
                risk.actionPlans = Array.isArray(risk.actionPlans) ? risk.actionPlans : [];
                if (!risk.actionPlans.some(planId => idsEqual(planId, plan.id))) {
                    risk.actionPlans.push(plan.id);
                }
            });
        });

        risks.forEach(risk => {
            risk.actionPlans.forEach(planId => {
                const plan = plans.find(item => idsEqual(item?.id, planId));
                if (!plan) return;
                plan.risks = Array.isArray(plan.risks) ? plan.risks : [];
                if (!plan.risks.some(riskId => idsEqual(riskId, risk.id))) {
                    plan.risks.push(risk.id);
                }
            });
        });
    }

    normalizeInterviewDate(value) {
        if (value == null) {
            return '';
        }

        const asString = String(value).trim();
        if (!asString) {
            return '';
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(asString)) {
            return asString;
        }

        if (/^\d{2}\/\d{2}\/\d{4}$/.test(asString)) {
            const [day, month, year] = asString.split('/');
            return `${year}-${month}-${day}`;
        }

        const parsed = new Date(asString);
        if (!Number.isNaN(parsed.getTime())) {
            const year = parsed.getFullYear();
            const month = String(parsed.getMonth() + 1).padStart(2, '0');
            const day = String(parsed.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        return '';
    }

    normalizeInterviewScopes(scopes) {
        if (!Array.isArray(scopes)) {
            return [];
        }

        const seen = new Set();
        const normalized = [];

        scopes.forEach(scope => {
            if (!scope || typeof scope !== 'object') {
                return;
            }

            const processValueRaw = scope.processValue ?? scope.process;
            const subProcessValueRaw = scope.subProcessValue ?? scope.subProcess ?? scope.value;

            const processValue = typeof processValueRaw === 'string'
                ? processValueRaw.trim()
                : '';
            const subProcessValue = typeof subProcessValueRaw === 'string'
                ? subProcessValueRaw.trim()
                : '';

            if (!processValue && !subProcessValue) {
                return;
            }

            const key = `${processValue}::${subProcessValue}`;
            if (seen.has(key)) {
                return;
            }
            seen.add(key);

            const processLabelRaw = scope.processLabel ?? scope.processName ?? scope.label ?? '';
            const subProcessLabelRaw = scope.subProcessLabel ?? scope.label ?? scope.subLabel ?? '';

            const processLabel = processValue
                ? (processLabelRaw || this.getProcessLabel(processValue) || processValue)
                : (processLabelRaw || 'Processus');
            const subProcessLabel = subProcessValue
                ? (subProcessLabelRaw || this.getSubProcessLabel(processValue, subProcessValue) || subProcessValue)
                : '';

            normalized.push({
                key,
                processValue,
                processLabel,
                subProcessValue,
                subProcessLabel,
                type: subProcessValue ? 'subProcess' : 'process'
            });
        });

        return normalized;
    }

    normalizeInterview(interview) {
        if (!interview || typeof interview !== 'object') {
            return null;
        }

        const title = typeof interview.title === 'string' ? interview.title.trim() : '';

        const referents = Array.isArray(interview.referents)
            ? interview.referents
                .map(ref => (typeof ref === 'string' ? ref.trim() : ''))
                .filter(Boolean)
            : [];
        const uniqueReferents = Array.from(new Set(referents));

        const normalizedDate = this.normalizeInterviewDate(interview.date);
        const notes = typeof interview.notes === 'string' ? interview.notes : '';

        const rawScopes = Array.isArray(interview.scopes)
            ? interview.scopes
            : Array.isArray(interview.subProcesses)
                ? interview.subProcesses.map(sub => ({
                    processValue: sub.processValue ?? sub.process,
                    processLabel: sub.processLabel ?? sub.processName,
                    subProcessValue: sub.value ?? sub.subProcessValue ?? sub.subProcess,
                    subProcessLabel: sub.label ?? sub.subProcessLabel ?? sub.name
                }))
                : [];

        const normalizedScopes = this.normalizeInterviewScopes(rawScopes);

        const processesMap = new Map();
        normalizedScopes.forEach(scope => {
            if (!scope || !scope.processValue) {
                return;
            }
            if (!processesMap.has(scope.processValue)) {
                processesMap.set(scope.processValue, {
                    value: scope.processValue,
                    label: scope.processLabel || this.getProcessLabel(scope.processValue) || scope.processValue
                });
            }
        });

        const subProcesses = normalizedScopes
            .filter(scope => scope.subProcessValue)
            .map(scope => ({
                processValue: scope.processValue,
                processLabel: scope.processLabel,
                value: scope.subProcessValue,
                label: scope.subProcessLabel
            }));

        const createdAt = typeof interview.createdAt === 'string' && interview.createdAt
            ? interview.createdAt
            : new Date().toISOString();
        const updatedAt = typeof interview.updatedAt === 'string' && interview.updatedAt
            ? interview.updatedAt
            : createdAt;

        const fileIndex = this.getInterviewFileIndex(interview);
        const fileName = typeof interview.fileName === 'string' && interview.fileName.trim()
            ? interview.fileName.trim()
            : undefined;

        return {
            id: interview.id,
            fileIndex: fileIndex || undefined,
            fileName,
            title,
            referents: uniqueReferents,
            date: normalizedDate,
            notes,
            scopes: normalizedScopes,
            processes: Array.from(processesMap.values()),
            subProcesses,
            createdAt,
            updatedAt,
            mindMap: this.normalizeMindMapState(interview.mindMap)
        };
    }

    getMindMapColumns() {
        const themes = Array.isArray(this.config?.mindMapThemes) && this.config.mindMapThemes.length
            ? this.config.mindMapThemes
            : [this.getDefaultMindMapTheme()];
        const activeId = typeof this.config?.mindMapActiveThemeId === 'string'
            ? this.config.mindMapActiveThemeId
            : (themes[0]?.id || '');
        const activeTheme = themes.find(theme => theme.id === activeId) || themes[0];

        if (!activeTheme || !Array.isArray(activeTheme.columns)) {
            return this.getDefaultMindMapTheme().columns;
        }

        const normalizedColumns = activeTheme.columns
            .map(column => ({ ...column }))
            .filter(column => typeof column?.key === 'string' && column.key);

        return normalizedColumns.length ? normalizedColumns : this.getDefaultMindMapTheme().columns;
    }

    getDefaultMindMapLinkStyle() {
        if (typeof MindMapRenderer !== 'undefined' && MindMapRenderer.DEFAULT_STYLE_KEY) {
            return MindMapRenderer.DEFAULT_STYLE_KEY;
        }

        return 'smooth';
    }

    createEmptyMindMapState() {
        return {
            version: 1,
            data: null
        };
    }

    generateMindMapNodeId() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }

        return `mindmap-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }

    createMindMapNode(text = 'Nouvelle idée') {
        return {
            id: this.generateMindMapNodeId(),
            text,
            children: [],
            collapsed: false,
            tag: '',
            linkedFrom: null
        };
    }

    normalizeMindMapNode(node) {
        if (!node || typeof node !== 'object') {
            return this.createMindMapNode();
        }

        const text = typeof node.text === 'string' && node.text.trim()
            ? node.text.trim()
            : 'Nouvelle idée';

        const children = Array.isArray(node.children)
            ? node.children.map(child => this.normalizeMindMapNode(child)).filter(Boolean)
            : [];

        const tag = typeof node.tag === 'string' ? node.tag : '';
        const collapsed = Boolean(node.collapsed);
        const linkedFrom = node.linkedFrom && typeof node.linkedFrom === 'object'
            && typeof node.linkedFrom.column === 'string'
            && typeof node.linkedFrom.nodeId === 'string'
            ? { column: node.linkedFrom.column, nodeId: node.linkedFrom.nodeId }
            : null;

        return {
            id: node.id || this.generateMindMapNodeId(),
            text,
            children,
            collapsed,
            tag,
            linkedFrom
        };
    }

    normalizeMindMapState(state) {
        if (!state || typeof state !== 'object') {
            return this.createEmptyMindMapState();
        }

        if (state.version !== 1) {
            return this.createEmptyMindMapState();
        }

        return {
            version: 1,
            data: state.data && typeof state.data === 'object'
                ? this.cloneMindMapModuleState(state.data)
                : null
        };
    }

    cloneMindMapModuleState(state) {
        if (typeof structuredClone === 'function') {
            try {
                return structuredClone(state);
            } catch (error) {
                // fallback to JSON cloning
            }
        }

        try {
            return JSON.parse(JSON.stringify(state));
        } catch (error) {
            return state && typeof state === 'object' ? { ...state } : state;
        }
    }

    resolveMindMapLinkStyle(styleKey) {
        if (typeof MindMapRenderer !== 'undefined' && typeof MindMapRenderer.prototype?.resolveStyleKey === 'function') {
            const renderer = this.getMindMapRenderer();
            return renderer.resolveStyleKey(styleKey);
        }

        const allowed = ['smooth', 'orthogonal', 'fluid'];
        return allowed.includes(styleKey) ? styleKey : this.getDefaultMindMapLinkStyle();
    }

    resolveMindMapLayoutMode(mode) {
        const allowed = ['compact', 'balanced', 'radial'];
        return allowed.includes(mode) ? mode : 'balanced';
    }

    getCurrentMindMapState() {
        return this.normalizeMindMapState(this.interviewMindMapState);
    }

    getMindMapColumnColor(columnKey) {
        const column = this.getMindMapColumns().find(entry => entry.key === columnKey);
        return column?.color || '#0ea5e9';
    }

    getMindMapColumnTitle(columnKey) {
        const column = this.getMindMapColumns().find(entry => entry.key === columnKey);
        return column?.title || 'Colonne suivante';
    }

    getNextMindMapColumnKey(currentKey) {
        const columns = this.getMindMapColumns();
        const currentIndex = columns.findIndex(column => column.key === currentKey);
        if (currentIndex === -1 || currentIndex >= columns.length - 1) {
            return null;
        }
        return columns[currentIndex + 1].key;
    }

    resetMindMapState() {
        this.interviewMindMapState = this.createEmptyMindMapState();
        this.renderMindMap();
        this.markUnsavedChange('interviewForm');
    }

    updateMindMapZoom(value) {
        const numeric = Number(value) || 100;
        const ratio = Math.min(Math.max(numeric / 100, 0.7), 1.5);
        this.interviewMindMapState = {
            ...this.getCurrentMindMapState(),
            zoom: ratio
        };
        this.syncMindMapZoomControls(ratio);
        this.renderMindMap();
    }

    syncMindMapZoomControls(zoom) {
        if (typeof document === 'undefined') {
            return;
        }

        const zoomInput = document.getElementById('mindmapZoom');
        const zoomLabel = document.getElementById('mindmapZoomValue');
        const percentage = Math.round((zoom || 1) * 100);

        if (zoomInput) {
            zoomInput.value = percentage;
        }

        if (zoomLabel) {
            zoomLabel.textContent = `${percentage}%`;
        }
    }

    syncMindMapStyleControls(styleKey) {
        if (typeof document === 'undefined') {
            return;
        }

        const select = document.getElementById('mindmapLinkStyle');
        if (select) {
            select.value = this.resolveMindMapLinkStyle(styleKey);
        }
    }

    syncMindMapLayoutControls(mode) {
        if (typeof document === 'undefined') {
            return;
        }

        const select = document.getElementById('mindmapLayoutMode');
        if (select) {
            select.value = this.resolveMindMapLayoutMode(mode);
        }
    }

    updateMindMapStyle(styleKey) {
        const resolvedStyle = this.resolveMindMapLinkStyle(styleKey);
        this.interviewMindMapState = {
            ...this.getCurrentMindMapState(),
            linkStyle: resolvedStyle
        };
        this.syncMindMapStyleControls(resolvedStyle);
        this.updateMindMapLinks();
        this.markUnsavedChange('interviewForm');
    }

    updateMindMapLayoutMode(mode) {
        const resolvedMode = this.resolveMindMapLayoutMode(mode);
        this.interviewMindMapState = {
            ...this.getCurrentMindMapState(),
            layoutMode: resolvedMode
        };
        this.syncMindMapLayoutControls(resolvedMode);
        this.applyMindMapAutoLayout();
        this.markUnsavedChange('interviewForm');
    }

    toggleMindMapToolbar() {
        this.mindMapToolbarExpanded = !this.mindMapToolbarExpanded;
        this.applyMindMapLayoutPreferences();
    }

    toggleMindMapMiniMap() {
        this.mindMapMiniMapVisible = !this.mindMapMiniMapVisible;
        this.applyMindMapLayoutPreferences();
        if (this.mindMapMiniMapVisible) {
            this.refreshMindMapMiniMap();
        }
    }

    applyMindMapLayoutPreferences() {
        if (typeof document === 'undefined') {
            return;
        }

        const modalContent = document.querySelector('#mindmapModal .mindmap-content');
        const toolbar = document.querySelector('#mindmapModal .mindmap-toolbar');
        const miniMap = document.getElementById('mindmapMiniMap');
        const toolbarToggle = document.getElementById('mindmapToolbarToggle');
        const miniMapToggle = document.getElementById('mindmapMiniMapToggle');

        if (modalContent) {
            modalContent.classList.toggle('toolbar-visible', this.mindMapToolbarExpanded);
        }

        if (toolbar) {
            toolbar.hidden = !this.mindMapToolbarExpanded;
        }

        if (miniMap) {
            miniMap.classList.toggle('is-visible', this.mindMapMiniMapVisible);
        }

        if (toolbarToggle) {
            toolbarToggle.textContent = this.mindMapToolbarExpanded
                ? 'Masquer les actions'
                : 'Afficher les actions';
            toolbarToggle.setAttribute('aria-pressed', this.mindMapToolbarExpanded.toString());
        }

        if (miniMapToggle) {
            miniMapToggle.textContent = this.mindMapMiniMapVisible
                ? 'Masquer la mini-carte'
                : 'Afficher la mini-carte';
            miniMapToggle.setAttribute('aria-pressed', this.mindMapMiniMapVisible.toString());
        }
    }

    getMindMapFrame() {
        if (typeof document === 'undefined') {
            return null;
        }

        return document.getElementById('mindmapFrame');
    }

    registerMindMapMessageHandlers() {
        if (typeof window === 'undefined' || this.mindMapMessageHandler) {
            return;
        }

        this.mindMapMessageHandler = (event) => {
            const data = event?.data;
            if (!data || data.source !== 'mindmap') {
                return;
            }

            const frame = this.getMindMapFrame();
            if (frame?.contentWindow && event.source !== frame.contentWindow) {
                return;
            }

            if (data.type === 'mindmap:ready') {
                if (this.pendingMindMapPayload && frame?.contentWindow) {
                    frame.contentWindow.postMessage({
                        source: 'rms',
                        type: 'mindmap:applyState',
                        payload: this.pendingMindMapPayload
                    }, '*');
                    this.pendingMindMapPayload = null;
                }
                return;
            }

            if (data.type === 'mindmap:state' && data.requestId) {
                if (data.requestId !== this.pendingMindMapStateRequestId) {
                    return;
                }
                this.pendingMindMapStateRequestId = null;
                if (!this.mindMapReadOnlyMode) {
                    this.interviewMindMapState = this.normalizeMindMapState(data.payload);
                    this.markUnsavedChange('interviewForm');
                }
            }
        };

        window.addEventListener('message', this.mindMapMessageHandler);
    }

    sendMindMapStateToFrame(payload) {
        const frame = this.getMindMapFrame();
        if (!frame) {
            return;
        }

        let applied = false;
        try {
            const applier = frame.contentWindow?.applyMindMapState;
            if (typeof applier === 'function') {
                applier(payload);
                applied = true;
            }
        } catch (error) {
            applied = false;
        }

        if (!applied) {
            this.pendingMindMapPayload = payload;
            if (frame.contentWindow) {
                frame.contentWindow.postMessage({
                    source: 'rms',
                    type: 'mindmap:applyState',
                    payload
                }, '*');
            }
        }
    }

    requestMindMapStateFromFrame() {
        const frame = this.getMindMapFrame();
        if (!frame?.contentWindow) {
            return;
        }
        const requestId = `mindmap-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        this.pendingMindMapStateRequestId = requestId;
        frame.contentWindow.postMessage({
            source: 'rms',
            type: 'mindmap:requestState',
            requestId
        }, '*');
    }

    pushMindMapStateToFrame() {
        this.sendMindMapStateToFrame(this.buildMindMapModuleStateForFrame());
    }

    captureMindMapStateFromFrame() {
        if (this.mindMapReadOnlyMode) {
            return;
        }
        const frame = this.getMindMapFrame();
        let exported = false;
        try {
            const exporter = frame?.contentWindow?.exportMindMapState;
            if (typeof exporter === 'function') {
                const state = exporter();
                this.interviewMindMapState = this.normalizeMindMapState(state);
                this.markUnsavedChange('interviewForm');
                exported = true;
            }
        } catch (error) {
            exported = false;
        }

        if (!exported) {
            this.requestMindMapStateFromFrame();
        }
    }

    openMindMapModal(options = {}) {
        if (typeof document === 'undefined') {
            return;
        }

        const { readOnly = false, state = null } = options;
        const modal = document.getElementById('mindmapModal');
        const frame = this.getMindMapFrame();
        const stateToApply = readOnly
            ? this.normalizeMindMapState(state)
            : this.getCurrentMindMapState();
        this.mindMapReadOnlyMode = readOnly;
        if (!readOnly) {
            this.interviewMindMapState = stateToApply;
        }

        if (frame) {
            const desiredSrc = readOnly
                ? 'mindmap/index.html?mode=readonly'
                : 'mindmap/index.html';
            const applyState = () => {
                this.sendMindMapStateToFrame(this.buildMindMapModuleStateForFrame(stateToApply));
            };
            if (frame.getAttribute('src') !== desiredSrc) {
                frame.setAttribute('src', desiredSrc);
                frame.addEventListener('load', applyState, { once: true });
            } else {
                let canApplyImmediately = false;
                try {
                    canApplyImmediately = frame.contentWindow
                        && typeof frame.contentWindow.applyMindMapState === 'function';
                } catch (error) {
                    canApplyImmediately = false;
                }

                if (canApplyImmediately) {
                    applyState();
                } else {
                    frame.addEventListener('load', applyState, { once: true });
                }
            }
        }

        if (modal) {
            modal.classList.add('show');
        }
    }

    closeMindMapModal(options = {}) {
        if (typeof document === 'undefined') {
            return;
        }

        const { skipCapture = false } = options;
        const modal = document.getElementById('mindmapModal');
        if (modal) {
            if (!skipCapture && !this.mindMapReadOnlyMode) {
                this.captureMindMapStateFromFrame();
            }
            modal.classList.remove('show');
        }
        this.mindMapReadOnlyMode = false;
    }

    renderMindMap(focusNodeId = null) {
        if (typeof document === 'undefined') {
            return;
        }

        const workspace = document.getElementById('mindmapWorkspace');
        if (!workspace) {
            return;
        }

        const state = this.getCurrentMindMapState();
        this.interviewMindMapState = state;

        workspace.innerHTML = '';
        workspace.style.transform = `scale(${state.zoom})`;
        workspace.style.setProperty('--mindmap-zoom', state.zoom);

        const linkLayer = document.getElementById('mindmapLinkLayer');
        const workspaceWrapper = workspace.closest('.mindmap-workspace-wrapper');

        if (workspaceWrapper) {
            workspaceWrapper.style.setProperty('--mindmap-zoom', state.zoom);
        }

        if (linkLayer) {
            linkLayer.style.transform = `scale(${state.zoom})`;
        }

        this.registerMindMapLinkListeners(workspaceWrapper);

        const columns = this.getMindMapColumns();
        columns.forEach((column, index) => {
            const columnElement = document.createElement('div');
            columnElement.className = 'mindmap-column';
            columnElement.dataset.column = column.key;
            columnElement.style.setProperty('--mindmap-accent', column.color);

            const header = document.createElement('div');
            header.className = 'mindmap-column-header';
            header.innerHTML = `
                <div class="mindmap-column-title">
                    <div class="mindmap-column-label">${column.title}</div>
                    <div class="mindmap-column-subtitle">${column.subtitle}</div>
                </div>
                <span class="mindmap-column-counter">${(state.nodes[column.key] || []).length} point(s)</span>
            `;
            columnElement.appendChild(header);

            const body = document.createElement('div');
            body.className = 'mindmap-column-body';
            body.addEventListener('dragover', event => this.handleMindMapDragOver(event));
            body.addEventListener('drop', event => this.handleMindMapDrop(event, column.key));

            const nodes = Array.isArray(state.nodes?.[column.key]) ? state.nodes[column.key] : [];
            nodes.forEach(node => {
                body.appendChild(this.renderMindMapNode(node, column.key));
            });

            columnElement.appendChild(body);

            const addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.className = 'btn btn-outline mindmap-add-button';
            addButton.textContent = '+ Ajouter une idée';
            addButton.addEventListener('click', () => {
                const newId = this.addMindMapNode(column.key);
                this.renderMindMap(newId);
                this.markUnsavedChange('interviewForm');
            });
            columnElement.appendChild(addButton);

            workspace.appendChild(columnElement);
        });

        this.syncMindMapZoomControls(state.zoom);
        this.syncMindMapStyleControls(state.linkStyle);
        this.syncMindMapLayoutControls(state.layoutMode);
        if (this.mindMapMiniMapVisible) {
            this.refreshMindMapMiniMap();
        } else {
            const miniMap = document.getElementById('mindmapMiniMap');
            if (miniMap) {
                miniMap.innerHTML = '';
            }
        }

        if (focusNodeId) {
            this.focusMindMapNode(focusNodeId);
        }

        this.applyMindMapAutoLayout();
    }

    getMindMapRenderer() {
        if (typeof MindMapRenderer === 'undefined') {
            return null;
        }

        if (!this.mindMapRenderer) {
            const externalFactory = typeof window !== 'undefined' && typeof window.createMindMapRenderingEngine === 'function'
                ? () => window.createMindMapRenderingEngine()
                : null;

            this.mindMapRenderer = new MindMapRenderer({
                engineFactory: externalFactory,
                externalBezierClass: typeof Bezier !== 'undefined' ? Bezier : undefined
            });
        }

        if (!this.mindMapRenderer.externalBezierClass && typeof Bezier !== 'undefined') {
            this.mindMapRenderer.setExternalBezierClass(Bezier);
        }

        return this.mindMapRenderer;
    }

    registerMindMapLinkListeners(workspaceWrapper) {
        if (typeof document === 'undefined') {
            return;
        }

        if (!workspaceWrapper || this.mindMapLinkListenersRegistered) {
            return;
        }

        this.mindMapLinkUpdateHandler = () => this.updateMindMapLinks();
        workspaceWrapper.addEventListener('scroll', this.mindMapLinkUpdateHandler, { passive: true });
        window.addEventListener('resize', this.mindMapLinkUpdateHandler);
        this.mindMapLinkListenersRegistered = true;
    }

    updateMindMapLinks() {
        if (typeof document === 'undefined') {
            return;
        }

        const linkLayer = document.getElementById('mindmapLinkLayer');
        const workspace = document.getElementById('mindmapWorkspace');
        const wrapper = workspace?.closest('.mindmap-workspace-wrapper');
        const renderer = this.getMindMapRenderer();

        if (!linkLayer || !workspace || !wrapper || !renderer) {
            return;
        }

        const state = this.getCurrentMindMapState();
        const columns = this.getMindMapColumns();
        const linkDescriptors = [];

        const drawLinksForNodes = (nodes, columnKey) => {
            if (!Array.isArray(nodes)) {
                return;
            }

            nodes.forEach(node => {
                if (node?.linkedFrom?.nodeId && node?.linkedFrom?.column) {
                    const descriptor = this.drawMindMapLink(node);
                    if (descriptor) {
                        linkDescriptors.push(descriptor);
                    }
                }

                if (Array.isArray(node?.children) && !node.collapsed) {
                    node.children.forEach(child => {
                        const descriptor = this.drawMindMapHierarchyLink(node, child, columnKey);
                        if (descriptor) {
                            linkDescriptors.push(descriptor);
                        }
                    });
                    drawLinksForNodes(node.children, columnKey);
                }
            });
        };

        columns.forEach(column => drawLinksForNodes(state.nodes?.[column.key], column.key));

        renderer.render({
            linkLayer,
            wrapper,
            links: linkDescriptors,
            style: state.linkStyle
        });
    }

    drawMindMapLink(node) {
        const sourceSelector = `[data-node-id="${node.linkedFrom.nodeId}"] .mindmap-node-bubble`;
        const targetSelector = `[data-node-id="${node.id}"] .mindmap-node-bubble`;

        const sourceBubble = document.querySelector(sourceSelector);
        const targetBubble = document.querySelector(targetSelector);

        if (!sourceBubble || !targetBubble) {
            return;
        }

        const accent = this.getMindMapColumnColor(node.linkedFrom.column) || 'var(--primary-color)';
        return {
            type: 'reference',
            source: sourceBubble,
            target: targetBubble,
            accent,
            columnKey: node.linkedFrom.column
        };
    }

    drawMindMapHierarchyLink(parentNode, childNode, columnKey) {
        const parentBubble = document.querySelector(`[data-node-id="${parentNode.id}"] .mindmap-node-bubble`);
        const childBubble = document.querySelector(`[data-node-id="${childNode.id}"] .mindmap-node-bubble`);

        if (!parentBubble || !childBubble) {
            return;
        }

        const accent = this.getMindMapColumnColor(columnKey) || 'var(--primary-color)';

        return {
            type: 'hierarchy',
            source: parentBubble,
            target: childBubble,
            accent,
            columnKey
        };
    }

    applyMindMapAutoLayout() {
        if (typeof document === 'undefined') {
            return;
        }

        const wrapper = document.querySelector('.mindmap-workspace-wrapper');
        const workspace = document.getElementById('mindmapWorkspace');
        if (!wrapper || !workspace) {
            return;
        }

        this.resetMindMapNodeOffsets();

        window.requestAnimationFrame(() => {
            const layout = this.computeMindMapLayout(wrapper);
            if (!layout) {
                return;
            }

            workspace.style.setProperty('--mindmap-column-gap', `${layout.settings.columnGap}px`);
            workspace.style.setProperty('--mindmap-column-width', `${layout.settings.columnWidth}px`);

            wrapper.querySelectorAll('.mindmap-column-body').forEach(body => {
                const columnKey = body.closest('.mindmap-column')?.dataset?.column;
                body.classList.add('uses-auto-layout');
                body.style.height = `${Math.max(layout.columnHeights.get(columnKey) || layout.settings.minimumColumnHeight, layout.settings.minimumColumnHeight)}px`;
            });

            layout.positions.forEach((position, nodeId) => {
                const nodeElement = wrapper.querySelector(`[data-node-id="${nodeId}"]`);
                if (!nodeElement) {
                    return;
                }

                nodeElement.style.position = 'absolute';
                nodeElement.style.left = `${position.x}px`;
                nodeElement.style.top = `${position.y}px`;
                nodeElement.style.width = '100%';
                nodeElement.classList.add('is-auto-positioned');
                nodeElement.style.removeProperty('--mindmap-offset');
                nodeElement.style.transform = '';
            });

            this.updateMindMapLinks();
        });
    }

    resetMindMapNodeOffsets() {
        if (typeof document === 'undefined') {
            return;
        }

        document.querySelectorAll('.mindmap-node').forEach(node => {
            node.style.position = '';
            node.style.left = '';
            node.style.top = '';
            node.style.width = '';
            node.style.removeProperty('--mindmap-offset');
            node.style.transform = '';
            node.classList.remove('is-auto-positioned');
        });

        document.querySelectorAll('.mindmap-column-body').forEach(body => {
            body.classList.remove('uses-auto-layout');
            body.style.height = '';
        });
    }

    getMindMapLayoutSettings(mode) {
        const resolvedMode = this.resolveMindMapLayoutMode(mode);
        const presets = {
            compact: {
                columnGap: 24,
                columnWidth: 260,
                nodeGap: 18,
                rootGap: 32,
                padding: 12,
                minimumColumnHeight: 220,
                radialBend: 0,
                radialSpread: Math.PI
            },
            balanced: {
                columnGap: 32,
                columnWidth: 300,
                nodeGap: 26,
                rootGap: 38,
                padding: 16,
                minimumColumnHeight: 260,
                radialBend: 0,
                radialSpread: Math.PI
            },
            radial: {
                columnGap: 40,
                columnWidth: 320,
                nodeGap: 24,
                rootGap: 42,
                padding: 20,
                minimumColumnHeight: 320,
                radialBend: 36,
                radialSpread: Math.PI * 0.9
            }
        };

        return {
            mode: resolvedMode,
            estimatedNodeHeight: 96,
            ...presets[resolvedMode]
        };
    }

    computeMindMapLayout(wrapper) {
        if (!wrapper) {
            return null;
        }

        const state = this.getCurrentMindMapState();
        const settings = this.getMindMapLayoutSettings(state.layoutMode);
        const columns = this.getMindMapColumns();
        const columnIndexMap = new Map();
        columns.forEach((column, index) => columnIndexMap.set(column.key, index));

        const nodeHeights = new Map();
        wrapper.querySelectorAll('.mindmap-node').forEach(node => {
            const bubble = node.querySelector('.mindmap-node-bubble');
            const rect = bubble?.getBoundingClientRect();
            nodeHeights.set(node.dataset.nodeId, rect?.height || settings.estimatedNodeHeight);
        });

        const entries = [];
        const collectNodes = (nodes, columnKey, parentId = null) => {
            nodes.forEach(node => {
                entries.push({
                    id: node.id,
                    columnKey,
                    columnIndex: columnIndexMap.get(columnKey) || 0,
                    baseParentId: parentId,
                    linkParentId: node?.linkedFrom?.nodeId || null,
                    height: nodeHeights.get(node.id) || settings.estimatedNodeHeight
                });

                if (Array.isArray(node.children) && node.children.length) {
                    collectNodes(node.children, columnKey, node.id);
                }
            });
        };

        columns.forEach(column => collectNodes(state.nodes?.[column.key] || [], column.key));

        const metaMap = new Map();
        entries.forEach(entry => {
            metaMap.set(entry.id, {
                ...entry,
                children: [],
                parentId: null,
                y: 0
            });
        });

        const roots = [];
        metaMap.forEach(meta => {
            const parentId = meta.linkParentId || meta.baseParentId;
            meta.parentId = parentId;
        });

        metaMap.forEach(meta => {
            if (meta.parentId && metaMap.has(meta.parentId)) {
                metaMap.get(meta.parentId).children.push(meta);
            } else {
                roots.push(meta);
            }
        });

        if (!roots.length) {
            return null;
        }

        let cursorY = settings.padding;
        const layoutNode = (meta) => {
            if (!meta.children.length) {
                meta.y = cursorY;
                cursorY += meta.height + settings.nodeGap;
                return meta;
            }

            meta.children.forEach(child => layoutNode(child));
            const first = meta.children[0];
            const last = meta.children[meta.children.length - 1];
            const firstCenter = first.y + first.height / 2;
            const lastCenter = last.y + last.height / 2;
            meta.y = (firstCenter + lastCenter) / 2 - meta.height / 2;
            return meta;
        };

        roots.forEach((root, index) => {
            layoutNode(root);
            cursorY += settings.rootGap;
        });

        let maxY = 0;
        metaMap.forEach(meta => {
            maxY = Math.max(maxY, meta.y + meta.height);
        });

        const totalHeight = Math.max(maxY + settings.padding, settings.minimumColumnHeight);
        const centerY = totalHeight / 2;
        const positions = new Map();
        const columnHeights = new Map();

        metaMap.forEach(meta => {
            let x = 0;
            let y = meta.y;

            if (settings.mode === 'radial') {
                const angle = totalHeight ? ((y - centerY) / totalHeight) * settings.radialSpread : 0;
                const sway = Math.sin(angle) * settings.radialBend;
                const maxSway = settings.columnWidth * 0.25;
                x = Math.max(Math.min(sway, maxSway), -maxSway);
                y = centerY + Math.sin(angle) * ((meta.columnIndex + 1) * (settings.nodeGap + 12));
            }

            positions.set(meta.id, {
                x,
                y,
                columnKey: meta.columnKey,
                height: meta.height
            });

            const existingHeight = columnHeights.get(meta.columnKey) || settings.minimumColumnHeight;
            columnHeights.set(meta.columnKey, Math.max(existingHeight, y + meta.height + settings.padding));
        });

        return {
            positions,
            columnHeights,
            settings,
            totalHeight
        };
    }

    renderMindMapNode(node, columnKey) {
        const wrapper = document.createElement('div');
        wrapper.className = 'mindmap-node';
        wrapper.dataset.nodeId = node.id;
        wrapper.dataset.column = columnKey;
        wrapper.draggable = true;

        wrapper.addEventListener('dragstart', event => this.startMindMapDrag(event, columnKey, node.id));
        wrapper.addEventListener('dragover', event => this.handleMindMapDragOver(event));
        wrapper.addEventListener('drop', event => this.handleMindMapDrop(event, columnKey, node.id));

        const bubble = document.createElement('div');
        bubble.className = 'mindmap-node-bubble';
        bubble.style.setProperty('--mindmap-accent', this.getMindMapColumnColor(columnKey));

        const linkedFrom = node.linkedFrom;
        if (linkedFrom?.nodeId && linkedFrom?.column) {
            const link = document.createElement('div');
            link.className = 'mindmap-node-link';
            link.style.setProperty('--mindmap-accent', this.getMindMapColumnColor(linkedFrom.column));

            const sourceTitle = this.getMindMapColumnTitle(linkedFrom.column);
            const sourceText = this.findMindMapNodeText(linkedFrom.column, linkedFrom.nodeId) || 'Idée précédente';

            link.innerHTML = `
                <div class="mindmap-link-label">↗ ${sourceTitle}</div>
                <div class="mindmap-link-text">${sourceText}</div>
            `;

            bubble.appendChild(link);
        }

        const actions = document.createElement('div');
        actions.className = 'mindmap-node-actions';

        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.className = 'mindmap-node-action';
        toggleButton.textContent = node.collapsed ? '➕' : '➖';
        toggleButton.title = node.collapsed ? 'Déplier' : 'Replier';
        toggleButton.addEventListener('click', () => {
            this.toggleMindMapCollapse(columnKey, node.id);
        });
        actions.appendChild(toggleButton);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'mindmap-node-action';
        deleteButton.textContent = '✕';
        deleteButton.title = 'Supprimer ce nœud';
        deleteButton.addEventListener('click', () => {
            this.deleteMindMapNode(columnKey, node.id);
        });
        actions.appendChild(deleteButton);

        const text = document.createElement('div');
        text.className = 'mindmap-node-text';
        text.contentEditable = 'true';
        text.role = 'textbox';
        text.textContent = node.text || 'Nouvelle idée';
        text.dataset.placeholder = 'Idée...';
        text.addEventListener('input', () => {
            this.updateMindMapNodeText(columnKey, node.id, text.textContent);
        });
        text.addEventListener('keydown', event => this.handleMindMapKeyDown(event, columnKey, node.id));

        bubble.appendChild(actions);
        bubble.appendChild(text);

        if (columnKey === 'controle') {
            const tagWrapper = document.createElement('div');
            tagWrapper.className = 'mindmap-tag-row';
            const label = document.createElement('label');
            label.textContent = 'Nature du contrôle';
            label.className = 'mindmap-tag-label';

            const select = document.createElement('select');
            select.className = 'mindmap-tag-select';
            ['','Préventif','Réactif'].forEach(optionValue => {
                const option = document.createElement('option');
                option.value = optionValue;
                option.textContent = optionValue || 'Non renseigné';
                if (optionValue === (node.tag || '')) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
            select.addEventListener('change', () => {
                this.updateMindMapNodeTag(columnKey, node.id, select.value);
            });

            tagWrapper.appendChild(label);
            tagWrapper.appendChild(select);
            bubble.appendChild(tagWrapper);
        }

        const helper = document.createElement('div');
        helper.className = 'mindmap-helper';
        helper.textContent = 'Entrée = bulle sœur · Tabulation = colonne suivante + liaison';
        bubble.appendChild(helper);

        wrapper.appendChild(bubble);

        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'mindmap-children';
        if (node.collapsed) {
            childrenContainer.classList.add('collapsed');
        }

        if (!node.collapsed && Array.isArray(node.children)) {
            node.children.forEach(child => {
                childrenContainer.appendChild(this.renderMindMapNode(child, columnKey));
            });
        }

        wrapper.appendChild(childrenContainer);
        return wrapper;
    }

    updateMindMapNodeText(columnKey, nodeId, value) {
        const target = this.findMindMapNodeWithParent(columnKey, nodeId);
        if (!target || !target.node) {
            return;
        }

        target.node.text = (value || '').trim() || 'Nouvelle idée';
        this.markUnsavedChange('interviewForm');
        this.refreshMindMapMiniMap();
        this.updateMindMapLinks();
    }

    updateMindMapNodeTag(columnKey, nodeId, value) {
        const target = this.findMindMapNodeWithParent(columnKey, nodeId);
        if (!target || !target.node) {
            return;
        }

        target.node.tag = value;
        this.markUnsavedChange('interviewForm');
    }

    handleMindMapKeyDown(event, columnKey, nodeId) {
        const key = event?.key || '';
        if (key === 'Enter') {
            event.preventDefault();
            const newId = this.addMindMapSibling(columnKey, nodeId);
            this.renderMindMap(newId);
            this.markUnsavedChange('interviewForm');
            return;
        }

        if (key === 'Tab') {
            event.preventDefault();
            const nextColumn = this.getNextMindMapColumnKey(columnKey);
            const newId = nextColumn
                ? this.addMindMapLinkedNode(columnKey, nodeId, nextColumn)
                : this.addMindMapChild(columnKey, nodeId);
            this.renderMindMap(newId);
            this.markUnsavedChange('interviewForm');
        }
    }

    addMindMapNode(columnKey, parentId = null) {
        const state = this.getCurrentMindMapState();
        const newNode = this.createMindMapNode();

        if (parentId) {
            const target = this.findMindMapNodeWithParent(columnKey, parentId, state.nodes[columnKey]);
            if (target?.node) {
                target.node.children.push(newNode);
            }
        } else {
            state.nodes[columnKey].push(newNode);
        }

        this.interviewMindMapState = state;
        this.markUnsavedChange('interviewForm');
        return newNode.id;
    }

    addMindMapSibling(columnKey, nodeId) {
        const target = this.findMindMapNodeWithParent(columnKey, nodeId);
        if (!target || !target.list) {
            return null;
        }

        const newNode = this.createMindMapNode();
        target.list.splice(target.index + 1, 0, newNode);
        this.markUnsavedChange('interviewForm');
        return newNode.id;
    }

    addMindMapChild(columnKey, nodeId) {
        const target = this.findMindMapNodeWithParent(columnKey, nodeId);
        if (!target || !target.node) {
            return null;
        }

        const newNode = this.createMindMapNode();
        if (!Array.isArray(target.node.children)) {
            target.node.children = [];
        }
        target.node.children.push(newNode);
        this.markUnsavedChange('interviewForm');
        return newNode.id;
    }

    addMindMapLinkedNode(fromColumnKey, fromNodeId, targetColumnKey) {
        const state = this.getCurrentMindMapState();
        if (!targetColumnKey || !state.nodes[targetColumnKey]) {
            return null;
        }

        const newNode = this.createMindMapNode();
        newNode.linkedFrom = { column: fromColumnKey, nodeId: fromNodeId };

        state.nodes[targetColumnKey].push(newNode);
        this.interviewMindMapState = state;
        this.markUnsavedChange('interviewForm');
        return newNode.id;
    }

    deleteMindMapNode(columnKey, nodeId) {
        const removed = this.removeMindMapNode(columnKey, nodeId);
        if (removed) {
            this.renderMindMap();
            this.markUnsavedChange('interviewForm');
        }
    }

    toggleMindMapCollapse(columnKey, nodeId) {
        const target = this.findMindMapNodeWithParent(columnKey, nodeId);
        if (!target || !target.node) {
            return;
        }

        target.node.collapsed = !target.node.collapsed;
        this.renderMindMap(nodeId);
        this.markUnsavedChange('interviewForm');
    }

    expandAllMindMapNodes() {
        this.walkMindMapNodes(node => {
            node.collapsed = false;
        });
        this.renderMindMap();
    }

    collapseAllMindMapNodes() {
        this.walkMindMapNodes(node => {
            if (Array.isArray(node.children) && node.children.length) {
                node.collapsed = true;
            }
        });
        this.renderMindMap();
    }

    addMindMapIdeaToAllColumns() {
        const state = this.getCurrentMindMapState();
        this.getMindMapColumns().forEach(column => {
            state.nodes[column.key].push(this.createMindMapNode(column.title));
        });
        this.interviewMindMapState = state;
        this.renderMindMap();
        this.markUnsavedChange('interviewForm');
    }

    walkMindMapNodes(callback) {
        if (typeof callback !== 'function') {
            return;
        }

        const traverse = (nodes) => {
            nodes.forEach(node => {
                callback(node);
                if (Array.isArray(node.children) && node.children.length) {
                    traverse(node.children);
                }
            });
        };

        this.getMindMapColumns().forEach(column => {
            traverse(this.interviewMindMapState?.nodes?.[column.key] || []);
        });
    }

    findMindMapNodeWithParent(columnKey, nodeId, nodes = null, parent = null) {
        const list = nodes || (this.interviewMindMapState?.nodes?.[columnKey] || []);
        for (let index = 0; index < list.length; index += 1) {
            const node = list[index];
            if (!node) {
                continue;
            }

            if (node.id === nodeId) {
                return { node, parent, list, index };
            }

            if (Array.isArray(node.children) && node.children.length) {
                const result = this.findMindMapNodeWithParent(columnKey, nodeId, node.children, node);
                if (result) {
                    return result;
                }
            }
        }

        return null;
    }

    findMindMapNodeText(columnKey, nodeId) {
        const result = this.findMindMapNodeWithParent(columnKey, nodeId);
        return result?.node?.text || '';
    }

    removeMindMapNode(columnKey, nodeId) {
        const target = this.findMindMapNodeWithParent(columnKey, nodeId);
        if (!target || !target.list) {
            return null;
        }

        const [removed] = target.list.splice(target.index, 1);
        if (removed?.id) {
            this.removeMindMapLinksTo(removed.id);
        }
        return removed || null;
    }

    removeMindMapLinksTo(nodeId) {
        if (!nodeId) {
            return;
        }

        this.walkMindMapNodes(node => {
            if (node.linkedFrom?.nodeId === nodeId) {
                node.linkedFrom = null;
            }
        });
    }

    isMindMapDescendant(node, targetId) {
        if (!node || !targetId) {
            return false;
        }

        if (node.id === targetId) {
            return true;
        }

        return Array.isArray(node.children)
            ? node.children.some(child => this.isMindMapDescendant(child, targetId))
            : false;
    }

    moveMindMapNode(fromColumn, toColumn, nodeId, targetParentId = null) {
        if (!fromColumn || !toColumn || !nodeId) {
            return;
        }

        const movedNode = this.removeMindMapNode(fromColumn, nodeId);
        if (!movedNode) {
            return;
        }

        if (targetParentId) {
            const target = this.findMindMapNodeWithParent(toColumn, targetParentId);
            if (target?.node) {
                if (this.isMindMapDescendant(movedNode, targetParentId)) {
                    this.renderMindMap();
                    return;
                }
                target.node.children = target.node.children || [];
                target.node.children.push(movedNode);
            }
        } else {
            this.interviewMindMapState.nodes[toColumn] = this.interviewMindMapState.nodes[toColumn] || [];
            this.interviewMindMapState.nodes[toColumn].push(movedNode);
        }

        this.renderMindMap(nodeId);
        this.markUnsavedChange('interviewForm');
    }

    startMindMapDrag(event, columnKey, nodeId) {
        if (!event) {
            return;
        }

        this.mindMapDragContext = { columnKey, nodeId };
        if (event.dataTransfer) {
            try {
                event.dataTransfer.setData('text/plain', JSON.stringify({ columnKey, nodeId }));
            } catch (error) {
                console.warn('Unable to persist drag data', error);
            }
        }
    }

    handleMindMapDragOver(event) {
        if (!event) {
            return;
        }
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }

    handleMindMapDrop(event, targetColumn, targetParentId = null) {
        if (!event) {
            return;
        }
        event.preventDefault();

        let payload = this.mindMapDragContext;
        if (!payload && event.dataTransfer) {
            try {
                payload = JSON.parse(event.dataTransfer.getData('text/plain'));
            } catch (error) {
                payload = null;
            }
        }

        if (!payload || !payload.nodeId || !payload.columnKey) {
            return;
        }

        this.moveMindMapNode(payload.columnKey, targetColumn, payload.nodeId, targetParentId);
        this.mindMapDragContext = null;
    }

    focusMindMapNode(nodeId) {
        if (typeof document === 'undefined' || !nodeId) {
            return;
        }

        window.requestAnimationFrame(() => {
            const target = document.querySelector(`[data-node-id="${nodeId}"] .mindmap-node-text`);
            if (target) {
                target.focus();
                const selection = window.getSelection();
                if (selection && document.createRange) {
                    const range = document.createRange();
                    range.selectNodeContents(target);
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        });
    }

    refreshMindMapMiniMap() {
        if (typeof document === 'undefined') {
            return;
        }

        const miniMap = document.getElementById('mindmapMiniMap');
        const workspace = document.getElementById('mindmapWorkspace');
        if (!miniMap || !workspace) {
            return;
        }

        miniMap.innerHTML = '';
        const clone = workspace.cloneNode(true);
        clone.removeAttribute('id');
        clone.classList.add('mindmap-minimap-canvas');
        clone.style.transform = 'scale(0.2)';
        clone.style.transformOrigin = 'top left';
        miniMap.appendChild(clone);
    }

    getSnapshot() {
        return JSON.parse(JSON.stringify({
            risks: this.risks,
            controls: this.controls,
            actionPlans: this.actionPlans,
            history: this.history,
            interviews: this.interviews,
            config: this.config
        }));
    }

    loadSnapshot(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') {
            throw new Error('Instantané invalide');
        }

        const cloneArray = (value) => Array.isArray(value)
            ? JSON.parse(JSON.stringify(value))
            : [];

        const cloneObject = (value) => (value && typeof value === 'object' && !Array.isArray(value))
            ? JSON.parse(JSON.stringify(value))
            : this.getDefaultConfig();

        this.risks = cloneArray(snapshot.risks).map(risk => this.normalizeRisk(risk));
        this.controls = cloneArray(snapshot.controls);
        this.actionPlans = cloneArray(snapshot.actionPlans).map(plan => this.normalizeActionPlan(plan));
        this.reconcileRiskActionPlanLinks();
        this.history = cloneArray(snapshot.history);
        this.interviews = cloneArray(snapshot.interviews)
            .map(entry => this.normalizeInterview(entry))
            .filter(Boolean);
        this.config = cloneObject(snapshot.config);

        this.ensureConfigStructure();

        this.saveData();
        this.saveConfig();

        this.populateSelects();
        this.needsConfigStructureRerender = true;
        this.renderAll();
        if (this.needsConfigStructureRerender) {
            this.renderConfiguration();
            this.needsConfigStructureRerender = false;
        }
        this.updateLastSaveTime();

        this.addHistoryItem('Import instantané', 'Sauvegarde importée depuis un fichier');

        if (typeof showNotification === 'function') {
            showNotification('success', 'Données importées avec succès');
        }
    }

    populateSelects() {
        this.refreshProcessColorMap();
        const fill = (ids, options, placeholder) => {
            const targetIds = Array.isArray(ids) ? ids : [ids];
            const optionList = Array.isArray(options) ? options : [];

            targetIds.forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;

                const isMultiple = !!el.multiple;
                const previousValues = isMultiple
                    ? Array.from(el.selectedOptions).map(opt => opt.value)
                    : [el.value];
                el.innerHTML = '';

                if (placeholder !== undefined && !isMultiple) {
                    const opt = document.createElement('option');
                    opt.value = '';
                    opt.textContent = placeholder;
                    el.appendChild(opt);
                }

                optionList.forEach(o => {
                    if (!o || typeof o !== 'object') return;
                    const opt = document.createElement('option');
                    opt.value = o.value;
                    opt.textContent = o.label;
                    el.appendChild(opt);
                });

                if (isMultiple) {
                    const availableValues = optionList
                        .map(o => (o && o.value != null) ? String(o.value) : null)
                        .filter(value => value !== null);
                    const normalizedPrevious = previousValues
                        .map(value => (value != null) ? String(value) : null)
                        .filter(value => value !== null && availableValues.includes(value));
                    const selectionSet = new Set(normalizedPrevious);
                    Array.from(el.options).forEach(option => {
                        const optionValue = String(option.value);
                        option.selected = selectionSet.has(optionValue);
                    });
                } else {
                    const availableValues = optionList
                        .map(o => (o && o.value != null) ? String(o.value) : null)
                        .filter(value => value !== null);
                    const previousValue = previousValues
                        .map(value => (value != null) ? String(value) : null)
                        .find(value => value !== null && availableValues.includes(value));
                    if (previousValue !== undefined) {
                        el.value = previousValue;
                    } else if (placeholder !== undefined) {
                        el.value = '';
                    }
                }
            });
        };

        fill(['matrixThemeFilter', 'risksThemeFilter'], this.config.riskThemes, 'Tous les thèmes');
        fill(['matrixProcessFilter', 'risksProcessFilter', 'interviewProcessFilter'], this.config.processes, 'Tous les processus');
        fill(['matrixRiskTypeFilter', 'risksTypeFilter'], this.config.riskTypes, 'Tous les types');
        fill(['matrixStatusFilter', 'risksStatusFilter'], this.config.riskStatuses, 'Tous les statuts');
        if (typeof updateRiskTypeFilterVisibility === 'function') {
            updateRiskTypeFilterVisibility({ clearHiddenValue: false });
        }
        fill('riskTheme', this.config.riskThemes, 'Sélectionner...');
        fill('processus', this.config.processes, 'Sélectionner...');
        this.updateSousProcessusOptions();
        fill('typeCorruption', this.config.riskTypes, 'Sélectionner...');
        fill('targetAudience', this.config.targetAudiences);
        fill('statut', this.config.riskStatuses, 'Sélectionner...');
        fill('tiers', this.config.tiers);
        const riskCountriesSelect = document.getElementById('riskCountries');
        const previousCountries = riskCountriesSelect
            ? Array.from(riskCountriesSelect.selectedOptions).map(opt => opt.value)
            : [];
        fill('riskCountries', this.config.countries);
        if (riskCountriesSelect) {
            const availableValues = Array.from(riskCountriesSelect.options).map(opt => opt.value);
            const selection = previousCountries.filter(value => availableValues.includes(value));
            const targetValues = selection.length ? selection : availableValues;
            Array.from(riskCountriesSelect.options).forEach(opt => {
                opt.selected = targetValues.includes(opt.value);
            });
        }
        if (typeof renderAllRiskMultiSelectChips === 'function') {
            renderAllRiskMultiSelectChips();
        }
        this.renderRiskCountryColumns();
        this.renderMatrixEntityFilterChips();
        if (typeof window !== 'undefined' && typeof window.renderRiskTierFilterOptions === 'function') {
            window.renderRiskTierFilterOptions();
        }
        fill('controlType', this.config.controlTypes, 'Sélectionner...');
        fill('controlFrequency', this.config.controlFrequencies, 'Sélectionner...');
        fill('controlMode', this.config.controlModes, 'Sélectionner...');
        fill('controlEffectiveness', this.config.controlEffectiveness, 'Sélectionner...');
        fill('controlsTypeFilter', this.config.controlTypes, 'Tous les types de contrôle');
        fill('planStatus', this.config.actionPlanStatuses, 'Sélectionner...');
        fill('actionPlansStatusFilter', this.config.actionPlanStatuses, 'Tous les statuts');

        const referentOptions = this.getAllKnownReferents().map(ref => ({ value: ref, label: ref }));

        fill('interviewReferentFilter', referentOptions, 'All referents');
        this.updateInterviewReferentSelect(referentOptions);

        const mitigationInput = document.getElementById('mitigationEffectiveness');
        if (mitigationInput) {
            const defaultMitigation = typeof DEFAULT_MITIGATION_EFFECTIVENESS === 'string'
                ? DEFAULT_MITIGATION_EFFECTIVENESS
                : 'insuffisant';
            mitigationInput.value = defaultMitigation;
            const probNetInput = document.getElementById('probNet');
            if (probNetInput && typeof getMitigationColumnFromLevel === 'function') {
                probNetInput.value = getMitigationColumnFromLevel(defaultMitigation);
            }
        }

        const syncFilterValue = (filterKey, value, options = {}) => {
            if (typeof document === 'undefined') return;
            const normalizedKey = typeof filterKey === 'string' ? filterKey : '';
            if (!normalizedKey) return;
            const normalizedValue = value == null ? '' : String(value);
            const attributeName = typeof options.attribute === 'string' && options.attribute
                ? options.attribute
                : 'data-filter-key';

            document.querySelectorAll(`[${attributeName}="${normalizedKey}"]`).forEach(element => {
                if (!('value' in element)) {
                    return;
                }

                if (element.tagName === 'SELECT') {
                    if (normalizedValue && !Array.from(element.options).some(opt => opt.value === normalizedValue)) {
                        const opt = document.createElement('option');
                        opt.value = normalizedValue;
                        opt.textContent = normalizedValue;
                        element.appendChild(opt);
                    }
                }

                if (element.value !== normalizedValue) {
                    element.value = normalizedValue;
                }
            });
        };

        syncFilterValue('type', this.controlFilters?.type || '');
        syncFilterValue('search', this.controlFilters?.search || '');
        syncFilterValue('name', this.actionPlanFilters?.name || '', { attribute: 'data-action-plan-filter' });
        syncFilterValue('owner', this.actionPlanFilters?.owner || '', { attribute: 'data-action-plan-filter' });
        syncFilterValue('status', this.actionPlanFilters?.status || '', { attribute: 'data-action-plan-filter' });
        syncFilterValue('dueDateOrder', this.actionPlanFilters?.dueDateOrder || '', { attribute: 'data-action-plan-filter' });

        const riskFilterSync = typeof window !== 'undefined' && typeof window.syncRiskFilterWidgets === 'function'
            ? window.syncRiskFilterWidgets
            : null;

        if (riskFilterSync) {
            Object.entries(this.filters).forEach(([key, value]) => {
                riskFilterSync(key, value, null);
            });
        } else if (typeof document !== 'undefined') {
            document.querySelectorAll('[data-risk-filter]').forEach(element => {
                const key = element.dataset?.riskFilter;
                if (!key || !(key in this.filters)) {
                    return;
                }
                const normalizedValue = this.filters[key] == null ? '' : String(this.filters[key]);
                if (element.tagName === 'SELECT') {
                    if (normalizedValue && !Array.from(element.options).some(opt => opt.value === normalizedValue)) {
                        const opt = document.createElement('option');
                        opt.value = normalizedValue;
                        opt.textContent = normalizedValue;
                        element.appendChild(opt);
                    }
                }
                if (element.value !== normalizedValue) {
                    element.value = normalizedValue;
                }
            });
        }

        this.populateInterviewSubProcessFilterOptions();

        const processFilterSelect = document.getElementById('interviewProcessFilter');
        if (processFilterSelect) {
            const expected = this.interviewFilters?.process || '';
            if (processFilterSelect.value !== expected) {
                processFilterSelect.value = expected;
            }
        }

        const referentFilterSelect = document.getElementById('interviewReferentFilter');
        if (referentFilterSelect) {
            const expected = this.interviewFilters?.referent || '';
            if (referentFilterSelect.value !== expected) {
                referentFilterSelect.value = expected;
            }
        }

        const subProcessFilterSelect = document.getElementById('interviewSubProcessFilter');
        if (subProcessFilterSelect) {
            const expected = this.interviewFilters?.subProcess || '';
            if (subProcessFilterSelect.value !== expected) {
                subProcessFilterSelect.value = expected;
            }
        }

        const interviewSearchInput = document.getElementById('interviewSearchInput');
        if (interviewSearchInput) {
            const expected = this.interviewFilters?.search || '';
            if (interviewSearchInput.value !== expected) {
                interviewSearchInput.value = expected;
            }
        }
    }

    setupAutoValueSync(labelInput, valueInput) {
        if (!labelInput || !valueInput) {
            return;
        }

        const slugifyFn = typeof slugifyLabel === 'function'
            ? slugifyLabel
            : (str) => String(str || '')
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');

        const computeAutoValue = () => slugifyFn(labelInput.value || '');

        const updateManualFlag = () => {
            const currentValue = valueInput.value.trim();
            const autoValue = valueInput.dataset.autoValue || '';
            valueInput.dataset.manual = currentValue && currentValue !== autoValue ? 'true' : 'false';
        };

        const updateAutoValue = () => {
            const generated = computeAutoValue();
            const currentValue = valueInput.value.trim();
            const lastAuto = valueInput.dataset.autoValue || '';
            const manualOverride = valueInput.dataset.manual === 'true' && currentValue !== lastAuto;

            if (!manualOverride || currentValue === '' || currentValue === lastAuto) {
                valueInput.value = generated;
            }

            valueInput.dataset.autoValue = generated;
            updateManualFlag();
        };

        const handleValueInput = () => {
            updateManualFlag();
        };

        const initialAuto = computeAutoValue();
        valueInput.dataset.autoValue = initialAuto;
        if (valueInput.value.trim() === '') {
            valueInput.value = initialAuto;
        }
        updateManualFlag();

        labelInput.addEventListener('input', updateAutoValue);
        labelInput.addEventListener('change', updateAutoValue);
        valueInput.addEventListener('input', handleValueInput);
        valueInput.addEventListener('change', handleValueInput);
    }

    renderConfiguration() {
        const container = document.getElementById('configurationContainer');
        if (!container) return;

        const availableSections = [
            { id: 'processManager', label: 'Processus & référents' },
            { id: 'general', label: 'Other settings' },
            { id: 'history', label: 'Change history' }
        ];

        if (!this.currentConfigSection || !availableSections.some(section => section.id === this.currentConfigSection)) {
            this.currentConfigSection = 'processManager';
        }

        const exportButton = document.getElementById('configExportButton');
        if (exportButton) {
            if (this.currentConfigSection === 'processManager') {
                exportButton.style.display = '';
                exportButton.textContent = '💾 Exporter les processus';
                exportButton.setAttribute('data-scope', 'processes');
            } else if (this.currentConfigSection === 'general') {
                exportButton.style.display = '';
                exportButton.textContent = '💾 Exporter les autres paramètres';
                exportButton.setAttribute('data-scope', 'parameters');
            } else {
                exportButton.style.display = 'none';
                exportButton.removeAttribute('data-scope');
            }
        }

        this.closeActiveInsertionForm();
        this.dragState = null;
        container.innerHTML = '';

        if (this.currentConfigSection !== 'history') {
            const heading = document.createElement('h2');
            heading.className = 'admin-section-title';
            heading.textContent = 'Paramètres de configuration';
            container.appendChild(heading);

            const helper = document.createElement('div');
            helper.className = 'config-helper';
            const helperText = document.createElement('p');
            helperText.textContent = "💡 Use the save button in the header to store risks, controls, and action plans. From this section, export your processes or other settings to share or archive them.";
            helper.appendChild(helperText);
            container.appendChild(helper);
        }

        const tabs = document.createElement('div');
        tabs.className = 'config-section-tabs';
        availableSections.forEach(section => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `config-section-tab${this.currentConfigSection === section.id ? ' active' : ''}`;
            button.textContent = section.label;
            button.addEventListener('click', () => {
                this.currentConfigSection = section.id;
                this.renderConfiguration();
            });
            tabs.appendChild(button);
        });
        container.appendChild(tabs);

        const content = document.createElement('div');
        content.className = 'config-section-panel';
        container.appendChild(content);

        if (this.currentConfigSection === 'processManager') {
            this.processManagerContainer = content;
            this.renderProcessManager(content);
        } else if (this.currentConfigSection === 'general') {
            this.processManagerContainer = null;
            this.renderGeneralConfiguration(content);
        } else {
            this.processManagerContainer = null;
            this.renderHistoryConfiguration(content);
        }
    }

    renderGeneralConfiguration(container) {
        if (!container) {
            return;
        }

        container.innerHTML = '';

        const intro = document.createElement('div');
        intro.className = 'config-section-description';
        intro.innerHTML = "<p>Gérez ici les valeurs de référence utilisées dans l'application (types de corruption, statuts, etc.). Les éléments marqués comme verrouillés ne peuvent pas être modifiés.</p>";
        container.appendChild(intro);

        const uiCard = document.createElement('section');
        uiCard.className = 'config-ui-card';

        const uiTitle = document.createElement('div');
        uiTitle.className = 'config-ui-title';
        uiTitle.textContent = 'Interface';
        uiCard.appendChild(uiTitle);

        const toggleLabel = document.createElement('label');
        toggleLabel.className = 'config-toggle';
        toggleLabel.setAttribute('for', 'configFeedbackToggle');

        const toggleInput = document.createElement('input');
        toggleInput.type = 'checkbox';
        toggleInput.id = 'configFeedbackToggle';
        toggleInput.className = 'config-toggle-input';
        toggleInput.checked = Boolean(this.config?.ui?.showFeedbackButton);

        const toggleText = document.createElement('span');
        toggleText.className = 'config-toggle-text';
        toggleText.textContent = 'Afficher le bouton feed-back';

        toggleLabel.appendChild(toggleInput);
        toggleLabel.appendChild(toggleText);
        uiCard.appendChild(toggleLabel);

        const toggleHelper = document.createElement('p');
        toggleHelper.className = 'config-toggle-helper';
        toggleHelper.textContent = 'Activez cette option pour rendre le bouton feed-back visible dans l’en-tête.';
        uiCard.appendChild(toggleHelper);

        const visibleRiskLimitLabel = document.createElement('label');
        visibleRiskLimitLabel.className = 'config-number-field';
        visibleRiskLimitLabel.setAttribute('for', 'configVisibleRiskLimit');

        const visibleRiskLimitText = document.createElement('span');
        visibleRiskLimitText.className = 'config-number-label';
        visibleRiskLimitText.textContent = 'Risques lisibles avant floutage';

        const visibleRiskLimitInput = document.createElement('input');
        visibleRiskLimitInput.type = 'number';
        visibleRiskLimitInput.id = 'configVisibleRiskLimit';
        visibleRiskLimitInput.className = 'config-number-input';
        visibleRiskLimitInput.min = '0';
        visibleRiskLimitInput.step = '1';
        visibleRiskLimitInput.value = String(this.getVisibleRiskLimit());

        visibleRiskLimitLabel.appendChild(visibleRiskLimitText);
        visibleRiskLimitLabel.appendChild(visibleRiskLimitInput);
        uiCard.appendChild(visibleRiskLimitLabel);

        const visibleRiskLimitHelper = document.createElement('p');
        visibleRiskLimitHelper.className = 'config-toggle-helper';
        visibleRiskLimitHelper.textContent = 'Les risques sont évalués par ID numérique croissant : seuls les premiers restent lisibles, les suivants restent dans le DOM mais sont floutés.';
        uiCard.appendChild(visibleRiskLimitHelper);

        toggleInput.addEventListener('change', () => {
            const isVisible = toggleInput.checked;
            if (!this.config.ui || typeof this.config.ui !== 'object' || Array.isArray(this.config.ui)) {
                this.config.ui = { showFeedbackButton: isVisible, visibleRiskLimit: this.getVisibleRiskLimit() };
            } else {
                this.config.ui.showFeedbackButton = isVisible;
            }
            this.saveConfig();
            this.applyFeedbackButtonVisibility();
        });

        visibleRiskLimitInput.addEventListener('change', () => {
            const numericLimit = Math.max(0, Math.floor(Number(visibleRiskLimitInput.value)));
            const normalizedLimit = Number.isFinite(numericLimit) ? numericLimit : 5;
            visibleRiskLimitInput.value = String(normalizedLimit);
            if (!this.config.ui || typeof this.config.ui !== 'object' || Array.isArray(this.config.ui)) {
                this.config.ui = { showFeedbackButton: Boolean(toggleInput.checked), visibleRiskLimit: normalizedLimit };
            } else {
                this.config.ui.visibleRiskLimit = normalizedLimit;
            }
            this.saveConfig();
            this.updateRisksList();
            this.updateRiskDetailsList();
        });

        container.appendChild(uiCard);

        const sections = [
            {
                key: 'interviewTemplates',
                label: "Trames d'entretien",
                renderer: (body) => this.renderInterviewTemplateManager(body)
            },
            {
                key: 'mindMapThemes',
                label: 'Mind map themes',
                renderer: (body) => this.renderMindMapThemeManager(body)
            },
            {
                key: 'mindMapModuleConfig',
                label: 'Cartes du mindmap',
                renderer: (body) => this.renderMindMapModuleConfiguration(body)
            },
            { key: 'riskTypes', label: 'Types de corruption' },
            { key: 'riskThemes', label: 'Thématiques des risques' },
            { key: 'countries', label: 'Entités concernées' },
            {
                key: 'countryColumns',
                label: 'Répartition des entités',
                renderer: (body) => this.renderCountryColumnManager(body)
            },
            { key: 'tiers', label: 'Tiers' },
            { key: 'riskStatuses', label: 'Statuts des risques' },
            { key: 'controlTypes', label: 'Types de contrôle' },
            { key: 'controlOrigins', label: 'Origine des contrôles' },
            { key: 'controlFrequencies', label: 'Fréquences des contrôles' },
            { key: 'controlModes', label: "Modes d'exécution" },
            { key: 'controlEffectiveness', label: 'Efficacités' },
            { key: 'controlStatuses', label: 'Statuts des contrôles' }
        ];

        const readOnlyMessages = {
            riskStatuses: 'Les statuts de risque sont prédéfinis et ne peuvent pas être modifiés.'
        };

        const accordion = document.createElement('div');
        accordion.className = 'config-accordion';
        container.appendChild(accordion);

        sections.forEach((section, index) => {
            const { key, label, renderer } = section;
            const item = document.createElement('div');
            item.className = 'config-accordion-item';

            const headerButton = document.createElement('button');
            headerButton.type = 'button';
            headerButton.className = 'config-accordion-header';
            headerButton.id = `config-accordion-${key}-header`;
            headerButton.innerHTML = `
                <span class="config-accordion-title">${label}</span>
                <span class="config-accordion-icon" aria-hidden="true"></span>
            `;

            const body = document.createElement('div');
            body.className = 'config-accordion-body';
            body.id = `config-accordion-${key}-panel`;
            body.setAttribute('aria-labelledby', headerButton.id);
            body.setAttribute('role', 'region');
            headerButton.setAttribute('aria-controls', body.id);

            item.appendChild(headerButton);
            item.appendChild(body);
            accordion.appendChild(item);

            this.configureAccordionItem(item, headerButton, body, index === 0);

            if (typeof renderer === 'function') {
                renderer(body);
                return;
            }

            const isReadOnly = this.readOnlyConfigKeys.has(key);

            const list = document.createElement('ul');
            list.id = `list-${key}`;
            list.className = 'config-list';

            if (isReadOnly) {
                const notice = document.createElement('p');
                notice.className = 'config-readonly-notice';
                notice.textContent = readOnlyMessages[key] || 'Ces valeurs sont prédéfinies et ne peuvent pas être modifiées.';
                body.appendChild(notice);
            }

            body.appendChild(list);

            if (!isReadOnly) {
                const addContainer = document.createElement('div');
                addContainer.className = 'config-add';

                const labelInput = document.createElement('input');
                labelInput.type = 'text';
                labelInput.id = `input-${key}-label`;
                labelInput.placeholder = 'Saisir un libellé';
                labelInput.classList.add('config-input-label');

                const valueInput = document.createElement('input');
                valueInput.type = 'text';
                valueInput.id = `input-${key}-value`;
                valueInput.placeholder = 'Valeur générée automatiquement';
                valueInput.classList.add('config-input-value');

                const addButton = document.createElement('button');
                addButton.type = 'button';
                addButton.textContent = 'Ajouter';
                addButton.addEventListener('click', () => {
                    this.addConfigOption(key);
                });

                addContainer.appendChild(labelInput);
                addContainer.appendChild(valueInput);
                addContainer.appendChild(addButton);

                body.appendChild(addContainer);

                this.setupAutoValueSync(labelInput, valueInput);
            }
        });

        this.refreshConfigLists();
        this.adjustOpenAccordionBodies(container);
    }

    renderRiskCountryColumns() {
        const container = document.getElementById('riskCountryColumns');
        const select = document.getElementById('riskCountries');
        if (!container || !select) {
            return;
        }

        container.classList.add('risk-country-columns');
        container.innerHTML = '';

        const options = Array.from(select.options).map(option => ({
            value: option.value,
            label: option.textContent || option.value
        }));
        const labelMap = new Map(options.map(option => [option.value, option.label]));
        const selectedValues = new Set(Array.from(select.selectedOptions).map(option => option.value));

        const columns = Array.isArray(this.config?.countryColumns)
            ? this.config.countryColumns
            : [];

        const assignedValues = new Set();

        const chipPalette = [
            '#2563eb',
            '#7c3aed',
            '#db2777',
            '#ea580c',
            '#16a34a',
            '#0891b2',
            '#be123c',
            '#4f46e5'
        ];

        const resolveColumnColor = (column, index) => {
            if (column && typeof column.color === 'string' && column.color.trim()) {
                return column.color.trim();
            }
            return chipPalette[index % chipPalette.length];
        };

        const createColumnCard = (column, entries, columnIndex, { highlight } = {}) => {
            const card = document.createElement('article');
            card.className = 'risk-country-column';
            if (highlight) {
                card.classList.add('risk-country-column-highlight');
            }
            if (column?.key) {
                card.dataset.columnKey = column.key;
            }
            const columnColor = resolveColumnColor(column, columnIndex);
            card.style.setProperty('--country-column-color', columnColor);

            const header = document.createElement('div');
            header.className = 'risk-country-column-header';

            const title = document.createElement('div');
            title.className = 'risk-country-column-title';
            title.textContent = column?.label || 'Entités';
            header.appendChild(title);

            const actions = document.createElement('div');
            actions.className = 'risk-country-column-actions';

            const selectButton = document.createElement('button');
            selectButton.type = 'button';
            selectButton.className = 'btn btn-outline btn-small';
            selectButton.textContent = 'Tout sélectionner';
            selectButton.addEventListener('click', () => {
                if (typeof selectRiskCountryColumn === 'function' && column?.key) {
                    selectRiskCountryColumn(column.key);
                }
            });
            actions.appendChild(selectButton);

            const clearButton = document.createElement('button');
            clearButton.type = 'button';
            clearButton.className = 'btn btn-outline btn-small';
            clearButton.textContent = 'Deselect all';
            clearButton.addEventListener('click', () => {
                if (typeof deselectRiskCountryColumn === 'function' && column?.key) {
                    deselectRiskCountryColumn(column.key);
                }
            });
            actions.appendChild(clearButton);

            header.appendChild(actions);
            card.appendChild(header);

            const list = document.createElement('div');
            list.className = 'risk-country-options';

            if (!entries.length) {
                const empty = document.createElement('div');
                empty.className = 'risk-country-empty';
                empty.textContent = 'Aucune entité configurée.';
                list.appendChild(empty);
            } else {
                entries.forEach(entry => {
                    const optionLabel = document.createElement('label');
                    optionLabel.className = 'risk-country-option';
                    optionLabel.dataset.countryValue = entry.value;
                    if (selectedValues.has(entry.value)) {
                        optionLabel.classList.add('is-selected');
                    }

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'risk-country-checkbox';
                    checkbox.value = entry.value;
                    checkbox.dataset.countryValue = entry.value;
                    checkbox.checked = selectedValues.has(entry.value);
                    checkbox.addEventListener('change', () => {
                        if (typeof applyRiskCountryCheckboxState === 'function') {
                            applyRiskCountryCheckboxState(entry.value, checkbox.checked);
                        } else {
                            const option = Array.from(select.options).find(opt => opt.value === entry.value);
                            if (option) {
                                option.selected = checkbox.checked;
                                select.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        if (typeof syncRiskCountryCheckboxesFromSelect === 'function') {
                            syncRiskCountryCheckboxesFromSelect();
                        }
                    });
                    optionLabel.appendChild(checkbox);

                    const name = document.createElement('span');
                    name.textContent = entry.label;
                    optionLabel.appendChild(name);

                    list.appendChild(optionLabel);
                });
            }

            card.appendChild(list);
            container.appendChild(card);
        };

        columns.forEach((column, index) => {
            if (!column || typeof column !== 'object') {
                return;
            }
            const values = Array.isArray(column.countries) ? column.countries : [];
            const entries = values
                .map(value => ({ value, label: labelMap.get(value) || value }))
                .filter(entry => entry.label);
            entries.forEach(entry => assignedValues.add(entry.value));
            createColumnCard(column, entries, index);
        });

        const unassigned = options.filter(option => !assignedValues.has(option.value));
        if (unassigned.length) {
            const column = { key: 'unassigned', label: 'Entités non attribuées' };
            createColumnCard(column, unassigned, columns.length, { highlight: true });
        }

        if (!container.children.length) {
            const empty = document.createElement('div');
            empty.className = 'risk-country-empty';
            empty.textContent = 'Aucune entité disponible. Configurez-les dans l’administration.';
            container.appendChild(empty);
        }

        if (!select.dataset.countrySyncAttached) {
            select.addEventListener('change', () => {
                if (typeof syncRiskCountryCheckboxesFromSelect === 'function') {
                    syncRiskCountryCheckboxesFromSelect();
                }
            });
            select.dataset.countrySyncAttached = 'true';
        }

        if (typeof syncRiskCountryCheckboxesFromSelect === 'function') {
            syncRiskCountryCheckboxesFromSelect();
        }
    }

    renderRiskEntityFilterChips(containerId = 'matrixEntityFilterChips') {
        const container = document.getElementById(containerId);
        if (!container) {
            return;
        }

        const options = Array.isArray(this.config?.countries) ? this.config.countries : [];
        const selected = new Set(Array.isArray(this.filters?.entity) ? this.filters.entity : []);
        container.innerHTML = '';

        options.forEach(entry => {
            if (!entry || entry.value == null) {
                return;
            }
            const value = String(entry.value);
            const label = entry.label || value;
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'btn btn-outline btn-small';
            chip.textContent = label;
            chip.classList.toggle('btn-primary', selected.has(value));
            chip.classList.toggle('btn-outline', !selected.has(value));
            chip.addEventListener('click', () => {
                if (typeof window.toggleEntityFilterChip === 'function') {
                    window.toggleEntityFilterChip(value);
                }
            });
            container.appendChild(chip);
        });
    }

    renderMatrixEntityFilterChips() {
        this.renderRiskEntityFilterChips('matrixEntityFilterChips');
        this.renderRiskEntityFilterChips('risksEntityFilterChips');
    }

    setRiskRegisterSort(sortKey) {
        const allowedKeys = new Set(['id', 'process', 'gross', 'aggravated', 'net']);
        if (!allowedKeys.has(sortKey)) {
            return;
        }

        if (!this.riskRegisterSort || this.riskRegisterSort.key !== sortKey) {
            this.riskRegisterSort = { key: sortKey, direction: 'desc' };
        } else {
            this.riskRegisterSort.direction = this.riskRegisterSort.direction === 'desc' ? 'asc' : 'desc';
        }

        this.updateRisksList();
    }

    updateRiskRegisterSortIndicators() {
        const sortState = this.riskRegisterSort || { key: '', direction: 'desc' };
        const allKeys = ['id', 'process', 'gross', 'aggravated', 'net'];
        allKeys.forEach((key) => {
            const arrow = document.getElementById(`riskSortArrow-${key}`);
            if (!arrow) {
                return;
            }
            if (sortState.key !== key) {
                arrow.textContent = '↕';
                arrow.classList.remove('active');
                return;
            }
            arrow.textContent = sortState.direction === 'asc' ? '↑' : '↓';
            arrow.classList.add('active');
        });
    }

    renderCountryColumnManager(container) {
        if (!(container instanceof HTMLElement)) {
            return;
        }

        const countries = Array.isArray(this.config?.countries)
            ? this.config.countries
            : [];
        const columns = Array.isArray(this.config?.countryColumns)
            ? this.config.countryColumns
            : [];

        container.innerHTML = '';

        const intro = document.createElement('p');
        intro.className = 'country-config-helper';
        intro.textContent = 'Répartissez les entités dans les colonnes utilisées lors de la création d’un risque.';
        container.appendChild(intro);

        if (!countries.length) {
            const empty = document.createElement('div');
            empty.className = 'config-empty';
            empty.textContent = 'Aucune entité n’est définie. Ajoutez des entités avant de gérer leur répartition.';
            container.appendChild(empty);
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'country-config-grid';
        container.appendChild(grid);

        columns.forEach(column => {
            if (!column || typeof column !== 'object') {
                return;
            }

            const card = document.createElement('article');
            card.className = 'country-config-card';
            grid.appendChild(card);

            const header = document.createElement('div');
            header.className = 'country-config-card-header';
            card.appendChild(header);

            const labelInput = document.createElement('input');
            labelInput.type = 'text';
            labelInput.value = column.label || '';
            labelInput.className = 'country-config-label-input';
            labelInput.addEventListener('blur', () => {
                const nextLabel = labelInput.value.trim();
                if (!nextLabel) {
                    labelInput.value = column.label || '';
                    return;
                }
                if (nextLabel !== column.label) {
                    this.updateCountryColumnLabel(column.key, nextLabel);
                }
            });
            labelInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    labelInput.blur();
                }
            });
            header.appendChild(labelInput);

            const count = document.createElement('span');
            count.className = 'country-config-count';
            const total = Array.isArray(column.countries) ? column.countries.length : 0;
            if (total === 0) {
                count.textContent = 'Aucune entité';
            } else if (total === 1) {
                count.textContent = '1 entité';
            } else {
                count.textContent = `${total} entités`;
            }
            header.appendChild(count);

            const selectEl = document.createElement('select');
            selectEl.className = 'country-config-select';
            selectEl.multiple = true;
            selectEl.size = Math.min(Math.max(countries.length, 4), 12);

            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country.value;
                option.textContent = country.label;
                if (Array.isArray(column.countries) && column.countries.includes(country.value)) {
                    option.selected = true;
                }
                selectEl.appendChild(option);
            });

            selectEl.addEventListener('change', () => {
                const selected = Array.from(selectEl.selectedOptions).map(opt => opt.value);
                this.updateCountryColumnCountries(column.key, selected);
                this.renderCountryColumnManager(container);
            });

            card.appendChild(selectEl);
        });

        const assigned = new Set();
        columns.forEach(column => {
            if (!Array.isArray(column?.countries)) {
                return;
            }
            column.countries.forEach(value => assigned.add(value));
        });

        const unassigned = countries.filter(country => !assigned.has(country.value));
        if (unassigned.length) {
            const notice = document.createElement('div');
            notice.className = 'country-config-notice';
            notice.innerHTML = `Certaines entités ne sont associées à aucune colonne : <span>${unassigned.map(country => country.label).join(', ')}</span>`;
            container.appendChild(notice);
        }

        this.adjustOpenAccordionBodies(container.closest('.config-accordion') || container);
    }

    updateCountryColumnLabel(columnKey, newLabel) {
        if (!Array.isArray(this.config?.countryColumns)) {
            this.config.countryColumns = [];
        }

        const target = this.config.countryColumns.find(column => column && column.key === columnKey);
        if (!target) {
            return;
        }

        const label = typeof newLabel === 'string' && newLabel.trim()
            ? newLabel.trim()
            : target.label;

        if (label === target.label) {
            return;
        }

        target.label = label;
        this.saveConfig();
        this.renderRiskCountryColumns();
    }

    updateCountryColumnCountries(columnKey, values) {
        if (!Array.isArray(this.config?.countryColumns)) {
            this.config.countryColumns = [];
        }

        const available = Array.isArray(this.config?.countries)
            ? this.config.countries.map(country => country.value)
            : [];
        const availableSet = new Set(available);
        const labelMap = new Map(this.config?.countries?.map(country => [country.value, country.label]));

        const normalized = Array.isArray(values)
            ? values.map(value => (typeof value === 'string' ? value : '')).filter(value => value && availableSet.has(value))
            : [];

        const unique = [];
        const assigned = new Set();
        normalized.forEach(value => {
            if (!assigned.has(value)) {
                assigned.add(value);
                unique.push(value);
            }
        });

        const target = this.config.countryColumns.find(column => column && column.key === columnKey);
        if (!target) {
            return;
        }

        this.config.countryColumns.forEach(column => {
            if (!column || column.key === columnKey || !Array.isArray(column.countries)) {
                return;
            }
            column.countries = column.countries.filter(value => !assigned.has(value));
        });

        unique.sort((a, b) => {
            const labelA = labelMap.get(a) || a;
            const labelB = labelMap.get(b) || b;
            return labelA.localeCompare(labelB, 'fr', { sensitivity: 'base' });
        });

        target.countries = unique;

        this.saveConfig();
        this.renderRiskCountryColumns();

        if (typeof syncRiskCountryCheckboxesFromSelect === 'function') {
            syncRiskCountryCheckboxesFromSelect();
        }
    }

    renderHistoryConfiguration(container) {
        if (!(container instanceof HTMLElement)) {
            return;
        }

        container.innerHTML = '';

        const historySection = document.createElement('div');
        historySection.className = 'admin-history';

        const header = document.createElement('div');
        header.className = 'admin-history-header';

        const title = document.createElement('h2');
        title.className = 'admin-section-title';
        title.textContent = 'Change history';
        header.appendChild(title);

        const exportBtn = document.createElement('button');
        exportBtn.type = 'button';
        exportBtn.className = 'btn btn-secondary';
        exportBtn.textContent = '📤 Export';
        exportBtn.addEventListener('click', () => {
            if (typeof exportHistory === 'function') {
                exportHistory();
            } else {
                console.warn('exportHistory function unavailable.');
            }
        });
        header.appendChild(exportBtn);

        historySection.appendChild(header);

        const timeline = document.createElement('div');
        timeline.className = 'timeline';
        timeline.id = 'historyTimeline';
        historySection.appendChild(timeline);

        container.appendChild(historySection);

        this.updateHistory();
    }

    ensureInterviewTemplatesArray() {
        if (!this.config || typeof this.config !== 'object') {
            this.config = {};
        }
        if (!Array.isArray(this.config.interviewTemplates)) {
            this.config.interviewTemplates = [];
        }
        return this.config.interviewTemplates;
    }

    normalizeInterviewTemplate(template) {
        if (!template || typeof template !== 'object') {
            return null;
        }

        const value = typeof template.value === 'string' ? template.value.trim() : '';
        const label = typeof template.label === 'string' ? template.label.trim() : '';
        const content = typeof template.content === 'string' ? template.content : '';

        if (!value || !label) {
            return null;
        }

        return { value, label, content };
    }

    ensureMindMapThemesArray() {
        if (!Array.isArray(this.config?.mindMapThemes)) {
            const { themes, activeId } = this.normalizeMindMapThemes([], [this.getDefaultMindMapTheme()], '');
            this.config.mindMapThemes = themes;
            this.config.mindMapActiveThemeId = activeId;
        }

        return this.config.mindMapThemes;
    }

    generateMindMapThemeId(name = '') {
        const base = typeof name === 'string' && name.trim()
            ? (typeof slugifyLabel === 'function'
                ? slugifyLabel(name.trim())
                : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'))
            : 'theme';
        const used = new Set(this.ensureMindMapThemesArray().map(theme => theme.id));
        let candidate = base || 'theme';
        let suffix = 2;
        while (used.has(candidate)) {
            candidate = `${base || 'theme'}-${suffix}`;
            suffix += 1;
        }
        return candidate;
    }

    refreshMindMapFromThemes() {
        this.mindMapColumns = this.getMindMapColumns();
        this.interviewMindMapState = this.normalizeMindMapState(this.interviewMindMapState);
        this.renderMindMap();
        if (typeof this.refreshMindMapMiniMap === 'function') {
            this.refreshMindMapMiniMap();
        }
    }

    setMindMapActiveTheme(themeId) {
        const themes = this.ensureMindMapThemesArray();
        if (!themes.some(theme => theme.id === themeId)) {
            return false;
        }

        this.config.mindMapActiveThemeId = themeId;
        this.saveConfig();
        this.refreshMindMapFromThemes();

        if (typeof showNotification === 'function') {
            showNotification('success', 'Theme enabled for the mind map.');
        }
        return true;
    }

    addMindMapTheme(payload = {}) {
        const themes = this.ensureMindMapThemesArray();
        const name = typeof payload.name === 'string' && payload.name.trim()
            ? payload.name.trim()
            : 'Nouveau thème';
        const id = this.generateMindMapThemeId(name);

        const template = Array.isArray(payload.columns) && payload.columns.length
            ? payload
            : this.getDefaultMindMapTheme();

        themes.push({
            id,
            name,
            columns: Array.isArray(template.columns) ? template.columns.map(column => ({ ...column })) : []
        });

        if (!this.config.mindMapActiveThemeId) {
            this.config.mindMapActiveThemeId = id;
        }

        this.saveConfig();
        this.renderMindMapThemeManager(this.mindMapThemeManagerContainer);
        return id;
    }

    duplicateMindMapTheme(themeId) {
        const themes = this.ensureMindMapThemesArray();
        const target = themes.find(theme => theme.id === themeId);
        if (!target) {
            return false;
        }

        const copyId = this.generateMindMapThemeId(`${target.name || target.id}-copie`);
        const copy = {
            id: copyId,
            name: `${target.name || 'Theme'} (copy)`,
            columns: target.columns.map(column => ({ ...column }))
        };

        themes.push(copy);
        this.saveConfig();
        this.renderMindMapThemeManager(this.mindMapThemeManagerContainer);

        if (typeof showNotification === 'function') {
            showNotification('success', 'Theme duplicated.');
        }
        return true;
    }

    updateMindMapTheme(themeId, payload = {}) {
        const themes = this.ensureMindMapThemesArray();
        const index = themes.findIndex(theme => theme.id === themeId);
        if (index === -1) {
            return false;
        }

        const { themes: normalizedThemes, activeId } = this.normalizeMindMapThemes(
            themes.map(theme => theme.id === themeId ? { ...theme, ...payload } : theme),
            themes,
            this.config.mindMapActiveThemeId
        );

        this.config.mindMapThemes = normalizedThemes;
        this.config.mindMapActiveThemeId = activeId;
        this.saveConfig();
        this.renderMindMapThemeManager(this.mindMapThemeManagerContainer);
        this.refreshMindMapFromThemes();
        return true;
    }

    updateMindMapThemeColumn(themeId, index, payload = {}) {
        const themes = this.ensureMindMapThemesArray();
        const theme = themes.find(entry => entry.id === themeId);
        if (!theme || !Array.isArray(theme.columns) || index < 0 || index >= theme.columns.length) {
            return false;
        }

        const columns = theme.columns.map((column, idx) => idx === index ? { ...column, ...payload } : column);
        return this.updateMindMapTheme(themeId, { columns });
    }

    addMindMapThemeColumn(themeId) {
        const themes = this.ensureMindMapThemesArray();
        const theme = themes.find(entry => entry.id === themeId);
        if (!theme) {
            return false;
        }

        const palette = ['#34d399', '#22c55e', '#0ea5e9', '#1d4ed8', '#eab308', '#f97316', '#ef4444', '#a855f7', '#06b6d4'];
        const usedKeys = new Set((Array.isArray(theme.columns) ? theme.columns : []).map(column => column.key));
        const newColumn = this.normalizeMindMapThemeColumn(
            { title: 'Nouvelle colonne', subtitle: '' },
            theme.columns.length,
            usedKeys,
            palette
        );

        const columns = [...(theme.columns || []), newColumn];
        return this.updateMindMapTheme(themeId, { columns });
    }

    removeMindMapThemeColumn(themeId, index) {
        const themes = this.ensureMindMapThemesArray();
        const theme = themes.find(entry => entry.id === themeId);
        if (!theme || !Array.isArray(theme.columns) || theme.columns.length <= 1) {
            return false;
        }

        const columns = theme.columns.filter((_, idx) => idx !== index);
        return this.updateMindMapTheme(themeId, { columns });
    }

    reorderMindMapThemeColumns(themeId, fromIndex, toIndex) {
        const themes = this.ensureMindMapThemesArray();
        const theme = themes.find(entry => entry.id === themeId);
        if (!theme || !Array.isArray(theme.columns)) {
            return false;
        }

        const columns = [...theme.columns];
        const [moved] = columns.splice(fromIndex, 1);
        columns.splice(toIndex, 0, moved);
        return this.updateMindMapTheme(themeId, { columns });
    }

    startMindMapThemeColumnDrag(event, themeId, index) {
        if (event?.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            try {
                event.dataTransfer.setData('text/plain', `mindmap-theme:${themeId}:${index}`);
            } catch (error) {
                // ignore
            }
        }

        this.mindMapThemeDragState = { themeId, fromIndex: index };
    }

    handleMindMapThemeColumnDragOver(event, row) {
        if (!this.mindMapThemeDragState || !row) {
            return;
        }
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
        row.classList.add('mindmap-theme-column-drop');
    }

    handleMindMapThemeColumnDragLeave(row) {
        if (row) {
            row.classList.remove('mindmap-theme-column-drop');
        }
    }

    handleMindMapThemeColumnDrop(event, row, targetIndex) {
        if (!this.mindMapThemeDragState) {
            return;
        }
        event.preventDefault();
        row.classList.remove('mindmap-theme-column-drop');
        const { themeId, fromIndex } = this.mindMapThemeDragState;
        this.mindMapThemeDragState = null;

        if (fromIndex === targetIndex) {
            return;
        }
        this.reorderMindMapThemeColumns(themeId, fromIndex, targetIndex);
    }

    renderMindMapThemeManager(container) {
        if (!(container instanceof HTMLElement)) {
            return;
        }

        this.mindMapThemeManagerContainer = container;
        container.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'mindmap-theme-manager';
        container.appendChild(wrapper);

        const helper = document.createElement('p');
        helper.className = 'config-template-helper';
        helper.textContent = 'Create multiple mind map themes and customize columns, their order, and labels.';
        wrapper.appendChild(helper);

        const themes = this.ensureMindMapThemesArray();
        const activeId = this.config?.mindMapActiveThemeId;

        const list = document.createElement('div');
        list.className = 'mindmap-theme-list';
        wrapper.appendChild(list);

        if (!themes.length) {
            const empty = document.createElement('div');
            empty.className = 'config-template-empty';
            empty.textContent = 'Aucun thème défini pour le moment.';
            list.appendChild(empty);
        } else {
            themes.forEach(theme => {
                const card = document.createElement('article');
                card.className = 'mindmap-theme-card';
                list.appendChild(card);

                const renderDisplay = () => {
                    card.innerHTML = '';
                    const header = document.createElement('div');
                    header.className = 'mindmap-theme-card-header';

                    const title = document.createElement('div');
                    title.className = 'mindmap-theme-title';
                    title.textContent = theme.name || theme.id;
                    header.appendChild(title);

                    if (theme.id === activeId) {
                        const badge = document.createElement('span');
                        badge.className = 'mindmap-theme-badge';
                        badge.textContent = 'Active theme';
                        header.appendChild(badge);
                    }

                    card.appendChild(header);

                    const meta = document.createElement('div');
                    meta.className = 'mindmap-theme-meta';
                    meta.textContent = `${Array.isArray(theme.columns) ? theme.columns.length : 0} colonne(s)`;
                    card.appendChild(meta);

                    const preview = document.createElement('div');
                    preview.className = 'mindmap-theme-preview';
                    (Array.isArray(theme.columns) ? theme.columns : []).slice(0, 4).forEach(column => {
                        const pill = document.createElement('span');
                        pill.className = 'mindmap-theme-pill';
                        pill.style.setProperty('--mindmap-pill-color', column.color || '#0ea5e9');
                        pill.textContent = column.title || column.key;
                        preview.appendChild(pill);
                    });
                    card.appendChild(preview);

                    const actions = document.createElement('div');
                    actions.className = 'mindmap-theme-actions';

                    const activateButton = document.createElement('button');
                    activateButton.type = 'button';
                    activateButton.className = 'btn btn-secondary';
                    activateButton.textContent = theme.id === activeId ? 'Thème sélectionné' : 'Définir comme thème actif';
                    activateButton.disabled = theme.id === activeId;
                    activateButton.addEventListener('click', () => {
                        this.setMindMapActiveTheme(theme.id);
                        this.renderMindMapThemeManager(container);
                    });
                    actions.appendChild(activateButton);

                    const editButton = document.createElement('button');
                    editButton.type = 'button';
                    editButton.className = 'btn btn-outline';
                    editButton.textContent = 'Modifier';
                    editButton.addEventListener('click', () => renderEdit());
                    actions.appendChild(editButton);

                    const duplicateButton = document.createElement('button');
                    duplicateButton.type = 'button';
                    duplicateButton.className = 'btn btn-outline';
                    duplicateButton.textContent = 'Dupliquer';
                    duplicateButton.addEventListener('click', () => this.duplicateMindMapTheme(theme.id));
                    actions.appendChild(duplicateButton);

                    const deleteButton = document.createElement('button');
                    deleteButton.type = 'button';
                    deleteButton.className = 'btn btn-outline';
                    deleteButton.textContent = 'Supprimer';
                    deleteButton.disabled = themes.length <= 1;
                    deleteButton.addEventListener('click', () => {
                        if (themes.length <= 1) {
                            return;
                        }
                        this.config.mindMapThemes = themes.filter(entry => entry.id !== theme.id);
                        if (this.config.mindMapActiveThemeId === theme.id) {
                            this.config.mindMapActiveThemeId = this.config.mindMapThemes[0]?.id || '';
                        }
                        this.saveConfig();
                        this.renderMindMapThemeManager(container);
                        this.refreshMindMapFromThemes();
                    });
                    actions.appendChild(deleteButton);

                    card.appendChild(actions);
                };

                const renderEdit = () => {
                    card.innerHTML = '';

                    const form = document.createElement('div');
                    form.className = 'mindmap-theme-form';
                    card.appendChild(form);

                    const nameInput = document.createElement('input');
                    nameInput.type = 'text';
                    nameInput.value = theme.name || '';
                    nameInput.className = 'config-input-label';
                    nameInput.placeholder = 'Theme name';
                    nameInput.addEventListener('change', () => {
                        this.updateMindMapTheme(theme.id, { name: nameInput.value });
                    });
                    form.appendChild(nameInput);

                    const columnList = document.createElement('div');
                    columnList.className = 'mindmap-theme-columns';
                    form.appendChild(columnList);

                    const renderColumns = () => {
                        columnList.innerHTML = '';
                        (Array.isArray(theme.columns) ? theme.columns : []).forEach((column, index) => {
                            const row = document.createElement('div');
                            row.className = 'mindmap-theme-column-row';
                            row.draggable = true;
                            row.dataset.index = String(index);

                            row.addEventListener('dragstart', (event) => this.startMindMapThemeColumnDrag(event, theme.id, index));
                            row.addEventListener('dragover', (event) => this.handleMindMapThemeColumnDragOver(event, row));
                            row.addEventListener('dragleave', () => this.handleMindMapThemeColumnDragLeave(row));
                            row.addEventListener('drop', (event) => this.handleMindMapThemeColumnDrop(event, row, index));

                            const handle = document.createElement('span');
                            handle.className = 'drag-handle';
                            handle.setAttribute('role', 'presentation');
                            row.appendChild(handle);

                            const titleInput = document.createElement('input');
                            titleInput.type = 'text';
                            titleInput.className = 'config-input-label';
                            titleInput.value = column.title || '';
                            titleInput.placeholder = 'Column title';
                            titleInput.addEventListener('change', () => {
                                this.updateMindMapThemeColumn(theme.id, index, { title: titleInput.value });
                            });
                            row.appendChild(titleInput);

                            const subtitleInput = document.createElement('input');
                            subtitleInput.type = 'text';
                            subtitleInput.className = 'config-input-value';
                            subtitleInput.value = column.subtitle || '';
                            subtitleInput.placeholder = 'Subtitle (optional)';
                            subtitleInput.addEventListener('change', () => {
                                this.updateMindMapThemeColumn(theme.id, index, { subtitle: subtitleInput.value });
                            });
                            row.appendChild(subtitleInput);

                            const colorInput = document.createElement('input');
                            colorInput.type = 'color';
                            colorInput.className = 'mindmap-theme-color';
                            colorInput.value = column.color || '#0ea5e9';
                            colorInput.addEventListener('input', () => {
                                this.updateMindMapThemeColumn(theme.id, index, { color: colorInput.value });
                            });
                            row.appendChild(colorInput);

                            const deleteButton = document.createElement('button');
                            deleteButton.type = 'button';
                            deleteButton.className = 'btn btn-outline btn-small';
                            deleteButton.textContent = 'Supprimer';
                            deleteButton.disabled = theme.columns.length <= 1;
                            deleteButton.addEventListener('click', () => {
                                this.removeMindMapThemeColumn(theme.id, index);
                            });
                            row.appendChild(deleteButton);

                            columnList.appendChild(row);
                        });
                    };

                    renderColumns();

                    const addColumn = document.createElement('button');
                    addColumn.type = 'button';
                    addColumn.className = 'btn btn-secondary';
                    addColumn.textContent = 'Add a column';
                    addColumn.addEventListener('click', () => this.addMindMapThemeColumn(theme.id));
                    form.appendChild(addColumn);

                    const actions = document.createElement('div');
                    actions.className = 'mindmap-theme-actions';

                    const closeButton = document.createElement('button');
                    closeButton.type = 'button';
                    closeButton.className = 'btn btn-outline';
                    closeButton.textContent = 'Terminer';
                    closeButton.addEventListener('click', () => {
                        this.renderMindMapThemeManager(container);
                    });
                    actions.appendChild(closeButton);

                    form.appendChild(actions);
                };

                renderDisplay();
            });
        }

        const addForm = document.createElement('div');
        addForm.className = 'mindmap-theme-form';
        wrapper.appendChild(addForm);

        const addTitle = document.createElement('p');
        addTitle.className = 'config-template-helper';
        addTitle.textContent = 'Create a new theme';
        addForm.appendChild(addTitle);

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Theme name';
        nameInput.className = 'config-input-label';
        addForm.appendChild(nameInput);

        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'btn btn-success';
        addButton.textContent = 'Add theme';
        addButton.addEventListener('click', () => {
            const value = nameInput.value.trim();
            const id = this.addMindMapTheme({ name: value });
            nameInput.value = '';
            if (id) {
                this.renderMindMapThemeManager(container);
            }
        });
        addForm.appendChild(addButton);
    }

    getMindMapModuleConfig() {
        const config = this.config?.mindMapModuleConfig;
        if (!config || typeof config !== 'object') {
            return null;
        }

        const normalizeList = (list) => Array.isArray(list)
            ? list.map(entry => String(entry).trim()).filter(Boolean)
            : null;

        const questionConfig = config.questionConfigByLanguage && typeof config.questionConfigByLanguage === 'object'
            ? config.questionConfigByLanguage
            : null;

        return {
            activeLanguage: typeof config.activeLanguage === 'string' ? config.activeLanguage : undefined,
            activeTemplateKey: typeof config.activeTemplateKey === 'string' ? config.activeTemplateKey : undefined,
            tagOptions: normalizeList(config.tagOptions),
            tierCategoryOptions: normalizeList(config.tierCategoryOptions),
            credibilityOptions: normalizeList(config.credibilityOptions),
            questionConfigByLanguage: questionConfig
        };
    }

    buildMindMapModuleStateForFrame(baseState = this.getCurrentMindMapState()) {
        const normalizedState = this.normalizeMindMapState(baseState);
        const baseData = normalizedState.data && typeof normalizedState.data === 'object'
            ? { ...normalizedState.data }
            : {};
        const config = this.getMindMapModuleConfig();

        if (config) {
            if (config.tagOptions) {
                baseData.tagOptions = [...config.tagOptions];
            }
            if (config.tierCategoryOptions) {
                baseData.tierCategoryOptions = [...config.tierCategoryOptions];
            }
            if (config.credibilityOptions) {
                baseData.credibilityOptions = [...config.credibilityOptions];
            }
            if (config.questionConfigByLanguage) {
                baseData.questionConfigByLanguage = this.cloneMindMapModuleState(config.questionConfigByLanguage);
            }
        }

        return {
            version: 1,
            data: baseData
        };
    }

    applyMindMapModuleConfigToFrame(frame) {
        if (!frame?.contentWindow) {
            return;
        }
        const applier = frame.contentWindow.applyMindMapState;
        if (typeof applier !== 'function') {
            return;
        }

        const config = this.getMindMapModuleConfig();
        const payload = {
            version: 1,
            data: {}
        };

        if (config) {
            if (config.activeLanguage) {
                payload.data.activeLanguage = config.activeLanguage;
            }
            if (config.activeTemplateKey) {
                payload.data.activeTemplateKey = config.activeTemplateKey;
            }
            if (config.tagOptions) {
                payload.data.tagOptions = [...config.tagOptions];
            }
            if (config.tierCategoryOptions) {
                payload.data.tierCategoryOptions = [...config.tierCategoryOptions];
            }
            if (config.credibilityOptions) {
                payload.data.credibilityOptions = [...config.credibilityOptions];
            }
            if (config.questionConfigByLanguage) {
                payload.data.questionConfigByLanguage = this.cloneMindMapModuleState(config.questionConfigByLanguage);
            }
        }

        applier(payload);
    }

    saveMindMapModuleConfigFromFrame(frame) {
        const exporter = frame?.contentWindow?.exportMindMapState;
        if (typeof exporter !== 'function') {
            return;
        }

        const state = exporter();
        const data = state?.data && typeof state.data === 'object' ? state.data : {};

        const normalizeList = (list) => Array.isArray(list)
            ? list.map(entry => String(entry).trim()).filter(Boolean)
            : [];

        this.config.mindMapModuleConfig = {
            activeLanguage: typeof data.activeLanguage === 'string' ? data.activeLanguage : 'fr',
            activeTemplateKey: typeof data.activeTemplateKey === 'string' ? data.activeTemplateKey : '',
            tagOptions: normalizeList(data.tagOptions),
            tierCategoryOptions: normalizeList(data.tierCategoryOptions),
            credibilityOptions: normalizeList(data.credibilityOptions),
            questionConfigByLanguage: data.questionConfigByLanguage && typeof data.questionConfigByLanguage === 'object'
                ? this.cloneMindMapModuleState(data.questionConfigByLanguage)
                : {}
        };

        this.saveConfig();
        if (typeof showNotification === 'function') {
            showNotification('success', 'Mind map configuration saved.');
        }
    }

    renderMindMapModuleConfiguration(container) {
        if (!(container instanceof HTMLElement)) {
            return;
        }

        container.innerHTML = '';

        const helper = document.createElement('p');
        helper.className = 'config-template-helper';
        helper.textContent = 'Configure categories, tags, and questions for the mind map module here. These settings are shared across all maps.';
        container.appendChild(helper);

        const actions = document.createElement('div');
        actions.className = 'mindmap-module-actions';
        container.appendChild(actions);

        const saveButton = document.createElement('button');
        saveButton.type = 'button';
        saveButton.className = 'btn btn-success';
        saveButton.textContent = 'Enregistrer la configuration de la carte mentale';
        actions.appendChild(saveButton);

        const frame = document.createElement('iframe');
        frame.className = 'mindmap-module-frame';
        frame.id = 'mindmapModuleAdminFrame';
        frame.title = 'Mind map card configuration';
        frame.setAttribute('loading', 'lazy');
        frame.src = 'mindmap/index.html?admin=1&tab=tab-notes';
        frame.addEventListener('load', () => {
            this.applyMindMapModuleConfigToFrame(frame);
        });
        container.appendChild(frame);

        saveButton.addEventListener('click', () => {
            this.saveMindMapModuleConfigFromFrame(frame);
        });
    }

    renderInterviewTemplateManager(container) {
        if (!(container instanceof HTMLElement)) {
            return;
        }

        this.interviewTemplateManagerContainer = container;
        container.innerHTML = '';

        const manager = document.createElement('div');
        manager.className = 'config-template-manager';
        container.appendChild(manager);

        const helper = document.createElement('p');
        helper.className = 'config-template-helper';
        helper.textContent = "Create, edit, and reuse templates to prefill interview reports.";
        manager.appendChild(helper);

        const listWrapper = document.createElement('div');
        listWrapper.className = 'config-template-list';
        manager.appendChild(listWrapper);

        const templates = [...this.ensureInterviewTemplatesArray()];

        if (!templates.length) {
            const empty = document.createElement('div');
            empty.className = 'config-template-empty';
            empty.textContent = 'Aucun modèle défini pour le moment.';
            listWrapper.appendChild(empty);
        } else {
            templates.forEach((template, index) => {
                const card = document.createElement('article');
                card.className = 'config-template-card';
                listWrapper.appendChild(card);

                const renderDisplay = () => {
                    card.innerHTML = '';

                    const header = document.createElement('div');
                    header.className = 'config-template-header';

                    const title = document.createElement('div');
                    title.className = 'config-template-title';
                    title.textContent = template.label || 'Untitled template';
                    header.appendChild(title);

                    const slug = document.createElement('div');
                    slug.className = 'config-template-slug';
                    slug.textContent = template.value ? `ID : ${template.value}` : 'Identifier not set';
                    header.appendChild(slug);

                    card.appendChild(header);

                    const preview = document.createElement('div');
                    preview.className = 'config-template-preview';
                    if (template.content && String(template.content).trim()) {
                        preview.innerHTML = template.content;
                    } else {
                        preview.innerHTML = '<p class="config-template-empty">No content provided.</p>';
                    }
                    card.appendChild(preview);

                    const actions = document.createElement('div');
                    actions.className = 'config-template-actions';

                    const editButton = document.createElement('button');
                    editButton.type = 'button';
                    editButton.className = 'btn btn-secondary';
                    editButton.textContent = 'Modifier';
                    editButton.addEventListener('click', () => {
                        renderEditForm();
                    });
                    actions.appendChild(editButton);

                    const deleteButton = document.createElement('button');
                    deleteButton.type = 'button';
                    deleteButton.className = 'btn btn-outline';
                    deleteButton.textContent = 'Supprimer';
                    deleteButton.addEventListener('click', () => {
                        this.removeInterviewTemplate(index);
                    });
                    actions.appendChild(deleteButton);

                    card.appendChild(actions);
                };

                const renderEditForm = () => {
                    card.innerHTML = '';

                    const form = document.createElement('div');
                    form.className = 'config-template-form';
                    card.appendChild(form);

                    const labelInput = document.createElement('input');
                    labelInput.type = 'text';
                    labelInput.value = template.label || '';
                    labelInput.placeholder = 'Template label';
                    labelInput.className = 'config-input-label';
                    form.appendChild(labelInput);

                    const valueInput = document.createElement('input');
                    valueInput.type = 'text';
                    valueInput.value = template.value || '';
                    valueInput.placeholder = 'Auto-generated identifier';
                    valueInput.className = 'config-input-value';
                    form.appendChild(valueInput);

                    const contentInput = document.createElement('textarea');
                    contentInput.value = template.content || '';
                    contentInput.placeholder = 'Template content (HTML allowed)';
                    form.appendChild(contentInput);

                    const actions = document.createElement('div');
                    actions.className = 'config-template-actions';

                    const saveButton = document.createElement('button');
                    saveButton.type = 'button';
                    saveButton.className = 'btn btn-success';
                    saveButton.textContent = 'Enregistrer';
                    saveButton.addEventListener('click', () => {
                        const payload = {
                            label: labelInput.value.trim(),
                            value: valueInput.value.trim(),
                            content: contentInput.value.trim()
                        };

                        if (!payload.label || !payload.value) {
                            if (typeof showNotification === 'function') {
                                showNotification('error', 'Provide a label and an identifier for the template.');
                            } else {
                                alert('Provide a label and an identifier for the template.');
                            }
                            return;
                        }

                        this.updateInterviewTemplate(index, payload);
                    });
                    actions.appendChild(saveButton);

                    const cancelButton = document.createElement('button');
                    cancelButton.type = 'button';
                    cancelButton.className = 'btn btn-outline';
                    cancelButton.textContent = 'Annuler';
                    cancelButton.addEventListener('click', () => {
                        renderDisplay();
                    });
                    actions.appendChild(cancelButton);

                    form.appendChild(actions);

                    this.setupAutoValueSync(labelInput, valueInput);
                };

                renderDisplay();
            });
        }

        const addForm = document.createElement('div');
        addForm.className = 'config-template-form';
        manager.appendChild(addForm);

        const addIntro = document.createElement('p');
        addIntro.className = 'config-template-helper';
        addIntro.textContent = 'Add a new interview template';
        addForm.appendChild(addIntro);

        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.placeholder = 'Template label';
        labelInput.className = 'config-input-label';
        addForm.appendChild(labelInput);

        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.placeholder = 'Auto-generated identifier';
        valueInput.className = 'config-input-value';
        addForm.appendChild(valueInput);

        const contentInput = document.createElement('textarea');
        contentInput.placeholder = 'Template content (HTML allowed)';
        addForm.appendChild(contentInput);

        const actions = document.createElement('div');
        actions.className = 'config-template-actions';
        addForm.appendChild(actions);

        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'btn btn-success';
        addButton.textContent = 'Add template';
        addButton.addEventListener('click', () => {
            const payload = {
                label: labelInput.value.trim(),
                value: valueInput.value.trim(),
                content: contentInput.value.trim()
            };

            if (!payload.label || !payload.value) {
                if (typeof showNotification === 'function') {
                    showNotification('error', 'Provide a label and an identifier for the template.');
                } else {
                    alert('Provide a label and an identifier for the template.');
                }
                return;
            }

            this.createInterviewTemplate(payload);
        });
        actions.appendChild(addButton);

        this.setupAutoValueSync(labelInput, valueInput);

        this.renderInterviewTemplateChoices();
    }

    createInterviewTemplate(payload) {
        const templates = this.ensureInterviewTemplatesArray();
        const normalized = this.normalizeInterviewTemplate(payload);
        if (!normalized) {
            return false;
        }

        const duplicate = templates.some(template => template.value === normalized.value);
        if (duplicate) {
            if (typeof showNotification === 'function') {
                showNotification('error', 'This identifier is already used by another template.');
            } else {
                alert('This identifier is already used by another template.');
            }
            return false;
        }

        templates.push(normalized);
        this.saveConfig();
        this.renderInterviewTemplateManager(this.interviewTemplateManagerContainer);
        this.renderInterviewTemplateChoices();

        if (typeof showNotification === 'function') {
            showNotification('success', 'Template added successfully');
        }
        return true;
    }

    updateInterviewTemplate(index, payload) {
        const templates = this.ensureInterviewTemplatesArray();
        if (index < 0 || index >= templates.length) {
            return false;
        }

        const base = templates[index];
        const normalized = this.normalizeInterviewTemplate({ ...base, ...payload });
        if (!normalized) {
            return false;
        }

        const duplicate = templates.some((template, idx) => idx !== index && template.value === normalized.value);
        if (duplicate) {
            if (typeof showNotification === 'function') {
                showNotification('error', 'This identifier is already used by another template.');
            } else {
                alert('This identifier is already used by another template.');
            }
            return false;
        }

        templates[index] = normalized;
        this.saveConfig();
        this.renderInterviewTemplateManager(this.interviewTemplateManagerContainer);
        this.renderInterviewTemplateChoices();

        if (typeof showNotification === 'function') {
            showNotification('success', 'Template updated');
        }
        return true;
    }

    removeInterviewTemplate(index) {
        const templates = this.ensureInterviewTemplatesArray();
        if (index < 0 || index >= templates.length) {
            return;
        }

        const target = templates[index];
        const label = target?.label ? `« ${target.label} »` : 'cette trame';

        if (typeof window !== 'undefined') {
            const confirmed = window.confirm(`Do you confirm deleting ${label} ?`);
            if (!confirmed) {
                return;
            }
        }

        templates.splice(index, 1);
        this.saveConfig();
        this.renderInterviewTemplateManager(this.interviewTemplateManagerContainer);
        this.renderInterviewTemplateChoices();

        if (typeof showNotification === 'function') {
            showNotification('success', 'Template deleted');
        }
    }

    renderProcessManager(container) {
        if (!container) {
            return;
        }

        container.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'process-manager-header';

        const title = document.createElement('h3');
        title.textContent = 'Gestion des processus et sous-processus';
        header.appendChild(title);

        const subtitle = document.createElement('p');
        subtitle.textContent = 'Add your processes, attach sub-processes, and assign referents. Use drag-and-drop to reorganize the hierarchy.';
        header.appendChild(subtitle);

        container.appendChild(header);

        const filtersBar = document.createElement('div');
        filtersBar.className = 'process-manager-filters';

        const queryInput = document.createElement('input');
        queryInput.type = 'search';
        queryInput.className = 'process-filter-input';
        queryInput.placeholder = 'Filter by process or sub-process title';
        queryInput.value = this.processManagerFilters.query || '';
        queryInput.addEventListener('input', (event) => {
            this.processManagerFilters.query = event.target.value || '';
            this.renderProcessManager(container);
        });
        filtersBar.appendChild(queryInput);

        const referentInput = document.createElement('input');
        referentInput.type = 'search';
        referentInput.className = 'process-filter-input';
        referentInput.placeholder = 'Filter by referent';
        referentInput.value = this.processManagerFilters.referent || '';
        referentInput.setAttribute('list', 'processReferentSuggestions');
        referentInput.addEventListener('input', (event) => {
            this.processManagerFilters.referent = event.target.value || '';
            this.renderProcessManager(container);
        });
        filtersBar.appendChild(referentInput);

        const referentDirectoryButton = document.createElement('button');
        referentDirectoryButton.type = 'button';
        referentDirectoryButton.className = 'btn btn-secondary process-filter-directory';
        referentDirectoryButton.textContent = '📋 Preload referents';
        referentDirectoryButton.addEventListener('click', () => this.openReferentDirectoryModal());
        filtersBar.appendChild(referentDirectoryButton);

        if ((this.processManagerFilters.query || '').trim() || (this.processManagerFilters.referent || '').trim()) {
            const resetButton = document.createElement('button');
            resetButton.type = 'button';
            resetButton.className = 'btn btn-outline process-filter-reset';
            resetButton.textContent = 'Reset';
            resetButton.addEventListener('click', () => {
                this.processManagerFilters = { query: '', referent: '' };
                this.renderProcessManager(container);
            });
            filtersBar.appendChild(resetButton);
        }

        container.appendChild(filtersBar);

        this.ensureReferentDatalist(container);

        const listWrapper = document.createElement('div');
        listWrapper.className = 'process-manager-list';
        container.appendChild(listWrapper);

        const filters = this.getProcessFilterState();
        const filtersActive = filters.hasQuery || filters.hasReferent;

        let hasVisibleProcesses = false;
        let lastControlIndex = 0;

        listWrapper.appendChild(this.createProcessInsertionControl(0, { filtersActive }));

        this.config.processes.forEach((process, index) => {
            const subs = Array.isArray(this.config.subProcesses[process.value])
                ? this.config.subProcesses[process.value]
                : [];
            const visibility = this.evaluateProcessVisibility(process, subs, filters);
            if (!visibility.visible) {
                return;
            }

            hasVisibleProcesses = true;

            const card = this.createProcessCard({
                process,
                index,
                visibleSubs: visibility.subs,
                totalSubs: subs.length,
                filters,
                filtersActive
            });

            listWrapper.appendChild(card);

            const control = this.createProcessInsertionControl(index + 1, { filtersActive });
            listWrapper.appendChild(control);
            lastControlIndex = index + 1;
        });

        if (this.config.processes.length > 0 && lastControlIndex !== this.config.processes.length) {
            listWrapper.appendChild(this.createProcessInsertionControl(this.config.processes.length, { filtersActive }));
            lastControlIndex = this.config.processes.length;
        }

        if (!hasVisibleProcesses) {
            const empty = document.createElement('div');
            empty.className = 'process-manager-empty';
            empty.innerHTML = '<p>No process matches the current filters.</p><p>Use the + button to add a process, or reset the filters.</p>';
            listWrapper.appendChild(empty);
        }
    }


    ensureReferentDatalist(container) {
        const scope = container instanceof HTMLElement ? container : document.body;
        const datalistId = 'processReferentSuggestions';
        let datalist = document.getElementById(datalistId);

        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = datalistId;
            scope.appendChild(datalist);
        } else if (scope !== document.body && !scope.contains(datalist)) {
            datalist.remove();
            scope.appendChild(datalist);
        }

        const referents = this.collectAllReferents();
        datalist.innerHTML = '';
        referents.forEach((referent) => {
            const option = document.createElement('option');
            option.value = referent;
            datalist.appendChild(option);
        });
    }

    openReferentDirectoryModal() {
        const modal = document.getElementById('referentDirectoryModal');
        const textarea = document.getElementById('referentDirectoryInput');

        if (!modal || !textarea) {
            return;
        }

        textarea.value = this.normalizeReferentDirectory(this.config?.referentDirectory).join('\n');

        if (!textarea.dataset.listenerAttached) {
            textarea.addEventListener('input', () => this.updateReferentDirectoryPreview());
            textarea.dataset.listenerAttached = 'true';
        }

        this.updateReferentDirectoryPreview();
        modal.classList.add('show');
        setTimeout(() => textarea.focus(), 50);
    }

    closeReferentDirectoryModal() {
        const modal = document.getElementById('referentDirectoryModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    parseReferentDirectoryInput(rawInput) {
        if (typeof rawInput !== 'string') {
            return [];
        }

        return this.normalizeReferentDirectory(
            rawInput
                .split(/[\n,;]+/)
                .map((entry) => entry.trim())
                .filter(Boolean)
        );
    }

    updateReferentDirectoryPreview() {
        const textarea = document.getElementById('referentDirectoryInput');
        const helper = document.getElementById('referentDirectoryHelper');

        if (!textarea || !helper) {
            return;
        }

        const entries = this.parseReferentDirectoryInput(textarea.value);
        helper.textContent = entries.length === 0
            ? 'Aucun référent détecté pour le moment.'
            : `${entries.length} referent${entries.length > 1 ? 's' : ''} will be suggested while typing.`;
    }

    saveReferentDirectoryFromModal() {
        const textarea = document.getElementById('referentDirectoryInput');
        if (!textarea) {
            return;
        }

        const entries = this.parseReferentDirectoryInput(textarea.value);
        this.config.referentDirectory = entries;
        this.saveConfig();
        this.ensureReferentDatalist(this.processManagerContainer || document.body);
        this.rerenderProcessManager();
        this.closeReferentDirectoryModal();
    }

    getProcessFilterState() {
        const query = (this.processManagerFilters.query || '').trim();
        const referent = (this.processManagerFilters.referent || '').trim();
        return {
            query,
            referent,
            normalizedQuery: query.toLowerCase(),
            normalizedReferent: referent.toLowerCase(),
            hasQuery: query.length > 0,
            hasReferent: referent.length > 0
        };
    }

    evaluateProcessVisibility(process, subs, filters) {
        const processReferents = Array.isArray(process?.referents) ? process.referents : [];

        const matchesProcessQuery = !filters.hasQuery || [process.label, process.value, ...processReferents]
            .filter(value => typeof value === 'string')
            .some(value => value.toLowerCase().includes(filters.normalizedQuery));

        const matchesProcessReferent = !filters.hasReferent || processReferents
            .some(ref => typeof ref === 'string' && ref.toLowerCase() === filters.normalizedReferent);

        const normalizedSubs = subs.map((subProcess, index) => {
            const subReferents = Array.isArray(subProcess?.referents) ? subProcess.referents : [];
            const matchesQuery = !filters.hasQuery || [subProcess.label, subProcess.value, ...subReferents]
                .filter(value => typeof value === 'string')
                .some(value => value.toLowerCase().includes(filters.normalizedQuery));
            const matchesReferent = !filters.hasReferent || subReferents
                .some(ref => typeof ref === 'string' && ref.toLowerCase() === filters.normalizedReferent);

            return {
                item: subProcess,
                index,
                visible: (!filters.hasQuery && !filters.hasReferent) || (matchesQuery && matchesReferent)
            };
        });

        const visibleSubs = filters.hasQuery || filters.hasReferent
            ? normalizedSubs.filter(entry => entry.visible)
            : normalizedSubs;

        const processVisible = (!filters.hasQuery && !filters.hasReferent)
            || (matchesProcessQuery && matchesProcessReferent)
            || visibleSubs.length > 0;

        return { visible: processVisible, subs: visibleSubs };
    }

    isProcessCollapsed(processValue) {
        if (!processValue) {
            return false;
        }
        return this.collapsedProcesses instanceof Set && this.collapsedProcesses.has(processValue);
    }

    setProcessCollapsed(processValue, collapsed) {
        if (!processValue) {
            return;
        }
        if (!(this.collapsedProcesses instanceof Set)) {
            this.collapsedProcesses = new Set();
        }
        if (collapsed) {
            this.collapsedProcesses.add(processValue);
        } else {
            this.collapsedProcesses.delete(processValue);
        }
    }

    toggleProcessCollapse(processValue) {
        if (!processValue) {
            return;
        }
        const nextState = !this.isProcessCollapsed(processValue);
        this.setProcessCollapsed(processValue, nextState);
        this.rerenderProcessManager();
    }

    createProcessInsertionControl(position, options = {}) {
        const { parentProcess = null, filtersActive = false } = options;
        const control = document.createElement('div');
        control.className = 'process-insert-control';
        control.dataset.position = String(position);
        if (parentProcess) {
            control.dataset.parentProcess = parentProcess;
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'process-insert-button';
        button.innerHTML = '<span aria-hidden="true">+</span>';
        button.setAttribute('aria-label', parentProcess
            ? 'Add a sub-process here'
            : 'Add a process here');

        if (filtersActive) {
            button.disabled = true;
            button.title = 'Adding is disabled while filters are active';
            control.classList.add('is-disabled');
        } else {
            button.addEventListener('click', () => {
                this.toggleInsertionForm({ parentProcess, position });
            });

            control.addEventListener('dragover', (event) => {
                this.handleInsertDragOver(event, control, { parentProcess, position });
            });
            control.addEventListener('dragleave', () => {
                this.handleInsertDragLeave(control);
            });
            control.addEventListener('drop', (event) => {
                this.handleInsertDrop(event, control, { parentProcess, position });
            });
        }

        control.appendChild(button);

        const isActive = this.activeInsertionForm
            && this.activeInsertionForm.position === position
            && (this.activeInsertionForm.parentProcess || null) === (parentProcess || null);

        if (isActive && !filtersActive) {
            control.classList.add('process-insert-open');
            const form = this.renderProcessInsertionForm({ parentProcess, position });
            control.appendChild(form);
        }

        return control;
    }

    toggleInsertionForm(context) {
        const { parentProcess = null, position = 0 } = context || {};

        if (this.activeInsertionForm
            && this.activeInsertionForm.position === position
            && (this.activeInsertionForm.parentProcess || null) === (parentProcess || null)) {
            this.closeActiveInsertionForm({ rerender: true });
            return;
        }

        this.activeInsertionForm = { parentProcess: parentProcess || null, position };
        this.rerenderProcessManager();
    }

    renderProcessInsertionForm(options = {}) {
        const { parentProcess = null, position = 0 } = options;

        const form = document.createElement('form');
        form.className = 'process-insert-form';

        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.required = true;
        labelInput.className = 'process-insert-input';
        labelInput.placeholder = parentProcess
            ? 'Sub-process label'
            : 'Libellé du processus';

        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.required = true;
        valueInput.className = 'process-insert-input';
        valueInput.placeholder = parentProcess
            ? 'Sub-process identifier'
            : 'Identifiant du processus';

        this.setupAutoValueSync(labelInput, valueInput);

        const actions = document.createElement('div');
        actions.className = 'process-insert-actions';

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'btn btn-primary btn-small';
        submitButton.textContent = parentProcess ? 'Add sub-process' : 'Add process';

        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'btn btn-outline btn-small';
        cancelButton.textContent = 'Annuler';
        cancelButton.addEventListener('click', () => {
            this.closeActiveInsertionForm({ rerender: true });
        });

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const label = labelInput.value.trim();
            const value = valueInput.value.trim();
            if (!label || !value) {
                return;
            }

            if (parentProcess) {
                this.handleSubProcessSubmit({ parentProcess, label, value, position });
            } else {
                this.handleProcessSubmit({ label, value, position });
            }
        });

        form.appendChild(labelInput);
        form.appendChild(valueInput);
        actions.appendChild(submitButton);
        actions.appendChild(cancelButton);
        form.appendChild(actions);

        return form;
    }

    handleProcessSubmit(payload) {
        const { label, value, position } = payload || {};
        if (!label || !value) {
            return;
        }

        const normalizedLabel = label.trim();
        const baseValue = (value && value.trim()) || slugifyLabel(normalizedLabel);
        const uniqueValue = this.generateUniqueProcessValue(baseValue);

        const entry = {
            value: uniqueValue,
            label: normalizedLabel,
            referents: []
        };

        const insertIndex = Number.isInteger(position)
            ? Math.max(0, Math.min(position, this.config.processes.length))
            : this.config.processes.length;

        this.config.processes.splice(insertIndex, 0, entry);
        this.config.subProcesses[uniqueValue] = [];

        this.saveConfig();
        this.populateSelects();
        this.updateSousProcessusOptions();
        this.closeActiveInsertionForm();
        this.rerenderProcessManager();
    }

    handleSubProcessSubmit(payload) {
        const { parentProcess, label, value, position } = payload || {};
        if (!parentProcess || !label || !value) {
            return;
        }

        const normalizedLabel = label.trim();
        const baseValue = (value && value.trim()) || slugifyLabel(normalizedLabel);
        const uniqueValue = this.generateUniqueSubProcessValue(parentProcess, baseValue);

        if (!this.config.subProcesses[parentProcess]) {
            this.config.subProcesses[parentProcess] = [];
        }

        const list = this.config.subProcesses[parentProcess];
        const insertIndex = Number.isInteger(position)
            ? Math.max(0, Math.min(position, list.length))
            : list.length;

        list.splice(insertIndex, 0, {
            value: uniqueValue,
            label: normalizedLabel,
            referents: []
        });

        this.saveConfig();
        this.updateSousProcessusOptions();
        this.closeActiveInsertionForm();
        this.rerenderProcessManager();
    }

    generateUniqueProcessValue(baseValue, excludeIndex = -1) {
        const fallback = baseValue && baseValue.trim() ? baseValue.trim() : 'processus';
        const existing = new Set();

        this.config.processes.forEach((item, index) => {
            if (index === excludeIndex) {
                return;
            }
            if (item && item.value) {
                existing.add(String(item.value).toLowerCase());
            }
        });

        let candidate = fallback;
        let suffix = 2;
        while (existing.has(candidate.toLowerCase())) {
            candidate = `${fallback}-${suffix}`;
            suffix += 1;
        }
        return candidate;
    }

    generateUniqueSubProcessValue(parentProcess, baseValue, excludeIndex = -1) {
        const fallback = baseValue && baseValue.trim() ? baseValue.trim() : 'sous-processus';
        const list = Array.isArray(this.config.subProcesses[parentProcess])
            ? this.config.subProcesses[parentProcess]
            : [];
        const existing = new Set();

        list.forEach((item, index) => {
            if (index === excludeIndex) {
                return;
            }
            if (item && item.value) {
                existing.add(String(item.value).toLowerCase());
            }
        });

        let candidate = fallback;
        let suffix = 2;
        while (existing.has(candidate.toLowerCase())) {
            candidate = `${fallback}-${suffix}`;
            suffix += 1;
        }
        return candidate;
    }

    createProcessCard(context) {
        const { process, index, visibleSubs, totalSubs, filters, filtersActive } = context;
        const card = document.createElement('div');
        card.className = 'process-card';
        card.dataset.index = String(index);
        card.dataset.value = process.value;
        card.draggable = true;

        const processLabel = process.label || process.value || 'processus';
        const collapseForcedOpen = Boolean(filtersActive);
        const isCollapsed = collapseForcedOpen ? false : this.isProcessCollapsed(process.value);
        card.classList.toggle('is-collapsed', isCollapsed);

        card.addEventListener('dragstart', (event) => {
            this.handleProcessDragStart(event, card, index);
        });
        card.addEventListener('dragend', () => {
            this.handleDragEnd(card);
        });

        const header = document.createElement('div');
        header.className = 'process-card-header';

        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.setAttribute('role', 'presentation');
        header.appendChild(dragHandle);

        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'process-title-input';
        titleInput.value = process.label || '';
        titleInput.placeholder = 'Nom du processus';
        titleInput.addEventListener('change', () => {
            this.renameProcess(index, titleInput.value);
        });
        titleInput.addEventListener('blur', () => {
            if (titleInput.value.trim() !== (process.label || '')) {
                this.renameProcess(index, titleInput.value);
            }
        });
        header.appendChild(titleInput);

        const headerActions = document.createElement('div');
        headerActions.className = 'process-card-actions';
        header.appendChild(headerActions);

        const summary = document.createElement('span');
        summary.className = 'process-sub-count';
        if (filters.hasQuery || filters.hasReferent) {
            summary.textContent = `${visibleSubs.length} / ${totalSubs} sub-processes`;
        } else {
            summary.textContent = `${totalSubs} sub-processes`;
        }
        headerActions.appendChild(summary);

        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.className = 'process-card-toggle';
        toggleButton.setAttribute('aria-expanded', String(!isCollapsed));
        toggleButton.setAttribute('aria-label', `${isCollapsed ? 'Show' : 'Hide'} sub-processes for ${processLabel}`);
        toggleButton.classList.toggle('is-collapsed', isCollapsed);
        if (collapseForcedOpen) {
            toggleButton.disabled = true;
            toggleButton.title = 'Auto-expanded while filters are active';
        } else {
            toggleButton.title = isCollapsed
                ? 'Show sub-processes'
                : 'Hide sub-processes';
        }
        const toggleIcon = document.createElement('span');
        toggleIcon.className = 'process-card-toggle-icon';
        toggleIcon.setAttribute('aria-hidden', 'true');
        toggleButton.appendChild(toggleIcon);
        if (!collapseForcedOpen) {
            toggleButton.addEventListener('click', () => {
                this.toggleProcessCollapse(process.value);
            });
        }
        headerActions.appendChild(toggleButton);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'icon-button danger';
        deleteButton.setAttribute('aria-label', `Delete process ${processLabel}`);
        deleteButton.innerHTML = '<span aria-hidden="true">✕</span>';
        deleteButton.addEventListener('click', () => {
            this.deleteProcess(index);
        });
        headerActions.appendChild(deleteButton);

        card.appendChild(header);

        const referentEditor = this.renderReferentEditor({
            referents: process.referents,
            scope: 'process',
            processIndex: index,
            processValue: process.value
        });
        card.appendChild(referentEditor);

        const subSection = document.createElement('div');
        subSection.className = 'subprocess-section';

        const subHeader = document.createElement('div');
        subHeader.className = 'subprocess-section-header';
        subHeader.textContent = 'Sub-processes';
        subSection.appendChild(subHeader);

        const list = document.createElement('div');
        list.className = 'subprocess-list';

        list.appendChild(this.createProcessInsertionControl(0, {
            parentProcess: process.value,
            filtersActive
        }));

        if (visibleSubs.length === 0) {
            const message = document.createElement('div');
            message.className = 'subprocess-empty';
            message.textContent = totalSubs === 0
                ? 'Aucun sous-processus pour le moment.'
                : 'Aucun sous-processus ne correspond aux filtres actifs.';
            list.appendChild(message);
        } else {
            visibleSubs.forEach((entry) => {
                const subCard = this.createSubProcessCard({
                    parentProcess: process,
                    processIndex: index,
                    subProcess: entry.item,
                    subIndex: entry.index
                });
                list.appendChild(subCard);

                list.appendChild(this.createProcessInsertionControl(entry.index + 1, {
                    parentProcess: process.value,
                    filtersActive
                }));
            });
        }

        subSection.appendChild(list);
        subSection.hidden = isCollapsed;
        subSection.setAttribute('aria-hidden', String(isCollapsed));
        card.appendChild(subSection);

        return card;
    }

    createSubProcessCard(context) {
        const { parentProcess, processIndex, subProcess, subIndex } = context;
        const card = document.createElement('div');
        card.className = 'subprocess-card';
        card.dataset.index = String(subIndex);
        card.dataset.parentProcess = parentProcess.value;
        card.draggable = true;

        card.addEventListener('dragstart', (event) => {
            this.handleSubProcessDragStart(event, card, parentProcess.value, subIndex);
        });
        card.addEventListener('dragend', () => {
            this.handleDragEnd(card);
        });
        card.addEventListener('dragover', (event) => {
            this.handleSubProcessCardDragOver(event, card);
        });
        card.addEventListener('dragleave', (event) => {
            if (!card.contains(event.relatedTarget)) {
                this.handleSubProcessCardDragLeave(card);
            }
        });
        card.addEventListener('drop', (event) => {
            this.handleSubProcessCardDrop(event, card);
        });

        const header = document.createElement('div');
        header.className = 'subprocess-card-header';

        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        header.appendChild(dragHandle);

        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'subprocess-title-input';
        titleInput.value = subProcess.label || '';
        titleInput.placeholder = 'Sub-process name';
        titleInput.addEventListener('change', () => {
            this.renameSubProcess(parentProcess.value, subIndex, titleInput.value);
        });
        titleInput.addEventListener('blur', () => {
            if (titleInput.value.trim() !== (subProcess.label || '')) {
                this.renameSubProcess(parentProcess.value, subIndex, titleInput.value);
            }
        });
        header.appendChild(titleInput);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'icon-button danger';
        deleteButton.setAttribute('aria-label', `Delete sub-process ${subProcess.label}`);
        deleteButton.innerHTML = '<span aria-hidden="true">✕</span>';
        deleteButton.addEventListener('click', () => {
            this.deleteSubProcess(parentProcess.value, subIndex);
        });
        header.appendChild(deleteButton);

        card.appendChild(header);

        const referentEditor = this.renderReferentEditor({
            referents: subProcess.referents,
            scope: 'subprocess',
            processIndex,
            processValue: parentProcess.value,
            subIndex
        });
        card.appendChild(referentEditor);

        return card;
    }

    renderReferentEditor(options = {}) {
        const {
            referents = [],
            scope = 'process',
            processIndex = -1,
            processValue = '',
            subIndex = -1
        } = options;

        const container = document.createElement('div');
        container.className = scope === 'subprocess'
            ? 'subprocess-card-referents'
            : 'process-card-referents';

        const title = document.createElement('div');
        title.className = 'referent-editor-title';
        title.textContent = 'Referents';
        container.appendChild(title);

        const chips = document.createElement('div');
        chips.className = 'referent-chip-container';

        const normalizedReferents = Array.isArray(referents) ? referents : [];
        if (normalizedReferents.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'referent-empty';
            empty.textContent = 'Aucun référent défini';
            chips.appendChild(empty);
        } else {
            normalizedReferents.forEach((referent) => {
                if (!referent) {
                    return;
                }
                const chip = document.createElement('span');
                chip.className = 'referent-chip';
                chip.textContent = referent;

                const remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'referent-chip-remove';
                remove.setAttribute('aria-label', `Remove ${referent}`);
                remove.textContent = '×';
                remove.addEventListener('click', () => {
                    if (scope === 'subprocess') {
                        this.removeReferentFromSubProcess(processValue, subIndex, referent);
                    } else {
                        this.removeReferentFromProcess(processIndex, referent);
                    }
                });

                chip.appendChild(remove);
                chips.appendChild(chip);
            });
        }

        container.appendChild(chips);

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'referent-input-wrapper';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'referent-input';
        input.placeholder = 'Add a referent';
        input.setAttribute('list', 'processReferentSuggestions');

        const commitInputValue = () => {
            const value = input.value.trim();
            if (!value) {
                return;
            }
            if (scope === 'subprocess') {
                this.addReferentToSubProcess(processValue, subIndex, value);
            } else {
                this.addReferentToProcess(processIndex, value);
            }
            input.value = '';
        };

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ',' || event.key === ';') {
                event.preventDefault();
                commitInputValue();
            }
        });

        input.addEventListener('blur', () => {
            commitInputValue();
        });

        inputWrapper.appendChild(input);

        const helper = document.createElement('p');
        helper.className = 'referent-helper';
        helper.textContent = 'Press Enter to add a referent. Suggestions come from existing referents.';

        container.appendChild(inputWrapper);
        container.appendChild(helper);

        return container;
    }

    closeActiveInsertionForm(options = {}) {
        this.activeInsertionForm = null;
        if (options && options.rerender) {
            this.rerenderProcessManager();
        }
    }

    rerenderProcessManager() {
        if (this.currentConfigSection === 'processManager' && this.processManagerContainer instanceof HTMLElement) {
            this.renderProcessManager(this.processManagerContainer);
        }
    }

    normalizeReferentDirectory(list) {
        if (!Array.isArray(list)) {
            return [];
        }

        const cleaned = [];
        const seen = new Set();

        list.forEach((entry) => {
            const value = typeof entry === 'string' ? entry.trim() : '';
            if (!value) {
                return;
            }

            const key = value.toLowerCase();
            if (seen.has(key)) {
                return;
            }

            seen.add(key);
            cleaned.push(value);
        });

        return cleaned;
    }

    collectAllReferents() {
        const referents = new Set(this.normalizeReferentDirectory(this.config?.referentDirectory));
        const add = (value) => {
            if (!value || typeof value !== 'string') {
                return;
            }
            const trimmed = value.trim();
            if (!trimmed) {
                return;
            }
            referents.add(trimmed);
        };

        (this.config.processes || []).forEach(process => {
            (process?.referents || []).forEach(add);
            const subs = this.config.subProcesses?.[process.value] || [];
            subs.forEach(sub => {
                (sub?.referents || []).forEach(add);
            });
        });

        return Array.from(referents).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
    }

    addReferentToProcess(index, referent) {
        const target = this.config.processes?.[index];
        if (!target) {
            return;
        }

        const normalized = typeof referent === 'string' ? referent.trim() : '';
        if (!normalized) {
            return;
        }

        target.referents = Array.isArray(target.referents) ? target.referents : [];
        const exists = target.referents.some(entry => typeof entry === 'string' && entry.toLowerCase() === normalized.toLowerCase());
        if (exists) {
            return;
        }

        target.referents.push(normalized);
        this.saveConfig();
        this.rerenderProcessManager();
    }

    removeReferentFromProcess(index, referent) {
        const target = this.config.processes?.[index];
        if (!target || !Array.isArray(target.referents)) {
            return;
        }

        const normalized = typeof referent === 'string' ? referent.trim().toLowerCase() : '';
        if (!normalized) {
            return;
        }

        target.referents = target.referents.filter(entry => {
            return typeof entry === 'string' && entry.trim().toLowerCase() !== normalized;
        });

        this.saveConfig();
        this.rerenderProcessManager();
    }

    addReferentToSubProcess(processValue, subIndex, referent) {
        if (!processValue || typeof referent !== 'string') {
            return;
        }
        const list = this.config.subProcesses?.[processValue];
        if (!Array.isArray(list) || !list[subIndex]) {
            return;
        }

        const normalized = referent.trim();
        if (!normalized) {
            return;
        }

        list[subIndex].referents = Array.isArray(list[subIndex].referents) ? list[subIndex].referents : [];
        const exists = list[subIndex].referents.some(entry => typeof entry === 'string' && entry.toLowerCase() === normalized.toLowerCase());
        if (exists) {
            return;
        }

        list[subIndex].referents.push(normalized);
        this.saveConfig();
        this.rerenderProcessManager();
    }

    removeReferentFromSubProcess(processValue, subIndex, referent) {
        const list = this.config.subProcesses?.[processValue];
        if (!Array.isArray(list) || !list[subIndex] || typeof referent !== 'string') {
            return;
        }

        const normalized = referent.trim().toLowerCase();
        if (!normalized) {
            return;
        }

        list[subIndex].referents = (list[subIndex].referents || []).filter(entry => {
            return typeof entry === 'string' && entry.trim().toLowerCase() !== normalized;
        });

        this.saveConfig();
        this.rerenderProcessManager();
    }

    renameProcess(index, label) {
        const target = this.config.processes?.[index];
        if (!target) {
            return;
        }

        const normalizedLabel = typeof label === 'string' ? label.trim() : '';
        if (!normalizedLabel) {
            this.rerenderProcessManager();
            return;
        }

        const baseValue = slugifyLabel ? slugifyLabel(normalizedLabel) : normalizedLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const uniqueValue = baseValue === target.value
            ? target.value
            : this.generateUniqueProcessValue(baseValue, index);

        this.updateConfigOption('processes', index, { value: uniqueValue, label: normalizedLabel });
    }

    renameSubProcess(processValue, subIndex, label) {
        const list = this.config.subProcesses?.[processValue];
        if (!Array.isArray(list) || !list[subIndex]) {
            return;
        }

        const normalizedLabel = typeof label === 'string' ? label.trim() : '';
        if (!normalizedLabel) {
            this.rerenderProcessManager();
            return;
        }

        const baseValue = slugifyLabel ? slugifyLabel(normalizedLabel) : normalizedLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const uniqueValue = baseValue === list[subIndex].value
            ? list[subIndex].value
            : this.generateUniqueSubProcessValue(processValue, baseValue, subIndex);

        this.updateSubProcess(processValue, subIndex, { value: uniqueValue, label: normalizedLabel });
        this.rerenderProcessManager();
    }

    deleteProcess(index) {
        const target = this.config.processes?.[index];
        if (!target) {
            return;
        }

        if (typeof confirm === 'function') {
            const confirmed = confirm(`Delete le processus "${target.label || target.value}" et ses sous-processus ?`);
            if (!confirmed) {
                return;
            }
        }

        const removed = this.config.processes.splice(index, 1)[0];
        const removedValue = removed?.value;
        if (removedValue && this.config.subProcesses[removedValue]) {
            delete this.config.subProcesses[removedValue];
        }

        if (removedValue && this.collapsedProcesses instanceof Set) {
            this.collapsedProcesses.delete(removedValue);
        }

        if (removedValue) {
            this.risks.forEach(risk => {
                if (risk.processus === removedValue) {
                    risk.processus = '';
                    risk.sousProcessus = '';
                }
                if (Array.isArray(risk.processusAssocies) && risk.processusAssocies.length) {
                    risk.processusAssocies = risk.processusAssocies.filter(item => item !== removedValue);
                    risk.processus = risk.processusAssocies[0] || '';
                }
                if (Array.isArray(risk.sousProcessusAssocies) && risk.sousProcessusAssocies.length) {
                    const validSubProcessValues = new Set();
                    (risk.processusAssocies || []).forEach(processKey => {
                        const entries = Array.isArray(this.config?.subProcesses?.[processKey])
                            ? this.config.subProcesses[processKey]
                            : [];
                        entries.forEach(entry => validSubProcessValues.add(entry?.value));
                    });
                    risk.sousProcessusAssocies = risk.sousProcessusAssocies.filter(item => validSubProcessValues.has(item));
                    risk.sousProcessus = risk.sousProcessusAssocies[0] || '';
                }
            });
        }

        this.saveData();
        this.saveConfig();
        this.populateSelects();
        this.updateSousProcessusOptions();
        this.updateRisksList();
        this.rerenderProcessManager();
    }

    deleteSubProcess(processValue, subIndex) {
        const list = this.config.subProcesses?.[processValue];
        if (!Array.isArray(list) || !list[subIndex]) {
            return;
        }

        const target = list[subIndex];
        if (typeof confirm === 'function') {
            const confirmed = confirm(`Delete le sous-processus "${target.label || target.value}" ?`);
            if (!confirmed) {
                return;
            }
        }

        list.splice(subIndex, 1);

        const removedValue = target?.value;
        if (removedValue) {
            this.risks.forEach(risk => {
                if (risk.processus === processValue && risk.sousProcessus === removedValue) {
                    risk.sousProcessus = '';
                }
                if (Array.isArray(risk.sousProcessusAssocies) && risk.sousProcessusAssocies.length) {
                    risk.sousProcessusAssocies = risk.sousProcessusAssocies.filter(item => item !== removedValue);
                    risk.sousProcessus = risk.sousProcessusAssocies[0] || '';
                }
            });
        }

        this.saveData();
        this.saveConfig();
        this.updateSousProcessusOptions();
        this.updateRisksList();
        this.rerenderProcessManager();
    }

    handleInsertDragOver(event, control, context = {}) {
        if (!this.dragState) {
            return;
        }

        const { parentProcess = null } = context;
        const { type } = this.dragState;

        if ((type === 'process' && parentProcess) || (type === 'subprocess' && parentProcess == null)) {
            return;
        }

        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
        control.classList.add('drop-target');
    }

    handleInsertDragLeave(control) {
        control.classList.remove('drop-target');
    }

    handleInsertDrop(event, control, context = {}) {
        if (!this.dragState) {
            return;
        }
        event.preventDefault();
        control.classList.remove('drop-target');
        this.clearSubProcessDropIndicators();

        const position = Number(control.dataset.position || context.position || 0);
        const parentProcess = control.dataset.parentProcess || context.parentProcess || null;

        if (this.dragState.type === 'process' && parentProcess == null) {
            this.moveProcess(this.dragState.fromIndex, position);
        } else if (this.dragState.type === 'subprocess' && parentProcess) {
            this.moveSubProcess(this.dragState.parentProcess, this.dragState.fromIndex, parentProcess, position);
        }

        this.dragState = null;
    }

    handleProcessDragStart(event, card, index) {
        if (event?.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            try {
                event.dataTransfer.setData('text/plain', `process:${index}`);
            } catch (error) {
                // ignore
            }
        }

        this.dragState = { type: 'process', fromIndex: index };
        card.classList.add('dragging');
    }

    handleSubProcessDragStart(event, card, parentProcess, subIndex) {
        if (event?.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            try {
                event.dataTransfer.setData('text/plain', `subprocess:${parentProcess}:${subIndex}`);
            } catch (error) {
                // ignore
            }
        }

        this.dragState = { type: 'subprocess', parentProcess, fromIndex: subIndex };
        card.classList.add('dragging');
    }

    handleDragEnd(card) {
        card.classList.remove('dragging');
        this.dragState = null;
        this.clearSubProcessDropIndicators();
    }

    handleSubProcessCardDragOver(event, card) {
        if (!this.dragState || this.dragState.type !== 'subprocess' || !card) {
            return;
        }

        const targetParent = card.dataset.parentProcess;
        if (!targetParent) {
            return;
        }

        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }

        this.clearSubProcessDropIndicators();

        const rect = card.getBoundingClientRect();
        const midpoint = rect.top + (rect.height / 2);
        const isBefore = event.clientY < midpoint;

        card.classList.toggle('drop-before', isBefore);
        card.classList.toggle('drop-after', !isBefore);
        card.dataset.dropPosition = isBefore ? 'before' : 'after';
    }

    handleSubProcessCardDragLeave(card) {
        if (!card) {
            return;
        }
        card.classList.remove('drop-before', 'drop-after');
        delete card.dataset.dropPosition;
    }

    handleSubProcessCardDrop(event, card) {
        if (!this.dragState || this.dragState.type !== 'subprocess' || !card) {
            return;
        }

        event.preventDefault();

        const targetParent = card.dataset.parentProcess || null;
        if (!targetParent) {
            this.handleSubProcessCardDragLeave(card);
            return;
        }

        const dropPosition = card.dataset.dropPosition === 'after' ? 'after' : 'before';
        const baseIndex = Number(card.dataset.index || 0);
        const insertIndex = dropPosition === 'after' ? baseIndex + 1 : baseIndex;

        this.moveSubProcess(this.dragState.parentProcess, this.dragState.fromIndex, targetParent, insertIndex);

        this.dragState = null;
        this.clearSubProcessDropIndicators();
    }

    clearSubProcessDropIndicators() {
        document.querySelectorAll('.subprocess-card.drop-before, .subprocess-card.drop-after').forEach((element) => {
            element.classList.remove('drop-before', 'drop-after');
            delete element.dataset.dropPosition;
        });
    }

    moveProcess(fromIndex, toIndex) {
        if (!Array.isArray(this.config.processes)) {
            return;
        }
        if (fromIndex === toIndex) {
            return;
        }

        const list = this.config.processes;
        if (fromIndex < 0 || fromIndex >= list.length) {
            return;
        }

        const [item] = list.splice(fromIndex, 1);
        let targetIndex = toIndex;
        if (fromIndex < toIndex) {
            targetIndex -= 1;
        }
        targetIndex = Math.max(0, Math.min(targetIndex, list.length));
        list.splice(targetIndex, 0, item);

        this.saveConfig();
        this.populateSelects();
        this.updateSousProcessusOptions();
        this.rerenderProcessManager();
    }

    moveSubProcess(fromParent, fromIndex, toParent, toIndex) {
        if (!fromParent || fromIndex < 0 || !toParent) {
            return;
        }

        const fromList = this.config.subProcesses?.[fromParent];
        if (!Array.isArray(fromList) || fromIndex >= fromList.length) {
            return;
        }

        const [item] = fromList.splice(fromIndex, 1);
        if (!item) {
            return;
        }

        if (!Array.isArray(this.config.subProcesses[toParent])) {
            this.config.subProcesses[toParent] = [];
        }

        const targetList = this.config.subProcesses[toParent];
        let insertIndex = toIndex;
        if (fromParent === toParent && fromIndex < toIndex) {
            insertIndex -= 1;
        }
        insertIndex = Math.max(0, Math.min(insertIndex, targetList.length));
        targetList.splice(insertIndex, 0, item);

        this.saveConfig();
        this.updateSousProcessusOptions();
        this.rerenderProcessManager();
    }



    configureAccordionItem(item, headerButton, body, initiallyOpen = false) {
        if (!item || !headerButton || !body) {
            return { setOpen: () => {} };
        }

        const findDirectChild = (element, selector) => {
            return Array.from(element.children).find(child => child.matches(selector));
        };

        const closeAccordionItem = (targetItem) => {
            const targetHeader = findDirectChild(targetItem, '.config-accordion-header');
            const targetBody = findDirectChild(targetItem, '.config-accordion-body');

            targetItem.classList.remove('open');
            if (targetHeader) {
                targetHeader.setAttribute('aria-expanded', 'false');
            }
            if (targetBody) {
                targetBody.setAttribute('aria-hidden', 'true');
                targetBody.style.maxHeight = '0px';
            }
        };

        const setState = (open) => {
            if (open) {
                item.classList.add('open');
                headerButton.setAttribute('aria-expanded', 'true');
                body.setAttribute('aria-hidden', 'false');
                body.style.maxHeight = `${body.scrollHeight}px`;
                requestAnimationFrame(() => {
                    this.adjustOpenAccordionBodies(item.closest('.config-accordion') || document);
                });
            } else {
                item.classList.remove('open');
                headerButton.setAttribute('aria-expanded', 'false');
                body.setAttribute('aria-hidden', 'true');
                body.style.maxHeight = '0px';
            }
        };

        headerButton.addEventListener('click', () => {
            const willOpen = !item.classList.contains('open');
            if (willOpen) {
                const parent = item.parentElement;
                if (parent instanceof HTMLElement) {
                    Array.from(parent.children)
                        .filter(child => child !== item && child instanceof HTMLElement && child.classList.contains('config-accordion-item') && child.classList.contains('open'))
                        .forEach(openItem => closeAccordionItem(openItem));
                }
            }
            setState(willOpen);
        });

        headerButton.setAttribute('aria-expanded', 'false');
        body.setAttribute('aria-hidden', 'true');
        body.style.maxHeight = '0px';

        if (initiallyOpen) {
            requestAnimationFrame(() => setState(true));
        }

        return { setOpen: setState };
    }

    adjustOpenAccordionBodies(scope) {
        const root = scope instanceof HTMLElement ? scope : document;
        root.querySelectorAll('.config-accordion-item.open > .config-accordion-body').forEach(body => {
            body.style.maxHeight = `${body.scrollHeight}px`;
        });
    }

    refreshConfigLists() {
        const createListItem = (key, opt, idx) => {
            const listItem = document.createElement('li');
            const isReadOnly = this.readOnlyConfigKeys.has(key);
            if (isReadOnly) {
                listItem.classList.add('config-item-readonly');
            }

            const renderDisplay = () => {
                listItem.innerHTML = '';

                const textSpan = document.createElement('span');
                textSpan.className = 'config-item-text';
                textSpan.textContent = `${opt.label} (${opt.value})`;
                listItem.appendChild(textSpan);

                if (!isReadOnly) {
                    const actions = document.createElement('div');
                    actions.className = 'config-item-actions';

                    if (key === 'tiers') {
                        const upButton = document.createElement('button');
                        upButton.type = 'button';
                        upButton.className = 'btn btn-outline';
                        upButton.textContent = '↑';
                        upButton.title = 'Déplacer vers le haut';
                        upButton.disabled = idx === 0;
                        upButton.addEventListener('click', () => {
                            this.moveConfigOption(key, idx, -1);
                        });

                        const downButton = document.createElement('button');
                        downButton.type = 'button';
                        downButton.className = 'btn btn-outline';
                        downButton.textContent = '↓';
                        downButton.title = 'Déplacer vers le bas';
                        downButton.disabled = idx >= this.config[key].length - 1;
                        downButton.addEventListener('click', () => {
                            this.moveConfigOption(key, idx, 1);
                        });

                        actions.appendChild(upButton);
                        actions.appendChild(downButton);
                    }

                    const editButton = document.createElement('button');
                    editButton.type = 'button';
                    editButton.className = 'btn btn-secondary';
                    editButton.textContent = 'Modifier';
                    editButton.addEventListener('click', () => {
                        renderEditForm();
                    });

                    const removeButton = document.createElement('button');
                    removeButton.type = 'button';
                    removeButton.className = 'btn btn-outline';
                    removeButton.textContent = 'Supprimer';
                    removeButton.addEventListener('click', () => {
                        this.removeConfigOption(key, idx);
                    });

                    actions.appendChild(editButton);
                    actions.appendChild(removeButton);
                    listItem.appendChild(actions);
                }

                this.adjustOpenAccordionBodies();
            };

            const renderEditForm = () => {
                if (isReadOnly) {
                    return;
                }

                listItem.innerHTML = '';

                const form = document.createElement('div');
                form.className = 'config-edit-form';

                const labelInput = document.createElement('input');
                labelInput.type = 'text';
                labelInput.value = opt.label;
                labelInput.placeholder = 'Saisir un libellé';
                labelInput.className = 'config-edit-input config-input-label';

                const valueInput = document.createElement('input');
                valueInput.type = 'text';
                valueInput.value = opt.value;
                valueInput.placeholder = 'Valeur générée automatiquement';
                valueInput.className = 'config-edit-input config-input-value';

                const actions = document.createElement('div');
                actions.className = 'config-item-actions';

                const saveButton = document.createElement('button');
                saveButton.type = 'button';
                saveButton.className = 'btn btn-success';
                saveButton.textContent = 'Enregistrer';
                saveButton.addEventListener('click', () => {
                    const value = valueInput.value.trim();
                    const label = labelInput.value.trim();
                    if (!value || !label) return;
                    this.updateConfigOption(key, idx, { value, label });
                });

                const cancelButton = document.createElement('button');
                cancelButton.type = 'button';
                cancelButton.className = 'btn btn-outline';
                cancelButton.textContent = 'Annuler';
                cancelButton.addEventListener('click', () => {
                    renderDisplay();
                });

                actions.appendChild(saveButton);
                actions.appendChild(cancelButton);

                form.appendChild(labelInput);
                form.appendChild(valueInput);
                form.appendChild(actions);
                this.setupAutoValueSync(labelInput, valueInput);
                listItem.appendChild(form);

                this.adjustOpenAccordionBodies();
            };

            renderDisplay();
            return listItem;
        };

        const updateList = (key) => {
            const list = document.getElementById(`list-${key}`);
            if (!list) return;
            list.innerHTML = '';
            this.config[key].forEach((opt, idx) => {
                const item = createListItem(key, opt, idx);
                list.appendChild(item);
            });
        };

        Object.keys(this.config)
            .filter(k => k !== 'subProcesses' && k !== 'interviewTemplates')
            .forEach(updateList);

        this.adjustOpenAccordionBodies();
    }

    moveConfigOption(key, index, direction) {
        if (this.readOnlyConfigKeys.has(key)) {
            return;
        }
        if (!Array.isArray(this.config[key])) {
            return;
        }
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= this.config[key].length) {
            return;
        }
        const [moved] = this.config[key].splice(index, 1);
        this.config[key].splice(targetIndex, 0, moved);
        this.saveConfig();
        this.populateSelects();
        this.refreshConfigLists();
    }

    updateConfigOption(key, index, updated) {
        if (this.readOnlyConfigKeys.has(key)) {
            return;
        }
        if (key === 'interviewTemplates') {
            return;
        }
        if (!this.config[key] || !this.config[key][index]) return;
        const { value, label } = updated;
        if (!value || !label) return;

        const previous = this.config[key][index];
        const referents = Array.isArray(previous?.referents)
            ? previous.referents.filter(ref => typeof ref === 'string' && ref.trim())
            : [];
        this.config[key][index] = { value, label, referents };

        if (key === 'processes') {
            if (previous.value !== value) {
                const previousSubs = this.config.subProcesses[previous.value] || [];
                const targetSubs = this.config.subProcesses[value] || [];
                const mergedSubs = [...targetSubs];
                previousSubs.forEach(sub => {
                    if (!mergedSubs.some(existing => existing.value === sub.value)) {
                        mergedSubs.push(sub);
                    }
                });
                this.config.subProcesses[value] = mergedSubs;
                delete this.config.subProcesses[previous.value];

                if (this.collapsedProcesses instanceof Set) {
                    if (this.collapsedProcesses.has(previous.value)) {
                        this.collapsedProcesses.delete(previous.value);
                        this.collapsedProcesses.add(value);
                    }
                }

                if (this.filters.process === previous.value) {
                    this.filters.process = value;
                }

                this.risks.forEach(risk => {
                    if (risk.processus === previous.value) {
                        risk.processus = value;
                        const availableSubs = this.config.subProcesses[value] || [];
                        if (!availableSubs.some(sub => sub.value === risk.sousProcessus)) {
                            risk.sousProcessus = '';
                        }
                    }
                    if (Array.isArray(risk.processusAssocies) && risk.processusAssocies.length) {
                        risk.processusAssocies = risk.processusAssocies.map(item => item === previous.value ? value : item);
                        risk.processus = risk.processusAssocies[0] || '';
                    }
                });
                this.saveData();
            }
            this.saveConfig();
            this.populateSelects();
            this.renderAll();
        } else {
            this.saveConfig();
            this.populateSelects();
            this.refreshConfigLists();
        }
    }

    addConfigOption(key) {
        if (this.readOnlyConfigKeys.has(key)) {
            return;
        }
        if (key === 'interviewTemplates') {
            return;
        }
        const valueInput = document.getElementById(`input-${key}-value`);
        const labelInput = document.getElementById(`input-${key}-label`);
        if (!valueInput || !labelInput) return;
        const value = valueInput.value.trim();
        const label = labelInput.value.trim();
        if (!value || !label) return;
        const entry = { value, label, referents: [] };
        this.config[key].push(entry);
        if (key === 'processes') {
            this.setProcessCollapsed(value, true);
            this.config.subProcesses[value] = [];
            this.saveConfig();
            this.populateSelects();
            this.renderConfiguration();
        } else {
            this.saveConfig();
            this.populateSelects();
            this.refreshConfigLists();
        }
        valueInput.value = '';
        labelInput.value = '';
    }

    removeConfigOption(key, index) {
        if (this.readOnlyConfigKeys.has(key)) {
            return;
        }
        if (key === 'interviewTemplates') {
            return;
        }
        if (key === 'processes') {
            const removed = this.config.processes.splice(index, 1)[0];
            delete this.config.subProcesses[removed.value];
            this.saveConfig();
            this.populateSelects();
            this.renderConfiguration();
        } else {
            this.config[key].splice(index, 1);
            this.saveConfig();
            this.populateSelects();
            this.refreshConfigLists();
        }
    }

    renderSubProcessConfig() {
        const container = document.getElementById('subProcessConfig');
        if (!container) return;

        container.innerHTML = '';

        if (!this.config.processes.length) {
            const empty = document.createElement('p');
            empty.className = 'config-empty';
            empty.textContent = 'Ajoutez un processus pour configurer ses sous-processus.';
            container.appendChild(empty);
            this.adjustOpenAccordionBodies(container);
            return;
        }

        const subAccordion = document.createElement('div');
        subAccordion.className = 'config-accordion config-accordion-nested';
        container.appendChild(subAccordion);

        this.config.processes.forEach((proc, index) => {
            const procId = sanitizeId(proc.value);

            const item = document.createElement('div');
            item.className = 'config-accordion-item';

            const headerButton = document.createElement('button');
            headerButton.type = 'button';
            headerButton.className = 'config-accordion-header';
            headerButton.id = `subprocess-accordion-${procId}-header`;
            headerButton.innerHTML = `
                <span class="config-accordion-title">${proc.label}</span>
                <span class="config-accordion-icon" aria-hidden="true"></span>
            `;

            const body = document.createElement('div');
            body.className = 'config-accordion-body';
            body.id = `subprocess-accordion-${procId}-panel`;
            body.setAttribute('aria-labelledby', headerButton.id);
            body.setAttribute('role', 'region');
            headerButton.setAttribute('aria-controls', body.id);

            const list = document.createElement('ul');
            list.id = `list-sub-${procId}`;
            list.className = 'config-list';

            const addContainer = document.createElement('div');
            addContainer.className = 'config-add';

            const labelInput = document.createElement('input');
            labelInput.type = 'text';
            labelInput.id = `input-sub-${procId}-label`;
            labelInput.placeholder = 'Saisir un libellé';
            labelInput.classList.add('config-input-label');

            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.id = `input-sub-${procId}-value`;
            valueInput.placeholder = 'Valeur générée automatiquement';
            valueInput.classList.add('config-input-value');

            const addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.textContent = 'Ajouter';
            addButton.dataset.process = proc.value;
            addButton.addEventListener('click', (event) => {
                const { process } = event.currentTarget.dataset;
                if (typeof process !== 'undefined') {
                    this.addSubProcess(process);
                }
            });

            addContainer.appendChild(labelInput);
            addContainer.appendChild(valueInput);
            addContainer.appendChild(addButton);

            body.appendChild(list);
            body.appendChild(addContainer);

            item.appendChild(headerButton);
            item.appendChild(body);
            subAccordion.appendChild(item);

            this.configureAccordionItem(item, headerButton, body, index === 0);
            this.setupAutoValueSync(labelInput, valueInput);
        });

        this.refreshSubProcessLists();
        this.adjustOpenAccordionBodies(container);
    }

    refreshSubProcessLists() {
        this.config.processes.forEach(proc => {
            const procId = sanitizeId(proc.value);
            const list = document.getElementById(`list-sub-${procId}`);
            if (!list) return;
            const subs = this.config.subProcesses[proc.value] || [];
            list.innerHTML = '';
            subs.forEach((sp, idx) => {
                const listItem = document.createElement('li');

                const renderDisplay = () => {
                    listItem.innerHTML = '';

                    const textSpan = document.createElement('span');
                    textSpan.className = 'config-item-text';
                    textSpan.textContent = `${sp.label} (${sp.value})`;
                    listItem.appendChild(textSpan);

                    const actions = document.createElement('div');
                    actions.className = 'config-item-actions';

                    const editButton = document.createElement('button');
                    editButton.type = 'button';
                    editButton.className = 'btn btn-secondary';
                    editButton.textContent = 'Modifier';
                    editButton.addEventListener('click', () => {
                        renderEditForm();
                    });

                    const removeButton = document.createElement('button');
                    removeButton.type = 'button';
                    removeButton.className = 'btn btn-outline';
                    removeButton.textContent = 'Supprimer';
                    removeButton.addEventListener('click', () => {
                        this.removeSubProcess(proc.value, idx);
                    });

                    actions.appendChild(editButton);
                    actions.appendChild(removeButton);
                    listItem.appendChild(actions);

                    this.adjustOpenAccordionBodies();
                };

                const renderEditForm = () => {
                    listItem.innerHTML = '';

                    const form = document.createElement('div');
                    form.className = 'config-edit-form';

                    const labelInput = document.createElement('input');
                    labelInput.type = 'text';
                    labelInput.value = sp.label;
                    labelInput.placeholder = 'Saisir un libellé';
                    labelInput.className = 'config-edit-input config-input-label';

                    const valueInput = document.createElement('input');
                    valueInput.type = 'text';
                    valueInput.value = sp.value;
                    valueInput.placeholder = 'Valeur générée automatiquement';
                    valueInput.className = 'config-edit-input config-input-value';

                    const actions = document.createElement('div');
                    actions.className = 'config-item-actions';

                    const saveButton = document.createElement('button');
                    saveButton.type = 'button';
                    saveButton.className = 'btn btn-success';
                    saveButton.textContent = 'Enregistrer';
                    saveButton.addEventListener('click', () => {
                        const value = valueInput.value.trim();
                        const label = labelInput.value.trim();
                        if (!value || !label) return;
                        this.updateSubProcess(proc.value, idx, { value, label });
                    });

                    const cancelButton = document.createElement('button');
                    cancelButton.type = 'button';
                    cancelButton.className = 'btn btn-outline';
                    cancelButton.textContent = 'Annuler';
                    cancelButton.addEventListener('click', () => {
                        renderDisplay();
                    });

                    actions.appendChild(saveButton);
                    actions.appendChild(cancelButton);

                    form.appendChild(labelInput);
                    form.appendChild(valueInput);
                    form.appendChild(actions);
                    this.setupAutoValueSync(labelInput, valueInput);
                    listItem.appendChild(form);

                    this.adjustOpenAccordionBodies();
                };

                renderDisplay();
                list.appendChild(listItem);
            });
        });

        this.adjustOpenAccordionBodies();
    }

    updateSubProcess(process, index, updated) {
        if (!this.config.subProcesses[process] || !this.config.subProcesses[process][index]) return;
        const { value, label } = updated;
        if (!value || !label) return;

        const previous = this.config.subProcesses[process][index];
        const referents = Array.isArray(previous?.referents)
            ? previous.referents.filter(ref => typeof ref === 'string' && ref.trim())
            : [];
        this.config.subProcesses[process][index] = { value, label, referents };

        if (previous.value !== value) {
            this.risks.forEach(risk => {
                if (risk.processus === process && risk.sousProcessus === previous.value) {
                    risk.sousProcessus = value;
                }
                if (Array.isArray(risk.sousProcessusAssocies) && risk.sousProcessusAssocies.length) {
                    risk.sousProcessusAssocies = risk.sousProcessusAssocies.map(item => item === previous.value ? value : item);
                    if (risk.sousProcessusAssocies[0] !== undefined) {
                        risk.sousProcessus = risk.sousProcessusAssocies[0] || '';
                    }
                }
            });
            this.saveData();
        }

        this.saveConfig();
        this.updateSousProcessusOptions();
        this.refreshSubProcessLists();
        this.updateRisksList();
    }

    addSubProcess(process) {
        const procId = sanitizeId(process);
        const valueInput = document.getElementById(`input-sub-${procId}-value`);
        const labelInput = document.getElementById(`input-sub-${procId}-label`);
        if (!valueInput || !labelInput) return;
        const value = valueInput.value.trim();
        const label = labelInput.value.trim();
        if (!value || !label) return;
        if (!this.config.subProcesses || typeof this.config.subProcesses !== 'object' || Array.isArray(this.config.subProcesses)) {
            this.config.subProcesses = {};
        }
        this.config.subProcesses[process] = this.config.subProcesses[process] || [];
        this.config.subProcesses[process].push({ value, label, referents: [] });
        this.saveConfig();
        this.updateSousProcessusOptions();
        this.refreshSubProcessLists();
        valueInput.value = '';
        labelInput.value = '';
    }

    removeSubProcess(process, index) {
        if (!this.config.subProcesses[process]) return;
        this.config.subProcesses[process].splice(index, 1);
        this.saveConfig();
        this.updateSousProcessusOptions();
        this.refreshSubProcessLists();
    }

    updateSousProcessusOptions() {
        const processSelect = document.getElementById('processus');
        const sousSelect = document.getElementById('sousProcessus');
        if (!processSelect || !sousSelect) return;
        const currentValues = Array.from(sousSelect.selectedOptions || []).map(option => option.value);
        const selectedProcesses = Array.from(processSelect.selectedOptions || []).map(option => option.value);
        const selectedSet = new Set(selectedProcesses);
        sousSelect.innerHTML = '';
        const seenSubs = new Set();
        selectedSet.forEach(proc => {
            const items = Array.isArray(this.config?.subProcesses?.[proc]) ? this.config.subProcesses[proc] : [];
            items.forEach(sp => {
                if (!sp || !sp.value || seenSubs.has(sp.value)) {
                    return;
                }
                seenSubs.add(sp.value);
                const opt = document.createElement('option');
                opt.value = sp.value;
                opt.textContent = sp.label;
                opt.selected = currentValues.includes(sp.value);
                sousSelect.appendChild(opt);
            });
        });
        if (typeof renderRiskMultiSelectChips === 'function') {
            renderRiskMultiSelectChips('sousProcessus');
        }
    }

    getProcessLabel(processValue) {
        const raw = processValue == null ? '' : String(processValue).trim();
        if (!raw) {
            return '';
        }
        const match = Array.isArray(this.config?.processes)
            ? this.config.processes.find(entry => String(entry?.value || '').trim() === raw)
            : null;
        return match?.label || raw;
    }

    getSubProcessLabel(processValue, subProcessValue) {
        const raw = subProcessValue == null ? '' : String(subProcessValue).trim();
        if (!raw) {
            return '';
        }
        const processRaw = processValue == null ? '' : String(processValue).trim();
        const scopedList = processRaw && Array.isArray(this.config?.subProcesses?.[processRaw])
            ? this.config.subProcesses[processRaw]
            : [];
        const scopedMatch = scopedList.find(entry => String(entry?.value || '').trim() === raw);
        if (scopedMatch?.label) {
            return scopedMatch.label;
        }

        if (this.config?.subProcesses && typeof this.config.subProcesses === 'object') {
            const allLists = Object.values(this.config.subProcesses).filter(Array.isArray);
            for (let index = 0; index < allLists.length; index += 1) {
                const match = allLists[index].find(entry => String(entry?.value || '').trim() === raw);
                if (match?.label) {
                    return match.label;
                }
            }
        }

        return raw;
    }

    getTierLabel(tierValue) {
        const raw = tierValue == null ? '' : String(tierValue).trim();
        if (!raw) {
            return '';
        }
        const match = Array.isArray(this.config?.tiers)
            ? this.config.tiers.find(entry => String(entry?.value || '').trim() === raw)
            : null;
        return match?.label || raw;
    }

    getInterviewFilePath(fileName) {
        const base = typeof this.interviewFolder === 'string' && this.interviewFolder.trim()
            ? this.interviewFolder.trim()
            : '';
        if (!base) {
            return fileName;
        }
        return `${base.replace(/\/$/, '')}/${fileName}`;
    }

    setInterviewLoading(isLoading) {
        if (typeof document === 'undefined') {
            return;
        }

        const loading = document.getElementById('interviewLoading');
        if (!loading) {
            return;
        }

        loading.hidden = !isLoading;
    }

    async loadInterviewFiles() {
        if (typeof fetch === 'undefined' || typeof document === 'undefined') {
            return false;
        }

        this.setInterviewLoading(true);
        this.interviewLoadFailed = false;

        const loadedInterviews = [];
        let maxIndexFound = 0;
        let maxJsonIndexFound = 0;
        let index = 1;
        let missingCount = 0;
        const maxMissing = 5;

        try {
            while (missingCount < maxMissing) {
                const result = await this.fetchInterviewFile(index);
                if (result && result.interview) {
                    const interview = result.interview;
                    if (result.isJson) {
                        maxJsonIndexFound = Math.max(maxJsonIndexFound, index);
                    }
                    maxIndexFound = Math.max(maxIndexFound, index);
                    const withIndex = {
                        ...interview,
                        fileIndex: this.getInterviewFileIndex(interview) || index,
                        fileName: result.fileName || interview.fileName
                    };
                    const normalized = this.normalizeInterview(withIndex);
                    if (normalized) {
                        loadedInterviews.push(normalized);
                    }
                    missingCount = 0;
                } else {
                    missingCount += 1;
                }
                index += 1;
            }

            if (!loadedInterviews.length) {
                this.interviewLoadFailed = true;
                return false;
            }

            this.interviews = loadedInterviews;
            this.interviewFileCount = maxIndexFound;
            this.interviewJsonCount = maxJsonIndexFound;
            return true;
        } finally {
            this.setInterviewLoading(false);
        }
    }

    reloadInterviewFiles() {
        if (this.interviewReloadPromise) {
            return this.interviewReloadPromise;
        }

        this.interviewReloadPromise = this.loadInterviewFiles()
            .then((hasUpdates) => {
                if (hasUpdates) {
                    this.populateSelects();
                    this.updateInterviewsList();
                }
                return hasUpdates;
            })
            .finally(() => {
                this.interviewReloadPromise = null;
            });

        return this.interviewReloadPromise;
    }

    supportsInterviewFolderPicker() {
        if (typeof document === 'undefined') {
            return false;
        }
        const input = document.createElement('input');
        return 'webkitdirectory' in input;
    }

    openInterviewFolderPicker() {
        if (typeof document === 'undefined') {
            return;
        }

        if (!this.supportsInterviewFolderPicker()) {
            alert('Your browser cannot select a full folder. Please use a compatible browser.');
            return;
        }

        if (!this.interviewFolderPicker) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.js,.json,application/javascript,application/json';
            input.multiple = true;
            input.setAttribute('webkitdirectory', '');
            input.setAttribute('directory', '');
            input.style.display = 'none';
            input.addEventListener('change', () => {
                this.handleInterviewFolderSelection(input.files);
            });
            document.body.appendChild(input);
            this.interviewFolderPicker = input;
        }

        this.interviewFolderPicker.value = '';
        this.interviewFolderPicker.click();
    }

    async readInterviewFile(file) {
        if (!file) {
            return null;
        }
        if (typeof file.text === 'function') {
            return file.text();
        }
        if (typeof FileReader === 'undefined') {
            return null;
        }

        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result || '');
            reader.onerror = () => resolve('');
            reader.readAsText(file);
        });
    }

    async handleInterviewFolderSelection(fileList) {
        if (!fileList || !fileList.length) {
            return;
        }

        const files = Array.from(fileList)
            .filter(file => file && typeof file.name === 'string' && /interview\d+\.(json|js)$/i.test(file.name));

        if (!files.length) {
            alert('No interviewX.js or interviewX.json file found in the selected folder.');
            return;
        }

        const loadedInterviews = [];
        let maxIndexFound = 0;
        let maxJsonIndexFound = 0;

        for (const file of files) {
            const content = await this.readInterviewFile(file);
            if (!content) {
                continue;
            }
            try {
                const interview = this.extractInterviewPayloadFromText(content, file.name);
                if (!interview) {
                    continue;
                }
                const fileIndex = this.getInterviewFileIndex({ fileName: file.name });
                const withIndex = {
                    ...interview,
                    fileIndex: this.getInterviewFileIndex(interview) || fileIndex,
                    fileName: interview.fileName || file.name
                };
                const normalized = this.normalizeInterview(withIndex);
                if (normalized) {
                    loadedInterviews.push(normalized);
                    if (fileIndex) {
                        maxIndexFound = Math.max(maxIndexFound, fileIndex);
                        if (/\.json$/i.test(file.name)) {
                            maxJsonIndexFound = Math.max(maxJsonIndexFound, fileIndex);
                        }
                    }
                }
            } catch (error) {
                // Ignore malformed files
            }
        }

        if (!loadedInterviews.length) {
            alert('Detected files do not contain valid interview reports.');
            return;
        }

        this.interviews = loadedInterviews;
        this.interviewFileCount = maxIndexFound;
        this.interviewJsonCount = maxJsonIndexFound;
        this.interviewLoadFailed = false;
        this.updateInterviewsList();

        if (typeof showNotification === 'function') {
            showNotification('success', 'Interviews loaded from the selected folder.');
        }
    }

    async fetchInterviewFile(index) {
        const baseName = `interview${index}`;
        const registeredInterview = this.getRegisteredInterviewPayload(baseName);
        if (registeredInterview) {
            return { interview: registeredInterview, fileName: `${baseName}.js`, isJson: false };
        }

        const jsInterview = await this.fetchInterviewScript(baseName);
        if (jsInterview) {
            return { interview: jsInterview, fileName: `${baseName}.js`, isJson: false };
        }

        const jsonInterview = await this.fetchInterviewJson(`${baseName}.json`);
        if (jsonInterview) {
            return { interview: jsonInterview, fileName: `${baseName}.json`, isJson: true };
        }
        return null;
    }

    getRegisteredInterviewPayload(baseName) {
        const registry = typeof window !== 'undefined' ? window.RMS_INTERVIEW_FILES : null;
        if (!registry || typeof registry !== 'object') {
            return null;
        }
        return registry[baseName] || null;
    }

    fetchInterviewScript(baseName) {
        if (typeof document === 'undefined') {
            return Promise.resolve(null);
        }

        const existing = this.getRegisteredInterviewPayload(baseName);
        if (existing) {
            return Promise.resolve(existing);
        }

        return new Promise(resolve => {
            const script = document.createElement('script');
            script.src = this.getInterviewFilePath(`${baseName}.js`);
            script.async = false;
            script.onload = () => resolve(this.getRegisteredInterviewPayload(baseName));
            script.onerror = () => resolve(null);
            document.head.appendChild(script);
        });
    }

    extractInterviewPayloadFromText(content, fileName = '') {
        if (!content) {
            return null;
        }

        const trimmed = String(content).trim();
        if (/\.js$/i.test(fileName)) {
            const match = trimmed.match(/=\s*({[\s\S]*})\s*;?\s*$/);
            if (!match) {
                return null;
            }
            try {
                return this.extractInterviewPayload(JSON.parse(match[1]));
            } catch (error) {
                return null;
            }
        }

        try {
            return this.extractInterviewPayload(JSON.parse(trimmed));
        } catch (error) {
            return null;
        }
    }

    async fetchInterviewJson(path) {
        const targetPath = this.getInterviewFilePath(path);
        try {
            const response = await fetch(targetPath, { cache: 'no-store' });
            if (!response.ok) {
                return this.fetchInterviewJsonViaXhr(targetPath);
            }
            const data = await response.json();
            return this.extractInterviewPayload(data);
        } catch (error) {
            return this.fetchInterviewJsonViaXhr(targetPath);
        }
    }

    extractInterviewPayload(data) {
        if (!data) {
            return null;
        }
        if (typeof data === 'object' && data.interview) {
            return data.interview;
        }
        return data;
    }

    fetchInterviewJsonViaXhr(path) {
        if (typeof XMLHttpRequest === 'undefined') {
            return Promise.resolve(null);
        }

        return new Promise(resolve => {
            const request = new XMLHttpRequest();
            request.open('GET', path, true);
            request.overrideMimeType('application/json');
            request.onreadystatechange = () => {
                if (request.readyState !== 4) {
                    return;
                }
                if (request.status && request.status !== 200) {
                    resolve(null);
                    return;
                }
                const text = request.responseText;
                if (!text) {
                    resolve(null);
                    return;
                }
                try {
                    const data = JSON.parse(text);
                    resolve(this.extractInterviewPayload(data));
                } catch (parseError) {
                    resolve(null);
                }
            };
            request.onerror = () => resolve(null);
            request.send();
        });
    }

    getInterviewFileIndex(interview) {
        if (!interview) {
            return null;
        }
        const rawIndex = interview.fileIndex ?? interview.storageIndex ?? interview.fileId;
        const parsed = Number.parseInt(rawIndex, 10);
        if (!Number.isNaN(parsed) && parsed > 0) {
            return parsed;
        }
        const fileName = typeof interview.fileName === 'string' ? interview.fileName : '';
        const match = fileName.match(/interview(\d+)\./i);
        if (match) {
            const fileIndex = Number.parseInt(match[1], 10);
            if (!Number.isNaN(fileIndex) && fileIndex > 0) {
                return fileIndex;
            }
        }
        return null;
    }

    getNextInterviewFileIndex() {
        const usedIndexes = (Array.isArray(this.interviews) ? this.interviews : [])
            .map(interview => this.getInterviewFileIndex(interview))
            .filter(index => Number.isInteger(index));
        const maxCount = Math.max(
            ...usedIndexes,
            this.interviewFileCount || 0,
            this.interviewJsonCount || 0
        );
        const candidate = Number.isInteger(maxCount) && maxCount > 0 ? maxCount + 1 : 1;
        return candidate;
    }

    getInterviewFileName(interview, format = 'json') {
        const existingName = typeof interview?.fileName === 'string' && interview.fileName.trim()
            ? interview.fileName.trim()
            : '';
        if (existingName) {
            return existingName;
        }
        const fileIndex = this.getInterviewFileIndex(interview) || this.getNextInterviewFileIndex();
        const extension = format === 'js' ? 'js' : 'json';
        return `interview${fileIndex}.${extension}`;
    }

    getInterviewFileFormat(interview, fallback = 'json') {
        const fileName = typeof interview?.fileName === 'string' ? interview.fileName : '';
        if (fileName.endsWith('.js')) {
            return 'js';
        }
        if (fileName.endsWith('.json')) {
            return 'json';
        }
        return fallback;
    }

    saveInterviewFile(interview, format = 'js') {
        if (!interview) {
            return;
        }

        const resolvedFormat = this.getInterviewFileFormat(interview, format);
        const fileIndex = this.getInterviewFileIndex(interview) || this.getNextInterviewFileIndex();
        const fileName = this.getInterviewFileName({ ...interview, fileIndex }, resolvedFormat);
        const payload = {
            ...interview,
            fileIndex,
            fileName
        };
        this.interviewFileCount = Math.max(this.interviewFileCount || 0, fileIndex);
        if (resolvedFormat === 'json') {
            this.interviewJsonCount = Math.max(this.interviewJsonCount || 0, fileIndex);
        }

        if (resolvedFormat === 'js') {
            const json = JSON.stringify(payload);
            const fileContent = `window.RMS_INTERVIEW_FILES = window.RMS_INTERVIEW_FILES || {};\n` +
                `window.RMS_INTERVIEW_FILES['interview${fileIndex}'] = ${json};\n`;
            const blob = new Blob([fileContent], { type: 'application/javascript;charset=utf-8' });
            if (typeof triggerBlobDownload === 'function') {
                triggerBlobDownload(blob, fileName);
            }
            return;
        }

        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        if (typeof triggerBlobDownload === 'function') {
            triggerBlobDownload(blob, fileName);
        }
    }

    downloadInterviewJson(interview) {
        if (!interview) {
            return;
        }
        const fileIndex = this.getInterviewFileIndex(interview) || this.getNextInterviewFileIndex();
        const fileName = `interview${fileIndex}.json`;
        const payload = {
            ...interview,
            fileIndex,
            fileName
        };
        this.interviewFileCount = Math.max(this.interviewFileCount || 0, fileIndex);
        this.interviewJsonCount = Math.max(this.interviewJsonCount || 0, fileIndex);
        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        if (typeof triggerBlobDownload === 'function') {
            triggerBlobDownload(blob, fileName);
        }
    }

    downloadInterviewFile(interviewId, format = 'js') {
        if (!Array.isArray(this.interviews)) {
            return;
        }
        const interview = this.interviews.find(entry => idsEqual(entry?.id, interviewId));
        if (!interview) {
            alert('Interview report not found.');
            return;
        }
        this.saveInterviewFile(interview, format);
        if (typeof showNotification === 'function') {
            showNotification('success', `Fichier interview${this.getInterviewFileIndex(interview) || ''} téléchargé.`);
        }
    }

    // Data persistence
    saveData() {
        if (!RMS_LOCAL_STORAGE_ENABLED || typeof localStorage === 'undefined') {
            return;
        }

        localStorage.setItem('rms_risks', JSON.stringify(this.risks));
        localStorage.setItem('rms_controls', JSON.stringify(this.controls));
        localStorage.setItem('rms_actionPlans', JSON.stringify(this.actionPlans));
        localStorage.setItem('rms_history', JSON.stringify(this.history));
        this.updateLastSaveTime();
    }

    loadData(key) {
        if (!RMS_LOCAL_STORAGE_ENABLED || typeof localStorage === 'undefined') {
            return null;
        }

        const storageKey = `rms_${key}`;
        const data = localStorage.getItem(storageKey);
        if (!data) {
            return null;
        }

        try {
            return JSON.parse(data);
        } catch (error) {
            console.warn(`Données locales invalides pour ${storageKey} : réinitialisation`, error);
            try {
                localStorage.removeItem(storageKey);
            } catch (cleanupError) {
                console.warn(`Impossible de supprimer la clé ${storageKey} corrompue`, cleanupError);
            }
            return null;
        }
    }

    markUnsavedChange(context = 'global') {
        if (!(this.unsavedContexts instanceof Set)) {
            this.unsavedContexts = new Set();
        }

        const key = typeof context === 'string' && context.trim() ? context.trim() : 'global';
        this.unsavedContexts.add(key);
        this.hasUnsavedChanges = this.unsavedContexts.size > 0;
    }

    clearUnsavedChanges(context = null) {
        if (!(this.unsavedContexts instanceof Set)) {
            this.unsavedContexts = new Set();
        }

        if (typeof context === 'string' && context.trim()) {
            this.unsavedContexts.delete(context.trim());
        } else {
            this.unsavedContexts.clear();
        }

        this.hasUnsavedChanges = this.unsavedContexts.size > 0;
    }

    hasUnsavedContext(context) {
        if (!(this.unsavedContexts instanceof Set)) {
            this.unsavedContexts = new Set();
        }

        if (typeof context === 'string' && context.trim()) {
            return this.unsavedContexts.has(context.trim());
        }

        return this.unsavedContexts.size > 0;
    }

    updateLastSaveTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const lastSaveElement = document.getElementById('lastSaveTime');
        if (lastSaveElement) {
            lastSaveElement.textContent = timeStr;
        }
    }

    // Matrix functions
    initializeMatrix() {
        const brutGrid = document.getElementById('matrixGridBrut');
        if (brutGrid) {
            brutGrid.innerHTML = '';
            brutGrid.classList.remove('net-grid');
            for (let impact = 4; impact >= 1; impact--) {
                for (let prob = 1; prob <= 4; prob++) {
                    const cell = document.createElement('div');
                    cell.className = 'matrix-cell';
                    cell.dataset.probability = prob;
                    cell.dataset.impact = impact;

                    const riskLevel = prob * impact;
                    if (riskLevel < 3) cell.classList.add('level-1');
                    else if (riskLevel < 6) cell.classList.add('level-2');
                    else if (riskLevel < 12) cell.classList.add('level-3');
                    else cell.classList.add('level-4');

                    brutGrid.appendChild(cell);
                }
            }
        }

        const netGrid = document.getElementById('matrixGridNet');
        if (netGrid) {
            netGrid.innerHTML = '';
            netGrid.classList.add('net-grid');

            const mitigationOptions = typeof getMitigationEffectivenessOptions === 'function'
                ? getMitigationEffectivenessOptions()
                : [
                    { value: 'efficace', label: 'Efficace', coefficient: 0.25 },
                    { value: 'ameliorable', label: 'Améliorable', coefficient: 0.5 },
                    { value: 'insuffisant', label: 'Insuffisant', coefficient: 0.75 },
                    { value: 'inefficace', label: 'Inefficace', coefficient: 1 }
                ];

            const brutLevels = [
                { value: 'critique', label: 'Critical Risk', min: 12, max: 16 },
                { value: 'fort', label: 'High Risk', min: 6, max: 12 },
                { value: 'modere', label: 'Moderate Risk', min: 3, max: 6 },
                { value: 'faible', label: 'Low Risk', min: 0, max: 3 }
            ];

            const severityStops = [
                { min: 0, max: 3, className: 'level-1' },
                { min: 3, max: 6, className: 'level-2' },
                { min: 6, max: 12, className: 'level-3' },
                { min: 12, max: Infinity, className: 'level-4' }
            ];

            const getSeverityClassFromScore = (score) => {
                const value = Number.isFinite(score) ? score : 0;
                const match = severityStops.find(stop => value >= stop.min && value < stop.max);
                return match?.className || 'level-1';
            };

            const subCellCount = 2;
            const strictGrossScoresByLevel = {
                critique: [16, 12],
                fort: [9, 8, 6],
                modere: [4, 3],
                faible: [2, 1]
            };
            brutLevels.forEach(level => {
                const representativeScores = Array.isArray(strictGrossScoresByLevel[level.value]) && strictGrossScoresByLevel[level.value].length
                    ? strictGrossScoresByLevel[level.value]
                    : [level.max];

                representativeScores.forEach((grossScore, subRow) => {
                    mitigationOptions.forEach((option) => {
                        const coefficient = Number(option.coefficient) || 1;
                        const remainingFactor = Math.min(Math.max(coefficient, 0.25), 1);
                        const netScore = grossScore * remainingFactor;

                        for (let subCol = 0; subCol < subCellCount; subCol++) {
                            const cell = document.createElement('div');
                            cell.className = 'matrix-cell';
                            cell.dataset.brutLevel = level.value;
                            cell.dataset.grossScore = String(grossScore);
                            cell.dataset.effectiveness = option.value;
                            cell.dataset.subRow = String(subRow);
                            cell.dataset.subCol = String(subCol);

                            const primaryLevel = getSeverityClassFromScore(netScore);
                            cell.classList.add(primaryLevel);

                            if (subCol === 0) cell.classList.add('merged-right');
                            if (subCol === 1) cell.classList.add('merged-left');

                            netGrid.appendChild(cell);
                        }
                    });
                });
            });
            const colLabels = document.getElementById('matrixNetColLabels');
            if (colLabels) {
                colLabels.innerHTML = '';
                colLabels.style.display = 'none';
            }
        }


        const postGrid = document.getElementById('matrixGridPost');
        if (postGrid) {
            postGrid.innerHTML = netGrid ? netGrid.innerHTML : '';
            postGrid.classList.add('net-grid');
            if (!netGrid) {
                const mitigationOptions = typeof getMitigationEffectivenessOptions === 'function'
                    ? getMitigationEffectivenessOptions()
                    : [
                        { value: 'efficace', label: 'Efficace', coefficient: 0.25 },
                        { value: 'ameliorable', label: 'Améliorable', coefficient: 0.5 },
                        { value: 'insuffisant', label: 'Insuffisant', coefficient: 0.75 },
                        { value: 'inefficace', label: 'Inefficace', coefficient: 1 }
                    ];
                const brutLevels = [
                    { value: 'critique', label: 'Critical Risk', min: 12, max: 16 },
                    { value: 'fort', label: 'High Risk', min: 6, max: 12 },
                    { value: 'modere', label: 'Moderate Risk', min: 3, max: 6 },
                    { value: 'faible', label: 'Low Risk', min: 0, max: 3 }
                ];
                const severityStops = [
                    { min: 0, max: 3, className: 'level-1' },
                    { min: 3, max: 6, className: 'level-2' },
                    { min: 6, max: 12, className: 'level-3' },
                    { min: 12, max: Infinity, className: 'level-4' }
                ];
                const getSeverityClassFromScore = (score) => {
                    const value = Number.isFinite(score) ? score : 0;
                    const match = severityStops.find(stop => value >= stop.min && value < stop.max);
                    return match?.className || 'level-1';
                };
                const strictGrossScoresByLevel = { critique: [16, 12], fort: [9, 8, 6], modere: [4, 3], faible: [2, 1] };
                brutLevels.forEach(level => {
                    const representativeScores = strictGrossScoresByLevel[level.value] || [level.max];
                    representativeScores.forEach((grossScore, subRow) => {
                        mitigationOptions.forEach((option) => {
                            const coefficient = Number(option.coefficient) || 1;
                            const netScore = grossScore * Math.min(Math.max(coefficient, 0.25), 1);
                            for (let subCol = 0; subCol < 2; subCol++) {
                                const cell = document.createElement('div');
                                cell.className = 'matrix-cell';
                                cell.dataset.brutLevel = level.value;
                                cell.dataset.grossScore = String(grossScore);
                                cell.dataset.effectiveness = option.value;
                                cell.dataset.subRow = String(subRow);
                                cell.dataset.subCol = String(subCol);
                                cell.classList.add(getSeverityClassFromScore(netScore));
                                if (subCol === 0) cell.classList.add('merged-right');
                                if (subCol === 1) cell.classList.add('merged-left');
                                postGrid.appendChild(cell);
                            }
                        });
                    });
                });
            }
            const colLabels = document.getElementById('matrixPostColLabels');
            if (colLabels) {
                colLabels.innerHTML = '';
                colLabels.style.display = 'none';
            }
        }

        this.renderRiskThemeLegend();
        this.renderRiskPoints();
        this.updateRiskDetailsList();

        const activeView = ['brut', 'net', 'post'].includes(this.currentView) ? this.currentView : 'brut';
        document.querySelectorAll('.matrix-container[data-view]').forEach(container => {
            const isActive = container.dataset.view === activeView;
            container.classList.toggle('active-view', isActive);
        });
    }


    renderRiskThemeLegend() {
        const container = document.getElementById('riskThemeLegendItems');
        if (!container) {
            return;
        }

        const defaultRiskThemeColors = {
            corruption: '#8b5cf6',
            'personal-data': '#0ea5e9',
            'international-sanctions': '#f97316',
            discrimination: '#ec4899'
        };
        const fallbackPalette = ['#8b5cf6', '#0ea5e9', '#f97316', '#ec4899', '#22c55e', '#eab308', '#14b8a6', '#ef4444'];
        const resolveDefaultThemeColor = (value) => {
            const key = String(value || '').toLowerCase();
            if (defaultRiskThemeColors[key]) {
                return defaultRiskThemeColors[key];
            }
            const hash = Array.from(key).reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return fallbackPalette[hash % fallbackPalette.length] || '#64748b';
        };
        const isSafeThemeColor = (color) => typeof color === 'string'
            && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color.trim());

        const configuredThemes = Array.isArray(this.config?.riskThemes) ? this.config.riskThemes : [];
        const themes = configuredThemes.length
            ? configuredThemes
            : [
                { value: 'corruption', label: 'Corruption', color: '#8b5cf6' },
                { value: 'personal-data', label: 'Données Personnelles', color: '#0ea5e9' },
                { value: 'international-sanctions', label: 'Sanctions internationales', color: '#f97316' },
                { value: 'discrimination', label: 'Discrimination', color: '#ec4899' }
            ];

        container.innerHTML = '';
        const seen = new Set();
        themes.forEach((theme) => {
            if (!theme || theme.value === undefined || theme.value === null) {
                return;
            }
            const value = String(theme.value);
            const normalizedValue = value.toLowerCase();
            if (seen.has(normalizedValue)) {
                return;
            }
            seen.add(normalizedValue);

            const label = theme.label || value;
            const color = isSafeThemeColor(theme.color) ? theme.color.trim() : resolveDefaultThemeColor(value);
            const item = document.createElement('div');
            item.className = 'risk-theme-legend-item';
            item.title = `Thématique : ${label}`;

            const dot = document.createElement('span');
            dot.className = 'risk-theme-legend-dot';
            dot.style.setProperty('--legend-theme-color', color);
            dot.setAttribute('aria-hidden', 'true');

            const text = document.createElement('span');
            text.textContent = label;

            item.append(dot, text);
            container.appendChild(item);
        });

        const undefinedItem = document.createElement('div');
        undefinedItem.className = 'risk-theme-legend-item';
        undefinedItem.title = 'Thématique non définie';

        const undefinedDot = document.createElement('span');
        undefinedDot.className = 'risk-theme-legend-dot';
        undefinedDot.style.setProperty('--legend-theme-color', '#64748b');
        undefinedDot.setAttribute('aria-hidden', 'true');

        const undefinedText = document.createElement('span');
        undefinedText.textContent = 'Non défini';

        undefinedItem.append(undefinedDot, undefinedText);
        container.appendChild(undefinedItem);
    }

    renderRiskPoints() {
        const baseRisks = Array.isArray(this.risks) ? this.risks : [];
        const filteredRisks = this.getFilteredRisks(baseRisks);
        const mitigationOptions = typeof getMitigationEffectivenessOptions === 'function'
            ? getMitigationEffectivenessOptions()
            : [
                { value: 'efficace', label: 'Efficace', coefficient: 0.25 },
                { value: 'ameliorable', label: 'Améliorable', coefficient: 0.5 },
                { value: 'insuffisant', label: 'Insuffisant', coefficient: 0.75 },
                { value: 'inefficace', label: 'Inefficace', coefficient: 1 }
            ];

        const viewConfigs = {
            brut: {
                gridId: 'matrixGridBrut',
                probKey: 'probBrut',
                impactKey: 'impactBrut',
                label: 'Risque brut',
                mode: 'brut'
            },
            net: {
                gridId: 'matrixGridNet',
                label: 'Risque net',
                mode: 'net'
            },
            post: {
                gridId: 'matrixGridPost',
                label: 'Risque après plan d’action',
                mode: 'post'
            }
        };

        const mitigationOrder = Array.isArray(MITIGATION_EFFECTIVENESS_ORDER)
            ? [...MITIGATION_EFFECTIVENESS_ORDER]
            : ['inefficace', 'insuffisant', 'ameliorable', 'efficace'];
        const brutLevelsOrder = ['critique', 'fort', 'modere', 'faible'];
        const severityLabelMap = {
            critique: 'Critical Risk',
            fort: 'High Risk',
            modere: 'Moderate Risk',
            faible: 'Low Risk'
        };
        const defaultRiskThemeColors = {
            corruption: '#8b5cf6',
            'personal-data': '#0ea5e9',
            'international-sanctions': '#f97316',
            discrimination: '#ec4899'
        };
        const riskThemeFallbackPalette = ['#8b5cf6', '#0ea5e9', '#f97316', '#ec4899', '#22c55e', '#eab308', '#14b8a6', '#ef4444'];
        const resolveDefaultThemeColor = (value) => {
            const key = String(value || '').toLowerCase();
            if (defaultRiskThemeColors[key]) {
                return defaultRiskThemeColors[key];
            }
            const hash = Array.from(key).reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return riskThemeFallbackPalette[hash % riskThemeFallbackPalette.length] || '#64748b';
        };
        const isSafeThemeColor = (color) => typeof color === 'string'
            && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color.trim());
        const riskThemeMetaMap = (Array.isArray(this.config?.riskThemes) ? this.config.riskThemes : []).reduce((acc, item) => {
            if (!item || item.value === undefined || item.value === null) {
                return acc;
            }
            const rawValue = String(item.value);
            const key = rawValue.toLowerCase();
            const label = item.label || rawValue;
            const defaultColor = resolveDefaultThemeColor(key);
            const color = isSafeThemeColor(item.color) ? item.color.trim() : defaultColor;
            const meta = { label, color };
            acc[rawValue] = meta;
            acc[key] = meta;
            return acc;
        }, {});
        const resolveRiskThemeMeta = (value) => {
            if (value == null || value === '') {
                return { label: 'Non défini', color: '#64748b' };
            }
            const rawValue = String(value);
            return riskThemeMetaMap[rawValue]
                || riskThemeMetaMap[rawValue.toLowerCase()]
                || { label: rawValue, color: resolveDefaultThemeColor(rawValue) };
        };
        const applyRiskThemeRing = (point, value) => {
            const meta = resolveRiskThemeMeta(value);
            point.dataset.riskTheme = value || '';
            point.style.setProperty('--risk-theme-color', meta.color);
            return meta;
        };
        Object.entries(viewConfigs).forEach(([viewKey, config]) => {
            const grid = document.getElementById(config.gridId);
            if (!grid) return;

            grid.querySelectorAll('.risk-point').forEach(p => p.remove());
            const pointsByDisplayCell = new Map();
            if (viewKey === 'brut') {
                grid.querySelectorAll('.matrix-cell').forEach(cell => {
                    cell.ondragover = null;
                    cell.ondrop = null;
                    if (!window.matrixEditMode) {
                        return;
                    }
                    cell.ondragover = (event) => {
                        event.preventDefault();
                    };
                    cell.ondrop = (event) => {
                        event.preventDefault();
                        const riskId = event.dataTransfer?.getData('text/risk-id');
                        if (!riskId) return;
                        const probability = parseInt(cell.dataset.probability, 10);
                        const impact = parseInt(cell.dataset.impact, 10);
                        if (typeof window.applyMatrixRiskMove === 'function') {
                            window.applyMatrixRiskMove(riskId, probability, impact);
                        }
                    };
                });
            }

            const cellCounts = {};

            filteredRisks.forEach(risk => {
                const riskStatus = this.normalizeStatusValue('risk', risk?.statut, risk?.status, risk?.statusLabel, risk?.state);
                if (riskStatus === 'not-included') {
                    return;
                }

                if (config.mode === 'net' || config.mode === 'post') {
                    const netInfo = config.mode === 'post' && typeof getRiskPostActionInfo === 'function'
                        ? getRiskPostActionInfo(risk)
                        : (typeof getRiskNetInfo === 'function'
                            ? getRiskNetInfo(risk)
                            : { score: 0, brutScore: 0, coefficient: 1, effectiveness: 'inefficace', label: 'Inefficace' });
                    const brutLevel = typeof getRiskBrutLevel === 'function'
                        ? getRiskBrutLevel(risk)
                        : (typeof getRiskSeverityFromScore === 'function'
                            ? getRiskSeverityFromScore(netInfo.brutScore)
                            : 'faible');

                    const rowIndex = brutLevelsOrder.indexOf(brutLevel);
                    const colIndex = mitigationOrder.indexOf(netInfo.effectiveness);
                    if (rowIndex === -1 || colIndex === -1) {
                        return;
                    }

                    const brutLevelRanges = {
                        critique: { min: 12, max: 16 },
                        fort: { min: 6, max: 12 },
                        modere: { min: 3, max: 6 },
                        faible: { min: 0, max: 3 }
                    };
                    const levelRange = brutLevelRanges[brutLevel] || { min: 0, max: 3 };
                    const brutScore = Number.isFinite(netInfo.brutScore) ? netInfo.brutScore : levelRange.min;
                    const netScore = Number.isFinite(netInfo.score) ? netInfo.score : 0;
                    const matrixScoreCap = 16;
                    const displayBrutScore = Math.min(brutScore, matrixScoreCap);
                    const displayNetScore = Math.min(netScore, matrixScoreCap);
                    const hasScoreOverflow = brutScore > matrixScoreCap || netScore > matrixScoreCap;
                    const rangeSize = Math.max(0.01, levelRange.max - levelRange.min);
                    const normalizedBrut = Math.max(0, Math.min(0.999, (displayBrutScore - levelRange.min) / rangeSize));

                    const selectedOption = mitigationOptions.find(option => option.value === netInfo.effectiveness);
                    const selectedCoefficient = Math.max(0.25, Math.min(1, Number(selectedOption?.coefficient) || 1));
                    const remainingFactor = selectedCoefficient;
                    const netMin = levelRange.min * remainingFactor;
                    const netMax = levelRange.max * remainingFactor;
                    const netRange = Math.max(0.01, netMax - netMin);
                    const normalizedNet = Math.max(0, Math.min(0.999, (displayNetScore - netMin) / netRange));

                    const withinCol = 0.8 - (normalizedNet * 0.6);
                    const withinRow = 0.8 - (normalizedBrut * 0.6);
                    const rawLeftPercent = ((colIndex + withinCol) / mitigationOrder.length) * 100;
                    const rawBottomPercent = ((brutLevelsOrder.length - (rowIndex + withinRow)) / brutLevelsOrder.length) * 100;
                    const netColumns = 4;
                    const netRows = 9;
                    const snappedColIndex = Math.max(0, Math.min(netColumns - 1, Math.round((rawLeftPercent / 100) * netColumns - 0.5)));
                    const snappedRowFromTop = Math.max(0, Math.min(netRows - 1, Math.round(((100 - rawBottomPercent) / 100) * netRows - 0.5)));
                    const leftPercent = ((snappedColIndex + 0.5) / netColumns) * 100;
                    const bottomPercent = ((netRows - snappedRowFromTop - 0.5) / netRows) * 100;

                    const key = `${snappedColIndex}-${snappedRowFromTop}`;
                    const index = cellCounts[key] || 0;
                    cellCounts[key] = index + 1;
                    const slots = cellCounts[key];
                    const gridSize = Math.ceil(Math.sqrt(slots));
                    const slotIndex = index;
                    const row = Math.floor(slotIndex / gridSize);
                    const col = slotIndex % gridSize;

                    const point = document.createElement('div');
                    point.className = `risk-point ${viewKey}`;
                    point.dataset.riskId = risk.id;
                    if (hasScoreOverflow) {
                        point.classList.add('score-overflow');
                    }

                    const displayTitle = risk.titre || risk.description || 'Non défini';
                    const displayText = risk.description || 'Non défini';
                    const processLabel = risk?.processus && String(risk.processus).trim()
                        ? this.getProcessLabel(String(risk.processus).trim())
                        : 'Non défini';
                    const selectedSubProcessLabel = risk?.sousProcessus && String(risk.sousProcessus).trim()
                        ? this.getSubProcessLabel(risk?.processus, String(risk.sousProcessus).trim())
                        : '';
                    const processOrSubProcess = selectedSubProcessLabel || processLabel;
                    const tiersLabel = Array.isArray(risk?.tiers)
                        ? risk.tiers
                            .map(tier => this.getTierLabel(tier))
                            .filter(Boolean)
                            .join(', ')
                        : '';
                    const themeMeta = applyRiskThemeRing(point, risk?.riskTheme || 'corruption');
                    const themeLabel = themeMeta.label;
                    const tooltipLines = [
                        `${processOrSubProcess} • ${tiersLabel || 'Non défini'} • Thématique: ${themeLabel}`,
                        `**${displayTitle}**`,
                        displayText
                    ];
                    if (typeof risk.example === 'string' && risk.example.trim()) {
                        tooltipLines.push(`Exemple : ${risk.example.trim()}`);
                    }
                    const formattedBrut = Number.isFinite(netInfo.brutScore)
                        ? netInfo.brutScore.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
                        : '0';
                    const formattedNet = Number.isFinite(netInfo.score)
                        ? netInfo.score.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
                        : '0';
                    tooltipLines.push(`Brut ${formattedBrut} → Net ${formattedNet}`);
                    tooltipLines.push(`Coefficient ${formatMitigationCoefficient(netInfo.coefficient)} (${netInfo.label})`);
                    tooltipLines.push(`Niveau brut : ${severityLabelMap[brutLevel] || brutLevel}`);

                    point.title = tooltipLines.join('\n');
                    point.textContent = String(risk.id ?? '');
                    if (idsEqual(this.selectedRiskId, risk.id)) {
                        point.classList.add('active-point');
                    }
                    point.setAttribute('aria-label', `${config.label} : ${displayTitle} • Thématique: ${themeLabel}`);
                    point.onclick = () => this.selectRisk(risk.id, { preferredView: viewKey });
                    grid.appendChild(point);

                    const diameter = point.offsetWidth;
                    const margin = 4;
                    const step = diameter + margin;
                    const dx = (col - (gridSize - 1) / 2) * step;
                    const dy = (row - (gridSize - 1) / 2) * step;

                    point.style.left = `calc(${leftPercent}% + ${dx}px)`;
                    point.style.bottom = `calc(${bottomPercent}% + ${dy}px)`;
                    point.style.transform = 'translate(-50%, 50%)';

                    return;
                }

                const baseProb = Number(risk?.[config.probKey]);
                const rawImpact = Number(risk?.[config.impactKey]);
                if (!Number.isFinite(baseProb) || !Number.isFinite(rawImpact)) {
                    return;
                }

                let effectiveProb = baseProb;
                let hasScoreOverflow = false;

                if (viewKey === 'brut') {
                    if (typeof getRiskEffectiveBrutProbability === 'function') {
                        effectiveProb = getRiskEffectiveBrutProbability(risk);
                    }
                    const brutScore = typeof getRiskBrutScore === 'function'
                        ? getRiskBrutScore(risk)
                        : (effectiveProb * rawImpact);
                    hasScoreOverflow = Number.isFinite(brutScore) && brutScore > 16;
                }

                const clampedProb = Math.min(4, Math.max(1, effectiveProb || 1));
                const clampedImpact = Math.min(4, Math.max(1, rawImpact || 1));

                const leftPercent = ((clampedProb - 0.5) / 4) * 100;
                const bottomPercent = ((clampedImpact - 0.5) / 4) * 100;

                const key = `${clampedProb}-${clampedImpact}`;
                const index = cellCounts[key] || 0;
                cellCounts[key] = index + 1;
                const slots = cellCounts[key];
                const gridSize = Math.ceil(Math.sqrt(slots));
                const slotIndex = index;
                const row = Math.floor(slotIndex / gridSize);
                const col = slotIndex % gridSize;

                const point = document.createElement('div');
                point.className = `risk-point ${viewKey}`;
                point.dataset.riskId = risk.id;
                if (hasScoreOverflow) {
                    point.classList.add('score-overflow');
                }
                const displayTitle = risk.titre || risk.description || 'Non défini';
                const displayText = risk.description || 'Non défini';
                const processLabel = risk?.processus && String(risk.processus).trim()
                    ? this.getProcessLabel(String(risk.processus).trim())
                    : 'Non défini';
                const selectedSubProcessLabel = risk?.sousProcessus && String(risk.sousProcessus).trim()
                    ? this.getSubProcessLabel(risk?.processus, String(risk.sousProcessus).trim())
                    : '';
                const processOrSubProcess = selectedSubProcessLabel || processLabel;
                const tiersLabel = Array.isArray(risk?.tiers)
                    ? risk.tiers
                        .map(tier => this.getTierLabel(tier))
                        .filter(Boolean)
                        .join(', ')
                    : '';
                const themeMeta = applyRiskThemeRing(point, risk?.riskTheme || 'corruption');
                const themeLabel = themeMeta.label;
                const tooltipLines = [
                    `${processOrSubProcess} • ${tiersLabel || 'Non défini'} • Thématique: ${themeLabel}`,
                    `**${displayTitle}**`,
                    displayText
                ];
                if (typeof risk.example === 'string' && risk.example.trim()) {
                    tooltipLines.push(`Exemple : ${risk.example.trim()}`);
                }

                point.title = tooltipLines.join('\n');
                point.textContent = String(risk.id ?? '');
                if (idsEqual(this.selectedRiskId, risk.id)) {
                    point.classList.add('active-point');
                }
                point.setAttribute('aria-label', `${config.label} : ${displayTitle} • Thématique: ${themeLabel}`);
                point.onclick = () => this.selectRisk(risk.id, { preferredView: viewKey });
                if (viewKey === 'brut' && window.matrixEditMode) {
                    point.draggable = true;
                    point.addEventListener('dragstart', (event) => {
                        event.dataTransfer?.setData('text/risk-id', String(risk.id));
                    });
                }
                grid.appendChild(point);

                const diameter = point.offsetWidth;
                const margin = 4;
                const step = diameter + margin;
                const dx = (col - (gridSize - 1) / 2) * step;
                const dy = (row - (gridSize - 1) / 2) * step;

                point.style.left = `calc(${leftPercent}% + ${dx}px)`;
                point.style.bottom = `calc(${bottomPercent}% + ${dy}px)`;
                point.style.transform = 'translate(-50%, 50%)';

                const displayCellKey = `${clampedProb}-${clampedImpact}`;
                if (!pointsByDisplayCell.has(displayCellKey)) {
                    pointsByDisplayCell.set(displayCellKey, []);
                }
                pointsByDisplayCell.get(displayCellKey).push({
                    point,
                    centerLeft: leftPercent,
                    centerBottom: bottomPercent
                });
            });

            pointsByDisplayCell.forEach(pointsInCell => {
                if (!Array.isArray(pointsInCell) || pointsInCell.length === 0) {
                    return;
                }

                const [{ centerLeft, centerBottom }] = pointsInCell;
                if (pointsInCell.length === 1) {
                    const singlePoint = pointsInCell[0].point;
                    singlePoint.style.left = `${centerLeft}%`;
                    singlePoint.style.bottom = `${centerBottom}%`;
                    singlePoint.style.transform = 'translate(-50%, 50%)';
                    return;
                }

                const gridSize = Math.ceil(Math.sqrt(pointsInCell.length));
                pointsInCell.forEach((entry, index) => {
                    const row = Math.floor(index / gridSize);
                    const col = index % gridSize;
                    const diameter = entry.point.offsetWidth;
                    const margin = 4;
                    const step = diameter + margin;
                    const dx = (col - (gridSize - 1) / 2) * step;
                    const dy = (row - (gridSize - 1) / 2) * step;

                    entry.point.style.left = `calc(${centerLeft}% + ${dx}px)`;
                    entry.point.style.bottom = `calc(${centerBottom}% + ${dy}px)`;
                    entry.point.style.transform = 'translate(-50%, 50%)';
                });
            });
        });
    }

    getFilteredRisks(risks = this.risks) {
        const sourceRisks = Array.isArray(risks) ? risks : [];
        const {
            process = '',
            type = '',
            status = '',
            theme = '',
            search = '',
            entity = [],
            tiers = []
        } = this.filters || {};

        const processFilter = String(process || '').toLowerCase();
        const themeFilter = String(theme || '').toLowerCase();
        const searchFilter = String(search || '').toLowerCase();
        const entityFilters = Array.isArray(entity)
            ? entity.map(value => String(value || '').toLowerCase()).filter(Boolean)
            : [];
        const tiersFilters = Array.isArray(tiers)
            ? tiers.map(value => String(value || '').toLowerCase()).filter(Boolean)
            : [];

        return sourceRisks.filter(risk => {
            if (processFilter) {
                const processValues = Array.isArray(risk?.processusAssocies) && risk.processusAssocies.length
                    ? risk.processusAssocies
                    : [risk?.processus];
                const hasProcess = processValues.some(value => String(value || '').toLowerCase().includes(processFilter));
                if (!hasProcess) {
                    return false;
                }
            }

            if (type) {
                const typeValues = Array.isArray(risk?.typesCorruption) && risk.typesCorruption.length
                    ? risk.typesCorruption
                    : [risk?.typeCorruption];
                if (!typeValues.some(value => value === type)) {
                    return false;
                }
            }

            if (themeFilter) {
                const riskTheme = String(risk?.riskTheme || '').toLowerCase();
                if (riskTheme !== themeFilter) {
                    return false;
                }
            }

            if (status) {
                const riskStatus = this.normalizeStatusValue(
                    'risk',
                    risk?.statut,
                    risk?.status,
                    risk?.statusLabel,
                    risk?.state
                );
                const filterStatus = this.normalizeStatusValue('risk', status);
                if (riskStatus !== filterStatus) {
                    return false;
                }
            }

            if (searchFilter) {
                const title = risk?.titre != null ? String(risk.titre).toLowerCase() : '';
                const description = risk?.description != null ? String(risk.description).toLowerCase() : '';
                const idValue = risk?.id != null ? String(risk.id).toLowerCase() : '';
                const tiersValues = Array.isArray(risk?.tiers)
                    ? risk.tiers.map(value => String(value || '').toLowerCase()).filter(Boolean)
                    : [];
                const tiersText = tiersValues.join(' ');
                if (!title.includes(searchFilter) && !description.includes(searchFilter) && !idValue.includes(searchFilter) && !tiersText.includes(searchFilter)) {
                    return false;
                }
            }

            if (entityFilters.length) {
                const riskEntities = Array.isArray(risk?.paysExposes)
                    ? risk.paysExposes.map(value => String(value || '').toLowerCase()).filter(Boolean)
                    : [];
                const hasEntity = entityFilters.some(value => riskEntities.includes(value));
                if (!hasEntity) {
                    return false;
                }
            }

            if (tiersFilters.length) {
                const riskTiers = Array.isArray(risk?.tiers)
                    ? risk.tiers.map(value => String(value || '').toLowerCase()).filter(Boolean)
                    : [];
                const hasTier = tiersFilters.some(value => riskTiers.includes(value));
                if (!hasTier) {
                    return false;
                }
            }

            return true;
        });
    }

    getRisksByStatus(status) {
        const sourceRisks = Array.isArray(this.risks) ? this.risks : [];
        if (!status) {
            return sourceRisks.slice();
        }

        const targetStatus = this.normalizeStatusValue('risk', status);
        if (!targetStatus) {
            return sourceRisks.slice();
        }

        return sourceRisks.filter(risk => {
            return this.normalizeStatusValue(
                'risk',
                risk?.statut,
                risk?.status,
                risk?.statusLabel,
                risk?.state
            ) === targetStatus;
        });
    }

    selectRisk(riskId, options = {}) {
        const targetId = String(riskId);
        const risk = this.risks.find(r => idsEqual(r.id, targetId));
        if (!risk) return;
        this.selectedRiskId = risk.id;

        const requestedView = typeof options === 'string' ? options : options?.preferredView;
        const validMatrixViews = ['brut', 'net', 'post'];
        const activeView = validMatrixViews.includes(requestedView)
            ? requestedView
            : (validMatrixViews.includes(this.currentView) ? this.currentView : 'brut');
        this.currentView = activeView;
        const activeViewContainer = document.querySelector(`.matrix-container[data-view="${activeView}"]`);
        const riskItems = Array.from(document.querySelectorAll('.risk-item[data-risk-id]'));
        document.querySelectorAll('.risk-point').forEach(point => {
            const isTarget = idsEqual(point.dataset?.riskId, targetId);
            point.classList.toggle('active-point', isTarget);
        });

        // Update selected state in details panel (prioritize the active matrix view list)
        let selectedElement = null;
        riskItems.forEach(item => {
            item.classList.remove('selected');
            item.classList.remove('selection-pulse');
        });

        const matchingItems = riskItems.filter(item => idsEqual(item.dataset.riskId, targetId));
        selectedElement = matchingItems.find(item => activeViewContainer?.contains(item)) || matchingItems[0] || null;

        if (selectedElement) {
            selectedElement.classList.add('selected');
            selectedElement.classList.add('selection-pulse');
            window.setTimeout(() => {
                selectedElement.classList.remove('selection-pulse');
            }, 650);
        }

        if (selectedElement) {
            this.scrollRiskItemIntoView(selectedElement);
        }

        // Fallback (legacy behavior) for external views reusing risk-item class
        if (!selectedElement) {
            document.querySelectorAll('.risk-item').forEach(item => {
                item.classList.remove('selected');
                if (idsEqual(item.dataset.riskId, targetId)) {
                    item.classList.add('selected');
                    selectedElement = item;
                }
            });
        }

        if (selectedElement) {
            this.scrollRiskItemIntoView(selectedElement);
        }

        // Show risk details
        this.showRiskDetails(risk);
    }

    scrollRiskItemIntoView(element) {
        if (!element) return;

        const scrollContainer = element.closest('.risk-details-panel');
        if (scrollContainer) {
            const containerRect = scrollContainer.getBoundingClientRect();
            const targetRect = element.getBoundingClientRect();
            const offset = targetRect.top - containerRect.top + scrollContainer.scrollTop;
            const desiredTop = Math.max(offset - (scrollContainer.clientHeight / 2) + (element.offsetHeight / 2), 0);

            if (typeof scrollContainer.scrollTo === 'function') {
                scrollContainer.scrollTo({
                    top: desiredTop,
                    behavior: 'smooth'
                });
            } else {
                scrollContainer.scrollTop = desiredTop;
            }
        } else if (typeof element.scrollIntoView === 'function') {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    showRiskDetails(risk) {
        // Could open a modal or update a details panel
        console.log('Risk details:', risk);
    }

    updateRiskDetailsList() {
        const baseRisks = Array.isArray(this.risks) ? this.risks : [];
        const filteredRisks = this.getFilteredRisks(baseRisks).filter((risk) => {
            const riskStatus = this.normalizeStatusValue('risk', risk?.statut, risk?.status, risk?.statusLabel, risk?.state);
            return riskStatus !== 'archive' && riskStatus !== 'not-included';
        });

        const visibleRiskIds = this.getVisibleRiskIdSet(filteredRisks);

        const viewConfigs = {
            brut: {
                containerId: 'riskDetailsListBrut',
                titleId: 'riskDetailsTitleBrut',
                probKey: 'probBrut',
                impactKey: 'impactBrut',
                title: 'Risques bruts classés par score',
                mode: 'brut'
            },
            net: {
                containerId: 'riskDetailsListNet',
                titleId: 'riskDetailsTitleNet',
                title: 'Risques nets classés par score',
                mode: 'net'
            },
            post: {
                containerId: 'riskDetailsListPost',
                titleId: 'riskDetailsTitlePost',
                title: 'Risques après plan d’action classés par score',
                mode: 'post'
            }
        };

        Object.values(viewConfigs).forEach((config) => {
            const { containerId, titleId, title, mode } = config;
            const container = document.getElementById(containerId);
            if (!container) return;

            const titleElement = document.getElementById(titleId);
            if (titleElement) {
                titleElement.textContent = title;
            }

            const scoredRisks = filteredRisks.map(entry => {
                if (mode === 'net' || mode === 'post') {
                    const netInfo = mode === 'post' && typeof getRiskPostActionInfo === 'function'
                        ? getRiskPostActionInfo(entry)
                        : (typeof getRiskNetInfo === 'function'
                            ? getRiskNetInfo(entry)
                            : { score: 0, brutScore: 0, coefficient: 1, label: 'Inefficace', effectiveness: 'inefficace' });
                    return { risk: entry, score: netInfo.score, brutScore: netInfo.brutScore, coefficient: netInfo.coefficient, label: netInfo.label, effectiveness: netInfo.effectiveness };
                }

                const baseProb = Number(entry?.[config.probKey]) || 0;
                const impact = Number(entry?.[config.impactKey]) || 0;
                const coefficient = typeof getRiskAggravatingCoefficient === 'function'
                    ? getRiskAggravatingCoefficient(entry)
                    : 1;
                const prob = baseProb * coefficient;
                const baseScore = baseProb * impact;
                return { risk: entry, prob, impact, coefficient, baseScore, score: prob * impact };
            }).sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (mode === 'net' || mode === 'post') {
                    if (b.coefficient !== a.coefficient) return b.coefficient - a.coefficient;
                } else {
                    if ((b.prob || 0) !== (a.prob || 0)) return (b.prob || 0) - (a.prob || 0);
                    if ((b.impact || 0) !== (a.impact || 0)) return (b.impact || 0) - (a.impact || 0);
                }

                const aTitle = a.risk.titre || a.risk.description || '';
                const bTitle = b.risk.titre || b.risk.description || '';
                const descComparison = aTitle.localeCompare(bTitle, undefined, { sensitivity: 'base' });
                if (descComparison !== 0) return descComparison;

                return String(a.risk.id).localeCompare(String(b.risk.id), undefined, { numeric: true, sensitivity: 'base' });
            });

            if (!scoredRisks.length) {
                const message = baseRisks.length
                    ? 'No risk matches the active filters.'
                    : 'No risk recorded. Add a risk to view details here.';

                container.innerHTML = `
                    <div class="matrix-description-empty" style="text-align: center; padding: 16px 12px;">
                        ${message}
                    </div>
                `;
                return;
            }

            const typeMap = (Array.isArray(this.config?.riskTypes) ? this.config.riskTypes : []).reduce((acc, item) => {
                if (!item || item.value === undefined || item.value === null) {
                    return acc;
                }
                const rawValue = String(item.value);
                const label = item.label || rawValue;
                acc[rawValue] = label;
                acc[rawValue.toLowerCase()] = label;
                return acc;
            }, {});

            const resolveTypeLabel = (value) => {
                if (value == null) {
                    return 'Non défini';
                }
                const rawValue = String(value);
                return typeMap[rawValue] || typeMap[rawValue.toLowerCase()] || rawValue;
            };

            const themeMap = (Array.isArray(this.config?.riskThemes) ? this.config.riskThemes : []).reduce((acc, item) => {
                if (!item || item.value === undefined || item.value === null) {
                    return acc;
                }
                const rawValue = String(item.value);
                const label = item.label || rawValue;
                acc[rawValue] = label;
                acc[rawValue.toLowerCase()] = label;
                return acc;
            }, {});

            const resolveThemeLabel = (value) => {
                if (value == null || value === '') {
                    return 'Non défini';
                }
                const rawValue = String(value);
                return themeMap[rawValue] || themeMap[rawValue.toLowerCase()] || rawValue;
            };

            const renderThemeBadge = (label) => `<span class="table-badge badge-info">${escapeHtml(label || 'Non défini')}</span>`;

            const tierMap = (Array.isArray(this.config?.tiers) ? this.config.tiers : []).reduce((acc, item) => {
                if (!item || item.value === undefined || item.value === null) {
                    return acc;
                }
                const rawValue = String(item.value);
                const label = item.label || rawValue;
                acc[rawValue] = label;
                acc[rawValue.toLowerCase()] = label;
                return acc;
            }, {});

            const resolveTierLabel = (value) => {
                if (value == null) {
                    return '';
                }
                const rawValue = String(value);
                return tierMap[rawValue] || tierMap[rawValue.toLowerCase()] || rawValue;
            };

            container.innerHTML = scoredRisks.map(entry => {
                const { risk, score } = entry;
                let scoreClass = 'low';
                if (score >= 12) scoreClass = 'critical';
                else if (score >= 6) scoreClass = 'high';
                else if (score >= 3) scoreClass = 'medium';

                const processLabel = risk?.processus && String(risk.processus).trim()
                    ? this.getProcessLabel(String(risk.processus).trim())
                    : 'Non défini';
                const selectedSubProcessLabel = risk?.sousProcessus && String(risk.sousProcessus).trim()
                    ? this.getSubProcessLabel(risk?.processus, String(risk.sousProcessus).trim())
                    : '';
                const processOrSubProcess = selectedSubProcessLabel || processLabel;
                const typeLabel = resolveTypeLabel(risk?.typeCorruption);
                const themeLabel = resolveThemeLabel(risk?.riskTheme || 'corruption');
                const tiersLabel = Array.isArray(risk?.tiers)
                    ? risk.tiers
                        .map(tier => resolveTierLabel(tier))
                        .filter(Boolean)
                        .join(', ')
                    : '';
                const formattedScore = Number.isFinite(score)
                    ? score.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
                    : '0';

                const metaDetails = `#${risk.id} • Processus: ${processOrSubProcess} • Tiers: ${tiersLabel || 'Non défini'} • Type: ${typeLabel}`;
                const isBlurred = !visibleRiskIds.has(String(risk?.id));
                const itemClass = `risk-item${isBlurred ? ' risk-row-blurred' : ''}`;
                const itemAttributes = isBlurred
                    ? ' aria-hidden="true"'
                    : ` onclick='rms.selectRisk(${JSON.stringify(risk.id)}, { preferredView: ${JSON.stringify(mode)} })'`;
                const editButtonAttributes = isBlurred
                    ? ' disabled aria-hidden="true" tabindex="-1"'
                    : ` title="Éditer le risque" aria-label="Éditer le risque ${escapeHtml(risk.titre || risk.description || 'Sans titre')}" onclick='event.stopPropagation(); rms.editRisk(${JSON.stringify(risk.id)})'`;

                return `
                    <div class="${itemClass}" data-risk-id="${risk.id}"${itemAttributes}>
                        <div class="risk-item-header">
                            <div class="risk-item-title-wrap">
                                <div class="risk-item-title">${escapeHtml(risk.titre || risk.description || 'Sans titre')}</div>
                                <div class="risk-item-description">${escapeHtml(risk.description || '—')}</div>
                            </div>
                            <div class="risk-item-actions">
                                <span class="risk-item-score ${scoreClass}">${formattedScore}</span>
                                <button
                                    type="button"
                                    class="risk-item-edit-btn"
                                    ${editButtonAttributes}
                                >✏️</button>
                            </div>
                        </div>
                        <div class="risk-item-meta">
                            ${renderThemeBadge(themeLabel)}
                            <span>${escapeHtml(metaDetails)}</span>
                        </div>
                    </div>
                `;
            }).join('');
        });
    }

    // Dashboard functions
    updateDashboard() {
        const validatedRisks = this.getRisksByStatus('validated');
        const stats = this.calculateStats(validatedRisks);
        const metrics = this.computeDashboardMetrics(validatedRisks, stats);

        this.updateKpiCards({ ...metrics, previous: this.lastDashboardMetrics });
        this.updateCharts(validatedRisks, stats);
        this.updateRecentAlerts(validatedRisks);

        this.lastDashboardMetrics = metrics;
    }

    computeDashboardMetrics(risks = this.risks, stats = null) {
        const sourceRisks = Array.isArray(risks) ? risks : [];
        const computedStats = stats || this.calculateStats(sourceRisks);
        const totalRisks = computedStats?.total ?? sourceRisks.length;

        const totals = sourceRisks.reduce((acc, risk) => {
            const brut = typeof getRiskBrutScore === 'function'
                ? getRiskBrutScore(risk)
                : (Number(risk?.probBrut) || 0) * (Number(risk?.impactBrut) || 0);
            const net = typeof getRiskNetScore === 'function'
                ? getRiskNetScore(risk)
                : (Number(risk?.probNet) || 0) * (Number(risk?.impactNet) || 0);

            return {
                brut: acc.brut + brut,
                net: acc.net + net
            };
        }, { brut: 0, net: 0 });

        const maxScorePerRisk = 16; // 4x4 matrix
        const potentialScore = totalRisks * maxScorePerRisk;
        const rawResidualScore = totals.net;
        const normalizedScore = potentialScore > 0
            ? Math.max(0, Math.min(1, 1 - (rawResidualScore / potentialScore)))
            : 1;
        const globalScore = Math.round(normalizedScore * 100);

        const averageReduction = totalRisks > 0
            ? Math.max((totals.brut - totals.net) / totalRisks, 0)
            : 0;

        const allControls = Array.isArray(this.controls) ? this.controls : [];
        const activeControlsList = allControls.filter(control => this.normalizeStatusValue('control', control?.status) === 'actif');
        const activeControls = activeControlsList.length;
        const totalControls = allControls.length;

        const controlTypeOptions = Array.isArray(this.config?.controlTypes)
            ? this.config.controlTypes.filter(option => option && option.value !== undefined && option.value !== null)
            : [];
        const controlTypeOrder = controlTypeOptions.map(option => String(option.value).toLowerCase());
        const controlTypeLabelMap = controlTypeOptions.reduce((acc, option) => {
            const key = String(option.value).toLowerCase();
            acc[key] = option.label || option.value;
            return acc;
        }, {});

        const controlTypeCounts = activeControlsList.reduce((acc, control) => {
            const rawType = control?.type ?? '';
            const normalizedType = rawType ? String(rawType).toLowerCase() : '';
            const key = normalizedType || '__undefined__';

            if (!acc[key]) {
                acc[key] = { count: 0, value: normalizedType, rawValue: rawType };
            }

            acc[key].count += 1;
            return acc;
        }, {});

        const computeDistributionLabel = (entry) => {
            if (!entry) {
                return 'Non défini';
            }

            const normalizedValue = entry.value;
            if (normalizedValue) {
                return controlTypeLabelMap[normalizedValue] || entry.rawValue || normalizedValue;
            }

            return 'Non défini';
        };

        const controlTypeDistribution = [];
        const pushDistributionEntry = (key) => {
            const entry = controlTypeCounts[key];
            if (!entry) return;

            controlTypeDistribution.push({
                value: entry.value,
                label: computeDistributionLabel(entry),
                count: entry.count,
                percentage: 0
            });

            delete controlTypeCounts[key];
        };

        controlTypeOrder.forEach(pushDistributionEntry);

        Object.keys(controlTypeCounts).forEach((key) => {
            pushDistributionEntry(key);
        });

        if (activeControls > 0 && controlTypeDistribution.length > 0) {
            const distributionWithRemainder = controlTypeDistribution.map((item) => {
                const rawShare = (item.count / activeControls) * 100;
                const baseShare = Math.floor(rawShare);

                return {
                    item,
                    baseShare,
                    remainder: rawShare - baseShare
                };
            });

            let assigned = 0;
            distributionWithRemainder.forEach(({ item, baseShare }) => {
                item.percentage = baseShare;
                assigned += baseShare;
            });

            let remaining = Math.max(0, 100 - assigned);

            if (remaining > 0) {
                distributionWithRemainder
                    .slice()
                    .sort((a, b) => {
                        if (b.remainder === a.remainder) {
                            return (b.item.count || 0) - (a.item.count || 0);
                        }

                        return b.remainder - a.remainder;
                    })
                    .forEach(({ item }) => {
                        if (remaining <= 0) {
                            return;
                        }

                        item.percentage += 1;
                        remaining -= 1;
                    });
            }

            let index = 0;
            while (remaining > 0 && controlTypeDistribution.length > 0) {
                controlTypeDistribution[index % controlTypeDistribution.length].percentage += 1;
                remaining -= 1;
                index += 1;
            }
        }

        const effectivenessOptions = Array.isArray(this.config?.controlEffectiveness)
            ? this.config.controlEffectiveness.filter(option => option && option.value !== undefined && option.value !== null)
            : [];
        const effectivenessOrder = effectivenessOptions.map(option => String(option.value).toLowerCase());
        const effectivenessLabelMap = effectivenessOptions.reduce((acc, option) => {
            const key = String(option.value).toLowerCase();
            acc[key] = option.label || option.value;
            return acc;
        }, {});

        const controlEffectivenessCounts = activeControlsList.reduce((acc, control) => {
            const rawEffectiveness = control?.effectiveness ?? control?.efficacite ?? '';
            const normalizedEffectiveness = rawEffectiveness ? String(rawEffectiveness).toLowerCase() : '';
            const key = normalizedEffectiveness || '__undefined__';

            if (!acc[key]) {
                acc[key] = { count: 0, value: normalizedEffectiveness, rawValue: rawEffectiveness };
            }

            acc[key].count += 1;
            return acc;
        }, {});

        const controlEffectivenessDistribution = [];
        effectivenessOrder.forEach((effectivenessValue) => {
            const key = effectivenessValue || '__undefined__';
            const entry = controlEffectivenessCounts[key];

            controlEffectivenessDistribution.push({
                value: effectivenessValue,
                label: effectivenessLabelMap[effectivenessValue] || entry?.rawValue || effectivenessValue || 'Non défini',
                count: entry?.count || 0
            });

            if (entry) {
                delete controlEffectivenessCounts[key];
            }
        });

        Object.keys(controlEffectivenessCounts).forEach((key) => {
            const entry = controlEffectivenessCounts[key];
            if (!entry) {
                return;
            }

            const normalizedValue = entry.value || '';
            const label = normalizedValue
                ? (effectivenessLabelMap[normalizedValue] || entry.rawValue || normalizedValue)
                : (entry.rawValue || 'Non défini');

            controlEffectivenessDistribution.push({
                value: normalizedValue,
                label,
                count: entry.count || 0
            });
        });

        const actionPlans = Array.isArray(this.actionPlans) ? this.actionPlans : [];
        const dashboardActionPlans = actionPlans.filter(plan => this.normalizeStatusValue('actionPlan', plan?.status, plan?.statut, plan?.statusLabel) !== 'abandoned');
        const totalActionPlans = dashboardActionPlans.length;

        const statusOptions = Array.isArray(this.config?.actionPlanStatuses)
            ? this.config.actionPlanStatuses.filter(option => option && option.value !== undefined && option.value !== null)
            : [];
        const statusOrder = statusOptions.map(option => this.normalizeStatusValue('actionPlan', option.value));
        const statusLabelMap = statusOptions.reduce((acc, option) => {
            const key = this.normalizeStatusValue('actionPlan', option.value);
            acc[key] = option.label || option.value;
            return acc;
        }, {});

        const statusCounts = dashboardActionPlans.reduce((acc, plan) => {
            const rawStatus = plan?.status ?? plan?.statut ?? plan?.statusLabel ?? '';
            const rawString = rawStatus != null ? String(rawStatus).trim() : '';
            const normalizedStatus = this.normalizeStatusValue('actionPlan', rawStatus);
            const key = normalizedStatus || '__undefined__';

            if (!acc[key]) {
                acc[key] = { count: 0, value: normalizedStatus, rawValue: rawString };
            }

            acc[key].count += 1;
            return acc;
        }, {});

        const actionPlanStatusDistribution = [];

        statusOrder.forEach((statusValue) => {
            const key = statusValue || '__undefined__';
            const entry = statusCounts[key];
            const label = statusLabelMap[statusValue] || entry?.rawValue || statusValue || 'Non défini';

            actionPlanStatusDistribution.push({
                value: statusValue,
                label,
                count: entry?.count || 0
            });

            if (entry) {
                delete statusCounts[key];
            }
        });

        Object.keys(statusCounts).forEach((key) => {
            const entry = statusCounts[key];
            if (!entry) {
                return;
            }

            const normalizedValue = entry.value || '';
            const label = normalizedValue
                ? (statusLabelMap[normalizedValue] || entry.rawValue || normalizedValue)
                : (entry.rawValue || 'Non défini');

            actionPlanStatusDistribution.push({
                value: normalizedValue,
                label,
                count: entry.count || 0
            });

            delete statusCounts[key];
        });

        const actionPlanStatusMetrics = {
            total: totalActionPlans,
            distribution: actionPlanStatusDistribution
        };

        return {
            stats: { ...computedStats },
            activeControls,
            totalControls,
            controlTypeDistribution,
            controlEffectivenessDistribution,
            globalScore,
            averageReduction,
            actionPlanStatusMetrics
        };
    }

    getDashboardExportData() {
        const validatedRisks = this.getRisksByStatus('validated');
        const stats = this.calculateStats(validatedRisks);
        const metrics = this.computeDashboardMetrics(validatedRisks, stats);
        const filteredRisks = this.getFilteredRisks(Array.isArray(validatedRisks) ? validatedRisks : []);

        const enrichedRisks = filteredRisks.map(risk => {
            const netInfo = typeof getRiskNetInfo === 'function'
                ? getRiskNetInfo(risk)
                : { score: 0, brutScore: 0, coefficient: 1, label: 'Inefficace', reduction: 0 };
            return { risk, score: netInfo.score, brutScore: netInfo.brutScore, coefficient: netInfo.coefficient, label: netInfo.label, reduction: netInfo.reduction };
        }).filter(entry => Number.isFinite(entry.score));

        const topRisks = enrichedRisks
            .slice()
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (b.coefficient !== a.coefficient) return b.coefficient - a.coefficient;
                const aTitle = a.risk?.titre || a.risk?.description || '';
                const bTitle = b.risk?.titre || b.risk?.description || '';
                return aTitle.localeCompare(bTitle, 'fr', { sensitivity: 'base' });
            })
            .slice(0, 10)
            .map((entry, index) => {
                const risk = entry.risk || {};
                const subProcessRaw = risk.sousProcessus;
                const subProcessLabel = subProcessRaw && String(subProcessRaw).trim()
                    ? this.getSubProcessLabel(risk.processus, String(subProcessRaw).trim())
                    : '';
                return {
                    rank: index + 1,
                    id: risk.id,
                    titre: risk.titre || risk.description || 'Risque sans titre',
                    processus: this.getProcessLabel(risk.processus) || 'Non défini',
                    sousProcessus: subProcessLabel,
                    score: Number.isFinite(entry.score) ? entry.score : 0,
                    brutScore: Number.isFinite(entry.brutScore) ? entry.brutScore : 0,
                    reduction: Number.isFinite(entry.coefficient) ? Math.round((1 - entry.coefficient) * 100) : 0,
                    effectivenessLabel: entry.label || ''
                };
            });

        const processMetrics = filteredRisks.reduce((acc, risk) => {
            const rawLabel = risk?.processus;
            const label = rawLabel && String(rawLabel).trim()
                ? this.getProcessLabel(String(rawLabel).trim())
                : 'Non défini';
            if (!acc[label]) {
                acc[label] = { count: 0, totalScore: 0, maxScore: 0 };
            }

            const netScore = typeof getRiskNetScore === 'function'
                ? getRiskNetScore(risk)
                : (Number(risk?.probNet) || 0) * (Number(risk?.impactNet) || 0);

            acc[label].count += 1;
            if (Number.isFinite(netScore)) {
                acc[label].totalScore += netScore;
                acc[label].maxScore = Math.max(acc[label].maxScore, netScore);
            }
            return acc;
        }, {});

        const processDistribution = Object.keys(processMetrics).map(label => ({
            label,
            count: processMetrics[label].count || 0
        })).sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' });
        });

        const processSeverity = Object.entries(processMetrics).map(([label, metrics]) => {
            const count = metrics.count || 0;
            const average = count > 0 ? metrics.totalScore / count : 0;
            const maxScore = metrics.maxScore || 0;
            return { label, count, average, maxScore };
        }).sort((a, b) => {
            if (b.average !== a.average) return b.average - a.average;
            if (b.maxScore !== a.maxScore) return b.maxScore - a.maxScore;
            return a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' });
        });

        const alerts = this.getRecentAlertsData(filteredRisks);

        return {
            generatedAt: new Date().toISOString(),
            metrics,
            topRisks,
            processOverview: {
                distribution: processDistribution,
                severity: processSeverity
            },
            alerts
        };
    }

    updateKpiCards(metrics) {
        if (!metrics || !metrics.stats) return;

        const {
            stats,
            activeControls,
            controlTypeDistribution,
            controlEffectivenessDistribution,
            previous,
            actionPlanStatusMetrics
        } = metrics;
        const previousStats = previous?.stats || null;
        const previousActiveControls = previous?.activeControls ?? activeControls;
        const actionPlanMetrics = actionPlanStatusMetrics && typeof actionPlanStatusMetrics === 'object'
            ? actionPlanStatusMetrics
            : { total: 0, distribution: [] };

        const applyTrend = (element, delta, { inverted = false, stableLabel = '→ Stable', formatter } = {}) => {
            if (!element) return;

            element.classList.remove('positive', 'negative');

            if (!Number.isFinite(delta) || delta === 0) {
                const label = typeof stableLabel === 'function' ? stableLabel() : stableLabel;
                element.textContent = label;
                return;
            }

            const arrow = delta > 0 ? '↑' : '↓';
            const signedValue = `${delta > 0 ? '+' : ''}${delta}`;
            const message = formatter
                ? formatter({ arrow, signedValue, delta })
                : `${arrow} ${signedValue} vs previous snapshot`;
            element.textContent = message;

            const isPositiveChange = inverted ? delta < 0 : delta > 0;
            element.classList.add(isPositiveChange ? 'positive' : 'negative');
        };

        const updateCard = (selector, updateFn) => {
            const card = document.querySelector(selector);
            if (!card) return;
            updateFn(card);
        };

        const formatControlTypeDistribution = (distribution, total) => {
            if (!total) {
                return 'No active control';
            }

            if (!Array.isArray(distribution) || distribution.length === 0) {
                const plural = total > 1 ? 's' : '';
                return `${total} active control${plural}`;
            }

            return distribution.map((item) => {
                if (!item) {
                    return '0% of controls "Not defined"';
                }

                const percent = Number.isFinite(item.percentage)
                    ? item.percentage
                    : (total > 0 ? Math.round((Number(item.count) || 0) / total * 100) : 0);
                const label = item.label || item.value || 'Non défini';
                return `${percent}% of controls "${label}"`;
            }).join(' ; ');
        };

        const formatDetectivePreventiveSplit = (distribution, total) => {
            if (!total || !Array.isArray(distribution) || distribution.length === 0) {
                return 'No active control';
            }

            const findCount = (needle) => distribution
                .filter(item => {
                    const value = String(item?.value || '').toLowerCase();
                    const label = String(item?.label || '').toLowerCase();
                    return value === needle || label === needle;
                })
                .reduce((sum, item) => sum + (Number(item?.count) || 0), 0);

            const detectiveCount = findCount('detective');
            const preventiveCount = findCount('preventive');
            const detectivePct = Math.round((detectiveCount / total) * 100);
            const preventivePct = Math.round((preventiveCount / total) * 100);

            return `${detectivePct}% Detective vs ${preventivePct}% Preventive`;
        };

        const formatControlEffectivenessDistribution = (distribution) => {
            if (!Array.isArray(distribution) || distribution.length === 0) {
                return 'No active control';
            }

            const nonZeroDistribution = distribution.filter(item => (Number(item?.count) || 0) > 0);
            if (nonZeroDistribution.length === 0) {
                return 'No active control';
            }

            return nonZeroDistribution
                .map((item) => {
                    const count = Number(item.count) || 0;
                    const label = item.label || item.value || 'Non défini';
                    return `${count} ${label}`;
                })
                .join(' • ');
        };

        updateCard('.stat-card.danger', (card) => {
            const valueEl = card.querySelector('.stat-value');
            if (valueEl) {
                valueEl.textContent = stats.critical;
            }

            const share = stats.total > 0 ? Math.round((stats.critical / stats.total) * 100) : 0;
            const delta = stats.critical - (previousStats?.critical ?? stats.critical);
            const changeEl = card.querySelector('.stat-change');
            applyTrend(changeEl, delta, {
                inverted: true,
                stableLabel: () => `${share}% of total`,
                formatter: ({ arrow, signedValue }) => `${arrow} ${signedValue} (${share}% of total)`
            });
        });

        updateCard('.stat-card.warning', (card) => {
            const valueEl = card.querySelector('.stat-value');
            if (valueEl) {
                valueEl.textContent = stats.high;
            }

            const share = stats.total > 0 ? Math.round((stats.high / stats.total) * 100) : 0;
            const delta = stats.high - (previousStats?.high ?? stats.high);
            const changeEl = card.querySelector('.stat-change');
            applyTrend(changeEl, delta, {
                inverted: true,
                stableLabel: () => `${share}% of total`,
                formatter: ({ arrow, signedValue }) => `${arrow} ${signedValue} (${share}% of total)`
            });
        });

        updateCard('.stat-card.success', (card) => {
            const valueEl = card.querySelector('.stat-value');
            if (valueEl) {
                valueEl.textContent = formatControlEffectivenessDistribution(controlEffectivenessDistribution);
            }

            const delta = activeControls - previousActiveControls;
            const changeEl = card.querySelector('.stat-change');
            const distributionLabel = formatDetectivePreventiveSplit(controlTypeDistribution, activeControls);
            applyTrend(changeEl, delta, {
                inverted: false,
                stableLabel: () => distributionLabel,
                formatter: ({ arrow, signedValue }) => {
                    const base = `${arrow} ${signedValue} vs previous snapshot`;
                    return distributionLabel ? `${base} (${distributionLabel})` : base;
                }
            });
        });

        updateCard('.stat-card.plan-status-card', (card) => {
            const totalElement = card.querySelector('#actionPlanStatusTotal');
            const summaryElement = card.querySelector('#actionPlanStatusSummary');
            const chartCanvas = card.querySelector('#actionPlanStatusChart');

            const totalPlans = Number(actionPlanMetrics.total) || 0;
            const distribution = Array.isArray(actionPlanMetrics.distribution)
                ? actionPlanMetrics.distribution
                : [];

            if (totalElement) {
                totalElement.textContent = totalPlans > 0
                    ? `${totalPlans} action plan${totalPlans > 1 ? 's' : ''}`
                    : "Aucun plan d’action";
            }

            const palette = [
                { background: 'rgba(52, 152, 219, 0.85)', border: 'rgba(52, 152, 219, 1)' },
                { background: 'rgba(46, 204, 113, 0.85)', border: 'rgba(46, 204, 113, 1)' },
                { background: 'rgba(241, 196, 15, 0.85)', border: 'rgba(241, 196, 15, 1)' },
                { background: 'rgba(231, 76, 60, 0.85)', border: 'rgba(231, 76, 60, 1)' },
                { background: 'rgba(155, 89, 182, 0.85)', border: 'rgba(155, 89, 182, 1)' },
                { background: 'rgba(26, 188, 156, 0.85)', border: 'rgba(26, 188, 156, 1)' },
                { background: 'rgba(230, 126, 34, 0.85)', border: 'rgba(230, 126, 34, 1)' },
                { background: 'rgba(149, 165, 166, 0.85)', border: 'rgba(149, 165, 166, 1)' }
            ];

            const getColor = (index, type = 'background') => {
                const fallback = type === 'border' ? '#bdc3c7' : 'rgba(189, 195, 199, 0.6)';
                const entry = palette[index % palette.length];
                if (!entry) {
                    return fallback;
                }

                if (typeof entry === 'string') {
                    return entry;
                }

                return entry[type] || entry.background || fallback;
            };

            if (summaryElement) {
                if (totalPlans === 0 || distribution.length === 0) {
                    summaryElement.innerHTML = '<div class="plan-status-empty">Aucun plan d’action enregistré</div>';
                } else {
                    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (match) => {
                        const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
                        return entities[match] || match;
                    });

                    const summaryContent = distribution.map((item, index) => {
                        const label = escapeHtml(item?.label || 'Non défini');
                        const count = Number(item?.count) || 0;
                        const plural = count > 1 ? 'plans' : 'plan';
                        const color = getColor(index, 'border');

                        return `
                            <div class="plan-status-item">
                                <div class="plan-status-info">
                                    <span class="plan-status-color" style="background-color: ${color};"></span>
                                    <span class="plan-status-label">${label}</span>
                                </div>
                                <span class="plan-status-count">${count} ${plural}</span>
                            </div>
                        `;
                    }).join('');

                    summaryElement.innerHTML = summaryContent;
                }
            }

            if (chartCanvas && typeof Chart !== 'undefined') {
                ensureEmptyChartMessagePlugin();

                if (!this.charts) {
                    this.charts = {};
                }

                const hasData = totalPlans > 0 && distribution.some(item => (Number(item?.count) || 0) > 0);
                const chartData = {
                    labels: distribution.map(item => item?.label || 'Non défini'),
                    datasets: [
                        {
                            data: distribution.map(item => Number(item?.count) || 0),
                            backgroundColor: distribution.map((_, index) => getColor(index, 'background')),
                            borderColor: distribution.map((_, index) => getColor(index, 'border')),
                            borderWidth: hasData ? 1 : 0,
                            hoverOffset: hasData ? 6 : 0
                        }
                    ]
                };

                const chartOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: hasData,
                            callbacks: {
                                label: (context) => {
                                    const value = Number(context.raw) || 0;
                                    const plural = value > 1 ? 'plans' : 'plan';
                                    const label = context.label || 'Non défini';
                                    return `${label}: ${value} action ${plural}`;
                                }
                            }
                        },
                        emptyChartMessage: {
                            display: !hasData,
                            message: "Aucun plan d’action"
                        }
                    }
                };

                if (this.charts.actionPlanStatus) {
                    const chart = this.charts.actionPlanStatus;
                    chart.data.labels = chartData.labels;
                    chart.data.datasets = chartData.datasets;
                    chart.options = chartOptions;
                    chart.update();
                } else {
                    this.charts.actionPlanStatus = new Chart(chartCanvas, {
                        type: 'doughnut',
                        data: chartData,
                        options: chartOptions
                    });
                }
            }
        });
    }

    getRecentAlertsData(risks = this.risks) {
        const sourceRisks = Array.isArray(risks) ? risks : [];

        const formatDate = (value) => {
            if (!value) {
                return '-';
            }
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                return '-';
            }
            return date.toLocaleDateString('en-GB');
        };

        const normalizeValue = (value) => {
            if (value == null) {
                return '';
            }
            const str = String(value).trim().toLowerCase();
            if (typeof str.normalize === 'function') {
                return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            }
            return str;
        };

        const parsePlanDueDate = (value) => {
            if (value == null) {
                return null;
            }
            const raw = String(value).trim();
            if (!raw) {
                return null;
            }

            if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
                return new Date(`${raw}T00:00:00`);
            }

            if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
                const [day, month, year] = raw.split('/');
                return new Date(`${year}-${month}-${day}T00:00:00`);
            }

            const parsed = Date.parse(raw);
            if (Number.isNaN(parsed)) {
                return null;
            }
            const date = new Date(parsed);
            return Number.isNaN(date.getTime()) ? null : date;
        };

        const normalizeId = (value) => {
            if (value == null) {
                return '';
            }
            return String(value).trim();
        };

        const allActionPlans = Array.isArray(this.actionPlans) ? this.actionPlans : [];
        const actionPlanIndex = new Map();
        const riskPlanLinks = new Map();

        allActionPlans.forEach(plan => {
            if (!plan || typeof plan !== 'object') {
                return;
            }

            const planId = normalizeId(plan.id);
            if (planId) {
                actionPlanIndex.set(planId, plan);
            }

            const linkedRisks = Array.isArray(plan.risks)
                ? plan.risks
                : Array.isArray(plan.riskIds)
                    ? plan.riskIds
                    : Array.isArray(plan.actionedRisks)
                        ? plan.actionedRisks
                        : [];

            linkedRisks.forEach(riskId => {
                const normalizedRiskId = normalizeId(riskId);
                if (!normalizedRiskId) {
                    return;
                }
                if (!riskPlanLinks.has(normalizedRiskId)) {
                    riskPlanLinks.set(normalizedRiskId, new Set());
                }
                if (planId) {
                    riskPlanLinks.get(normalizedRiskId).add(planId);
                }
            });
        });

        const collectPlansForRisk = (risk) => {
            const seen = new Set();
            const plans = [];

            const addPlanById = (planId) => {
                if (!planId || seen.has(planId)) {
                    return;
                }
                seen.add(planId);
                const indexed = actionPlanIndex.get(planId);
                if (indexed) {
                    plans.push(indexed);
                }
            };

            const addPlanObject = (planObj) => {
                if (!planObj || typeof planObj !== 'object') {
                    return;
                }
                const planId = normalizeId(planObj.id);
                if (planId) {
                    if (seen.has(planId)) {
                        return;
                    }
                    seen.add(planId);
                    plans.push(actionPlanIndex.get(planId) || planObj);
                    return;
                }
                const uniqueKey = `__obj_${plans.length}`;
                if (seen.has(uniqueKey)) {
                    return;
                }
                seen.add(uniqueKey);
                plans.push(planObj);
            };

            const directRefs = Array.isArray(risk?.actionPlans) ? risk.actionPlans : [];
            directRefs.forEach(ref => {
                if (typeof ref === 'object') {
                    addPlanObject(ref);
                } else {
                    addPlanById(normalizeId(ref));
                }
            });

            const riskId = normalizeId(risk?.id);
            if (riskId && riskPlanLinks.has(riskId)) {
                riskPlanLinks.get(riskId).forEach(addPlanById);
            }

            return plans;
        };

        const severityLabels = {
            critique: 'Critical Risk',
            fort: 'High Risk',
            modere: 'Moderate Risk'
        };

        const acceptableSeverities = new Set(['modere', 'fort', 'critique']);

        const severeRisks = sourceRisks
            .map(risk => {
                const score = typeof getRiskNetScore === 'function'
                    ? getRiskNetScore(risk)
                    : (Number(risk.probNet) || 0) * (Number(risk.impactNet) || 0);

                const severity = typeof getRiskSeverityFromScore === 'function'
                    ? getRiskSeverityFromScore(score)
                    : (score >= 12 ? 'critique' : score >= 6 ? 'fort' : score >= 3 ? 'modere' : 'faible');
                const severityKey = normalizeValue(severity);
                if (!acceptableSeverities.has(severityKey)) {
                    return null;
                }

                const riskStatus = this.normalizeStatusValue(
                    'risk',
                    risk?.statut,
                    risk?.status,
                    risk?.statusLabel,
                    risk?.state
                );
                if (riskStatus !== 'validated') {
                    return null;
                }

                const associatedPlans = collectPlansForRisk(risk).filter(
                    plan => this.normalizeStatusValue('actionPlan', plan?.status, plan?.statut, plan?.statusLabel) !== 'abandoned'
                );
                const hasPlans = associatedPlans.length > 0;
                const hasDraftPlan = associatedPlans.some(
                    plan => this.normalizeStatusValue('actionPlan', plan?.status, plan?.statut, plan?.statusLabel) === 'brouillon'
                );

                if (hasPlans && !hasDraftPlan) {
                    return null;
                }

                const dateValue = risk.dateCreation || risk.date || risk.createdAt;
                return {
                    id: risk.id,
                    description: risk.description || risk.titre || 'Sans description',
                    process: this.getProcessLabel(risk.processus || risk.process) || '-',
                    level: severityLabels[severityKey] || 'Moderate',
                    severity: severityKey,
                    score,
                    date: dateValue || null,
                    formattedDate: formatDate(dateValue),
                    isBlurred: this.getRiskNumericId(risk) > this.getVisibleRiskLimit()
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                const getTime = (entry) => {
                    if (!entry.date) {
                        return 0;
                    }
                    const parsed = new Date(entry.date).getTime();
                    return Number.isNaN(parsed) ? 0 : parsed;
                };
                return getTime(b) - getTime(a);
            });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTime = today.getTime();

        const overdueActionPlans = (Array.isArray(this.actionPlans) ? this.actionPlans : [])
            .filter(plan => this.normalizeStatusValue('actionPlan', plan?.status, plan?.statut, plan?.statusLabel) !== 'abandoned')
            .map(plan => {
                const dueDate = parsePlanDueDate(plan?.dueDate);
                const statusValue = this.normalizeStatusValue('actionPlan', plan?.status, plan?.statut, plan?.statusLabel);
                const statusLabel = this.getStatusLabel('actionPlan', statusValue, plan?.statusLabel, plan?.status, plan?.statut) || '-';
                return {
                    plan,
                    dueDate,
                    statusValue,
                    statusLabel
                };
            })
            .filter(({ dueDate, statusValue }) => {
                if (!dueDate || Number.isNaN(dueDate.getTime())) {
                    return false;
                }
                if (statusValue === 'termine') {
                    return false;
                }
                return dueDate.getTime() < todayTime;
            })
            .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
            .map(({ plan, dueDate, statusLabel }) => ({
                title: plan?.title || 'Untitled plan',
                owner: plan?.owner || '-',
                statusLabel,
                dueDate: dueDate ? dueDate.toISOString() : null,
                formattedDueDate: dueDate ? dueDate.toLocaleDateString('en-GB') : (plan?.dueDate || '-'),
                id: plan?.id,
                isBlurred: Number(plan?.id) > 3
            }));

        return { severeRisks, overdueActionPlans };
    }

    updateRecentAlerts(risks = this.risks) {
        const risksBody = document.getElementById('recentAlertsRisksBody');
        const plansBody = document.getElementById('recentAlertsPlansBody');

        const { severeRisks, overdueActionPlans } = this.getRecentAlertsData(risks);

        this.updateDashboardBadge(severeRisks.length + overdueActionPlans.length);

        if (!risksBody && !plansBody) {
            return;
        }

        if (risksBody) {
            if (severeRisks.length === 0) {
                risksBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="table-empty">Aucune alerte récente</td>
                    </tr>
                `;
            } else {
                risksBody.innerHTML = severeRisks.map(risk => {
                    const badgeClassMap = {
                        critique: 'badge-danger',
                        fort: 'badge-warning',
                        modere: 'badge-info'
                    };
                    const badgeClass = badgeClassMap[risk.severity] || 'badge-warning';

                    const rowClass = risk.isBlurred ? ' class="risk-row-blurred" aria-hidden="true"' : '';
                    const disabledAttr = risk.isBlurred ? ' disabled aria-hidden="true" tabindex="-1"' : '';

                    return `
                        <tr${rowClass}>
                            <td>${risk.formattedDate}</td>
                            <td>${risk.description}</td>
                            <td>${risk.process}</td>
                            <td><span class="table-badge ${badgeClass}">${risk.level}</span></td>
                            <td class="table-actions-cell">
                                <div class="table-actions">
                                    <button class="action-btn" onclick='rms.selectRisk(${JSON.stringify(risk.id)})'${disabledAttr}>👁️</button>
                                    <button class="action-btn" onclick='rms.editRisk(${JSON.stringify(risk.id)})'${disabledAttr}>✏️</button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        if (plansBody) {
            if (overdueActionPlans.length === 0) {
                plansBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="table-empty">No overdue action plan</td>
                    </tr>
                `;
            } else {
                plansBody.innerHTML = overdueActionPlans.map(plan => {
                    const rowClass = plan.isBlurred ? ' class="action-plan-row-blurred" aria-hidden="true"' : '';
                    return `
                        <tr${rowClass}>
                            <td>${plan.title}</td>
                            <td>${plan.owner || '-'}</td>
                            <td>${plan.formattedDueDate}</td>
                            <td>${plan.statusLabel}</td>
                        </tr>
                    `;
                }).join('');
            }
        }
    }

    updateDashboardBadge(count = 0) {
        const dashboardBadge = document.querySelector('.tabs-container .tab .tab-badge');
        if (!dashboardBadge) {
            return;
        }

        const numericCount = Number(count);
        const safeCount = Number.isFinite(numericCount) ? Math.max(0, Math.trunc(numericCount)) : 0;
        dashboardBadge.textContent = String(safeCount);
    }

    calculateStats(risks = this.risks) {
        const sourceRisks = Array.isArray(risks) ? risks : [];
        const stats = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            total: sourceRisks.length
        };

        sourceRisks.forEach(risk => {
            const score = typeof getRiskNetScore === 'function'
                ? getRiskNetScore(risk)
                : (Number(risk?.probNet) || 0) * (Number(risk?.impactNet) || 0);
            if (score > 12) stats.critical++;
            else if (score > 8) stats.high++;
            else if (score > 4) stats.medium++;
            else stats.low++;
        });

        return stats;
    }

    updateCharts(risks = this.risks, stats = null) {
        const baseRisks = Array.isArray(risks) ? risks : [];
        const filteredRisks = this.getFilteredRisks(baseRisks);

        const topRisksBody = document.getElementById('topRisksTableBody');
        const topRisksContent = document.getElementById('topRisksContent');
        if (topRisksBody && topRisksContent) {
            const enrichedRisks = filteredRisks.map(risk => {
                const netInfo = typeof getRiskNetInfo === 'function'
                    ? getRiskNetInfo(risk)
                    : { score: 0, brutScore: 0, coefficient: 1, reduction: 0, label: 'Inefficace' };
                return { risk, score: netInfo.score, brutScore: netInfo.brutScore, coefficient: netInfo.coefficient, reduction: netInfo.reduction, label: netInfo.label };
            }).filter(entry => Number.isFinite(entry.score));

            const visibleRiskIds = this.getVisibleRiskIdSet(filteredRisks);
            const topRisks = enrichedRisks.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (b.coefficient !== a.coefficient) return b.coefficient - a.coefficient;
                const aTitle = a.risk?.titre || a.risk?.description || '';
                const bTitle = b.risk?.titre || b.risk?.description || '';
                return aTitle.localeCompare(bTitle, 'fr', { sensitivity: 'base' });
            }).slice(0, 10);

            if (!topRisks.length) {
                topRisksBody.innerHTML = '';
                topRisksContent.classList.add('is-empty');
            } else {
                topRisksContent.classList.remove('is-empty');
                topRisksBody.innerHTML = topRisks.map((entry, index) => {
                    const risk = entry.risk || {};
                    const rank = index + 1;
                    const title = risk.titre || risk.description || 'Risque sans titre';
                    const processLabel = this.getProcessLabel(risk.processus) || 'Non défini';
                    const subProcessRaw = risk.sousProcessus;
                    const subProcessLabel = subProcessRaw && String(subProcessRaw).trim()
                        ? this.getSubProcessLabel(risk.processus, String(subProcessRaw).trim())
                        : '—';
                    const scoreLabel = Number.isFinite(entry.score)
                        ? entry.score.toLocaleString('fr-FR')
                        : '0';
                    const brutLabel = Number.isFinite(entry.brutScore)
                        ? entry.brutScore.toLocaleString('fr-FR')
                        : '0';
                    const reductionLabel = `${entry.reduction ?? 0}%${entry.label ? ` (${entry.label})` : ''}`;
                    const meta = `Brut ${brutLabel} → Net ${scoreLabel} • Réduction ${reductionLabel}`;
                    const isBlurred = !visibleRiskIds.has(String(risk?.id));
                    const rowClass = isBlurred ? ' class="risk-row-blurred" aria-hidden="true"' : '';

                    return `
                        <tr${rowClass}>
                            <td>${rank}</td>
                            <td>
                                <span class="top-risk-title">${title}</span>
                                <span class="top-risk-meta">${meta}</span>
                            </td>
                            <td class="top-risk-process">${processLabel}</td>
                            <td class="top-risk-subprocess">${subProcessLabel}</td>
                            <td class="top-risk-score">${scoreLabel}</td>
                        </tr>
                    `;
                }).join('');
            }
        }

        if (this.charts && this.charts.evolution) {
            try {
                if (typeof this.charts.evolution.destroy === 'function') {
                    this.charts.evolution.destroy();
                }
            } catch (error) {
                console.warn('Erreur lors de la destruction du graphique d\'évolution :', error);
            }
            delete this.charts.evolution;
        }

        if (typeof Chart === 'undefined') {
            return;
        }

        ensureEmptyChartMessagePlugin();

        if (!this.charts) {
            this.charts = {};
        }

        const scoreMode = this.processScoreMode === 'brut' ? 'brut' : 'net';
        const scoreKeyMap = {
            brut: { prob: 'probBrut', impact: 'impactBrut' }
        };

        const processMetrics = filteredRisks.reduce((acc, risk) => {
            const rawLabel = risk?.processus;
            const label = rawLabel && String(rawLabel).trim() ? String(rawLabel).trim() : 'Non défini';
            if (!acc[label]) {
                acc[label] = { count: 0, scores: [], maxScore: 0 };
            }

            acc[label].count += 1;

            let score = 0;
            if (scoreMode === 'brut') {
                const probKey = scoreKeyMap.brut.prob;
                const impactKey = scoreKeyMap.brut.impact;
                const baseProb = Number(risk?.[probKey]) || 0;
                const impact = Number(risk?.[impactKey]) || 0;
                const coefficient = typeof getRiskAggravatingCoefficient === 'function'
                    ? getRiskAggravatingCoefficient(risk)
                    : 1;
                score = baseProb * coefficient * impact;
            } else {
                score = typeof getRiskNetScore === 'function'
                    ? getRiskNetScore(risk)
                    : (Number(risk?.probNet) || 0) * (Number(risk?.impactNet) || 0);
            }

            if (Number.isFinite(score)) {
                acc[label].scores.push(score);
                acc[label].maxScore = Math.max(acc[label].maxScore, score);
            }

            return acc;
        }, {});

        const computeMedian = (values) => {
            if (!Array.isArray(values) || values.length === 0) {
                return 0;
            }

            const sorted = values
                .filter(value => Number.isFinite(value))
                .sort((a, b) => a - b);

            if (!sorted.length) {
                return 0;
            }

            const middle = Math.floor(sorted.length / 2);
            if (sorted.length % 2 === 0) {
                return (sorted[middle - 1] + sorted[middle]) / 2;
            }
            return sorted[middle];
        };

        const combinedCanvas = document.getElementById('processCombinedChart');
        const summaryElement = document.getElementById('processChartSummary');
        const scoreModeSelect = document.getElementById('processScoreMode');
        if (scoreModeSelect && scoreModeSelect.value !== scoreMode) {
            scoreModeSelect.value = scoreMode;
        }

        if (combinedCanvas || summaryElement) {
            const entries = Object.entries(processMetrics).map(([label, metrics]) => {
                const median = computeMedian(metrics.scores);
                return {
                    label,
                    count: metrics.count || 0,
                    median,
                    maxScore: metrics.maxScore || 0
                };
            });

            const sortedEntries = entries.slice().sort((a, b) => {
                if (b.count !== a.count) return b.count - a.count;
                if (b.median !== a.median) return b.median - a.median;
                return a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' });
            });

            if (combinedCanvas) {
                const totalCount = sortedEntries.reduce((sum, entry) => sum + entry.count, 0);
                const hasProcessData = sortedEntries.some(entry => entry.count > 0);
                const maxVisibleProcesses = 8;
                const visibleEntries = sortedEntries.slice(0, maxVisibleProcesses);
                const hiddenEntries = sortedEntries.slice(maxVisibleProcesses);

                if (hiddenEntries.length > 0) {
                    const hiddenCount = hiddenEntries.reduce((sum, entry) => sum + entry.count, 0);
                    const hiddenMedians = hiddenEntries
                        .map((entry) => Number(entry.median))
                        .filter((value) => Number.isFinite(value));
                    const hiddenMedian = hiddenMedians.length
                        ? hiddenMedians.reduce((sum, value) => sum + value, 0) / hiddenMedians.length
                        : 0;

                    visibleEntries.push({
                        label: `Others (${hiddenEntries.length})`,
                        count: hiddenCount,
                        median: hiddenMedian,
                        maxScore: hiddenEntries.reduce((max, entry) => Math.max(max, entry.maxScore || 0), 0)
                    });
                }

                const labels = visibleEntries.map(entry => {
                    const normalized = String(entry.label || '').trim();
                    if (!normalized) {
                        return 'Non défini';
                    }
                    return normalized.length > 44 ? `${normalized.slice(0, 43).trim()}…` : normalized;
                });
                const counts = visibleEntries.map(entry => entry.count);
                const metadata = visibleEntries.map(entry => ({
                    ...entry,
                    share: totalCount > 0 ? entry.count / totalCount : 0
                }));

                const combinedData = {
                    labels,
                    datasets: [
                        {
                            type: 'bar',
                            label: 'Nombre de risques',
                            data: counts,
                            backgroundColor: counts.map(() => 'rgba(52, 152, 219, 0.65)'),
                            borderColor: counts.map(() => 'rgba(52, 152, 219, 1)'),
                            borderWidth: hasProcessData ? 1.5 : 0,
                            borderRadius: 6,
                            maxBarThickness: 28,
                            minBarLength: 2,
                            metadata
                        }
                    ]
                };

                const combinedOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    interaction: {
                        mode: 'nearest',
                        intersect: true
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Nombre de risques'
                            },
                            ticks: {
                                precision: 0
                            },
                            grid: {
                                color: 'rgba(148, 163, 184, 0.18)'
                            }
                        },
                        y: {
                            ticks: {
                                maxRotation: 0,
                                minRotation: 0,
                                font: {
                                    size: 11
                                }
                            },
                            grid: {
                                display: false
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false,
                            position: 'bottom'
                        },
                        tooltip: {
                            mode: 'nearest',
                            intersect: true,
                            callbacks: {
                                title: (items) => {
                                    if (!Array.isArray(items) || items.length === 0) {
                                        return '';
                                    }
                                    const index = items[0]?.dataIndex;
                                    const entry = metadata[index];
                                    return entry?.label || items[0]?.label || '';
                                },
                                label: (context) => {
                                    const entry = context?.dataset?.metadata?.[context.dataIndex];
                                    const value = Number(context.raw) || 0;
                                    const plural = value > 1 ? 'risques' : 'risque';
                                    const share = entry ? Math.round(entry.share * 100) : (totalCount > 0 ? Math.round((value / totalCount) * 100) : 0);
                                    const scoreDescriptor = scoreMode === 'brut' ? 'brut' : 'net';
                                    const formattedMedian = Number(entry?.median || 0).toFixed(1).replace('.', ',');
                                    return `${value} ${plural} (${share}%) • Score ${scoreDescriptor} médian : ${formattedMedian}`;
                                }
                            }
                        },
                        emptyChartMessage: {
                            display: !hasProcessData,
                            message: 'Aucun risque à afficher'
                        }
                    }
                };

                if (this.charts.processSeverity) {
                    try {
                        if (typeof this.charts.processSeverity.destroy === 'function') {
                            this.charts.processSeverity.destroy();
                        }
                    } catch (error) {
                        console.warn('Error while destroying process severity chart:', error);
                    }
                    delete this.charts.processSeverity;
                }

                if (this.charts.process) {
                    const chart = this.charts.process;
                    chart.data.labels = combinedData.labels;
                    chart.data.datasets = combinedData.datasets;
                    chart.options = combinedOptions;
                    chart.update();
                } else {
                    this.charts.process = new Chart(combinedCanvas, {
                        type: 'bar',
                        data: combinedData,
                        options: combinedOptions
                    });
                }
            }

            if (summaryElement) {
                const totalCount = sortedEntries.reduce((sum, entry) => sum + entry.count, 0);
                const nonZeroEntries = sortedEntries.filter(entry => entry.count > 0);
                const formatScore = (value) => Number(value || 0).toFixed(1).replace('.', ',');
                const scoreDescriptor = scoreMode === 'brut' ? 'brut' : 'net';

                if (!totalCount || nonZeroEntries.length === 0) {
                    summaryElement.textContent = 'Aucun risque filtré à analyser.';
                } else if (nonZeroEntries.length === 1) {
                    const [top] = nonZeroEntries;
                    summaryElement.textContent = `Le processus ${top.label} représente 100 % des risques filtrés avec un score ${scoreDescriptor} médian de ${formatScore(top.median)}.`;
                } else {
                    const [first, second] = nonZeroEntries;
                    const share = Math.round(((first.count + second.count) / totalCount) * 100);
                    summaryElement.textContent = `Les processus ${first.label} et ${second.label} représentent ${share} % des risques filtrés avec des scores ${scoreDescriptor} médians de ${formatScore(first.median)} et ${formatScore(second.median)}.`;
                }
            }
        }

    }

    // Risk list functions
    updateRisksList() {
        const tbody = document.getElementById('risksTableBody');
        if (!tbody) return;

        const allRisks = Array.isArray(this.risks) ? this.risks : [];
        const filteredRisks = this.getFilteredRisks(allRisks);

        const buildLabelMap = (list) => {
            return (Array.isArray(list) ? list : []).reduce((acc, item) => {
                if (!item || item.value === undefined || item.value === null) {
                    return acc;
                }
                const rawValue = String(item.value);
                const label = item.label || rawValue;
                acc[rawValue] = label;
                acc[rawValue.toLowerCase()] = label;
                return acc;
            }, {});
        };

        const typeMap = buildLabelMap(this.config?.riskTypes);
        const themeMap = buildLabelMap(this.config?.riskThemes);
        const tierMap = buildLabelMap(this.config?.tiers);
        const entityMap = buildLabelMap(this.config?.countries);

        const resolveLabel = (map, value) => {
            if (value == null) {
                return value;
            }
            const rawValue = String(value);
            return map[rawValue] || map[rawValue.toLowerCase()] || value;
        };
        const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (match) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match]));
        const hashLabel = (label = '') => {
            return Array.from(String(label)).reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
        };
        const renderColorChip = (label, fallback = '—') => {
            const chipLabel = String(label || fallback);
            const hue = Math.abs(hashLabel(chipLabel)) % 360;
            const style = `--chip-color: hsl(${hue} 70% 45%);`;
            return `<span class="risk-register-chip" style="${style}">${escapeHtml(chipLabel)}</span>`;
        };
        const renderChipList = (labels, fallback = '—') => {
            const items = (Array.isArray(labels) ? labels : []).filter(Boolean);
            if (!items.length) {
                return `<span class="risk-register-chip-list">${renderColorChip(fallback, fallback)}</span>`;
            }
            return `<span class="risk-register-chip-list">${items.map(item => renderColorChip(item)).join('')}</span>`;
        };
        const getSeverityClassFromScore = (score) => {
            if (!Number.isFinite(score)) {
                return 'na';
            }
            if (score >= 12) return 'critical';
            if (score >= 6) return 'high';
            if (score >= 3) return 'medium';
            return 'low';
        };
        const renderScoreCircle = (label, score, title = '') => {
            const severityClass = getSeverityClassFromScore(score);
            const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
            return `<span class="risk-score-circle ${severityClass}"${titleAttr}>${escapeHtml(label)}</span>`;
        };

        if (!allRisks.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="13" class="table-empty">No risk recorded</td>
                </tr>
            `;
            this.updateRiskRegisterSortIndicators();
            return;
        }

        if (!filteredRisks.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="13" class="table-empty">No risk matches the filters</td>
                </tr>
            `;
            this.updateRiskRegisterSortIndicators();
            return;
        }

        const actionPlanList = Array.isArray(this.actionPlans) ? this.actionPlans : [];
        const actionPlanIndex = actionPlanList.reduce((acc, plan) => {
            if (!plan || plan.id == null) {
                return acc;
            }
            acc[String(plan.id)] = plan;
            return acc;
        }, {});

        const visibleRiskIds = this.getVisibleRiskIdSet(filteredRisks);

        const rows = filteredRisks.map(risk => {
            const normalizedBrut = (Number(risk?.probBrut) || 0) * (Number(risk?.impactBrut) || 0);
            const brutScore = typeof getRiskBrutScore === 'function'
                ? getRiskBrutScore(risk)
                : normalizedBrut;
            const netInfo = typeof getRiskNetInfo === 'function'
                ? getRiskNetInfo(risk)
                : { score: (Number(risk?.probNet) || 0) * (Number(risk?.impactNet) || 0), coefficient: 1, reduction: 0, label: '' };
            const riskStatusValue = this.normalizeStatusValue(
                'risk',
                risk?.statut,
                risk?.status,
                risk?.statusLabel,
                risk?.state
            );
            const isNotIncluded = riskStatusValue === 'not-included';
            const grossScore = isNotIncluded
                ? null
                : (Number.isFinite(netInfo.baseBrutScore) ? netInfo.baseBrutScore : normalizedBrut);
            const aggravatedScore = isNotIncluded
                ? null
                : (Number.isFinite(netInfo.brutScore) ? netInfo.brutScore : brutScore);
            const netScore = isNotIncluded ? null : netInfo.score;
            const grossLabel = Number.isFinite(grossScore)
                ? grossScore.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
                : 'N/A';
            const aggravatedLabel = Number.isFinite(aggravatedScore)
                ? aggravatedScore.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
                : 'N/A';
            const netLabel = Number.isFinite(netScore)
                ? netScore.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
                : 'N/A';
            const reductionPercent = Number.isFinite(netInfo.reduction)
                ? netInfo.reduction
                : Math.round((1 - (netInfo.coefficient || 1)) * 100);
            const reductionLabel = `${reductionPercent}%`;
            const effectivenessLabel = netInfo.label ? ` (${netInfo.label})` : '';

            const typeLabel = resolveLabel(typeMap, risk.typeCorruption);
            const themeLabel = resolveLabel(themeMap, risk.riskTheme || 'corruption') || 'Non défini';
            const entityLabels = Array.isArray(risk.paysExposes)
                ? risk.paysExposes.map(entity => resolveLabel(entityMap, entity))
                : [];
            const tierLabels = Array.isArray(risk.tiers)
                ? risk.tiers.map(tier => resolveLabel(tierMap, tier))
                : [];
            const riskStatusLabel = this.getStatusLabel('risk', riskStatusValue, risk?.statusLabel, risk?.status, risk?.statut);
            const riskBadgeClass = riskStatusValue === 'validated'
                ? 'success'
                : (riskStatusValue === 'archive' ? 'danger' : 'warning');
            const processLabel = this.getProcessLabel(risk.processus) || '';
            const subProcessLabel = this.getSubProcessLabel(risk.processus, risk.sousProcessus) || '';
            const processSortLabel = [processLabel, subProcessLabel].filter(Boolean).join(' / ').toLowerCase();
            const processChipLabels = [processLabel, subProcessLabel].filter(Boolean);
            const actionPlanRefs = Array.isArray(risk?.actionPlans) ? risk.actionPlans : [];
            const actionPlanNames = actionPlanRefs.map(ref => {
                if (ref && typeof ref === 'object') {
                    return ref.name || ref.title || ref.id || '';
                }
                const indexed = actionPlanIndex[String(ref)];
                return indexed?.name || indexed?.title || ref || '';
            }).filter(Boolean);
            const actionPlansLabel = actionPlanNames.length
                ? actionPlanNames.join(', ')
                : '—';
            const isBlurred = !visibleRiskIds.has(String(risk?.id));
            const rowClass = isBlurred ? ' class="risk-row-blurred" aria-hidden="true"' : '';
            const actionTitle = isBlurred ? '' : ` title="${escapeHtml(actionPlansLabel)}"`;
            const disabledAttr = isBlurred ? ' disabled aria-hidden="true" tabindex="-1"' : '';

            return {
                risk,
                idScore: Number(risk?.id) || 0,
                processScore: processSortLabel,
                grossScore: Number.isFinite(grossScore) ? Number(grossScore) : null,
                aggravatedScore: Number.isFinite(aggravatedScore) ? Number(aggravatedScore) : null,
                netScore: Number.isFinite(netScore) ? Number(netScore) : null,
                html: `
                <tr${rowClass}>
                    <td>#${risk.id}</td>
                    <td class="risk-description-cell">
                        <div class="risk-register-title">${escapeHtml(risk.titre || risk.description || 'Sans titre')}</div>
                        <div class="risk-register-description">${escapeHtml(risk.description || '—')}</div>
                    </td>
                    <td>${renderChipList(processChipLabels)}</td>
                    <td>${renderColorChip(themeLabel, 'Non défini')}</td>
                    <td>${escapeHtml(typeLabel || 'Non défini')}</td>
                    <td>${renderChipList(entityLabels)}</td>
                    <td>${renderChipList(tierLabels)}</td>
                    <td>${renderScoreCircle(grossLabel, grossScore)}</td>
                    <td>${renderScoreCircle(aggravatedLabel, aggravatedScore)}</td>
                    <td>${renderScoreCircle(netLabel, netScore, `Reduction ${reductionLabel}${effectivenessLabel}`)}</td>
                    <td${actionTitle}>${actionPlansLabel}</td>
                    <td><span class="table-badge badge-${riskBadgeClass}">${riskStatusLabel || 'Non défini'}</span></td>
                    <td class="table-actions-cell">
                        <div class="table-actions">
                            <button class="action-btn" title="Dupliquer" onclick='rms.duplicateRisk(${JSON.stringify(risk.id)})'${disabledAttr}>📄</button>
                            <button class="action-btn" onclick='rms.editRisk(${JSON.stringify(risk.id)})'${disabledAttr}>✏️</button>
                            <button class="action-btn" onclick='rms.deleteRisk(${JSON.stringify(risk.id)})'${disabledAttr}>🗑️</button>
                        </div>
                    </td>
                </tr>
            `
            };
        });

        const sortState = this.riskRegisterSort || { key: '', direction: 'desc' };
        const sortedRows = rows.slice();
        if (sortState.key) {
            const multiplier = sortState.direction === 'asc' ? 1 : -1;
            sortedRows.sort((a, b) => {
                const metricKey = `${sortState.key}Score`;
                const aValue = a[metricKey];
                const bValue = b[metricKey];
                if (sortState.key === 'process') {
                    return String(aValue || '').localeCompare(String(bValue || ''), 'fr', { sensitivity: 'base' }) * multiplier;
                }
                if (aValue == null && bValue == null) {
                    return 0;
                }
                if (aValue == null) {
                    return 1;
                }
                if (bValue == null) {
                    return -1;
                }
                return (aValue - bValue) * multiplier;
            });
        }

        tbody.innerHTML = sortedRows.map(entry => entry.html).join('');
        this.updateRiskRegisterSortIndicators();
    }

    // Controls functions
    getFilteredControls() {
        const controls = Array.isArray(this.controls) ? this.controls : [];
        const { type = '', search = '' } = this.controlFilters || {};

        const typeFilter = String(type || '').toLowerCase();
        const searchTerm = String(search || '').trim().toLowerCase();

        if (!typeFilter && !searchTerm) {
            return controls.slice();
        }

        return controls.filter(control => {
            const controlType = String(control?.type || '').toLowerCase();
            const controlName = String(control?.name || '').toLowerCase();
            const controlOwner = String(control?.owner || '').toLowerCase();

            if (typeFilter && controlType !== typeFilter) {
                return false;
            }

            if (searchTerm && !controlName.includes(searchTerm) && !controlOwner.includes(searchTerm)) {
                return false;
            }

            return true;
        });
    }

    updateControlsList() {
        const container = document.getElementById('controlsList');
        if (!container) return;

        const allControls = Array.isArray(this.controls) ? this.controls : [];
        const filteredControls = this.getFilteredControls();

        if (!allControls.length) {
            container.innerHTML = `
                <div class="controls-empty-state">
                    <div class="controls-empty-title">No control recorded</div>
                    <div class="controls-empty-text">Add your first control to track your mitigation measures.</div>
                    <button class="btn btn-secondary" onclick="addNewControl()">+ Add a control</button>
                </div>
            `;
            return;
        }

        if (!filteredControls.length) {
            container.innerHTML = `
                <div class="controls-empty-state">
                    <div class="controls-empty-title">No control matches the filters</div>
                    <div class="controls-empty-text">Adjust your filters or reset them to display available controls.</div>
                </div>
            `;
            return;
        }

        const typeMap = (this.config.controlTypes || []).reduce((acc, item) => {
            if (item && item.value !== undefined && item.value !== null) {
                acc[String(item.value).toLowerCase()] = item.label || item.value;
            }
            return acc;
        }, {});

        const effectivenessMap = (this.config.controlEffectiveness || []).reduce((acc, item) => {
            if (item && item.value !== undefined && item.value !== null) {
                acc[String(item.value).toLowerCase()] = item.label || item.value;
            }
            return acc;
        }, {});

        container.innerHTML = filteredControls.map(control => {
            const controlName = control?.name || 'Contrôle sans nom';
            const rawType = control?.type ?? '';
            const normalizedType = rawType ? String(rawType).toLowerCase() : '';
            const typeLabel = normalizedType ? (typeMap[normalizedType] || rawType) : 'Non défini';
            const typeClass = normalizedType ? normalizedType.replace(/[^a-z0-9-]+/g, '-') : 'type-undefined';
            const ownerLabel = control?.owner || '';
            const rawEffectiveness = control?.effectiveness ?? '';
            const normalizedEffectiveness = rawEffectiveness ? String(rawEffectiveness).toLowerCase() : '';
            const effectivenessLabel = normalizedEffectiveness
                ? (effectivenessMap[normalizedEffectiveness] || rawEffectiveness)
                : '';

            return `
                <div class="controls-table-row" data-control-id="${control.id}">
                    <div class="controls-table-cell control-name-cell">
                        <div class="control-name" title="${controlName}">${controlName}</div>
                    </div>
                    <div class="controls-table-cell control-type-cell">
                        <span class="control-type-badge ${typeClass}">${typeLabel}</span>
                    </div>
                    <div class="controls-table-cell control-owner-cell">
                        ${ownerLabel ? `<span class="control-owner">${ownerLabel}</span>` : `<span class="text-placeholder">Not defined</span>`}
                    </div>
                    <div class="controls-table-cell control-effectiveness-cell">
                        ${effectivenessLabel ? `<span class="control-status-badge">${effectivenessLabel}</span>` : `<span class="text-placeholder">Not defined</span>`}
                    </div>
                    <div class="controls-table-cell controls-table-actions">
                        <button class="action-btn" onclick="editControl(${control.id})" title="Edit">✏️</button>
                        <button class="action-btn" onclick="deleteControl(${control.id})" title="Delete">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Action Plans functions
    getFilteredActionPlans() {
        const plans = Array.isArray(this.actionPlans) ? this.actionPlans : [];
        const {
            status = '',
            name = '',
            owner = '',
            dueDateOrder = ''
        } = this.actionPlanFilters || {};

        const statusFilter = this.normalizeStatusValue('actionPlan', status);
        const nameFilter = String(name || '').trim().toLowerCase();
        const ownerFilter = String(owner || '').trim().toLowerCase();
        const dueDateOrderFilter = String(dueDateOrder || '').toLowerCase();

        const filteredPlans = plans.filter(plan => {
            const planStatus = this.normalizeStatusValue('actionPlan', plan?.status, plan?.statut, plan?.statusLabel);
            if (statusFilter && planStatus !== statusFilter) {
                return false;
            }

            if (nameFilter) {
                const planTitle = plan?.title != null ? String(plan.title).toLowerCase() : '';
                const planId = plan?.id != null ? String(plan.id).toLowerCase() : '';
                if (!planTitle.includes(nameFilter) && !planId.includes(nameFilter)) {
                    return false;
                }
            }

            if (ownerFilter) {
                const planOwner = plan?.owner != null ? String(plan.owner).toLowerCase() : '';
                if (!planOwner.includes(ownerFilter)) {
                    return false;
                }
            }

            return true;
        });

        if (dueDateOrderFilter === 'asc' || dueDateOrderFilter === 'desc') {
            const direction = dueDateOrderFilter === 'asc' ? 1 : -1;

            const parseDueDateValue = (value) => {
                const rawValue = value != null ? String(value).trim() : '';
                if (!rawValue) {
                    return null;
                }

                let date = null;
                if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
                    date = new Date(`${rawValue}T00:00:00`);
                } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawValue)) {
                    const [day, month, year] = rawValue.split('/');
                    date = new Date(`${year}-${month}-${day}T00:00:00`);
                } else {
                    const parsed = Date.parse(rawValue);
                    if (!Number.isNaN(parsed)) {
                        date = new Date(parsed);
                    }
                }

                if (!date || Number.isNaN(date.getTime())) {
                    return null;
                }

                return date.getTime();
            };

            filteredPlans.sort((a, b) => {
                const aTime = parseDueDateValue(a?.dueDate);
                const bTime = parseDueDateValue(b?.dueDate);

                if (aTime === null && bTime === null) {
                    return 0;
                }
                if (aTime === null) {
                    return 1;
                }
                if (bTime === null) {
                    return -1;
                }

                return direction === 1 ? aTime - bTime : bTime - aTime;
            });
        }

        return filteredPlans;
    }

    updateActionPlansList() {
        const container = document.getElementById('actionPlansList');
        if (!container) return;

        const allPlans = Array.isArray(this.actionPlans) ? this.actionPlans : [];
        const filteredPlans = this.getFilteredActionPlans();

        if (!allPlans.length) {
            container.innerHTML = `
                <div class="controls-empty-state">
                    <div class="controls-empty-title">Aucun plan d’action enregistré</div>
                    <div class="controls-empty-text">Create your first plan to manage corrective actions.</div>
                    <button class="btn btn-secondary" onclick="addNewActionPlan()">+ Add a plan</button>
                </div>
            `;
            return;
        }

        if (!filteredPlans.length) {
            container.innerHTML = `
                <div class="controls-empty-state">
                    <div class="controls-empty-title">No plan matches the filters</div>
                    <div class="controls-empty-text">Adjust your search or reset filters to display available plans.</div>
                </div>
            `;
            return;
        }

        const statusMap = (this.config.actionPlanStatuses || []).reduce((acc, item) => {
            if (item && item.value !== undefined && item.value !== null) {
                const normalizedValue = this.normalizeStatusValue('actionPlan', item.value);
                acc[normalizedValue] = item.label || item.value;
            }
            return acc;
        }, {});

        const formatDueDate = (value) => {
            const rawValue = value != null ? String(value).trim() : '';
            if (!rawValue) {
                return '';
            }

            if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
                const [year, month, day] = rawValue.split('-');
                return `${day}/${month}/${year}`;
            }

            if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawValue)) {
                return rawValue;
            }

            return rawValue;
        };

        container.innerHTML = filteredPlans.map((plan, index) => {
            const planTitle = plan?.title || 'Untitled plan';
            const rawStatus = plan?.status ?? plan?.statut ?? plan?.statusLabel ?? '';
            const normalizedStatus = this.normalizeStatusValue('actionPlan', rawStatus);
            const statusLabel = normalizedStatus
                ? (statusMap[normalizedStatus] || this.getStatusLabel('actionPlan', normalizedStatus, rawStatus) || rawStatus)
                : '';
            const statusClass = normalizedStatus ? normalizedStatus.replace(/[^a-z0-9-]+/g, '-') : '';
            const ownerLabel = plan?.owner ? String(plan.owner) : '';
            const dueDateLabel = formatDueDate(plan?.dueDate);
            const isBlurred = Number(plan?.id) > 3;
            const rowClass = `controls-table-row${isBlurred ? ' action-plan-row-blurred' : ''}`;
            const rowAttributes = isBlurred ? ' aria-hidden="true"' : '';
            const disabledAttr = isBlurred ? ' disabled aria-hidden="true" tabindex="-1"' : '';

            return `
                <div class="${rowClass}" data-plan-id="${escapeHtml(plan.id)}"${rowAttributes}>
                    <div class="controls-table-cell control-name-cell">
                        <div class="control-name" title="${escapeHtml(planTitle)}">${escapeHtml(planTitle)}</div>
                    </div>
                    <div class="controls-table-cell control-owner-cell">
                        ${ownerLabel ? `<span class="control-owner">${escapeHtml(ownerLabel)}</span>` : `<span class="text-placeholder">Not defined</span>`}
                    </div>
                    <div class="controls-table-cell control-due-date-cell">
                        ${dueDateLabel ? `<span class="control-due-date">${escapeHtml(dueDateLabel)}</span>` : `<span class="text-placeholder">Not defined</span>`}
                    </div>
                    <div class="controls-table-cell control-status-cell">
                        ${statusLabel ? `<span class="control-status-badge ${statusClass}">${escapeHtml(statusLabel)}</span>` : `<span class="text-placeholder">Not defined</span>`}
                    </div>
                    <div class="controls-table-cell controls-table-actions">
                        <button class="action-btn" onclick="editActionPlan(${plan.id})" title="Edit"${disabledAttr}>✏️</button>
                        <button class="action-btn" onclick="deleteActionPlan(${plan.id})" title="Delete"${disabledAttr}>🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // History functions
    updateHistory() {
        const container = document.getElementById('historyTimeline');
        if (!container) return;
        
        const recentHistory = this.history.slice(-10).reverse();
        
        container.innerHTML = recentHistory.map(item => `
            <div class="timeline-item">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <div class="timeline-date">${new Date(item.date).toLocaleString('fr-FR')}</div>
                    <div class="timeline-title">${item.action}</div>
                    <div class="timeline-description">${item.description}</div>
                </div>
            </div>
        `).join('');
    }

    addHistoryItem(action, description) {
        this.history.push({
            id: Date.now(),
            date: new Date().toISOString(),
            action,
            description,
            user: 'Système'
        });
        this.saveData();
        this.updateHistory();
    }

    // Interview management
    refreshProcessColorMap() {
        if (!(this.processColorMap instanceof Map)) {
            this.processColorMap = new Map();
        } else {
            this.processColorMap.clear();
        }

        const processes = Array.isArray(this.config?.processes) ? this.config.processes : [];
        const paletteSize = 8;

        processes.forEach((process, index) => {
            const value = process?.value;
            if (!value) {
                return;
            }
            const colorClass = `process-color-${index % paletteSize}`;
            this.processColorMap.set(value, colorClass);
        });
    }

    getProcessColorClass(processValue) {
        if (!processValue) {
            return 'process-color-0';
        }

        if (this.processColorMap instanceof Map && this.processColorMap.has(processValue)) {
            return this.processColorMap.get(processValue);
        }

        return 'process-color-0';
    }

    getProcessLabel(processValue) {
        if (!processValue) {
            return '';
        }

        const processes = Array.isArray(this.config?.processes) ? this.config.processes : [];
        const match = processes.find(process => process && process.value === processValue);
        if (match) {
            return match.label || match.value || processValue;
        }

        return processValue;
    }

    getSubProcessLabel(processValue, subProcessValue) {
        if (!processValue || !subProcessValue) {
            return subProcessValue || '';
        }

        const subProcesses = this.config?.subProcesses?.[processValue];
        if (!Array.isArray(subProcesses)) {
            return subProcessValue;
        }

        const match = subProcesses.find(subProcess => subProcess && subProcess.value === subProcessValue);
        if (match) {
            return match.label || match.value || subProcessValue;
        }

        return subProcessValue;
    }

    getAllKnownReferents() {
        const referentSet = new Set(this.collectAllReferents());

        if (Array.isArray(this.interviews)) {
            this.interviews.forEach(interview => {
                if (!interview || !Array.isArray(interview.referents)) {
                    return;
                }

                interview.referents.forEach(ref => {
                    if (typeof ref === 'string' && ref.trim()) {
                        referentSet.add(ref.trim());
                    }
                });
            });
        }

        return Array.from(referentSet).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
    }

    updateInterviewReferentSelect(options) {
        const select = document.getElementById('interviewReferents');
        if (!select) {
            return;
        }

        const currentSelection = Array.isArray(this.interviewEditorState?.referents)
            ? [...this.interviewEditorState.referents]
            : Array.from(select.selectedOptions || []).map(option => option.value);

        select.innerHTML = '';

        const normalizedOptions = Array.isArray(options) ? options : [];

        normalizedOptions.forEach(option => {
            if (!option || typeof option !== 'object') {
                return;
            }

            const value = option.value;
            const label = option.label ?? value;

            if (value == null) {
                return;
            }

            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = label;
            if (currentSelection.includes(value)) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });
    }

    populateInterviewSubProcessFilterOptions() {
        const select = document.getElementById('interviewSubProcessFilter');
        if (!select) {
            return;
        }

        const previousValue = this.interviewFilters?.subProcess || '';
        const processFilter = this.interviewFilters?.process || '';

        select.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'All sub-processes';
        select.appendChild(placeholder);

        const optionsMap = new Map();
        const addOption = (scope) => {
            if (!scope || !scope.subProcessValue) {
                return;
            }

            if (processFilter && scope.processValue !== processFilter) {
                return;
            }

            const key = `${scope.processValue}::${scope.subProcessValue}`;
            if (optionsMap.has(key)) {
                return;
            }

            const label = `${scope.processLabel || this.getProcessLabel(scope.processValue)} • ${scope.subProcessLabel || this.getSubProcessLabel(scope.processValue, scope.subProcessValue)}`;
            optionsMap.set(key, { value: key, label });
        };

        (Array.isArray(this.interviews) ? this.interviews : []).forEach(interview => {
            if (!interview || !Array.isArray(interview.scopes)) {
                return;
            }
            interview.scopes.forEach(scope => addOption(scope));
        });

        const sortedOptions = Array.from(optionsMap.values())
            .sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));

        sortedOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            if (option.value === previousValue) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });

        if (previousValue && !optionsMap.has(previousValue)) {
            select.value = '';
            if (this.interviewFilters) {
                this.interviewFilters.subProcess = '';
            }
        }
    }

    setInterviewFilter(filterKey, value) {
        if (!this.interviewFilters || typeof filterKey !== 'string') {
            return;
        }

        const normalizedKey = filterKey.trim();
        if (!normalizedKey || !(normalizedKey in this.interviewFilters)) {
            return;
        }

        let normalizedValue = value == null ? '' : String(value);
        if (normalizedKey === 'search') {
            normalizedValue = normalizedValue.trim();
        }
        this.interviewFilters[normalizedKey] = normalizedValue;

        if (normalizedKey === 'process') {
            this.populateInterviewSubProcessFilterOptions();
        }

        this.updateInterviewsList();
    }

    handleInterviewReferentsChange(element) {
        if (!this.interviewEditorState) {
            this.interviewEditorState = {
                editingId: null,
                referents: [],
                selectedScopeKeys: new Set(),
                availableScopes: [],
                fallbackScopes: []
            };
        }

        const values = element
            ? Array.from(element.selectedOptions || []).map(option => option.value).filter(value => typeof value === 'string' && value.trim())
            : [];

        this.interviewEditorState.referents = values;
        this.renderInterviewScopeSelection();
    }

    computeInterviewScopesForReferents(referents) {
        const normalizedReferents = Array.isArray(referents)
            ? referents
                .map(ref => typeof ref === 'string' ? ref.trim().toLowerCase() : '')
                .filter(Boolean)
            : [];

        if (!normalizedReferents.length) {
            return [];
        }

        const seen = new Set();
        const scopes = [];
        const processes = Array.isArray(this.config?.processes) ? this.config.processes : [];

        processes.forEach(process => {
            if (!process || !process.value) {
                return;
            }

            const processValue = process.value;
            const processLabel = process.label || process.value;
            const processReferents = Array.isArray(process.referents)
                ? process.referents.map(ref => typeof ref === 'string' ? ref.trim().toLowerCase() : '').filter(Boolean)
                : [];

            const includeAllSubProcesses = processReferents.some(ref => normalizedReferents.includes(ref));
            const subProcesses = Array.isArray(this.config?.subProcesses?.[processValue])
                ? this.config.subProcesses[processValue]
                : [];

            if (includeAllSubProcesses && subProcesses.length === 0) {
                const key = `${processValue}::`;
                if (!seen.has(key)) {
                    seen.add(key);
                    scopes.push({
                        key,
                        processValue,
                        processLabel,
                        subProcessValue: '',
                        subProcessLabel: '',
                        type: 'process'
                    });
                }
            }

            if (subProcesses.length) {
                subProcesses.forEach(subProcess => {
                    if (!subProcess || !subProcess.value) {
                        return;
                    }

                    const subProcessValue = subProcess.value;
                    const subProcessLabel = subProcess.label || subProcess.value;
                    const subReferents = Array.isArray(subProcess.referents)
                        ? subProcess.referents.map(ref => typeof ref === 'string' ? ref.trim().toLowerCase() : '').filter(Boolean)
                        : [];

                    if (includeAllSubProcesses || subReferents.some(ref => normalizedReferents.includes(ref))) {
                        const key = `${processValue}::${subProcessValue}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            scopes.push({
                                key,
                                processValue,
                                processLabel,
                                subProcessValue,
                                subProcessLabel,
                                type: 'subProcess'
                            });
                        }
                    }
                });
            }

            if (!includeAllSubProcesses && subProcesses.length === 0 && processReferents.some(ref => normalizedReferents.includes(ref))) {
                const key = `${processValue}::`;
                if (!seen.has(key)) {
                    seen.add(key);
                    scopes.push({
                        key,
                        processValue,
                        processLabel,
                        subProcessValue: '',
                        subProcessLabel: '',
                        type: 'process'
                    });
                }
            }
        });

        return scopes;
    }

    renderInterviewScopeSelection(options = {}) {
        const container = document.getElementById('interviewScopeSelection');
        const helper = document.getElementById('interviewScopeHelper');

        if (!container || !helper) {
            return;
        }

        if (!this.interviewEditorState) {
            this.interviewEditorState = {
                editingId: null,
                referents: [],
                selectedScopeKeys: new Set(),
                availableScopes: [],
                fallbackScopes: []
            };
        }

        const state = this.interviewEditorState;
        if (!(state.selectedScopeKeys instanceof Set)) {
            state.selectedScopeKeys = new Set();
        }

        const referents = Array.isArray(state.referents) ? state.referents : [];
        const preserveSelection = Boolean(options.preserveSelection);

        if (!referents.length) {
            helper.textContent = 'Select one or more referents to display matching sub-processes.';
            container.innerHTML = '<div class="interview-scope-empty">No referent selected.</div>';
            state.availableScopes = [];
            return;
        }

        let availableScopes = this.computeInterviewScopesForReferents(referents);
        if (!availableScopes.length && Array.isArray(state.fallbackScopes) && state.fallbackScopes.length) {
            availableScopes = [...state.fallbackScopes];
        }

        state.availableScopes = availableScopes;

        if (!availableScopes.length) {
            helper.textContent = 'No process or sub-process is associated with selected referents.';
            container.innerHTML = '<div class="interview-scope-empty">No item available for these referents.</div>';
            state.selectedScopeKeys.clear();
            return;
        }

        const availableKeys = new Set(availableScopes.map(scope => scope.key));
        Array.from(state.selectedScopeKeys).forEach(key => {
            if (!availableKeys.has(key)) {
                state.selectedScopeKeys.delete(key);
            }
        });

        if (!preserveSelection && state.selectedScopeKeys.size === 0) {
            availableScopes.forEach(scope => state.selectedScopeKeys.add(scope.key));
        }

        const selectedCount = state.selectedScopeKeys.size;
        const totalCount = availableScopes.length;

        if (selectedCount === 0) {
            helper.textContent = 'No item selected. Select at least one sub-process.';
        } else if (selectedCount === totalCount) {
            helper.textContent = 'All matching sub-processes are selected.';
        } else {
            helper.textContent = `${selectedCount} élément${selectedCount > 1 ? 's' : ''} sélectionné${selectedCount > 1 ? 's' : ''} sur ${totalCount}.`;
        }

        const groups = new Map();
        availableScopes.forEach(scope => {
            const processValue = scope.processValue || '';
            if (!groups.has(processValue)) {
                groups.set(processValue, {
                    processValue,
                    processLabel: scope.processLabel || this.getProcessLabel(processValue) || processValue || 'Processus',
                    items: []
                });
            }
            groups.get(processValue).items.push(scope);
        });

        const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, match => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match] || match));

        const escapeAttribute = (value) => String(value ?? '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

        container.innerHTML = Array.from(groups.values()).map(group => {
            const colorClass = this.getProcessColorClass(group.processValue);
            const chips = group.items.map(scope => {
                const isSelected = state.selectedScopeKeys.has(scope.key);
                const label = scope.subProcessValue
                    ? (scope.subProcessLabel || this.getSubProcessLabel(scope.processValue, scope.subProcessValue) || scope.subProcessValue)
                    : 'Processus complet';
                const escapedKey = escapeAttribute(scope.key);
                return `<div class="interview-subprocess-chip ${isSelected ? '' : 'deselected'}" tabindex="0" role="button" aria-pressed="${isSelected}" onclick="rms.toggleInterviewScope('${escapedKey}')" onkeydown="rms.handleInterviewScopeKey(event, '${escapedKey}')">${escapeHtml(label)}</div>`;
            }).join('');

            const itemCountLabel = `${group.items.length} élément${group.items.length > 1 ? 's' : ''}`;

            return `<div class="interview-scope-group ${colorClass}"><div class="interview-scope-group-header"><div class="interview-scope-group-title">${escapeHtml(group.processLabel)}</div><div class="interview-scope-group-count">${itemCountLabel}</div></div><div class="interview-scope-chips">${chips}</div></div>`;
        }).join('');
    }

    toggleInterviewScope(scopeKey) {
        if (!this.interviewEditorState) {
            return;
        }

        const key = scopeKey == null ? '' : String(scopeKey);
        if (!key) {
            return;
        }

        if (!(this.interviewEditorState.selectedScopeKeys instanceof Set)) {
            this.interviewEditorState.selectedScopeKeys = new Set();
        }

        if (this.interviewEditorState.selectedScopeKeys.has(key)) {
            this.interviewEditorState.selectedScopeKeys.delete(key);
        } else {
            this.interviewEditorState.selectedScopeKeys.add(key);
        }

        this.markUnsavedChange('interviewForm');
        this.renderInterviewScopeSelection({ preserveSelection: true });
    }

    handleInterviewScopeKey(event, scopeKey) {
        if (!event) {
            return;
        }

        const key = event.key || event.code;
        if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
            event.preventDefault();
            this.toggleInterviewScope(scopeKey);
        }
    }

    applyInterviewFormat(command) {
        if (typeof document === 'undefined') {
            return;
        }

        const notes = document.getElementById('interviewNotes');
        if (!notes) {
            return;
        }

        notes.focus();
        try {
            document.execCommand(command, false, null);
        } catch (error) {
            console.warn('Unsupported formatting command', command, error);
        }
    }

    applyInterviewLink() {
        if (typeof document === 'undefined') {
            return;
        }

        const notes = document.getElementById('interviewNotes');
        if (!notes) {
            return;
        }

        const url = prompt('Adresse du lien', 'https://');
        if (!url) {
            return;
        }

        let normalized = url.trim();
        if (!/^https?:\/\//i.test(normalized)) {
            normalized = `https://${normalized}`;
        }

        notes.focus();
        try {
            document.execCommand('createLink', false, normalized);
        } catch (error) {
            console.warn('Unable to create link', error);
        }
    }

    clearInterviewFormatting() {
        if (typeof document === 'undefined') {
            return;
        }

        const notes = document.getElementById('interviewNotes');
        if (!notes) {
            return;
        }

        notes.focus();
        try {
            document.execCommand('removeFormat', false, null);
            document.execCommand('unlink', false, null);
        } catch (error) {
            console.warn('Unable to clear formatting', error);
        }
    }

    openInterviewTemplateModal() {
        if (typeof document === 'undefined') {
            return;
        }

        const modal = document.getElementById('interviewTemplateModal');
        if (!modal) {
            return;
        }

        this.renderInterviewTemplateChoices();
        modal.classList.add('show');
    }

    closeInterviewTemplateModal() {
        if (typeof document === 'undefined') {
            return;
        }

        const modal = document.getElementById('interviewTemplateModal');
        if (!modal) {
            return;
        }

        modal.classList.remove('show');
    }

    renderInterviewTemplateChoices() {
        if (typeof document === 'undefined') {
            return;
        }

        const container = document.getElementById('interviewTemplateList');
        if (!container) {
            return;
        }

        this.interviewTemplateListContainer = container;
        container.innerHTML = '';

        const templates = Array.isArray(this.config?.interviewTemplates)
            ? this.config.interviewTemplates
            : [];

        if (!templates.length) {
            const empty = document.createElement('div');
            empty.className = 'template-choice-empty';
            empty.textContent = 'Aucune trame disponible. Configurez vos trames dans l’onglet Configuration.';
            container.appendChild(empty);
            return;
        }

        templates.forEach(template => {
            if (!template) {
                return;
            }

            const card = document.createElement('article');
            card.className = 'template-choice-card';

            const header = document.createElement('div');
            header.className = 'template-choice-header';

            const title = document.createElement('div');
            title.className = 'template-choice-title';
            title.textContent = template.label || 'Untitled template';
            header.appendChild(title);

            const slug = document.createElement('div');
            slug.className = 'template-choice-slug';
            slug.textContent = template.value ? `ID : ${template.value}` : 'Identifier not set';
            header.appendChild(slug);

            card.appendChild(header);

            const preview = document.createElement('div');
            preview.className = 'template-choice-preview';
            if (template.content && String(template.content).trim()) {
                preview.innerHTML = template.content;
            } else {
                preview.innerHTML = '<p class="template-choice-empty">No content provided.</p>';
            }
            card.appendChild(preview);

            const actions = document.createElement('div');
            actions.className = 'template-choice-actions';

            const selectButton = document.createElement('button');
            selectButton.type = 'button';
            selectButton.className = 'btn btn-primary';
            selectButton.textContent = 'Utiliser cette trame';
            selectButton.addEventListener('click', () => {
                this.applyInterviewTemplate(template.value);
            });
            actions.appendChild(selectButton);

            card.appendChild(actions);
            container.appendChild(card);
        });
    }

    applyInterviewTemplate(templateValue) {
        if (typeof document === 'undefined') {
            return;
        }

        const templates = Array.isArray(this.config?.interviewTemplates)
            ? this.config.interviewTemplates
            : [];
        const template = templates.find(entry => entry && entry.value === templateValue);
        if (!template) {
            return;
        }

        const notesElement = document.getElementById('interviewNotes');
        if (!notesElement) {
            this.closeInterviewTemplateModal();
            return;
        }

        const existingHtml = notesElement.innerHTML || '';
        const trimmedExisting = existingHtml.trim();
        const templateContent = template.content || '';
        if (trimmedExisting) {
            const separator = trimmedExisting.endsWith('</p>') || trimmedExisting.endsWith('</ul>') || trimmedExisting.endsWith('</ol>')
                ? ''
                : '<br>';
            notesElement.innerHTML = `${existingHtml}${separator}${templateContent}`;
        } else {
            notesElement.innerHTML = templateContent;
        }
        this.markUnsavedChange('interviewForm');
        notesElement.focus();
        this.closeInterviewTemplateModal();

        if (typeof showNotification === 'function') {
            showNotification('success', 'Template applied to the interview report');
        }
    }

    openInterviewModal(interviewId = null) {
        if (typeof document === 'undefined') {
            return;
        }

        const modal = document.getElementById('interviewModal');
        const form = document.getElementById('interviewForm');
        const titleInput = document.getElementById('interviewTitle');
        const dateInput = document.getElementById('interviewDate');
        const notesElement = document.getElementById('interviewNotes');
        const modalTitle = document.getElementById('interviewModalTitle');

        if (!modal || !form || !notesElement) {
            return;
        }

        this.renderInterviewTemplateChoices();

        let targetInterview = null;
        if (interviewId != null) {
            targetInterview = (this.interviews || []).find(interview => idsEqual(interview.id, interviewId)) || null;
        }

        form.reset();
        notesElement.innerHTML = '';

        const referents = targetInterview && Array.isArray(targetInterview.referents)
            ? [...targetInterview.referents]
            : [];

        const selectedScopeKeys = targetInterview && Array.isArray(targetInterview.scopes)
            ? new Set(targetInterview.scopes.map(scope => scope.key))
            : new Set();

        const fallbackScopes = targetInterview && Array.isArray(targetInterview.scopes)
            ? [...targetInterview.scopes]
            : [];

        this.interviewEditorState = {
            editingId: targetInterview ? targetInterview.id : null,
            referents,
            selectedScopeKeys,
            availableScopes: [],
            fallbackScopes
        };

        const referentOptions = this.getAllKnownReferents().map(ref => ({ value: ref, label: ref }));
        this.updateInterviewReferentSelect(referentOptions);

        if (titleInput) {
            titleInput.value = targetInterview?.title || '';
        }

        if (dateInput) {
            const dateValue = targetInterview?.date || this.getTodayDateString();
            dateInput.value = dateValue;
        }

        notesElement.innerHTML = targetInterview?.notes || '';

        this.interviewMindMapState = this.normalizeMindMapState(targetInterview?.mindMap);

        if (modalTitle) {
            modalTitle.textContent = targetInterview ? 'Edit interview report' : 'New interview report';
        }

        this.renderInterviewScopeSelection();

        modal.classList.add('show');

        setTimeout(() => {
            if (titleInput) {
                titleInput.focus();
            } else {
                const referentSelect = document.getElementById('interviewReferents');
                referentSelect && referentSelect.focus();
            }
        }, 50);
    }

    closeInterviewModal() {
        if (typeof document === 'undefined') {
            return;
        }

        const modal = document.getElementById('interviewModal');
        if (!modal) {
            return;
        }

        if (this.hasUnsavedContext('interviewForm')) {
            const confirmed = window.confirm('You have unsaved changes. Close without saving?');
            if (!confirmed) {
                return;
            }
            this.clearUnsavedChanges('interviewForm');
        }

        modal.classList.remove('show');

        const form = document.getElementById('interviewForm');
        const notes = document.getElementById('interviewNotes');
        if (form) {
            form.reset();
        }
        if (notes) {
            notes.innerHTML = '';
        }

        this.interviewMindMapState = this.createEmptyMindMapState();
        this.closeMindMapModal({ skipCapture: true });
        this.interviewEditorState = null;
    }

    extractMentionsFromText(text) {
        if (!text) {
            return [];
        }
        const mentions = [];
        const mentionRegex = /@([A-Za-zÀ-ÖØ-öø-ÿ0-9_-]+)/g;
        let match;
        while ((match = mentionRegex.exec(text)) !== null) {
            if (match[1]) {
                mentions.push(match[1]);
            }
        }
        return mentions;
    }

    extractMentionsWithContext(text) {
        if (!text) {
            return [];
        }
        const mentions = [];
        const mentionRegex = /@([A-Za-zÀ-ÖØ-öø-ÿ0-9_-]+)/g;
        let match;
        while ((match = mentionRegex.exec(text)) !== null) {
            if (match[1]) {
                const afterMention = text.slice(match.index + match[0].length).trim();
                mentions.push({ mention: match[1], context: afterMention });
            }
        }
        return mentions;
    }

    extractMentionsFromNotes(notes) {
        if (!notes) {
            return [];
        }
        const container = document.createElement('div');
        container.innerHTML = notes;
        const textContent = container.textContent || '';
        const mentions = this.extractMentionsFromText(textContent);
        return Array.from(new Set(mentions));
    }

    extractMentionContextsFromNotes(notes) {
        if (!notes) {
            return [];
        }
        const container = document.createElement('div');
        container.innerHTML = notes;
        const textContent = container.textContent || '';
        const mentions = this.extractMentionsWithContext(textContent);
        const seen = new Set();
        return mentions.filter(entry => {
            const key = entry.mention.toLowerCase();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    getMentionArchiveStorageKey() {
        return 'rms_mentions_archive';
    }

    loadMentionArchive() {
        if (typeof localStorage === 'undefined') {
            return new Set();
        }

        const storageKey = this.getMentionArchiveStorageKey();
        const data = localStorage.getItem(storageKey);
        if (!data) {
            return new Set();
        }

        try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
                return new Set(parsed.filter(Boolean));
            }
        } catch (error) {
            console.warn('Archive des mentions invalides, réinitialisation', error);
            try {
                localStorage.removeItem(storageKey);
            } catch (cleanupError) {
                console.warn('Impossible de supprimer l’archive des mentions corrompue', cleanupError);
            }
        }

        return new Set();
    }

    saveMentionArchive() {
        if (typeof localStorage === 'undefined') {
            return;
        }

        const storageKey = this.getMentionArchiveStorageKey();
        const payload = Array.from(this.mentionArchive instanceof Set ? this.mentionArchive : []);
        localStorage.setItem(storageKey, JSON.stringify(payload));
    }

    setMentionArchived(mentionKey, shouldArchive) {
        if (!mentionKey) {
            return;
        }

        if (!(this.mentionArchive instanceof Set)) {
            this.mentionArchive = new Set();
        }

        if (shouldArchive) {
            this.mentionArchive.add(mentionKey);
        } else {
            this.mentionArchive.delete(mentionKey);
        }

        this.saveMentionArchive();
    }

    buildMentionKey({ sourceType, interviewId, mention, templateKey = '', nodeId = '' }) {
        const safeSource = sourceType || 'source';
        const safeInterview = interviewId != null ? String(interviewId) : 'unknown';
        const safeMention = mention ? String(mention).toLowerCase() : '';
        return [safeSource, safeInterview, templateKey, nodeId, safeMention].filter(Boolean).join(':');
    }

    extractMentionsFromMindMapState(state) {
        const normalized = this.normalizeMindMapState(state);
        const data = normalized?.data && typeof normalized.data === 'object' ? normalized.data : null;
        if (!data) {
            return [];
        }

        const templateStates = data.templateStates && typeof data.templateStates === 'object'
            ? data.templateStates
            : {};

        const mentions = [];
        const collectFromNodes = (nodes, templateKey) => {
            if (!Array.isArray(nodes)) {
                return;
            }

            nodes.forEach(node => {
                if (!node || typeof node !== 'object') {
                    return;
                }

                const text = typeof node.text === 'string' ? node.text : '';
                const nodeMentions = this.extractMentionsWithContext(text);
                const seenMentions = new Set();
                nodeMentions.forEach(entry => {
                    const mentionKey = entry.mention.toLowerCase();
                    if (seenMentions.has(mentionKey)) {
                        return;
                    }
                    seenMentions.add(mentionKey);
                    mentions.push({
                        mention: entry.mention,
                        nodeText: text,
                        nodeId: node.id || '',
                        templateKey,
                        context: entry.context
                    });
                });

                if (Array.isArray(node.children) && node.children.length) {
                    collectFromNodes(node.children, templateKey);
                }
            });
        };

        Object.entries(templateStates).forEach(([templateKey, templateState]) => {
            const nodes = Array.isArray(templateState?.nodes) ? templateState.nodes : [];
            collectFromNodes(nodes, templateKey);
        });

        return mentions;
    }

    collectMentionsForModal() {
        const entries = [];
        const seen = new Set();
        const interviews = Array.isArray(this.interviews) ? this.interviews : [];

        interviews.forEach(interview => {
            if (!interview) {
                return;
            }

            const interviewId = interview.id ?? interview.fileName ?? interview.fileIndex ?? 'inconnu';
            const interviewTitle = interview.title?.trim() || `Compte-rendu ${interviewId}`;

            const noteMentions = this.extractMentionContextsFromNotes(interview.notes || '');
            noteMentions.forEach(entry => {
                const key = this.buildMentionKey({ sourceType: 'interview', interviewId, mention: entry.mention });
                if (seen.has(key)) {
                    return;
                }
                seen.add(key);
                entries.push({
                    key,
                    mention: entry.mention,
                    sourceType: 'interview',
                    sourceLabel: interviewTitle,
                    context: entry.context
                });
            });

            const mindMapMentions = this.extractMentionsFromMindMapState(interview.mindMap);
            mindMapMentions.forEach(entry => {
                const key = this.buildMentionKey({
                    sourceType: 'mindmap',
                    interviewId,
                    mention: entry.mention,
                    templateKey: entry.templateKey || '',
                    nodeId: entry.nodeId || ''
                });
                if (seen.has(key)) {
                    return;
                }
                seen.add(key);
                entries.push({
                    key,
                    mention: entry.mention,
                    sourceType: 'mindmap',
                    sourceLabel: interviewTitle,
                    context: entry.context || '',
                    templateKey: entry.templateKey || ''
                });
            });
        });

        return entries.sort((a, b) => {
            const mentionDiff = a.mention.localeCompare(b.mention, 'fr', { sensitivity: 'base' });
            if (mentionDiff !== 0) {
                return mentionDiff;
            }
            return a.sourceLabel.localeCompare(b.sourceLabel, 'fr', { sensitivity: 'base' });
        });
    }

    updateMentionFilterButtons() {
        const modal = document.getElementById('mentionsModal');
        if (!modal) {
            return;
        }
        const buttons = modal.querySelectorAll('.mention-filter');
        buttons.forEach(button => {
            const filter = button.dataset?.mentionFilter;
            if (filter === this.mentionModalFilter) {
                button.classList.add('is-active');
            } else {
                button.classList.remove('is-active');
            }
        });
    }

    renderMentionsModal() {
        if (typeof document === 'undefined') {
            return;
        }

        const list = document.getElementById('mentionsModalList');
        if (!list) {
            return;
        }

        list.innerHTML = '';
        const entries = this.collectMentionsForModal();
        const isArchivedView = this.mentionModalFilter === 'archived';
        const archivedSet = this.mentionArchive instanceof Set ? this.mentionArchive : new Set();
        const filtered = entries.filter(entry => archivedSet.has(entry.key) === isArchivedView);

        if (!filtered.length) {
            const empty = document.createElement('div');
            empty.className = 'mention-modal-empty';
            empty.textContent = isArchivedView
                ? 'Aucune mention archivée pour le moment.'
                : 'Aucune mention @ à éclaircir.';
            list.appendChild(empty);
            return;
        }

        filtered.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'mention-modal-item';

            const main = document.createElement('div');
            main.className = 'mention-modal-main';

            const mention = document.createElement('div');
            mention.className = 'mention-modal-mention';
            mention.textContent = `@${entry.mention}`;

            const meta = document.createElement('div');
            meta.className = 'mention-modal-meta';
            const sourceLabel = entry.sourceType === 'mindmap'
                ? `Atelier mindmap • ${entry.sourceLabel}`
                : `Compte-rendu • ${entry.sourceLabel}`;
            const templateSuffix = entry.sourceType === 'mindmap' && entry.templateKey
                ? ` • Carte ${entry.templateKey}`
                : '';
            meta.textContent = `${sourceLabel}${templateSuffix}`;

            const context = document.createElement('div');
            context.className = 'mention-modal-context';
            context.textContent = entry.context;

            main.append(mention, meta, context);

            const action = document.createElement('button');
            action.type = 'button';
            action.className = isArchivedView ? 'btn btn-secondary' : 'btn btn-outline';
            action.textContent = isArchivedView ? 'Unarchive' : 'Archive';
            action.addEventListener('click', () => {
                this.setMentionArchived(entry.key, !isArchivedView);
                this.renderMentionsModal();
            });

            item.append(main, action);
            list.appendChild(item);
        });
    }

    registerMentionsModalHandlers() {
        if (typeof document === 'undefined' || this.mentionModalInitialized) {
            return;
        }

        const modal = document.getElementById('mentionsModal');
        if (!modal) {
            return;
        }

        modal.querySelectorAll('.mention-filter').forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.dataset?.mentionFilter || 'active';
                this.mentionModalFilter = filter;
                this.updateMentionFilterButtons();
                this.renderMentionsModal();
            });
        });

        this.mentionModalInitialized = true;
    }

    openMentionsModal() {
        if (typeof document === 'undefined') {
            return;
        }

        const modal = document.getElementById('mentionsModal');
        if (!modal) {
            return;
        }

        this.registerMentionsModalHandlers();
        this.mentionModalFilter = 'active';
        this.updateMentionFilterButtons();
        this.renderMentionsModal();
        modal.classList.add('show');
    }

    closeMentionsModal() {
        if (typeof document === 'undefined') {
            return;
        }

        const modal = document.getElementById('mentionsModal');
        if (!modal) {
            return;
        }

        modal.classList.remove('show');
    }

    openInterviewViewer(interviewId) {
        if (typeof document === 'undefined') {
            return;
        }

        const modal = document.getElementById('interviewViewModal');
        const titleElement = document.getElementById('interviewViewModalTitle');
        const dateElement = document.getElementById('interviewViewDate');
        const updatedElement = document.getElementById('interviewViewUpdated');
        const referentsContainer = document.getElementById('interviewViewReferents');
        const tagsContainer = document.getElementById('interviewViewTags');
        const notesContainer = document.getElementById('interviewViewNotes');
        const mentionsContainer = document.getElementById('interviewViewMentions');
        const mindmapButton = document.getElementById('openInterviewMindmapButton');

        if (!modal || !titleElement || !notesContainer) {
            return;
        }

        const interview = (this.interviews || []).find(entry => idsEqual(entry?.id, interviewId));

        if (!interview) {
            titleElement.textContent = 'Interview report not found';
            if (dateElement) {
                dateElement.textContent = '';
            }
            if (updatedElement) {
                updatedElement.textContent = '';
            }
            if (referentsContainer) {
                referentsContainer.innerHTML = '<span class="interview-card-empty-selection">Interview unavailable.</span>';
            }
            if (tagsContainer) {
                tagsContainer.innerHTML = '';
            }
            notesContainer.innerHTML = '<p class="interview-card-empty-selection">No content to display.</p>';
            if (mentionsContainer) {
                mentionsContainer.innerHTML = '<span class="interview-card-empty-selection">No @ mention detected.</span>';
            }
            if (mindmapButton) {
                mindmapButton.disabled = true;
            }
            this.interviewViewMindMapState = null;
            modal.classList.add('show');
            return;
        }

        const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, match => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match] || match));

        const title = interview.title ? escapeHtml(interview.title) : 'Untitled interview report';
        const dateLabel = this.formatInterviewDate(interview.date);
        const updatedLabel = this.formatInterviewDateTime(interview.updatedAt || interview.createdAt);

        titleElement.textContent = title;
        if (dateElement) {
            dateElement.textContent = dateLabel ? `Interview held on ${dateLabel}` : '';
        }
        if (updatedElement) {
            updatedElement.textContent = updatedLabel ? `Last updated: ${updatedLabel}` : '';
        }

        if (referentsContainer) {
            const referentsChips = Array.isArray(interview.referents)
                ? interview.referents.map(ref => `<span class="interview-referent-chip">${escapeHtml(ref)}</span>`).join('')
                : '';
            referentsContainer.innerHTML = referentsChips || '<span class="interview-card-empty-selection">No referent provided.</span>';
        }

        if (tagsContainer) {
            const tags = Array.isArray(interview.scopes)
                ? interview.scopes.map(scope => {
                    const colorClass = this.getProcessColorClass(scope.processValue);
                    const label = scope.subProcessValue
                        ? (scope.subProcessLabel || this.getSubProcessLabel(scope.processValue, scope.subProcessValue) || scope.subProcessValue)
                        : 'Processus complet';
                    return `<span class="interview-tag ${colorClass}">${escapeHtml(label)}</span>`;
                }).join('')
                : '';
            tagsContainer.innerHTML = tags || '<span class="interview-card-empty-selection">No associated process.</span>';
        }

        if (interview.notes && String(interview.notes).trim()) {
            let sanitizedNotes = '';
            if (typeof sanitizeRichText === 'function') {
                sanitizedNotes = sanitizeRichText(interview.notes);
            } else {
                sanitizedNotes = escapeHtml(interview.notes).replace(/\r?\n/g, '<br>');
            }

            const hasVisibleContent = sanitizedNotes
                && sanitizedNotes.replace(/<[^>]+>/g, '').trim();

            if (hasVisibleContent) {
                notesContainer.innerHTML = `<div class="interview-notes-content">${sanitizedNotes}</div>`;
            } else {
                notesContainer.innerHTML = '<p class="interview-card-empty-selection">No content provided.</p>';
            }
        } else {
            notesContainer.innerHTML = '<p class="interview-card-empty-selection">No content provided.</p>';
        }

        if (mentionsContainer) {
            const mentions = this.extractMentionsFromNotes(interview.notes || '');
            if (mentions.length) {
                mentionsContainer.innerHTML = mentions
                    .map(mention => `<span class="interview-mention-chip">@${escapeHtml(mention)}</span>`)
                    .join('');
            } else {
                mentionsContainer.innerHTML = '<span class="interview-card-empty-selection">No @ mention detected.</span>';
            }
        }

        this.interviewViewMindMapState = this.normalizeMindMapState(interview.mindMap);
        if (mindmapButton) {
            mindmapButton.disabled = false;
        }
        modal.classList.add('show');
    }

    openInterviewMindMapViewer() {
        if (!this.interviewViewMindMapState) {
            return;
        }
        this.openMindMapModal({ readOnly: true, state: this.interviewViewMindMapState });
    }

    closeInterviewViewModal() {
        if (typeof document === 'undefined') {
            return;
        }

        const modal = document.getElementById('interviewViewModal');
        const notesContainer = document.getElementById('interviewViewNotes');
        const titleElement = document.getElementById('interviewViewModalTitle');
        const dateElement = document.getElementById('interviewViewDate');
        const updatedElement = document.getElementById('interviewViewUpdated');
        const referentsContainer = document.getElementById('interviewViewReferents');
        const tagsContainer = document.getElementById('interviewViewTags');
        const mentionsContainer = document.getElementById('interviewViewMentions');

        if (!modal) {
            return;
        }

        modal.classList.remove('show');

        if (notesContainer) {
            notesContainer.innerHTML = '';
        }
        if (titleElement) {
            titleElement.textContent = 'Compte-rendu';
        }
        if (dateElement) {
            dateElement.textContent = '';
        }
        if (updatedElement) {
            updatedElement.textContent = '';
        }
        if (referentsContainer) {
            referentsContainer.innerHTML = '';
        }
        if (tagsContainer) {
            tagsContainer.innerHTML = '';
        }
        if (mentionsContainer) {
            mentionsContainer.innerHTML = '';
        }
        const mindmapButton = document.getElementById('openInterviewMindmapButton');
        if (mindmapButton) {
            mindmapButton.disabled = true;
        }
        this.interviewViewMindMapState = null;
    }

    getTodayDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatInterviewDate(value) {
        if (!value) {
            return '';
        }

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const [year, month, day] = value.split('-');
            return `${day}/${month}/${year}`;
        }

        if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
            return value;
        }

        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toLocaleDateString('fr-FR');
        }

        return String(value);
    }

    formatInterviewDateTime(value) {
        if (!value) {
            return '';
        }

        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toLocaleString('fr-FR');
        }

        return this.formatInterviewDate(value);
    }

    saveInterview() {
        if (typeof document === 'undefined') {
            return;
        }

        const form = document.getElementById('interviewForm');
        if (!form) {
            return;
        }

        const titleInput = document.getElementById('interviewTitle');
        const dateInput = document.getElementById('interviewDate');
        const notesElement = document.getElementById('interviewNotes');
        const referentSelect = document.getElementById('interviewReferents');

        const title = titleInput ? titleInput.value.trim() : '';
        const dateValue = dateInput ? this.normalizeInterviewDate(dateInput.value) : '';

        const referents = referentSelect
            ? Array.from(referentSelect.selectedOptions || []).map(option => option.value).filter(value => typeof value === 'string' && value.trim())
            : [];

        if (!referents.length) {
            alert('Select at least one referent for the interview report.');
            return;
        }

        if (!dateValue) {
            alert('Provide a valid date for the interview report.');
            return;
        }

        const notes = notesElement ? notesElement.innerHTML.trim() : '';

        if (!this.interviewEditorState) {
            this.interviewEditorState = {
                editingId: null,
                referents,
                selectedScopeKeys: new Set(),
                availableScopes: [],
                fallbackScopes: []
            };
        }

        this.interviewEditorState.referents = referents;

        const scopeMap = new Map();
        (Array.isArray(this.interviewEditorState.availableScopes) ? this.interviewEditorState.availableScopes : []).forEach(scope => {
            if (scope && scope.key) {
                scopeMap.set(scope.key, scope);
            }
        });
        (Array.isArray(this.interviewEditorState.fallbackScopes) ? this.interviewEditorState.fallbackScopes : []).forEach(scope => {
            if (scope && scope.key && !scopeMap.has(scope.key)) {
                scopeMap.set(scope.key, scope);
            }
        });

        const selectedKeys = Array.from(this.interviewEditorState.selectedScopeKeys instanceof Set
            ? this.interviewEditorState.selectedScopeKeys
            : new Set());
        const selectedScopes = selectedKeys.map(key => scopeMap.get(key)).filter(Boolean);

        if (!selectedScopes.length) {
            alert('Select at least one process or sub-process linked to this interview.');
            return;
        }

        let existingInterview = null;
        if (this.interviewEditorState.editingId != null && Array.isArray(this.interviews)) {
            existingInterview = this.interviews.find(entry => idsEqual(entry.id, this.interviewEditorState.editingId)) || null;
        }
        const fileIndex = existingInterview
            ? this.getInterviewFileIndex(existingInterview)
            : this.getNextInterviewFileIndex();
        const baseFileName = existingInterview?.fileName
            ? existingInterview.fileName
            : this.getInterviewFileName({ fileIndex }, 'js');

        const processesMap = new Map();
        selectedScopes.forEach(scope => {
            if (!scope || !scope.processValue) {
                return;
            }
            if (!processesMap.has(scope.processValue)) {
                processesMap.set(scope.processValue, {
                    value: scope.processValue,
                    label: scope.processLabel || this.getProcessLabel(scope.processValue) || scope.processValue
                });
            }
        });

        const subProcesses = selectedScopes
            .filter(scope => scope.subProcessValue)
            .map(scope => ({
                processValue: scope.processValue,
                processLabel: scope.processLabel || this.getProcessLabel(scope.processValue) || scope.processValue,
                value: scope.subProcessValue,
                label: scope.subProcessLabel || this.getSubProcessLabel(scope.processValue, scope.subProcessValue) || scope.subProcessValue
            }));

        const timestamp = new Date().toISOString();

        this.captureMindMapStateFromFrame();

        const interviewPayload = {
            id: this.interviewEditorState.editingId != null
                ? this.interviewEditorState.editingId
                : getNextSequentialId(this.interviews),
            fileIndex,
            fileName: baseFileName,
            title,
            referents,
            date: dateValue,
            notes,
            scopes: selectedScopes,
            processes: Array.from(processesMap.values()),
            subProcesses,
            mindMap: this.getCurrentMindMapState(),
            createdAt: existingInterview?.createdAt || timestamp,
            updatedAt: timestamp
        };

        const normalizedInterview = this.normalizeInterview(interviewPayload);

        if (this.interviewEditorState.editingId != null) {
            const index = Array.isArray(this.interviews)
                ? this.interviews.findIndex(entry => idsEqual(entry.id, this.interviewEditorState.editingId))
                : -1;
            if (index > -1) {
                this.interviews[index] = normalizedInterview;
            }
        } else {
            if (!Array.isArray(this.interviews)) {
                this.interviews = [];
            }
            this.interviews.push(normalizedInterview);
        }

        this.interviewEditorState = null;
        this.saveData();
        this.saveInterviewFile(normalizedInterview, 'js');
        this.clearUnsavedChanges('interviewForm');
        this.updateInterviewsList();
        this.closeInterviewModal();

        if (typeof showNotification === 'function') {
            showNotification('success', existingInterview ? 'Interview report updated successfully' : 'Interview report created successfully');
        }
    }

    deleteInterview(interviewId) {
        if (!Array.isArray(this.interviews)) {
            return;
        }

        const targetIndex = this.interviews.findIndex(interview => idsEqual(interview.id, interviewId));
        if (targetIndex === -1) {
            alert('Interview report not found.');
            return;
        }

        if (!confirm('Do you confirm deleting this interview report?')) {
            return;
        }

        this.interviews.splice(targetIndex, 1);
        this.saveData();
        this.updateInterviewsList();

        if (typeof showNotification === 'function') {
            showNotification('success', 'Interview report deleted.');
        }
    }

    updateInterviewsList() {
        if (typeof document === 'undefined') {
            return;
        }

        const container = document.getElementById('interviewList');
        const countElement = document.getElementById('interviewCount');

        if (!container) {
            return;
        }

        this.populateInterviewSubProcessFilterOptions();

        const interviews = Array.isArray(this.interviews) ? [...this.interviews] : [];
        const filters = {
            process: '',
            subProcess: '',
            referent: '',
            search: '',
            ...(this.interviewFilters || {})
        };

        if (!interviews.length) {
            if (countElement) {
                countElement.textContent = '0 interview report';
            }
            const button = this.supportsInterviewFolderPicker()
                ? '<button class="btn btn-outline" type="button" onclick="rms.openInterviewFolderPicker()">📂 Load an interviews folder</button>'
                : '';
            const message = this.supportsInterviewFolderPicker()
                ? 'No interview report loaded. Select the folder containing your interviewX.json files.'
                : 'No interview report loaded.';
            container.innerHTML = `<div class="interview-empty">${message}${button}</div>`;
            return;
        }

        const processFilter = filters.process || '';
        const subProcessFilter = filters.subProcess || '';

        const normalizeForSearch = (value) => {
            if (value == null) {
                return '';
            }

            let str = String(value);
            if (!str) {
                return '';
            }

            str = str.trim().toLowerCase();
            if (!str) {
                return '';
            }

            if (typeof str.normalize === 'function') {
                str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            }

            return str;
        };

        const referentFilter = normalizeForSearch(filters.referent);
        const searchFilter = normalizeForSearch(filters.search);

        let subProcessFilterProcess = '';
        let subProcessFilterValue = '';

        if (subProcessFilter) {
            const [proc, sub] = subProcessFilter.split('::');
            subProcessFilterProcess = proc || '';
            subProcessFilterValue = sub || '';
        }

        const filtered = interviews.filter(interview => {
            if (!interview) {
                return false;
            }

            if (processFilter) {
                const matchesProcess = Array.isArray(interview.scopes)
                    ? interview.scopes.some(scope => scope?.processValue === processFilter)
                    : false;
                if (!matchesProcess) {
                    return false;
                }
            }

            if (subProcessFilterValue) {
                const matchesSub = Array.isArray(interview.scopes)
                    ? interview.scopes.some(scope => scope?.processValue === subProcessFilterProcess && scope?.subProcessValue === subProcessFilterValue)
                    : false;
                if (!matchesSub) {
                    return false;
                }
            }

            if (referentFilter) {
                const hasReferent = Array.isArray(interview.referents)
                    ? interview.referents.some(ref => normalizeForSearch(ref) === referentFilter)
                    : false;
                if (!hasReferent) {
                    return false;
                }
            }

            if (searchFilter) {
                const searchParts = [];

                if (interview.title) {
                    searchParts.push(interview.title);
                }

                if (Array.isArray(interview.referents) && interview.referents.length) {
                    searchParts.push(interview.referents.join(' '));
                }

                if (Array.isArray(interview.scopes) && interview.scopes.length) {
                    interview.scopes.forEach(scope => {
                        if (!scope || typeof scope !== 'object') {
                            return;
                        }
                        if (scope.processLabel) {
                            searchParts.push(scope.processLabel);
                        }
                        if (scope.processValue) {
                            searchParts.push(scope.processValue);
                        }
                        if (scope.subProcessLabel) {
                            searchParts.push(scope.subProcessLabel);
                        }
                        if (scope.subProcessValue) {
                            searchParts.push(scope.subProcessValue);
                        }
                    });
                }

                if (interview.notes) {
                    searchParts.push(interview.notes);
                }

                const dateLabel = this.formatInterviewDate(interview.date);
                if (dateLabel) {
                    searchParts.push(dateLabel);
                }

                const updatedLabel = this.formatInterviewDateTime(interview.updatedAt || interview.createdAt);
                if (updatedLabel) {
                    searchParts.push(updatedLabel);
                }

                const haystack = normalizeForSearch(searchParts.join(' '));
                if (!haystack || !haystack.includes(searchFilter)) {
                    return false;
                }
            }

            return true;
        }).sort((a, b) => {
            const dateA = a?.date || '';
            const dateB = b?.date || '';
            if (dateA && dateB && dateA !== dateB) {
                return dateA > dateB ? -1 : 1;
            }
            const updatedA = a?.updatedAt || '';
            const updatedB = b?.updatedAt || '';
            if (updatedA && updatedB && updatedA !== updatedB) {
                return updatedA > updatedB ? -1 : 1;
            }
            return 0;
        });

        if (countElement) {
            const total = filtered.length;
            const label = total <= 1 ? `${total} interview report` : `${total} interview reports`;
            countElement.textContent = label;
        }

        if (!filtered.length) {
            container.innerHTML = '<div class="interview-empty">No interview report matches selected filters.</div>';
            return;
        }

        const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, match => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match] || match));

        container.innerHTML = filtered.map(interview => {
            const title = interview.title ? escapeHtml(interview.title) : 'Untitled interview report';
            const dateLabel = this.formatInterviewDate(interview.date);
            const referentsChips = Array.isArray(interview.referents)
                ? interview.referents.map(ref => `<span class="interview-referent-chip">${escapeHtml(ref)}</span>`).join('')
                : '';

            const tags = Array.isArray(interview.scopes)
                ? interview.scopes.map(scope => {
                    const colorClass = this.getProcessColorClass(scope.processValue);
                    const label = scope.subProcessValue
                        ? (scope.subProcessLabel || this.getSubProcessLabel(scope.processValue, scope.subProcessValue) || scope.subProcessValue)
                        : 'Processus complet';
                    return `<span class="interview-tag ${colorClass}">${escapeHtml(label)}</span>`;
                }).join('')
                : '';

            const updatedLabel = this.formatInterviewDateTime(interview.updatedAt || interview.createdAt);
            const idAttribute = JSON.stringify(interview.id);

            return `
                <article class="interview-card">
                    <header class="interview-card-header">
                        <div class="interview-card-title">${title}</div>
                        <div class="interview-card-meta">
                            ${dateLabel ? `<span class="interview-date-badge">${escapeHtml(dateLabel)}</span>` : ''}
                        </div>
                    </header>
                    <div class="interview-card-meta interview-referents">${referentsChips}</div>
                    <div class="interview-card-tags">${tags}</div>
                    <footer class="interview-card-footer">
                        <div class="interview-card-meta">Last updated: ${escapeHtml(updatedLabel || 'Unknown date')}</div>
                        <div class="interview-card-actions">
                            <button class="interview-action-btn view" onclick='rms.openInterviewViewer(${idAttribute})'>View</button>
                            <button class="interview-action-btn edit" onclick='rms.openInterviewModal(${idAttribute})'>Edit</button>
                            <button class="interview-action-btn download" onclick='rms.downloadInterviewFile(${idAttribute})'>Export</button>
                            <button class="interview-action-btn delete" onclick='rms.deleteInterview(${idAttribute})'>Delete</button>
                        </div>
                    </footer>
                </article>
            `;
        }).join('');
    }


    // CRUD operations
    addRisk(riskData) {
        const newRisk = {
            id: getNextSequentialId(this.risks),
            ...riskData,
            dateCreation: new Date().toISOString(),
            statut: riskData.statut || 'brouillon'
        };

        const normalizedRisk = this.normalizeRisk(newRisk);

        this.risks.push(normalizedRisk);
        this.addHistoryItem('Risk creation', `New risk: ${normalizedRisk.description}`);
        this.saveData();
        this.init();

        return normalizedRisk;
    }

    duplicateRisk(riskId) {
        const sourceRisk = this.risks.find(risk => idsEqual(risk.id, riskId));
        if (!sourceRisk) {
            return null;
        }

        const clone = typeof structuredClone === 'function'
            ? structuredClone(sourceRisk)
            : JSON.parse(JSON.stringify(sourceRisk));

        const duplicated = {
            ...clone,
            id: getNextSequentialId(this.risks),
            statut: 'brouillon',
            dateCreation: new Date().toISOString()
        };

        delete duplicated.dateValidation;
        delete duplicated.dateValidationNet;
        delete duplicated.updatedAt;

        const normalizedRisk = this.normalizeRisk(duplicated);

        this.risks.push(normalizedRisk);
        const historyDescription = sourceRisk?.description || normalizedRisk.description;
        this.addHistoryItem('Risk duplication', `Risk copy: ${historyDescription}`);
        this.saveData();
        this.init();

        if (typeof showNotification === 'function') {
            showNotification('success', 'Risk duplicated as draft');
        }

        return normalizedRisk;
    }

    editRisk(riskId) {
        const targetId = String(riskId);
        const risk = this.risks.find(r => idsEqual(r.id, targetId));
        if (!risk) return;

        currentEditingRiskId = risk.id;
        const normalizeSelectionValues = (values, fallback = '') => {
            if (Array.isArray(values)) {
                return values
                    .map(item => (typeof item === 'string' ? item.trim() : (item != null ? String(item).trim() : '')))
                    .filter(Boolean);
            }
            if (typeof values === 'string') {
                const raw = values.trim();
                if (!raw) {
                    return [];
                }
                if (/[;,|]/.test(raw)) {
                    return raw.split(/[;,|]/).map(item => item.trim()).filter(Boolean);
                }
                return [raw];
            }
            if (fallback != null && String(fallback).trim()) {
                return [String(fallback).trim()];
            }
            return [];
        };

        const form = document.getElementById('riskForm');
        if (form) {
            form.reset();
            const riskThemeSelect = document.getElementById('riskTheme');
            const processSelect = document.getElementById('processus');
            const subProcessSelect = document.getElementById('sousProcessus');
            const corruptionTypeSelect = document.getElementById('typeCorruption');
            const corruptionExposureSelect = document.getElementById('corruptionExposure');
            const corruptionModeSelect = document.getElementById('corruptionMode');
            const targetAudienceSelect = document.getElementById('targetAudience');
            const processValues = normalizeSelectionValues(risk.processusAssocies, risk.processus);
            const subProcessValues = normalizeSelectionValues(risk.sousProcessusAssocies, risk.sousProcessus);
            const corruptionTypes = normalizeSelectionValues(risk.typesCorruption, risk.typeCorruption);
            const corruptionExposureTypes = normalizeSelectionValues(risk.corruptionExposureTypes, risk.corruptionExposure);
            const corruptionModes = normalizeSelectionValues(risk.corruptionModes, risk.corruptionMode);
            const targetAudiences = normalizeSelectionValues(risk.targetAudiences, risk.targetAudience);
            const tiersValues = normalizeSelectionValues(risk.tiers);
            const entitiesValues = normalizeSelectionValues(risk.paysExposes);
            if (riskThemeSelect) {
                riskThemeSelect.value = risk.riskTheme || 'corruption';
            }
            if (processSelect) {
                Array.from(processSelect.options).forEach(opt => {
                    opt.selected = processValues.includes(opt.value);
                });
                if (typeof syncRiskMultiSelectChipsFromSelect === 'function') {
                    syncRiskMultiSelectChipsFromSelect('processus');
                }
            }
            this.updateSousProcessusOptions();
            if (subProcessSelect) {
                Array.from(subProcessSelect.options).forEach(opt => {
                    opt.selected = subProcessValues.includes(opt.value);
                });
                if (typeof syncRiskMultiSelectChipsFromSelect === 'function') {
                    syncRiskMultiSelectChipsFromSelect('sousProcessus');
                }
            }
            if (corruptionTypeSelect) {
                Array.from(corruptionTypeSelect.options).forEach(opt => {
                    opt.selected = corruptionTypes.includes(opt.value);
                });
                if (typeof syncRiskMultiSelectChipsFromSelect === 'function') {
                    syncRiskMultiSelectChipsFromSelect('typeCorruption');
                }
            }
            if (corruptionExposureSelect) {
                Array.from(corruptionExposureSelect.options).forEach(opt => {
                    opt.selected = corruptionExposureTypes.includes(opt.value);
                });
                if (typeof syncRiskMultiSelectChipsFromSelect === 'function') {
                    syncRiskMultiSelectChipsFromSelect('corruptionExposure');
                }
            }
            if (corruptionModeSelect) {
                Array.from(corruptionModeSelect.options).forEach(opt => {
                    opt.selected = corruptionModes.includes(opt.value);
                });
                if (typeof syncRiskMultiSelectChipsFromSelect === 'function') {
                    syncRiskMultiSelectChipsFromSelect('corruptionMode');
                }
            }
            if (typeof updateCorruptionSpecificFieldsVisibility === 'function') {
                updateCorruptionSpecificFieldsVisibility({ clearHiddenValues: false });
            }
            if (targetAudienceSelect) {
                Array.from(targetAudienceSelect.options).forEach(opt => {
                    opt.selected = targetAudiences.includes(opt.value);
                });
                if (typeof syncRiskMultiSelectChipsFromSelect === 'function') {
                    syncRiskMultiSelectChipsFromSelect('targetAudience');
                }
            }
            const statutSelect = document.getElementById('statut');
            if (statutSelect) {
                const defaultStatus = this.config?.riskStatuses?.[0]?.value || '';
                const statusToApply = risk.statut || defaultStatus;
                if (statusToApply) {
                    const normalized = String(statusToApply);
                    const hasOption = Array.from(statutSelect.options).some(opt => opt.value === normalized);
                    if (!hasOption) {
                        const option = document.createElement('option');
                        option.value = normalized;
                        option.textContent = normalized;
                        statutSelect.appendChild(option);
                    }
                    statutSelect.value = normalized;
                } else {
                    statutSelect.value = '';
                }
            }

            const tiersSelect = document.getElementById('tiers');
            Array.from(tiersSelect.options).forEach(opt => {
                opt.selected = tiersValues.includes(opt.value);
            });
            if (typeof syncRiskMultiSelectChipsFromSelect === 'function') {
                syncRiskMultiSelectChipsFromSelect('tiers');
            }

            const countriesSelect = document.getElementById('riskCountries');
            if (countriesSelect) {
                const availableValues = Array.from(countriesSelect.options).map(opt => opt.value);
                const preferredCountries = entitiesValues.length
                    ? entitiesValues
                    : availableValues;
                Array.from(countriesSelect.options).forEach(opt => {
                    opt.selected = preferredCountries.includes(opt.value);
                });
                if (typeof syncRiskCountryCheckboxesFromSelect === 'function') {
                    syncRiskCountryCheckboxesFromSelect();
                }
            }

            document.getElementById('titre').value = risk.titre || '';
            document.getElementById('description').value = risk.description || '';
            document.getElementById('example').value = risk.example || '';
            document.getElementById('comment').value = risk.comment || '';
            document.getElementById('probBrut').value = risk.probBrut;
            document.getElementById('impactBrut').value = risk.impactBrut;
            const probNetInput = document.getElementById('probNet');
            const impactNetInput = document.getElementById('impactNet');
            const mitigationInput = document.getElementById('mitigationEffectiveness');
            const probPostInput = document.getElementById('probPost');
            const impactPostInput = document.getElementById('impactPost');
            const postMitigationInput = document.getElementById('postActionMitigationEffectiveness');
            const defaultMitigation = typeof DEFAULT_MITIGATION_EFFECTIVENESS === 'string'
                ? DEFAULT_MITIGATION_EFFECTIVENESS
                : 'insuffisant';
            const mitigationLevel = risk.mitigationEffectiveness || defaultMitigation;
            if (mitigationInput) {
                mitigationInput.value = mitigationLevel;
            }
            if (probNetInput && typeof getMitigationColumnFromLevel === 'function') {
                probNetInput.value = getMitigationColumnFromLevel(mitigationLevel);
            } else if (probNetInput) {
                probNetInput.value = risk.probNet || probNetInput.value || 1;
            }
            if (impactNetInput) {
                impactNetInput.value = risk.impactNet || impactNetInput.value || 1;
            }
            const postMitigationLevel = typeof getRiskPostActionMitigationEffectiveness === 'function'
                ? getRiskPostActionMitigationEffectiveness(risk)
                : (risk.postActionMitigationEffectiveness || mitigationLevel);
            if (postMitigationInput) {
                postMitigationInput.value = postMitigationLevel;
            }
            if (probPostInput && typeof getMitigationColumnFromLevel === 'function') {
                const netColumn = parseInt(probNetInput?.value, 10) || getMitigationColumnFromLevel(mitigationLevel);
                probPostInput.value = Math.min(getMitigationColumnFromLevel(postMitigationLevel), netColumn);
            } else if (probPostInput) {
                const netColumn = parseInt(probNetInput?.value, 10) || 1;
                probPostInput.value = Math.min(risk.probPost || netColumn, netColumn);
            }
            if (impactPostInput) {
                impactPostInput.value = risk.impactPost || risk.impactNet || impactPostInput.value || 1;
            }

            if (typeof setAggravatingFactorsSelection === 'function') {
                setAggravatingFactorsSelection(risk.aggravatingFactors || null);
            }

            calculateScore('brut');
            calculateScore('net');
            calculateScore('post');
        }

        selectedControlsForRisk = [...(risk.controls || [])];
        if (typeof setRiskControlAssignments === 'function') {
            setRiskControlAssignments(risk.controlAssignments || []);
        }
        if (typeof setRiskBenefitChips === 'function') {
            setRiskBenefitChips('undue', risk.avantagesIndus || []);
            setRiskBenefitChips('expected', risk.avantagesAttendus || []);
        }
        selectedActionPlansForRisk = [...(risk.actionPlans || [])];
        updateSelectedControlsDisplay();
        updateSelectedActionPlansDisplay();

        activeRiskEditState = 'brut';
        const modal = document.getElementById('riskModal');
        if (modal) {
            if (typeof window.bringModalToFront === 'function') {
                window.bringModalToFront(modal);
            } else {
                modal.classList.add('show');
            }
            requestAnimationFrame(() => {
                initRiskEditMatrix();
                if (typeof window.focusRiskThemeField === 'function') {
                    window.focusRiskThemeField();
                }
            });
        }
    }

    deleteRisk(riskId) {
        if (!confirm('Are you sure you want to delete this risk?')) return;

        const index = this.risks.findIndex(r => idsEqual(r.id, riskId));
        if (index > -1) {
            const risk = this.risks[index];
            this.risks.splice(index, 1);
            this.addHistoryItem('Risk deletion', `Risk deleted: ${risk.description}`);
            this.saveData();
            this.init();
        }
    }

    // Export functions
    exportData(format = 'json') {
        if (format === 'json') {
            const snapshot = this.getSnapshot();
            snapshot.meta = {
                exportDate: new Date().toISOString(),
                exportedBy: 'Cartographie'
            };

            const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cartographie-donnees.json';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);

            if (typeof showNotification === 'function') {
                showNotification('success', 'Data exported successfully');
            }

            return;
        }

        if (format === 'csv') {
            const csv = this.convertToCSV(this.risks);

            if (!csv) {
                if (typeof showNotification === 'function') {
                    showNotification('warning', "Aucune donnée disponible pour l’export CSV.");
                }
                return;
            }

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `risks_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);

            if (typeof showNotification === 'function') {
                showNotification('success', 'CSV export successful!');
            }
        }
    }

    convertToCSV(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return '';
        }

        const headerSet = new Set();
        data.forEach(item => {
            if (item && typeof item === 'object' && !Array.isArray(item)) {
                Object.keys(item).forEach(key => headerSet.add(key));
            }
        });

        const headers = Array.from(headerSet);
        if (headers.length === 0) {
            return '';
        }

        const escapeValue = (value) => {
            if (value === null || value === undefined) {
                return '';
            }

            let stringValue;
            if (Array.isArray(value)) {
                stringValue = value.join('; ');
            } else if (typeof value === 'object') {
                stringValue = JSON.stringify(value);
            } else {
                stringValue = String(value);
            }

            const shouldQuote = /[",\n\r]/.test(stringValue);
            const escapedValue = stringValue.replace(/"/g, '""');
            return shouldQuote ? `"${escapedValue}"` : escapedValue;
        };

        const rows = data.map(row => {
            const inferStatusType = (entry) => {
                if (!entry || typeof entry !== 'object') {
                    return 'risk';
                }
                if ('dueDate' in entry || 'title' in entry) {
                    return 'actionPlan';
                }
                if ('origin' in entry || 'effectiveness' in entry || 'name' in entry) {
                    return 'control';
                }
                return 'risk';
            };

            return headers.map(header => {
                if (!row) {
                    return escapeValue(undefined);
                }

                const rawValue = row[header];
                if (['statut', 'status', 'statusLabel', 'state'].includes(header)) {
                    const type = inferStatusType(row);
                    const label = this.getStatusLabel(type, rawValue, row.status, row.statut, row.statusLabel, row.state);
                    return escapeValue(label || rawValue);
                }

                return escapeValue(rawValue);
            }).join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    }
}

var rms;
function setRms(instance) {
    rms = instance;
    window.rms = instance;
}

window.RiskManagementSystem = RiskManagementSystem;
window.setRms = setRms;
