// Global State
let selectedSpecies = 'poplar';

const speciesData = {
    poplar: {
        name: 'Populus (Hybrid Poplar)',
        desc: 'Populus is our laboratory model: easy to genetically transform, fast-growing (3-5 year rotation), and highly responsive to lignin suppression.',
        baseLignin: 25.0,
        baseCellulose: 42.0,
        baseDensity: 450,
        baseStrength: 50,
        baseHardness: 600,
        baseDurability: 4
    },
    pine: {
        name: 'Pinus radiata (Monterey Pine)',
        desc: 'Pinus radiata dominates NA and NZ commercial softwood markets. Moderately fast-growing (15-20 years), highly compatible with densification, but gymnosperm genetics are more complex to edit.',
        baseLignin: 28.0,
        baseCellulose: 45.0,
        baseDensity: 480,
        baseStrength: 65,
        baseHardness: 680,
        baseDurability: 4
    },
    eucalyptus: {
        name: 'Eucalyptus grandis Hybrid',
        desc: 'Eucalyptus offers unmatched raw biomass output in subtropical climates (5-7 year rotation), but inherently high lignin content requires intensive gene suppression.',
        baseLignin: 32.0,
        baseCellulose: 59.0,
        baseDensity: 520,
        baseStrength: 75,
        baseHardness: 1120,
        baseDurability: 3
    }
};

const activeEdits = {
    da1: false,
    fourcl1: false,
    ga20ox: false,
    cesa: false,
    myb221: false,
    max: false
};

// 1. Initial Statistics Count-Up Animation
function animateStats() {
    const stats = [
        { id: 'stat-carbon', start: 0, end: -100, suffix: '%', duration: 1500 },
        { id: 'stat-density', start: 1, end: 2.5, suffix: 'x', duration: 1800, decimal: true },
        { id: 'stat-strength', start: 1, end: 10, suffix: 'x', duration: 1600 },
        { id: 'stat-lifespan', start: 0, end: 300, suffix: '+ Years', duration: 2000 }
    ];

    stats.forEach(stat => {
        const el = document.getElementById(stat.id);
        if (!el) return;

        let startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / stat.duration, 1);
            let value = stat.start + progress * (stat.end - stat.start);
            
            if (stat.decimal) {
                el.innerText = value.toFixed(1) + stat.suffix;
            } else {
                el.innerText = Math.round(value) + stat.suffix;
            }

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        }
        window.requestAnimationFrame(step);
    });
}

// 2. CRISPR Gene Lab Interactive Widget
function selectSpecies(speciesKey) {
    selectedSpecies = speciesKey;
    
    // Update tabs active state
    const tabs = document.querySelectorAll('.species-tab');
    tabs.forEach(tab => {
        const isCurrent = tab.getAttribute('onclick').includes(speciesKey);
        tab.classList.toggle('active', isCurrent);
    });
    
    // Update Description
    document.getElementById('species-description').innerText = speciesData[speciesKey].desc;
    
    // Recalculate Metrics
    calculateGenetics();
}

function toggleGene(geneId) {
    activeEdits[geneId] = !activeEdits[geneId];
    
    // Toggle active class on card
    const card = document.querySelector(`[data-gene="${geneId}"]`);
    if (card) {
        card.classList.toggle('active', activeEdits[geneId]);
        const statusBadge = card.querySelector('.gene-status-badge');
        if (statusBadge) {
            statusBadge.innerText = activeEdits[geneId] ? 'CRISPR EDITED' : 'WILD-TYPE';
        }
    }
    
    // Recalculate metrics
    calculateGenetics();
}

