// Function to parse functional dependencies
function parseFunctionalDependencies(fdString) {
    try {
        const lines = fdString.split('\n').filter(line => line.trim());
        return lines.map(line => {
            if (!line.includes('->')) {
                throw new Error(`Invalid FD format: ${line}. Must contain '->'`);
            }
            const [left, right] = line.split('->').map(side => 
                side.trim().split(',').map(attr => attr.trim()).filter(attr => attr)
            );
            if (left.length === 0 || right.length === 0) {
                throw new Error(`Invalid FD: ${line}. Both sides must have attributes`);
            }
            return { left, right };
        });
    } catch (error) {
        console.error('Error parsing FDs:', error);
        throw error;
    }
}

// Function to find closure of a set of attributes
function findClosure(attributes, fds) {
    if (!Array.isArray(attributes) || !Array.isArray(fds)) {
        throw new Error('Invalid input: attributes and fds must be arrays');
    }

    let closure = new Set(attributes);
    let changed = true;
    let iterations = 0;
    const MAX_ITERATIONS = 1000; // Prevent infinite loops

    while (changed && iterations < MAX_ITERATIONS) {
        changed = false;
        for (const fd of fds) {
            if (fd.left.every(attr => closure.has(attr))) {
                for (const attr of fd.right) {
                    if (!closure.has(attr)) {
                        closure.add(attr);
                        changed = true;
                    }
                }
            }
        }
        iterations++;
    }

    if (iterations >= MAX_ITERATIONS) {
        console.warn('Closure computation reached maximum iterations');
    }

    return Array.from(closure);
}

// Function to check if one set of FDs implies another
function impliesFDs(fds1, fds2, allAttributes) {
    if (!Array.isArray(fds1) || !Array.isArray(fds2) || !Array.isArray(allAttributes)) {
        throw new Error('Invalid input: all parameters must be arrays');
    }

    // First, find all implied FDs from fds1
    const impliedFDs = [];
    for (const fd1 of fds1) {
        impliedFDs.push(fd1);
        // Find closure of left side
        const closure = findClosure(fd1.left, fds1);
        // Add all possible combinations of attributes in closure
        for (const attr of closure) {
            if (!fd1.left.includes(attr)) {
                impliedFDs.push({
                    left: fd1.left,
                    right: [attr]
                });
            }
        }
    }

    // Check if all FDs in fds2 are implied by fds1
    for (const fd2 of fds2) {
        let isImplied = false;
        for (const implied of impliedFDs) {
            if (implied.left.every(attr => fd2.left.includes(attr)) &&
                fd2.right.every(attr => implied.right.includes(attr))) {
                isImplied = true;
                break;
            }
        }
        if (!isImplied) {
            return false;
        }
    }
    return true;
}

// Function to check if two sets of FDs are equivalent
function areFDsEquivalent(fds1, fds2, allAttributes) {
    if (!Array.isArray(fds1) || !Array.isArray(fds2) || !Array.isArray(allAttributes)) {
        throw new Error('Invalid input: all parameters must be arrays');
    }

    return impliesFDs(fds1, fds2, allAttributes) && 
           impliesFDs(fds2, fds1, allAttributes);
}

// Function to find missing dependencies
function findMissingDependencies(fds1, fds2, allAttributes) {
    if (!Array.isArray(fds1) || !Array.isArray(fds2) || !Array.isArray(allAttributes)) {
        throw new Error('Invalid input: all parameters must be arrays');
    }

    const missing = {
        from1to2: [],
        from2to1: []
    };

    // Find all implied FDs from fds1
    const impliedFDs1 = [];
    for (const fd1 of fds1) {
        impliedFDs1.push(fd1);
        const closure = findClosure(fd1.left, fds1);
        for (const attr of closure) {
            if (!fd1.left.includes(attr)) {
                impliedFDs1.push({
                    left: fd1.left,
                    right: [attr]
                });
            }
        }
    }

    // Find all implied FDs from fds2
    const impliedFDs2 = [];
    for (const fd2 of fds2) {
        impliedFDs2.push(fd2);
        const closure = findClosure(fd2.left, fds2);
        for (const attr of closure) {
            if (!fd2.left.includes(attr)) {
                impliedFDs2.push({
                    left: fd2.left,
                    right: [attr]
                });
            }
        }
    }

    // Check dependencies in fds1 that are not implied by fds2
    for (const fd1 of fds1) {
        let isImplied = false;
        for (const implied of impliedFDs2) {
            if (implied.left.every(attr => fd1.left.includes(attr)) &&
                fd1.right.every(attr => implied.right.includes(attr))) {
                isImplied = true;
                break;
            }
        }
        if (!isImplied) {
            missing.from1to2.push(fd1);
        }
    }

    // Check dependencies in fds2 that are not implied by fds1
    for (const fd2 of fds2) {
        let isImplied = false;
        for (const implied of impliedFDs1) {
            if (implied.left.every(attr => fd2.left.includes(attr)) &&
                fd2.right.every(attr => implied.right.includes(attr))) {
                isImplied = true;
                break;
            }
        }
        if (!isImplied) {
            missing.from2to1.push(fd2);
        }
    }

    return missing;
}

// Helper function to format a single FD
function formatFD(fd) {
    return `{${fd.left.join(', ')}} → {${fd.right.join(', ')}}`;
}

// Helper function to format multiple FDs
function formatFDs(fds) {
    return fds.map(formatFD).join(', ');
}

// Main form handler
document.getElementById('comparisonForm').addEventListener('submit', function(e) {
    e.preventDefault();

    try {
        // Get input values
        const attributes = document.getElementById('attributes').value
            .split(',')
            .map(attr => attr.trim())
            .filter(attr => attr);

        if (attributes.length === 0) {
            throw new Error('Please enter at least one attribute');
        }

        const fdString1 = document.getElementById('fdSet1').value;
        const fdString2 = document.getElementById('fdSet2').value;

        if (!fdString1.trim() || !fdString2.trim()) {
            throw new Error('Please enter both sets of functional dependencies');
        }

        const fds1 = parseFunctionalDependencies(fdString1);
        const fds2 = parseFunctionalDependencies(fdString2);

        // Check if FDs are equivalent
        const areEquivalent = areFDsEquivalent(fds1, fds2, attributes);

        // Find missing dependencies
        const missing = findMissingDependencies(fds1, fds2, attributes);

        // Display results
        document.getElementById('equivalenceResult').innerHTML = `
            <p>The functional dependencies are <strong>${areEquivalent ? 'equivalent' : 'not equivalent'}</strong></p>
        `;

        document.getElementById('analysisResult').innerHTML = `
            <div class="mb-3">
                <h5>First Set of FDs:</h5>
                <p>${formatFDs(fds1)}</p>
            </div>
            <div class="mb-3">
                <h5>Second Set of FDs:</h5>
                <p>${formatFDs(fds2)}</p>
            </div>
        `;

        document.getElementById('missingFDs').innerHTML = `
            <div class="mb-3">
                <h5>Dependencies in First Set not implied by Second Set:</h5>
                <p>${missing.from1to2.length > 0 ? formatFDs(missing.from1to2) : 'None'}</p>
            </div>
            <div class="mb-3">
                <h5>Dependencies in Second Set not implied by First Set:</h5>
                <p>${missing.from2to1.length > 0 ? formatFDs(missing.from2to1) : 'None'}</p>
            </div>
        `;

        document.getElementById('results').style.display = 'block';
    } catch (error) {
        alert(error.message);
        console.error('Error:', error);
    }
}); 