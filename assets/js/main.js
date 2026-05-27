function prepareOnboardingStep(stepIndex) {
    const stickMenuTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    const slowScrollMainTo = (top) => window.scrollTo({ top, behavior: 'smooth' });
    const scrollToElement = (selector, options = { block: 'center' }) => {
        const target = document.querySelector(selector);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: options.block || 'center' });
        }
    };

    const scrollWithinModalTo = (modalSelector, targetSelector, offset = 24) => {
        const modal = document.querySelector(modalSelector);
        const target = document.querySelector(targetSelector);
        if (!modal || !target) return;

        const modalScrollHost = modal.querySelector('.modal-body') || modal;
        const modalHeader = modal.querySelector('.modal-header');
        const modalFooter = modal.querySelector('.modal-footer');
        const headerHeight = modalHeader ? modalHeader.getBoundingClientRect().height : 0;
        const footerHeight = modalFooter ? modalFooter.getBoundingClientRect().height : 0;
        const effectiveOffsetTop = Math.max(offset, 16) + Math.min(headerHeight * 0.4, 32);
        const effectiveOffsetBottom = Math.max(20, Math.min(footerHeight + 12, 80));

        const alignTargetInView = () => {
            const hostRect = modalScrollHost.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const currentScrollTop = modalScrollHost.scrollTop;
            const relativeTop = targetRect.top - hostRect.top + currentScrollTop;
            const maxScrollTop = Math.max(0, modalScrollHost.scrollHeight - modalScrollHost.clientHeight);
            const nextScrollTop = Math.max(
                0,
                Math.min(maxScrollTop, relativeTop - effectiveOffsetTop)
            );

            modalScrollHost.scrollTo({ top: nextScrollTop, behavior: 'smooth' });
        };

        requestAnimationFrame(alignTargetInView);
    };

    const scrollRiskPanelTop = () => {
        const panel = document.querySelector('.matrix-container[data-view="post"] .risk-details-panel');
        if (panel) {
            panel.scrollTop = 0;
            panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const closeRiskViewModal = () => {
        const riskViewModal = document.getElementById('riskViewModal');
        if (riskViewModal?.classList.contains('show') && typeof window.closeModal === 'function') {
            window.closeModal('riskViewModal');
        }
    };

    const focusModalTourTarget = (targetSelector, offset = 24, delay = 180) => {
        setTimeout(() => {
            scrollWithinModalTo('#riskModal', targetSelector, offset);
            setTimeout(() => {
                scrollWithinModalTo('#riskModal', targetSelector, offset);
            }, 220);
        }, delay);
    };

    switch (stepIndex) {
        case 1:
        case 2:
            switchTab('dashboard');
            stickMenuTop();
            break;
        case 3:
            switchTab('interviews');
            stickMenuTop();
            break;
        case 4:
            switchTab('matrix');
            stickMenuTop();
            break;
        case 5:
            switchTab('matrix');
            setTimeout(() => scrollToElement('#matrixGridBrut'), 120);
            break;
        case 6:
            switchTab('matrix');
            setTimeout(() => scrollToElement('#matrixGridNet'), 120);
            break;
        case 7:
            switchTab('matrix');
            setTimeout(() => scrollToElement('#matrixGridPost'), 120);
            break;
        case 8:
            switchTab('matrix');
            setTimeout(() => {
                scrollRiskPanelTop();
                scrollToElement('#riskDetailsListPost', { block: 'start' });
            }, 120);
            break;
        case 9:
        case 10:
        case 11: {
            if (window.rms && typeof window.rms.viewRisk === 'function') {
                window.rms.viewRisk(1);
                if (stepIndex === 10) {
                    setTimeout(() => {
                        scrollWithinModalTo('#riskViewModal', '#riskViewModal .risk-view-overview-sections');
                    }, 180);
                } else {
                    setTimeout(() => scrollWithinModalTo('#riskViewModal', '#riskViewModal .risk-view-evolution-section'), 180);
                }
                break;
            }

            const riskDetailButton = document.querySelector('#riskDetailsListPost .risk-item[data-risk-id="1"] .action-btn[title="Voir le risque"]');
            if (riskDetailButton) {
                riskDetailButton.click();
            }
            break;
        }
        case 12:
        case 13:
        case 14:
        case 15:
        case 16: {
            const isRiskModalOpen = document.getElementById('riskModal')?.classList.contains('show');
            if (!isRiskModalOpen) {
                const editButton = document.getElementById('riskViewEditButton');
                if (editButton) {
                    editButton.click();
                }
            }

            if (stepIndex === 12) {
                focusModalTourTarget('#riskFormThemeSection', 12);
            }
            if (stepIndex === 13) {
                focusModalTourTarget('#risk-matrix-editor');
            }
            if (stepIndex === 14) {
                focusModalTourTarget('#aggravatingFactorsBlock');
            }
            if (stepIndex === 15) {
                focusModalTourTarget('#riskControlsSection');
            }
            if (stepIndex === 16) {
                focusModalTourTarget('#controls-section');
            }
            break;
        }
        case 17: {
            const riskModal = document.getElementById('riskModal');
            if (riskModal?.classList.contains('show') && typeof window.closeModal === 'function') {
                window.closeModal('riskModal');
            }
            closeRiskViewModal();
            switchTab('legends');
            stickMenuTop();
            break;
        }
        default:
            break;
    }
}


function bindOnboardingDialogButtons(tg) {
    document.addEventListener('click', (event) => {
        const nextBtn = event.target.closest('.tg-dialog-next-btn');
        if (nextBtn) {
            event.preventDefault();
            event.stopPropagation();
            tg.nextStep();
            return;
        }

        const prevBtn = event.target.closest('.tg-dialog-prev-btn');
        if (prevBtn) {
            event.preventDefault();
            event.stopPropagation();
            tg.prevStep();
        }
    }, true);
}



function ensureOnboardingIgnoreButton(tg) {
    const dialogFooter = document.querySelector('.tg-dialog .tg-dialog-footer');
    if (!dialogFooter || dialogFooter.querySelector('.tg-dialog-ignore-btn')) return;

    const ignoreBtn = document.createElement('button');
    ignoreBtn.type = 'button';
    ignoreBtn.className = 'tg-dialog-btn tg-dialog-ignore-btn';
    ignoreBtn.textContent = 'Ignorer';
    ignoreBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        tg.exit();
    });

    dialogFooter.prepend(ignoreBtn);
}

