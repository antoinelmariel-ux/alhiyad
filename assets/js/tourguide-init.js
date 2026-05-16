(function () {
    const TOUR_STEPS = [
        {
            title: 'Bienvenue',
            content: 'Ce guide présente les zones principales de la cartographie des risques et compliance Al Hiyad.',
            target: '.header-title',
            order: 1,
        },
        {
            title: 'Navigation',
            content: 'Utilisez ces onglets pour passer du tableau de bord aux interviews, matrices, risques, contrôles, plans d’action, légendes et paramètres.',
            target: '.nav-tabs',
            order: 2,
        },
        {
            title: 'Tableau de bord',
            content: 'Le tableau de bord synthétise les indicateurs clés, les risques prioritaires et les alertes récentes.',
            target: '#dashboard-tab .toolbar',
            order: 3,
        },
        {
            title: 'Exporter les données',
            content: 'Ce bouton permet d’enregistrer et d’exporter les données opérationnelles de la cartographie.',
            target: '.header-buttons .btn-primary',
            order: 4,
        },
        {
            title: 'Relancer l’explication',
            content: 'Vous pourrez relancer ce tour guidé à tout moment depuis le bouton “Lancer l’explication”.',
            target: '#tourGuideLaunchButton',
            order: 5,
        },
    ];

    const TOUR_OPTIONS = {
        steps: TOUR_STEPS,
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

    let tourGuideClient = null;

    function notifyTourGuideUnavailable() {
        const message = 'Le module TourGuide JS est indisponible. Vérifiez la connexion au CDN puis réessayez.';
        if (typeof window.showNotification === 'function') {
            window.showNotification('warning', message);
            return;
        }
        window.alert(message);
    }

    function createTourGuideClient() {
        if (!window.tourguide || typeof window.tourguide.TourGuideClient !== 'function') {
            return null;
        }

        if (!tourGuideClient) {
            tourGuideClient = new window.tourguide.TourGuideClient(TOUR_OPTIONS);
        }

        return tourGuideClient;
    }

    function startTourGuide() {
        if (typeof window.switchTab === 'function') {
            window.switchTab('dashboard');
        }

        const client = createTourGuideClient();
        if (!client || typeof client.start !== 'function') {
            notifyTourGuideUnavailable();
            return;
        }

        client.start();
    }

    function initTourGuideButton() {
        const launchButton = document.getElementById('tourGuideLaunchButton');
        if (!launchButton) {
            return;
        }

        launchButton.addEventListener('click', startTourGuide);
    }

    document.addEventListener('DOMContentLoaded', initTourGuideButton);
    window.startTourGuide = startTourGuide;
}());
