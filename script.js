// Function to parse functional dependencies
function parseFunctionalDependencies(fdString) {
    const lines = fdString.split('\n').filter(line => line.trim());
    return lines.map(line => {
        const [left, right] = line.split('->').map(side => 
            side.trim().split(',').map(attr => attr.trim())
        );
        return { left, right };
    });
}

// Function to find closure of a set of attributes
function findClosure(attributes, fds) {
    let closure = new Set(attributes);
    let changed = true;

    while (changed) {
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
    }

    return Array.from(closure);
}

// Function to find candidate keys
function findCandidateKeys(attributes, fds) {
    const allAttributes = new Set(attributes);
    const candidateKeys = [];

    // Helper function to check if a set of attributes is a superkey
    function isSuperkey(attrs) {
        const closure = findClosure(attrs, fds);
        return attributes.every(attr => closure.includes(attr));
    }

    // Helper function to check if a set of attributes is minimal
    function isMinimal(attrs) {
        for (const attr of attrs) {
            const subset = Array.from(attrs).filter(a => a !== attr);
            if (isSuperkey(subset)) {
                return false;
            }
        }
        return true;
    }

    // Find all possible combinations of attributes
    function findCombinations(attrs, size) {
        if (size === 0) return [[]];
        if (attrs.length === 0) return [];

        const [first, ...rest] = attrs;
        const withFirst = findCombinations(rest, size - 1).map(combo => [first, ...combo]);
        const withoutFirst = findCombinations(rest, size);

        return [...withFirst, ...withoutFirst];
    }

    // Check all possible combinations
    for (let size = 1; size <= attributes.length; size++) {
        const combinations = findCombinations(attributes, size);
        for (const combo of combinations) {
            if (isSuperkey(combo) && isMinimal(combo)) {
                candidateKeys.push(combo);
            }
        }
    }

    return candidateKeys;
}

// Function to determine normal form
function determineNormalForm(attributes, fds) {
    const candidateKeys = findCandidateKeys(attributes, fds);
    const primeAttributes = new Set(candidateKeys.flat());

    // Check for 1NF (all attributes are atomic)
    // This is assumed to be true as we're working with atomic attributes

    // Check for 2NF
    let is2NF = true;
    for (const fd of fds) {
        if (fd.right.some(attr => !primeAttributes.has(attr))) {
            const isPartialDependency = fd.left.some(attr => 
                !primeAttributes.has(attr) && 
                candidateKeys.some(key => 
                    key.includes(attr) && 
                    !key.every(k => fd.left.includes(k))
                )
            );
            if (isPartialDependency) {
                is2NF = false;
                break;
            }
        }
    }

    // Check for 3NF
    let is3NF = true;
    for (const fd of fds) {
        if (fd.right.some(attr => !primeAttributes.has(attr))) {
            const isTransitiveDependency = !fd.left.some(attr => 
                primeAttributes.has(attr)
            );
            if (isTransitiveDependency) {
                is3NF = false;
                break;
            }
        }
    }

    // Check for BCNF
    let isBCNF = true;
    for (const fd of fds) {
        const isTrivial = fd.right.every(attr => fd.left.includes(attr));
        const isSuperkey = candidateKeys.some(key => 
            key.every(attr => fd.left.includes(attr))
        );
        if (!isTrivial && !isSuperkey) {
            isBCNF = false;
            break;
        }
    }

    if (isBCNF) return "BCNF";
    if (is3NF) return "3NF";
    if (is2NF) return "2NF";
    return "1NF";
}

// Function to decompose to BCNF
function decomposeToBCNF(attributes, fds) {
    const decomposition = [];
    const candidateKeys = findCandidateKeys(attributes, fds);
    
    // Helper function to check if a relation is in BCNF
    function isInBCNF(attrs, dependencies) {
        const keys = findCandidateKeys(attrs, dependencies);
        for (const fd of dependencies) {
            const isTrivial = fd.right.every(attr => fd.left.includes(attr));
            const isSuperkey = keys.some(key => 
                key.every(attr => fd.left.includes(attr))
            );
            if (!isTrivial && !isSuperkey) {
                return false;
            }
        }
        return true;
    }

    // Helper function to project FDs onto a set of attributes
    function projectFDs(attrs, dependencies) {
        return dependencies.filter(fd => 
            fd.left.every(attr => attrs.includes(attr)) &&
            fd.right.every(attr => attrs.includes(attr))
        );
    }

    // Decomposition algorithm
    function decompose(attrs, dependencies) {
        if (isInBCNF(attrs, dependencies)) {
            decomposition.push({
                attributes: attrs,
                dependencies: dependencies
            });
            return;
        }

        // Find a violating FD
        for (const fd of dependencies) {
            const isTrivial = fd.right.every(attr => fd.left.includes(attr));
            const isSuperkey = candidateKeys.some(key => 
                key.every(attr => fd.left.includes(attr))
            );
            
            if (!isTrivial && !isSuperkey) {
                // Create two new relations
                const r1 = [...new Set([...fd.left, ...fd.right])];
                const r2 = attrs.filter(attr => 
                    !fd.right.includes(attr) || fd.left.includes(attr)
                );

                // Project FDs onto new relations
                const fds1 = projectFDs(r1, dependencies);
                const fds2 = projectFDs(r2, dependencies);

                // Recursively decompose
                decompose(r1, fds1);
                decompose(r2, fds2);
                return;
            }
        }
    }

    decompose(attributes, fds);
    return decomposition;
}

// Main analysis function
function analyzeNormalization() {
    // Get input values
    const relationName = document.getElementById('relationName').value.trim();
    const attributes = document.getElementById('attributes').value
        .split(',')
        .map(attr => attr.trim())
        .filter(attr => attr);
    const fdString = document.getElementById('functionalDependencies').value;
    const fds = parseFunctionalDependencies(fdString);

    // Validate input
    if (!relationName || attributes.length === 0 || fds.length === 0) {
        alert('Please fill in all fields correctly');
        return;
    }

    // Find candidate keys and prime attributes
    const candidateKeys = findCandidateKeys(attributes, fds);
    const primeAttributes = new Set(candidateKeys.flat());

    // Determine normal form
    const normalForm = determineNormalForm(attributes, fds);

    // Decompose to BCNF
    const bcnfDecomposition = decomposeToBCNF(attributes, fds);

    // Display results
    document.getElementById('primeAttributes').innerHTML = `
        <p><strong>Prime Attributes:</strong> ${Array.from(primeAttributes).join(', ')}</p>
        <p><strong>Candidate Keys:</strong> ${candidateKeys.map(key => `{${key.join(', ')}}`).join(', ')}</p>
    `;

    document.getElementById('normalForm').innerHTML = `
        <p>The relation is in <strong>${normalForm}</strong></p>
    `;

    document.getElementById('bcnfDecomposition').innerHTML = `
        <p><strong>BCNF Decomposition:</strong></p>
        ${bcnfDecomposition.map((rel, index) => `
            <div class="decomposition-item">
                <p>R${index + 1}: {${rel.attributes.join(', ')}}</p>
                <p>FDs: ${rel.dependencies.map(fd => 
                    `{${fd.left.join(', ')}} → {${fd.right.join(', ')}}`
                ).join(', ')}</p>
            </div>
        `).join('')}
    `;
} 