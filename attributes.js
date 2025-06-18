// document.addEventListener('DOMContentLoaded', () => {
//     // Function to parse functional dependencies
//     function parseFunctionalDependencies(fdString) {
//         try {
//             const lines = fdString.split('\n').filter(line => line.trim());
//             return lines.map(line => {
//                 if (!line.includes('->')) {
//                     throw new Error(`Invalid FD format: ${line}. Must contain '->'`);
//                 }
//                 const [left, right] = line.split('->').map(side => side.trim());
//                 const leftAttrs = left.split(',').map(attr => attr.trim()).filter(attr => attr);
//                 const rightAttrs = right.split(',').map(attr => attr.trim()).filter(attr => attr);
                
//                 if (leftAttrs.length === 0 || rightAttrs.length === 0) {
//                     throw new Error(`Invalid FD: ${line}. Both sides must have attributes`);
//                 }
                
//                 return {
//                     left: leftAttrs,
//                     right: rightAttrs
//                 };
//             });
//         } catch (error) {
//             console.error('Error parsing FDs:', error);
//             throw error;
//         }
//     }

//     // Function to find closure of a set of attributes
//     function findClosure(attributes, fds) {
//         if (!Array.isArray(attributes) || !Array.isArray(fds)) {
//             throw new Error('Invalid input: attributes and fds must be arrays');
//         }

//         let closure = new Set(attributes);
//         let changed = true;
//         let iterations = 0;
//         const MAX_ITERATIONS = 1000; // Prevent infinite loops

//         while (changed && iterations < MAX_ITERATIONS) {
//             changed = false;
//             for (const fd of fds) {
//                 if (fd.left.every(attr => closure.has(attr))) {
//                     for (const attr of fd.right) {
//                         if (!closure.has(attr)) {
//                             closure.add(attr);
//                             changed = true;
//                         }
//                     }
//                 }
//             }
//             iterations++;
//         }

//         if (iterations >= MAX_ITERATIONS) {
//             console.warn('Closure computation reached maximum iterations');
//         }

//         return Array.from(closure);
//     }

//     // Function to find candidate keys
//     function findCandidateKeys(attributes, fds) {
//         if (!Array.isArray(attributes) || !Array.isArray(fds)) {
//             throw new Error('Invalid input: attributes and fds must be arrays');
//         }

//         const candidateKeys = [];

//         // Helper to check if attrs is a superkey
//         function isSuperkey(attrs) {
//             const closure = findClosure(attrs, fds);
//             return attributes.every(attr => closure.includes(attr));
//         }

//         // Helper to check minimality
//         function isMinimal(attrs) {
//             for (const attr of attrs) {
//                 const subset = attrs.filter(a => a !== attr);
//                 if (isSuperkey(subset)) return false;
//             }
//             return true;
//         }

//         // Generate combinations
//         function findCombinations(arr, k) {
//             if (k === 0) return [[]];
//             if (arr.length === 0) return [];

//             const [first, ...rest] = arr;
//             const withFirst = findCombinations(rest, k - 1).map(combo => [first, ...combo]);
//             const withoutFirst = findCombinations(rest, k);
//             return [...withFirst, ...withoutFirst];
//         }

//         // Try all possible combinations of attributes
//         for (let size = 1; size <= attributes.length; size++) {
//             const combos = findCombinations(attributes, size);
//             for (const combo of combos) {
//                 if (isSuperkey(combo) && isMinimal(combo)) {
//                     candidateKeys.push(combo);
//                 }
//             }
//         }

//         if (candidateKeys.length === 0) {
//             throw new Error('No candidate keys found');
//         }

//         return candidateKeys;
//     }

//     // Function to find superkeys
//     function findSuperkeys(attributes, fds) {
//         if (!Array.isArray(attributes) || !Array.isArray(fds)) {
//             throw new Error('Invalid input: attributes and fds must be arrays');
//         }

//         const superkeys = [];
//         const candidateKeys = findCandidateKeys(attributes, fds);

//         function isSuperkey(attrs) {
//             const closure = findClosure(attrs, fds);
//             return attributes.every(attr => closure.includes(attr));
//         }

//         function findCombinations(arr, k) {
//             if (k === 0) return [[]];
//             if (arr.length === 0) return [];

//             const [first, ...rest] = arr;
//             const withFirst = findCombinations(rest, k - 1).map(combo => [first, ...combo]);
//             const withoutFirst = findCombinations(rest, k);
//             return [...withFirst, ...withoutFirst];
//         }

//         // Try all possible combinations of attributes
//         for (let size = 1; size <= attributes.length; size++) {
//             const combos = findCombinations(attributes, size);
//             for (const combo of combos) {
//                 if (isSuperkey(combo)) {
//                     superkeys.push(combo);
//                 }
//             }
//         }

//         // Filter out candidate keys from superkeys
//         return superkeys.filter(superkey =>
//             !candidateKeys.some(key =>
//                 key.length === superkey.length &&
//                 key.every(attr => superkey.includes(attr))
//             )
//         );
//     }

//     // Function to find prime and non-prime attributes
//     function findPrimeAttributes(attributes, fds) {
//         if (!Array.isArray(attributes) || !Array.isArray(fds)) {
//             throw new Error('Invalid input: attributes and fds must be arrays');
//         }

//         const candidateKeys = findCandidateKeys(attributes, fds);
//         const primeAttributes = new Set(candidateKeys.flat());
//         const nonPrimeAttributes = attributes.filter(attr => !primeAttributes.has(attr));

//         return {
//             prime: Array.from(primeAttributes),
//             nonPrime: nonPrimeAttributes
//         };
//     }