function buildOnboardingTour() {
    const TourGuideClient = window.TourGuideClient || window.tourguide?.TourGuideClient;
    if (!TourGuideClient) {
        alert('TourGuide JS n’est pas disponible.');
        return null;
    }

    const tg = new TourGuideClient({
        showStepDots: true,
        prevLabel: '<',
        nextLabel: '>',
        finishLabel: 'Fin',
        exitOnEscape: true,
        exitOnClickOutside: false,
        activeStepInteraction: true,
        rememberStep: false,
        steps: [
            { title: 'Introduction', content: 'Bienvenue sur notre cartographie des risques du groupe Al Hiyad. Nous vous proposons une rapide explication sur le fonctionnement de notre outil.' },
            { title: 'Tableau de bord', target: '#tab-dashboard', content: "Grâce au tableau de bord, vous aurez une vision globale de l’exposition du groupe aux risques éthiques. Seuls 5 risques ont été dévéloppés mais pour un rendu réaliste nous avons créé d'autres faux risques, qui apparaissent en floutés" },
            { title: 'Entretiens', target: '#tab-interviews', content: 'Cette section contient l’ensemble des comptes-rendus réalisés avec les collaborateurs du groupe. Ils démontrent la couverture de l’ensemble de nos processus.' },
            { title: 'Matrice des risques', target: '#tab-matrix', content: 'Retrouvez ici les risques éthiques du groupes présentés via 3 matrices. Vous avez la possibilité d’afficher l’ensemble des risques, ou de filtrer en fonction des thématiques, des entités concernées, … pour une lecture adaptée à vos besoins.' },
            { title: 'Matrice du risque brut', target: '#matrixGridBrut', content: 'La matrice des risques bruts présentent le positionnement des risques inhérents à notre groupe, en fonction de leur probabilité et de leur impact théorique, c-à-d en l’absence de mesure de maîtrise.', dialogPlacement: 'right' },
            { title: 'Matrice du risque net', target: '#matrixGridNet', content: 'La matrice des risques nets présentes les risques résiduels, c-à-d en tenant compte de l’efficacité de nos mesures de maitrise.', dialogPlacement: 'bottom' },
            { title: 'Matrice après plan d’action', target: '#matrixGridPost', content: 'Enfin, nous projetons ici les risques tels qu’ils seraient post mise en place des plans d’action déterminés et validés.', dialogPlacement: 'bottom' },
            { title: 'Risques après plan d’action', target: '.matrix-container[data-view="post"] .risk-details-panel', content: 'Le panneau est automatiquement repositionné en haut pour afficher la liste complète des risques post plan d’action. Cliquez sur l’icône œil d’un risque pour afficher son détail.' },
            { title: 'Lecture détaillée du risque', target: '#riskViewModal .risk-view-section.risk-view-evolution-section', content: 'Le focus est centré sur la matrice d’évolution afin de visualiser immédiatement le passage du score brut au score post plan d’action.' },
            { title: 'Informations', target: '#riskViewModal .risk-view-overview-sections', content: 'Retrouvez ici les blocs « Informations générales » et « Évaluation du risque » pour une lecture complète du contexte et des scores.' },
            { title: 'Modifier ce risque', target: '#riskViewEditButton', content: 'Le bouton permet de modifier le risque et de voir toutes les possibilités de la configuration.', forceDialogTopRight: true },
            { title: 'Configuration – Thématique', target: '#riskFormThemeSection', content: "Choisissez la thématique. En fonction certains champs spécifiques s'affichent.", dialogPlacement: 'top-start', forceDialogTopRight: true },
            { title: 'Configuration – Matrice brute', target: '#risk-matrix-editor', dialogTarget: '#riskFormThemeSection', content: 'Ajustez probabilité/impact directement dans la matrice brute en voyant automatiquement la légende s’ajuster.', dialogPlacement: 'top-start', forceDialogTopRight: true },
            { title: 'Configuration - Facteurs aggravants', target: '#aggravatingFactorsBlock', dialogTarget: '#riskFormThemeSection', content: 'Indiquez les facteurs aggravants. Les facteurs disponibles sont dépendants du type de risque.', dialogPlacement: 'top-start', forceDialogTopRight: true },
            { title: 'Contrôle', target: '#riskControlsSection', dialogTarget: '#riskFormThemeSection', content: 'Vous pouvez rattacher au risque brut les contrôles et mesures de maîtrise issues de votre référentiel de contrôles.', dialogPlacement: 'top-start', forceDialogTopRight: true },
            { title: 'Configuration – Risque net', target: '#riskNetEvaluationSection', dialogTarget: '#riskFormThemeSection', content: 'Sur cette base, évaluez le niveau de maîtrise du risque pour évaluer le risque net.', dialogPlacement: 'top-start', forceDialogTopRight: true },
          { title: 'Configuration – Risque post plan d’action', target: '#riskActionPlansSection', dialogTarget: '#riskFormThemeSection', content: 'Vous avez à ce niveau la possibilité de rattacher des plans d’actions et d’indiquer le niveau de maîtrise projeté post plan d’action.', dialogPlacement: 'top-start', forceDialogTopRight: true },
            { title: 'Légendes', target: '#tab-legends', content: 'Retrouvez ici les échelles utilisées. Notez que les facteurs aggravants sont propres à chaque thématique de risque.' },
            { title: 'Relancer la présentation', target: '#startOnboardingTourBtn', content: 'Vous pouvez relancer à tout moment le tour de présentation de la cartographie via ce bouton.' }
        ]
    });

    tg.onAfterStepChange(() => {
        const index = Number.isInteger(tg.activeStep) ? tg.activeStep + 1 : 0;
        prepareOnboardingStep(index);
        const activeStepConfig = tg.tourSteps?.[tg.activeStep];
        const dialog = document.querySelector('.tg-dialog');
        if (dialog) {
            dialog.classList.toggle('tg-dialog-absolute-top-right', Boolean(activeStepConfig?.forceDialogTopRight));
        }
        ensureOnboardingIgnoreButton(tg);
    });

    return tg;
}

document.addEventListener('DOMContentLoaded', () => {
    const rms = new RiskManagementSystem();
    setRms(rms);
    bindEvents();
    if (typeof setupUnsavedChangeTracking === 'function') setupUnsavedChangeTracking();
    if (typeof registerBeforeUnloadWarning === 'function') registerBeforeUnloadWarning();
    applyPatch();
    rms.renderAll();

    const startTourButton = document.getElementById('startOnboardingTourBtn');
    const tg = buildOnboardingTour();
    if (tg) {
        bindOnboardingDialogButtons(tg);
    }

    if (startTourButton && tg) {
        startTourButton.addEventListener('click', () => {
            prepareOnboardingStep(1);
            tg.start();
        });
    }

    if (tg && !localStorage.getItem('alhiyad-onboarding-autostarted')) {
        localStorage.setItem('alhiyad-onboarding-autostarted', '1');
        prepareOnboardingStep(1);
        tg.start();
    }
});
