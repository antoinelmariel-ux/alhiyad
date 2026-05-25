function prepareOnboardingStep(stepIndex) {
    const stickMenuTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    const scrollToElement = (selector) => {
        const target = document.querySelector(selector);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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
            setTimeout(() => scrollToElement('#riskDetailsListPost'), 120);
            break;
        case 9:
        case 10:
        case 11: {
            if (window.rms && typeof window.rms.viewRisk === 'function') {
                window.rms.viewRisk(1);
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
            break;
        }
        case 17:
            switchTab('legends');
            stickMenuTop();
            break;
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

function buildOnboardingTour() {
    const TourGuideClient = window.TourGuideClient || window.tourguide?.TourGuideClient;
    if (!TourGuideClient) {
        alert('TourGuide JS n’est pas disponible.');
        return null;
    }

    const tg = new TourGuideClient({
        showStepDots: true,
        exitOnEscape: true,
        exitOnClickOutside: false,
        activeStepInteraction: true,
        rememberStep: false,
        steps: [
            { title: 'Introduction', content: 'Bienvenue sur notre cartographie des risques du groupe Al Hiyad. Nous vous proposons une rapide explication sur le fonctionnement de notre outil.' },
            { title: 'Tableau de bord', target: '#tab-dashboard', content: 'Grâce au tableau de bord, vous aurez une vision globale de l’exposition du groupe aux risques éthiques.' },
            { title: 'Entretiens', target: '#tab-interviews', content: 'Cette section contient l’ensemble des comptes-rendus réalisés avec les collaborateurs du groupe. Ils démontrent la couverture de l’ensemble de nos processus.' },
            { title: 'Matrice des risques', target: '#tab-matrix', content: 'Retrouvez ici les risques éthiques du groupes présentés via 3 matrices. Vous avez la possibilité d’afficher l’ensemble des risques, ou de filtrer en fonction des thématiques, des entités concernées, … pour une lecture adaptée à vos besoins.' },
            { title: 'Matrice du risque brut', target: '#matrixGridBrut', content: 'La matrice des risques bruts présentent le positionnement des risques inhérents à notre groupe, en fonction de leur probabilité et de leur impact théorique, c-à-d en l’absence de mesure de maîtrise.', dialogPlacement: 'right' },
            { title: 'Matrice du risque net', target: '#matrixGridNet', content: 'La matrice des risques nets présentes les risques résiduels, c-à-d en tenant compte de l’efficacité de nos mesures de maitrise.', dialogPlacement: 'bottom' },
            { title: 'Matrice après plan d’action', target: '#matrixGridPost', content: 'Enfin, nous projetons ici les risques tels qu’ils seraient post mise en place des plans d’action déterminés et validés.', dialogPlacement: 'bottom' },
            { title: 'Tri des risques', target: '#riskDetailsTitlePost .risk-details-sort', content: 'Utilisez ce sélecteur pour trier les risques par ID ou par score avant d’ouvrir une fiche.' },
            { title: 'Lecture détaillée du risque', target: '#riskViewModal .risk-view-evolution-matrix', content: 'Retrouvez l’évolution du risque, de son score brut à son score post plan d’action.' },
            { title: 'Informations', target: '#riskViewModal .risk-view-section:nth-of-type(2)', content: 'Retrouvez l’ensemble des informations indiquées pour ce risque.' },
            { title: 'Modifier ce risque', target: '#riskViewEditButton', content: 'Le bouton permet de modifier le risque et de voir toutes les possibilités de la configuration.' },
            { title: 'Configuration – Thématique', target: '#riskTheme', content: 'Choisissez la thématique et les champs métiers associés.' },
            { title: 'Configuration – Matrice brute', target: '#riskMatrixEditBrut', content: 'Ajustez probabilité/impact directement dans la matrice brute en voyant automatiquement la légende s’ajuster.' },
            { title: 'Configuration - Facteurs aggravants', target: '#aggravatingFactorsBlock', content: 'Indiquez les facteurs aggravants. Les facteurs disponibles s’appliquent en fonction du type de risque.' },
            { title: 'Configuration – Risque net', target: '#netMitigationSlider', content: 'Indiquez le niveau de maîtrise pour passer du risque brut au risque net.' },
            { title: 'Configuration – Risque post plan d’action', target: '#postActionMitigationSlider', content: 'Vous avez à ce niveau la possibilité de rattacher des plans d’actions et d’indiquer le niveau de maîtrise projeté post plan d’action.' },
            { title: 'Légendes', target: '#tab-legends', content: 'Retrouvez ici les échelles utilisées. Notez que les facteurs aggravants sont propres à chaque thématique de risque.' }
        ]
    });

    tg.onAfterStepChange(() => {
        const index = Number.isInteger(tg.activeStep) ? tg.activeStep + 1 : 0;
        prepareOnboardingStep(index);
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
});
