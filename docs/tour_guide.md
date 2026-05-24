# Tour guidé — Référentiel des étapes

Ce document présente le **tour guidé** de l'application avec, pour chaque étape :
- le **titre** affiché,
- la **description** utilisateur,
- l'**onglet ciblé**,
- l'**élément ciblé** (sélecteur CSS),
- les **actions automatiques** éventuelles.

## 1) Tableau de bord
- **ID étape** : `dashboard`
- **Titre** : Tableau de bord
- **Description** : Grâce au tableau de bord, vous aurez une vision globale de l’exposition du groupe aux risques éthiques.
- **Onglet ciblé** : `dashboard`
- **Élément ciblé** : `#tour-tab-dashboard`
- **Action auto** : aucune

## 2) Entretiens
- **ID étape** : `interviews`
- **Titre** : Entretiens
- **Description** : Cette section contient l’ensemble des comptes-rendus réalisés avec les collaborateurs du groupe. Ils démontrent la couverture de l’ensemble de nos processus.
- **Onglet ciblé** : `interviews`
- **Élément ciblé** : `#tour-tab-interviews`
- **Action auto** : aucune

## 3) Matrice des risques
- **ID étape** : `matrixTab`
- **Titre** : Matrice des risques
- **Description** : Retrouvez ici les risques éthiques du groupe présentés via 3 matrices. Vous avez la possibilité d’afficher l’ensemble des risques, ou de filtrer en fonction des thématiques, des entités concernées, pour une lecture adaptée à vos besoins.
- **Onglet ciblé** : `matrix`
- **Élément ciblé** : `#tour-tab-matrix`
- **Action auto** : aucune

## 4) Registre des risques
- **ID étape** : `risksTab`
- **Titre** : Registre des risques
- **Description** : Le registre des risques permet de revoir les informations risque par risque, avec des logiques de filtres plus précises.
- **Onglet ciblé** : `risks`
- **Élément ciblé** : `#tour-tab-risks`
- **Position popover** : `bottom`
- **Action auto** : aucune

## 5) Contrôles & atténuation
- **ID étape** : `controlsTab`
- **Titre** : Contrôles & atténuation
- **Description** : Vous avez à ce niveau la possibilité de rattacher des contrôles / mesures de prévention pour justifier votre positionnement.
- **Onglet ciblé** : `controls`
- **Élément ciblé** : `#tour-tab-controls`
- **Action auto** : `closeRiskModal`

## 6) Créer un contrôle
- **ID étape** : `controlCreateBtn`
- **Titre** : Créer un contrôle
- **Description** : Depuis cet onglet, ouvrez la modal pour ajouter un nouveau contrôle.
- **Onglet ciblé** : `controls`
- **Élément ciblé** : `#tour-open-control-modal-btn`
- **Action auto** : `openControlModal`

## 7) Plans d’action
- **ID étape** : `plansTab`
- **Titre** : Plans d’action
- **Description** : Ajoutez des plans d’action.
- **Onglet ciblé** : `plans`
- **Élément ciblé** : `#tour-tab-plans`
- **Action auto** : `closeControlModal`

## 8) Créer un plan d’action
- **ID étape** : `planCreateBtn`
- **Titre** : Créer un plan d’action
- **Description** : Cet onglet centralise la création et le suivi des plans d’action.
- **Onglet ciblé** : `plans`
- **Élément ciblé** : `#tour-open-plan-modal-btn`
- **Action auto** : `openActionPlanModal`

## 9) Légendes
- **ID étape** : `legendsTab`
- **Titre** : Légendes
- **Description** : Retrouvez ici les échelles utilisées. Notez que les facteurs aggravants sont propres à chaque thématique de risque.
- **Onglet ciblé** : `legends`
- **Élément ciblé** : `#tour-tab-legends`
- **Action auto** : aucune

---

## Source de vérité
La configuration de ces étapes est définie dans :
- `assets/js/onboarding.tour.js` (tableau `defaultSteps`).
