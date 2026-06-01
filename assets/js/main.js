
function setupRiskRegisterScrollCue() {
    const container = document.getElementById('riskTableScrollContainer');
    const button = document.getElementById('riskTableScrollButton');

    if (!container) {
        return null;
    }

    const update = () => {
        const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
        const canScrollLeft = container.scrollLeft > 4;
        const canScrollRight = container.scrollLeft < maxScrollLeft - 4;
        const hasHorizontalOverflow = maxScrollLeft > 4;

        container.classList.toggle('has-horizontal-overflow', hasHorizontalOverflow);
        container.classList.toggle('can-scroll-left', canScrollLeft);
        container.classList.toggle('can-scroll-right', canScrollRight);

        if (button) {
            button.hidden = !hasHorizontalOverflow;
            button.textContent = canScrollRight ? 'Voir les colonnes à droite →' : '← Revenir au début du tableau';
            button.setAttribute(
                'aria-label',
                canScrollRight
                    ? 'Faire défiler le registre des risques vers les colonnes de droite'
                    : 'Revenir au début du registre des risques'
            );
        }
    };

    container.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    if (button) {
        button.addEventListener('click', () => {
            const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
            const shouldGoRight = container.scrollLeft < maxScrollLeft - 4;
            container.scrollTo({
                left: shouldGoRight ? maxScrollLeft : 0,
                behavior: 'smooth'
            });
        });
    }

    if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(container);
        const table = document.getElementById('risksTable');
        if (table) resizeObserver.observe(table);
    }

    const tableBody = document.getElementById('risksTableBody');
    if (tableBody && 'MutationObserver' in window) {
        const mutationObserver = new MutationObserver(update);
        mutationObserver.observe(tableBody, { childList: true, subtree: true });
    }

    requestAnimationFrame(update);
    window.updateRiskRegisterScrollCue = update;
    return update;
}

function prepareOnboardingStep(stepIndex) {
    const safeSwitchTab = (tabName) => {
        if (typeof window.switchTab === 'function') {
            window.switchTab(tabName);
        }
    };
    const stickMenuTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
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
            safeSwitchTab('dashboard');
            stickMenuTop();
            break;
        case 3:
            safeSwitchTab('interviews');
            stickMenuTop();
            break;
        case 4:
            safeSwitchTab('matrix');
            stickMenuTop();
            break;
        case 5:
            safeSwitchTab('matrix');
            setTimeout(() => scrollToElement('#matrixGridBrut'), 120);
            break;
        case 6:
            safeSwitchTab('matrix');
            setTimeout(() => scrollToElement('#matrixGridNet'), 120);
            break;
        case 7:
            safeSwitchTab('matrix');
            setTimeout(() => scrollToElement('#matrixGridPost'), 120);
            break;
        case 8:
            safeSwitchTab('matrix');
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
                if (stepIndex === 9) {
                    setTimeout(() => scrollWithinModalTo('#riskViewModal', '#riskViewModal .risk-view-evolution-section'), 180);
                }
                if (stepIndex === 10) {
                    setTimeout(() => {
                        scrollWithinModalTo('#riskViewModal', '#riskViewModal .risk-view-overview-sections');
                    }, 180);
                }
                if (stepIndex === 11) {
                    const editButton = document.getElementById('riskViewEditButton');
                    setTimeout(() => {
                        editButton?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                        editButton?.focus({ preventScroll: true });
                    }, 180);
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
        case 16:
        case 17: {
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
                focusModalTourTarget('#netRiskAssessmentSection');
            }
            if (stepIndex === 17) {
                focusModalTourTarget('#postActionAssessmentSection');
            }
            break;
        }
        case 18: {
            const riskModal = document.getElementById('riskModal');
            if (riskModal?.classList.contains('show') && typeof window.closeModal === 'function') {
                window.closeModal('riskModal');
            }
            closeRiskViewModal();
            safeSwitchTab('legends');
            stickMenuTop();
            break;
        }
        default:
            break;
    }
}


function isOnboardingTourVisible(tg) {
    return Boolean(tg?.isVisible && document.querySelector('.tg-dialog'));
}

async function navigateOnboardingTour(tg, direction) {
    if (!isOnboardingTourVisible(tg) || tg._alhiyadNavigationPending) {
        return;
    }

    tg._alhiyadNavigationPending = true;

    try {
        if (direction === 'next') {
            const isLastStep = tg.activeStep >= (tg.tourSteps?.length || 0) - 1;
            if (isLastStep) {
                await tg.finishTour(true, tg.group);
            } else {
                await tg.nextStep();
            }
            return;
        }

        await tg.prevStep();
    } catch (error) {
        const expectedBoundaryError = direction === 'prev' && error === 'Start of tour steps';
        if (!expectedBoundaryError) {
            console.warn('Navigation du tour guidé ignorée :', error);
        }
    } finally {
        requestAnimationFrame(() => {
            tg._alhiyadNavigationPending = false;
        });
    }
}