function calculateGenetics() {
    const data = speciesData[selectedSpecies];
    
    let lignin = data.baseLignin;
    let cellulose = data.baseCellulose;
    let thickness = 1.0;
    let growth = 1.0;
    
    // Apply genetic modifier algorithms
    if (activeEdits.fourcl1) {
        lignin *= 0.75; // -25% lignin
        cellulose *= 1.1; // Slight cellulose increase compensation
    }
    if (activeEdits.myb221) {
        lignin *= 0.84; // -16% lignin
        cellulose *= 1.08;
    }
    if (activeEdits.cesa) {
        cellulose *= 1.35; // +35% cellulose
        thickness += 0.5; // Thicker walls
    }
    if (activeEdits.da1) {
        growth += 0.4; // +40% cambial yield
        cellulose *= 1.05;
    }
    if (activeEdits.ga20ox) {
        growth += 0.8; // Expressing GA20ox increases growth rate (up to 2x biomass)
        lignin *= 0.95; // Slight reduction in lignin density
    }
    if (activeEdits.max) {
        growth += 0.15; // Straight trunks yield more usable lumber
    }

    // Cap boundaries
    lignin = Math.max(8.0, Math.min(45.0, lignin));
    cellulose = Math.max(30.0, Math.min(85.0, cellulose));
    
    // Update HUD display
    document.getElementById('hud-lignin').innerText = lignin.toFixed(1) + '%';
    document.getElementById('hud-cellulose').innerText = cellulose.toFixed(1) + '%';
    document.getElementById('hud-thickness').innerText = thickness.toFixed(1) + 'x';
    document.getElementById('hud-growth').innerText = growth.toFixed(1) + 'x';
    
    // Visual Canvas changes
    const cellSvg = document.getElementById('cell-svg');
    const isAnyEditActive = Object.values(activeEdits).some(v => v === true);
    
    if (cellSvg) {
        cellSvg.classList.toggle('crispr-active', isAnyEditActive);
        cellSvg.classList.toggle('wall-thickened', activeEdits.cesa);
    }

    // Trigger update on post-processing simulator to inherit CRISPR base stats
    updateSimulator(lignin, cellulose, thickness, growth);
}

