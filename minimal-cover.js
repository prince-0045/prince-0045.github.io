// Parse functional dependencies from multiline input, enforcing comma-separated attributes
function parseFunctionalDependencies(fdString) {
    const lines = fdString.split('\n').filter(line => line.trim());
    const fds = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.includes('->')) {
            throw new Error(`Invalid FD format (missing '->'): "${line}"`);
        }
        let [leftSide, rightSide] = line.split('->').map(side => side.trim());

        // Split left side by commas; if no comma, treat entire string as one attribute
        const left = leftSide.includes(',')
            ? leftSide.split(',').map(a => a.trim()).filter(a => a !== '')
            : [leftSide.trim()];

        // Split right side by commas; if no comma, treat entire string as one attribute
        const right = rightSide.includes(',')
            ? rightSide.split(',').map(a => a.trim()).filter(a => a !== '')
            : [rightSide.trim()];

        if (left.length === 0 || right.length === 0) {
            throw new Error(`FD must have attributes on both sides: "${line}"`);
        }

        fds.push({ left, right });
    }

    return fds;
}

// Compute closure of a set of attributes under given FDs
function findClosure(attrs, fds) {
    const closure = new Set(attrs);
    let changed = true;
    while (changed) {
        changed = false;
        for (const fd of fds) {
            if (fd.left.every(a => closure.has(a))) {
                for (const r of fd.right) {
                    if (!closure.has(r)) {
                        closure.add(r);
                        changed = true;
                    }
                }
            }
        }
    }
    return Array.from(closure);
}

// Format a single FD for display
function formatFD(fd) {
    return `{${fd.left.join(', ')}} → {${fd.right.join(', ')}}`;
}

// Format an array of FDs for display
function formatFDs(fds) {
    return fds.map(formatFD).join(', ');
}

// STEP 1: Decompose each FD so that RHS has exactly one attribute
function decomposeFDs(fds) {
    const result = [];
    for (const fd of fds) {
        for (const r of fd.right) {
            result.push({ left: fd.left.slice(), right: [r] });
        }
    }
    return result;
}

// STEP 2: Remove any extraneous attribute from LHS of each FD
function removeRedundantLeftAttrs(fds) {
    const result = fds.map(fd => ({ left: fd.left.slice(), right: fd.right.slice() }));

    for (let i = 0; i < result.length; i++) {
        let fd = result[i];
        if (fd.left.length > 1) {
            for (let j = 0; j < fd.left.length; j++) {
                const testLeft = fd.left.filter((_, idx) => idx !== j);
                const testFDs = result.map((f, idx) =>
                    idx === i
                        ? { left: testLeft.slice(), right: f.right.slice() }
                        : { left: f.left.slice(), right: f.right.slice() }
                );
                const closure = findClosure(testLeft, testFDs);
                if (fd.right.every(attr => closure.includes(attr))) {
                    fd.left = testLeft.slice();
                    result[i] = { left: fd.left.slice(), right: fd.right.slice() };
                    j--;
                }
            }
        }
    }
    return result;
}

// STEP 3: Remove any redundant FD entirely
function removeRedundantFDs(fds) {
    const result = fds.map(fd => ({ left: fd.left.slice(), right: fd.right.slice() }));
    let i = 0;
    while (i < result.length) {
        const fd = result[i];
        const testFDs = result.filter((_, idx) => idx !== i).map(f => ({
            left: f.left.slice(),
            right: f.right.slice()
        }));
        const closure = findClosure(fd.left, testFDs);
        if (fd.right.every(attr => closure.includes(attr))) {
            result.splice(i, 1);
        } else {
            i++;
        }
    }
    return result;
}

// MAIN: Compute minimal cover and log steps
function findMinimalCover(attributes, fds) {
    const steps = [];

    // Step 1
    steps.push('<strong>Step 1: Decompose RHS into single attributes</strong>');
    const step1 = decomposeFDs(fds);
    steps.push(formatFDs(step1));

    // Step 2
    steps.push('<strong>Step 2: Remove extraneous attributes from LHS</strong>');
    const step2 = removeRedundantLeftAttrs(step1);
    steps.push(formatFDs(step2));

    // Step 3
    steps.push('<strong>Step 3: Remove redundant FDs</strong>');
    const step3 = removeRedundantFDs(step2);
    steps.push(formatFDs(step3));

    return { minimalCover: step3, steps };
}

// Handle form submit event
document.getElementById('minimalCoverForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Clear previous results
    document.getElementById('minimalCoverResult').textContent = '';
    document.getElementById('stepsResult').innerHTML = '';

    const attrsRaw = document.getElementById('attributes').value.trim();
    const fdsRaw = document.getElementById('functionalDependencies').value.trim();

    if (!attrsRaw) {
        alert('Please enter at least one attribute (comma-separated).');
        return;
    }
    if (!fdsRaw) {
        alert('Please enter functional dependencies (one per line).');
        return;
    }

    const attributes = attrsRaw.split(',').map(a => a.trim()).filter(a => a);

    try {
        const fds = parseFunctionalDependencies(fdsRaw);
        const { minimalCover, steps } = findMinimalCover(attributes, fds);

        document.getElementById('minimalCoverResult').innerHTML = formatFDs(minimalCover);
        document.getElementById('stepsResult').innerHTML = steps.join('<br><br>');
        document.getElementById('results').style.display = 'block';
    } catch (err) {
        alert(err.message);
        document.getElementById('results').style.display = 'none';
    }
});