//     // Form submission handler
//     document.getElementById('attributeForm').addEventListener('submit', function (e) {
//         e.preventDefault();
//         try {
//             const attributes = document.getElementById('attributes').value
//                 .split(',')
//                 .map(attr => attr.trim())
//                 .filter(attr => attr !== "");

//             if (attributes.length === 0) {
//                 throw new Error('Please enter at least one attribute');
//             }

//             const fdString = document.getElementById('functionalDependencies').value;
//             if (!fdString.trim()) {
//                 throw new Error('Please enter functional dependencies');
//             }

//             const fds = parseFunctionalDependencies(fdString);

//             const candidateKeys = findCandidateKeys(attributes, fds);
//             const superkeys = findSuperkeys(attributes, fds);
//             const { prime, nonPrime } = findPrimeAttributes(attributes, fds);

//             document.getElementById('candidateKeys').innerHTML = candidateKeys.map(key =>
//                 `<p>{${key.join(', ')}}</p>`
//             ).join('');

//             document.getElementById('superkeys').innerHTML = superkeys.map(key =>
//                 `<p>{${key.join(', ')}}</p>`
//             ).join('');

//             document.getElementById('primeAttributes').innerHTML = `<p>{${prime.join(', ')}}</p>`;
//             document.getElementById('nonPrimeAttributes').innerHTML = `<p>{${nonPrime.join(', ')}}</p>`;

//             document.getElementById('results').style.display = 'block';

//         } catch (err) {
//             alert(err.message);
//             console.error("Error in attribute analysis:", err);
//         }
//     });
// });

document.addEventListener('DOMContentLoaded', () => {
    function parseFunctionalDependencies(fdString) {
        const lines = fdString.split('\n').filter(line => line.trim());
        return lines.map(line => {
            const [left, right] = line.split('->').map(side => side.trim());
            if (!left || !right) throw new Error(`Invalid FD: "${line}"`);
            return {
                left: left.split(',').map(attr => attr.trim()).filter(Boolean),
                right: right.split(',').map(attr => attr.trim()).filter(Boolean)
            };
        });
    }

    function getClosure(attrSet, fds) {
        const closure = new Set(attrSet);
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

        return closure;
    }

    function isSuperkey(attrSet, fds, allAttributes) {
        const closure = getClosure(attrSet, fds);
        return allAttributes.every(attr => closure.has(attr));
    }

    function arraysEqual(a, b) {
        return a.length === b.length && a.every(val => b.includes(val));
    }

    function findCandidateKeys(attributes, fds) {
        const candidateKeys = [];
        const queue = [[]];

        while (queue.length > 0) {
            const current = queue.shift();

            // Avoid duplicates
            if (candidateKeys.some(ck => arraysEqual(ck.sort(), current.slice().sort()))) {
                continue;
            }

            if (isSuperkey(current, fds, attributes)) {
                // Check minimality
                if (!candidateKeys.some(key => key.every(k => current.includes(k)))) {
                    candidateKeys.push(current);
                }
            } else {
                for (const attr of attributes) {
                    if (!current.includes(attr)) {
                        queue.push([...current, attr]);
                    }
                }
            }
        }

        return candidateKeys;
    }

    function findSuperkeys(attributes, fds, candidateKeys) {
        const superkeys = [];
        const queue = [[]];
        const visited = new Set();

        while (queue.length > 0) {
            const current = queue.shift();
            const keyStr = current.slice().sort().join(',');

            if (visited.has(keyStr)) continue;
            visited.add(keyStr);

            if (isSuperkey(current, fds, attributes)) {
                const isCandidate = candidateKeys.some(key =>
                    arraysEqual(key.sort(), current.slice().sort())
                );
                if (!isCandidate) {
                    superkeys.push(current);
                }
            } else {
                for (const attr of attributes) {
                    if (!current.includes(attr)) {
                        queue.push([...current, attr]);
                    }
                }
            }
        }

        return superkeys;
    }

    function findPrimeAttributes(attributes, candidateKeys) {
        const prime = new Set(candidateKeys.flat());
        const nonPrime = attributes.filter(attr => !prime.has(attr));
        return {
            prime: Array.from(prime),
            nonPrime: nonPrime
        };
    }

    document.getElementById('attributeForm').addEventListener('submit', function (e) {
        e.preventDefault();
        try {
            const attributes = document.getElementById('attributes').value
                .split(',').map(attr => attr.trim()).filter(Boolean);

            const fdString = document.getElementById('functionalDependencies').value;
            const fds = parseFunctionalDependencies(fdString);

            const candidateKeys = findCandidateKeys(attributes, fds);
            const superkeys = findSuperkeys(attributes, fds, candidateKeys);
            const { prime, nonPrime } = findPrimeAttributes(attributes, candidateKeys);

            document.getElementById('candidateKeys').innerHTML = candidateKeys.length
                ? candidateKeys.map(key => `<p>{${key.join(', ')}}</p>`).join('')
                : '<p>None</p>';

            document.getElementById('superkeys').innerHTML = superkeys.length
                ? superkeys.map(key => `<p>{${key.join(', ')}}</p>`).join('')
                : '<p>None</p>';

            document.getElementById('primeAttributes').innerHTML =
                `<p>{${prime.join(', ') || 'None'}}</p>`;

            document.getElementById('nonPrimeAttributes').innerHTML =
                `<p>{${nonPrime.join(', ') || 'None'}}</p>`;

            document.getElementById('results').style.display = 'block';

        } catch (err) {
            alert(err.message);
            console.error("Error in attribute analysis:", err);
        }
    });
});
