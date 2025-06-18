
// // Parse functional dependencies string input into array of {left:[], right:[]} objects
// function parseFunctionalDependencies(fdString) {
//     const lines = fdString.split('\n').filter(line => line.trim() !== '');
//     const fds = lines.map(line => {
//         if (!line.includes('->')) {
//             throw new Error(`Invalid FD format (missing '->'): "${line}"`);
//         }
//         const [leftStr, rightStr] = line.split('->');
//         // Left side can be concatenated attributes like "AB" or comma-separated "A, B"
//         // So remove commas and spaces and split characters individually
//         // But user may input "A, B" or "AB", so handle both:

//         let left;
//         if (leftStr.includes(',')) {
//             // If commas present, split by commas
//             left = leftStr.split(',').map(s => s.trim()).filter(s => s);
//         } else {
//             // No commas: split each character as attribute
//             left = leftStr.trim().split('').filter(c => c !== ' ');
//         }

//         // For right side: similarly split by commas and trim
//         const right = rightStr.split(',').map(s => s.trim()).filter(s => s);

//         if (left.length === 0 || right.length === 0) {
//             throw new Error(`FD must have attributes on both sides: "${line}"`);
//         }
//         return { left, right };
//     });
//     return fds;
// }

// // Compute closure of given attributes under a set of FDs
// function findClosure(attrs, fds) {
//     const closure = new Set(attrs);
//     let changed = true;
//     while (changed) {
//         changed = false;
//         for (const fd of fds) {
//             if (fd.left.every(a => closure.has(a))) {
//                 for (const r of fd.right) {
//                     if (!closure.has(r)) {
//                         closure.add(r);
//                         changed = true;
//                     }
//                 }
//             }
//         }
//     }
//     return Array.from(closure);
// }

// // Format an FD nicely for output
// function formatFD(fd) {
//     return `{${fd.left.join(', ')}} → {${fd.right.join(', ')}}`;
// }

// function formatFDs(fds) {
//     return fds.map(formatFD).join(', ');
// }

// // Find minimal cover and log steps
// function findMinimalCover(attributes, fds) {
//     let steps = [];
//     let currentFDs = [];

//     // Step 1: Decompose right sides
//     steps.push('Step 1: Decompose right-hand sides:');
//     for (const fd of fds) {
//         for (const r of fd.right) {
//             currentFDs.push({ left: [...fd.left], right: [r] });
//         }
//     }
//     steps.push('After decomposition: ' + formatFDs(currentFDs));

//     // Step 2: Remove redundant attributes from left side
//     steps.push('\nStep 2: Remove redundant attributes from left-hand sides:');
//     for (let i = 0; i < currentFDs.length; i++) {
//         const fd = currentFDs[i];
//         if (fd.left.length > 1) {
//             for (let j = 0; j < fd.left.length; j++) {
//                 const testLeft = fd.left.filter((_, idx) => idx !== j);
//                 const testFDs = currentFDs.map((f, idx) => idx === i ? { left: testLeft, right: fd.right } : f);
//                 const closure = findClosure(testLeft, testFDs);
//                 if (fd.right.every(r => closure.includes(r))) {
//                     steps.push(`Removed attribute '${fd.left[j]}' from left side of ${formatFD(fd)}`);
//                     fd.left = testLeft;
//                     j--; // re-check since left changed
//                 }
//             }
//         }
//     }
//     steps.push('After removing redundant left attributes: ' + formatFDs(currentFDs));

//     // Step 3: Remove redundant FDs
//     steps.push('\nStep 3: Remove redundant functional dependencies:');
//     let i = 0;
//     while (i < currentFDs.length) {
//         const fd = currentFDs[i];
//         const testFDs = currentFDs.filter((_, idx) => idx !== i);
//         const closure = findClosure(fd.left, testFDs);
//         if (fd.right.every(r => closure.includes(r))) {
//             steps.push(`Removed redundant FD: ${formatFD(fd)}`);
//             currentFDs.splice(i, 1);
//         } else {
//             i++;
//         }
//     }
//     steps.push('Final minimal cover: ' + formatFDs(currentFDs));

//     return { minimalCover: currentFDs, steps };
// }

// // Handle form submit event
// document.getElementById('minimalCoverForm').addEventListener('submit', function (e) {
//     e.preventDefault();

//     try {
//         const attrInput = document.getElementById('attributes').value.trim();
//         const fdInput = document.getElementById('functionalDependencies').value.trim();

//         if (!attrInput) throw new Error('Please enter attributes.');
//         if (!fdInput) throw new Error('Please enter functional dependencies.');

//         // Parse attributes: assume comma separated (spaces optional)
//         const attributes = attrInput.split(',').map(a => a.trim()).filter(a => a);

//         // Parse FDs
//         const fds = parseFunctionalDependencies(fdInput);

//         // Find minimal cover
//         const result = findMinimalCover(attributes, fds);

//         // Show results
//         document.getElementById('minimalCoverResult').textContent = result.minimalCover.map(formatFD).join('\n');
//         document.getElementById('stepsResult').innerHTML = result.steps.join('<br>');
//         document.getElementById('results').style.display = 'block';

//     } catch (error) {
//         alert(error.message);
//         document.getElementById('results').style.display = 'none';
//     }
// });
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
