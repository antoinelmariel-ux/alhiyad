// Enhanced Risk Management System - Shared Constants

const RISK_PROBABILITY_INFO = {
    1: {
        label: 'Unlikely',
        text: 'Event has not occurred in the past 5 years. Event not expected to occur in the next 5 years.'
    },
    2: {
        label: 'Moderately likely',
        text: 'Event that has occurred once in the past 5 years. Event that may occur once in the next 5 years.'
    },
    3: {
        label: 'Likely',
        text: 'Event that has occurred once in the past year. Event that may occur once in the coming year.'
    },
    4: {
        label: 'Very likely',
        text: 'Event that occurred several times in the past year. Event expected to occur once or more times in the coming year.'
    }
};

const RISK_IMPACT_INFO = {
    1: {
        label: 'Low',
        text: "<p><strong>Financial (base)</strong></p><ul><li>&lt; 300K€</li></ul><p><strong>Legal</strong></p><ul><li>internal disciplinary action against an employee</li></ul><p><strong>Reputational</strong></p><ul><li>no impact, internal or local external (e.g., partners)</li><li>disruption limited to a few days</li></ul><p><strong>Operational</strong></p><ul><li>little or no disruption</li><li>slowdown in operations</li></ul>"
    },
    2: {
        label: 'Moderate',
        text: "<p><strong>Financial (base)</strong></p><ul><li>[300K€ ; 3M€[</li></ul><p><strong>Legal</strong></p><ul><li>legal or administrative proceedings involving an individual employee</li></ul><p><strong>Reputational</strong></p><ul><li>regional external impact</li><li>disruption limited to a few weeks</li></ul><p><strong>Operational</strong></p><ul><li>minor disruptions</li><li>temporary loss of business or contracts</li></ul>"
    },
    3: {
        label: 'High',
        text: "<p><strong>Financial (base)</strong></p><ul><li>[3M€ ; 30M€[</li></ul><p><strong>Legal</strong></p><ul><li>sanctions at the affiliate level; Judicial Public Interest Agreement (CJIP)</li></ul><p><strong>Reputational</strong></p><ul><li>national external impact (e.g., Department of Health)</li><li>national media crisis</li><li>impact lasting several months</li></ul><p><strong>Operational</strong></p><ul><li>significant disruptions</li><li>permanent loss of business or contracts</li></ul>"
    },
    4: {
        label: 'Critical',
        text: "<p><strong>Financial (base)</strong></p><ul><li>≥ 30M€</li></ul><p><strong>Legal</strong></p><ul><li>group-wide sanctions; criminal conviction</li></ul><p><strong>Reputational</strong></p><ul><li>international external impact (e.g., EMA, FDA, etc.)</li><li>international media crisis</li><li>long-term damage lasting several years</li></ul><p><strong>Operational</strong></p><ul><li>cessation of operations</li></ul>"
    }
};

const RISK_STATE_CONFIG = {
    brut: {
        label: 'Aggravated Gross Risk',
        probInput: 'probBrut',
        impactInput: 'impactBrut',
        scoreElement: 'scoreBrut',
        coordElement: 'coordBrut',
        pointClass: 'brut',
        symbol: 'B',
        matrixId: 'riskMatrixEditBrut',
        gridId: 'riskMatrixEditGridBrut',
        descriptionContainer: 'matrixDescriptionBrut'
    },
    net: {
        label: 'Net Risk',
        probInput: 'probNet',
        impactInput: 'impactNet',
        scoreElement: 'scoreNet',
        coordElement: 'coordNet',
        pointClass: 'net',
        symbol: 'N',
        matrixId: null,
        gridId: null,
        descriptionContainer: 'matrixDescriptionNet',
        sliderId: 'netMitigationSlider',
        mitigationInputId: 'mitigationEffectiveness',
        marksId: 'netMitigationMarks',
        percentLabelId: 'netMitigationPercentLabel',
        severityLabelId: 'netSeverityLabel'
    },
    post: {
        label: 'Post Action Plan Net Risk',
        probInput: 'probPost',
        impactInput: 'impactPost',
        scoreElement: 'scorePost',
        coordElement: 'coordPost',
        pointClass: 'post',
        symbol: 'P',
        matrixId: null,
        gridId: null,
        descriptionContainer: 'matrixDescriptionPost',
        sliderId: 'postActionMitigationSlider',
        mitigationInputId: 'postActionMitigationEffectiveness',
        marksId: 'postActionMitigationMarks',
        percentLabelId: 'postActionMitigationPercentLabel',
        severityLabelId: 'postActionSeverityLabel'
    }
};