function bindOnboardingDialogButtons(tg) {
    document.addEventListener('click', (event) => {
        const nextBtn = event.target.closest('.tg-dialog-next-btn');
        if (nextBtn) {
            event.preventDefault();
            event.stopPropagation();
            navigateOnboardingTour(tg, 'next');
            return;
        }

        const prevBtn = event.target.closest('.tg-dialog-prev-btn');
        if (prevBtn) {
            event.preventDefault();
            event.stopPropagation();
            navigateOnboardingTour(tg, 'prev');
        }
    }, true);
}

function bindOnboardingKeyboardControls(tg) {
    window.addEventListener('keydown', (event) => {
        if (!isOnboardingTourVisible(tg) || !['ArrowRight', 'ArrowLeft'].includes(event.key)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        navigateOnboardingTour(tg, event.key === 'ArrowRight' ? 'next' : 'prev');
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
        keyboardControls: false,
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
            { title: 'Risques après plan d’action', target: '.matrix-container[data-view="post"] .risk-details-panel', content: 'Vous retrouvez dans la liste l’ensemble des risques avec la possibilité de cliquer sur l’oeil pour avoir le détail.' },
            { title: 'Lecture détaillée du risque', target: '#riskViewModal .risk-view-section.risk-view-evolution-section', content: 'Vous voyez ici l’évolution du risque, de son score brut à son score net post plan d’action.' },
            { title: 'Informations', target: '#riskViewModal .risk-view-overview-sections', content: 'Le reste du panneau vous présente les informations clefs sur le risque et son évaluation comme sa description, les tiers et services internes concernés, la description ou encore des situations / CJIP proches connues en interne ou en externe.', forceDialogTopRight: true },
            { title: 'Modifier ce risque', target: '#riskViewEditButton', content: 'Le bouton permet de modifier le risque et de voir toutes les possibilités de la configuration.' },
            { title: 'Configuration – Thématique', target: '#riskFormThemeSection', content: "Choisissez la thématique. En fonction, les champs s’adaptent et certains champs spécifiques apparaissent - comme ceux permettant de donner plus d’informations sur le type de corruption", dialogPlacement: 'top-start', forceDialogTopRight: true },
            { title: 'Configuration – Matrice brute', target: '#risk-matrix-editor', dialogTarget: '#riskFormThemeSection', content: 'Ajustez probabilité/impact directement dans la matrice brute : la légende s’ajuste dynamiquement pour vous guider.', dialogPlacement: 'top-start', forceDialogTopRight: true },
            { title: 'Configuration - Facteurs aggravants', target: '#aggravatingFactorsBlock', dialogTarget: '#riskFormThemeSection', content: 'Indiquez les facteurs aggravants. Ces derniers dépendent du type de risque. Le coefficient du facteur aggravant selectionné le plus élévé sera celui retenu.', dialogPlacement: 'top-start', forceDialogTopRight: true },
            { title: 'Contrôle', target: '#riskControlsSection', dialogTarget: '#riskFormThemeSection', content: 'Vous pouvez rattacher au risque brut les contrôles et mesures de maîtrise issues de votre référentiel de contrôles. Ces contrôles peuvent être transverses ou spécifique à un avantage indus. Vous pouvez obtenir plus d’information sur le contrôle et son efficacité en allant voir le détail dans l’onglet dédié.', dialogPlacement: 'top-start', forceDialogTopRight: true },
            { title: 'Configuration – Risque net', target: '#netRiskAssessmentSection', dialogTarget: '#riskFormThemeSection', content: 'Sur cette base, évaluez le niveau de maîtrise du risque pour évaluer le risque net.', dialogPlacement: 'top-start', forceDialogTopRight: true },
            { title: 'Configuration – Risque post plan d’action', target: '#postActionAssessmentSection', dialogTarget: '#riskFormThemeSection', content: 'Vous avez à ce niveau la possibilité de rattacher des plans d’actions et d’indiquer le niveau de maîtrise projeté post plan d’action. Pour plus de détail sur les plans d’action, vous pouvez aller dans l’onglet dédié.', dialogPlacement: 'top-start', forceDialogTopRight: true },
            { title: 'Légendes', target: '#tab-legends', content: 'Retrouvez ici les échelles utilisées. Notez que les facteurs aggravants sont propres à chaque thématique de risque.' },
            { title: 'Relancer la présentation', target: '#startOnboardingTourBtn', content: 'Vous pouvez relancer à tout moment le tour de présentation de la cartographie via ce bouton.' }
        ]
    });

    tg.onBeforeStepChange((_currentStep, nextStep) => {
        const index = Number.isInteger(nextStep) ? nextStep + 1 : 0;

        try {
            prepareOnboardingStep(index);
        } catch (error) {
            console.warn('Préparation de l’étape du tour ignorée :', error);
        }
    });

    tg.onAfterStepChange(() => {
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
    setupRiskRegisterScrollCue();

    const startTourButton = document.getElementById('startOnboardingTourBtn');
    const tg = buildOnboardingTour();
    if (tg) {
        bindOnboardingDialogButtons(tg);
        bindOnboardingKeyboardControls(tg);
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
