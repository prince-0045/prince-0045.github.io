// Parse functional dependencies input (left and right can be multiple attrs)
function parseFunctionalDependencies(fdString) {
    const lines = fdString.split('\n').filter(line => line.trim());
    return lines.map(line => {
        const arrowIndex = line.indexOf('->');
        if (arrowIndex === -1) {
            throw new Error(`Invalid FD format: "${line}". Must contain '->'`);
        }
        const leftPart = line.slice(0, arrowIndex).trim();
        const rightPart = line.slice(arrowIndex + 2).trim();

        if (!leftPart || !rightPart) {
            throw new Error(`Invalid FD: "${line}". Both sides must have attributes`);
        }

        const left = leftPart.split(',').map(a => a.trim()).filter(a => a);
        const right = rightPart.split(',').map(a => a.trim()).filter(a => a);

        if (left.length === 0 || right.length === 0) {
            throw new Error(`Invalid FD: "${line}". Both sides must have at least one attribute`);
        }

        return { left, right };
    });
}

// Compute attribute closure given attributes and FDs
function attributeClosure(attributes, fds) {
    const closure = new Set(attributes);
    let changed = true;
    const MAX_ITER = 1000;
    let iterations = 0;

    while (changed && iterations < MAX_ITER) {
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

    if (iterations >= MAX_ITER) {
        console.warn('Warning: Closure computation reached max iterations');
    }

    return [...closure];
}

// Check if attrs form a superkey (closure contains all attributes)
function isSuperKey(attrs, allAttrs, fds) {
    const closure = attributeClosure(attrs, fds);
    return allAttrs.every(attr => closure.includes(attr));
}

// Generate all non-empty subsets of attributes sorted by size ascending
function generateSubsets(array) {
    const subsets = [[]];
    for (const element of array) {
        const newSubsets = subsets.map(subset => [...subset, element]);
        subsets.push(...newSubsets);
    }
    return subsets.filter(set => set.length > 0).sort((a, b) => a.length - b.length);
}

// Find all candidate keys (minimal superkeys)
function findCandidateKeys(attributes, fds) {
    const keys = [];
    const subsets = generateSubsets(attributes);

    for (const subset of subsets) {
        if (isSuperKey(subset, attributes, fds)) {
            // check minimality: no proper subset of subset is a superkey
            let minimal = true;
            for (const attr of subset) {
                const smallerSubset = subset.filter(a => a !== attr);
                if (isSuperKey(smallerSubset, attributes, fds)) {
                    minimal = false;
                    break;
                }
            }
            if (minimal) {
                // avoid duplicates
                if (!keys.some(key => key.length === subset.length && key.every(a => subset.includes(a)))) {
                    keys.push(subset);
                }
            }
        }
    }
    return keys;
}

// Check if attribute is prime (part of any candidate key)
function isPrimeAttribute(attr, candidateKeys) {
    return candidateKeys.some(key => key.includes(attr));
}

// Check 2NF: no partial dependency of non-prime attrs on part of candidate key
function is2NF(attributes, fds) {
    const candidateKeys = findCandidateKeys(attributes, fds);
    if (candidateKeys.length === 0) throw new Error('No candidate keys found');

    for (const fd of fds) {
        // Check if fd.left is a proper subset of some candidate key
        const leftIsProperSubsetOfKey = candidateKeys.some(key => {
            return fd.left.length < key.length && fd.left.every(a => key.includes(a));
        });

        if (leftIsProperSubsetOfKey) {
            // If fd.right contains any non-prime attribute, violates 2NF
            if (fd.right.some(attr => !isPrimeAttribute(attr, candidateKeys))) {
                return false;
            }
        }
    }
    return true;
}

// Check 3NF: For all FD X->Y, X is superkey or all Y attrs prime
function is3NF(attributes, fds) {
    const candidateKeys = findCandidateKeys(attributes, fds);
    if (candidateKeys.length === 0) throw new Error('No candidate keys found');

    for (const fd of fds) {
        const leftIsSuperKey = isSuperKey(fd.left, attributes, fds);
        if (!leftIsSuperKey) {
            if (fd.right.some(attr => !isPrimeAttribute(attr, candidateKeys))) {
                return false;
            }
        }
    }
    return true;
}

// Check BCNF: for all FD X->Y, X is superkey
function isBCNF(attributes, fds) {
    for (const fd of fds) {
        if (!isSuperKey(fd.left, attributes, fds)) {
            return false;
        }
    }
    return true;
}

// Project functional dependencies to a subset of attributes (used in decomposition)
function projectFDs(attrs, fds) {
    const projected = [];
    for (const fd of fds) {
        const left = fd.left.filter(a => attrs.includes(a));
        const right = fd.right.filter(a => attrs.includes(a));
        if (left.length > 0 && right.length > 0) {
            projected.push({ left, right });
        }
    }
    return projected;
}

// BCNF Decomposition: returns array of relations {attrs, dependencies}
function decomposeToBCNF(attrs, fds) {
    const result = [];
    const queue = [{ attrs, fds }];

    while (queue.length > 0) {
        const { attrs: relAttrs, fds: relFDs } = queue.shift();
        let violatedFD = null;

        for (const fd of relFDs) {
            if (!isSuperKey(fd.left, relAttrs, relFDs)) {
                violatedFD = fd;
                break;
            }
        }

        if (!violatedFD) {
            result.push({ attrs: relAttrs, dependencies: relFDs });
        } else {
            // Decompose on violating FD
            const closure = attributeClosure(violatedFD.left, relFDs);

            // R1 = closure of left side
            const r1Set = new Set(closure);

            // R2 = (relAttrs - closure) + left side attrs
            const r2Set = new Set(relAttrs.filter(attr => !r1Set.has(attr)));
            violatedFD.left.forEach(attr => r2Set.add(attr));

            const r1 = Array.from(r1Set);
            const r2 = Array.from(r2Set);

            const fds1 = projectFDs(r1, relFDs);
            const fds2 = projectFDs(r2, relFDs);

            queue.push({ attrs: r1, fds: fds1 });
            queue.push({ attrs: r2, fds: fds2 });
        }
    }

    return result.filter(rel => rel.dependencies.length > 0);
}

// Format functional dependencies for HTML display
function formatFDs(fds) {
    if (fds.length === 0) return 'None';
    return fds.map(fd => `{${fd.left.join(', ')}} → {${fd.right.join(', ')}}`).join('<br>');
}

// Handle form submit event
document.getElementById('normalFormForm').addEventListener('submit', function (e) {
    e.preventDefault();
    try {
        const relationName = document.getElementById('relationName').value.trim();
        if (!relationName) throw new Error('Please enter a relation name');

        const attributes = document.getElementById('attributes').value
            .split(',')
            .map(attr => attr.trim())
            .filter(attr => attr);

        if (attributes.length === 0) throw new Error('Please enter at least one attribute');

        const fdString = document.getElementById('functionalDependencies').value.trim();
        if (!fdString) throw new Error('Please enter functional dependencies');

        const fds = parseFunctionalDependencies(fdString);

        // Check Normal Forms
        const isInBCNF = isBCNF(attributes, fds);
        const isIn3NF = is3NF(attributes, fds);
        const isIn2NF = is2NF(attributes, fds);

        let normalForm;
        if (isInBCNF) normalForm = 'BCNF';
        else if (isIn3NF) normalForm = '3NF';
        else if (isIn2NF) normalForm = '2NF';
        else normalForm = '1NF';

        document.getElementById('normalFormResult').innerHTML =
            `The relation <strong>${relationName}</strong> is in <strong>${normalForm}</strong>.`;

        // Show candidate keys for clarity
        const candidateKeys = findCandidateKeys(attributes, fds);
        const keysHtml = candidateKeys.length > 0
            ? 'Candidate Key(s): ' + candidateKeys.map(key => `{${key.join(', ')}}`).join(', ')
            : 'No candidate keys found.';
        document.getElementById('remainingFDs').innerHTML = formatFDs(fds);
        document.getElementById('candidateKeysDisplay')?.remove(); // remove if exists

        const resultsDiv = document.getElementById('results');
        // Insert candidate keys above remainingFDs (if not present)
        if (!document.getElementById('candidateKeysDisplay')) {
            const div = document.createElement('div');
            div.id = 'candidateKeysDisplay';
            div.className = 'result-box';
            div.innerHTML = `<h4 class="h6 mb-2">Candidate Keys:</h4><div class="result-content">${keysHtml}</div>`;
            resultsDiv.insertBefore(div, document.getElementById('remainingFDs').parentElement);
        } else {
            document.getElementById('candidateKeysDisplay').querySelector('.result-content').innerHTML = keysHtml;
        }

        // Show BCNF Decomposition
        const bcnfDecomposition = decomposeToBCNF(attributes, fds);
        let html = '';
        bcnfDecomposition.forEach((rel, index) => {
            html += `<p><strong>R${index + 1}:</strong> {${rel.attrs.join(', ')}}<br>`;
            html += `<span class="ms-3">FDs: ${formatFDs(rel.dependencies)}</span></p>`;
        });
        document.getElementById('bcnfDecomposition').innerHTML = html;

        resultsDiv.style.display = 'block';
    } catch (error) {
        alert(error.message);
        console.error(error);
    }
});