// 3. Process Simulator (Thermo-Mechanical Densification)
function updateSimulator(crisprLignin = null, crisprCellulose = null, crisprThickness = null, crisprGrowth = null) {
    // If not supplied, get calculated metrics from current HTML/state
    if (crisprLignin === null) {
        const ligText = document.getElementById('hud-lignin').innerText;
        crisprLignin = parseFloat(ligText) || 25.0;
    }
    if (crisprCellulose === null) {
        const cellText = document.getElementById('hud-cellulose').innerText;
        crisprCellulose = parseFloat(cellText) || 42.0;
    }
    if (crisprThickness === null) {
        const thickText = document.getElementById('hud-thickness').innerText;
        crisprThickness = parseFloat(thickText) || 1.0;
    }

    const tempSlider = document.getElementById('temp-slider');
    const pressSlider = document.getElementById('press-slider');
    
    if (!tempSlider || !pressSlider) return;

    const temp = parseInt(tempSlider.value);
    const press = parseFloat(pressSlider.value);
    
    // Update labels
    document.getElementById('temp-val').innerText = temp + ' °C';
    document.getElementById('press-val').innerText = press.toFixed(1) + 'x';
    
    // Base stats depending on species and active edits
    let baseDensity = speciesData[selectedSpecies].baseDensity;
    let baseStrength = speciesData[selectedSpecies].baseStrength;
    let baseHardness = speciesData[selectedSpecies].baseHardness;
    
    // CRISPR base modification scaling
    // Thicker walls and more cellulose increase base density/strength
    const crisprModifier = (crisprThickness * 0.7) + (crisprCellulose / 42.0 * 0.3);
    baseDensity *= (1 + (crisprThickness - 1) * 0.3);
    baseStrength *= crisprModifier;
    baseHardness *= (1 + (crisprThickness - 1) * 0.4);

    // Apply Process simulator formulas
    
    // 1. Density scales linearly with compression
    let density = baseDensity * press;
    
    // 2. Strength (MOR) scales with compression but is affected by heat treatment
    // Mild heat treatment increases structural stability, but high heat weakens wood fibers
    let tempStrengthFactor = 1.0;
    if (temp > 180) {
        // Linear drop from 1.0 at 180C to 0.7 at 250C
        tempStrengthFactor = 1.0 - ((temp - 180) / 70) * 0.3;
    } else if (temp > 150) {
        // Slight strengthening factor due to lignin cross-linking at moderate temp
        tempStrengthFactor = 1.0 + ((temp - 150) / 30) * 0.05;
    }
    
    // Low lignin wood compresses more easily. CCR/4CL knockouts make wood more compressible
    // If lignin is suppressed, compaction increases strength yield
    const compressibilityBonus = 1 + (25.0 - crisprLignin) / 25.0 * 0.15;
    let strength = baseStrength * press * tempStrengthFactor * compressibilityBonus;
    
    // 3. Janka Hardness grows exponentially with densification
    let hardness = baseHardness * Math.pow(press, 1.8);
    
    // 4. Durability Class is determined by thermal modification
    let durabilityClass = 'Class 4 (Low)';
    if (temp >= 220) {
        durabilityClass = 'Class 1 (Very Durable)';
    } else if (temp >= 190) {
        durabilityClass = 'Class 2 (Durable)';
    } else if (temp >= 165) {
        durabilityClass = 'Class 3 (Moderate)';
    } else {
        durabilityClass = 'Class 4 (Low)';
        // Default species baseline override
        if (selectedSpecies === 'eucalyptus') {
            durabilityClass = 'Class 3 (Moderate)';
        }
    }

    // Cap maximum value limits
    density = Math.round(Math.min(1250, density));
    strength = Math.round(Math.min(160, strength));
    hardness = Math.round(Math.min(7500, hardness));
    
    // Update Simulator Outputs
    document.getElementById('sim-density').innerText = density + ' kg/m³';
    document.getElementById('sim-strength').innerText = strength + ' MPa';
    document.getElementById('sim-hardness').innerText = Math.round(hardness) + ' lbf';
    document.getElementById('sim-durability').innerText = durabilityClass;
    
    // Physical Micro-Animations
    
    // A. Animate Piston positions and Sample height
    const sample = document.getElementById('wood-sample');
    const pistonTop = document.getElementById('piston-top');
    const pistonBottom = document.getElementById('piston-bottom');
    
    if (sample && pistonTop && pistonBottom) {
        // Shrink height of sample
        const heightPercent = 100 / press;
        sample.style.height = (heightPercent * 1.8) + 'px';
        
        // Push pistons closer together
        const offset = (1 - (1 / press)) * 40;
        pistonTop.style.transform = `translateY(${offset}px)`;
        pistonBottom.style.transform = `translateY(${-offset}px)`;
        
        // Compress background color (darker/denser as compressed)
        const opacity = 0.5 + (press - 1) / 3 * 0.5;
        sample.style.background = `rgba(35, 22, 16, ${opacity})`;
    }
    
    // B. Deform SVG wood cells inside the sample
    const cells = document.querySelectorAll('.deform-cell');
    cells.forEach(cell => {
        // Flatten cell circles into horizontal ellipses as compressed
        const baseRadius = 30;
        const rx = baseRadius + (press - 1) * 7;
        const ry = baseRadius / Math.pow(press, 0.9);
        cell.setAttribute('rx', rx);
        cell.setAttribute('ry', ry);
        
        // Darken cell stroke line as it compresses
        cell.style.stroke = `rgba(245, 158, 11, ${0.15 + (press - 1) * 0.15})`;
    });
    
    // C. Update Chamber Status Text
    const statusText = document.getElementById('chamber-status-text');
    if (statusText) {
        if (temp > 210 && press > 3.0) {
            statusText.innerText = 'CHAMBER: ULTRA-DENSE CONSOLIDATION';
            statusText.style.color = '#ef4444';
        } else if (temp > 180) {
            statusText.innerText = 'CHAMBER: THERMO-REACTIVE LOCK';
            statusText.style.color = 'var(--color-amber-neon)';
        } else {
            statusText.innerText = 'CHAMBER: COMPRESSION STABLE';
            statusText.style.color = 'var(--color-green-neon)';
        }
    }
    
    // D. Glow Indicator for Chamber temperature
    const glow = document.getElementById('temp-indicator-glow');
    if (glow) {
        const heatPercent = (temp - 150) / 100;
        glow.style.background = `linear-gradient(to right, transparent, rgba(239, 68, 68, ${heatPercent * 0.6}), transparent)`;
    }
}