const MITIGATION_EFFECTIVENESS_DESCRIPTIONS = Object.freeze({
    inefficace: `
        <p><strong>Governance</strong></p>
        <ul>
<li>No management commitment</li>
<li>No ethics and compliance principles communicated or enforced</li>
<li>No dedicated ethics and compliance function</li>
<li>No reporting or monitoring of ethics and compliance topics</li>
        </ul>
        <p><strong>Procedures and controls</strong></p>
        <ul>
<li>Lack of procedures/processes</li>
<li>Ineffective or irrelevant processes, not implemented or not communicated</li>
<li>Lack of controls</li>
<li>Ineffective, irrelevant, or unenforced controls</li>
</ul>
<p><strong>Training</strong></p>
<ul>
<li>Lack of training or awareness</li>
<li>Ineffective or irrelevant training</li>
<li>Very low training rate (≤ 20%)</li>
</ul>
    `,
    insuffisant: `
        <p><strong>Governance</strong></p>
        <ul>
<li>Informal commitment from management</li>
<li>Limited, informal, or partial communication regarding adherence to ethics and compliance principles</li>
<li>No team officially responsible for the ethics and compliance function</li>
<li>Informal monitoring of ethics and compliance issues with no reporting to management</li>
</ul>
<p><strong>Procedures and controls</strong></p>
<ul>
<li>Informal processes (no formalized procedures), partially communicated verbally and partially implemented</li>
<li>Ad hoc, non-formalized controls that are partially implemented</li>
</ul>
<p><strong>Training</strong></p>
<ul>
<li>Informal (verbal), ad hoc, and/or partial training or awareness-raising for employees and new hires</li>
<li>Low training rate (between 20% and 50%)</li>
</ul>
    `,
    ameliorable: `
        <p><strong>Governance</strong></p>
        <ul>
<li>Formal/passive management commitment (reactive upon request, limited proactive ownership)</li>
<li>Irregular communications on ethics and compliance principles (no dedicated communication plan)</li>
<li>Ethics and compliance team also handling other responsibilities; no dedicated committee</li>
<li>Irregular reporting to management on action follow-up</li>
</ul>
<p><strong>Procedures and controls</strong></p>
<ul>
<li>Procedures partially formalized, communicated, implemented, monitored, and/or audited</li>
<li>Irregular updates to procedures</li>
<li>Controls partially formalized/documented, without systematic corrective actions or regular reviews/audits</li>
</ul>
<p><strong>Training</strong></p>
<ul>
<li>Standard training for all employees (no specific targeting of most exposed groups)</li>
<li>No training plan established or not updated</li>
<li>Training completion rate could be improved (between 50% and 90%)</li>
<li>Lack of systematic follow-ups with employees</li>
</ul>
    `,
    efficace: `
        <p><strong>Governance</strong></p>
        <ul>
<li>Active management commitment with strong involvement in monitoring and decision-making</li>
<li>Regular communications on adherence to ethics and compliance principles (defined communication plan)</li>
<li>Dedicated ethics and compliance team and an active committee in place</li>
<li>Regular reporting to management on action monitoring</li>
</ul>
<p><strong>Procedures and controls</strong></p>
<ul>
<li>Procedures systematically formalized, communicated, implemented, monitored, and audited</li>
<li>Systematic, formalized, and documented controls with corrective actions, internal reviews, and audits</li>
</ul>
<p><strong>Training</strong></p>
<ul>
<li>Regular, targeted training tailored to specific groups, prioritizing in-person sessions for most exposed populations</li>
<li>Training plan established by target groups, integrating new hires and defining training frequencies</li>
<li>High training rate (≥ 90%)</li>
</ul>
    `
});


window.RISK_PROBABILITY_INFO = RISK_PROBABILITY_INFO;
window.RISK_IMPACT_INFO = RISK_IMPACT_INFO;
window.RISK_STATE_CONFIG = RISK_STATE_CONFIG;
window.MITIGATION_EFFECTIVENESS_DESCRIPTIONS = MITIGATION_EFFECTIVENESS_DESCRIPTIONS;