// 4. Material Performance Lab Chart Toggle
const chartData = {
    strength: {
        title: 'Strength-to-Weight Ratio',
        desc: 'Strength-to-weight ratio calculates mechanical bending strength (MOR) divided by density. Densified CRISPR Poplar matches steel structural output at 1/5th the weight.',
        steel: { val: 70, label: '70' },
        concrete: { val: 25, label: '25' },
        softwood: { val: 50, label: '50' },
        engineered: { val: 95, label: '95' }
    },
    carbon: {
        title: 'Net Embodied Carbon Footprint',
        desc: 'Net carbon emissions generated (or captured) during manufacture, in kg CO₂ equivalent per cubic meter. Negative values indicate active carbon storage.',
        steel: { val: 90, label: '+1,800 kg' }, // Normalized for positive bar width
        concrete: { val: 50, label: '+400 kg' },
        softwood: { val: 25, label: '-600 kg' }, // Visual representations for relative scale
        engineered: { val: 5, label: '-1,100 kg' } // Negatives are represented with minimal widths / offset styles
    },
    energy: {
        title: 'Embodied Energy (MJ / kg)',
        desc: 'The total energy required to extract, process, and transport the material. Engineered wood consumes minimal energy compared to high-heat smelting of metals.',
        steel: { val: 88, label: '32.0' },
        concrete: { val: 12, label: '1.3' },
        softwood: { val: 8, label: '1.0' },
        engineered: { val: 15, label: '1.8' }
    }
};

function setChartMetric(metricKey) {
    const activeData = chartData[metricKey];
    
    // Update metric buttons active state
    const buttons = document.querySelectorAll('.metric-btn');
    buttons.forEach(btn => {
        const isCurrent = btn.getAttribute('onclick').includes(metricKey);
        btn.classList.toggle('active', isCurrent);
    });
    
    // Transition bar widths and labels
    const barSteel = document.getElementById('bar-steel');
    const barConcrete = document.getElementById('bar-concrete');
    const barSoftwood = document.getElementById('bar-softwood');
    const barEngineered = document.getElementById('bar-engineered');
    
    if (barSteel && barConcrete && barSoftwood && barEngineered) {
        barSteel.style.width = activeData.steel.val + '%';
        barConcrete.style.width = activeData.concrete.val + '%';
        barSoftwood.style.width = activeData.softwood.val + '%';
        barEngineered.style.width = activeData.engineered.val + '%';
        
        document.getElementById('val-steel').innerText = activeData.steel.label;
        document.getElementById('val-concrete').innerText = activeData.concrete.label;
        document.getElementById('val-softwood').innerText = activeData.softwood.label;
        document.getElementById('val-engineered').innerText = activeData.engineered.label;
    }
    
    // Update footnote description and title
    document.querySelector('.chart-title').innerText = activeData.title;
    document.getElementById('chart-description').innerText = activeData.desc;
}

// 5. Technical Specification Database Filtering
function filterDb(category) {
    // Update filter button states
    const buttons = document.querySelectorAll('.db-filter-btn');
    buttons.forEach(btn => {
        const isCurrent = btn.getAttribute('onclick').includes(category);
        btn.classList.toggle('active', isCurrent);
    });

    // Filter table rows
    const rows = document.querySelectorAll('.db-row');
    rows.forEach(row => {
        if (category === 'all') {
            row.style.display = 'table-row';
        } else {
            const pathway = row.getAttribute('data-pathway');
            if (pathway === category) {
                row.style.display = 'table-row';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

// 6. Scroll reveal animations
function initScrollReveal() {
    const reveals = document.querySelectorAll('.card-glass, .comparison-card, .timeline-item, .db-table-container, .lab-card');
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        revealObserver.observe(element);
    });
}

// Global Setup on Load
window.addEventListener('DOMContentLoaded', () => {
    // Run stat counters
    animateStats();
    
    // Initialize Genetics base UI states
    calculateGenetics();
    
    // Initialize Simulator base UI states
    updateSimulator();
    
    // Set default chart values (strength)
    setChartMetric('strength');
    
    // Init Scroll observer reveals
    initScrollReveal();
});
